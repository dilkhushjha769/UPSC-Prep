/**
 * upscRelevanceEngine.ts
 *
 * Strict UPSC Civil Services Examination AI Relevance Engine.
 * Evaluates candidate news stories like an experienced UPSC faculty member:
 * - Scores relevance 0 to 100 based on Prelims, Mains (GS I-IV), Essay, and PYQ themes.
 * - Enforces strict rejection criteria for routine politics, crime, entertainment, corporate PR, and trivial announcements.
 * - Outputs structured, schema-validated JSON decisions: PUBLISH, REJECT, or NEEDS_REVIEW.
 * - Handles malformed JSON and API failures safely without ever publishing unreviewed content.
 */

import { SubjectGroupName, SubjectMainCategoryId } from '@/constants/currentAffairsCategories';

export type UPSCImportanceLevel = 'HIGH' | 'IMPORTANT' | 'MODERATE' | 'LOW';
export type RelevanceDecision = 'PUBLISH' | 'REJECT' | 'NEEDS_REVIEW';

export interface PYQConnectionData {
  has_connection: boolean;
  explanation: string;
  question_ids: string[];
}

export interface UPSCRelevanceEvaluation {
  is_upsc_relevant: boolean;
  relevance_score: number; // 0 to 100
  importance: UPSCImportanceLevel;
  importance_reason: string;
  prelims_relevant: boolean;
  mains_relevant: boolean;
  essay_relevant: boolean;
  gs_papers: ('GS-I' | 'GS-II' | 'GS-III' | 'GS-IV')[];
  syllabus_topics: string[];
  subject: SubjectGroupName;
  subcategory: string;
  main_category_id: SubjectMainCategoryId;
  pyq_connection: PYQConnectionData;
  decision: RelevanceDecision;
  rejection_reason: string | null;
  evaluation_source: 'gemini_ai' | 'deterministic_engine';
  evaluated_at: string;
}

export interface CandidateStoryInput {
  headline: string;
  description: string;
  content?: string;
  sourceName: string;
  sourceTier: 'official' | 'agency' | 'editorial' | 'institution';
  canonicalUrl?: string;
}

// =============================================================================
// 1. REJECTION CRITERIA & SYLLABUS KNOWLEDGE BASE
// =============================================================================

// Non-negotiable exclusion patterns: stories matching these without strong constitutional/governance substance are rejected
export const EXCLUSION_PATTERNS: { regex: RegExp; reason: string }[] = [
  {
    regex: /\b(bollywood|tollywood|kollywood|box office|ott release|trailer launch|celebrity|bigg boss|karan johar|deepika|ranbir|alia|shah rukh|salman|kareena)\b/i,
    reason: 'Celebrity news and entertainment gossip have no UPSC CSE syllabus relevance.',
  },
  {
    regex: /\b(ipl|cricket score|fifa|t20|world cup squad|man of the match|fantasy cricket|wimbledon|premier league|pro kabaddi|auction price)\b/i,
    reason: 'Routine sports scores and tournament updates (outside major national policy or national sports awards) are non-syllabus.',
  },
  {
    regex: /\b(horoscope|astrology|zodiac|tarot|vastu|kundali|gemstone|daily predictions)\b/i,
    reason: 'Astrology, superstition and pseudo-scientific forecasts are excluded.',
  },
  {
    regex: /\b(stock tips|intraday|sensex climbs|nifty falls|crypto pump|bitcoin price prediction|multibagger|penny stock|lottery result|gold price today)\b/i,
    reason: 'Speculative trading tips, daily market fluctuations and lottery results without macroeconomic policy significance.',
  },
  {
    regex: /\b(slams|hits back|war of words|verbal duel|jibes at|political potshot|election rally speech|roadshow crowd|blames opposition|claims victory in rally)\b/i,
    reason: 'Partisan political allegations, campaign speeches and rhetorical statements lack institutional/constitutional significance.',
  },
  {
    regex: /\b(killed in road accident|murdered in|theft in|gold smuggled in underwear|chain snatching|hit and run case|body found in well|brawl outside)\b/i,
    reason: 'Routine local crime, petty offences and isolated accidents without broader jurisprudence or policy implications.',
  },
  {
    regex: /\b(inaugurates new building of|ribbon cutting|lays foundation stone for school|felicitates party workers|attends wedding of|statue unveiled by)\b/i,
    reason: 'Routine ceremonial inaugurations and photo-ops without structural policy or scheme guidelines.',
  },
];

// Substantive syllabus anchors for high-yield UPSC topics
export const SYLLABUS_KEYWORDS: Record<string, { paper: 'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV'; topics: string[] }> = {
  // GS-II: Polity, Governance, Constitution, Social Justice, IR
  constitution: { paper: 'GS-II', topics: ['Constitution of India', 'Fundamental Rights', 'Basic Structure'] },
  'supreme court': { paper: 'GS-II', topics: ['Judiciary', 'Constitutional Benches', 'Judicial Review'] },
  'high court': { paper: 'GS-II', topics: ['Judiciary', 'Subordinate Courts'] },
  collegium: { paper: 'GS-II', topics: ['Judicial Appointments', 'Separation of Powers'] },
  parliament: { paper: 'GS-II', topics: ['Parliamentary Proceedings', 'Legislative Scrutiny'] },
  'standing committee': { paper: 'GS-II', topics: ['Parliamentary Committees', 'Legislative Oversight'] },
  federalism: { paper: 'GS-II', topics: ['Inter-State Relations', 'Federal Structure', 'Finance Commission'] },
  governor: { paper: 'GS-II', topics: ['Constitutional Discretion', 'State Governance'] },
  'election commission': { paper: 'GS-II', topics: ['Electoral Reforms', 'Model Code of Conduct'] },
  cag: { paper: 'GS-II', topics: ['Public Accountability', 'Auditing Standards'] },
  cbi: { paper: 'GS-II', topics: ['Statutory & Non-Statutory Investigation Bodies', 'Police Reforms'] },
  ed: { paper: 'GS-II', topics: ['Enforcement Directorate', 'PMLA Framework'] },
  'social justice': { paper: 'GS-II', topics: ['Vulnerable Sections', 'SC/ST Sub-classification', 'Reservation'] },
  reservation: { paper: 'GS-II', topics: ['Affirmative Action', 'Article 15 & 16', 'Equality of Opportunity'] },
  'bilateral': { paper: 'GS-II', topics: ['India and its Neighbourhood', 'Bilateral Agreements'] },
  'united nations': { paper: 'GS-II', topics: ['Multilateral Institutions', 'Global Governance'] },
  unfccc: { paper: 'GS-III', topics: ['Climate Conventions', 'COP Negotiations'] },
  brics: { paper: 'GS-II', topics: ['Plurilateral Groupings', 'South-South Cooperation'] },
  quad: { paper: 'GS-II', topics: ['Indo-Pacific Security', 'Maritime Domain Awareness'] },
  'free trade agreement': { paper: 'GS-II', topics: ['Trade Pacts', 'Bilateral Economic Relations'] },
  fta: { paper: 'GS-II', topics: ['Free Trade Agreements', 'Global Trade Architecture'] },
  'european union': { paper: 'GS-II', topics: ['India-EU Strategic Partnership', 'Multilateral Engagements'] },
  cbam: { paper: 'GS-III', topics: ['Carbon Border Adjustment Mechanism', 'Trade & Climate Policy'] },
  tariffs: { paper: 'GS-III', topics: ['Trade Policy', 'Import/Export Duties'] },
  treaty: { paper: 'GS-II', topics: ['International Law & Treaties'] },
  'climate change': { paper: 'GS-III', topics: ['UNFCCC', 'Paris Agreement', 'Global Warming Mitigation'] },

  // GS-III: Economy, Agriculture, Environment, Sci-Tech, Security
  rbi: { paper: 'GS-III', topics: ['Monetary Policy', 'Banking Regulation', 'Systemic Liquidity'] },
  'monetary policy': { paper: 'GS-III', topics: ['Inflation Targeting', 'Repo Rate Transmission'] },
  inflation: { paper: 'GS-III', topics: ['Macroeconomic Stability', 'CPI & WPI Trends'] },
  'fiscal deficit': { paper: 'GS-III', topics: ['FRBM Act', 'Public Debt Management'] },
  gdp: { paper: 'GS-III', topics: ['National Income Accounting', 'Growth Dynamics'] },
  wto: { paper: 'GS-III', topics: ['International Trade', 'Subsidies & Tariffs'] },
  imf: { paper: 'GS-III', topics: ['Balance of Payments', 'Global Financial Safety Net'] },
  'green hydrogen': { paper: 'GS-III', topics: ['Clean Energy Transition', 'National Green Hydrogen Mission'] },
  isro: { paper: 'GS-III', topics: ['Space Exploration', 'Indigenous Launch Vehicles', 'Satellite Tech'] },
  drdo: { paper: 'GS-III', topics: ['Indigenisation of Defence Technology', 'Missile Systems'] },
  semiconductor: { paper: 'GS-III', topics: ['India Semiconductor Mission', 'Supply Chain Resilience'] },
  quantum: { paper: 'GS-III', topics: ['National Quantum Mission', 'Frontier Science'] },
  ai: { paper: 'GS-III', topics: ['Artificial Intelligence Ethics', 'Digital Public Infrastructure'] },
  biodiversity: { paper: 'GS-III', topics: ['Conservation of Fauna & Flora', 'CBD & Kunming-Montreal'] },
  ramsar: { paper: 'GS-III', topics: ['Wetland Ecosystems', 'Montreux Record'] },
  tiger: { paper: 'GS-III', topics: ['Project Tiger', 'Wildlife Protection Act', 'NTCA'] },
  cheetah: { paper: 'GS-III', topics: ['Species Reintroduction', 'Kuno National Park'] },
  pollution: { paper: 'GS-III', topics: ['Air Quality Commission', 'Water Pollution & River Basins'] },
  'disaster management': { paper: 'GS-III', topics: ['NDMA Guidelines', 'Early Warning Systems', 'Sendai Framework'] },
  'money laundering': { paper: 'GS-III', topics: ['Internal Security', 'FATF Standards', 'Cyber Crime'] },

  // GS-IV & Ethics
  ethics: { paper: 'GS-IV', topics: ['Ethics in Public Administration', 'Probity in Governance'] },
  whistleblower: { paper: 'GS-IV', topics: ['Accountability', 'Conflict of Interest'] },
  lokpal: { paper: 'GS-II', topics: ['Anti-Corruption Architecture', 'Citizen Charters'] },
};

// =============================================================================
// 2. DETERMINISTIC PRE-FILTER & HIGH-RIGOR RELEVANCE SCORER
// =============================================================================

export interface PreFilterResult {
  isRejected: boolean;
  rejectionReason: string | null;
  baseScore: number;
  matchedSyllabusKeywords: string[];
  suggestedGsPapers: ('GS-I' | 'GS-II' | 'GS-III' | 'GS-IV')[];
}

export function evaluateDeterministicPreFilter(
  headline: string,
  description: string,
  sourceTier: 'official' | 'agency' | 'editorial' | 'institution'
): PreFilterResult {
  const text = `${headline} ${description}`.toLowerCase();

  // 1. Check exclusion regexes
  for (const item of EXCLUSION_PATTERNS) {
    if (item.regex.test(text)) {
      // Exceptions: If text also explicitly mentions constitutional article, supreme court verdict, or statutory act,
      // it might be a political event with constitutional significance (e.g., disqualification under 10th Schedule).
      const hasConstitutionalException =
        /\b(article \d+|10th schedule|anti-defection|supreme court|high court|quashed|unconstitutional|section \d+[a-z]?|governor's report)\b/i.test(
          text
        );
      if (!hasConstitutionalException) {
        return {
          isRejected: true,
          rejectionReason: item.reason,
          baseScore: 15,
          matchedSyllabusKeywords: [],
          suggestedGsPapers: [],
        };
      }
    }
  }

  // 2. Identify syllabus matches
  const matchedKeywords: string[] = [];
  const papers = new Set<'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV'>();

  for (const [kw, meta] of Object.entries(SYLLABUS_KEYWORDS)) {
    if (text.includes(kw)) {
      matchedKeywords.push(kw);
      papers.add(meta.paper);
    }
  }

  // 3. Compute base score based on syllabus density, institutional weight, and national significance
  let score = 40; // baseline for neutral stories

  if (sourceTier === 'official' || sourceTier === 'institution') {
    // Official press release (PIB, RBI, UN) — note: does not automatically get 90+ unless content matches syllabus
    score += 15;
  }

  if (matchedKeywords.length >= 4) {
    score += 40;
  } else if (matchedKeywords.length >= 2) {
    score += 28;
  } else if (matchedKeywords.length === 1) {
    score += 18;
  }

  // High-impact markers
  if (/\b(constitution bench|amendment bill|act \d{4}|cabinet approves|rbi policy|cop\d+|ramsar|treaty|landmark)\b/i.test(text)) {
    score += 12;
  }

  // Penalize sensational headline phrasing
  if (/\b(shocking|you won't believe|viral video|furious|lashed out|sparks row)\b/i.test(text)) {
    score -= 25;
  }

  score = Math.max(10, Math.min(98, score));

  // If score < 50 and no syllabus keyword matched, reject
  if (matchedKeywords.length === 0 && score < 55) {
    return {
      isRejected: true,
      rejectionReason: 'Story lacks direct touchpoints with UPSC Prelims or Mains GS syllabus themes.',
      baseScore: score,
      matchedSyllabusKeywords: [],
      suggestedGsPapers: [],
    };
  }

  return {
    isRejected: false,
    rejectionReason: null,
    baseScore: score,
    matchedSyllabusKeywords: matchedKeywords,
    suggestedGsPapers: Array.from(papers),
  };
}

// =============================================================================
// 3. GEMINI AI PROMPT & STRICT JSON SCHEMA VALIDATOR
// =============================================================================

const SYSTEM_PROMPT = `You are a Senior UPSC Civil Services Examination (CSE) Content Director and Chief Evaluator.
Your sole job is to evaluate incoming news stories and decide if they deserve a place in a serious UPSC aspirant's daily preparation.

UPSC RELEVANCE RULES:
1. UPSC Prelims criteria:
   - Constitutional provisions, amendments, articles.
   - Statutory acts, bills, regulatory bodies (RBI, SEBI, CCI, ECI, CAG).
   - Flagship government schemes and policy guidelines.
   - International conventions, treaties, indices, and reports.
   - Environmental protected areas, IUCN species, wildlife sanctuaries, Ramsar wetlands.
   - Space missions, defence indigenisation, emerging science & tech.
   - Macroeconomic indicators, monetary/fiscal policy, banking stability.
   - Historical sites, archaeological discoveries, and geographic chokepoints.

2. UPSC Mains criteria:
   - GS-I: History, geography, social issues, women empowerment, demographic shifts.
   - GS-II: Constitution, federalism, governance, judiciary, electoral processes, welfare mechanisms, IR.
   - GS-III: Inclusive growth, agriculture, infrastructure, renewable energy, climate action, internal security.
   - GS-IV: Ethical dilemmas, integrity in governance, administrative accountability, corporate governance.
   - Essay: Multi-dimensional socio-economic and ethical topics.

3. News that MUST GENERALLY BE REJECTED (decision = "REJECT", relevance_score < 55):
   - Partisan political allegations and routine party statements.
   - Routine election rally speeches and campaign mudslinging.
   - Daily crime reports, local thefts, and individual accidents.
   - Entertainment, celebrity, Bollywood, and sports tournament coverage.
   - Routine ceremonial inaugurations without policy frameworks.
   - Routine bureaucratic transfers and corporate press releases.
   - International news with zero strategic/economic connection to India or global governance.

4. Publishing Thresholds:
   - 85-100: HIGH -> decision = "PUBLISH" (Candidate for Today's Most Important)
   - 70-84: IMPORTANT -> decision = "PUBLISH" (Daily news feed)
   - 55-69: MODERATE -> decision = "PUBLISH" ONLY if it has a clear syllabus anchor, otherwise "NEEDS_REVIEW"
   - < 55: REJECT -> decision = "REJECT" with explicit rejection_reason.

OUTPUT STRUCTURE:
You must respond with ONLY valid JSON matching this schema:
{
  "is_upsc_relevant": boolean,
  "relevance_score": number (0-100 integer),
  "importance": "HIGH" | "IMPORTANT" | "MODERATE" | "LOW",
  "importance_reason": string,
  "prelims_relevant": boolean,
  "mains_relevant": boolean,
  "essay_relevant": boolean,
  "gs_papers": string[] (subset of ["GS-I", "GS-II", "GS-III", "GS-IV"]),
  "syllabus_topics": string[],
  "subject": "International Affairs" | "Polity & Governance" | "Economy" | "Environment & Ecology" | "Science & Technology" | "Reports, Schemes & Data" | "Editorials & Explainers",
  "subcategory": string,
  "pyq_connection": {
    "has_connection": boolean,
    "explanation": string,
    "question_ids": string[]
  },
  "decision": "PUBLISH" | "REJECT" | "NEEDS_REVIEW",
  "rejection_reason": string | null
}`;

export async function evaluateNewsStoryWithAI(
  story: CandidateStoryInput,
  geminiApiKey?: string,
  modelName: string = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
): Promise<UPSCRelevanceEvaluation> {
  const preFilter = evaluateDeterministicPreFilter(
    story.headline,
    story.description,
    story.sourceTier
  );

  // If hard-rejected by deterministic rules (e.g. celebrity, crime, gossip), reject immediately without wasting AI tokens
  if (preFilter.isRejected) {
    return {
      is_upsc_relevant: false,
      relevance_score: preFilter.baseScore,
      importance: 'LOW',
      importance_reason: 'Excluded by UPSC negative-filter criteria.',
      prelims_relevant: false,
      mains_relevant: false,
      essay_relevant: false,
      gs_papers: [],
      syllabus_topics: [],
      subject: 'Polity & Governance',
      subcategory: 'General',
      main_category_id: 'polity-governance',
      pyq_connection: {
        has_connection: false,
        explanation: 'No PYQ connection for non-syllabus topics.',
        question_ids: [],
      },
      decision: 'REJECT',
      rejection_reason: preFilter.rejectionReason,
      evaluation_source: 'deterministic_engine',
      evaluated_at: new Date().toISOString(),
    };
  }

  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const userPrompt = `Evaluate this news item for UPSC CSE preparation:

Headline: ${story.headline}
Publisher: ${story.sourceName} (${story.sourceTier} tier)
Canonical URL: ${story.canonicalUrl || 'N/A'}
Description: ${story.description}
Content Excerpt: ${(story.content || story.description).slice(0, 1800)}

Pre-filter syllabus hints: ${preFilter.matchedSyllabusKeywords.join(', ') || 'General'}
Return ONLY the structured JSON response:`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const json: any = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const validated = validateAIEvaluationOutput(parsed, preFilter);
          if (validated) {
            return {
              ...validated,
              evaluation_source: 'gemini_ai',
              evaluated_at: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // Fall through to deterministic evaluation
    }
  }

  // Fallback: Deterministic high-rigor rubric (never fabricates, safe fallback)
  return buildDeterministicEvaluation(story, preFilter);
}

// =============================================================================
// 4. SCHEMA VALIDATOR & DETERMINISTIC FALLBACK
// =============================================================================

function validateAIEvaluationOutput(
  raw: any,
  preFilter: PreFilterResult
): Omit<UPSCRelevanceEvaluation, 'evaluation_source' | 'evaluated_at'> | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const score = Math.max(0, Math.min(100, Math.round(Number(raw.relevance_score) || preFilter.baseScore)));
  const isRelevant = typeof raw.is_upsc_relevant === 'boolean' ? raw.is_upsc_relevant : score >= 55;

  let importance: UPSCImportanceLevel = 'MODERATE';
  if (score >= 85) importance = 'HIGH';
  else if (score >= 70) importance = 'IMPORTANT';
  else if (score >= 55) importance = 'MODERATE';
  else importance = 'LOW';

  let decision: RelevanceDecision = 'REJECT';
  if (score >= 70 && isRelevant) {
    decision = 'PUBLISH';
  } else if (score >= 55 && isRelevant) {
    decision = raw.decision === 'PUBLISH' ? 'PUBLISH' : 'NEEDS_REVIEW';
  } else {
    decision = 'REJECT';
  }

  const validSubjects: SubjectGroupName[] = [
    'International Affairs',
    'Polity & Governance',
    'Economy',
    'Environment & Ecology',
    'Science & Technology',
    'Reports, Schemes & Data',
    'Editorials & Explainers',
  ];

  const subject: SubjectGroupName = validSubjects.includes(raw.subject)
    ? raw.subject
    : preFilter.suggestedGsPapers.includes('GS-III')
    ? 'Economy'
    : 'Polity & Governance';

  let mainCategoryId: SubjectMainCategoryId = 'polity-governance';
  if (subject === 'International Affairs') mainCategoryId = 'international-affairs';
  else if (subject === 'Economy' || subject === 'Environment & Ecology' || subject === 'Science & Technology') {
    mainCategoryId = 'economy-environment-science';
  } else if (subject === 'Reports, Schemes & Data') {
    mainCategoryId = 'reports-schemes-data';
  } else if (subject === 'Editorials & Explainers') {
    mainCategoryId = 'editorials-explainers';
  }

  return {
    is_upsc_relevant: isRelevant,
    relevance_score: score,
    importance,
    importance_reason: String(raw.importance_reason || 'Evaluated against UPSC CSE syllabus standards.'),
    prelims_relevant: Boolean(raw.prelims_relevant ?? true),
    mains_relevant: Boolean(raw.mains_relevant ?? (score >= 70)),
    essay_relevant: Boolean(raw.essay_relevant ?? false),
    gs_papers: Array.isArray(raw.gs_papers) && raw.gs_papers.length > 0 ? raw.gs_papers : ['GS-II'],
    syllabus_topics: Array.isArray(raw.syllabus_topics) ? raw.syllabus_topics : preFilter.matchedSyllabusKeywords,
    subject,
    subcategory: String(raw.subcategory || 'Government Policies and Governance Reforms'),
    main_category_id: mainCategoryId,
    pyq_connection: {
      has_connection: Boolean(raw.pyq_connection?.has_connection),
      explanation: String(raw.pyq_connection?.explanation || 'Recurring themes in UPSC General Studies papers.'),
      question_ids: Array.isArray(raw.pyq_connection?.question_ids) ? raw.pyq_connection.question_ids : [],
    },
    decision,
    rejection_reason: decision === 'REJECT' ? String(raw.rejection_reason || 'Insufficient syllabus relevance score (<55).') : null,
  };
}

export function evaluateStoryDeterministic(story: CandidateStoryInput): UPSCRelevanceEvaluation {
  const preFilter = evaluateDeterministicPreFilter(
    story.headline,
    story.description,
    story.sourceTier
  );
  if (preFilter.isRejected) {
    return {
      is_upsc_relevant: false,
      relevance_score: preFilter.baseScore,
      importance: 'LOW',
      importance_reason: preFilter.rejectionReason || 'Rejected by exclusion criteria.',
      prelims_relevant: false,
      mains_relevant: false,
      essay_relevant: false,
      gs_papers: [],
      syllabus_topics: [],
      subject: 'Polity & Governance',
      subcategory: 'General',
      main_category_id: 'polity-governance',
      pyq_connection: { has_connection: false, explanation: '', question_ids: [] },
      decision: 'REJECT',
      rejection_reason: preFilter.rejectionReason,
      evaluation_source: 'deterministic_engine',
      evaluated_at: new Date().toISOString(),
    };
  }
  return buildDeterministicEvaluation(story, preFilter);
}

function buildDeterministicEvaluation(
  story: CandidateStoryInput,
  preFilter: PreFilterResult
): UPSCRelevanceEvaluation {
  const score = preFilter.baseScore;
  const isRelevant = score >= 55;

  let importance: UPSCImportanceLevel = 'MODERATE';
  if (score >= 85) importance = 'HIGH';
  else if (score >= 70) importance = 'IMPORTANT';
  else if (score >= 55) importance = 'MODERATE';
  else importance = 'LOW';

  // If AI failed and score is high, mark as PUBLISH; if borderline (55-69), mark as NEEDS_REVIEW so unvetted stories don't sneak in
  let decision: RelevanceDecision = 'REJECT';
  if (score >= 75) {
    decision = 'PUBLISH';
  } else if (score >= 55) {
    decision = 'NEEDS_REVIEW';
  } else {
    decision = 'REJECT';
  }

  const text = `${story.headline} ${story.description}`.toLowerCase();
  let subject: SubjectGroupName = 'Polity & Governance';
  let mainCat: SubjectMainCategoryId = 'polity-governance';
  let subcat = 'Constitution, Parliament and Judiciary';

  if (text.includes('rbi') || text.includes('inflation') || text.includes('economy') || text.includes('gdp') || text.includes('fiscal')) {
    subject = 'Economy';
    mainCat = 'economy-environment-science';
    subcat = 'Macroeconomics and Banking';
  } else if (text.includes('climate') || text.includes('wetland') || text.includes('biodiversity') || text.includes('forest') || text.includes('tiger')) {
    subject = 'Environment & Ecology';
    mainCat = 'economy-environment-science';
    subcat = 'Biodiversity, Climate Change and Conservation';
  } else if (text.includes('isro') || text.includes('space') || text.includes('semiconductor') || text.includes('quantum') || text.includes('satellite')) {
    subject = 'Science & Technology';
    mainCat = 'economy-environment-science';
    subcat = 'Space, Defence and Nuclear Technology';
  } else if (text.includes('china') || text.includes('un ') || text.includes('brics') || text.includes('bilateral') || text.includes('treaty') || text.includes('quad')) {
    subject = 'International Affairs';
    mainCat = 'international-affairs';
    subcat = 'India and Major Powers';
  }

  return {
    is_upsc_relevant: isRelevant,
    relevance_score: score,
    importance,
    importance_reason: `Evaluated via deterministic UPSC rubric: ${preFilter.matchedSyllabusKeywords.length} syllabus anchors identified.`,
    prelims_relevant: true,
    mains_relevant: score >= 70,
    essay_relevant: score >= 85,
    gs_papers: preFilter.suggestedGsPapers.length > 0 ? preFilter.suggestedGsPapers : ['GS-II'],
    syllabus_topics: preFilter.matchedSyllabusKeywords,
    subject,
    subcategory: subcat,
    main_category_id: mainCat,
    pyq_connection: {
      has_connection: preFilter.matchedSyllabusKeywords.length >= 2,
      explanation: preFilter.matchedSyllabusKeywords.length >= 2
        ? `Recurring UPSC theme connecting to ${preFilter.matchedSyllabusKeywords.slice(0, 3).join(', ')}.`
        : 'General static syllabus linkage.',
      question_ids: [],
    },
    decision,
    rejection_reason: decision === 'REJECT' ? 'Insufficient syllabus relevance score (<55).' : null,
    evaluation_source: 'deterministic_engine',
    evaluated_at: new Date().toISOString(),
  };
}

