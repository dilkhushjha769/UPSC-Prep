/**
 * caSummarizer.ts
 *
 * 3-Stage Grounded UPSC Current Affairs AI Pipeline:
 * 1. Triage (LLM A, temp 0): UPSC relevance 0-100, GS paper, topic tags, primary_entity, event_type.
 * 2. Summary (LLM B, temp 0.2): Grounded structured UPSC summary (headline <= 90 chars, never truncated mid-phrase,
 *    why_in_news, 3-5 key_facts, static_link, prelims_angle, mains_angle, practice_mcq).
 * 3. Verifier (LLM C, temp 0): Claim-by-claim grounding check against source text + headline completeness check.
 *    If Verifier fails, regenerates once; if it fails again, routes to quarantine/needs_review.
 */

export const PROMPT_VERSION = '2026-11-09.v3';

export const TRIAGE_SYSTEM_PROMPT = `You are a senior UPSC Civil Services Examination faculty member with 15 years of experience setting and evaluating Prelims and Mains questions.

Task: decide whether a news item is useful for UPSC CSE preparation.

Rules:
- Judge ONLY from the text provided. Do not use outside knowledge to add facts.
- Relevant: government policy, schemes, Bills/Acts, constitutional matters, Supreme Court/High Court judgments of public importance, RBI/monetary/fiscal decisions, international relations and treaties, environment and biodiversity, science & technology milestones, major official reports/indices, defence & internal security, heritage/culture notifications.
- NOT relevant (score 0-30): crime reports, local politics, election rallies, party statements, celebrity/entertainment, sports results, stock tips, routine appointments, obituaries without institutional importance, opinion pieces with no policy/constitutional anchor.
- Return valid JSON only, matching the schema.`;

export const SUMMARY_SYSTEM_PROMPT = `You are a UPSC CSE Current Affairs editor writing for aspirants preparing for Prelims, Mains and Interview.

Non-negotiable grounding rules:
1. Every fact, number, date, percentage, rupee amount, person, institution, Act, Article or quote in your output MUST appear in the SOURCE TEXT below, OR in the "static_link" field clearly marked as static syllabus knowledge.
2. If the source text does not state a figure, date or detail, do NOT invent it or fill it from memory. Omit it.
3. Headline: state what happened ("Cabinet approves...", "SC holds...", "RBI revises..."). Complete sentence, 60-90 characters, never cut off mid-word or mid-phrase, never end on a preposition or conjunction ("and", "or", "the", "to", "in", "of", "for", "with", "under", "from", "by", "at", "on", "as", "a", "an").
4. Do not copy full sentences verbatim from newspaper articles. Paraphrase in clear, neutral exam language. Short quotes (<= 10 words) allowed with attribution.
5. Separate what happened (from the article) from static syllabus background (your teaching note).
6. Return valid JSON only.`;

export const VERIFIER_SYSTEM_PROMPT = `You are a strict fact-checker for UPSC study material.

Compare the DRAFT SUMMARY against the SOURCE TEXT.
Flag ANY of the following in "why_in_news" or "key_facts":
1. A number, percentage, amount, rank or date that does not appear in the source text.
2. A person, ministry, body, scheme or country not mentioned in the source text.
3. A claim that contradicts or exaggerates the source text.
4. A headline that is cut off mid-phrase, ends on a conjunction/preposition ("and", "or", "the", "to", "in", "of", "for", "with", "under", "from", "by"), or is a generic label instead of an event.

Note: "static_link", "prelims_angle" and "mains_angle" are allowed to reference standard UPSC syllabus concepts (Constitutional Articles, standard definitions) as long as they don't invent news facts.

Return valid JSON only.`;

export interface TriageOutput {
  upsc_relevant: boolean;
  relevance_score: number;
  reason: string;
  gs_paper: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'NONE';
  module_slug:
    | 'polity-governance'
    | 'international-affairs'
    | 'economy-environment-science'
    | 'reports-schemes-data'
    | 'editorials-explainers'
    | 'none';
  subject_group: string;
  topic_tags: string[];
  primary_entity: string | null;
  secondary_entities: string[];
  is_hero_candidate: boolean;
  event_type:
    | 'scheme'
    | 'judgment'
    | 'bill_act'
    | 'report_index'
    | 'treaty_summit'
    | 'rbi_fiscal'
    | 'scitech'
    | 'environment'
    | 'editorial'
    | 'other'
    | 'irrelevant';
}

export interface GroundedSummaryOutput {
  headline: string;
  why_in_news: string;
  key_facts: { fact: string; source_support: string }[];
  static_link: {
    syllabus_topic: string;
    background: string;
    constitutional_or_statutory_hook: string | null;
  };
  prelims_angle: {
    focus_points: string[];
    possible_trap: string;
  };
  mains_angle: {
    analytical_dimensions: string[];
    practice_question: string;
  };
  practice_mcq: {
    question: string;
    options: [string, string, string, string];
    correct_index: 0 | 1 | 2 | 3;
    explanation: string;
  };
}

export interface VerifierOutput {
  pass: boolean;
  headline_ok: boolean;
  unsupported_claims: string[];
  fix_instructions: string;
}

const DANGLING_END_WORDS = new Set([
  'and',
  'or',
  'the',
  'to',
  'in',
  'of',
  'for',
  'with',
  'under',
  'from',
  'by',
  'at',
  'on',
  'as',
  'a',
  'an',
  'into',
  'over',
  'between',
  'through',
  'during',
  'toward',
  'towards',
  'against',
  'among',
  'within',
  'without',
  'via',
  'per',
  'amid',
  'after',
  'before',
  '&',
]);

/**
 * Validates that a headline is a complete grammatical phrase, does not end on a dangling
 * conjunction/preposition/article, has balanced parentheses, and is within maxChars.
 */
export function validateHeadlineCompleteness(
  headline: string,
  maxChars = 90
): { ok: boolean; reason?: string } {
  const trimmed = (headline || '').trim();
  if (trimmed.length < 20) {
    return { ok: false, reason: 'Headline is too short (< 20 chars).' };
  }
  if (trimmed.length > maxChars) {
    return { ok: false, reason: `Headline exceeds ${maxChars} characters (${trimmed.length}).` };
  }
  const words = trimmed.replace(/[.,;:!?]+$/, '').split(/\s+/);
  const lastWord = (words[words.length - 1] || '').toLowerCase();
  if (DANGLING_END_WORDS.has(lastWord)) {
    return {
      ok: false,
      reason: `Headline ends on dangling word "${lastWord}": "${trimmed}"`,
    };
  }
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      ok: false,
      reason: `Headline has unbalanced parentheses: "${trimmed}"`,
    };
  }
  return { ok: true };
}

export function buildTriageUserPrompt(item: {
  sourceName: string;
  sourceTier: string;
  publishedAt: string;
  url: string;
  title: string;
  bodyText: string;
}): string {
  return `SOURCE: ${item.sourceName} (tier: ${item.sourceTier})
PUBLISHED_AT_IST: ${item.publishedAt}
URL: ${item.url}
TITLE: ${item.title}
EXCERPT / BODY:
${(item.bodyText || '').slice(0, 4000)}

Return JSON:
{
  "upsc_relevant": boolean,
  "relevance_score": integer (0-100),
  "reason": "1 sentence explaining why",
  "gs_paper": "GS1" | "GS2" | "GS3" | "GS4" | "NONE",
  "module_slug": "polity-governance" | "international-affairs" | "economy-environment-science" | "reports-schemes-data" | "editorials-explainers" | "none",
  "subject_group": "Polity & Governance" | "International Affairs" | "Economy" | "Environment & Ecology" | "Science & Technology" | "Reports, Schemes & Data" | "Editorials & Explainers" | "None",
  "topic_tags": ["up to 4 syllabus tags"],
  "primary_entity": "most specific concrete subject for image search, e.g. 'Reserve Bank of India' or 'Kaziranga National Park' or 'LVM3 rocket', or null",
  "secondary_entities": ["up to 3 more named entities from the text"],
  "is_hero_candidate": boolean,
  "event_type": "scheme" | "judgment" | "bill_act" | "report_index" | "treaty_summit" | "rbi_fiscal" | "scitech" | "environment" | "editorial" | "other" | "irrelevant"
}`;
}

export function buildSummaryUserPrompt(params: {
  sourceName: string;
  url: string;
  publishedAt: string;
  gsPaper: string;
  subjectGroup: string;
  topicTags: string[];
  title: string;
  bodyText: string;
  fixInstructions?: string;
}): string {
  const fixNote = params.fixInstructions
    ? `\nIMPORTANT FIX INSTRUCTIONS FROM FACT-CHECKER:\n${params.fixInstructions}\n`
    : '';
  return `SOURCE: ${params.sourceName}
URL: ${params.url}
PUBLISHED_DATE_IST: ${params.publishedAt}
ASSIGNED_GS_PAPER: ${params.gsPaper}
SUBJECT_GROUP: ${params.subjectGroup}
TOPIC_TAGS: ${params.topicTags.join(', ')}

ORIGINAL_TITLE: ${params.title}

SOURCE_TEXT:
"""
${(params.bodyText || '').slice(0, 6000)}
"""
${fixNote}
Return JSON with this exact shape:
{
  "headline": "Complete event headline, 60-90 chars, never truncated",
  "why_in_news": "2-3 sentences stating the concrete event, who did what, and the immediate context, strictly from SOURCE_TEXT",
  "key_facts": [
    {
      "fact": "One concrete, verifiable point from SOURCE_TEXT (1-2 sentences)",
      "source_support": "Short phrase from SOURCE_TEXT that backs this fact"
    }
  ],
  "static_link": {
    "syllabus_topic": "Exact UPSC GS paper & syllabus line",
    "background": "2-3 sentences of static constitutional / statutory / conceptual background an aspirant must revise alongside this news",
    "constitutional_or_statutory_hook": "e.g. 'Article 280 — Finance Commission' or 'Section 38V, Wildlife (Protection) Act, 1972' or null"
  },
  "prelims_angle": {
    "focus_points": [
      "Specific Prelims-testable point 1 (body/ministry/statute/criteria/location)",
      "Specific Prelims-testable point 2"
    ],
    "possible_trap": "Common confusion examiners test on this topic"
  },
  "mains_angle": {
    "analytical_dimensions": [
      "Dimension 1 (significance / pros)",
      "Dimension 2 (challenges / way forward)"
    ],
    "practice_question": "A 15-mark, 250-word UPSC Mains style question anchored to this event"
  },
  "practice_mcq": {
    "question": "With reference to [topic from source], consider the following statements:\\n1. ...\\n2. ...\\nWhich of the statements given above is/are correct?",
    "options": ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
    "correct_index": 0,
    "explanation": "2-3 sentences explaining why each statement is right or wrong."
  }
}`;
}

export function buildVerifierUserPrompt(sourceText: string, draft: GroundedSummaryOutput): string {
  return `SOURCE_TEXT:
"""
${(sourceText || '').slice(0, 6000)}
"""

DRAFT_SUMMARY:
${JSON.stringify(draft, null, 2)}

Return JSON:
{
  "pass": boolean,
  "headline_ok": boolean,
  "unsupported_claims": ["list every ungrounded fact, number, name or date, or empty array"],
  "fix_instructions": "if pass=false, specific instructions on what to remove or rewrite"
}`;
}

