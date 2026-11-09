/**
 * Topic Suggestion & Discovery Service
 * ----------------------------------------------------------------------------
 * Powers instant autocomplete suggestions while typing, partial-word/synonym/
 * spelling-tolerant matching, and below-bar discovery chips (Popular Topics,
 * Recent Searches, Frequently Practiced, and Weak-Area Recommendations).
 *
 * CRITICAL RULE: Every question count (`totalCount`, `prelimsCount`, `mainsCount`)
 * is dynamically calculated from the actual PYQ repositories via `PYQMatchingService`,
 * never hardcoded.
 */

import { UPSC_PRELIMS_TAXONOMY } from '@/constants/upscTaxonomy';
import {
  PYQMatchingService,
  UPSC_CONCEPT_ONTOLOGY,
  normalizeSearchText,
  PYQExamType,
} from './pyqMatchingService';
import { UserPracticeAnalyticsService } from './userPracticeAnalyticsService';

export interface TopicSuggestionItem {
  id: string;
  title: string;
  subject: string;
  kind: 'concept' | 'topic' | 'subtopic' | 'related';
  totalCount: number;
  prelimsCount: number;
  mainsCount: number;
  relatedConcepts: string[];
  aliases: string[];
  score: number;
}

export interface TopicDiscoveryBundle {
  popularTopics: TopicSuggestionItem[];
  recentSearches: TopicSuggestionItem[];
  frequentlyPracticed: TopicSuggestionItem[];
  weakAreaTopics: {
    topic: string;
    subject: string;
    totalCount: number;
    accuracyPct: number;
    attemptedCount: number;
  }[];
}

interface CatalogCandidate {
  id: string;
  title: string;
  normTitle: string;
  subject: string;
  kind: 'concept' | 'topic' | 'subtopic' | 'related';
  aliases: string[];
  relatedConcepts: string[];
}

// Cache of calculated counts per normalized topic title
const countCache = new Map<
  string,
  { totalCount: number; prelimsCount: number; mainsCount: number }
>();

let catalogCandidatesCache: CatalogCandidate[] | null = null;

function getCountsForTopicTitle(title: string): {
  totalCount: number;
  prelimsCount: number;
  mainsCount: number;
} {
  const norm = normalizeSearchText(title);
  const existing = countCache.get(norm);
  if (existing) return existing;

  const matched = PYQMatchingService.matchQuestionsForTopic(title);
  let prelimsCount = 0;
  let mainsCount = 0;
  for (const m of matched) {
    if (m.examType === 'PRELIMS') prelimsCount++;
    else mainsCount++;
  }

  const entry = {
    totalCount: matched.length,
    prelimsCount,
    mainsCount,
  };
  countCache.set(norm, entry);
  return entry;
}

function buildSuggestionCatalog(): CatalogCandidate[] {
  if (catalogCandidatesCache) return catalogCandidatesCache;

  const map = new Map<string, CatalogCandidate>();

  // 1. Add all curated UPSC Concept Ontology nodes
  for (const node of UPSC_CONCEPT_ONTOLOGY) {
    const normTitle = normalizeSearchText(node.title);
    map.set(normTitle, {
      id: node.id,
      title: node.title,
      normTitle,
      subject: node.subject,
      kind: 'concept',
      aliases: node.aliases.map((a) => normalizeSearchText(a)),
      relatedConcepts: node.relatedConcepts,
    });

    // Also register each relatedConcept as a searchable suggestion candidate if not already present
    for (const rel of node.relatedConcepts) {
      const cleanRel = rel.replace(/\s*\([^)]*\)\s*/g, '').trim();
      const normRel = normalizeSearchText(cleanRel);
      if (normRel.length >= 4 && !map.has(normRel)) {
        map.set(normRel, {
          id: `rel_${normRel.replace(/\s+/g, '_')}`,
          title: cleanRel,
          normTitle: normRel,
          subject: node.subject,
          kind: 'related',
          aliases: [normRel, normalizeSearchText(rel)],
          relatedConcepts: [node.title, ...node.relatedConcepts.filter((r) => r !== rel).slice(0, 3)],
        });
      }
    }
  }

  // 2. Add UPSC Syllabus Taxonomy topics & subtopics
  for (const subject of UPSC_PRELIMS_TAXONOMY) {
    for (const topic of subject.topics) {
      const normTopic = normalizeSearchText(topic.name);
      if (!map.has(normTopic)) {
        map.set(normTopic, {
          id: `tax_topic_${topic.id}`,
          title: topic.name,
          normTitle: normTopic,
          subject: subject.name,
          kind: 'topic',
          aliases: [normTopic],
          relatedConcepts: topic.subtopics.slice(0, 4).map((s) => s.name),
        });
      }

      for (const sub of topic.subtopics) {
        const normSub = normalizeSearchText(sub.name);
        if (!map.has(normSub)) {
          map.set(normSub, {
            id: `tax_sub_${sub.id}`,
            title: sub.name,
            normTitle: normSub,
            subject: subject.name,
            kind: 'subtopic',
            aliases: [normSub, ...sub.keywords.slice(0, 6).map((k) => normalizeSearchText(k))],
            relatedConcepts: [
              topic.name,
              ...topic.subtopics
                .filter((s) => s.id !== sub.id)
                .slice(0, 3)
                .map((s) => s.name),
            ],
          });
        }
      }
    }
  }

  catalogCandidatesCache = Array.from(map.values());
  return catalogCandidatesCache;
}

export class TopicSuggestionService {
  /**
   * Returns real-time calculated question counts for any topic title or query.
   */
  static getQuestionCounts(
    topicOrQuery: string,
    examScope: 'ALL' | PYQExamType = 'ALL'
  ): {
    totalCount: number;
    prelimsCount: number;
    mainsCount: number;
  } {
    const counts = getCountsForTopicTitle(topicOrQuery);
    if (examScope === 'PRELIMS') {
      return {
        totalCount: counts.prelimsCount,
        prelimsCount: counts.prelimsCount,
        mainsCount: counts.mainsCount,
      };
    }
    if (examScope === 'MAINS') {
      return {
        totalCount: counts.mainsCount,
        prelimsCount: counts.prelimsCount,
        mainsCount: counts.mainsCount,
      };
    }
    return counts;
  }

  /**
   * Instant autocomplete suggestions while typing (Google Search style).
   * Strictly matches query prefix or words in title/aliases.
   * Never injects unrelated concepts.
   */
  static getInstantSuggestions(
    rawInput: string,
    options?: {
      limit?: number;
      examScope?: 'ALL' | PYQExamType;
    }
  ): TopicSuggestionItem[] {
    const limit = options?.limit ?? 7;
    const normInput = normalizeSearchText(rawInput);

    if (!normInput || normInput.length < 1) {
      return this.getPopularTopics(limit);
    }

    const inputTokens = normInput.split(/\s+/).filter(Boolean);
    const catalog = buildSuggestionCatalog();
    const scoredCandidates: { candidate: CatalogCandidate; score: number }[] = [];

    for (const cand of catalog) {
      let score = 0;
      const titleWords = cand.normTitle.split(/\s+/);

      // 1. Exact title match (Highest priority)
      if (cand.normTitle === normInput) {
        score = 1000;
      }
      // 2. Title starts with user query (e.g. "judic" -> "judicial review")
      else if (cand.normTitle.startsWith(normInput)) {
        score = 900;
      }
      // 3. Any word in title starts with user query (e.g. "review" -> "judicial review")
      else if (titleWords.some((w) => w.startsWith(normInput))) {
        score = 800;
      }
      // 4. Acronym or alias match (e.g. "dpsp" -> "directive principles", "sc" -> "supreme court")
      else if (cand.aliases.some((a) => a === normInput || a.startsWith(normInput))) {
        score = 750;
      }
      // 5. Title contains the query substring
      else if (cand.normTitle.includes(normInput)) {
        score = 700;
      }
      // 6. Multi-token match: all tokens appear as prefix of words in title or aliases
      else if (inputTokens.length >= 2) {
        const allTokensFound = inputTokens.every(
          (tok) =>
            titleWords.some((tw) => tw.startsWith(tok) || tw.includes(tok)) ||
            cand.aliases.some((al) => al.includes(tok))
        );
        if (allTokensFound) {
          score = 600;
        }
      }

      // STRICT FILTER: If candidate doesn't match what the user typed, ignore it!
      if (score > 0) {
        if (cand.kind === 'concept') score += 10;
        scoredCandidates.push({ candidate: cand, score });
      }
    }

    // Sort by match score DESC
    scoredCandidates.sort((a, b) => b.score - a.score);

    const results: TopicSuggestionItem[] = [];
    const seenTitles = new Set<string>();

    for (const { candidate, score } of scoredCandidates) {
      if (seenTitles.has(candidate.normTitle)) continue;
      const counts = getCountsForTopicTitle(candidate.title);
      if (counts.totalCount === 0) continue;

      seenTitles.add(candidate.normTitle);
      results.push({
        id: candidate.id,
        title: candidate.title,
        subject: candidate.subject,
        kind: candidate.kind,
        totalCount: counts.totalCount,
        prelimsCount: counts.prelimsCount,
        mainsCount: counts.mainsCount,
        relatedConcepts: candidate.relatedConcepts.slice(0, 4),
        aliases: candidate.aliases.slice(0, 4),
        score,
      });

      if (results.length >= limit) break;
    }

    // If no catalog entry found but user typed a query, compute real PYQs for their custom query
    if (results.length === 0 && normInput.length >= 2) {
      const dynamicCounts = getCountsForTopicTitle(rawInput.trim());
      if (dynamicCounts.totalCount > 0) {
        results.push({
          id: `custom_${normInput.replace(/\s+/g, '_')}`,
          title: rawInput.trim(),
          subject: 'All UPSC Subjects',
          kind: 'topic',
          totalCount: dynamicCounts.totalCount,
          prelimsCount: dynamicCounts.prelimsCount,
          mainsCount: dynamicCounts.mainsCount,
          relatedConcepts: [],
          aliases: [normInput],
          score: 80,
        });
      }
    }

    return results;
  }

  /**
   * Returns high-yield Popular UPSC Topics with real calculated PYQ counts.
   */
  static getPopularTopics(limit = 10): TopicSuggestionItem[] {
    const popularConceptIds = [
      'concept_judicial_review',
      'concept_fundamental_rights',
      'concept_parliament',
      'concept_monetary_policy_rbi',
      'concept_biodiversity_protected_areas',
      'concept_climate_change_unfccc',
      'concept_monsoon_climate',
      'concept_buddhism_jainism',
      'concept_basic_structure',
      'concept_federalism',
      'concept_panchayati_raj',
      'concept_biotechnology_genetics',
    ];

    const catalog = buildSuggestionCatalog();
    const items: TopicSuggestionItem[] = [];

    for (const id of popularConceptIds) {
      const cand = catalog.find((c) => c.id === id);
      if (!cand) continue;
      const counts = getCountsForTopicTitle(cand.title);
      if (counts.totalCount === 0) continue;

      items.push({
        id: cand.id,
        title: cand.title,
        subject: cand.subject,
        kind: cand.kind,
        totalCount: counts.totalCount,
        prelimsCount: counts.prelimsCount,
        mainsCount: counts.mainsCount,
        relatedConcepts: cand.relatedConcepts.slice(0, 4),
        aliases: cand.aliases.slice(0, 4),
        score: 95,
      });

      if (items.length >= limit) break;
    }

    return items;
  }

  /**
   * Builds the complete Discovery Bundle displayed below the search bar:
   * - Popular UPSC Topics
   * - Recently Searched Topics
   * - Frequently Practiced Topics
   * - Weak-Area Topics Recommended for Revision
   */
  static async getDiscoveryBundle(): Promise<TopicDiscoveryBundle> {
    const [recentRaw, perfStats] = await Promise.all([
      UserPracticeAnalyticsService.getRecentSearches(6),
      UserPracticeAnalyticsService.getTopicPerformanceStats(),
    ]);

    const popularTopics = this.getPopularTopics(8);

    const recentSearches: TopicSuggestionItem[] = recentRaw
      .map((r, idx) => {
        const counts = getCountsForTopicTitle(r.topic);
        return {
          id: `recent_${idx}_${normalizeSearchText(r.topic)}`,
          title: r.topic,
          subject: r.subject || 'General Studies',
          kind: 'topic' as const,
          totalCount: counts.totalCount || r.totalQuestionsFound,
          prelimsCount: counts.prelimsCount,
          mainsCount: counts.mainsCount,
          relatedConcepts: [],
          aliases: [],
          score: 90,
        };
      })
      .filter((item) => item.totalCount > 0);

    const frequentlyPracticed: TopicSuggestionItem[] = perfStats.frequentlyPracticedTopics
      .map((topicName, idx) => {
        const counts = getCountsForTopicTitle(topicName);
        return {
          id: `freq_${idx}_${normalizeSearchText(topicName)}`,
          title: topicName,
          subject: 'Practiced Topic',
          kind: 'topic' as const,
          totalCount: counts.totalCount,
          prelimsCount: counts.prelimsCount,
          mainsCount: counts.mainsCount,
          relatedConcepts: [],
          aliases: [],
          score: 85,
        };
      })
      .filter((item) => item.totalCount > 0);

    const weakAreaTopics = perfStats.weakTopics.slice(0, 5).map((wt) => ({
      topic: wt.topic,
      subject: wt.subject,
      totalCount: wt.totalQuestions,
      accuracyPct: wt.accuracyPct,
      attemptedCount: wt.attemptedCount,
    }));

    return {
      popularTopics,
      recentSearches,
      frequentlyPracticed,
      weakAreaTopics,
    };
  }
}

