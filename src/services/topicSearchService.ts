/**
 * Topic Search Service
 * ----------------------------------------------------------------------------
 * Orchestrates the Topic Search Results Page:
 * - Retrieves all matching Prelims & Mains PYQs via `PYQMatchingService`
 * - Computes summary metadata (Total, Prelims, Mains, Year Range, Relevant Subjects,
 *   and Related Topics with real question counts)
 * - Applies multi-dimensional filters (Prelims/Mains, Year, Subject, GS Paper,
 *   Difficulty, Question Type, Match Tier) and sorting (Relevance, Latest, Oldest, Difficulty)
 * - Maintains an in-memory LRU cache for instant filter/sort transitions.
 */

import { DifficultyLevel } from '@/types/prelims';
import {
  MatchedPYQItem,
  PYQExamType,
  PYQGSPaper,
  PYQMatchTier,
  PYQQuestionFormat,
  PYQMatchingService,
  normalizeSearchText,
} from './pyqMatchingService';
import { TopicSuggestionService } from './topicSuggestionService';
import { UserPracticeAnalyticsService } from './userPracticeAnalyticsService';

export type TopicSortOption = 'relevance' | 'latest' | 'oldest' | 'difficulty';

export interface TopicSearchFilters {
  examType: 'ALL' | PYQExamType;
  year: 'ALL' | number;
  subject: 'ALL' | string;
  gsPaper: 'ALL' | PYQGSPaper;
  difficulty: 'ALL' | DifficultyLevel;
  questionType: 'ALL' | PYQQuestionFormat;
  matchTier: 'ALL' | PYQMatchTier;
  sortBy: TopicSortOption;
}

export interface RelatedTopicPill {
  title: string;
  totalCount: number;
  prelimsCount: number;
  mainsCount: number;
}

export interface TopicSearchSummaryResult {
  query: string;
  displayTitle: string;
  totalAvailable: number;
  prelimsAvailable: number;
  mainsAvailable: number;
  exactMatchCount: number;
  conceptualMatchCount: number;
  syllabusMatchCount: number;
  yearRange: {
    minYear: number;
    maxYear: number;
    label: string;
  };
  relevantSubjects: string[];
  relatedTopics: RelatedTopicPill[];
  availableFacets: {
    years: number[];
    subjects: string[];
    gsPapers: PYQGSPaper[];
    difficulties: DifficultyLevel[];
    questionTypes: PYQQuestionFormat[];
  };
  /** All matched items before active UI filters */
  allMatchedItems: MatchedPYQItem[];
  /** Filtered and sorted items ready for rendering or launching Practice / Timed mode */
  filteredItems: MatchedPYQItem[];
}

export const DEFAULT_TOPIC_SEARCH_FILTERS: TopicSearchFilters = {
  examType: 'ALL',
  year: 'ALL',
  subject: 'ALL',
  gsPaper: 'ALL',
  difficulty: 'ALL',
  questionType: 'ALL',
  matchTier: 'ALL',
  sortBy: 'relevance',
};

const baseSearchCache = new Map<string, Omit<TopicSearchSummaryResult, 'filteredItems'>>();

const DIFFICULTY_RANK: Record<DifficultyLevel, number> = {
  Hard: 3,
  Medium: 2,
  Easy: 1,
};

export class TopicSearchService {
  /**
   * Perform a full topic search with filters and sorting.
   */
  static searchTopic(
    rawQuery: string,
    partialFilters?: Partial<TopicSearchFilters>,
    recordAnalytics = false
  ): TopicSearchSummaryResult {
    const cleanQuery = (rawQuery || '').trim();
    const normKey = normalizeSearchText(cleanQuery);
    const filters: TopicSearchFilters = {
      ...DEFAULT_TOPIC_SEARCH_FILTERS,
      ...(partialFilters || {}),
    };

    let baseResult = baseSearchCache.get(normKey);

    if (!baseResult) {
      const allMatchedItems = PYQMatchingService.matchQuestionsForTopic(cleanQuery);
      const { primaryConcepts } = PYQMatchingService.resolveConceptNodes(cleanQuery);

      const displayTitle =
        primaryConcepts.length > 0 &&
        normalizeSearchText(primaryConcepts[0].title) === normKey
          ? primaryConcepts[0].title
          : cleanQuery
              .split(/\s+/)
              .map((w) =>
                w.length <= 3 && w === w.toUpperCase()
                  ? w
                  : w.charAt(0).toUpperCase() + w.slice(1)
              )
              .join(' ');

      let prelimsAvailable = 0;
      let mainsAvailable = 0;
      let exactMatchCount = 0;
      let conceptualMatchCount = 0;
      let syllabusMatchCount = 0;
      let minYear = 9999;
      let maxYear = 0;

      const subjectFreq = new Map<string, number>();
      const yearsSet = new Set<number>();
      const gsPapersSet = new Set<PYQGSPaper>();
      const difficultiesSet = new Set<DifficultyLevel>();
      const questionTypesSet = new Set<PYQQuestionFormat>();

      for (const item of allMatchedItems) {
        if (item.examType === 'PRELIMS') prelimsAvailable++;
        else mainsAvailable++;

        if (item.matchTier === 'exact') exactMatchCount++;
        else if (item.matchTier === 'conceptual') conceptualMatchCount++;
        else syllabusMatchCount++;

        if (item.year < minYear) minYear = item.year;
        if (item.year > maxYear) maxYear = item.year;

        yearsSet.add(item.year);
        gsPapersSet.add(item.gsPaper);
        difficultiesSet.add(item.difficulty);
        questionTypesSet.add(item.questionType);

        if (item.subject) {
          subjectFreq.set(item.subject, (subjectFreq.get(item.subject) || 0) + 1);
        }
      }

      const relevantSubjects = Array.from(subjectFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([sub]) => sub);

      const yearRangeLabel =
        allMatchedItems.length === 0
          ? '2016–2026'
          : minYear === maxYear
          ? `${minYear}`
          : `${minYear}–${maxYear}`;

      // Build Related Topics with live calculated counts
      const relatedCandidateNames = new Set<string>();
      for (const concept of primaryConcepts) {
        concept.relatedConcepts.forEach((rc) => {
          const stripped = rc.replace(/\s*\([^)]*\)\s*/g, '').trim();
          if (normalizeSearchText(stripped) !== normKey) {
            relatedCandidateNames.add(stripped);
          }
        });
      }

      // Also pull subtopics from top matched items if needed
      if (relatedCandidateNames.size < 6) {
        for (const item of allMatchedItems.slice(0, 25)) {
          if (
            item.subtopic &&
            normalizeSearchText(item.subtopic) !== normKey &&
            item.subtopic.length <= 42
          ) {
            relatedCandidateNames.add(item.subtopic);
          }
          if (relatedCandidateNames.size >= 8) break;
        }
      }

      const relatedTopics: RelatedTopicPill[] = [];
      for (const relName of relatedCandidateNames) {
        const counts = TopicSuggestionService.getQuestionCounts(relName);
        if (counts.totalCount > 0) {
          relatedTopics.push({
            title: relName,
            totalCount: counts.totalCount,
            prelimsCount: counts.prelimsCount,
            mainsCount: counts.mainsCount,
          });
        }
        if (relatedTopics.length >= 7) break;
      }

      baseResult = {
        query: cleanQuery,
        displayTitle: displayTitle || 'Topic Practice',
        totalAvailable: allMatchedItems.length,
        prelimsAvailable,
        mainsAvailable,
        exactMatchCount,
        conceptualMatchCount,
        syllabusMatchCount,
        yearRange: {
          minYear: allMatchedItems.length > 0 ? minYear : 2016,
          maxYear: allMatchedItems.length > 0 ? maxYear : 2026,
          label: yearRangeLabel,
        },
        relevantSubjects,
        relatedTopics,
        availableFacets: {
          years: Array.from(yearsSet).sort((a, b) => b - a),
          subjects: relevantSubjects,
          gsPapers: Array.from(gsPapersSet),
          difficulties: Array.from(difficultiesSet),
          questionTypes: Array.from(questionTypesSet),
        },
        allMatchedItems,
      };

      if (baseSearchCache.size > 40) {
        const oldestKey = baseSearchCache.keys().next().value;
        if (oldestKey) baseSearchCache.delete(oldestKey);
      }
      baseSearchCache.set(normKey, baseResult);
    }

    if (recordAnalytics && cleanQuery.length >= 2) {
      void UserPracticeAnalyticsService.recordTopicSearch(
        baseResult.displayTitle,
        baseResult.totalAvailable,
        baseResult.relevantSubjects[0]
      );
    }

    // Apply active filters
    const filteredItems = baseResult.allMatchedItems.filter((item) => {
      if (filters.examType !== 'ALL' && item.examType !== filters.examType) return false;
      if (filters.year !== 'ALL' && item.year !== filters.year) return false;
      if (filters.subject !== 'ALL' && item.subject !== filters.subject) return false;
      if (filters.gsPaper !== 'ALL' && item.gsPaper !== filters.gsPaper) return false;
      if (filters.difficulty !== 'ALL' && item.difficulty !== filters.difficulty) return false;
      if (filters.questionType !== 'ALL' && item.questionType !== filters.questionType)
        return false;
      if (filters.matchTier !== 'ALL' && item.matchTier !== filters.matchTier) return false;
      return true;
    });

    // Apply sorting
    filteredItems.sort((a, b) => {
      switch (filters.sortBy) {
        case 'latest':
          if (b.year !== a.year) return b.year - a.year;
          return b.relevanceScore - a.relevanceScore;
        case 'oldest':
          if (a.year !== b.year) return a.year - b.year;
          return b.relevanceScore - a.relevanceScore;
        case 'difficulty': {
          const diffDiff =
            (DIFFICULTY_RANK[b.difficulty] || 2) - (DIFFICULTY_RANK[a.difficulty] || 2);
          if (diffDiff !== 0) return diffDiff;
          return b.relevanceScore - a.relevanceScore;
        }
        case 'relevance':
        default:
          if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
          return b.year - a.year;
      }
    });

    return {
      ...baseResult,
      filteredItems,
    };
  }
}

