/**
 * Centralized Configuration for the UPSC Current Affairs Category & Subcategory Taxonomy.
 *
 * All UI screens, database migrations, Gemini AI classification prompts, and backend
 * ingestion pipelines MUST import category and subcategory definitions from this file.
 * Do not scatter hardcoded category or subcategory strings elsewhere in the codebase.
 */

export type SubjectMainCategoryId =
  | 'international-affairs'
  | 'polity-governance'
  | 'economy-environment-science'
  | 'reports-schemes-data'
  | 'editorials-explainers';

export type MainCategoryId = SubjectMainCategoryId | 'daily-news';

export type EconomyEnvironmentScienceGroup =
  | 'Economy'
  | 'Environment & Ecology'
  | 'Science & Technology';

export type SubjectGroupName =
  | 'International Affairs'
  | 'Polity & Governance'
  | EconomyEnvironmentScienceGroup
  | 'Reports, Schemes & Data'
  | 'Editorials & Explainers';

export type DailyNewsFeedFilterId =
  | 'all'
  | 'today'
  | 'important'
  | 'prelims'
  | 'mains';

export interface DailyNewsFeedFilter {
  id: DailyNewsFeedFilterId;
  label: string;
  shortLabel: string;
  description: string;
}

export const DAILY_NEWS_FEED_FILTERS: DailyNewsFeedFilter[] = [
  {
    id: 'all',
    label: 'All News',
    shortLabel: 'All News',
    description: 'Comprehensive feed of all UPSC-relevant stories across all five subject categories.',
  },
  {
    id: 'today',
    label: "Today's News",
    shortLabel: "Today's News",
    description: 'Stories published or updated on the currently active date in Asia/Kolkata.',
  },
  {
    id: 'important',
    label: 'Most Important',
    shortLabel: 'Most Important',
    description: 'High-impact priority developments that every UPSC aspirant must know.',
  },
  {
    id: 'prelims',
    label: 'Prelims Relevant',
    shortLabel: 'Prelims Relevant',
    description: 'Fact-dense developments, statutory provisions, indices, species, and tech milestones.',
  },
  {
    id: 'mains',
    label: 'Mains Relevant',
    shortLabel: 'Mains Relevant',
    description: 'Analytical issues, constitutional debates, policy reforms, and multi-dimensional topics.',
  },
];

export interface SubjectGroupDefinition {
  id: string;
  title: SubjectGroupName;
  shortTitle: string;
  defaultGsPaper: 'GS 1' | 'GS 2' | 'GS 3' | 'GS 4' | 'Prelims';
  defaultDailyEventCategory:
    | 'Polity'
    | 'Economy'
    | 'International Relations'
    | 'Environment'
    | 'Sci-Tech'
    | 'Security';
  accentColor: string;
  subcategories: readonly string[];
}

export interface MainCategoryDefinition {
  id: MainCategoryId;
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  subtitle: string;
  iconName: 'Newspaper' | 'Globe' | 'Scale' | 'Leaf' | 'Landmark' | 'BookOpen';
  isSubjectCategory: boolean;
  subjectGroups: SubjectGroupDefinition[];
  /** Flat list of all valid subcategories under this main category */
  subcategories: string[];
}

export const EES_SUBJECT_GROUPS: SubjectGroupDefinition[] = [
  {
    id: 'economy',
    title: 'Economy',
    shortTitle: 'Economy',
    defaultGsPaper: 'GS 3',
    defaultDailyEventCategory: 'Economy',
    accentColor: '#0284C7',
    subcategories: [
      'Banking, Finance and Monetary Policy',
      'Growth, Budget, Taxation and Economic Indicators',
      'Agriculture, Industry, Infrastructure and Employment',
      'Trade, Investment and Economic Reports',
    ],
  },
  {
    id: 'environment-ecology',
    title: 'Environment & Ecology',
    shortTitle: 'Environment & Ecology',
    defaultGsPaper: 'GS 3',
    defaultDailyEventCategory: 'Environment',
    accentColor: '#16A34A',
    subcategories: [
      'Climate Change, Pollution and Environmental Policies',
      'Biodiversity, Wildlife and Conservation',
      'Renewable Energy and Sustainable Development',
      'Environmental Reports, Agreements and Disasters',
    ],
  },
  {
    id: 'science-technology',
    title: 'Science & Technology',
    shortTitle: 'Science & Technology',
    defaultGsPaper: 'GS 3',
    defaultDailyEventCategory: 'Sci-Tech',
    accentColor: '#7C3AED',
    subcategories: [
      'Space, Defence and Nuclear Technology',
      'AI, Digital Technology and Emerging Technologies',
      'Biotechnology, Health Research and Scientific Discoveries',
      'Science Policy, Research Missions and Innovation',
    ],
  },
];

export const MAIN_CA_CATEGORIES: MainCategoryDefinition[] = [
  {
    id: 'daily-news',
    code: 'F',
    title: 'Daily News',
    subtitle: 'Comprehensive feed of UPSC-relevant news across all five subject categories.',
    iconName: 'Newspaper',
    isSubjectCategory: false,
    subjectGroups: [],
    subcategories: [],
  },
  {
    id: 'international-affairs',
    code: 'A',
    title: 'International Affairs',
    subtitle: 'Bilateral relations, global groupings, geopolitics, treaties and international summits.',
    iconName: 'Globe',
    isSubjectCategory: true,
    subjectGroups: [
      {
        id: 'international-affairs',
        title: 'International Affairs',
        shortTitle: 'International Affairs',
        defaultGsPaper: 'GS 2',
        defaultDailyEventCategory: 'International Relations',
        accentColor: '#2563EB',
        subcategories: [
          'India and Neighbourhood Relations',
          'Global Relations, Geopolitics and Conflicts',
          'International Organisations, Summits and Agreements',
          'Global Economy, Trade and Climate Cooperation',
        ],
      },
    ],
    subcategories: [
      'India and Neighbourhood Relations',
      'Global Relations, Geopolitics and Conflicts',
      'International Organisations, Summits and Agreements',
      'Global Economy, Trade and Climate Cooperation',
    ],
  },
  {
    id: 'polity-governance',
    code: 'B',
    title: 'Polity & Governance',
    subtitle: 'Constitution, Parliament, Supreme Court judgments, rights, federalism and public policy.',
    iconName: 'Scale',
    isSubjectCategory: true,
    subjectGroups: [
      {
        id: 'polity-governance',
        title: 'Polity & Governance',
        shortTitle: 'Polity & Governance',
        defaultGsPaper: 'GS 2',
        defaultDailyEventCategory: 'Polity',
        accentColor: '#D97706',
        subcategories: [
          'Constitution, Parliament and Judiciary',
          'Government Policies and Governance Reforms',
          'Rights, Federalism and Constitutional Bodies',
          'Elections, Administration and Internal Security',
        ],
      },
    ],
    subcategories: [
      'Constitution, Parliament and Judiciary',
      'Government Policies and Governance Reforms',
      'Rights, Federalism and Constitutional Bodies',
      'Elections, Administration and Internal Security',
    ],
  },
  {
    id: 'economy-environment-science',
    code: 'C',
    title: 'Economy, Environment & Science',
    subtitle: 'Distinct coverage of Economy, Environment & Ecology, and Science & Technology.',
    iconName: 'Leaf',
    isSubjectCategory: true,
    subjectGroups: EES_SUBJECT_GROUPS,
    subcategories: EES_SUBJECT_GROUPS.flatMap((g) => [...g.subcategories]),
  },
  {
    id: 'reports-schemes-data',
    code: 'D',
    title: 'Reports, Schemes & Data',
    subtitle: 'Government schemes, national surveys, international rankings and official statistics.',
    iconName: 'Landmark',
    isSubjectCategory: true,
    subjectGroups: [
      {
        id: 'reports-schemes-data',
        title: 'Reports, Schemes & Data',
        shortTitle: 'Reports, Schemes & Data',
        defaultGsPaper: 'GS 2',
        defaultDailyEventCategory: 'Economy',
        accentColor: '#0D9488',
        subcategories: [
          'Government Schemes and Programmes',
          'National Reports, Surveys and Official Statistics',
          'International Reports, Indices and Rankings',
          'Social Development, Health, Education and Agriculture Data',
        ],
      },
    ],
    subcategories: [
      'Government Schemes and Programmes',
      'National Reports, Surveys and Official Statistics',
      'International Reports, Indices and Rankings',
      'Social Development, Health, Education and Agriculture Data',
    ],
  },
  {
    id: 'editorials-explainers',
    code: 'E',
    title: 'Editorials & Explainers',
    subtitle: 'Authoritative newspaper editorials, policy explainers and multidimensional Mains perspectives.',
    iconName: 'BookOpen',
    isSubjectCategory: true,
    subjectGroups: [
      {
        id: 'editorials-explainers',
        title: 'Editorials & Explainers',
        shortTitle: 'Editorials & Explainers',
        defaultGsPaper: 'GS 2',
        defaultDailyEventCategory: 'Polity',
        accentColor: '#E11D48',
        subcategories: [
          'Newspaper Editorials and Expert Opinions',
          'Governance, Constitution and Public Policy',
          'International Relations, Economy and Environment',
          'Science, Society, Ethics and Mains Perspectives',
        ],
      },
    ],
    subcategories: [
      'Newspaper Editorials and Expert Opinions',
      'Governance, Constitution and Public Policy',
      'International Relations, Economy and Environment',
      'Science, Society, Ethics and Mains Perspectives',
    ],
  },
];

export const SUBJECT_MAIN_CATEGORIES: MainCategoryDefinition[] = MAIN_CA_CATEGORIES.filter(
  (c) => c.isSubjectCategory
);

export const VALID_SUBJECT_MAIN_CATEGORY_IDS: SubjectMainCategoryId[] = [
  'international-affairs',
  'polity-governance',
  'economy-environment-science',
  'reports-schemes-data',
  'editorials-explainers',
];

export const ALL_SUBJECT_GROUPS: SubjectGroupDefinition[] = SUBJECT_MAIN_CATEGORIES.flatMap(
  (c) => c.subjectGroups
);

export const ALL_VALID_SUBCATEGORIES: string[] = ALL_SUBJECT_GROUPS.flatMap((g) => [
  ...g.subcategories,
]);

export const SIMPLIFIED_SUBCATEGORIES_MAP: Record<SubjectMainCategoryId, string[]> = {
  'international-affairs': [
    'India and Neighbourhood Relations',
    'Global Relations, Geopolitics and Conflicts',
    'International Organisations, Summits and Agreements',
    'Global Economy, Trade and Climate Cooperation',
  ],
  'polity-governance': [
    'Constitution, Parliament and Judiciary',
    'Government Policies and Governance Reforms',
    'Rights, Federalism and Constitutional Bodies',
    'Elections, Administration and Internal Security',
  ],
  'economy-environment-science': [
    'Banking, Finance and Monetary Policy',
    'Growth, Budget, Taxation and Economic Indicators',
    'Agriculture, Industry, Infrastructure and Employment',
    'Trade, Investment and Economic Reports',
    'Climate Change, Pollution and Environmental Policies',
    'Biodiversity, Wildlife and Conservation',
    'Renewable Energy and Sustainable Development',
    'Environmental Reports, Agreements and Disasters',
    'Space, Defence and Nuclear Technology',
    'AI, Digital Technology and Emerging Technologies',
    'Biotechnology, Health Research and Scientific Discoveries',
    'Science Policy, Research Missions and Innovation',
  ],
  'reports-schemes-data': [
    'Government Schemes and Programmes',
    'National Reports, Surveys and Official Statistics',
    'International Reports, Indices and Rankings',
    'Social Development, Health, Education and Agriculture Data',
  ],
  'editorials-explainers': [
    'Newspaper Editorials and Expert Opinions',
    'Governance, Constitution and Public Policy',
    'International Relations, Economy and Environment',
    'Science, Society, Ethics and Mains Perspectives',
  ],
};

export interface NormalizedCAClassification {
  mainCategoryId: SubjectMainCategoryId;
  mainCategoryTitle: string;
  subjectGroup: SubjectGroupName;
  subcategory: string;
  gsPaper: 'GS 1' | 'GS 2' | 'GS 3' | 'GS 4' | 'Prelims';
  dailyEventCategory:
    | 'Polity'
    | 'Economy'
    | 'International Relations'
    | 'Environment'
    | 'Sci-Tech'
    | 'Security';
  isMostImportant: boolean;
  isPrelimsRelevant: boolean;
  isMainsRelevant: boolean;
  editorialAuthor?: string;
  aiExplanationDisclaimer?: string;
}

export function getMainCategoryById(id: string): MainCategoryDefinition | undefined {
  return MAIN_CA_CATEGORIES.find((c) => c.id === id);
}

export function getSubcategoriesForMainCategory(
  mainCategoryId: string,
  subjectGroup?: string
): string[] {
  const cat = getMainCategoryById(mainCategoryId);
  if (!cat) return [];
  if (!cat.isSubjectCategory) {
    return ALL_VALID_SUBCATEGORIES;
  }
  if (subjectGroup && subjectGroup !== 'All') {
    const group = cat.subjectGroups.find(
      (g) => g.title.toLowerCase() === subjectGroup.toLowerCase() || g.id === subjectGroup
    );
    if (group) return [...group.subcategories];
  }
  return cat.subcategories;
}

/**
 * Classifies or normalizes any article/event into the strict 5 Subject Main Categories,
 * distinct Subject Groups (separating Economy, Environment & Ecology, and Science & Technology),
 * and one of the 3-4 broad subcategories per group.
 */
export function classifyIntoSimplifiedTaxonomy(input: {
  headline: string;
  summary?: string;
  existingMainCategoryId?: string;
  existingPrimaryCategory?: string;
  existingSubjectGroup?: string;
  existingSubcategory?: string;
  sourceName?: string;
  sourceCategoryHint?: string;
  relevanceScore?: number;
  editorialAuthor?: string;
}): NormalizedCAClassification {
  const text = `${input.headline || ''} ${input.summary || ''} ${input.existingPrimaryCategory || ''} ${input.existingSubcategory || ''} ${input.sourceCategoryHint || ''}`.toLowerCase();
  const sourceLower = (input.sourceName || '').toLowerCase();

  // 1. Check if input already specifies an exact valid subcategory from our central taxonomy
  if (input.existingSubcategory) {
    for (const mainCat of SUBJECT_MAIN_CATEGORIES) {
      for (const group of mainCat.subjectGroups) {
        const matchedSub = group.subcategories.find(
          (s) => s.toLowerCase() === input.existingSubcategory!.trim().toLowerCase()
        );
        if (matchedSub) {
          return buildClassificationResult(
            mainCat,
            group,
            matchedSub,
            text,
            sourceLower,
            input.relevanceScore,
            input.editorialAuthor
          );
        }
      }
    }
  }

  // 2. Determine Main Category & Subject Group based on strong content and source signals
  let mainCatId: SubjectMainCategoryId = 'polity-governance';
  let subjectGroupTitle: SubjectGroupName = 'Polity & Governance';

  const isEditorialSignal =
    input.existingMainCategoryId === 'editorials-explainers' ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('editorial') ||
    (input.sourceCategoryHint || '').toLowerCase().includes('editorial') ||
    sourceLower.includes('editorial') ||
    sourceLower.includes('explained') ||
    sourceLower.includes('opinion') ||
    /\b(editorial|opinion|explained:|way forward|critical analysis|ethical dilemma)\b/i.test(text);

  const isReportsSchemesSignal =
    input.existingMainCategoryId === 'reports-schemes-data' ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('scheme') ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('reports, indices') ||
    /\b(yojana|abhiyan|pm-|pradhan mantri|national mission|global index|world report|ranking|niti aayog report|nsso|nfhs|aishe|census|survey report|index 202)\b/i.test(
      text
    );

  const isInternationalSignal =
    input.existingMainCategoryId === 'international-affairs' ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('international') ||
    /\b(bilateral|brics|quad|g20|asean|saarc|bimstec|sco|united nations|unsc|unjc|icj|diplomatic|lac|indo-pacific|cepa|fta|foreign minister|embassy|geopolit|middle east|west asia|ukraine|russia|china|usa|maldives|bangladesh|sri lanka|nepal|myanmar|pakistan)\b/i.test(
      text
    );

  const isSciTechSignal =
    (input.existingSubjectGroup || '').toLowerCase().includes('science') ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('science') ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('sci-tech') ||
    /\b(isro|drdo|space|satellite|rocket|cryogenic|gaganyaan|chandrayaan|aditya-l1|shukrayaan|nuclear|quantum|artificial intelligence|genai|semiconductor|biotech|vaccine|genome|crispr|mrna|cyber|5g|6g|supercomputer|agni|brahmos|submarine|indigenous aircraft)\b/i.test(
      text
    );

  const isEnvironmentSignal =
    (input.existingSubjectGroup || '').toLowerCase().includes('environment') ||
    (input.existingPrimaryCategory || '').toLowerCase().includes('environment') ||
    /\b(climate change|cop\d+|unfccc|ipcc|biodiversity|wildlife|tiger reserve|national park|ramsar|wetland|mangrove|coral|pollution|air quality|green hydrogen|solar|wind energy|renewable|deforestation|cyclone|glacier|glacial|afforestation|endangered|iucn|cites)\b/i.test(
      text
    );

  const isEconomySignal =
    (input.existingSubjectGroup || '').toLowerCase() === 'economy' ||
    (input.existingPrimaryCategory || '').toLowerCase() === 'economy' ||
    /\b(rbi|reserve bank|monetary policy|repo rate|inflation|cpi|wpi|gdp|gst|fiscal deficit|union budget|taxation|sebi|banking|lcr|npas|msme|export|import|current account|fdi|forex|rupee|uli|upi|agriculture credit|msp|industrial production|iip)\b/i.test(
      text
    );

  if (isEditorialSignal) {
    mainCatId = 'editorials-explainers';
    subjectGroupTitle = 'Editorials & Explainers';
  } else if (isReportsSchemesSignal) {
    mainCatId = 'reports-schemes-data';
    subjectGroupTitle = 'Reports, Schemes & Data';
  } else if (isSciTechSignal) {
    mainCatId = 'economy-environment-science';
    subjectGroupTitle = 'Science & Technology';
  } else if (isEnvironmentSignal) {
    mainCatId = 'economy-environment-science';
    subjectGroupTitle = 'Environment & Ecology';
  } else if (isEconomySignal) {
    mainCatId = 'economy-environment-science';
    subjectGroupTitle = 'Economy';
  } else if (isInternationalSignal) {
    mainCatId = 'international-affairs';
    subjectGroupTitle = 'International Affairs';
  } else {
    mainCatId = 'polity-governance';
    subjectGroupTitle = 'Polity & Governance';
  }

  const mainCat = SUBJECT_MAIN_CATEGORIES.find((c) => c.id === mainCatId)!;
  const group =
    mainCat.subjectGroups.find((g) => g.title === subjectGroupTitle) || mainCat.subjectGroups[0];

  // 3. Pick the exact Subcategory (from the 4 broad subcategories of that group)
  const subcategory = pickBestSubcategory(group, text, sourceLower);

  return buildClassificationResult(
    mainCat,
    group,
    subcategory,
    text,
    sourceLower,
    input.relevanceScore,
    input.editorialAuthor
  );
}

function pickBestSubcategory(
  group: SubjectGroupDefinition,
  text: string,
  sourceLower: string
): string {
  const subs = group.subcategories;

  switch (group.title) {
    case 'International Affairs': {
      if (
        /\b(china|pakistan|bangladesh|sri lanka|nepal|bhutan|maldives|myanmar|afghanistan|lac|border|neighbourhood|indian ocean|bimstec|saarc)\b/i.test(
          text
        )
      ) {
        return subs[0]; // India and Neighbourhood Relations
      }
      if (
        /\b(un\b|united nations|unsc|brics|g20|quad|sco|asean|nato|who|icj|summit|treaty|convention|declaration|agreement|pact)\b/i.test(
          text
        )
      ) {
        return subs[2]; // International Organisations, Summits and Agreements
      }
      if (
        /\b(trade|fta|cepa|tariff|supply chain|wto|imf|world bank|climate finance|cbam|corridor|imec|investment|sanctions|currency)\b/i.test(
          text
        )
      ) {
        return subs[3]; // Global Economy, Trade and Climate Cooperation
      }
      return subs[1]; // Global Relations, Geopolitics and Conflicts
    }

    case 'Polity & Governance': {
      if (
        /\b(supreme court|high court|constitution|article \d+|parliament|lok sabha|rajya sabha|bill|act|amendment|bench|collegium|basic structure|judicial|cbi|chief justice)\b/i.test(
          text
        )
      ) {
        return subs[0]; // Constitution, Parliament and Judiciary
      }
      if (
        /\b(fundamental right|scheduled caste|scheduled tribe|obc|reservation|sub-classification|federalism|governor|centre-state|finance commission|cag|upsc|nhrc|cic|constitutional bod)\b/i.test(
          text
        )
      ) {
        return subs[2]; // Rights, Federalism and Constitutional Bodies
      }
      if (
        /\b(election|eci|electoral|delimitation|one nation one election|internal security|naxal|lwe|terrorism|uapa|afspa|border security|cyber security|police|administration|civil service)\b/i.test(
          text
        )
      ) {
        return subs[3]; // Elections, Administration and Internal Security
      }
      return subs[1]; // Government Policies and Governance Reforms
    }

    case 'Economy': {
      if (
        /\b(rbi|reserve bank|monetary policy|repo|lcr|liquidity|bank|nbfc|sebi|upi|uli|digital rupee|cbdc|inflation|interest rate|credit|financial stability)\b/i.test(
          text
        )
      ) {
        return subs[0]; // Banking, Finance and Monetary Policy
      }
      if (
        /\b(agriculture|farmer|msp|crop|fertilizer|industry|manufacturing|pli|msme|infrastructure|railway|highway|port|logistics|employment|labour|skill)\b/i.test(
          text
        )
      ) {
        return subs[2]; // Agriculture, Industry, Infrastructure and Employment
      }
      if (
        /\b(export|import|trade|fta|fdi|forex|balance of payments|current account|world bank|imf|economic report|External debt)\b/i.test(
          text
        )
      ) {
        return subs[3]; // Trade, Investment and Economic Reports
      }
      return subs[1]; // Growth, Budget, Taxation and Economic Indicators
    }

    case 'Environment & Ecology': {
      if (
        /\b(tiger|elephant|leopard|cheetah|species|biodiversity|wildlife|national park|sanctuary|biosphere|ramsar|wetland|mangrove|coral|forest|iucn|conservation|cop16|cbd)\b/i.test(
          text
        )
      ) {
        return subs[1]; // Biodiversity, Wildlife and Conservation
      }
      if (
        /\b(solar|wind|green hydrogen|renewable|biofuel|ethanol|electric vehicle|battery|sustainable development|circular economy|energy transition|net zero)\b/i.test(
          text
        )
      ) {
        return subs[2]; // Renewable Energy and Sustainable Development
      }
      if (
        /\b(disaster|cyclone|flood|landslide|earthquake|glacier|glof|heatwave|wmo|unep|ipcc|report|index|agreement|treaty)\b/i.test(
          text
        )
      ) {
        return subs[3]; // Environmental Reports, Agreements and Disasters
      }
      return subs[0]; // Climate Change, Pollution and Environmental Policies
    }

    case 'Science & Technology': {
      if (
        /\b(isro|space|satellite|launch|orbit|gaganyaan|chandrayaan|aditya|shukrayaan|cryogenic|drdo|missile|defence|radar|submarine|nuclear|reactor|thorium)\b/i.test(
          text
        )
      ) {
        return subs[0]; // Space, Defence and Nuclear Technology
      }
      if (
        /\b(ai\b|artificial intelligence|quantum|semiconductor|chip|cyber|digital|5g|6g|blockchain|supercomputer|telecom|robotics|deepfake)\b/i.test(
          text
        )
      ) {
        return subs[1]; // AI, Digital Technology and Emerging Technologies
      }
      if (
        /\b(biotech|bioe3|vaccine|virus|disease|health|medical|amr|antimicrobial|genome|dna|rna|crispr|stem cell|tuberculosis|malaria|pharma)\b/i.test(
          text
        )
      ) {
        return subs[2]; // Biotechnology, Health Research and Scientific Discoveries
      }
      return subs[3]; // Science Policy, Research Missions and Innovation
    }

    case 'Reports, Schemes & Data': {
      if (
        /\b(yojana|scheme|abhiyan|mission|pm-|pradhan mantri|incentive|subsidy|cabinet approves|portal)\b/i.test(
          text
        )
      ) {
        return subs[0]; // Government Schemes and Programmes
      }
      if (
        /\b(global|world|international|un\b|undp|wef|wipo|imf|who|fao|wmo|index|ranking)\b/i.test(
          text
        )
      ) {
        return subs[2]; // International Reports, Indices and Rankings
      }
      if (
        /\b(health|education|nutrition|poverty|stunting|literacy|school|university|maternal|rural|agriculture data|food security)\b/i.test(
          text
        )
      ) {
        return subs[3]; // Social Development, Health, Education and Agriculture Data
      }
      return subs[1]; // National Reports, Surveys and Official Statistics
    }

    case 'Editorials & Explainers': {
      if (
        /\b(constitution|supreme court|parliament|governor|federalism|election|rights|judiciary|governance|policy|regulation|citizen)\b/i.test(
          text
        )
      ) {
        return subs[1]; // Governance, Constitution and Public Policy
      }
      if (
        /\b(foreign|geopolit|china|usa|russia|brics|quad|trade|economy|rbi|inflation|gdp|climate|environment|energy|emission)\b/i.test(
          text
        )
      ) {
        return subs[2]; // International Relations, Economy and Environment
      }
      if (
        /\b(science|ai\b|technology|space|biotech|ethics|society|women|caste|education|health|history|culture|archaeolog)\b/i.test(
          text
        )
      ) {
        return subs[3]; // Science, Society, Ethics and Mains Perspectives
      }
      if (sourceLower.includes('hindu') || sourceLower.includes('express')) {
        return subs[0]; // Newspaper Editorials and Expert Opinions
      }
      return subs[0];
    }
  }
}

function buildClassificationResult(
  mainCat: MainCategoryDefinition,
  group: SubjectGroupDefinition,
  subcategory: string,
  text: string,
  sourceLower: string,
  relevanceScore?: number,
  editorialAuthor?: string
): NormalizedCAClassification {
  let gsPaper = group.defaultGsPaper;
  if (/\b(archaeolog|harappa|indus valley|porunai|unesco|heritage|temple|freedom struggle|geography|cyclone|glacier|urbanization|caste|women)\b/i.test(text)) {
    gsPaper = 'GS 1';
  } else if (/\b(ethics|integrity|probity|aptitude|emotional intelligence)\b/i.test(text)) {
    gsPaper = 'GS 4';
  }

  const score = relevanceScore ?? 85;
  const isMostImportant =
    score >= 86 ||
    sourceLower.includes('pib') ||
    sourceLower.includes('rbi') ||
    /\b(supreme court|constitution bench|cabinet|isro|rbi|brics|cop16|budget|monetary policy|national mission)\b/i.test(
      text
    );

  const isPrelimsRelevant =
    mainCat.id !== 'editorials-explainers' ||
    /\b(article \d+|act|index|mission|species|satellite|treaty|committee)\b/i.test(text);

  const isMainsRelevant =
    mainCat.id === 'editorials-explainers' ||
    score >= 80 ||
    /\b(reform|policy|constitutional|bilateral|framework|challenge|significance|impact|governance|sustainable)\b/i.test(
      text
    );

  const isEditorial = mainCat.id === 'editorials-explainers';

  return {
    mainCategoryId: mainCat.id as SubjectMainCategoryId,
    mainCategoryTitle: mainCat.title,
    subjectGroup: group.title,
    subcategory,
    gsPaper,
    dailyEventCategory: group.defaultDailyEventCategory,
    isMostImportant,
    isPrelimsRelevant,
    isMainsRelevant,
    editorialAuthor: isEditorial
      ? editorialAuthor ||
        (sourceLower.includes('hindu')
          ? 'The Hindu Editorial Board'
          : sourceLower.includes('express')
          ? 'The Indian Express Explained Desk'
          : 'Editorial Desk')
      : undefined,
    aiExplanationDisclaimer: isEditorial
      ? 'Original editorial viewpoint belongs to the cited author and publisher. The UPSC syllabus synthesis, key takeaways, and Mains question below are AI-structured educational explanations for exam preparation.'
      : undefined,
  };
}

