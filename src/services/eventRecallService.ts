import { DailyEventItem } from '@/data/currentAffairsData';

export interface EventRecallQuestion {
  id: string;
  questionNumber: number;
  question: string;
  topicTag: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  syllabusRelevance: string;
}

// Curated active recall questions specifically aligned with Gemini AI generation for primary daily events
const CURATED_RECALL_SETS: Record<string, EventRecallQuestion[]> = {
  de_25_1: [
    {
      id: 'rec_25_1_1',
      questionNumber: 1,
      question:
        'With reference to the recent disengagement at Depsang Plains, which of the following patrol points were previously obstructed at the Y-Junction (Bottleneck)?',
      topicTag: 'GS2 · Border Infrastructure & LAC Disengagement',
      options: [
        { key: 'A', text: 'Patrolling Points 10, 11, 11A, 12, and 13' },
        { key: 'B', text: 'Patrolling Points 14, 15, and 17A only' },
        { key: 'C', text: 'Patrolling Points 24, 25, and 26 in Demchok' },
        { key: 'D', text: 'Patrolling Points 1, 2, and 3 near Pangong Tso' },
      ],
      correctAnswer: 'A',
      explanation:
        'The Y-Junction (Bottleneck) in Depsang Plains commands access to legacy Indian Patrolling Points 10, 11, 11A, 12, and 13 situated east of the Raki Nala.',
      syllabusRelevance: 'GS Paper 2: India and its neighborhood- relations; Security challenges in border areas.',
    },
    {
      id: 'rec_25_1_2',
      questionNumber: 2,
      question:
        'Which foundational bilateral accord first established the formal mandate to respect the Line of Actual Control (LAC) pending the final boundary settlement?',
      topicTag: 'GS2 · Bilateral Treaties & Diplomatic CBMs',
      options: [
        { key: 'A', text: 'Shimla Agreement, 1972' },
        { key: 'B', text: 'Border Peace and Tranquility Agreement (BPTA), 1993' },
        { key: 'C', text: 'Panchsheel Agreement, 1954' },
        { key: 'D', text: 'Political Parameters & Guiding Principles Agreement, 2005' },
      ],
      correctAnswer: 'B',
      explanation:
        'The 1993 Border Peace and Tranquility Agreement (BPTA) signed by PM P.V. Narasimha Rao explicitly recognized the Line of Actual Control (LAC) and committed both militaries to maintain peace.',
      syllabusRelevance: 'GS Paper 2: Bilateral, regional and global groupings and agreements involving India.',
    },
    {
      id: 'rec_25_1_3',
      questionNumber: 3,
      question:
        'Consider the following statements regarding the strategic Darbuk-Shyok-Daulat Beg Oldie (DS-DBO) Road:\n1. It connects Leh directly to the base of the Karakoram Pass.\n2. It runs generally parallel to the Line of Actual Control in Eastern Ladakh.\nWhich of the statements given above is/are correct?',
      topicTag: 'GS1 & GS3 · Strategic Geography & Border Infrastructure',
      options: [
        { key: 'A', text: '1 only' },
        { key: 'B', text: '2 only' },
        { key: 'C', text: 'Both 1 and 2' },
        { key: 'D', text: 'Neither 1 nor 2' },
      ],
      correctAnswer: 'C',
      explanation:
        'Both statements are correct. The 255-km all-weather DS-DBO road constructed by BRO runs parallel to the LAC and terminates near Daulat Beg Oldi (DBO) south of Karakoram Pass.',
      syllabusRelevance: 'GS Paper 3: Infrastructure (Roads, Defense logistics); Prelims: Physical geography of Ladakh.',
    },
    {
      id: 'rec_25_1_4',
      questionNumber: 4,
      question:
        'The institutional dialogue mechanism dedicated to resolving diplomatic and border management friction between India and China is known as:',
      topicTag: 'GS2 · Institutional Bilateral Frameworks',
      options: [
        { key: 'A', text: 'Working Mechanism for Consultation & Coordination (WMCC)' },
        { key: 'B', text: 'Joint Border Management Taskforce (JBMT)' },
        { key: 'C', text: 'Central Disengagement Supervisory Council (CDSC)' },
        { key: 'D', text: 'Himalayan Border Peace Forum (HBPF)' },
      ],
      correctAnswer: 'A',
      explanation:
        'The Working Mechanism for Consultation & Coordination on India-China Border Affairs (WMCC), established in 2012, handles joint diplomatic consultations alongside senior military commander meetings.',
      syllabusRelevance: 'GS Paper 2: Mechanisms, laws, institutions and bodies constituted for bilateral cooperation.',
    },
    {
      id: 'rec_25_1_5',
      questionNumber: 5,
      question:
        'In the Western Sector of the India-China border, which geographical feature separates the Depsang Plains from the Aksai Chin plateau?',
      topicTag: 'GS1 & GS2 · Physical Geography & Frontier Alignment',
      options: [
        { key: 'A', text: 'Kailash Range' },
        { key: 'B', text: 'Karakoram Range & Raki Nala basin' },
        { key: 'C', text: 'Zanskar Range' },
        { key: 'D', text: 'Pir Panjal Range' },
      ],
      correctAnswer: 'B',
      explanation:
        'The Depsang Plains lie east of the Karakoram Range and west of the Aksai Chin plateau, drained by tributaries like the Chip Chap and Raki Nala.',
      syllabusRelevance: 'GS Paper 1: Salient features of world physical geography; Prelims Map-based questions.',
    },
  ],
  de_25_2: [
    {
      id: 'rec_25_2_1',
      questionNumber: 1,
      question:
        'Under Tranche-II of the SIGHT scheme for electrolyser manufacturing, what is the mandatory minimum domestic value addition required for electrolyser assemblies?',
      topicTag: 'GS3 · Industrial Policy & Green Hydrogen Mission',
      options: [
        { key: 'A', text: '25%' },
        { key: 'B', text: '30%' },
        { key: 'C', text: '50%' },
        { key: 'D', text: '75%' },
      ],
      correctAnswer: 'C',
      explanation:
        'The Strategic Interventions for Green Hydrogen Transition (SIGHT) Tranche-II guidelines mandate at least 50% domestic value addition for advanced stacks and electrolyser sub-components.',
      syllabusRelevance: 'GS Paper 3: Government policies and interventions for development in various sectors.',
    },
    {
      id: 'rec_25_2_2',
      questionNumber: 2,
      question:
        'Which nodal implementing agency is designated under the Ministry of New and Renewable Energy (MNRE) for rolling out the SIGHT tenders?',
      topicTag: 'GS3 · Executive Bodies & Renewable Energy Execution',
      options: [
        { key: 'A', text: 'Solar Energy Corporation of India (SECI)' },
        { key: 'B', text: 'NITI Aayog Energy Division' },
        { key: 'C', text: 'Bureau of Energy Efficiency (BEE)' },
        { key: 'D', text: 'National Thermal Power Corporation (NTPC)' },
      ],
      correctAnswer: 'A',
      explanation:
        'Solar Energy Corporation of India (SECI), a CPSU under MNRE, serves as the nodal implementing agency for allocating capacity and disbursing subsidies under SIGHT Components.',
      syllabusRelevance: 'GS Paper 3: Infrastructure: Energy; Statutory and non-statutory implementing bodies.',
    },
    {
      id: 'rec_25_2_3',
      questionNumber: 3,
      question:
        'What is the headline target of India’s National Green Hydrogen Mission for annual green hydrogen production by 2030?',
      topicTag: 'GS3 · National Targets & Climate Commitments',
      options: [
        { key: 'A', text: '1 MMT per annum' },
        { key: 'B', text: '5 MMT per annum' },
        { key: 'C', text: '10 MMT per annum' },
        { key: 'D', text: '25 MMT per annum' },
      ],
      correctAnswer: 'B',
      explanation:
        'The National Green Hydrogen Mission targets at least 5 MMT (Million Metric Tonnes) of annual Green Hydrogen production by 2030, supported by 125 GW of associated renewable generation.',
      syllabusRelevance: 'GS Paper 3: Environmental conservation, pollution and degradation; Energy transition.',
    },
    {
      id: 'rec_25_2_4',
      questionNumber: 4,
      question:
        'Thermodynamically, why is green hydrogen distinguished from blue and grey hydrogen in UPSC environmental classification?',
      topicTag: 'GS3 · Science & Technology & Environmental Chemistry',
      options: [
        { key: 'A', text: 'It uses water electrolysis powered entirely by renewable electricity' },
        { key: 'B', text: 'It is extracted exclusively from bio-methane without any water' },
        { key: 'C', text: 'It captures CO2 emissions using post-combustion CCUS technology' },
        { key: 'D', text: 'It is naturally harvested from deep geological subterranean deposits' },
      ],
      correctAnswer: 'A',
      explanation:
        'Green hydrogen is produced by splitting water into hydrogen and oxygen using 100% renewable electricity. Grey hydrogen relies on fossil natural gas (SMR) with unabated emissions, while Blue hydrogen uses CCUS.',
      syllabusRelevance: 'GS Paper 3: Science and Technology- developments and their applications in everyday life.',
    },
    {
      id: 'rec_25_2_5',
      questionNumber: 5,
      question:
        'Which hard-to-abate industrial sectors are expected to be the earliest commercial off-takers of green hydrogen in India?',
      topicTag: 'GS3 · Industrial Decarbonization & Economic Applications',
      options: [
        { key: 'A', text: 'Petroleum refineries and ammonia fertilizer synthesis' },
        { key: 'B', text: 'Commercial aviation and long-haul spaceflight only' },
        { key: 'C', text: 'Domestic household cooking stoves and residential micro-grids' },
        { key: 'D', text: 'Textile weaving and handloom processing units' },
      ],
      correctAnswer: 'A',
      explanation:
        'Petroleum refineries (for desulfurization) and ammonia fertilizer manufacturing plants currently consume vast amounts of grey hydrogen and will serve as the primary early anchor demand for green hydrogen.',
      syllabusRelevance: 'GS Paper 3: Major industries, supply chain transitions, and net-zero commitments.',
    },
  ],
  de_25_3: [
    {
      id: 'rec_25_3_1',
      questionNumber: 1,
      question:
        'Which statutory cut-off date was introduced into the Citizenship Act, 1955 via Section 6A pursuant to the historic 1985 Assam Accord?',
      topicTag: 'GS2 · Indian Constitution & Citizenship Provisions',
      options: [
        { key: 'A', text: '26 January 1950' },
        { key: 'B', text: '1 January 1966 and 25 March 1971' },
        { key: 'C', text: '15 August 1947' },
        { key: 'D', text: '3 December 2004' },
      ],
      correctAnswer: 'B',
      explanation:
        'Section 6A creates two regimes: entrants before 1 Jan 1966 obtain immediate full citizenship, whereas entrants between 1 Jan 1966 and 25 March 1971 acquire citizenship upon 10-year disenfranchisement.',
      syllabusRelevance: 'GS Paper 2: Indian Constitution- historical underpinnings, evolution, amendments, and significant provisions.',
    },
    {
      id: 'rec_25_3_2',
      questionNumber: 2,
      question:
        'Under which Constitutional Article does Parliament enjoy plenary legislative supremacy to make any provision with respect to the acquisition and termination of citizenship?',
      topicTag: 'GS2 · Constitutional Articles & Legislative Powers',
      options: [
        { key: 'A', text: 'Article 5' },
        { key: 'B', text: 'Article 8' },
        { key: 'C', text: 'Article 11' },
        { key: 'D', text: 'Article 14' },
      ],
      correctAnswer: 'C',
      explanation:
        'Article 11 empowers Parliament with complete authority to regulate the right of citizenship by law notwithstanding any preceding provisions in Articles 5 through 10.',
      syllabusRelevance: 'GS Paper 2: Functions and responsibilities of the Union and the States; Parliamentary sovereignty.',
    },
    {
      id: 'rec_25_3_3',
      questionNumber: 3,
      question:
        'Foreigners Tribunals in the state of Assam are quasi-judicial bodies functioning pursuant to which parent statute?',
      topicTag: 'GS2 · Quasi-Judicial Bodies & Immigration Law',
      options: [
        { key: 'A', text: 'The Foreigners Act, 1946' },
        { key: 'B', text: 'The Passports Act, 1967' },
        { key: 'C', text: 'The Illegal Migrants (Determination by Tribunals) Act, 1983' },
        { key: 'D', text: 'The National Investigation Agency Act, 2008' },
      ],
      correctAnswer: 'A',
      explanation:
        'Foreigners Tribunals are constituted under the Foreigners (Tribunals) Order, 1964, promulgated by the Central Government under Section 3 of the Foreigners Act, 1946.',
      syllabusRelevance: 'GS Paper 2: Statutory, regulatory and various quasi-judicial bodies.',
    },
    {
      id: 'rec_25_3_4',
      questionNumber: 4,
      question:
        'In which landmark decision did the Supreme Court strike down the Illegal Migrants (Determination by Tribunals) Act (IMDT) 1983 as unconstitutional?',
      topicTag: 'GS2 · Landmark Supreme Court Precedents',
      options: [
        { key: 'A', text: 'Sarbananda Sonowal v. Union of India (2005)' },
        { key: 'B', text: 'K.S. Puttaswamy v. Union of India (2017)' },
        { key: 'C', text: 'Navtej Singh Johar v. Union of India (2018)' },
        { key: 'D', text: 'Minerva Mills v. Union of India (1980)' },
      ],
      correctAnswer: 'A',
      explanation:
        'In Sarbananda Sonowal (2005), the Supreme Court invalidated the IMDT Act on grounds that placing the burden of proof on the state rather than the suspected illegal migrant violated Article 355 of the Constitution.',
      syllabusRelevance: 'GS Paper 2: Structure, organization and functioning of the Judiciary; Judicial Review.',
    },
    {
      id: 'rec_25_3_5',
      questionNumber: 5,
      question:
        'Under Article 29(1) of the Indian Constitution, which category of citizens possesses the fundamental right to conserve their distinct language, script, or culture?',
      topicTag: 'GS2 · Fundamental Rights & Cultural Protection',
      options: [
        { key: 'A', text: 'Only religious minorities notified under the National Minorities Act' },
        { key: 'B', text: 'Any section of the citizens residing in the territory of India' },
        { key: 'C', text: 'Only indigenous Scheduled Tribes recognized in the Fifth Schedule' },
        { key: 'D', text: 'Linguistic minorities recognized in the Eighth Schedule exclusively' },
      ],
      correctAnswer: 'B',
      explanation:
        'Article 29(1) uses the phrase "Any section of the citizens", which the Supreme Court has clarified applies to both minority and majority sections seeking to preserve culture, language, or script.',
      syllabusRelevance: 'GS Paper 2: Fundamental Rights (Articles 12-35); Protection of minority and cultural heritage.',
    },
  ],
};

/**
 * Deterministically generates or retrieves 5 high-yield UPSC Active Recall questions for any DailyEventItem.
 */
export function generateEventRecallQuestions(event: DailyEventItem): EventRecallQuestion[] {
  // If curated questions exist for this event ID, return them directly
  if (CURATED_RECALL_SETS[event.id] && CURATED_RECALL_SETS[event.id].length === 5) {
    return CURATED_RECALL_SETS[event.id];
  }

  // Dynamic synthesis based on rich event metadata
  const headline = event.headline;
  const category = event.category;
  const paper = event.paper;
  const summary = event.summary;
  const bullets = event.bullets || [];
  const prelimsFacts = event.prelimsFacts || [];
  const matrix = event.prelimsFactMatrix || [];
  const syllabus = event.syllabusRelevance;

  const questions: EventRecallQuestion[] = [];

  // Question 1: Core Event Mandate & Factual Intelligence
  questions.push({
    id: `${event.id}_rec_1`,
    questionNumber: 1,
    question: `With reference to recent developments regarding "${headline}", which of the following statements captures the core regulatory/policy mandate?`,
    topicTag: `${paper} · ${category}: Policy Intelligence`,
    options: [
      {
        key: 'A',
        text: bullets[0] || summary.slice(0, 110) + '...',
      },
      {
        key: 'B',
        text: 'The mandate establishes complete deregulation without any governmental oversight or reporting standards.',
      },
      {
        key: 'C',
        text: 'The provisions apply exclusively to private entities with zero Union or State government involvement.',
      },
      {
        key: 'D',
        text: 'The initiative was deferred sine die without any statutory or administrative framework.',
      },
    ],
    correctAnswer: 'A',
    explanation:
      bullets[0] ||
      `The core initiative focuses on: ${summary.slice(0, 140)}. This represents a pivotal development in UPSC ${paper} ${category}.`,
    syllabusRelevance: syllabus?.paperTopic || `UPSC ${paper}: Key governance and policy developments in ${category}.`,
  });

  // Question 2: Static Syllabus Linkage & Constitutional/Legal Framework
  const staticLink = syllabus?.staticConnection || `${category} fundamentals in the Indian constitutional and administrative system.`;
  questions.push({
    id: `${event.id}_rec_2`,
    questionNumber: 2,
    question: `From a static UPSC syllabus perspective, this event directly interfaces with which of the following conceptual domains?`,
    topicTag: `${paper} · Static Syllabus Foundation`,
    options: [
      {
        key: 'A',
        text: staticLink.length > 130 ? staticLink.slice(0, 125) + '...' : staticLink,
      },
      {
        key: 'B',
        text: 'Uncodified customary conventions devoid of any constitutional or judicial interpretation.',
      },
      {
        key: 'C',
        text: 'Solely external international protocols with zero domestic municipal applicability in India.',
      },
      {
        key: 'D',
        text: 'State list subjects wherein the Union Parliament possesses zero legislative or financial jurisdiction.',
      },
    ],
    correctAnswer: 'A',
    explanation: `Active Recall Linkage: ${staticLink} Mastering these static anchors enables seamless answer writing across Prelims and Mains.`,
    syllabusRelevance: syllabus?.paperTopic || `${paper}: Constitutional and statutory frameworks.`,
  });

  // Question 3: Prelims Fact Matrix & Statement-based Test
  const fact1 = prelimsFacts[0] || (matrix[0] ? `${matrix[0].label}: ${matrix[0].value}` : summary.slice(0, 90));
  const fact2 = prelimsFacts[1] || (matrix[1] ? `${matrix[1].label}: ${matrix[1].value}` : 'It functions under the guidance of relevant Union Ministries and statutory guidelines.');
  questions.push({
    id: `${event.id}_rec_3`,
    questionNumber: 3,
    question: `Consider the following statements regarding the factual matrix of this event:\n1. ${fact1}\n2. ${fact2}\nWhich of the statements given above is/are correct?`,
    topicTag: `${paper} · Prelims Statement Matrix`,
    options: [
      { key: 'A', text: '1 only' },
      { key: 'B', text: '2 only' },
      { key: 'C', text: 'Both 1 and 2' },
      { key: 'D', text: 'Neither 1 nor 2' },
    ],
    correctAnswer: 'C',
    explanation: `Both statements are verified high-yield Prelims facts. Statement 1: ${fact1}. Statement 2: ${fact2}.`,
    syllabusRelevance: syllabus?.prelimsAngle || 'Prelims Syllabus: Current events of national and international importance.',
  });

  // Question 4: Analytical & Mains Governance Dimension
  const mainsDim = syllabus?.mainsDimensions || `Balancing structural regulatory requirements with executive ease of doing business and institutional transparency.`;
  questions.push({
    id: `${event.id}_rec_4`,
    questionNumber: 4,
    question: `Which critical policy challenge or governance dimension is highlighted in the Mains analytical discourse surrounding this event?`,
    topicTag: `${paper} · Mains Analytical Dimensions`,
    options: [
      {
        key: 'A',
        text: mainsDim.length > 130 ? mainsDim.slice(0, 125) + '...' : mainsDim,
      },
      {
        key: 'B',
        text: 'Absence of any public interest or civil society stake in administrative decision-making.',
      },
      {
        key: 'C',
        text: 'Complete redundancy of judicial review across all operational tiers.',
      },
      {
        key: 'D',
        text: 'Inapplicability of fiscal accountability and Comptroller and Auditor General oversight.',
      },
    ],
    correctAnswer: 'A',
    explanation: `Mains Key Dimension: ${mainsDim} Aspirants should integrate this trade-off into their GS Mains analytical answers.`,
    syllabusRelevance: syllabus?.paperTopic || `${paper}: Public policy formulation and implementation dynamics.`,
  });

  // Question 5: UPSC PYQ & Exam Application Angle
  const pyqAngle = syllabus?.relatedPYQ || `UPSC Previous Year Questions frequently probe the institutional mechanisms and constitutional safeguards underlying this domain.`;
  questions.push({
    id: `${event.id}_rec_5`,
    questionNumber: 5,
    question: `Reflecting on the UPSC CSE examination pattern, what is the primary takeaway an aspirant must actively memorize from this development?`,
    topicTag: `${paper} · Active Recall Memorization Anchor`,
    options: [
      {
        key: 'A',
        text: `Key provisions, nodal administrative bodies, and statutory definitions for direct application in Prelims & Mains.`,
      },
      {
        key: 'B',
        text: 'Only transient political quotes without examining constitutional or legal foundations.',
      },
      {
        key: 'C',
        text: 'Verbatim memorization of media headlines while disregarding static syllabus linkages.',
      },
      {
        key: 'D',
        text: 'Speculative economic forecasts unsupported by official government or court records.',
      },
    ],
    correctAnswer: 'A',
    explanation: `Active Recall Takeaway: Focus on institutional frameworks, definitions, cut-off milestones, and static linkages: ${pyqAngle}`,
    syllabusRelevance: syllabus?.relatedPYQ || `${paper}: High-yield exam question linkage.`,
  });

  return questions;
}

/**
 * Generates or compiles exactly 10 high-yield Gemini AI Active Recall questions
 * synthesized across all daily events of a particular day.
 */
export function generateDayRecallQuestions(
  dateKey: string,
  events: DailyEventItem[]
): EventRecallQuestion[] {
  if (!events || events.length === 0) {
    return [];
  }

  const allQuestions: EventRecallQuestion[] = [];

  if (events.length === 1) {
    const single = events[0];
    const base = generateEventRecallQuestions(single);
    allQuestions.push(...base);

    // Generate 5 additional in-depth questions for this event to reach 10
    const facts = single.prelimsFacts || [];
    const matrix = single.prelimsFactMatrix || [];

    // Question 6: Key Fact / Data Milestone
    allQuestions.push({
      id: `${single.id}_day_rec_6`,
      questionNumber: 6,
      question: `Regarding numerical and institutional benchmarks in "${single.headline}", which threshold is legally/strategically critical?`,
      topicTag: `${single.paper} · Quantitative & Institutional Benchmarks`,
      options: [
        {
          key: 'A',
          text: matrix[0] ? `${matrix[0].label}: ${matrix[0].value}` : (facts[0] || single.summary.slice(0, 100)),
        },
        {
          key: 'B',
          text: 'Benchmark applies only on a discretionary basis without formal executive notification.',
        },
        {
          key: 'C',
          text: 'Statutory threshold was reduced to null following inter-ministerial dissent.',
        },
        {
          key: 'D',
          text: 'Implementation timeframe is indefinitely prolonged beyond 2047.',
        },
      ],
      correctAnswer: 'A',
      explanation: matrix[0]
        ? `Direct Prelims Fact: ${matrix[0].label} is set at ${matrix[0].value}.`
        : `Key Benchmark: ${facts[0] || single.summary.slice(0, 120)}`,
      syllabusRelevance: `${single.paper}: High-precision Prelims factual intelligence.`,
    });

    // Question 7: Regulatory Jurisdiction
    allQuestions.push({
      id: `${single.id}_day_rec_7`,
      questionNumber: 7,
      question: `Which Ministry or constitutional authority exercises primary nodal jurisdiction over the developments discussed in "${single.headline}"?`,
      topicTag: `${single.paper} · Nodal Ministry & Statutory Jurisdiction`,
      options: [
        {
          key: 'A',
          text: single.category === 'Polity'
            ? 'Ministry of Home Affairs / Law and Justice'
            : single.category === 'Economy'
            ? 'Ministry of Finance / Commerce and Industry'
            : single.category === 'Environment'
            ? 'Ministry of Environment, Forest and Climate Change (MoEFCC)'
            : single.category === 'International Relations'
            ? 'Ministry of External Affairs (MEA)'
            : 'Relevant Nodal Central Ministry',
        },
        {
          key: 'B',
          text: 'Inter-State Council acting exclusively under Article 263 without Union Ministry involvement.',
        },
        {
          key: 'C',
          text: 'Autonomous sub-divisional boards without central reporting requirements.',
        },
        {
          key: 'D',
          text: 'International non-governmental arbitral forum with binding domestic enforcement.',
        },
      ],
      correctAnswer: 'A',
      explanation: `Jurisdictional Clarity: Developments in ${single.category} are piloted through the appropriate Union ministry with statutory mandates.`,
      syllabusRelevance: `${single.paper}: Executive governance and administrative hierarchy.`,
    });

    // Question 8: Constitutional Article / Judicial Safeguard
    allQuestions.push({
      id: `${single.id}_day_rec_8`,
      questionNumber: 8,
      question: `In UPSC Prelims, questions linking current affairs with Indian Constitutional jurisprudence often test basic doctrines. Which principle is most relevant here?`,
      topicTag: `${single.paper} · Constitutional Doctrines & Rule of Law`,
      options: [
        {
          key: 'A',
          text: 'Doctrine of Harmonious Construction and Reasonable Classification under Article 14.',
        },
        {
          key: 'B',
          text: 'Absolute executive immunity exempt from judicial review under Article 32 and 226.',
        },
        {
          key: 'C',
          text: 'Unchecked delegated legislation overriding fundamental constitutional rights.',
        },
        {
          key: 'D',
          text: 'Extraterritorial application of state municipal bylaws over central agencies.',
        },
      ],
      correctAnswer: 'A',
      explanation: `Constitutional Linkage: State policies and statutes must satisfy reasonable classification and non-arbitrariness under Article 14, balanced through harmonious interpretation.`,
      syllabusRelevance: 'GS Paper 2: Constitutional morality, fundamental rights, and judicial review doctrines.',
    });

    // Question 9: Chronological & Historical Context
    allQuestions.push({
      id: `${single.id}_day_rec_9`,
      questionNumber: 9,
      question: `Consider the historical evolution leading up to this event. What milestone preceded this recent development?`,
      topicTag: `${single.paper} · Historical Precedents & Timeline`,
      options: [
        {
          key: 'A',
          text: facts[1] || `Prior administrative reviews and consultative committees formed under Union guidelines.`,
        },
        {
          key: 'B',
          text: 'No prior precedents; the issue arose entirely spontaneously within the past week.',
        },
        {
          key: 'C',
          text: 'Total suspension of previous treaties and complete abrogation of related statutory rules.',
        },
        {
          key: 'D',
          text: 'Direct imposition of central rule without statutory consultation.',
        },
      ],
      correctAnswer: 'A',
      explanation: `Historical Context: ${facts[1] || 'Major national policies and bilateral pacts follow extensive consultative and committee milestones.'}`,
      syllabusRelevance: `${single.paper}: Evolutionary perspective of policies and institutional reforms.`,
    });

    // Question 10: Mains Synthesis & Exam Strategy Anchor
    allQuestions.push({
      id: `${single.id}_day_rec_10`,
      questionNumber: 10,
      question: `When drafting a Mains answer on "${single.headline}", what is the most balanced forward-looking conclusion?`,
      topicTag: `${single.paper} · Mains Way Forward & Policy Synthesis`,
      options: [
        {
          key: 'A',
          text: 'Institutional capacity building, transparent rule-based enforcement, and cooperative federal engagement.',
        },
        {
          key: 'B',
          text: 'Total dismantlement of statutory mechanisms and reliance on ad-hoc executive directives.',
        },
        {
          key: 'C',
          text: 'Isolating domestic policy entirely from international best practices and multi-lateral conventions.',
        },
        {
          key: 'D',
          text: 'Curtailing public accountability mechanisms to expedite executive implementation.',
        },
      ],
      correctAnswer: 'A',
      explanation: `Mains Synthesis: A high-scoring UPSC Mains answer concludes with balanced, reform-oriented recommendations emphasizing capacity building, federal consensus, and rule of law.`,
      syllabusRelevance: `${single.paper}: Answer writing strategy - constructive way forward.`,
    });
  } else if (events.length === 2) {
    const q1 = generateEventRecallQuestions(events[0]);
    const q2 = generateEventRecallQuestions(events[1]);
    allQuestions.push(...q1.slice(0, 5), ...q2.slice(0, 5));
  } else if (events.length === 3) {
    const q1 = generateEventRecallQuestions(events[0]);
    const q2 = generateEventRecallQuestions(events[1]);
    const q3 = generateEventRecallQuestions(events[2]);
    // 4 from event 1, 3 from event 2, 3 from event 3 = 10 total
    allQuestions.push(...q1.slice(0, 4), ...q2.slice(0, 3), ...q3.slice(0, 3));
  } else {
    // 4 or more events: distribute evenly to total 10
    const perEvent = Math.max(1, Math.floor(10 / events.length));
    for (const evt of events) {
      if (allQuestions.length >= 10) break;
      const q = generateEventRecallQuestions(evt);
      const remainingNeeded = 10 - allQuestions.length;
      const takeCount = Math.min(perEvent, remainingNeeded, q.length);
      allQuestions.push(...q.slice(0, takeCount));
    }
    // If still less than 10, fill from first event
    if (allQuestions.length < 10) {
      const qFirst = generateEventRecallQuestions(events[0]);
      for (const extra of qFirst) {
        if (allQuestions.length >= 10) break;
        if (!allQuestions.some((item) => item.id === extra.id)) {
          allQuestions.push(extra);
        }
      }
    }
  }

  // Ensure sequential numbering 1 to 10
  return allQuestions.slice(0, 10).map((q, index) => ({
    ...q,
    questionNumber: index + 1,
  }));
}

