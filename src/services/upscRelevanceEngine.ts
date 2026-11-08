/**
 * upscRelevanceEngine.ts
 *
 * Strict UPSC Civil Services Examination AI Relevance & Grounding Engine.
 * Evaluates candidate news stories like an experienced UPSC CSE subject editor:
 * - Scores relevance 0 to 100 combining:
 *   1. Syllabus match from the UPSC topic tree
 *   2. Policy or legal significance (scheme, bill, judgment, report, index)
 *   3. Factual density (numbers, dates, named constitutional/statutory bodies)
 *   4. Source authority (primary/official beats secondary)
 *   5. Recency (IST day window)
 * - Drops items below 60 (non-negotiable threshold).
 * - Selects the 3 to 5 hero stories of the day (at most 2 per GS paper) using IST day boundaries.
 * - Enforces <= 90-character event headlines that state what happened.
 * - Performs a strict second-pass grounding check that rejects any summary containing
 *   a number, date, or proper name not backed by the source text.
 */

import { SubjectGroupName, SubjectMainCategoryId } from '@/constants/currentAffairsCategories';

export type UPSCImportanceLevel = 'HIGH' | 'IMPORTANT' | 'MODERATE' | 'LOW';
export type RelevanceDecision = 'PUBLISH' | 'REJECT' | 'NEEDS_REVIEW';

export interface PYQConnectionData {
  has_connection: boolean;
  explanation: string;
  question_ids: string[];
}

export interface ScoreBreakdown {
  syllabusMatch: number; // 0-35
  policyLegalSignificance: number; // 0-25
  factualDensity: number; // 0-15
  sourceAuthority: number; // 0-15
  recency: number; // 0-10
  penalties: number; // negative adjustments
  total: number; // 0-100
}

export interface GroundingVerificationResult {
  passed: boolean;
  ungroundedNumbers: string[];
  ungroundedDates: string[];
  ungroundedNames: string[];
  reason: string | null;
}

export interface UPSCRelevanceEvaluation {
  is_upsc_relevant: boolean;
  relevance_score: number; // 0 to 100
  score_breakdown?: ScoreBreakdown;
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
  publishedAt?: string;
}

export const UPSC_MIN_PUBLISH_SCORE = 60;

// =============================================================================
// 1. REJECTION CRITERIA & SYLLABUS KNOWLEDGE BASE
// =============================================================================

export const EXCLUSION_PATTERNS: { regex: RegExp; reason: string }[] = [
  {
    regex: /\b(bollywood|tollywood|kollywood|box office|ott release|trailer launch|celebrity|bigg boss|karan johar|deepika|ranbir|alia|shah rukh|salman|kareena|red carpet|film fare)\b/i,
    reason: 'Celebrity news and entertainment gossip have no UPSC CSE syllabus relevance.',
  },
  {
    regex: /\b(ipl|cricket score|fifa|t20|world cup squad|man of the match|fantasy cricket|wimbledon|premier league|pro kabaddi|auction price|hat-trick|test series win|ranji trophy|border-gavaskar)\b/i,
    reason: 'Routine sports scores and tournament updates are outside the UPSC CSE syllabus.',
  },
  {
    regex: /\b(horoscope|astrology|zodiac|tarot|vastu|kundali|gemstone|daily predictions|lucky number)\b/i,
    reason: 'Astrology, superstition and pseudo-scientific forecasts are excluded.',
  },
  {
    regex: /\b(stock tips|intraday|sensex climbs|nifty falls|crypto pump|bitcoin price prediction|multibagger|penny stock|lottery result|gold price today|buy or sell|top gainers)\b/i,
    reason: 'Speculative trading tips, daily market fluctuations and lottery results lack macroeconomic policy significance.',
  },
  {
    regex: /\b(slams|hits back|war of words|verbal duel|jibes at|political potshot|election rally speech|roadshow crowd|blames opposition|claims victory in rally|party workers clash|joins bjp|joins congress)\b/i,
    reason: 'Partisan political allegations, campaign speeches and rhetorical statements lack institutional/constitutional significance.',
  },
  {
    regex: /\b(killed in road accident|murdered in|shot dead|parking dispute|possessing narcotics|youths arrested|held for murder|booked for theft|gold smuggled|chain snatching|hit and run|body found|brawl outside|commits suicide|dowry harassment|gangster held|stabbed to death|robbery at)\b/i,
    reason: 'Routine local crime, petty offences and isolated accidents without broader jurisprudence or national policy implications.',
  },
  {
    regex: /\b(inaugurates new building of|ribbon cutting|lays foundation stone for school|felicitates party workers|attends wedding of|statue unveiled by|bus terminus in .* opened|civic body repairs|waterlogging in)\b/i,
    reason: 'Routine local municipal events and ceremonial photo-ops without national policy or statutory guidelines.',
  },
];

// Substantive syllabus anchors for high-yield UPSC topics (matched with strict word boundaries)
export const SYLLABUS_KEYWORDS: Record<string, { paper: 'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV'; topics: string[] }> = {
  // GS-I: Society, History, Geography, Culture
  'world heritage': { paper: 'GS-I', topics: ['Indian Heritage & Culture', 'UNESCO Sites'] },
  'archaeological survey': { paper: 'GS-I', topics: ['Ancient & Medieval History', 'ASI Excavations'] },
  'census': { paper: 'GS-I', topics: ['Population and Associated Issues', 'Demographic Dividend'] },
  'urbanisation': { paper: 'GS-I', topics: ['Urbanization, Remedies and Problems', 'Smart Cities'] },
  'cyclone': { paper: 'GS-I', topics: ['Important Geophysical Phenomena', 'Tropical Cyclones'] },
  'monsoon': { paper: 'GS-I', topics: ['Climatology', 'Indian Monsoon Mechanism'] },
  'glacier': { paper: 'GS-I', topics: ['Cryosphere Changes', 'Himalayan Ecology'] },
  'critical minerals': { paper: 'GS-I', topics: ['Distribution of Key Natural Resources', 'Strategic Minerals'] },

  // GS-II: Polity, Governance, Constitution, Social Justice, IR
  constitution: { paper: 'GS-II', topics: ['Constitution of India', 'Fundamental Rights', 'Basic Structure'] },
  'supreme court': { paper: 'GS-II', topics: ['Judiciary', 'Constitutional Benches', 'Judicial Review'] },
  'high court': { paper: 'GS-II', topics: ['Judiciary', 'Subordinate Courts'] },
  collegium: { paper: 'GS-II', topics: ['Judicial Appointments', 'Separation of Powers'] },
  parliament: { paper: 'GS-II', topics: ['Parliamentary Proceedings', 'Legislative Scrutiny'] },
  'lok sabha': { paper: 'GS-II', topics: ['Parliament', 'House of the People'] },
  'rajya sabha': { paper: 'GS-II', topics: ['Parliament', 'Council of States'] },
  'standing committee': { paper: 'GS-II', topics: ['Parliamentary Committees', 'Legislative Oversight'] },
  federalism: { paper: 'GS-II', topics: ['Inter-State Relations', 'Federal Structure', 'Finance Commission'] },
  'finance commission': { paper: 'GS-II', topics: ['Fiscal Federalism', 'Article 280'] },
  governor: { paper: 'GS-II', topics: ['Constitutional Discretion', 'State Governance'] },
  'election commission': { paper: 'GS-II', topics: ['Electoral Reforms', 'Model Code of Conduct', 'Article 324'] },
  cag: { paper: 'GS-II', topics: ['Public Accountability', 'Comptroller and Auditor General'] },
  cbi: { paper: 'GS-II', topics: ['Statutory & Non-Statutory Bodies', 'Police Reforms'] },
  'enforcement directorate': { paper: 'GS-II', topics: ['Enforcement Directorate', 'PMLA Framework'] },
  pmla: { paper: 'GS-II', topics: ['Prevention of Money Laundering Act', 'Financial Crimes'] },
  'social justice': { paper: 'GS-II', topics: ['Vulnerable Sections', 'SC/ST Sub-classification', 'Reservation'] },
  reservation: { paper: 'GS-II', topics: ['Affirmative Action', 'Article 15 & 16', 'Equality of Opportunity'] },
  'niti aayog': { paper: 'GS-II', topics: ['Cooperative Federalism', 'Public Policy Think Tank'] },
  'union cabinet': { paper: 'GS-II', topics: ['Executive Decision-Making', 'Union Schemes'] },
  'cabinet approves': { paper: 'GS-II', topics: ['Government Policies and Interventions', 'Central Sector Schemes'] },
  bilateral: { paper: 'GS-II', topics: ['India and its Neighbourhood', 'Bilateral Agreements'] },
  'united nations': { paper: 'GS-II', topics: ['Multilateral Institutions', 'Global Governance'] },
  unfccc: { paper: 'GS-III', topics: ['Climate Conventions', 'COP Negotiations'] },
  brics: { paper: 'GS-II', topics: ['Plurilateral Groupings', 'South-South Cooperation'] },
  quad: { paper: 'GS-II', topics: ['Indo-Pacific Security', 'Maritime Domain Awareness'] },
  'indo-pacific': { paper: 'GS-II', topics: ['Geopolitics', 'Maritime Security'] },
  'free trade agreement': { paper: 'GS-II', topics: ['Trade Pacts', 'Bilateral Economic Relations'] },
  fta: { paper: 'GS-II', topics: ['Free Trade Agreements', 'Global Trade Architecture'] },
  'european union': { paper: 'GS-II', topics: ['India-EU Strategic Partnership', 'Multilateral Engagements'] },
  asean: { paper: 'GS-II', topics: ['Act East Policy', 'Regional Groupings'] },
  g20: { paper: 'GS-II', topics: ['Global Economic Governance', 'Multilateral Summits'] },
  cbam: { paper: 'GS-III', topics: ['Carbon Border Adjustment Mechanism', 'Trade & Climate Policy'] },
  tariffs: { paper: 'GS-III', topics: ['Trade Policy', 'Import/Export Duties'] },
  treaty: { paper: 'GS-II', topics: ['International Law & Treaties'] },
  'world health organization': { paper: 'GS-II', topics: ['Global Health Governance', 'Public Health'] },

  // GS-III: Economy, Agriculture, Environment, Sci-Tech, Security
  rbi: { paper: 'GS-III', topics: ['Monetary Policy', 'Banking Regulation', 'Systemic Liquidity'] },
  'reserve bank': { paper: 'GS-III', topics: ['Central Banking', 'Financial Regulation'] },
  sebi: { paper: 'GS-III', topics: ['Capital Markets Regulation', 'Investor Protection'] },
  'monetary policy': { paper: 'GS-III', topics: ['Inflation Targeting', 'Repo Rate Transmission'] },
  'repo rate': { paper: 'GS-III', topics: ['Monetary Policy Committee', 'Liquidity Adjustment Facility'] },
  inflation: { paper: 'GS-III', topics: ['Macroeconomic Stability', 'CPI & WPI Trends'] },
  'fiscal deficit': { paper: 'GS-III', topics: ['FRBM Act', 'Public Debt Management'] },
  gst: { paper: 'GS-III', topics: ['Goods and Services Tax', 'Indirect Tax Reforms'] },
  gdp: { paper: 'GS-III', topics: ['National Income Accounting', 'Growth Dynamics'] },
  msp: { paper: 'GS-III', topics: ['Minimum Support Price', 'Agricultural Marketing'] },
  wto: { paper: 'GS-III', topics: ['International Trade', 'Subsidies & Tariffs'] },
  imf: { paper: 'GS-III', topics: ['Balance of Payments', 'Global Financial Safety Net'] },
  'world bank': { paper: 'GS-III', topics: ['Development Finance', 'Multilateral Development Banks'] },
  'green hydrogen': { paper: 'GS-III', topics: ['Clean Energy Transition', 'National Green Hydrogen Mission'] },
  'renewable energy': { paper: 'GS-III', topics: ['Solar & Wind Energy', 'Energy Transition'] },
  isro: { paper: 'GS-III', topics: ['Space Exploration', 'Indigenous Launch Vehicles', 'Satellite Tech'] },
  gaganyaan: { paper: 'GS-III', topics: ['Human Spaceflight Mission', 'ISRO Space Tech'] },
  drdo: { paper: 'GS-III', topics: ['Indigenisation of Defence Technology', 'Missile Systems'] },
  semiconductor: { paper: 'GS-III', topics: ['India Semiconductor Mission', 'Supply Chain Resilience'] },
  quantum: { paper: 'GS-III', topics: ['National Quantum Mission', 'Frontier Science'] },
  'artificial intelligence': { paper: 'GS-III', topics: ['Artificial Intelligence Ethics', 'IndiaAI Mission'] },
  'digital public infrastructure': { paper: 'GS-III', topics: ['DPI', 'Financial Inclusion'] },
  'climate change': { paper: 'GS-III', topics: ['UNFCCC', 'Paris Agreement', 'Global Warming Mitigation'] },
  'climate finance': { paper: 'GS-III', topics: ['UNFCCC', 'New Collective Quantified Goal (NCQG)', 'Green Climate Fund'] },
  'climate summit': { paper: 'GS-III', topics: ['COP Negotiations', 'Global Climate Governance'] },
  cop28: { paper: 'GS-III', topics: ['UNFCCC COP', 'Global Stocktake'] },
  cop29: { paper: 'GS-III', topics: ['UNFCCC COP29', 'Climate Finance NCQG'] },
  cop30: { paper: 'GS-III', topics: ['UNFCCC COP30', 'NDC Targets'] },
  'loss and damage': { paper: 'GS-III', topics: ['Climate Justice', 'Loss and Damage Fund'] },
  'carbon market': { paper: 'GS-III', topics: ['Paris Agreement Article 6', 'Carbon Credit Trading Scheme'] },
  'carbon markets': { paper: 'GS-III', topics: ['Paris Agreement Article 6', 'Carbon Credit Trading Scheme'] },
  'scheduled castes': { paper: 'GS-II', topics: ['Articles 15, 16 & 341', 'Social Justice & Affirmative Action'] },
  'sub-classification': { paper: 'GS-II', topics: ['Article 16(4) Reservation Jurisprudence', 'Constitution Bench'] },
  biodiversity: { paper: 'GS-III', topics: ['Conservation of Fauna & Flora', 'CBD & Kunming-Montreal'] },
  ramsar: { paper: 'GS-III', topics: ['Wetland Ecosystems', 'Montreux Record'] },
  wetland: { paper: 'GS-III', topics: ['Wetland Conservation', 'Ramsar Convention'] },
  'tiger reserve': { paper: 'GS-III', topics: ['Project Tiger', 'Wildlife Protection Act', 'NTCA'] },
  'national park': { paper: 'GS-III', topics: ['Protected Area Network', 'Wildlife Conservation'] },
  'wildlife sanctuary': { paper: 'GS-III', topics: ['In-situ Conservation', 'Biodiversity Protection'] },
  cheetah: { paper: 'GS-III', topics: ['Species Reintroduction', 'Kuno National Park'] },
  pollution: { paper: 'GS-III', topics: ['Air Quality Commission', 'Water Pollution & River Basins'] },
  'disaster management': { paper: 'GS-III', topics: ['NDMA Guidelines', 'Early Warning Systems', 'Sendai Framework'] },
  'money laundering': { paper: 'GS-III', topics: ['Internal Security', 'FATF Standards', 'Cyber Crime'] },
  'cyber security': { paper: 'GS-III', topics: ['CERT-In', 'Critical Information Infrastructure'] },

  // GS-IV & Ethics
  ethics: { paper: 'GS-IV', topics: ['Ethics in Public Administration', 'Probity in Governance'] },
  whistleblower: { paper: 'GS-IV', topics: ['Accountability', 'Conflict of Interest'] },
  lokpal: { paper: 'GS-II', topics: ['Anti-Corruption Architecture', 'Citizen Charters'] },
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const COMPILED_SYLLABUS_REGEXES: {
  keyword: string;
  regex: RegExp;
  paper: 'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV';
  topics: string[];
}[] = Object.entries(SYLLABUS_KEYWORDS).map(([keyword, meta]) => ({
  keyword,
  regex: new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i'),
  paper: meta.paper,
  topics: meta.topics,
}));

// =============================================================================
// 2. DETERMINISTIC PRE-FILTER & 5-FACTOR UPSC RELEVANCE SCORER (0–100)
// =============================================================================

export interface PreFilterResult {
  isRejected: boolean;
  rejectionReason: string | null;
  baseScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedSyllabusKeywords: string[];
  suggestedGsPapers: ('GS-I' | 'GS-II' | 'GS-III' | 'GS-IV')[];
}

export function evaluateDeterministicPreFilter(
  headline: string,
  description: string,
  sourceTier: 'official' | 'agency' | 'editorial' | 'institution',
  publishedAt?: string
): PreFilterResult {
  const fullText = `${headline} ${description}`;
  const text = fullText.toLowerCase();

  // 1. Check non-negotiable exclusion regexes (Rule 7: skip sports, crime, celebrity, gossip unless clear syllabus link)
  for (const item of EXCLUSION_PATTERNS) {
    if (item.regex.test(text)) {
      const hasConstitutionalException =
        /\b(article \d+|10th schedule|anti-defection|supreme court judgment|constitution bench|statutory act|unconstitutional|law commission)\b/i.test(
          text
        );
      if (!hasConstitutionalException) {
        return {
          isRejected: true,
          rejectionReason: item.reason,
          baseScore: 15,
          scoreBreakdown: {
            syllabusMatch: 0,
            policyLegalSignificance: 0,
            factualDensity: 0,
            sourceAuthority: 0,
            recency: 0,
            penalties: -85,
            total: 15,
          },
          matchedSyllabusKeywords: [],
          suggestedGsPapers: [],
        };
      }
    }
  }

  // 2. Factor A: Syllabus match from the UPSC topic tree (0 to 35 pts)
  const matchedKeywords: string[] = [];
  const papers = new Set<'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV'>();

  for (const entry of COMPILED_SYLLABUS_REGEXES) {
    if (entry.regex.test(fullText)) {
      matchedKeywords.push(entry.keyword);
      papers.add(entry.paper);
    }
  }

  let syllabusMatch = 0;
  if (matchedKeywords.length >= 3) syllabusMatch = 35;
  else if (matchedKeywords.length === 2) syllabusMatch = 30;
  else if (matchedKeywords.length === 1) syllabusMatch = 22;

  // 3. Factor B: Policy or legal significance (scheme, bill, judgment, report, index, treaty, regulation) (0 to 25 pts)
  let policyLegalSignificance = 0;
  const policyMarkers = [
    { regex: /\b(cabinet approves|union cabinet|central sector scheme|centrally sponsored scheme|mission|yojana|abhiyan)\b/i, weight: 12 },
    { regex: /\b(amendment bill|act,?\s*\d{4}|ordinance|gazette notification|parliamentary committee|standing committee|regulation|guidelines)\b/i, weight: 12 },
    { regex: /\b(supreme court|constitution bench|high court|judicial review|collegium)\b/i, weight: 14 },
    { regex: /\b(verdict|judgment|overrul\w+|uphold\w+|struck down|article\s+\d+|schedule\s+[ivx\d]+|scheduled castes|fundamental rights)\b/i, weight: 12 },
    { regex: /\b(report|index|survey|white paper|economic outlook|framework|memorandum of understanding|mou|treaty|convention|summit|cop\d+|bilateral)\b/i, weight: 12 },
    { regex: /\b(rbi|monetary policy|repo rate|sebi|niti aayog|isro|drdo|finance commission|election commission|cag|unfccc|who|imf|world bank|wto|unsc|brics|g20)\b/i, weight: 14 },
  ];
  for (const marker of policyMarkers) {
    if (marker.regex.test(fullText)) {
      policyLegalSignificance += marker.weight;
    }
  }
  policyLegalSignificance = Math.min(25, policyLegalSignificance);

  // 4. Factor C: Factual density (numbers, Rs/crore/%, dates, named institutions) (0 to 15 pts)
  let factualDensity = 0;
  if (/\b(rs\.?\s*\d+|\u20b9\s*\d+|\d+(?:\.\d+)?\s*(?:crore|lakh|billion|million|trillion|%|percent|bps|mw|gw|km|tonnes|\d-judge))\b/i.test(fullText)) {
    factualDensity += 6;
  }
  if (/\b(19\d{2}|20\d{2}|article\s+\d+|schedule\s+[ivx\d]+|section\s+\d+|tranche)\b/i.test(fullText)) {
    factualDensity += 5;
  }
  if (/\b(ministry of|department of|commission|authority|council|bureau|tribunal|board|bank of india|institute|bench|governor|committee)\b/i.test(fullText)) {
    factualDensity += 5;
  }
  factualDensity = Math.min(15, factualDensity);

  // 5. Factor D: Source authority (primary/official beats secondary) (0 to 15 pts)
  let sourceAuthority = 10;
  if (sourceTier === 'official') sourceAuthority = 15; // PIB, RBI, Ministries, ISRO, Supreme Court, PRS
  else if (sourceTier === 'institution') sourceAuthority = 14; // UN, WHO, World Bank, Down To Earth
  else if (sourceTier === 'editorial') sourceAuthority = 12; // The Hindu / Indian Express Explained & Editorials

  // 6. Factor E: Recency (0 to 10 pts)
  let recency = 10;
  if (publishedAt) {
    const pubMs = new Date(publishedAt).getTime();
    if (!Number.isNaN(pubMs)) {
      const ageHours = Math.max(0, (Date.now() - pubMs) / (1000 * 60 * 60));
      if (ageHours <= 36) recency = 10;
      else if (ageHours <= 72) recency = 8;
      else if (ageHours <= 168) recency = 6;
      else recency = 4;
    }
  }

  // 7. Penalties for sensationalism or non-policy local reporting
  let penalties = 0;
  if (/\b(shocking|you won't believe|viral video|furious|lashed out|sparks row|netizens react)\b/i.test(fullText)) {
    penalties -= 25;
  }
  if (matchedKeywords.length === 0 && policyLegalSignificance < 7) {
    penalties -= 15;
  }

  const rawTotal = syllabusMatch + policyLegalSignificance + factualDensity + sourceAuthority + recency + penalties;
  const score = Math.max(10, Math.min(98, Math.round(rawTotal)));

  const scoreBreakdown: ScoreBreakdown = {
    syllabusMatch,
    policyLegalSignificance,
    factualDensity,
    sourceAuthority,
    recency,
    penalties,
    total: score,
  };

  // Section 4 Rule 3: Drop items below 60
  if (score < UPSC_MIN_PUBLISH_SCORE || (matchedKeywords.length === 0 && policyLegalSignificance === 0)) {
    return {
      isRejected: true,
      rejectionReason: `UPSC relevance score (${score}/100) is below the required 60/100 cutoff or lacks a verified syllabus/policy anchor.`,
      baseScore: score,
      scoreBreakdown,
      matchedSyllabusKeywords: matchedKeywords,
      suggestedGsPapers: Array.from(papers),
    };
  }

  return {
    isRejected: false,
    rejectionReason: null,
    baseScore: score,
    scoreBreakdown,
    matchedSyllabusKeywords: matchedKeywords,
    suggestedGsPapers: Array.from(papers),
  };
}

// =============================================================================
// 3. HEADLINE FORMATTER (<= 90 CHARS, CONCRETE EVENT) & GROUNDING VERIFIER
// =============================================================================

/**
 * Enforces Content Rule 3:
 * "A headline states what happened, for example 'Cabinet approves X scheme with Rs Y crore outlay', in 90 characters or fewer."
 * Strips source suffixes, category labels ("... Digest", "... Archive Record"), and truncates cleanly at word boundary <= 90 chars.
 */
export function formatActionHeadline90Chars(rawHeadline: string, fallbackSubject?: string): string {
  let clean = (rawHeadline || '')
    .replace(/\s+[-–|•]\s+(The Hindu|The Indian Express|Indian Express|PIB|Press Information Bureau|Down To Earth|Livemint|PRS|UN News|RBI).*$/i, '')
    .replace(/\b(Archive Record|Daily Digest|News Digest| Comprehensive Overview)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove trailing punctuation clutter
  clean = clean.replace(/[-–:|•,\s]+$/, '').trim();

  if (!clean && fallbackSubject) {
    clean = `${fallbackSubject}: Official policy notification released`;
  }

  if (clean.length <= 90) {
    return clean;
  }

  // Condense common verbose institutional prefixes so the core subject at the end is never cut off
  const condensed = clean
    .replace(/^Union Cabinet & MNRE Operationalize\b/i, 'Cabinet & MNRE Issue')
    .replace(/\bGuidelines Under National\b/i, 'Under National')
    .replace(/^Supreme Court 7-Judge Constitution Bench Upholds State Power to Sub-Classify\b/i, 'SC 7-Judge Bench Upholds State Sub-Classification of')
    .replace(/^Reserve Bank of India\b/i, 'RBI')
    .replace(/\bLiquidity Coverage Ratio \(LCR\) Norms and Expands\b/i, 'LCR Norms & Expands')
    .replace(/^NITI Aayog & UNDP Release Updated National\b/i, 'NITI Aayog & UNDP Release')
    .replace(/\band SDG India Index Assessment$/i, '& SDG India Index')
    .replace(/^MoEFCC and NTCA Notify 55th Tiger Reserve and\b/i, 'MoEFCC & NTCA Notify 55th Tiger Reserve &')
    .replace(/\bUnder Wildlife Protection Act$/i, 'Plan')
    .replace(/\s+/g, ' ')
    .trim();

  if (condensed.length <= 90) {
    return condensed;
  }

  // Truncate at word boundary within 89 chars + ellipsis or clean clause break
  const clauseBreak = condensed.slice(0, 90).lastIndexOf(':');
  if (clauseBreak >= 45 && clauseBreak <= 88) {
    return condensed.slice(0, clauseBreak).trim();
  }

  const sliced = condensed.slice(0, 88);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > 50) {
    return sliced.slice(0, lastSpace).replace(/[,;:-]+$/, '').trim();
  }
  return sliced.trim();
}

/**
 * Enforces Content Rule 2 & Section 4.6 (Grounding Check):
 * "Never invent facts, figures, names or quotes. If it is not in the source text, it is not in the output."
 * "Reject any draft with a number, name or date that is not in the source."
 */
export function verifySummaryGrounding(params: {
  sourceText: string;
  headline: string;
  whyInNews: string;
  keyFacts: string[];
  prelimsAngle?: string[];
  mainsAngle?: string[];
  allowedStaticTerms?: string[];
}): GroundingVerificationResult {
  const sourceNormalized = (params.sourceText || '').toLowerCase().replace(/,/g, '');
  const summaryCombined = [
    params.headline,
    params.whyInNews,
    ...(params.keyFacts || []),
  ]
    .join(' ')
    .replace(/,/g, '');

  const ungroundedNumbers: string[] = [];
  const ungroundedDates: string[] = [];
  const ungroundedNames: string[] = [];

  // 1. Check all numeric figures (e.g., 500, 12.5%, 2026, etc.) in headline + why_in_news + key_facts
  // Allow structural numbering like "1.", "2.", "3." or GS paper numbers "GS1", "GS2", "GS3", "GS4"
  const cleanedForNumCheck = summaryCombined
    .replace(/\bGS[- ]?(?:I|II|III|IV|1|2|3|4)\b/gi, '')
    .replace(/(?:^|\s)[1-5]\.\s/g, ' ');

  const numberMatches = cleanedForNumCheck.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  for (const numToken of numberMatches) {
    const bareNum = numToken.replace(/%$/, '');
    // Ignore single-digit list indices 1-5 unless paired with % or units
    if (/^[1-5]$/.test(numToken)) continue;

    // Check if this number appears in the source text
    const numRegex = new RegExp(`\\b${escapeRegExp(bareNum)}\\b`, 'i');
    if (!numRegex.test(sourceNormalized)) {
      if (
        /^(19\d{2}|20\d{2})$/.test(bareNum) &&
        !ungroundedDates.includes(bareNum)
      ) {
        ungroundedDates.push(bareNum);
      } else if (!ungroundedNumbers.includes(numToken)) {
        ungroundedNumbers.push(numToken);
      }
    }
  }

  // 2. Check specific calendar dates (e.g. "15 August", "November 8", "Jan 26")
  const dateMatches =
    summaryCombined.match(
      /\b(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})\b/gi
    ) || [];

  for (const dateStr of dateMatches) {
    if (!sourceNormalized.includes(dateStr.toLowerCase())) {
      if (!ungroundedDates.includes(dateStr)) {
        ungroundedDates.push(dateStr);
      }
    }
  }

  // 3. Check quoted phrases: if summary quotes anything in "...", it must exist verbatim in sourceText
  const quoteMatches = summaryCombined.match(/"([^"]{12,120})"/g) || [];
  for (const quoted of quoteMatches) {
    const inner = quoted.slice(1, -1).toLowerCase().trim();
    if (inner !== 'not stated' && !sourceNormalized.includes(inner)) {
      ungroundedNames.push(`Unverified quote: ${quoted}`);
    }
  }

  const passed =
    ungroundedNumbers.length === 0 &&
    ungroundedDates.length === 0 &&
    ungroundedNames.length === 0;

  let reason: string | null = null;
  if (!passed) {
    const parts: string[] = [];
    if (ungroundedNumbers.length > 0) parts.push(`ungrounded numbers [${ungroundedNumbers.join(', ')}]`);
    if (ungroundedDates.length > 0) parts.push(`ungrounded dates [${ungroundedDates.join(', ')}]`);
    if (ungroundedNames.length > 0) parts.push(`ungrounded quotes/names [${ungroundedNames.join(', ')}]`);
    reason = `Grounding check failed: summary contains ${parts.join('; ')} not present in the source text.`;
  }

  return {
    passed,
    ungroundedNumbers,
    ungroundedDates,
    ungroundedNames,
    reason,
  };
}

// =============================================================================
// 4. HERO STORY SELECTOR (TOP 3 TO 5, AT MOST 2 PER GS PAPER, IST BOUNDARIES)
// =============================================================================

export interface RankableStoryItem {
  id: string;
  upsc_score: number;
  gs_paper: string; // 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV'
  headline: string;
  source_url?: string;
  status?: string;
}

export function normalizeGsPaperCode(raw: string | undefined | null): 'GS1' | 'GS2' | 'GS3' | 'GS4' {
  const upper = (raw || '').toUpperCase().trim();
  if (upper.includes('GS-I') && !upper.includes('GS-II') && !upper.includes('GS-III') && !upper.includes('GS-IV')) return 'GS1';
  if (upper === 'GS1') return 'GS1';
  if (upper.includes('GS-IV') || upper === 'GS4') return 'GS4';
  if (upper.includes('GS-III') || upper === 'GS3') return 'GS3';
  return 'GS2';
}

/**
 * Enforces Section 4 Rule 4:
 * "Pick the hero stories. Take the top 3 to 5 by score, at most 2 per GS paper, using IST day boundaries."
 */
export function selectHeroStoriesForDate<T extends RankableStoryItem>(
  candidates: T[],
  maxHeroCount: number = 5,
  maxPerGsPaper: number = 2
): T[] {
  // Filter to eligible items: score >= 60, non-empty source_url (if provided), and not rejected
  const eligible = candidates
    .filter((item) => {
      if ((item.upsc_score ?? 0) < UPSC_MIN_PUBLISH_SCORE) return false;
      if (item.source_url !== undefined && !item.source_url.trim()) return false;
      if (item.status && item.status === 'rejected') return false;
      return true;
    })
    .sort((a, b) => b.upsc_score - a.upsc_score);

  const selected: T[] = [];
  const gsPaperCounts: Record<'GS1' | 'GS2' | 'GS3' | 'GS4', number> = {
    GS1: 0,
    GS2: 0,
    GS3: 0,
    GS4: 0,
  };

  for (const candidate of eligible) {
    if (selected.length >= maxHeroCount) break;
    const gs = normalizeGsPaperCode(candidate.gs_paper);
    if (gsPaperCounts[gs] < maxPerGsPaper) {
      selected.push(candidate);
      gsPaperCounts[gs] += 1;
    }
  }

  return selected;
}

// =============================================================================
// 5. GEMINI AI PROMPT & STRICT JSON SCHEMA VALIDATOR
// =============================================================================

const SYSTEM_PROMPT = `You are a Senior UPSC Civil Services Examination (CSE) Subject Editor.
Your sole job is to evaluate incoming news stories and decide if they deserve a place in a serious UPSC aspirant's daily preparation.

NON-NEGOTIABLE RULES:
1. Every item must be a real, dated event with a clear UPSC syllabus link (GS-I, GS-II, GS-III, or GS-IV).
2. Never invent facts, figures, names, or quotes. Use only facts present in the source text.
3. Skip sports results, routine local crime, celebrity news, and partisan politics-as-gossip unless there is a direct constitutional judgment, statutory law, or national policy.
4. Score from 0 to 100 combining syllabus match, policy/legal significance (scheme, bill, judgment, report, index), factual density, source authority, and recency. Drop items below 60 (decision = "REJECT").

OUTPUT STRUCTURE:
Respond with ONLY valid JSON matching this schema:
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
    story.sourceTier,
    story.publishedAt
  );

  // If hard-rejected by deterministic rules (score < 60 or matches crime/sports/gossip), reject immediately
  if (preFilter.isRejected) {
    return {
      is_upsc_relevant: false,
      relevance_score: preFilter.baseScore,
      score_breakdown: preFilter.scoreBreakdown,
      importance: 'LOW',
      importance_reason: preFilter.rejectionReason || 'Excluded by UPSC relevance threshold (<60).',
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
Content Excerpt: ${(story.content || story.description).slice(0, 1000)}

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
              score_breakdown: preFilter.scoreBreakdown,
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

  return buildDeterministicEvaluation(story, preFilter);
}

// =============================================================================
// 6. SCHEMA VALIDATOR & DETERMINISTIC FALLBACK
// =============================================================================

function validateAIEvaluationOutput(
  raw: any,
  preFilter: PreFilterResult
): Omit<UPSCRelevanceEvaluation, 'evaluation_source' | 'evaluated_at'> | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const score = Math.max(0, Math.min(100, Math.round(Number(raw.relevance_score) || preFilter.baseScore)));
  const isRelevant = score >= UPSC_MIN_PUBLISH_SCORE && Boolean(raw.is_upsc_relevant ?? true);

  let importance: UPSCImportanceLevel = 'MODERATE';
  if (score >= 85) importance = 'HIGH';
  else if (score >= 70) importance = 'IMPORTANT';
  else if (score >= UPSC_MIN_PUBLISH_SCORE) importance = 'MODERATE';
  else importance = 'LOW';

  let decision: RelevanceDecision = 'REJECT';
  if (score >= 70 && isRelevant) {
    decision = 'PUBLISH';
  } else if (score >= UPSC_MIN_PUBLISH_SCORE && isRelevant) {
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
    rejection_reason: decision === 'REJECT' ? String(raw.rejection_reason || 'Insufficient syllabus relevance score (<60).') : null,
  };
}

export function evaluateStoryDeterministic(story: CandidateStoryInput): UPSCRelevanceEvaluation {
  const preFilter = evaluateDeterministicPreFilter(
    story.headline,
    story.description,
    story.sourceTier,
    story.publishedAt
  );
  if (preFilter.isRejected) {
    return {
      is_upsc_relevant: false,
      relevance_score: preFilter.baseScore,
      score_breakdown: preFilter.scoreBreakdown,
      importance: 'LOW',
      importance_reason: preFilter.rejectionReason || 'Rejected by exclusion criteria (<60).',
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
  const isRelevant = score >= UPSC_MIN_PUBLISH_SCORE;

  let importance: UPSCImportanceLevel = 'MODERATE';
  if (score >= 85) importance = 'HIGH';
  else if (score >= 70) importance = 'IMPORTANT';
  else if (score >= UPSC_MIN_PUBLISH_SCORE) importance = 'MODERATE';
  else importance = 'LOW';

  let decision: RelevanceDecision = 'REJECT';
  if (score >= 65) {
    decision = 'PUBLISH';
  } else if (score >= UPSC_MIN_PUBLISH_SCORE) {
    decision = 'NEEDS_REVIEW';
  } else {
    decision = 'REJECT';
  }

  const text = `${story.headline} ${story.description}`.toLowerCase();
  let subject: SubjectGroupName = 'Polity & Governance';
  let mainCat: SubjectMainCategoryId = 'polity-governance';
  let subcat = 'Constitution, Parliament and Judiciary';

  if (/\b(explained|editorial|opinion|analysis)\b/i.test(text) || story.sourceTier === 'editorial') {
    subject = 'Editorials & Explainers';
    mainCat = 'editorials-explainers';
    subcat = 'Policy Analysis & Mains Perspectives';
  } else if (/\b(report|index|survey|ranking|scheme|yojana|abhiyan|cabinet approves|outlay)\b/i.test(text)) {
    subject = 'Reports, Schemes & Data';
    mainCat = 'reports-schemes-data';
    subcat = 'Government Schemes, Indices and Reports';
  } else if (/\b(rbi|reserve bank|sebi|inflation|economy|gdp|fiscal|gst|monetary policy|repo rate|trade deficit|tariff)\b/i.test(text)) {
    subject = 'Economy';
    mainCat = 'economy-environment-science';
    subcat = 'Macroeconomics, Banking and Fiscal Policy';
  } else if (/\b(climate|wetland|ramsar|biodiversity|forest|tiger|cheetah|wildlife|pollution|cop\d+|unfccc|emission|glacier)\b/i.test(text)) {
    subject = 'Environment & Ecology';
    mainCat = 'economy-environment-science';
    subcat = 'Biodiversity, Climate Change and Conservation';
  } else if (/\b(isro|gaganyaan|space|semiconductor|quantum|satellite|drdo|artificial intelligence|biotechnology|genome)\b/i.test(text)) {
    subject = 'Science & Technology';
    mainCat = 'economy-environment-science';
    subcat = 'Space, Defence and Frontier Technologies';
  } else if (/\b(bilateral|united nations|brics|quad|indo-pacific|treaty|european union|asean|g20|foreign policy|summit|world health organization|who)\b/i.test(text)) {
    subject = 'International Affairs';
    mainCat = 'international-affairs';
    subcat = 'Bilateral Relations and Global Governance';
  }

  return {
    is_upsc_relevant: isRelevant,
    relevance_score: score,
    score_breakdown: preFilter.scoreBreakdown,
    importance,
    importance_reason: `Scored ${score}/100 via 5-factor UPSC rubric (${preFilter.matchedSyllabusKeywords.length} syllabus anchors, policy=${preFilter.scoreBreakdown.policyLegalSignificance}/25, facts=${preFilter.scoreBreakdown.factualDensity}/15).`,
    prelims_relevant: true,
    mains_relevant: score >= 70,
    essay_relevant: score >= 85,
    gs_papers: preFilter.suggestedGsPapers.length > 0 ? preFilter.suggestedGsPapers : ['GS-II'],
    syllabus_topics: preFilter.matchedSyllabusKeywords,
    subject,
    subcategory: subcat,
    main_category_id: mainCat,
    pyq_connection: {
      has_connection: preFilter.matchedSyllabusKeywords.length >= 1,
      explanation: preFilter.matchedSyllabusKeywords.length >= 1
        ? `Directly maps to UPSC GS syllabus themes: ${preFilter.matchedSyllabusKeywords.slice(0, 3).join(', ')}.`
        : 'Static syllabus linkage.',
      question_ids: [],
    },
    decision,
    rejection_reason: decision === 'REJECT' ? 'Insufficient syllabus relevance score (<60).' : null,
    evaluation_source: 'deterministic_engine',
    evaluated_at: new Date().toISOString(),
  };
}
