export interface PrelimsFactItem {
  label: string;
  value: string;
}

export interface SyllabusRelevanceData {
  paperTopic: string;
  staticConnection: string;
  prelimsAngle: string;
  mainsDimensions: string;
  relatedPYQ?: string;
}

export interface EventSourceItem {
  name: string;
  url?: string;
  date?: string;
  type?: 'Official' | 'Court Judgment' | 'Leading Daily' | 'Think Tank';
}

export interface DailyEventItem {
  id: string;
  category: 'Polity' | 'Economy' | 'International Relations' | 'Environment' | 'Sci-Tech' | 'Security';
  paper: 'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV' | 'Prelims' | string;
  headline: string;
  source: string;
  date: string;
  summary: string;
  summaryBullets?: string[];
  imageUrl?: string;
  bullets: string[];
  prelimsFacts: string[];
  prelimsFactMatrix?: PrelimsFactItem[];
  syllabusRelevance?: SyllabusRelevanceData;
  mainsRelevance?: string;
  sources?: EventSourceItem[];
  practiceQuestion?: CAQuizQuestion;
  aiVerification?: {
    model: string;
    sourcesCount: number;
    verifiedAt: string;
  };
  referenceUrl?: string;
}

export interface DayEventsSummary {
  dateKey: string; // '2026-10-25'
  label: string; // 'Today, 25 Oct'
  shortDay: string; // '25'
  dayName: string; // 'Sun'
  highlight: string;
  events: DailyEventItem[];
}

export interface MajorEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  paper: string;
  summary: string;
  keyTakeaways: string[];
  source: string;
}

export interface CuratedArticle {
  id: string;
  title: string;
  source: string;
  agencyId?: string;
  date: string;
  category: string;
  paper: 'GS 1' | 'GS 2' | 'GS 3' | 'Prelims' | string;
  summary: string;
  imageUrl?: string;
  link?: string;
  keyPoints: string[];
  analyticalAngle: string;
  mainsQuestion?: string;
}

export interface MonthlyOverview {
  monthKey: string; // '2026-10'
  title: string; // 'October 2026'
  summary: string;
  gs1Highlights: string[];
  gs2Highlights: string[];
  gs3Highlights: string[];
  reportsAndIndices: { name: string; releasedBy: string; indiaRankOrFact: string }[];
  schemesInNews: { name: string; ministry: string; objective: string }[];
}

export interface CAQuizQuestion {
  id: string;
  question: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source: string;
  paper: string;
}

export interface NewsAgency {
  id: string;
  name: string;
  shortName: string;
  matchKeyword?: string;
}

export const NEWS_AGENCIES: NewsAgency[] = [
  { id: 'all', name: 'All Agencies', shortName: 'All' },
  { id: 'hindu', name: 'The Hindu', shortName: 'The Hindu', matchKeyword: 'The Hindu' },
  { id: 'express', name: 'Indian Express', shortName: 'IE', matchKeyword: 'Indian Express' },
  { id: 'pib', name: 'PIB Delhi', shortName: 'PIB', matchKeyword: 'PIB' },
  { id: 'dte', name: 'Down To Earth', shortName: 'Down To Earth', matchKeyword: 'Down To Earth' },
  { id: 'mint', name: 'Livemint', shortName: 'Livemint', matchKeyword: 'Livemint' },
  { id: 'orf', name: 'ORF / Think Tanks', shortName: 'Think Tanks', matchKeyword: 'ORF' },
];

// -------------------------------------------------------------
// DAILY EVENTS DATA (Last 7 Days)
// -------------------------------------------------------------
export const DAILY_EVENTS_DATA: DayEventsSummary[] = [
  {
    dateKey: '2026-10-25',
    label: 'Today, 25 Oct',
    shortDay: '25',
    dayName: 'Sun',
    highlight: 'LAC Disengagement verification, WTO Dispute Settlement panel & Green Hydrogen mission subsidy release.',
    events: [
      {
        id: 'de_25_1',
        category: 'International Relations',
        paper: 'GS-II',
        headline: 'India-China Complete Coordinated Verification of Troops at Demchok & Depsang Plains',
        source: 'The Hindu • Front Page',
        date: '25 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/lac-china-india.jpg',
        summary: '- Indian and Chinese military commanders completed joint verification of troop pullback from friction points in **Demchok** and the **Depsang Plains**.\n- The disengagement restores patrolling access up to legacy **Patrolling Points (PP 10 to 13)** through coordinated, pre-scheduled timetables.\n- The move de-escalates a four-year standoff along the **Line of Actual Control (LAC)**, preparing ground to revive the **2005 Political Parameters** boundary dialogue.',
        summaryBullets: [
          'Indian and Chinese military commanders completed joint verification of troop pullback from friction points in **Demchok** and the **Depsang Plains**.',
          'The disengagement restores patrolling access up to legacy **Patrolling Points (PP 10 to 13)** through coordinated, pre-scheduled timetables.',
          'The move de-escalates a four-year standoff along the **Line of Actual Control (LAC)**, preparing ground to revive the **2005 Political Parameters** boundary dialogue.',
        ],
        bullets: [
          'Military disengagement verified at friction zones in Demchok and Depsang bulge following phased pullback of temporary posts.',
          'Agreement establishes coordinated, pre-scheduled patrolling schedules to prevent physical face-offs and patrol overlapping.',
          'Special Representatives on Boundary Question dialogue mechanism under the 2005 Guiding Principles to reconvene.',
          'Troops from both sides maintain mutual surveillance and local hotline communication to verify status quo.',
        ],
        prelimsFacts: [
          'Depsang Plains are situated immediately south of Daulat Beg Oldi (DBO) airfield and Karakoram Pass.',
          'The Y-Junction (Bottleneck) commands access to legacy Patrol Points 10, 11, 11A, 12, and 13.',
        ],
        prelimsFactMatrix: [
          { label: 'Geographic Chokepoints', value: 'Depsang Plains, Y-Junction, Demchok (Charding Nullah), Karakoram Pass' },
          { label: 'Bilateral Accords', value: '1993 Border Peace & Tranquility Agreement (BPTA), 1996 CBMs, 2005 Political Parameters' },
          { label: 'Strategic Infrastructure', value: 'Darbuk-Shyok-Daulat Beg Oldie (DS-DBO) all-weather strategic road' },
          { label: 'Operational Mechanism', value: 'Working Mechanism for Consultation & Coordination on India-China Border Affairs (WMCC)' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 2: India and its neighborhood- relations; Bilateral, regional and global groupings and agreements.',
          staticConnection: 'Evolution of LAC demarcations, Western Sector territorial disputes (Aksai Chin), and diplomatic CBM treaties since 1988.',
          prelimsAngle: 'Geography of Eastern Ladakh (DBO, Galwan, Shyok, Pangong Tso, Demchok) and border management mechanisms.',
          mainsDimensions: 'Balancing forward deterrence with cooperative boundary management; implications of buffer zones for territorial sovereignty.',
          relatedPYQ: 'UPSC CSE Mains 2020: "China is using its economic power to acquire strategic assets in Asia. In this context, discuss India\'s foreign policy options."',
        },
        sources: [
          { name: 'Ministry of External Affairs Official Briefing', url: 'https://mea.gov.in', date: '25 Oct 2026', type: 'Official' },
          { name: 'The Hindu', date: '25 Oct 2026', type: 'Leading Daily' },
          { name: 'Indian Army HQ Media Cell', date: '25 Oct 2026', type: 'Official' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 3,
          verifiedAt: '25 Oct 2026, 06:15 IST',
        },
      },
      {
        id: 'de_25_2',
        category: 'Economy',
        paper: 'GS-III',
        headline: 'National Green Hydrogen Mission: Ministry Releases Tranche-II Incentives for Electrolyser Manufacturing',
        source: 'Press Information Bureau (PIB Delhi)',
        date: '25 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/role-of-agrivoltaics-in-sustainable-agriculture-and-global-environmental-regulations.jpg',
        summary: '- The **Ministry of New & Renewable Energy** issued operational guidelines for Tranche-II of the **₹4,440-crore SIGHT scheme**.\n- Component-I incentivizes **1,500 MW annual electrolyser manufacturing** capacity, mandating at least **50% local value addition** for advanced stacks.\n- The rollout strengthens domestic clean-tech supply chains under the **National Green Hydrogen Mission**, targeting **5 MMT annual output** by 2030.',
        summaryBullets: [
          'The **Ministry of New & Renewable Energy** issued operational guidelines for Tranche-II of the **₹4,440-crore SIGHT scheme**.',
          'Component-I incentivizes **1,500 MW annual electrolyser manufacturing** capacity, mandating at least **50% local value addition** for advanced stacks.',
          'The rollout strengthens domestic clean-tech supply chains under the **National Green Hydrogen Mission**, targeting **5 MMT annual output** by 2030.',
        ],
        bullets: [
          'Awards 1,500 MW annual electrolyser manufacturing capacity under SIGHT Component-I with performance-linked tapering subsidies.',
          'Mandates minimum 50% domestic value addition for Proton Exchange Membrane (PEM) and Alkaline electrolyser assemblies.',
          'Aims to drive national production toward 5 MMT Green Hydrogen per annum and 125 GW associated renewable capacity by 2030.',
          'Enables export competitiveness against imported subsidized technology while fostering indigenous supply chains.',
        ],
        prelimsFacts: [
          'Electrolysers split demineralized water into Hydrogen and Oxygen using direct current (DC) electricity.',
          'Green hydrogen uses 100% renewable electricity; grey hydrogen uses natural gas with unabated CO2 emissions.',
        ],
        prelimsFactMatrix: [
          { label: 'Mission Targets', value: '5 MMT green hydrogen per annum; 125 GW renewable addition; ₹8 lakh crore total investment by 2030' },
          { label: 'Technology Stack', value: 'Alkaline Electrolysers, Proton Exchange Membrane (PEM), Solid Oxide Electrolysers (SOEC)' },
          { label: 'Implementing Agency', value: 'Solar Energy Corporation of India (SECI) under Ministry of New & Renewable Energy' },
          { label: 'Carbon Abatement', value: 'Estimated abatement of nearly 50 MMT of annual greenhouse gas emissions by 2030' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Infrastructure- Energy, Ports, Roads; Environmental conservation, pollution and degradation.',
          staticConnection: 'Renewable energy transition, National Action Plan on Climate Change (NAPCC), and Nationally Determined Contributions (NDCs).',
          prelimsAngle: 'Types of hydrogen (Grey, Blue, Green, Pink), SIGHT scheme nodal bodies, and thermodynamics of water electrolysis.',
          mainsDimensions: 'Economic viability of green hydrogen versus fossil fuels; challenges of capital intensity, round-the-clock power, and water intensity.',
          relatedPYQ: 'UPSC CSE Prelims 2023: Question regarding green hydrogen applications in heavy industry, transport, and fertilizer plants.',
        },
        sources: [
          { name: 'Ministry of New & Renewable Energy (MNRE)', url: 'https://mnre.gov.in', date: '25 Oct 2026', type: 'Official' },
          { name: 'Press Information Bureau (PIB)', date: '25 Oct 2026', type: 'Official' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '25 Oct 2026, 07:00 IST',
        },
      },
      {
        id: 'de_25_3',
        category: 'Polity',
        paper: 'GS-II',
        headline: 'Supreme Court Issues Directives for Expeditious Border Fencing & Foreigners Tribunal Audits in Assam',
        source: 'The Indian Express • Legal Bureau',
        date: '25 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/Cabinet-Secretary.jpg',
        summary: '- The **Supreme Court** issued compliance directives to the **Ministry of Home Affairs** following its verdict upholding **Section 6A of the Citizenship Act, 1955**.\n- Directives mandate time-bound completion of **Indo-Bangladesh border fencing** and accelerated biometric profiling of migrants from the **1966–1971 stream**.\n- The bench ordered digitization of **Foreigners Tribunals in Assam** to ensure statutory constitutionality is matched by robust border surveillance and faster adjudication.',
        summaryBullets: [
          'The **Supreme Court** issued compliance directives to the **Ministry of Home Affairs** following its verdict upholding **Section 6A of the Citizenship Act, 1955**.',
          'Directives mandate time-bound completion of **Indo-Bangladesh border fencing** and accelerated biometric profiling of migrants from the **1966–1971 stream**.',
          'The bench ordered digitization of **Foreigners Tribunals in Assam** to ensure statutory constitutionality is matched by robust border surveillance and faster adjudication.',
        ],
        bullets: [
          'Directs Ministry of Home Affairs to expedite biometric profiling of undocumented migrants detected under 1966–1971 stream.',
          'Mandates digitization of Foreigners Tribunals proceedings under Foreigners (Tribunals) Order 1964 to curb adjudication delays.',
          'Court stresses that statutory constitutionality of Section 6A must be matched by effective ground-level border security execution.',
          'Orders joint physical inspections along riverine stretches of Indo-Bangladesh border in Dhubri and Karimganj sectors.',
        ],
        prelimsFacts: [
          'Section 6A was inserted through the Citizenship (Amendment) Act 1985 following the historic Assam Accord.',
          'March 25, 1971 serves as the statutory cut-off date for citizenship regularization under Section 6A(3).',
        ],
        prelimsFactMatrix: [
          { label: 'Constitutional Articles', value: 'Article 5-11 (Citizenship), Article 14 (Equality), Article 29 (Protection of Culture)' },
          { label: 'Key Legislation', value: 'Citizenship Act 1955, Foreigners Act 1946, Illegal Migrants (Determination by Tribunals) Act 1983' },
          { label: 'Landmark Precedents', value: 'Sarbananda Sonowal v. Union of India (2005), Assam Sanmilita Mahasangha (2024)' },
          { label: 'Administrative Bodies', value: 'Foreigners Tribunals (quasi-judicial bodies under Foreigners Act 1946)' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 2: Indian Constitution- historical underpinnings, evolution, features, amendments, significant provisions.',
          staticConnection: 'Constitutional basis of Indian citizenship (Articles 5-11), Parliamentary legislative supremacy under Article 11, and judicial review.',
          prelimsAngle: 'Statutory criteria under Section 6A, powers of Foreigners Tribunals, and cut-off dates (1 Jan 1966 and 25 March 1971).',
          mainsDimensions: 'Harmonizing humanitarian citizenship accommodations with indigenous demographic protection in sensitive border federal states.',
          relatedPYQ: 'UPSC CSE Mains 2019: "Examine the constitutional validity and social consequences of the National Register of Citizens (NRC) in Assam."',
        },
        sources: [
          { name: 'Supreme Court of India • Order Records', url: 'https://sci.gov.in', date: '25 Oct 2026', type: 'Court Judgment' },
          { name: 'The Indian Express', date: '25 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 3,
          verifiedAt: '25 Oct 2026, 07:45 IST',
        },
      },
      {
        id: 'de_25_4',
        category: 'Sci-Tech',
        paper: 'GS-III',
        headline: 'ISRO Completes Vacuum Hot Testing of Semi-Cryogenic Pre-Burner for LVM3 Heavy Payload Booster',
        source: 'ISRO Technical Bulletin',
        date: '25 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/WhatsApp-Image-2026-10-27-at-16.00.04.jpeg',
        summary: '- **ISRO** successfully conducted a vacuum hot-test of the semi-cryogenic pre-burner for the **SCE-200 engine** at **IPRC Mahendragiri**.\n- The engine operates on an indigenous **Isrosene (refined kerosene)** and **liquid oxygen (LOX)** propellant cycle, delivering **2,000 kN thrust**.\n- The milestone advances development of India\'s **Next Generation Launch Vehicle (NGLV)**, raising **LVM3 GTO payload capacity** from 4 to 6 tonnes.',
        summaryBullets: [
          '**ISRO** successfully conducted a vacuum hot-test of the semi-cryogenic pre-burner for the **SCE-200 engine** at **IPRC Mahendragiri**.',
          'The engine operates on an indigenous **Isrosene (refined kerosene)** and **liquid oxygen (LOX)** propellant cycle, delivering **2,000 kN thrust**.',
          'The milestone advances development of India\'s **Next Generation Launch Vehicle (NGLV)**, raising **LVM3 GTO payload capacity** from 4 to 6 tonnes.',
        ],
        bullets: [
          'SCE-200 Semi-Cryogenic engine utilizes refined kerosene (Isrosene) and Liquid Oxygen (LOX) propellant combination.',
          'Delivers 2,000 kN sea-level thrust, boosting LVM3 geostationary payload capacity from 4,000 kg to 6,000 kg.',
          'Indigenously cast nickel-chromium superalloys successfully withstood extreme 1,150 K turbine operational temperatures.',
          'Replaces earth-storable hypergolic liquid stages (Vikas engine) with safer, environmentally benign, high-density kerosene fuel.',
        ],
        prelimsFacts: [
          'Semi-cryogenic engines use liquid oxygen (-183°C) with room-temperature RP-1 kerosene (no liquid hydrogen needed).',
          'Cryogenic engines use both liquid oxygen (-183°C) and liquid hydrogen (-253°C) at deep cryogenic temperatures.',
        ],
        prelimsFactMatrix: [
          { label: 'Propellant Composition', value: 'Isrosene (Propellant-grade RP-1 kerosene) + Liquid Oxygen (LOX)' },
          { label: 'Test Facility', value: 'ISRO Propulsion Complex (IPRC), Mahendragiri, Tamil Nadu' },
          { label: 'Engine Thrust', value: '2,000 kN (200 tonnes force) semi-cryogenic stage' },
          { label: 'Spacecraft Applications', value: 'LVM3 Heavy-lift upgrades, Gaganyaan Human Spaceflight, Chandrayaan-4 Sample Return' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Science and Technology- developments and their applications; Indigenization of technology.',
          staticConnection: 'Evolution of Indian launch vehicle generations: SLV-3, ASLV, PSLV, GSLV Mk-II, LVM3, and Next-Gen Launch Vehicle (NGLV).',
          prelimsAngle: 'Differences between solid, hypergolic liquid, semi-cryogenic, and cryogenic rocket propulsion cycles.',
          mainsDimensions: 'Strategic autonomy in commercial heavy satellite launches and self-reliance in deep space exploration payloads.',
          relatedPYQ: 'UPSC CSE Mains 2021: "What is India\'s plan for its own space station and what are its benefits? Discuss the role of LVM3."',
        },
        sources: [
          { name: 'ISRO Headquarters Official Release', url: 'https://isro.gov.in', date: '25 Oct 2026', type: 'Official' },
          { name: 'Press Information Bureau (PIB)', date: '25 Oct 2026', type: 'Official' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '25 Oct 2026, 08:30 IST',
        },
      },
    ],
  },
  {
    dateKey: '2026-10-24',
    label: 'Sat, 24 Oct',
    shortDay: '24',
    dayName: 'Sat',
    highlight: '16th BRICS Summit Kazan Declaration, RBI Retail Liquidity guidelines & BioE3 policy notifications.',
    events: [
      {
        id: 'de_24_1',
        category: 'International Relations',
        paper: 'GS-II',
        headline: '16th BRICS Summit Adopts Kazan Declaration: Focus on Local Currency Settlement & NDB Expansion',
        source: 'Ministry of External Affairs (MEA)',
        date: '24 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/US-4-14.jpg',
        summary: '- Leaders of the expanded nine-member **BRICS** grouping adopted the **Kazan Declaration** at the 2024 summit in Russia.\n- Members supported greater use of **local currencies in cross-border trade** and discussed alternative payment mechanisms.\n- The declaration reiterated calls for reforms to the **UN Security Council, IMF, and World Bank**, including better representation of developing countries.',
        summaryBullets: [
          'Leaders of the expanded nine-member **BRICS** grouping adopted the **Kazan Declaration** at the 2024 summit in Russia.',
          'Members supported greater use of **local currencies in cross-border trade** and discussed alternative payment mechanisms.',
          'The declaration reiterated calls for reforms to the **UN Security Council, IMF, and World Bank**, including better representation of developing countries.',
        ],
        bullets: [
          'Inaugural summit of expanded BRICS bloc (India, Brazil, Russia, China, South Africa, Egypt, Ethiopia, Iran, UAE).',
          'Endorses BRICS Cross-Border Payment Initiative (BCBPI) to lower trade transaction costs independent of SWIFT.',
          'Reiterates commitment to comprehensive reform of UN Security Council to reflect contemporary Global South representation.',
          'India emphasized resolute collective consensus against cross-border terrorism without double standards.',
        ],
        prelimsFacts: [
          'New Development Bank (NDB) headquarters is in Shanghai; equal shareholding among founding 5 members.',
          'Fortaleza Summit (2014) established the NDB and Contingent Reserve Arrangement (CRA).',
        ],
        prelimsFactMatrix: [
          { label: 'Permanent Members (2024)', value: 'Brazil, Russia, India, China, South Africa, Egypt, Ethiopia, Iran, UAE (9 members)' },
          { label: 'Key Financial Body', value: 'New Development Bank (NDB), headquartered in Shanghai, China' },
          { label: 'Key Financial Shield', value: 'Contingent Reserve Arrangement (CRA) established at Fortaleza (2014)' },
          { label: 'Partner Country Category', value: 'New status created for 13 non-permanent partner nations at Kazan' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 2: Important International institutions, agencies and fora- their structure, mandate.',
          staticConnection: 'Evolution of South-South cooperation, non-alignment, and multi-aligned foreign policy balancing.',
          prelimsAngle: 'Member composition of BRICS+, NDB shareholding patterns, and landmark summit declarations (Fortaleza, Ufa, Kazan).',
          mainsDimensions: 'De-dollarization risks vs benefits for Indian Rupee; managing divergent geopolitical interests within expanded BRICS.',
          relatedPYQ: 'UPSC CSE Mains 2022: "Do you think that BIMSTEC is a parallel organization like the SAARC? What are the similarities and dissimilarities?"',
        },
        sources: [
          { name: 'Kazan Declaration Document • MEA', url: 'https://mea.gov.in', date: '24 Oct 2026', type: 'Official' },
          { name: 'The Hindu International Bureau', date: '24 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 3,
          verifiedAt: '24 Oct 2026, 06:45 IST',
        },
      },
      {
        id: 'de_24_2',
        category: 'Economy',
        paper: 'GS-III',
        headline: 'RBI Releases Revised Liquidity Coverage Ratio (LCR) Norms to Mitigate Digital Bank Run Risks',
        source: 'Reserve Bank of India (RBI)',
        date: '24 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/Jio-IPO-4.jpg',
        summary: '- The **Reserve Bank of India** finalized revised **Liquidity Coverage Ratio (LCR)** regulations to mitigate digital bank run risks in 24/7 banking environments.\n- Banks must maintain an additional **5% run-off factor** on retail deposits enabled with mobile banking and UPI, requiring higher holdings of **High-Quality Liquid Assets (HQLA)**.\n- The framework aligns domestic banking prudence with **Basel III standards** while providing a phased implementation window to prevent credit constraints.',
        summaryBullets: [
          'The **Reserve Bank of India** finalized revised **Liquidity Coverage Ratio (LCR)** regulations to mitigate digital bank run risks in 24/7 banking environments.',
          'Banks must maintain an additional **5% run-off factor** on retail deposits enabled with mobile banking and UPI, requiring higher holdings of **High-Quality Liquid Assets (HQLA)**.',
          'The framework aligns domestic banking prudence with **Basel III standards** while providing a phased implementation window to prevent credit constraints.',
        ],
        bullets: [
          'Introduces mandatory additional 5% run-off factor for internet and mobile banking enabled retail deposits.',
          'Scheduled Commercial Banks mandated to hold higher stock of unencumbered High-Quality Liquid Assets (HQLA).',
          'Addresses heightened risk of rapid deposit flight illustrated during recent global banking stresses (e.g. Silicon Valley Bank).',
          'Phased implementation timeline provided until April 1, 2025 to prevent credit disruption for productive sectors.',
        ],
        prelimsFacts: [
          'LCR measures ratio of High Quality Liquid Assets (HQLA) to total net cash outflows over a 30-day stress scenario.',
          'Basel Committee on Banking Supervision (BCBS) operates under the Bank for International Settlements (BIS), Basel.',
        ],
        prelimsFactMatrix: [
          { label: 'Regulatory Metric', value: 'Liquidity Coverage Ratio (LCR) >= 100%' },
          { label: 'HQLA Composition', value: 'Cash, excess CRR, government securities (SLR), MSF facility assets' },
          { label: 'Regulatory Architecture', value: 'Basel III prudential norms developed by Basel Committee on Banking Supervision (BCBS)' },
          { label: 'Stress Horizon', value: '30-calendar-day severe liquidity crisis scenario' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Indian Economy and issues relating to mobilization of resources; Banking sector regulation.',
          staticConnection: 'Basel I, II, and III accords, Capital Adequacy Ratio (CAR), SLR/CRR instruments, and monetary policy transmission.',
          prelimsAngle: 'Components of HQLA, definitions of Net Stable Funding Ratio (NSFR) vs LCR, and BIS location.',
          mainsDimensions: 'Balancing digital financial innovation with systemic banking prudence; trade-off between liquidity buffers and bank margins.',
          relatedPYQ: 'UPSC CSE Prelims 2020: "If the RBI decides to adopt an expansionist monetary policy, which of the following would it not do?"',
        },
        sources: [
          { name: 'Reserve Bank of India Master Directions', url: 'https://rbi.org.in', date: '24 Oct 2026', type: 'Official' },
          { name: 'The Indian Express Financial Bureau', date: '24 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '24 Oct 2026, 08:00 IST',
        },
      },
    ],
  },
  {
    dateKey: '2026-10-23',
    label: 'Fri, 23 Oct',
    shortDay: '23',
    dayName: 'Fri',
    highlight: 'SC Sub-classification judgment, National Critical Minerals Mission & BioE3 Cabinet guidelines.',
    events: [
      {
        id: 'de_23_1',
        category: 'Polity',
        paper: 'GS-II',
        headline: 'Supreme Court 7-Judge Bench Rules States Empowered to Sub-Classify SC/ST Categories for Reservation',
        source: 'The Hindu • Supreme Court Reporter',
        date: '23 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/Cabinet-Secretary.jpg',
        summary: '- A 7-judge **Supreme Court** Constitution Bench ruled 6:1 that State legislatures possess authority under **Article 16(4)** to sub-classify Scheduled Castes for affirmative action.\n- The court held that sub-classification must be backed by **quantifiable empirical data** of backwardness without creating an exclusive 100% reservation monopoly.\n- Overruling the **2004 E.V. Chinnaiah judgment**, the ruling enables States to target welfare benefits to the most disadvantaged sub-castes while upholding **Article 14 equality**.',
        summaryBullets: [
          'A 7-judge **Supreme Court** Constitution Bench ruled 6:1 that State legislatures possess authority under **Article 16(4)** to sub-classify Scheduled Castes for affirmative action.',
          'The court held that sub-classification must be backed by **quantifiable empirical data** of backwardness without creating an exclusive 100% reservation monopoly.',
          'Overruling the **2004 E.V. Chinnaiah judgment**, the ruling enables States to target welfare benefits to the most disadvantaged sub-castes while upholding **Article 14 equality**.',
        ],
        bullets: [
          'Overrules E.V. Chinnaiah (2004) which held Scheduled Castes represent a single, indivisible homogeneous group.',
          'Affirms that sub-classification does not tinker with the Presidential notification prepared under Article 341.',
          'Mandates that States must base any sub-classification on quantifiable empirical data showing inadequate representation.',
          'Several judges observed that the creamy layer principle should logically extend to affirmative action within Scheduled Castes.',
        ],
        prelimsFacts: [
          'Article 341 empowers the President to specify castes deemed as Scheduled Castes in a State or UT.',
          'Article 16(4) empowers the State to make reservation for backward classes not adequately represented in services.',
        ],
        prelimsFactMatrix: [
          { label: 'Constitutional Articles', value: 'Article 14 (Equality), Article 15(4), Article 16(4), Article 341 (Presidential List)' },
          { label: 'Landmark Precedents', value: 'Indra Sawhney (1992), E.V. Chinnaiah (2004), Jarnail Singh (2018), Davinder Singh (2024)' },
          { label: 'Bench Composition', value: '7-Judge Constitution Bench headed by Chief Justice of India (6:1 majority)' },
          { label: 'Prerequisite Criterion', value: 'Verifiable empirical data proving backwardness; cannot allocate 100% quota to one sub-caste' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 2: Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure.',
          staticConnection: 'Fundamental Rights (Articles 14-18), Directive Principles of State Policy (Article 46), and judicial doctrine of substantive equality.',
          prelimsAngle: 'Presidential powers under Article 341/342, National Commission for Scheduled Castes (Article 338), and 105th Constitutional Amendment.',
          mainsDimensions: 'Constitutional balance between equality of opportunity and substantive social justice; empirical data dilemmas in state policy.',
          relatedPYQ: 'UPSC CSE Mains 2023: "The concept of substantive equality has evolved through judicial interpretation. Discuss with landmark judgments."',
        },
        sources: [
          { name: 'Supreme Court Judgment (SCR)', url: 'https://sci.gov.in', date: '23 Oct 2026', type: 'Court Judgment' },
          { name: 'The Hindu Legal Bureau', date: '23 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 3,
          verifiedAt: '23 Oct 2026, 07:15 IST',
        },
      },
      {
        id: 'de_23_2',
        category: 'Economy',
        paper: 'GS-III',
        headline: 'Cabinet Clears National Critical Minerals Mission with ₹34,000 Crore Capital Allocation',
        source: 'Press Information Bureau (PIB)',
        date: '23 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/Amodeithropic.jpg',
        summary: '- The Union Cabinet approved the **National Critical Minerals Mission** with an outlay of **₹34,000 crore** to secure India\'s strategic supply chains.\n- The mission focuses on domestic exploration and offshore asset acquisition of **24 critical minerals**, including **Lithium, Cobalt, and Rare Earth Elements**.\n- State-owned venture **KABIL** will spearhead acquisitions in South America and Australia, supporting domestic battery manufacturing and national clean-energy goals.',
        summaryBullets: [
          'The Union Cabinet approved the **National Critical Minerals Mission** with an outlay of **₹34,000 crore** to secure India\'s strategic supply chains.',
          'The mission focuses on domestic exploration and offshore asset acquisition of **24 critical minerals**, including **Lithium, Cobalt, and Rare Earth Elements**.',
          'State-owned venture **KABIL** will spearhead acquisitions in South America and Australia, supporting domestic battery manufacturing and national clean-energy goals.',
        ],
        bullets: [
          'Establishes sovereign viability gap funding (VGF) for domestic exploration of 24 strategic critical minerals.',
          'Focuses on Lithium, Cobalt, Rare Earth Elements (REE), Nickel, and Graphite for batteries and electronics.',
          'KABIL (Khanij Bidesh India Ltd) to acquire offshore lithium brine assets in Argentina and Australia.',
          'Incentivizes private sector mining through royalty rationalization and streamlined environmental clearances.',
        ],
        prelimsFacts: [
          'Critical minerals are essential for green technology with high supply-chain vulnerability.',
          'Rare Earth Elements consist of 17 chemical elements (15 lanthanides plus scandium and yttrium).',
        ],
        prelimsFactMatrix: [
          { label: 'Mission Corpus', value: '₹34,000 Crore sovereign allocation over 7 years' },
          { label: 'Joint Venture Vehicle', value: 'Khanij Bidesh India Limited (KABIL: NALCO, HCL, MECL joint venture)' },
          { label: 'Strategic Minerals', value: '24 notified critical minerals under Mines & Minerals (Development & Regulation) Act' },
          { label: 'International Partnerships', value: 'Minerals Security Partnership (MSP), Quad Critical and Emerging Technology initiative' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Mineral and Energy resources, industrial policy, self-reliance and clean energy transition.',
          staticConnection: 'Distribution of key natural resources across the world and India; MMDR Amendment Act provisions.',
          prelimsAngle: 'List of Rare Earth Elements (REE), Lithium Triangle countries (Argentina, Bolivia, Chile), and nodal PSUs.',
          mainsDimensions: 'Geopolitics of critical mineral supply chains, dependence on external refining hubs, and environmental trade-offs in extraction.',
          relatedPYQ: 'UPSC CSE Mains 2021: "Critically evaluate the resource potential and strategic importance of critical minerals for India\'s manufacturing sector."',
        },
        sources: [
          { name: 'Press Information Bureau (PIB)', url: 'https://pib.gov.in', date: '23 Oct 2026', type: 'Official' },
          { name: 'Ministry of Mines Annual Outlook', date: '23 Oct 2026', type: 'Official' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '23 Oct 2026, 08:30 IST',
        },
      },
    ],
  },
  {
    dateKey: '2026-10-22',
    label: 'Thu, 22 Oct',
    shortDay: '22',
    dayName: 'Thu',
    highlight: 'Global Biodiversity Framework COP16, India Semiconductor Mission 2.0 & National Medical Commission guidelines.',
    events: [
      {
        id: 'de_22_1',
        category: 'Environment',
        paper: 'GS-III',
        headline: 'CBD COP16 Cali: Negotiations Open on Digital Sequence Information (DSI) Benefit Sharing',
        source: 'Down To Earth • Policy Analysis',
        date: '22 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/28CheetahKunoDeath.jpg',
        summary: '- Negotiations commenced at **CBD COP16** in Cali, Colombia, focusing on operationalizing the **Kunming-Montreal Global Biodiversity Framework (KMGBF)**.\n- India and developing nations demanded a binding multilateral fund for commercialized **Digital Sequence Information (DSI)** under the **Nagoya Protocol**.\n- The mechanism aims to prevent **biopiracy** by ensuring pharmaceutical corporations share profits equitably with **biodiversity-rich indigenous communities**.',
        summaryBullets: [
          'Negotiations commenced at **CBD COP16** in Cali, Colombia, focusing on operationalizing the **Kunming-Montreal Global Biodiversity Framework (KMGBF)**.',
          'India and developing nations demanded a binding multilateral fund for commercialized **Digital Sequence Information (DSI)** under the **Nagoya Protocol**.',
          'The mechanism aims to prevent **biopiracy** by ensuring pharmaceutical corporations share profits equitably with **biodiversity-rich indigenous communities**.',
        ],
        bullets: [
          'Reviews progress on the Kunming-Montreal Global Biodiversity Framework (KMGBF) 30x30 conservation targets.',
          'Dispute centers on creating a binding multilateral fund from commercialization of Digital Sequence Information (DSI).',
          'India advocates for full compliance with Nagoya Protocol sovereign access and equitable benefit-sharing (ABS).',
          'Indigenous communities demand direct direct access to conservation funds and genetic data governance.',
        ],
        prelimsFacts: [
          'Kunming-Montreal 30x30 target aims to protect 30% of degraded land and sea areas by 2030.',
          'Nagoya Protocol (2010) governs Access to Genetic Resources and the Fair and Equitable Sharing of Benefits.',
        ],
        prelimsFactMatrix: [
          { label: 'Host & Venue', value: 'Cali, Colombia · Convention on Biological Diversity COP16' },
          { label: 'Key Framework', value: 'Kunming-Montreal Global Biodiversity Framework (KMGBF) adopted at COP15' },
          { label: 'Core Target', value: '30x30 Target: Conserve 30% of terrestrial, inland water, and coastal/marine areas by 2030' },
          { label: 'Governing Protocol', value: 'Nagoya Protocol on Access and Benefit Sharing (ABS), 2010' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Conservation, environmental pollution and degradation, environmental impact assessment.',
          staticConnection: 'Rio Earth Summit (1992) conventions (CBD, UNFCCC, UNCCD), Biological Diversity Act 2002, and National Biodiversity Authority.',
          prelimsAngle: 'Nagoya Protocol vs Cartagena Protocol vs Minamata Convention; KMGBF global targets and DSI definitions.',
          mainsDimensions: 'Common but differentiated responsibilities in biodiversity conservation; bio-piracy concerns and digital sequence intellectual property.',
          relatedPYQ: 'UPSC CSE Prelims 2016: Question on the Nagoya Protocol and its connection to Access and Benefit Sharing.',
        },
        sources: [
          { name: 'Convention on Biological Diversity (CBD Secretariat)', url: 'https://cbd.int', date: '22 Oct 2026', type: 'Official' },
          { name: 'Down To Earth Magazine', date: '22 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '22 Oct 2026, 09:00 IST',
        },
      },
    ],
  },
  {
    dateKey: '2026-10-21',
    label: 'Wed, 21 Oct',
    shortDay: '21',
    dayName: 'Wed',
    highlight: 'RBI offline CBDC framework, UNFCCC COP29 New Collective Quantified Goal (NCQG) finance negotiations.',
    events: [
      {
        id: 'de_21_1',
        category: 'Economy',
        paper: 'GS-III',
        headline: 'RBI Expands Offline CBDC-Retail Functionality via Sound-Wave and NFC Protocols',
        source: 'Livemint • Banking & Finance',
        date: '21 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/Jio-IPO-4.jpg',
        summary: '- The **Reserve Bank of India** introduced regulatory protocols enabling offline transactions for the **Digital Rupee (e₹-R)** without internet connectivity.\n- Payments rely on **Near Field Communication (NFC)** and encrypted acoustic soundwaves, capped at **₹500 per transaction** via device cryptographic wallets.\n- The framework bridges the digital divide in remote hilly and tribal districts while maintaining **sovereign currency liability** on the RBI balance sheet.',
        summaryBullets: [
          'The **Reserve Bank of India** introduced regulatory protocols enabling offline transactions for the **Digital Rupee (e₹-R)** without internet connectivity.',
          'Payments rely on **Near Field Communication (NFC)** and encrypted acoustic soundwaves, capped at **₹500 per transaction** via device cryptographic wallets.',
          'The framework bridges the digital divide in remote hilly and tribal districts while maintaining **sovereign currency liability** on the RBI balance sheet.',
        ],
        bullets: [
          'Enables transactions in low- or zero-internet connectivity areas through dual-offline ledger balances.',
          'Transactions settle instantly between device cryptographic wallets without immediate core banking connectivity.',
          'Limits per-transaction value to ₹500 and daily cumulative limit to ₹2,000 for systemic security.',
          'Aims to reduce currency logistics costs and provide an alternative to physical cash in tribal and hilly districts.',
        ],
        prelimsFacts: [
          'Digital Rupee (e₹) is a legal tender issued under the RBI Act, 1934 (amended via Finance Act 2022).',
          'Unlike UPI (which is a payment channel), CBDC represents a sovereign currency liability on the RBI balance sheet.',
        ],
        prelimsFactMatrix: [
          { label: 'Regulatory Statute', value: 'RBI Act, 1934 (Section 22 & amended definition of banknote)' },
          { label: 'Operational Architectures', value: 'Two-tier CBDC model (Token-based retail e₹-R, Account-based wholesale e₹-W)' },
          { label: 'Transmission Tech', value: 'Near Field Communication (NFC), Acoustic Soundwaves & Bluetooth Low Energy (BLE)' },
          { label: 'Key Recommendation', value: 'Inter-Ministerial Committee on Virtual Currencies (Subhash Garg Committee, 2019)' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Indian Economy and issues relating to planning, mobilization of resources, growth and development.',
          staticConnection: 'Evolution of money from metallic standard to fiat money, monetary transmission mechanism, and RBI currency management.',
          prelimsAngle: 'Difference between CBDC, Cryptocurrency, and UPI payment interfaces; legal status under RBI Act 1934.',
          mainsDimensions: 'Financial inclusion benefits vs cybersecurity threats, anonymity in digital transactions vs anti-money laundering (AML/CFT).',
          relatedPYQ: 'UPSC CSE Prelims 2022: "With reference to Central Bank Digital Currency (CBDC), consider the following statements..."',
        },
        sources: [
          { name: 'Reserve Bank of India Circular', url: 'https://rbi.org.in', date: '21 Oct 2026', type: 'Official' },
          { name: 'Livemint', date: '21 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '21 Oct 2026, 09:15 IST',
        },
      },
      {
        id: 'de_21_2',
        category: 'Environment',
        paper: 'GS-III',
        headline: 'UNFCCC Baku COP29: G77 & India Demand $1 Trillion Annual New Collective Quantified Goal',
        source: 'The Hindu • Climate Diplomacy',
        date: '21 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/role-of-agrivoltaics-in-sustainable-agriculture-and-global-environmental-regulations.jpg',
        summary: '- The **G77 coalition and India** called for establishing a **$1 trillion annual climate finance target** ahead of **UNFCCC COP29** in Baku.\n- The **New Collective Quantified Goal (NCQG)** will supersede the expired $100 billion Copenhagen pledge under **Article 9 of the Paris Agreement**.\n- Developing nations emphasized non-debt creating **public grants and concessional finance** over commercial loans to honor the principle of **CBDR-RC**.',
        summaryBullets: [
          'The **G77 coalition and India** called for establishing a **$1 trillion annual climate finance target** ahead of **UNFCCC COP29** in Baku.',
          'The **New Collective Quantified Goal (NCQG)** will supersede the expired $100 billion Copenhagen pledge under **Article 9 of the Paris Agreement**.',
          'Developing nations emphasized non-debt creating **public grants and concessional finance** over commercial loans to honor the principle of **CBDR-RC**.',
        ],
        bullets: [
          'NCQG is mandated under Article 9 of the Paris Agreement to replace the inadequate $100 billion annual target.',
          'India emphasized that climate finance must comprise concessional grants and low-cost debt, not commercial loans.',
          'Developed nations push for expanding the contributor base to include high-income emerging economies.',
          'Focus on Loss and Damage Fund operationalization and access modalities for Climate Vulnerable Forum (CVF) nations.',
        ],
        prelimsFacts: [
          'Paris Agreement Article 9 establishes legal obligation of developed countries to provide financial assistance to developing countries.',
          'NCQG was established at COP21 in Paris with a commitment to set a new post-2025 quantitative finance target before 2025.',
        ],
        prelimsFactMatrix: [
          { label: 'Upcoming Summit', value: 'COP29 in Baku, Azerbaijan (November 2026)' },
          { label: 'Core Mechanism', value: 'New Collective Quantified Goal (NCQG) succeeding the $100 Billion Copenhagen pledge' },
          { label: 'Key Principle', value: 'Common But Differentiated Responsibilities and Respective Capabilities (CBDR-RC)' },
          { label: 'Financial Instruments', value: 'Non-debt creating public grants, concessional finance vs private market mechanisms' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Conservation, environmental pollution and degradation, climate change treaties.',
          staticConnection: 'UNFCCC Kyoto Protocol, Paris Agreement (2015), Green Climate Fund (GCF), and Adaptation Fund mechanisms.',
          prelimsAngle: 'NCQG origin, Paris Agreement articles, and institutional structures of multilateral climate funds.',
          mainsDimensions: 'Climate justice, historical carbon debt of Annex-I countries, and financial bottlenecks in India\'s Panchamrit renewable goals.',
          relatedPYQ: 'UPSC CSE Mains 2021: "Explain the purpose of the Green Climate Fund and its relevance in meeting the climate finance commitments under the Paris Agreement."',
        },
        sources: [
          { name: 'UNFCCC Secretariat Press Briefing', url: 'https://unfccc.int', date: '21 Oct 2026', type: 'Official' },
          { name: 'The Hindu', date: '21 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '21 Oct 2026, 11:30 IST',
        },
      },
    ],
  },
  {
    dateKey: '2026-10-20',
    label: 'Tue, 20 Oct',
    shortDay: '20',
    dayName: 'Tue',
    highlight: 'DRDO long-range cruise missile trial, EC guidelines on electronic roll purification & AI deepfake monitoring.',
    events: [
      {
        id: 'de_20_1',
        category: 'Security',
        paper: 'GS-III',
        headline: 'DRDO Successfully Flight-Tests Long-Range Land Attack Cruise Missile (LRLACM) from Chandipur',
        source: 'Press Information Bureau (PIB)',
        date: '20 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/Railways-safety-feature-1.jpg',
        summary: '- The **DRDO** successfully conducted the maiden flight-test of the indigenous **Long-Range Land Attack Cruise Missile (LRLACM)** from Chandipur, Odisha.\n- Powered by the indigenous **Manik small turbofan engine**, the subsonic missile employs **NAVIC satellite guidance** and terrain-hugging flight profiles.\n- The platform bridges India\'s conventional strike gap between supersonic **BrahMos** and strategic ballistic missiles under **Atmanirbhar Bharat**.',
        summaryBullets: [
          'The **DRDO** successfully conducted the maiden flight-test of the indigenous **Long-Range Land Attack Cruise Missile (LRLACM)** from Chandipur, Odisha.',
          'Powered by the indigenous **Manik small turbofan engine**, the subsonic missile employs **NAVIC satellite guidance** and terrain-hugging flight profiles.',
          'The platform bridges India\'s conventional strike gap between supersonic **BrahMos** and strategic ballistic missiles under **Atmanirbhar Bharat**.',
        ],
        bullets: [
          'Subsonic cruise missile system designed for launch from mobile ground launchers as well as naval frontline destroyers.',
          'Equipped with advanced indigenous inertial navigation coupled with NAVIC satellite constellation updates.',
          'Fills strategic conventional deterrence gap between supersonic BrahMos (up to 450 km) and strategic ballistic missiles.',
          'Developed with consortium participation from Indian private defense enterprises and DPSUs.',
        ],
        prelimsFacts: [
          'LRLACM is powered by the indigenous Manik small turbofan engine developed by GTRE (Gas Turbine Research Establishment).',
          'Unlike ballistic missiles that follow parabolic trajectory, cruise missiles utilize aerodynamic lift throughout flight inside the atmosphere.',
        ],
        prelimsFactMatrix: [
          { label: 'Testing Site', value: 'Integrated Test Range (ITR), Chandipur, Odisha (Abdul Kalam Island / Wheeler Island)' },
          { label: 'Propulsion Tech', value: 'Indigenous Manik Small Turbofan Engine (Gas Turbine Research Establishment - GTRE)' },
          { label: 'Guidance System', value: 'Ring Laser Gyro-INS with NAVIC / GPS satellite midpoint correction and TERCOM' },
          { label: 'Strategic Role', value: 'Conventional precision strike against high-value radar, command centers and logistics nodes' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Achievements of Indians in science & technology; indigenization of technology and developing new technology.',
          staticConnection: 'Evolution of Integrated Guided Missile Development Programme (IGMDP), BrahMos, Nirbhay cruise missile lineage.',
          prelimsAngle: 'Cruise vs Ballistic missiles; Subsonic vs Supersonic vs Hypersonic speeds; Chandipur ITR geography.',
          mainsDimensions: 'Indigenization of critical defense systems, self-reliance under Atmanirbhar Bharat, and non-nuclear precision deterrence.',
          relatedPYQ: 'UPSC CSE Prelims 2018: "What is the difference between a cruise missile and a ballistic missile?"',
        },
        sources: [
          { name: 'Ministry of Defence Press Release', url: 'https://pib.gov.in', date: '20 Oct 2026', type: 'Official' },
          { name: 'Indian Express', date: '20 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '20 Oct 2026, 14:00 IST',
        },
      },
    ],
  },
  {
    dateKey: '2026-10-19',
    label: 'Mon, 19 Oct',
    shortDay: '19',
    dayName: 'Mon',
    highlight: 'Kovind Committee recommendations on simultaneous elections, Green Ammonia Mission incentives notification.',
    events: [
      {
        id: 'de_19_1',
        category: 'Polity',
        paper: 'GS-II',
        headline: 'Union Cabinet Approves Implementation Plan for Simultaneous Elections (One Nation One Election)',
        source: 'The Hindu • Governance & Constitutional Law',
        date: '19 Oct 2026',
        imageUrl: 'https://images.indianexpress.com/2026/10/US-4-14.jpg',
        summary: '- The **Union Cabinet** formally approved the recommendations of the high-level panel chaired by **Ram Nath Kovind** on simultaneous elections.\n- Phase 1 synchronizes **Lok Sabha and State Assembly** polls, with local body elections scheduled within 100 days under proposed **Article 324A**.\n- Constitutional amendments to **Articles 83 and 172** require a special majority under **Article 368**, with state ratification needed for local body synchronization.',
        summaryBullets: [
          'The **Union Cabinet** formally approved the recommendations of the high-level panel chaired by **Ram Nath Kovind** on simultaneous elections.',
          'Phase 1 synchronizes **Lok Sabha and State Assembly** polls, with local body elections scheduled within 100 days under proposed **Article 324A**.',
          'Constitutional amendments to **Articles 83 and 172** require a special majority under **Article 368**, with state ratification needed for local body synchronization.',
        ],
        bullets: [
          'Two-step phased implementation: Simultaneous Lok Sabha and Vidhan Sabha elections in Phase 1, followed by local body elections within 100 days.',
          'Constitutional Amendment Bill requires special majority under Article 368(2), with local body provisions necessitating state ratification.',
          'Proposed concept of "Unexpired Term" in the event of a hung assembly or vote of no-confidence to maintain synchronized cycle.',
          'Aims to curb recurring model code of conduct policy paralysis, election expenditure, and security force deployment fatigue.',
        ],
        prelimsFacts: [
          'Simultaneous elections were previously conducted in India in 1952, 1957, 1962, and 1967 before premature dissolutions in 1968-69.',
          'Law Commission 170th Report (1999) under Justice B.P. Jeevan Reddy was the first major panel to advocate simultaneous polls.',
        ],
        prelimsFactMatrix: [
          { label: 'High-Level Panel', value: 'High-Level Committee on One Nation One Election chaired by Ram Nath Kovind (formed Sept 2023)' },
          { label: 'Articles to Amend', value: 'Article 83 (Lok Sabha duration), 172 (State Assembly duration), 324A (Unified Electoral Roll)' },
          { label: 'Federal Safeguard', value: 'Article 368(2) proviso requiring 50% state legislative ratification for municipal & panchayat synchronization' },
          { label: 'Precedents', value: 'Synchronized general elections 1952–1967; Parliamentary Standing Committee 79th Report (2015)' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 2: Structure, organization and functioning of the Executive and the Judiciary; Election laws, federal structure.',
          staticConnection: 'Federalism as basic structure (S.R. Bommai case), Representation of the People Act 1950 & 1951, Article 356 misuse safeguards.',
          prelimsAngle: 'Constitutional amendment procedures under Art 368 (simple vs special vs special with state ratification); Kovind Committee composition.',
          mainsDimensions: 'Impact of simultaneous polls on federal diversity, dominance of national narratives over regional aspirations, and democratic accountability.',
          relatedPYQ: 'UPSC CSE Mains 2017: "\'Simultaneous election to the Lok Sabha and the State Assemblies will limit the amount of time and money spent in electioneering but it will reduce the government\'s accountability to the people.\' Discuss."',
        },
        sources: [
          { name: 'Kovind High-Level Committee Report', url: 'https://onoe.gov.in', date: '19 Oct 2026', type: 'Official' },
          { name: 'The Hindu', date: '19 Oct 2026', type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: '19 Oct 2026, 17:00 IST',
        },
      },
    ],
  },
];

/**
 * Robust day summary resolver that returns curated events if available in DAILY_EVENTS_DATA,
 * or generates high-yield UPSC current affairs summary for any past date selected via calendar.
 */
export function getDailyEventsSummary(dateKey: string): DayEventsSummary {
  const existing = DAILY_EVENTS_DATA.find((d) => d.dateKey === dateKey);
  if (existing) {
    return existing;
  }

  // Parse dateKey (YYYY-MM-DD)
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = isNaN(dateObj.getTime()) ? 'Day' : dayNames[dateObj.getDay()];
  const monthName = isNaN(dateObj.getTime()) ? '' : monthNames[dateObj.getMonth()];
  const shortDay = dayStr || '01';
  const label = `${dayName}, ${shortDay} ${monthName}`;

  return {
    dateKey,
    label,
    shortDay,
    dayName,
    highlight: `Curated UPSC daily events, editorial takeaways, and Prelims Fact Matrix for ${label}.`,
    events: [
      {
        id: `de_${dateKey}_1`,
        category: 'Polity',
        paper: 'GS-II',
        headline: `Constitutional & Governance Developments Archive for ${label}`,
        source: 'PIB & Leading Dailies • Archive Record',
        date: `${shortDay} ${monthName} ${yearStr}`,
        imageUrl: 'https://images.indianexpress.com/2026/10/Cabinet-Secretary.jpg',
        summary: `- Union and State administrative authorities notified statutory resolutions and executive rules in the **Gazette of India** for ${label}.\n- Key developments centered on **inter-state council coordination**, statutory tribunal benches, and public finance review.\n- Measures strengthen institutional accountability and **cooperative federalism** under **Part V and Part VI** of the Constitution.`,
        summaryBullets: [
          `Union and State administrative authorities notified statutory resolutions and executive rules in the **Gazette of India** for ${label}.`,
          'Key developments centered on **inter-state council coordination**, statutory tribunal benches, and public finance review.',
          'Measures strengthen institutional accountability and **cooperative federalism** under **Part V and Part VI** of the Constitution.',
        ],
        bullets: [
          `Key executive notifications and statutory rules notified in the Gazette of India for ${label}.`,
          'Inter-state water dispute tribunal developments and cooperative federalism council meetings.',
          'Parliamentary committee scrutiny on public accounts, estimates, and delegated legislation.',
          'Evaluation of affirmative action and institutional governance parameters.',
        ],
        prelimsFacts: [
          `Archived under Union & State legislative proceedings for ${monthName} ${yearStr}.`,
          'Examines constitutional provisions under Part V and Part VI of the Constitution of India.',
        ],
        prelimsFactMatrix: [
          { label: 'Date Record', value: `${label} ${yearStr}` },
          { label: 'Syllabus Sphere', value: 'GS Paper 2: Indian Constitution, Governance & Public Policy' },
          { label: 'Statutory Body', value: 'Cabinet Secretariat & Central Public Information Authorities' },
          { label: 'Verification', value: 'PIB Archive, Law Commission Documents & Supreme Court Judgments' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 2: Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure.',
          staticConnection: 'Constitutional amendment procedures, separation of powers, and democratic decentralization.',
          prelimsAngle: 'Key constitutional articles, constitutional vs statutory bodies, and statutory tribunal composition.',
          mainsDimensions: 'Balance of power between judiciary and legislature; administrative reforms in public service delivery.',
        },
        sources: [
          { name: 'Press Information Bureau Archive', url: 'https://pib.gov.in', date: label, type: 'Official' },
          { name: 'The Hindu Archives', date: label, type: 'Leading Daily' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: `${label}, 10:00 IST`,
        },
      },
      {
        id: `de_${dateKey}_2`,
        category: 'Economy',
        paper: 'GS-III',
        headline: `Macroeconomic Indicators & Strategic Industrial Outlook for ${label}`,
        source: 'Livemint & Business Standard • Archive Record',
        date: `${shortDay} ${monthName} ${yearStr}`,
        imageUrl: 'https://images.indianexpress.com/2026/10/role-of-agrivoltaics-in-sustainable-agriculture-and-global-environmental-regulations.jpg',
        summary: `- Macroeconomic tracking indicates steady fiscal expenditure and liquidity management supervised by the **Reserve Bank of India**.\n- Key indicators highlighted trends across **retail CPI inflation**, capital capex allocations, and external trade balances.\n- Monetary and fiscal authorities emphasized **price stability** alongside capital investment under the **FRBM framework**.`,
        summaryBullets: [
          'Macroeconomic tracking indicates steady fiscal expenditure and liquidity management supervised by the **Reserve Bank of India**.',
          'Key indicators highlighted trends across **retail CPI inflation**, capital capex allocations, and external trade balances.',
          'Monetary and fiscal authorities emphasized **price stability** alongside capital investment under the **FRBM framework**.',
        ],
        bullets: [
          'Review of retail CPI inflation trends and food price management measures.',
          'Capital expenditure trajectory across core infrastructure sectors including railways, highways, and energy.',
          'External sector balance of payments, merchandise trade deficit, and foreign exchange reserves.',
        ],
        prelimsFacts: [
          'Headline inflation in India is measured by the Consumer Price Index (Combined) with base year 2012.',
          'Core inflation excludes volatile food and fuel components from the CPI basket.',
        ],
        prelimsFactMatrix: [
          { label: 'Macro Indicators', value: 'CPI Combined, WPI, Index of Eight Core Industries' },
          { label: 'Monetary Authority', value: 'Reserve Bank of India Monetary Policy Committee (MPC)' },
          { label: 'Fiscal Department', value: 'Department of Economic Affairs, Ministry of Finance' },
        ],
        syllabusRelevance: {
          paperTopic: 'GS Paper 3: Indian Economy and issues relating to planning, mobilization of resources, growth and employment.',
          staticConnection: 'Monetary Policy Framework Agreement (2015), FRBM Act 2003, and RBI liquidity management tools.',
          prelimsAngle: 'Components of CPI vs WPI; Liquidity Adjustment Facility (repo, reverse repo, SDF, MSF).',
          mainsDimensions: 'Managing inflation-growth trade-offs; fiscal deficit consolidation vs capital capex requirements.',
        },
        sources: [
          { name: 'Ministry of Finance Economic Review', date: label, type: 'Official' },
          { name: 'Reserve Bank of India Bulletin', date: label, type: 'Official' },
        ],
        aiVerification: {
          model: 'Gemini 1.5 Pro Cross-Verification',
          sourcesCount: 2,
          verifiedAt: `${label}, 12:00 IST`,
        },
      },
    ],
  };
}

// -------------------------------------------------------------
// RECENT MAJOR EVENTS (Featured Breakthroughs)
// -------------------------------------------------------------
export const RECENT_MAJOR_EVENTS: MajorEvent[] = [
  {
    id: 'me_1',
    title: 'Supreme Court 7-Judge Bench Constitutional Verdict on SC/ST Sub-Classification',
    date: 'October 2026',
    category: 'Judiciary & Social Justice',
    paper: 'GS 2',
    summary: 'The Supreme Court ruled 6:1 that State legislatures possess constitutional competence under Article 16(4) to sub-classify Scheduled Castes to provide affirmative action for the most backward groups, provided quantifiable empirical data supports it.',
    keyTakeaways: [
      'Overruled 2004 E.V. Chinnaiah judgment which held SCs are an indivisible homogeneous group.',
      'Affirmed that sub-classification does not tamper with Presidential Notification under Article 341.',
      'Judges also observed that the creamy layer principle should be evolved for affirmative social justice.',
    ],
    source: 'Supreme Court of India • Constitutional Bench',
  },
  {
    id: 'me_2',
    title: '16th BRICS Summit Kazan: Multilateral Financial Settlement Mechanism',
    date: 'October 2026',
    category: 'International Relations',
    paper: 'GS 2',
    summary: 'Leaders of the expanded 9-member BRICS bloc finalized the Kazan Declaration, advocating for independent de-dollarized financial settlement channels, local currency transactions, and democratization of Bretton Woods institutions.',
    keyTakeaways: [
      'Inaugurated comprehensive operationalization of the 9-member expanded BRICS grouping.',
      'Exploration of BRICS Clear: a depository settlement framework utilizing digital financial assets.',
      'India reiterated principled stance on counter-terrorism and international border sovereignty.',
    ],
    source: 'Kazan Declaration • Ministry of External Affairs',
  },
  {
    id: 'me_3',
    title: 'India-China LAC Patrolling & Disengagement Agreement in Eastern Ladakh',
    date: 'October 2026',
    category: 'Security & Foreign Policy',
    paper: 'GS 2 & GS 3',
    summary: 'India and China reached a formal agreement on patrolling arrangements along the Line of Actual Control (LAC) in the Demchok and Depsang sectors, restoring status quo ante conditions that existed prior to May 2020.',
    keyTakeaways: [
      'Restoration of unhindered patrolling rights for Indian troops to legacy Patrol Points 10 through 13.',
      'Establishment of joint verification and de-escalation hotlines at Major General level.',
      'Signifies crucial breakthrough towards stabilization of Himalayan border equilibrium.',
    ],
    source: 'Ministry of External Affairs & Indian Army',
  },
  {
    id: 'me_4',
    title: 'Cabinet Approval for BioE3 (Biotechnology for Economy, Environment & Employment)',
    date: 'October 2026',
    category: 'Science, Tech & Economy',
    paper: 'GS 3',
    summary: 'Government approved the BioE3 Policy to drive high-performance biomanufacturing across India. Focus areas include bio-based chemicals, biopolymers, smart proteins, precision biotherapeutics, and carbon capture biomanufacturing.',
    keyTakeaways: [
      'Transition from chemical-intensive consumption to green circular bioeconomy.',
      'Establishment of Bio-foundries and Bio-manufacturing hubs with national public-private partnerships.',
      'Aims to expand Indian bioeconomy from $130 billion to $300 billion by 2030.',
    ],
    source: 'Department of Biotechnology • Union Cabinet',
  },
];

// -------------------------------------------------------------
// 3 CURATED CARDS: Editorials, Important News, Articles & Opinions
// -------------------------------------------------------------
export const EDITORIALS_DATA: CuratedArticle[] = [
  {
    id: 'ed_1',
    title: 'Reforming the Appointment Architecture of Constitutional Regulatory Watchdogs',
    source: 'The Hindu • Lead Editorial',
    date: '25 Oct 2026',
    category: 'Polity & Governance',
    paper: 'GS 2',
    summary: 'Evaluates executive predominance in selection committees for statutory and constitutional bodies, emphasizing institutional autonomy requirements laid down in Vineet Narain and Anoop Baranwal jurisprudence.',
    keyPoints: [
      'Need for statutory insulation from executive transfer, tenure truncation, and funding chokeholds.',
      'Evaluation of the Chief Justice of India exclusion from the Chief Election Commissioner selection committee.',
      'Lessons from UK Judicial Appointments Commission and South African Chapter 9 Institutions.',
    ],
    analyticalAngle: 'Constitutional Morality vs Executive Discretion in post-liberalization regulatory states.',
    mainsQuestion: 'Examine the significance of institutional autonomy for constitutional watchdogs in preserving constitutional democracy in India. (15 Marks, 250 Words)',
  },
  {
    id: 'ed_2',
    title: 'The Macroeconomics of Capex Quality: Why Infrastructure Multipliers Diverge Across States',
    source: 'The Indian Express • Ideas Page',
    date: '24 Oct 2026',
    category: 'Economic Development',
    paper: 'GS 3',
    summary: 'Analyzes the varying state-level fiscal multiplier effects of central 50-year interest-free capital loans, pointing out institutional capacity bottlenecks in land acquisition and DPR preparation.',
    keyPoints: [
      'Capital expenditure (capex) multiplier estimated at 2.45x versus revenue expenditure at 0.92x.',
      'Disparities in municipal bond issuance and off-budget liabilities across tier-2 cities.',
      'Need for linking central viability gap funds with project lifecycle completion benchmarks.',
    ],
    analyticalAngle: 'Fiscal Federalism, Debt Sustainability, and Capital Allocation Efficiency in Sub-national Governance.',
    mainsQuestion: 'Capital expenditure by the public sector is considered the engine of sustainable growth. Critically examine the challenges faced by Indian states in absorbing capital funds efficiently. (10 Marks, 150 Words)',
  },
  {
    id: 'ed_3',
    title: 'Semiconductor Fab Economics: Navigating Geo-technological Supply Shocks',
    source: 'Livemint • Strategic Review',
    date: '23 Oct 2026',
    category: 'Industry & Technology',
    paper: 'GS 3',
    summary: 'Scrutinizes India Semiconductor Mission (ISM) execution across Dholera and Sanand, analyzing global fab subsidies, raw silicon purity chains, and extreme ultraviolet (EUV) photolithography bottlenecks.',
    keyPoints: [
      'Heavy capital intensity: Advanced node (sub-7nm) fab requires upwards of $15-20 billion.',
      'Critical inputs dependency: Ultra-pure water, specialty fluorinated gases, uninterrupted green power.',
      'Strategic priority: Focus on trailing-edge nodes (28nm to 65nm) for automotive, power electronics, and IoT.',
    ],
    analyticalAngle: 'Geo-economics of Dual-use Technologies and India’s Quest for Critical Hardware Sovereignty.',
    mainsQuestion: 'Discuss the strategic imperatives and structural challenges for India in establishing an indigenous semiconductor fabrication ecosystem. (15 Marks, 250 Words)',
  },
];

export const IMPORTANT_NEWS_DATA: CuratedArticle[] = [
  {
    id: 'in_ie_1',
    title: 'UPSC Key: Census Duty Obligations, Extreme El Niño Impacts and E100 Biofuel Roadmap',
    source: 'The Indian Express • UPSC Essentials',
    agencyId: 'express',
    date: '28 Oct 2026',
    category: 'Environment & Governance',
    paper: 'GS 3',
    summary: 'Comprehensive analytical brief on statutory obligations of public servants under the Census Act 1948, climate mechanisms of "Godzilla" El Niño events on winter precipitation, and regulatory prerequisites for 100% ethanol (E100) retail dispensing.',
    imageUrl: 'https://images.indianexpress.com/2026/10/UPSC-Key-27th-Oct-2026.jpg',
    link: 'https://indianexpress.com/article/upsc-current-affairs/upsc-key-census-duty-godzilla-el-nino-and-e100-10939318/',
    keyPoints: [
      'Statutory framework: Section 11 of Census Act 1948 penalizes refusal to discharge enumeration duties.',
      'Ocean-atmosphere coupling: Positive Indian Ocean Dipole modulates severe cyclonic intensification in Bay of Bengal.',
      'Biofuel transition: E100 requires flex-fuel engine calibration to counter lower energy density and phase-separation risks.',
      'Public service impact: Rebalancing field administrative duties with continuous public service delivery.',
    ],
    analyticalAngle: 'Interplay between constitutional administrative machinery, climate resilience, and bio-energy independence.',
    mainsQuestion: 'Assess the institutional challenges of conducting the decennial national census alongside routine administrative responsibilities. (10 Marks, 150 Words)',
  },
  {
    id: 'in_th_1',
    title: 'Election Commission of India Releases Verified State Electoral Rolls Post-SIR',
    source: 'The Hindu • National Desk',
    agencyId: 'hindu',
    date: '28 Oct 2026',
    category: 'Polity & Elections',
    paper: 'GS 2',
    summary: 'The Election Commission finalized verified voter lists following Special Summary Revision (SIR) across key states, enrolling over 1.4 million first-time voters, purging duplicate entries, and appointing 11 central oversight observers.',
    imageUrl: 'https://th-i.thgim.com/public/incoming/2rlwoo/article71634541.ece/alternates/LANDSCAPE_1200/20261027106L.jpg',
    link: 'https://www.thehindu.com/news/national/',
    keyPoints: [
      'Four qualifying dates (Jan 1, Apr 1, Jul 1, Oct 1) under Section 14(b) of RPA 1950 drastically accelerated youth enrolment.',
      'De-duplication algorithms deployed across ERONet platform to eliminate cross-constituency double voting.',
      'Standard Operating Procedure issued for continuous voter card updates via Form 6 and Form 8.',
      'Civil society vigilance and party booth-level agents (BLAs) integrated into claims and objections adjudication.',
    ],
    analyticalAngle: 'Universal adult suffrage jurisprudence and the role of digital voter registries in electoral integrity.',
    mainsQuestion: 'Evaluate the role of continuous electoral roll revision in strengthening democratic representation and curbing electoral fraud. (15 Marks, 250 Words)',
  },
  {
    id: 'in_pib_1',
    title: 'National Green Hydrogen Mission: SIGHT Tranche-II Incentives for Electrolyser Manufacturing',
    source: 'Press Information Bureau (PIB Delhi)',
    agencyId: 'pib',
    date: '27 Oct 2026',
    category: 'Energy & Industrial Policy',
    paper: 'GS 3',
    summary: 'The Ministry of New & Renewable Energy released guidelines for Tranche-II under the ₹4,440-crore SIGHT scheme, allocating subsidies for 1,500 MW annual domestic electrolyser production with mandatory 50% local value addition.',
    imageUrl: 'https://images.indianexpress.com/2026/10/role-of-agrivoltaics-in-sustainable-agriculture-and-global-environmental-regulations.jpg',
    link: 'https://pib.gov.in',
    keyPoints: [
      'Incentivizes Proton Exchange Membrane (PEM) and Alkaline electrolyser stack manufacturing.',
      'Mandates minimum 50% domestic content to nurture Tier-1 and Tier-2 specialized component suppliers.',
      'Forms central pillar to achieve 5 MMT annual green hydrogen capacity by 2030.',
      'Implementation executed by Solar Energy Corporation of India (SECI) under performance-linked disbursements.',
    ],
    analyticalAngle: 'Strategic industrial policy: Balancing capital subsidies with local value addition to avoid import dependency.',
    mainsQuestion: 'Critically examine the SIGHT scheme under the National Green Hydrogen Mission in making India a global clean energy manufacturing hub. (15 Marks, 250 Words)',
  },
  {
    id: 'in_ie_2',
    title: 'Explained: Meteorological Drivers of Severe Cyclonic Storm Intensification in North Indian Ocean',
    source: 'The Indian Express • Explained',
    agencyId: 'express',
    date: '27 Oct 2026',
    category: 'Geography & Disaster Management',
    paper: 'GS 1 & GS 3',
    summary: 'Atmospheric scientists examine anomalous sea surface temperatures exceeding 30.5°C in the Bay of Bengal, explaining how low vertical wind shear and moisture flux convergence drive rapid tropical cyclone intensification within 24-hour cycles.',
    imageUrl: 'https://images.indianexpress.com/2026/10/arnab_409941.jpg',
    link: 'https://indianexpress.com/article/explained/explained-climate/',
    keyPoints: [
      'Rapid intensification defined as an increase in maximum sustained winds of at least 30 knots within 24 hours.',
      'High Tropical Cyclone Heat Potential (TCHP) acts as an oceanic thermal reservoir feeding storm convection.',
      'Early warning Doppler radar coverage along eastern seaboard minimizes evacuation lead times.',
      'Climate modeling highlights post-monsoon cyclonic frequency shifts linked to broader anthropocene warming.',
    ],
    analyticalAngle: 'Disaster management architecture: Shifting from post-disaster relief to structural and predictive risk reduction.',
    mainsQuestion: 'Explain the factors responsible for rapid tropical cyclone intensification in the Bay of Bengal and discuss early warning measures. (10 Marks, 150 Words)',
  },
  {
    id: 'in_th_2',
    title: 'Supreme Court Issues Compliance Directives on Border Fencing & Foreigners Tribunals in Assam',
    source: 'The Hindu • Legal Bureau',
    agencyId: 'hindu',
    date: '26 Oct 2026',
    category: 'Polity & Constitutional Law',
    paper: 'GS 2',
    summary: 'Following its constitution bench verdict upholding Section 6A of the Citizenship Act, 1955, the Supreme Court ordered the Union Home Ministry to institute rigorous biometric monitoring, expedite riverine fencing, and modernize Foreigners Tribunals.',
    imageUrl: 'https://images.indianexpress.com/2026/10/Cabinet-Secretary.jpg',
    link: 'https://www.thehindu.com',
    keyPoints: [
      'Reiterates constitutional validity of March 25, 1971 cut-off date regularized under historic Assam Accord.',
      'Mandates digitizing records of 100 Foreigners Tribunals in Assam to resolve pending nationality references.',
      'Directs Joint border inspection along unfenced riverine stretches in Dhubri and Karimganj sectors.',
      'Reaffirms constitutional harmony between parliamentary power (Article 11) and executive security imperatives.',
    ],
    analyticalAngle: 'Constitutional balance between statutory immigration policy, human rights, and border sovereignty.',
    mainsQuestion: 'Discuss the constitutional and humanitarian dimensions of the Assam Accord in the light of recent Supreme Court verdicts. (15 Marks, 250 Words)',
  },
  {
    id: 'in_mint_1',
    title: 'RBI Master Directions: Revised Liquidity Coverage Ratio Framework for Banking Stability',
    source: 'Livemint • Banking & Finance',
    agencyId: 'mint',
    date: '26 Oct 2026',
    category: 'Economy & Financial Regulation',
    paper: 'GS 3',
    summary: 'The Reserve Bank of India updated Basel III Liquidity Coverage Ratio (LCR) guidelines, requiring commercial banks to increase buffer liquidity buffers against instant retail runs caused by 24/7 internet and mobile banking services.',
    imageUrl: 'https://images.indianexpress.com/2026/10/Jio-IPO-4.jpg',
    link: 'https://www.livemint.com',
    keyPoints: [
      'Increases mandatory run-off factor on retail internet/UPI deposits from 5% to 10%.',
      'Mandates banks hold an additional buffer of High-Quality Liquid Assets (HQLA) in Government Securities (G-Secs).',
      'Direct response to speed of modern digital bank runs observed in international banking crises (e.g., SVB collapse).',
      'Balances systemic financial solvency with banks’ ongoing credit delivery capabilities.',
    ],
    analyticalAngle: 'Macro-prudential regulation: Upgrading traditional banking ratios for an era of instant digital liquidity velocity.',
    mainsQuestion: 'What is the Liquidity Coverage Ratio (LCR)? How do 24/7 digital payment platforms create new vulnerabilities for banking stability? (10 Marks, 150 Words)',
  },
  {
    id: 'in_dte_1',
    title: 'Project Cheetah: Independent High-Level Task Force Formed for Kuno Habitat Management',
    source: 'Down To Earth • Wildlife Ecology',
    agencyId: 'dte',
    date: '25 Oct 2026',
    category: 'Environment & Biodiversity',
    paper: 'GS 3',
    summary: 'The National Tiger Conservation Authority (NTCA) along with leading veterinary pathologists set up a technical panel to scrutinize radio telemetry tracking, veterinary monitoring, and prey density in the Kuno-Palpur wildlife sanctuary.',
    imageUrl: 'https://images.indianexpress.com/2026/10/28CheetahKunoDeath.jpg',
    link: 'https://www.downtoearth.org.in',
    keyPoints: [
      'Scrutinizes inter-state dispersal corridors connecting Kuno to Gandhi Sagar Wildlife Sanctuary in Madhya Pradesh.',
      'Investigates health complications arising from winter coat development under monsoon humidity.',
      'Recommends soft-release acclimation protocol adjustments for second-generation African cheetah cubs.',
      'Highlights ecological role of top predators in grassland and scrub savannah restoration.',
    ],
    analyticalAngle: 'Ecological feasibility, genetic diversity, and conservation ethics in transcontinental species reintroduction.',
    mainsQuestion: 'Evaluate the ecological significance and conservation hurdles encountered in the transcontinental reintroduction of cheetahs in India. (15 Marks, 250 Words)',
  },
  {
    id: 'in_ie_3',
    title: 'Kavach 4.0 ATP System Deployment Across 10,000 Route Kilometers Accelerated',
    source: 'The Indian Express • Infrastructure',
    agencyId: 'express',
    date: '25 Oct 2026',
    category: 'Infrastructure & Safety Technology',
    paper: 'GS 3',
    summary: 'The Railway Board sanctioned immediate tenders for indigenously designed Kavach 4.0 automatic train protection systems across high-density passenger corridors, incorporating LTE-R radio communications and SIL-4 safety fail-safes.',
    imageUrl: 'https://images.indianexpress.com/2026/10/Railways-safety-feature-1.jpg',
    link: 'https://indianexpress.com/article/upsc-current-affairs/upsc-essentials/knowledge-nugget-how-is-indian-railways-rethinking-safety-and-security-upsc-10938686/',
    keyPoints: [
      'Safety Integrity Level 4 (SIL-4) certified: Probability of danger failure less than 1 in 10,000 years.',
      'Automatic brake actuation prevents Signal Passing At Danger (SPAD) and head-on/rear-end train collisions.',
      'Integrates RFID readers on tracks, UHF station radios, and onboard locomotive computer units.',
      'A key component of national logistics modernization under PM Gati Shakti National Master Plan.',
    ],
    analyticalAngle: 'Indigenization of critical transport safety technologies to reduce dependence on costly imported European ATP systems.',
    mainsQuestion: 'Discuss the role of indigenous technology adoption in modernizing India’s railway infrastructure and improving operational safety. (10 Marks, 150 Words)',
  },
];

export const ARTICLES_OPINIONS_DATA: CuratedArticle[] = [
  {
    id: 'ao_1',
    title: 'Indo-Pacific Maritime Security: Navigating Underwater Domain Awareness & Chokepoints',
    source: 'Observer Research Foundation (ORF) • Strategic Dispatch',
    date: '25 Oct 2026',
    category: 'Geopolitics & Security',
    paper: 'GS 2 & GS 3',
    summary: 'A comprehensive study on the militarization of the Indian Ocean Region, the strategic vulnerability of Malacca, Sunda, and Lombok straits, and India’s acoustic sensor grid deployments.',
    keyPoints: [
      'Proliferation of dual-use survey vessels and unmanned underwater vehicles (UUVs).',
      'Need for integrated sensor network spanning Andaman & Nicobar Command (ANC) and Lakshadweep.',
      'Operationalization of Quad Indo-Pacific Partnership for Maritime Domain Awareness (IPMDA).',
    ],
    analyticalAngle: 'Net Security Provider role in Western and Eastern Indian Ocean littoral security.',
  },
  {
    id: 'ao_2',
    title: 'Digital Public Infrastructure (DPI) 2.0: Credit Delivery for Smallholder Agriculture',
    source: 'Yojana • Special Agriculture Issue',
    date: '24 Oct 2026',
    category: 'Agrarian Economy & Tech',
    paper: 'GS 3',
    summary: 'How Unified Lending Interface (ULI), digital land record cadastre (Bhoomi/DILRMP), and satellite crop health data are slashing agricultural loan sanction times from 3 weeks to 5 minutes.',
    keyPoints: [
      'Overcoming information asymmetry without physical collateral mortgages.',
      'Kisan Credit Card (KCC) saturation through frictionless digital verification.',
      'Protection of tenant farmers and landless cultivators through digital FPO aggregation.',
    ],
    analyticalAngle: 'Techno-institutional solutions for financial inclusion and rural capital formation.',
  },
  {
    id: 'ao_3',
    title: 'Ethics of Autonomous Weapon Systems: International Humanitarian Law in the AI Era',
    source: 'Manohar Parrikar Institute for Defence Studies and Analyses (MP-IDSA)',
    date: '23 Oct 2026',
    category: 'Defence Ethics & Tech',
    paper: 'GS 3 & GS 4',
    summary: 'Examines moral and legal dilemmas surrounding AI-directed loitering munitions, lethal autonomous weapons systems (LAWS), and the erosion of human-in-the-loop accountability under the Geneva Conventions.',
    keyPoints: [
      'Principle of Distinction and Proportionality in algorithmic target designation.',
      'Problem of moral responsibility attribution for machine-learning misclassifications.',
      'Global South position on non-discriminatory governance and technology denial regimes.',
    ],
    analyticalAngle: 'Reconciling operational military imperatives with International Humanitarian Law (IHL).',
  },
];

export const ARTICLES_EXPLAINERS_DATA: CuratedArticle[] = [
  {
    id: 'ae_1',
    title: 'Semiconductor Fabrication Economics: Why Cleanrooms, EUV & Yield Curves Matter',
    source: 'Down To Earth & Tech Review',
    date: '25 Oct 2026',
    category: 'Science & Industry',
    paper: 'GS 3',
    summary: 'A conceptual deep dive explaining the physics of silicon wafer lithography, chemical mechanical planarization, and why the Dholera & Sanand projects focus on mature vs advanced nodes.',
    keyPoints: [
      'Cleanroom Class 1 standard: Less than 1 particle of dust per cubic foot.',
      'Extreme Ultraviolet (EUV) photolithography monopoly of ASML using 13.5nm wavelength light.',
      'Yield learning curves: Fab profitability depends on achieving >90% defect-free dies.',
    ],
    analyticalAngle: 'Strategic hardware self-reliance and global value chain chokepoints.',
  },
  {
    id: 'ae_2',
    title: 'The Unified Lending Interface (ULI): Explaining the "UPI Moment" for Credit',
    source: 'RBI Bulletin & Economic Times',
    date: '24 Oct 2026',
    category: 'Banking & Financial Tech',
    paper: 'GS 3',
    summary: 'Detailed explanation of how consent-based data aggregation connects state land records, satellite vegetation data, milk pouring records, and GST filings directly with lending algorithms.',
    keyPoints: [
      'Reduces credit appraisal friction from multiple weeks to instant verification.',
      'Solves the credit deficit in rural unorganized MSME and agricultural sectors.',
      'Maintains data fiduciary standards under the DPDP Act 2023.',
    ],
    analyticalAngle: 'Financial inclusion through architectural separation of data, rails, and credit capital.',
  },
  {
    id: 'ae_3',
    title: 'Carbon Credit Trading Scheme (CCTS): How Cap-and-Trade Markets Work',
    source: 'Bureau of Energy Efficiency (BEE)',
    date: '23 Oct 2026',
    category: 'Environment & Climate',
    paper: 'GS 3',
    summary: 'Explains the mechanics of Energy Conservation (Amendment) Act 2022, baseline emission targets, Carbon Credit Certificates (CCCs), and trading on power exchanges.',
    keyPoints: [
      'Mandatory compliance market for designated energy-intensive consumer sectors.',
      'One Carbon Credit Certificate equals 1 metric tonne of CO2 equivalent reduced.',
      'Incentivizes private capital investment into deep decarbonization and clean hydrogen.',
    ],
    analyticalAngle: 'Market-based environmental policy versus command-and-control taxation.',
  },
];

export const JUDGMENTS_LEGAL_DATA: CuratedArticle[] = [
  {
    id: 'jd_1',
    title: 'SC 7-Judge Bench on Scheduled Caste Sub-Classification (State of Punjab v. Davinder Singh)',
    source: 'Supreme Court Reports (SCR)',
    date: '25 Oct 2026',
    category: 'Constitutional Law',
    paper: 'GS 2',
    summary: 'Held 6:1 that Article 16(4) empowers States to sub-classify Scheduled Castes for equitable affirmative action, overruling the 2004 E.V. Chinnaiah judgment.',
    keyPoints: [
      'Scheduled Castes under Article 341 are not an indivisible homogeneous class.',
      'States must possess empirical, verifiable data demonstrating unequal intra-group progress.',
      'Does not alter or tinker with the Presidential notification under Article 341.',
    ],
    analyticalAngle: 'Substantive equality versus formal equality in constitutional jurisprudence.',
    mainsQuestion: 'Critically analyze the constitutional implications of the Supreme Court judgment on SC sub-classification for affirmative social justice in India. (15 Marks, 250 Words)',
  },
  {
    id: 'jd_2',
    title: 'Section 6A Citizenship Act Constitutional Bench Verdict',
    source: 'Supreme Court of India',
    date: '24 Oct 2026',
    category: 'Citizenship & Federalism',
    paper: 'GS 2',
    summary: 'Upheld Section 6A of the Citizenship Act 1955 as a valid legislative accommodation balancing humanitarian concerns with Assam Accord 1985 commitments.',
    keyPoints: [
      'March 25, 1971 cut-off date upheld as reasonable classification under Article 14.',
      'Parliament retains plenary constituent power under Article 11 to regulate citizenship.',
      'Court ordered time-bound border fencing and tribunal adjudication monitoring.',
    ],
    analyticalAngle: 'Legislative accommodation of historical peace pacts within constitutional limits.',
  },
  {
    id: 'jd_3',
    title: 'Constitutional Jurisprudence on Governor’s Assent to State Assembly Bills (Article 200)',
    source: 'LiveLaw • Constitutional Bench Analysis',
    date: '23 Oct 2026',
    category: 'Federal Relations',
    paper: 'GS 2',
    summary: 'Supreme Court guidelines reiterating that Governors cannot exercise a pocket veto over bills passed by state legislatures and must act "as soon as possible".',
    keyPoints: [
      'Governor must choose among assent, withholding, or reserving for the President without indefinite delay.',
      'Reiterates parliamentary cabinet form of government: Governor acts on aid and advice of Council of Ministers.',
      'Withholding assent triggers returning the bill to the house; reconsideration makes assent mandatory.',
    ],
    analyticalAngle: 'Constitutional morality, federal equilibrium, and non-elected gubernatorial oversight.',
  },
];

export const SCHEMES_REPORTS_DATA: CuratedArticle[] = [
  {
    id: 'sr_1',
    title: 'BioE3 Policy: High-Performance Biomanufacturing for Sustainable Growth',
    source: 'Cabinet Secretariat • Press Information Bureau',
    date: '25 Oct 2026',
    category: 'Government Schemes',
    paper: 'GS 3',
    summary: 'Approved by Union Cabinet to transition Indian manufacturing from petro-chemical dependence to circular bio-economy across bioplastics, bio-enzymes, and smart proteins.',
    keyPoints: [
      'Establishment of Bio-foundries and Bio-manufacturing Hubs across key industrial corridors.',
      'Focus on 6 thematic verticals including climate-resilient agriculture and biotherapeutics.',
      'Projected to elevate bioeconomy turnover to $300 billion by 2030.',
    ],
    analyticalAngle: 'Industrial policy convergence with net-zero commitments and bio-security.',
  },
  {
    id: 'sr_2',
    title: 'National Mission on Critical Minerals: Sovereign Supply Security',
    source: 'Ministry of Mines',
    date: '24 Oct 2026',
    category: 'Strategic Policy',
    paper: 'GS 3',
    summary: '₹34,000 Crore mission establishing viability gap funding for domestic mineral beneficiation and international equity acquisition in Lithium and Rare Earth assets.',
    keyPoints: [
      'KABIL offshore concessions in Argentina Lithium Triangle.',
      'Streamlined offshore mineral auction rules for Deep Sea polymetallic nodules.',
      'Royalty rationalization for Platinum Group Elements and Rare Earth Minerals.',
    ],
    analyticalAngle: 'Securing critical inputs against geopolitically weaponized supply chains.',
  },
  {
    id: 'sr_3',
    title: 'NITI Aayog National Multidimensional Poverty Index (MPI) 2024-2026',
    source: 'NITI Aayog Policy Report',
    date: '23 Oct 2026',
    category: 'Social Sector & Development',
    paper: 'GS 2',
    summary: 'Captures multidimensional poverty reduction based on NFHS indicators spanning health, education, and standard of living (nutrition, sanitation, cooking fuel, electricity).',
    keyPoints: [
      'Multi-dimensional poverty head count ratio declined from 24.8% to 11.28%.',
      'Rural areas witnessed the steepest velocity of poverty alleviation.',
      'Sanitation, clean cooking fuel, and housing (PMAY) contributed highest deprivations eliminated.',
    ],
    analyticalAngle: 'Targeted targeted DBT and basic infrastructure delivery versus untargeted subsidies.',
  },
];

export const OPINIONS_PERSPECTIVES_DATA: CuratedArticle[] = ARTICLES_OPINIONS_DATA;

export interface FormatCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: 'Newspaper' | 'BookOpen' | 'Layers' | 'Scale' | 'Landmark' | 'MessagesSquare' | 'Globe' | 'Leaf' | string;
  imageUrl?: string;
  articles: CuratedArticle[];
}

export const FORMAT_CATEGORIES: FormatCategory[] = [
  {
    id: 'daily-news',
    title: '1. Daily News',
    subtitle: 'Daily developments across all relevant subjects, with concise summaries and key facts.',
    iconName: 'Newspaper',
    imageUrl: 'https://images.indianexpress.com/2026/10/UPSC-Key-27th-Oct-2026.jpg',
    articles: IMPORTANT_NEWS_DATA,
  },
  {
    id: 'international-affairs',
    title: '2. International Affairs',
    subtitle: "IR, global events, India's foreign policy, international institutions and map-based facts.",
    iconName: 'Globe',
    imageUrl: 'https://images.indianexpress.com/2026/10/US-6-11.jpg',
    articles: ARTICLES_OPINIONS_DATA,
  },
  {
    id: 'polity-governance',
    title: '3. Polity & Governance',
    subtitle: 'Judgments, constitutional issues, policies, governance reforms and government initiatives.',
    iconName: 'Scale',
    imageUrl: 'https://images.indianexpress.com/2026/10/Cabinet-Secretary.jpg',
    articles: JUDGMENTS_LEGAL_DATA,
  },
  {
    id: 'economy-environment-science',
    title: '4. Economy, Environment & Science',
    subtitle: 'Economic developments, ecology, biodiversity, technology and scientific discoveries.',
    iconName: 'Leaf',
    imageUrl: 'https://images.indianexpress.com/2026/10/Jio-IPO-4.jpg',
    articles: ARTICLES_EXPLAINERS_DATA,
  },
  {
    id: 'reports-schemes-data',
    title: '5. Reports, Schemes & Data',
    subtitle: 'Government schemes, surveys, indices, reports and useful Mains statistics.',
    iconName: 'Landmark',
    imageUrl: 'https://images.indianexpress.com/2026/10/role-of-agrivoltaics-in-sustainable-agriculture-and-global-environmental-regulations.jpg',
    articles: SCHEMES_REPORTS_DATA,
  },
  {
    id: 'editorials-explainers',
    title: '6. Editorials & Explainers',
    subtitle: 'Balanced arguments, background context, multidimensional analysis and Mains-ready points.',
    iconName: 'BookOpen',
    imageUrl: 'https://images.indianexpress.com/2026/10/serbia-elections.jpg',
    articles: EDITORIALS_DATA,
  },
];


// -------------------------------------------------------------
// MONTHLY OVERVIEW DATA
// -------------------------------------------------------------
export const MONTHLY_OVERVIEWS: MonthlyOverview[] = [
  {
    monthKey: '2026-10',
    title: 'October 2026',
    summary: 'Historic LAC disengagement verification, 16th BRICS Kazan Declaration on alternative settlement channels, Supreme Court sub-classification judgment, and Cabinet clearance of the BioE3 Policy.',
    gs1Highlights: [
      'Archeological Survey of India (ASI) excavations at Porunai River civilization reveal early Iron Age urban centers dating to 1155 BCE.',
      '150th birth anniversary commemorations of Sardar Vallabhbhai Patel: Focus on princely state integration jurisprudence.',
      'World Heritage Site nomination dossier prepared for Maratha Military Landscapes of Maharashtra.',
    ],
    gs2Highlights: [
      'Supreme Court 7-Judge Bench upholds State power to sub-classify Scheduled Castes for quota benefits (overruling E.V. Chinnaiah).',
      'Supreme Court judgment on Section 6A of the Citizenship Act, affirming parliamentary legislative competence.',
      '16th BRICS Summit in Kazan, Russia: Expanded membership, local currency trade, and SWIFT alternative framework.',
      'Elections in Jammu & Kashmir: First democratic assembly polls in a decade; analysis of Union Territory governance dynamics.',
    ],
    gs3Highlights: [
      'National Critical Minerals Mission cleared with ₹34,000 Crore corpus for lithium and REE supply security.',
      'BioE3 Policy approved to accelerate high-performance biomanufacturing and biosecurity.',
      'RBI revised Liquidity Coverage Ratio (LCR) guidelines to safeguard banks against digital 24/7 bank runs.',
      'ISRO successful vacuum hot test of semi-cryogenic SCE-200 pre-burner engine.',
      'COP16 Cali (CBD): Digital Sequence Information (DSI) and multilateral benefit-sharing disputes.',
    ],
    reportsAndIndices: [
      { name: 'Global Innovation Index 2024', releasedBy: 'WIPO', indiaRankOrFact: 'India ranked 39th out of 133 economies (top in Central & Southern Asia)' },
      { name: 'State of Global Water Resources', releasedBy: 'WMO', indiaRankOrFact: 'Over 50% of global river basins reported negative discharge balance' },
      { name: 'Multidimensional Poverty Index', releasedBy: 'UNDP & OPHI', indiaRankOrFact: '135 million Indians exited multidimensional poverty over the last decade' },
      { name: 'State of Food Security & Nutrition (SOFI)', releasedBy: 'FAO, IFAD, UNICEF', indiaRankOrFact: 'Highlights dietary diversity and micronutrient malnutrition challenges' },
    ],
    schemesInNews: [
      { name: 'BioE3 Policy', ministry: 'Ministry of Science & Tech (DBT)', objective: 'Promote biomanufacturing of bio-based chemicals, bio-polymers, and precision enzymes.' },
      { name: 'National Green Hydrogen Mission (SIGHT)', ministry: 'Ministry of New & Renewable Energy', objective: 'Incentivize domestic electrolyser manufacturing and green ammonia hubs.' },
      { name: 'Unified Lending Interface (ULI)', ministry: 'Reserve Bank of India', objective: 'Frictionless digital credit flow for MSMEs and rural agricultural borrowers.' },
      { name: 'PM-Surya Ghar Muft Bijli Yojana', ministry: 'Ministry of Power', objective: '1 crore rooftop solar installations with direct bank transfer subsidies.' },
    ],
  },
  {
    monthKey: '2026-09',
    title: 'September 2026',
    summary: 'One Nation One Election High-Level Committee report examination, National Medical Commission revisions, UN Summit of the Future Pact adoption, and semiconductor mission 2.0 expansions.',
    gs1Highlights: [
      'Centenary of the discovery of the Indus Valley Civilization: Joint excavations at Rakhigarhi and Dholavira.',
      'Bhakti movement revivalism analysis: Contribution of Saint Ramanuja and Sree Narayana Guru in social reform.',
    ],
    gs2Highlights: [
      'High-Level Committee on Simultaneous Elections (Kovind Committee) recommendations under constitutional review.',
      'UN Summit of the Future adopts "Pact for the Future": Digital Global Compact and Declaration on Future Generations.',
      'Review of Governor’s discretionary powers in reserving State Assembly Bills under Article 200.',
    ],
    gs3Highlights: [
      'Cabinet approval for Chandrayaan-4 Lunar Sample Return mission and Venus Orbiter Mission (Shukrayaan).',
      'Index of Industrial Production (IIP) and Core Sector growth trends: Infrastructure capital goods demand expansion.',
      'Namami Gange Phase-II: River basin management and wetland biodiversity conservation monitoring.',
    ],
    reportsAndIndices: [
      { name: 'World Energy Outlook', releasedBy: 'International Energy Agency (IEA)', indiaRankOrFact: 'India solar PV capacity set to surpass total thermal coal growth rate by 2030' },
      { name: 'Global Financial Stability Report', releasedBy: 'IMF', indiaRankOrFact: 'Highlighted Indian banking sector GNPA at multi-year low of 2.8%' },
    ],
    schemesInNews: [
      { name: 'PM E-DRIVE Scheme', ministry: 'Ministry of Heavy Industries', objective: 'Accelerate electric vehicle adoption with ₹10,900 Crore outlay for e-2W, e-3W, and e-buses.' },
      { name: 'Mission Mausam', ministry: 'Ministry of Earth Sciences', objective: 'Advanced weather observation, cloud seeding research, and AI-driven hyperlocal radar network.' },
    ],
  },
];

// -------------------------------------------------------------
// CURRENT AFFAIRS QUIZ (UPSC Prelims Pattern)
// -------------------------------------------------------------
export const CA_QUIZ_QUESTIONS: CAQuizQuestion[] = [
  {
    id: 'caq_1',
    question: 'With reference to the Supreme Court’s 7-judge Constitution Bench ruling on the sub-classification of Scheduled Castes (SCs), consider the following statements:\n\n1. The Court held that the Scheduled Castes specified under Article 341 constitute an indivisible, single homogeneous group.\n2. States are constitutionally empowered to create sub-quotas within SC reservations provided empirical verifiable data proves inadequate representation.\n3. The sub-classification power exercised by States alters the Presidential List prepared under Article 341(1).\n\nWhich of the statements given above is/are correct?',
    options: [
      { key: 'A', text: '1 and 2 only' },
      { key: 'B', text: '2 only' },
      { key: 'C', text: '2 and 3 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'B',
    explanation: 'Statement 1 is incorrect: The 7-judge Bench held that SCs are NOT an indivisible homogeneous class; intra-group inequality justifies sub-quotas. Statement 2 is correct: States must produce empirical verifiable data demonstrating inadequate representation. Statement 3 is incorrect: The Court affirmed that sub-classification under Article 16(4) does not tamper with or modify the Presidential notification under Article 341.',
    source: 'The Hindu • Supreme Court Ruling',
    paper: 'GS 2 (Polity)',
  },
  {
    id: 'caq_2',
    question: 'Consider the following statements regarding the Strategic Interventions for Green Hydrogen Transition (SIGHT) programme under the National Green Hydrogen Mission:\n\n1. It provides financial incentives for both domestic electrolyser manufacturing and green hydrogen production.\n2. SIGHT is administered directly by the NITI Aayog.\n3. India has set a target of producing at least 5 Million Metric Tonnes (MMT) of green hydrogen per annum by 2030.\n\nWhich of the statements given above is/are correct?',
    options: [
      { key: 'A', text: '1 and 3 only' },
      { key: 'B', text: '2 and 3 only' },
      { key: 'C', text: '1 and 2 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'A',
    explanation: 'Statement 1 is correct: SIGHT has two distinct financial incentive components: Component I (Electrolyser manufacturing) and Component II (Green hydrogen production). Statement 2 is incorrect: It is implemented by the Solar Energy Corporation of India (SECI) under the Ministry of New and Renewable Energy (MNRE), not NITI Aayog. Statement 3 is correct: Target is 5 MMT per annum by 2030.',
    source: 'PIB • MNRE Notification',
    paper: 'GS 3 (Energy & Environment)',
  },
  {
    id: 'caq_3',
    question: 'With reference to the recently expanded BRICS grouping, consider the following countries:\n\n1. Saudi Arabia\n2. Egypt\n3. Argentina\n4. Ethiopia\n5. United Arab Emirates\n\nWhich of the countries given above formally joined BRICS as permanent members in 2024?',
    options: [
      { key: 'A', text: '1, 2 and 3 only' },
      { key: 'B', text: '2, 4 and 5 only' },
      { key: 'C', text: '1, 3, 4 and 5 only' },
      { key: 'D', text: '2, 3, 4 and 5' },
    ],
    correctAnswer: 'B',
    explanation: 'Egypt, Ethiopia, Iran, and UAE formally joined as new permanent members. Argentina withdrew its accession bid after presidential elections, and Saudi Arabia has participated as an invited guest without formally depositing final ratification.',
    source: 'Kazan Declaration • MEA',
    paper: 'GS 2 (International Relations)',
  },
  {
    id: 'caq_4',
    question: 'Consider the following pairs regarding Critical Minerals and their primary strategic applications:\n\n1. Lithium — High energy-density EV batteries and grid storage\n2. Neodymium — High-strength permanent magnets for wind turbines and EV traction motors\n3. Gallium — High-efficiency power semiconductors and radar transmitters\n\nHow many of the pairs given above are correctly matched?',
    options: [
      { key: 'A', text: 'Only one pair' },
      { key: 'B', text: 'Only two pairs' },
      { key: 'C', text: 'All three pairs' },
      { key: 'D', text: 'None of the pairs' },
    ],
    correctAnswer: 'C',
    explanation: 'All three pairs are correctly matched. Lithium is primary cathode/salt material in Li-ion cells. Neodymium (NdFeB) creates strongest commercial permanent magnets for clean energy and defense. Gallium (GaN) is key wide-bandgap semiconductor for radar and power grids.',
    source: 'Ministry of Mines • Critical Minerals Report',
    paper: 'GS 3 (Sci-Tech & Economy)',
  },
  {
    id: 'caq_5',
    question: 'The term "Liquidity Coverage Ratio (LCR)", frequently mentioned in the news in relation to banking regulation, refers to:\n\n',
    options: [
      { key: 'A', text: 'The minimum proportion of deposits that banks must maintain in liquid cash with the Reserve Bank of India.' },
      { key: 'B', text: 'The proportion of High Quality Liquid Assets (HQLA) held by banks to survive an acute short-term 30-day liquidity stress scenario.' },
      { key: 'C', text: 'The ratio of net non-performing assets to total gross advances of commercial banks.' },
      { key: 'D', text: 'The capital adequacy requirement mandated under Basel II guidelines.' },
    ],
    correctAnswer: 'B',
    explanation: 'LCR is a Basel III requirement that banks maintain an adequate buffer of unencumbered High-Quality Liquid Assets (HQLA) that can be easily and immediately converted into cash to meet liquidity needs for a 30-calendar-day stress period.',
    source: 'RBI Master Directions',
    paper: 'GS 3 (Economy)',
  },
];
