/**
 * Intelligent 3-Level Hybrid PYQ Matching Engine
 * ----------------------------------------------------------------------------
 * Retrieves official UPSC Prelims & Mains previous-year questions directly from
 * the existing integrated repositories (`ALL_CLASSIFIED_PYQS` and `getAllMainsQuestions()`)
 * without duplicating or altering any question data.
 *
 * Matching Levels:
 * - Level 1 (Exact Keyword Match): Exact phrase & normalized token match in question stem,
 *   options, official topic/subtopic tags, or core concept.
 * - Level 2 (Semantic / Conceptual Match): Uses the UPSC Conceptual Knowledge Graph
 *   (`UPSC_CONCEPT_ONTOLOGY`) to retrieve questions on constitutional articles, landmark
 *   judgments, doctrines, committees, acts, and sister concepts even when the exact keyword
 *   does not appear in the question text.
 * - Level 3 (Subject & Syllabus Mapping): Maps queries across UPSC Subject -> GS Paper ->
 *   Topic -> Subtopic -> Related Concepts while guarding against false-positive word collisions.
 */

import { ALL_CLASSIFIED_PYQS } from '@/data/questionBankRepository';
import { getAllMainsQuestions } from '@/data/mainsQuestionRepository';
import { UPSC_PRELIMS_TAXONOMY } from '@/constants/upscTaxonomy';
import { PYQQuestion, DifficultyLevel } from '@/types/prelims';
import { MainsQuestionRecord } from '@/types/mains';

export type PYQExamType = 'PRELIMS' | 'MAINS';
export type PYQGSPaper = 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'ESSAY';
export type PYQMatchTier = 'exact' | 'conceptual' | 'syllabus';
export type PYQQuestionFormat =
  | 'MCQ'
  | 'STATEMENT'
  | 'MATCH_LIST'
  | 'PASSAGE'
  | 'MAINS_THEORY'
  | 'MAINS_CASE_STUDY'
  | 'ESSAY';

export interface MatchedPYQItem {
  id: string;
  examType: PYQExamType;
  year: number;
  gsPaper: PYQGSPaper;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: DifficultyLevel;
  questionType: PYQQuestionFormat;
  relevanceScore: number; // 0 - 100
  matchTier: PYQMatchTier;
  matchedTerms: string[];
  matchReason: string;
  prelimsQuestion?: PYQQuestion;
  mainsQuestion?: MainsQuestionRecord;
}

export interface UPSCConceptNode {
  id: string;
  title: string;
  subject: string;
  gsPapers: PYQGSPaper[];
  aliases: string[];
  relatedConcepts: string[];
  /** High-precision conceptual triggers (articles, doctrines, judgments, acts, mechanisms) */
  conceptualKeywords: string[];
  /** Broader syllabus subtopic & chapter terms */
  syllabusKeywords: string[];
  /** Negative terms to avoid false positives */
  excludeTerms?: string[];
}

// ============================================================================
// CURATED UPSC CONCEPTUAL KNOWLEDGE GRAPH (60+ HIGH-YIELD CONCEPTS)
// ============================================================================

export const UPSC_CONCEPT_ONTOLOGY: UPSCConceptNode[] = [
  // --- POLITY & GOVERNANCE ---
  {
    id: 'concept_judicial_review',
    title: 'Judicial Review',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'judicial review',
      'power of judicial review',
      'constitutional review',
      'judicial scrutiny',
      'constitutional validity',
    ],
    relatedConcepts: [
      'Judicial Activism',
      'Basic Structure Doctrine',
      'Judicial Independence',
      'Constitutional Supremacy',
      'Judicial Overreach',
      'Supreme Court Jurisdiction',
      'Fundamental Rights',
      'Ninth Schedule',
    ],
    conceptualKeywords: [
      'judicial review',
      'article 13',
      'article 32',
      'article 226',
      'article 131',
      'article 136',
      'article 137',
      'article 142',
      'basic structure',
      'kesavananda bharati',
      'minerva mills',
      'golaknath',
      'i.r. coelho',
      'coelho case',
      'l. chandra kumar',
      'ninth schedule',
      '9th schedule',
      'constitutional validity',
      'ultra vires',
      'null and void',
      'void to the extent',
      'due process of law',
      'procedure established by law',
      'judicial activism',
      'judicial overreach',
      'judicial restraint',
      'constitutional supremacy',
      'power of the supreme court',
      'powers of the supreme court',
      'high court writ',
      'violative of fundamental rights',
      'abridges any of the rights',
      'judicial independence',
      '38th amendment',
      '42nd amendment',
      '44th amendment',
      '99th amendment',
      'njac',
    ],
    syllabusKeywords: [
      'judiciary',
      'supreme court',
      'high court',
      'constitutional amendments',
      'separation of powers',
    ],
  },
  {
    id: 'concept_judicial_activism',
    title: 'Judicial Activism',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'judicial activism',
      'public interest litigation',
      'pil',
      'social action litigation',
      'epistolary jurisdiction',
    ],
    relatedConcepts: [
      'Judicial Review',
      'Judicial Overreach',
      'Separation of Powers',
      'Article 21 Expansion',
      'Article 142 Complete Justice',
      'Supreme Court Jurisdiction',
    ],
    conceptualKeywords: [
      'judicial activism',
      'judicial overreach',
      'judicial restraint',
      'public interest litigation',
      'locus standi',
      'article 142',
      'complete justice',
      'article 21',
      'article 32',
      'article 226',
      'vishaka guidelines',
      'hussainara khatoon',
      'p.n. bhagwati',
      'due process of law',
      'judicial legislation',
      'separation of powers',
      'continuing mandamus',
    ],
    syllabusKeywords: ['judiciary', 'supreme court', 'pil', 'separation of powers'],
  },
  {
    id: 'concept_judicial_independence',
    title: 'Judicial Independence',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'judicial independence',
      'independence of judiciary',
      'independent judiciary',
      'collegium system',
    ],
    relatedConcepts: [
      'Judicial Review',
      'Supreme Court Jurisdiction',
      'Separation of Powers',
      'Basic Structure Doctrine',
      'Appointment of Judges',
    ],
    conceptualKeywords: [
      'judicial independence',
      'independence of judiciary',
      'independent judiciary',
      'collegium',
      'national judicial appointments commission',
      'njac',
      '99th constitutional amendment',
      'three judges cases',
      'removal of judge',
      'impeachment of judge',
      'judges inquiry act',
      'security of tenure',
      'charged on the consolidated fund',
      'article 50',
      'article 124',
      'article 217',
      'contempt of court',
      'court of record',
      'separation of judiciary from executive',
    ],
    syllabusKeywords: ['judiciary', 'supreme court', 'high court'],
  },
  {
    id: 'concept_judicial_overreach',
    title: 'Judicial Overreach',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'judicial overreach',
      'judicial restraint',
      'judicial legislation',
      'judicialadventurism',
    ],
    relatedConcepts: [
      'Judicial Activism',
      'Judicial Review',
      'Separation of Powers',
      'Parliamentary Sovereignty',
    ],
    conceptualKeywords: [
      'judicial overreach',
      'judicial restraint',
      'judicial activism',
      'separation of powers',
      'article 142',
      'article 50',
      'executive domain',
      'legislative domain',
      'public interest litigation',
      'checks and balances',
    ],
    syllabusKeywords: ['judiciary', 'separation of powers', 'parliament'],
  },
  {
    id: 'concept_basic_structure',
    title: 'Basic Structure Doctrine',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'basic structure',
      'basic structure doctrine',
      'basic features of the constitution',
      'kesavananda bharati',
    ],
    relatedConcepts: [
      'Judicial Review',
      'Constitutional Amendments (Article 368)',
      'Constitutional Supremacy',
      'Ninth Schedule',
      'Secularism',
      'Federalism',
    ],
    conceptualKeywords: [
      'basic structure',
      'kesavananda bharati',
      'minerva mills',
      'golaknath',
      'shankari prasad',
      'sajjan singh',
      'waman rao',
      'i.r. coelho',
      's.r. bommai',
      'indira nehru gandhi case',
      'article 368',
      'amending power of parliament',
      'constituent power',
      'ninth schedule',
      '9th schedule',
      '24th amendment',
      '42nd amendment',
      'limited government',
      'constitutionalism',
    ],
    syllabusKeywords: ['constitutional amendments', 'preamble', 'salient features', 'judiciary'],
  },
  {
    id: 'concept_sc_jurisdiction',
    title: 'Supreme Court Jurisdiction',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'supreme court jurisdiction',
      'powers of supreme court',
      'original jurisdiction',
      'advisory jurisdiction',
      'appellate jurisdiction',
      'writ jurisdiction',
    ],
    relatedConcepts: [
      'Judicial Review',
      'Judicial Independence',
      'Judicial Activism',
      'High Court Jurisdiction',
      'Writs (Article 32 & 226)',
    ],
    conceptualKeywords: [
      'supreme court',
      'original jurisdiction',
      'exclusive original jurisdiction',
      'article 131',
      'advisory jurisdiction',
      'article 143',
      'special leave petition',
      'article 136',
      'curative petition',
      'review petition',
      'article 137',
      'article 142',
      'court of record',
      'article 129',
      'contempt of court',
      'article 32',
      'writ jurisdiction',
      'inter-state water dispute',
      'enlargement of jurisdiction',
      'article 138',
    ],
    syllabusKeywords: ['supreme court', 'judiciary', 'high court'],
  },
  {
    id: 'concept_fundamental_rights',
    title: 'Fundamental Rights',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'fundamental rights',
      'part iii',
      'part 3 of constitution',
      'magna carta of india',
      'justiciable rights',
    ],
    relatedConcepts: [
      'Right to Equality (Art 14-18)',
      'Right to Freedom & Privacy (Art 19-22)',
      'Writs (Article 32 & 226)',
      'Judicial Review',
      'Directive Principles (DPSP)',
      'Fundamental Duties',
    ],
    conceptualKeywords: [
      'fundamental right',
      'part iii',
      'article 12',
      'article 13',
      'article 14',
      'article 15',
      'article 16',
      'article 17',
      'article 18',
      'article 19',
      'article 20',
      'article 21',
      'article 21a',
      'article 22',
      'article 23',
      'article 24',
      'article 25',
      'article 26',
      'article 29',
      'article 30',
      'article 32',
      'equality before law',
      'equal protection of laws',
      'untouchability',
      'right to life and personal liberty',
      'right to privacy',
      'puttaswamy',
      'maneka gandhi',
      'preventive detention',
      'habeas corpus',
      'mandamus',
      'certiorari',
      'prohibition',
      'quo warranto',
      'right to education',
      'freedom of speech and expression',
      'reasonable restrictions',
    ],
    syllabusKeywords: ['fundamental rights', 'citizenship', 'writs', 'constitution'],
  },
  {
    id: 'concept_right_to_privacy',
    title: 'Right to Privacy & Article 21',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS4'],
    aliases: [
      'right to privacy',
      'article 21',
      'right to life',
      'personal liberty',
      'puttaswamy judgment',
    ],
    relatedConcepts: [
      'Fundamental Rights',
      'Data Protection',
      'Judicial Activism',
      'Due Process of Law',
    ],
    conceptualKeywords: [
      'right to privacy',
      'article 21',
      'life and personal liberty',
      'puttaswamy',
      'maneka gandhi',
      'hadiya case',
      'right to marry',
      'passive euthanasia',
      'right to die with dignity',
      'procedure established by law',
      'due process of law',
      'data protection',
      'aadhaar judgment',
    ],
    syllabusKeywords: ['fundamental rights', 'article 21', 'judiciary'],
  },
  {
    id: 'concept_writs',
    title: 'Constitutional Writs (Article 32 & 226)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'writs',
      'constitutional writs',
      'article 32',
      'article 226',
      'habeas corpus',
      'mandamus',
      'certiorari',
      'quo warranto',
      'prohibition',
    ],
    relatedConcepts: [
      'Fundamental Rights',
      'Judicial Review',
      'Supreme Court Jurisdiction',
      'High Court Jurisdiction',
    ],
    conceptualKeywords: [
      'habeas corpus',
      'mandamus',
      'prohibition',
      'certiorari',
      'quo warranto',
      'article 32',
      'article 226',
      'writ jurisdiction',
      'constitutional remedies',
      'heart and soul of the constitution',
    ],
    syllabusKeywords: ['fundamental rights', 'supreme court', 'high court'],
  },
  {
    id: 'concept_dpsp',
    title: 'Directive Principles of State Policy (DPSP)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'dpsp',
      'directive principles',
      'directive principles of state policy',
      'part iv',
      'welfare state',
    ],
    relatedConcepts: [
      'Fundamental Rights',
      'Fundamental Duties',
      'Uniform Civil Code (Article 44)',
      'Panchayati Raj (Article 40)',
      'Socio-Economic Justice',
    ],
    conceptualKeywords: [
      'directive principles of state policy',
      'directive principles',
      'dpsp',
      'part iv',
      'article 36',
      'article 37',
      'article 38',
      'article 39',
      'article 39a',
      'article 40',
      'article 41',
      'article 42',
      'article 43',
      'article 44',
      'article 45',
      'article 47',
      'article 48',
      'article 48a',
      'article 50',
      'article 51',
      'uniform civil code',
      'free legal aid',
      'concentration of wealth',
      'equal pay for equal work',
      'non-justiciable',
      'instrument of instructions',
      'gandhian principles',
      'socialist principles',
      'welfare state',
      'champakam dorairajan',
      'minerva mills',
    ],
    syllabusKeywords: ['dpsp', 'directive principles', 'fundamental duties'],
  },
  {
    id: 'concept_fundamental_duties',
    title: 'Fundamental Duties',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'fundamental duties',
      'article 51a',
      'part iva',
      'part iv-a',
      'swaran singh committee',
    ],
    relatedConcepts: [
      'Directive Principles (DPSP)',
      'Fundamental Rights',
      '42nd Constitutional Amendment',
      '86th Constitutional Amendment',
    ],
    conceptualKeywords: [
      'fundamental duties',
      'fundamental duty',
      'article 51a',
      'part iv-a',
      'part iva',
      'swaran singh committee',
      'verma committee',
      '42nd amendment',
      '86th amendment',
      'scientific temper',
      'composite culture',
      'cherish and follow the noble ideals',
      'safeguard public property',
    ],
    syllabusKeywords: ['fundamental duties', 'dpsp'],
  },
  {
    id: 'concept_preamble',
    title: 'Preamble of the Constitution',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'preamble',
      'objectives resolution',
      'sovereign socialist secular democratic republic',
    ],
    relatedConcepts: [
      'Basic Structure Doctrine',
      'Fundamental Rights',
      'Directive Principles (DPSP)',
      'Secularism',
      'Constitutionalism',
    ],
    conceptualKeywords: [
      'preamble',
      'objectives resolution',
      'sovereign, socialist, secular',
      'liberty of thought, expression',
      'equality of status and of opportunity',
      'justice, social, economic and political',
      'fraternity assuring the dignity',
      'berubari union',
      'kesavananda bharati',
      'lic of india case',
      '42nd constitutional amendment',
      '42nd amendment',
      '26th november 1949',
    ],
    syllabusKeywords: ['preamble', 'salient features', 'making of the constitution'],
  },
  {
    id: 'concept_constitutionalism',
    title: 'Constitutionalism & Limited Government',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'constitutionalism',
      'constitutional supremacy',
      'limited government',
      'rule of law',
      'separation of powers',
    ],
    relatedConcepts: [
      'Judicial Review',
      'Basic Structure Doctrine',
      'Fundamental Rights',
      'Checks and Balances',
    ],
    conceptualKeywords: [
      'constitutional government',
      'constitutionalism',
      'limited government',
      'rule of law',
      'arbitrary power',
      'checks and balances',
      'separation of powers',
      'due process of law',
      'equality before law',
      'constitutional morality',
    ],
    syllabusKeywords: ['salient features', 'fundamental rights', 'constitution'],
  },
  {
    id: 'concept_federalism',
    title: 'Federalism & Centre-State Relations',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'federalism',
      'cooperative federalism',
      'competitive federalism',
      'centre-state relations',
      'center-state relations',
      'quasi-federal',
      'seventh schedule',
    ],
    relatedConcepts: [
      'Seventh Schedule & Lists',
      'Governor & President Rule (Art 356)',
      'Finance Commission (Art 280)',
      'GST Council (Art 279A)',
      'Inter-State Council (Art 263)',
      'Rajya Sabha',
    ],
    conceptualKeywords: [
      'federalism',
      'cooperative federalism',
      'competitive federalism',
      'asymmetric federalism',
      'centre-state',
      'union list',
      'state list',
      'concurrent list',
      'residuary power',
      'article 248',
      'article 249',
      'article 254',
      'article 263',
      'inter-state council',
      'sarkaria commission',
      'punchhi commission',
      'rajamannar committee',
      's.r. bommai',
      'article 356',
      'president’s rule',
      'presidents rule',
      'seventh schedule',
      '7th schedule',
      'gst council',
      'finance commission',
      'zonal council',
      'all india services',
      'article 312',
    ],
    syllabusKeywords: ['federalism', 'centre-state relations', 'emergency provisions'],
  },
  {
    id: 'concept_parliament',
    title: 'Parliament & Legislative Procedures',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'parliament',
      'lok sabha',
      'rajya sabha',
      'parliamentary procedures',
      'parliamentary committees',
      'money bill',
      'speaker of lok sabha',
    ],
    relatedConcepts: [
      'Money Bill vs Financial Bill',
      'Parliamentary Committees (PAC, Estimates)',
      'Anti-Defection Law (10th Schedule)',
      'Joint Sitting (Article 108)',
      'Parliamentary Privileges',
    ],
    conceptualKeywords: [
      'lok sabha',
      'rajya sabha',
      'council of states',
      'house of the people',
      'money bill',
      'article 110',
      'article 109',
      'financial bill',
      'article 117',
      'joint sitting',
      'article 108',
      'speaker of the lok sabha',
      'deputy speaker',
      'chairman of rajya sabha',
      'public accounts committee',
      'estimates committee',
      'committee on public undertakings',
      'departmentally related standing committees',
      'parliamentary privileges',
      'article 105',
      'no-confidence motion',
      'censure motion',
      'adjournment motion',
      'calling attention',
      'zero hour',
      'question hour',
      'starred question',
      'private member bill',
      'prorogation',
      'adjournment sine die',
      'dissolution of lok sabha',
      'quorum',
      'whip',
      'office of profit',
    ],
    syllabusKeywords: ['parliament', 'legislature', 'speaker', 'bills'],
  },
  {
    id: 'concept_money_bill',
    title: 'Money Bill & Annual Financial Statement (Budget)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS3'],
    aliases: [
      'money bill',
      'article 110',
      'article 112',
      'annual financial statement',
      'consolidated fund of india',
      'contingency fund',
    ],
    relatedConcepts: [
      'Parliament & Legislative Procedures',
      'Speaker of Lok Sabha',
      'Rajya Sabha Powers',
      'Fiscal Policy & Union Budget',
      'Judicial Review',
    ],
    conceptualKeywords: [
      'money bill',
      'article 109',
      'article 110',
      'financial bill',
      'article 112',
      'annual financial statement',
      'appropriation bill',
      'finance bill',
      'consolidated fund of india',
      'contingency fund of india',
      'public account of india',
      'article 266',
      'article 267',
      'vote on account',
      'charged expenditure',
      'cut motion',
      'guillotine',
    ],
    syllabusKeywords: ['parliament', 'budget', 'fiscal policy'],
  },
  {
    id: 'concept_anti_defection',
    title: 'Anti-Defection Law & Tenth Schedule',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'anti-defection law',
      'anti defection',
      'tenth schedule',
      '10th schedule',
      '52nd amendment',
      '91st amendment',
    ],
    relatedConcepts: [
      'Speaker of Lok Sabha',
      'Judicial Review (Kihoto Hollohan)',
      'Parliamentary Democracy',
      'Representation of the People Act',
    ],
    conceptualKeywords: [
      'anti-defection',
      'tenth schedule',
      '10th schedule',
      '52nd constitutional amendment',
      '52nd amendment',
      '91st constitutional amendment',
      '91st amendment',
      'kihoto hollohan',
      'disqualification on ground of defection',
      'nominated member',
      'independent member',
      'presiding officer',
      'whip',
    ],
    syllabusKeywords: ['parliament', 'elections', 'schedules'],
  },
  {
    id: 'concept_president_governor',
    title: 'President & Governor: Powers & Constitutional Position',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'president of india',
      'governor',
      'pardoning power',
      'ordinance making power',
      'veto power',
      'discretionary power of governor',
    ],
    relatedConcepts: [
      'Federalism & Centre-State Relations',
      'Council of Ministers (Article 74 & 163)',
      'Ordinances (Article 123 & 213)',
      'Emergency Provisions',
    ],
    conceptualKeywords: [
      'president of india',
      'election of the president',
      'electoral college',
      'impeachment of the president',
      'article 61',
      'article 54',
      'article 72',
      'article 161',
      'pardoning power',
      'ordinance',
      'article 123',
      'article 213',
      'pocket veto',
      'suspensive veto',
      'article 111',
      'article 200',
      'article 201',
      'governor reserves a bill',
      'discretionary power of the governor',
      'article 163',
      'article 74',
      'aid and advice',
      'council of ministers',
      'collective responsibility',
      'article 75',
      'article 356',
    ],
    syllabusKeywords: ['union executive', 'state executive', 'president', 'governor'],
  },
  {
    id: 'concept_panchayati_raj',
    title: 'Panchayati Raj & Urban Local Governance (73rd & 74th Amendments)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'panchayati raj',
      'local government',
      'local self government',
      '73rd amendment',
      '74th amendment',
      'gram sabha',
      'pesa act',
      'municipalities',
    ],
    relatedConcepts: [
      'Democratic Decentralization',
      'State Election Commission',
      'State Finance Commission',
      'Fifth & Sixth Schedules',
      'PESA Act 1996',
    ],
    conceptualKeywords: [
      'panchayati raj',
      'gram sabha',
      '73rd constitutional amendment',
      '73rd amendment',
      '74th constitutional amendment',
      '74th amendment',
      'eleventh schedule',
      '11th schedule',
      'twelfth schedule',
      '12th schedule',
      'part ix',
      'balwant rai mehta',
      'ashok mehta committee',
      'l.m. singhvi',
      'pesa act',
      'extension to the scheduled areas',
      'state election commission',
      'state finance commission',
      'article 243',
      'article 40',
      'metropolitan planning committee',
      'district planning committee',
      'urban local bodies',
    ],
    syllabusKeywords: ['panchayati raj', 'local government', 'municipalities', 'decentralization'],
  },
  {
    id: 'concept_scheduled_tribal_areas',
    title: 'Fifth & Sixth Schedules (Scheduled and Tribal Areas)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'fifth schedule',
      '5th schedule',
      'sixth schedule',
      '6th schedule',
      'scheduled areas',
      'tribal areas',
      'autonomous district councils',
      'forest rights act',
    ],
    relatedConcepts: [
      'Panchayati Raj & PESA Act',
      'Tribal Welfare',
      'Forest Rights Act 2006',
      'Governor Discretionary Powers',
    ],
    conceptualKeywords: [
      'fifth schedule',
      '5th schedule',
      'sixth schedule',
      '6th schedule',
      'scheduled areas',
      'tribal advisory council',
      'tribes advisory council',
      'autonomous district',
      'autonomous regional council',
      'article 244',
      'assam, meghalaya, tripura and mizoram',
      'forest rights act',
      'community forest resource',
      'habitat rights',
      'particularly vulnerable tribal groups',
      'pvtg',
      'pesa',
    ],
    syllabusKeywords: ['schedules', 'scheduled areas', 'tribal areas', 'vulnerable sections'],
  },
  {
    id: 'concept_constitutional_bodies',
    title: 'Constitutional & Statutory Bodies (ECI, CAG, UPSC, Finance Commission)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'constitutional bodies',
      'statutory bodies',
      'election commission',
      'cag',
      'comptroller and auditor general',
      'finance commission',
      'attorney general',
      'nhrc',
      'lokpal',
    ],
    relatedConcepts: [
      'Election Commission & Electoral Reforms',
      'Finance Commission (Article 280)',
      'Comptroller and Auditor General (Article 148)',
      'Attorney General of India (Article 76)',
    ],
    conceptualKeywords: [
      'election commission',
      'article 324',
      'comptroller and auditor general',
      'cag',
      'article 148',
      'finance commission',
      'article 280',
      'attorney general of india',
      'article 76',
      'union public service commission',
      'national commission for scheduled castes',
      'national commission for scheduled tribes',
      'national commission for backward classes',
      '102nd amendment',
      'article 338',
      'national human rights commission',
      'nhrc',
      'central vigilance commission',
      'cvc',
      'lokpal',
      'central information commission',
      'niti aayog',
    ],
    syllabusKeywords: ['constitutional bodies', 'statutory bodies', 'regulatory bodies'],
  },
  {
    id: 'concept_elections_rpa',
    title: 'Elections, Electoral Reforms & Representation of the People Act',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'elections',
      'electoral reforms',
      'representation of the people act',
      'rpa 1951',
      'election commission',
      'model code of conduct',
      'delimitation commission',
    ],
    relatedConcepts: [
      'Election Commission (Article 324)',
      'Anti-Defection Law',
      'Simultaneous Elections',
      'Electoral Bonds & Funding',
    ],
    conceptualKeywords: [
      'representation of the people act',
      'election commission',
      'article 324',
      'article 326',
      'universal adult suffrage',
      '61st constitutional amendment',
      'model code of conduct',
      'delimitation commission',
      'article 82',
      'first past the post',
      'proportional representation',
      'single transferable vote',
      'nota',
      'vvpat',
      'evm',
      'electoral bond',
      'criminalization of politics',
      'office of profit',
      'disqualification of mp',
      'returning officer',
    ],
    syllabusKeywords: ['elections', 'representation of the people act', 'polity'],
  },
  {
    id: 'concept_emergency_provisions',
    title: 'Emergency Provisions (Articles 352, 356, 360)',
    subject: 'Polity & Governance',
    gsPapers: ['GS2'],
    aliases: [
      'emergency provisions',
      'national emergency',
      'presidents rule',
      'financial emergency',
      'article 352',
      'article 356',
      'article 360',
    ],
    relatedConcepts: [
      'Federalism & Centre-State Relations',
      'Fundamental Rights Suspension (Art 358 & 359)',
      '44th Constitutional Amendment',
      'S.R. Bommai Case',
    ],
    conceptualKeywords: [
      'national emergency',
      'article 352',
      'article 356',
      'article 358',
      'article 359',
      'article 360',
      'financial emergency',
      'president’s rule',
      'presidents rule',
      'armed rebellion',
      'internal disturbance',
      '44th amendment',
      's.r. bommai',
      'failure of constitutional machinery',
    ],
    syllabusKeywords: ['emergency provisions', 'federalism', 'centre-state relations'],
  },

  // --- ECONOMY & DEVELOPMENT ---
  {
    id: 'concept_monetary_policy_rbi',
    title: 'Monetary Policy & Reserve Bank of India (RBI)',
    subject: 'Economy',
    gsPapers: ['GS3', 'GS1'],
    aliases: [
      'monetary policy',
      'rbi',
      'reserve bank of india',
      'monetary policy committee',
      'mpc',
      'repo rate',
      'open market operations',
      'money supply',
    ],
    relatedConcepts: [
      'Inflation & Price Stability',
      'Banking Sector & NPAs',
      'Money Multiplier & Liquidity',
      'Exchange Rate Management',
      'Government Securities (G-Secs)',
    ],
    conceptualKeywords: [
      'monetary policy',
      'monetary policy committee',
      'reserve bank of india',
      'repo rate',
      'reverse repo rate',
      'standing deposit facility',
      'marginal standing facility',
      'cash reserve ratio',
      'crr',
      'statutory liquidity ratio',
      'slr',
      'open market operations',
      'sterilization',
      'liquidity adjustment facility',
      'bank rate',
      'money multiplier',
      'high powered money',
      'reserve money',
      'broad money',
      'narrow money',
      'm1',
      'm3',
      'inflation targeting',
      'lender of last resort',
      'operation twist',
      'g-sec',
      'government securities',
      'retail direct scheme',
      'central bank digital currency',
      'e-rupee',
    ],
    syllabusKeywords: ['monetary policy', 'rbi', 'banking', 'money and banking'],
  },
  {
    id: 'concept_inflation',
    title: 'Inflation, Deflation & Price Indices (CPI, WPI)',
    subject: 'Economy',
    gsPapers: ['GS3'],
    aliases: [
      'inflation',
      'cpi',
      'wpi',
      'consumer price index',
      'wholesale price index',
      'core inflation',
      'stagflation',
      'deflation',
    ],
    relatedConcepts: [
      'Monetary Policy & RBI',
      'Fiscal Policy & Deficit Financing',
      'Purchasing Power & Exchange Rate',
      'Food Inflation & MSP',
    ],
    conceptualKeywords: [
      'inflation',
      'consumer price index',
      'wholesale price index',
      'cpi',
      'wpi',
      'headline inflation',
      'core inflation',
      'demand-pull inflation',
      'cost-push inflation',
      'stagflation',
      'skewflation',
      'deflation',
      'disinflation',
      'base effect',
      'phillips curve',
      'inflation-indexed bonds',
      'purchasing power',
      'dearness allowance',
      'national statistical office',
    ],
    syllabusKeywords: ['inflation', 'monetary policy', 'macroeconomics'],
  },
  {
    id: 'concept_banking_npa',
    title: 'Banking Sector, NPAs & Financial Inclusion',
    subject: 'Economy',
    gsPapers: ['GS3'],
    aliases: [
      'banking',
      'non-performing assets',
      'npa',
      'basel norms',
      'capital adequacy ratio',
      'insolvency and bankruptcy code',
      'ibc',
      'financial inclusion',
    ],
    relatedConcepts: [
      'Monetary Policy & RBI',
      'Non-Banking Financial Companies (NBFCs)',
      'Digital Public Infrastructure (UPI)',
      'Priority Sector Lending',
    ],
    conceptualKeywords: [
      'non-performing asset',
      'npa',
      'bad bank',
      'narcl',
      'insolvency and bankruptcy code',
      'basel iii',
      'capital adequacy ratio',
      'capital to risk weighted assets',
      'tier 1 capital',
      'priority sector lending',
      'small finance bank',
      'payments bank',
      'regional rural bank',
      'urban cooperative bank',
      'nbfc',
      'prompt corrective action',
      'sarfaesi',
      'lead bank scheme',
      'bank board bureau',
      'financial stability board',
      'deposit insurance',
      'dicgc',
    ],
    syllabusKeywords: ['banking', 'financial inclusion', 'capital markets'],
  },
  {
    id: 'concept_fiscal_policy_budget',
    title: 'Fiscal Policy, Taxation, GST & Government Budgeting',
    subject: 'Economy',
    gsPapers: ['GS3', 'GS2'],
    aliases: [
      'fiscal policy',
      'union budget',
      'fiscal deficit',
      'revenue deficit',
      'primary deficit',
      'frbm act',
      'gst',
      'goods and services tax',
      'taxation',
    ],
    relatedConcepts: [
      'Money Bill & Budget (Article 112)',
      'Finance Commission (Article 280)',
      'Public Debt & G-Secs',
      'Capital Expenditure',
    ],
    conceptualKeywords: [
      'fiscal deficit',
      'revenue deficit',
      'primary deficit',
      'effective revenue deficit',
      'fiscal responsibility and budget management',
      'frbm',
      'capital expenditure',
      'revenue expenditure',
      'capital receipts',
      'revenue receipts',
      'disinvestment',
      'tax-to-gdp',
      'tax buoyancy',
      'tax elasticity',
      'goods and services tax',
      'gst council',
      'equalisation levy',
      'windfall tax',
      'angel tax',
      'direct tax',
      'indirect tax',
      'counter-cyclical fiscal policy',
      'crowding out',
      'deficit financing',
    ],
    syllabusKeywords: ['fiscal policy', 'budgeting', 'taxation', 'public finance'],
  },
  {
    id: 'concept_external_sector_bop',
    title: 'Balance of Payments (BoP), Exchange Rate & International Trade',
    subject: 'Economy',
    gsPapers: ['GS3'],
    aliases: [
      'balance of payments',
      'bop',
      'current account deficit',
      'foreign exchange reserves',
      'forex reserves',
      'neer',
      'reer',
      'fdi',
      'fpi',
      'currency devaluation',
    ],
    relatedConcepts: [
      'Monetary Policy & RBI',
      'WTO & International Trade Agreements',
      'IMF & Special Drawing Rights (SDR)',
      'Rupee Convertibility',
    ],
    conceptualKeywords: [
      'balance of payments',
      'current account',
      'capital account',
      'current account deficit',
      'balance of trade',
      'foreign exchange reserves',
      'special drawing rights',
      'sdr',
      'reserve tranche',
      'nominal effective exchange rate',
      'real effective exchange rate',
      'neer',
      'reer',
      'purchasing power parity',
      'currency devaluation',
      'depreciation of rupee',
      'foreign direct investment',
      'fdi',
      'foreign portfolio investment',
      'participatory notes',
      'external commercial borrowing',
      'masala bonds',
      'convertibility of rupee',
      'tarapore committee',
    ],
    syllabusKeywords: ['external sector', 'balance of payments', 'international trade', 'fdi'],
  },
  {
    id: 'concept_capital_markets',
    title: 'Capital Markets, Money Market & Financial Instruments',
    subject: 'Economy',
    gsPapers: ['GS3'],
    aliases: [
      'capital market',
      'money market',
      'sebi',
      'treasury bills',
      'commercial paper',
      'certificate of deposit',
      'sovereign gold bond',
      'invit',
      'reit',
    ],
    relatedConcepts: [
      'Monetary Policy & RBI',
      'Foreign Portfolio Investment (FPI)',
      'Government Securities (G-Secs)',
      'Corporate Governance',
    ],
    conceptualKeywords: [
      'treasury bill',
      'commercial paper',
      'certificate of deposit',
      'call money',
      'collateralized borrowing and lending',
      'government securities',
      'g-sec',
      'bond yield',
      'sovereign gold bond',
      'green bond',
      'real estate investment trust',
      'infrastructure investment trust',
      'invit',
      'reit',
      'sebi',
      'alternative investment fund',
      'venture capital',
      'exchange traded fund',
      'primary market',
      'secondary market',
    ],
    syllabusKeywords: ['capital markets', 'money market', 'financial markets'],
  },
  {
    id: 'concept_national_income_gdp',
    title: 'National Income Accounting, GDP, GVA & Economic Growth',
    subject: 'Economy',
    gsPapers: ['GS3'],
    aliases: [
      'national income',
      'gdp',
      'gross domestic product',
      'gva',
      'gross value added',
      'gnp',
      'capital output ratio',
      'icor',
      'potential gdp',
    ],
    relatedConcepts: [
      'Inclusive Growth & Poverty',
      'Fiscal Policy & Capital Formation',
      'Human Development Index (HDI)',
    ],
    conceptualKeywords: [
      'gross domestic product',
      'gross value added',
      'gross national product',
      'net national product',
      'factor cost',
      'market price',
      'basic prices',
      'gdp deflator',
      'real gdp',
      'nominal gdp',
      'potential gdp',
      'incremental capital output ratio',
      'icor',
      'capital formation',
      'gross fixed capital formation',
      'purchasing power parity',
    ],
    syllabusKeywords: ['national income', 'economic growth', 'gdp'],
  },
  {
    id: 'concept_agriculture_msp',
    title: 'Agriculture, Minimum Support Price (MSP), PDS & Subsidies',
    subject: 'Economy',
    gsPapers: ['GS3'],
    aliases: [
      'agriculture',
      'minimum support price',
      'msp',
      'public distribution system',
      'pds',
      'food security',
      'buffer stock',
      'wto agriculture subsidies',
      'cropping pattern',
    ],
    relatedConcepts: [
      'WTO Amber/Green/Blue Box Subsidies',
      'Food Processing & Supply Chain',
      'Micro-Irrigation & Sustainable Farming',
      'Land Reforms',
    ],
    conceptualKeywords: [
      'minimum support price',
      'msp',
      'commission for agricultural costs and prices',
      'cacp',
      'fair and remunerative price',
      'frp',
      'food corporation of india',
      'public distribution system',
      'national food security act',
      'buffer stock',
      'amber box',
      'green box',
      'blue box',
      'agreement on agriculture',
      'kisan credit card',
      'pm-kisan',
      'e-nam',
      'zero budget natural farming',
      'fertigation',
      'micro-irrigation',
      'crop diversification',
      'pulses',
      'millets',
      'oilseeds',
    ],
    syllabusKeywords: ['agriculture', 'cropping patterns', 'food processing', 'subsidies'],
  },

  // --- ENVIRONMENT & ECOLOGY ---
  {
    id: 'concept_climate_change_unfccc',
    title: 'Climate Change, UNFCCC, Paris Agreement & Carbon Markets',
    subject: 'Environment & Ecology',
    gsPapers: ['GS3', 'GS1'],
    aliases: [
      'climate change',
      'global warming',
      'unfccc',
      'paris agreement',
      'kyoto protocol',
      'carbon credit',
      'carbon sequestration',
      'greenhouse gases',
      'net zero',
    ],
    relatedConcepts: [
      'Greenhouse Gases & Global Warming Potential',
      'Carbon Capture & Sequestration (Blue Carbon)',
      'Renewable Energy & Green Hydrogen',
      'Climate Finance (GCF, Adaptation Fund)',
    ],
    conceptualKeywords: [
      'climate change',
      'unfccc',
      'paris agreement',
      'nationally determined contribution',
      'kyoto protocol',
      'clean development mechanism',
      'carbon credit',
      'carbon market',
      'carbon tax',
      'carbon sequestration',
      'blue carbon',
      'greenhouse gas',
      'methane',
      'nitrous oxide',
      'hydrofluorocarbons',
      'kigali amendment',
      'montreal protocol',
      'ipcc',
      'green climate fund',
      'global environment facility',
      'climate Action tracker',
      'common but differentiated responsibilities',
      'net zero',
      'solar alliance',
    ],
    syllabusKeywords: ['climate change', 'environmental conventions', 'global warming'],
  },
  {
    id: 'concept_biodiversity_protected_areas',
    title: 'Biodiversity Conservation, National Parks, Tiger Reserves & Wildlife Laws',
    subject: 'Environment & Ecology',
    gsPapers: ['GS3', 'GS1'],
    aliases: [
      'biodiversity',
      'protected areas',
      'national parks',
      'wildlife sanctuaries',
      'tiger reserves',
      'biosphere reserves',
      'wildlife protection act',
      'iucn',
      'cites',
    ],
    relatedConcepts: [
      'Wildlife Protection Act 1972 (Schedules)',
      'Convention on Biological Diversity (CBD)',
      'Ramsar Wetlands & Montreux Record',
      'Western Ghats & Biodiversity Hotspots',
    ],
    conceptualKeywords: [
      'national park',
      'wildlife sanctuary',
      'biosphere reserve',
      'tiger reserve',
      'critical wildlife habitat',
      'eco-sensitive zone',
      'wildlife protection act',
      'schedule i',
      'national tiger conservation authority',
      'ntca',
      'animal welfare board',
      'national biodiversity authority',
      'biological diversity act',
      'biodiversity hotspot',
      'iucn',
      'red list',
      'critically endangered',
      'cites',
      'cms',
      'bonn convention',
      'convention on biological diversity',
      'nagoya protocol',
      'cartagena protocol',
      'kunming-montreal',
      'in-situ conservation',
      'ex-situ conservation',
      'sacred groves',
      'endemic species',
      'invasive alien species',
    ],
    syllabusKeywords: ['biodiversity', 'protected areas', 'wildlife', 'conservation'],
  },
  {
    id: 'concept_wetlands_ramsar',
    title: 'Wetlands, Ramsar Convention, Mangroves & Coral Reefs',
    subject: 'Environment & Ecology',
    gsPapers: ['GS3', 'GS1'],
    aliases: [
      'wetlands',
      'ramsar convention',
      'ramsar sites',
      'montreux record',
      'mangroves',
      'coral reefs',
      'coral bleaching',
    ],
    relatedConcepts: [
      'Biodiversity Conservation',
      'Coastal Regulation Zone (CRZ)',
      'Blue Carbon Ecosystems',
      'Marine Ecology',
    ],
    conceptualKeywords: [
      'ramsar convention',
      'ramsar site',
      'wetland',
      'montreux record',
      'keoladeo',
      'loktak lake',
      'chilika lake',
      'mangrove',
      'coral reef',
      'coral bleaching',
      'zooxanthellae',
      'biorock',
      'estuary',
      'coastal regulation zone',
      'wetlands (conservation and management) rules',
      'wise use of wetlands',
    ],
    syllabusKeywords: ['wetlands', 'aquatic ecosystems', 'biodiversity'],
  },
  {
    id: 'concept_pollution_eia',
    title: 'Environmental Pollution, Waste Management & EIA',
    subject: 'Environment & Ecology',
    gsPapers: ['GS3'],
    aliases: [
      'pollution',
      'air pollution',
      'water pollution',
      'e-waste',
      'plastic waste',
      'environmental impact assessment',
      'eia',
      'environment protection act',
      'ngt',
    ],
    relatedConcepts: [
      'Air Quality Index (AQI) & NAAQS',
      'Persistent Organic Pollutants (Stockholm Convention)',
      'Bioremediation & Eutrophication',
      'National Green Tribunal (NGT)',
    ],
    conceptualKeywords: [
      'air quality index',
      'particulate matter',
      'pm 2.5',
      'pm10',
      'sulphur dioxide',
      'nitrogen oxide',
      'smog',
      'fly ash',
      'acid rain',
      'biological oxygen demand',
      'bod',
      'eutrophication',
      'algal bloom',
      'bioaccumulation',
      'biomagnification',
      'bioremediation',
      'e-waste',
      'extended producer responsibility',
      'stockholm convention',
      'basel convention',
      'rotterdam convention',
      'minamata convention',
      'mercury pollution',
      'microbeads',
      'microplastics',
      'environment protection act',
      'environmental impact assessment',
      'national green tribunal',
      'central pollution control board',
    ],
    syllabusKeywords: ['pollution', 'environmental impact assessment', 'environmental laws'],
  },
  {
    id: 'concept_ecology_concepts',
    title: 'Ecological Principles, Food Webs, Nutrient Cycles & Biomes',
    subject: 'Environment & Ecology',
    gsPapers: ['GS3', 'GS1'],
    aliases: [
      'ecology',
      'ecosystem',
      'food chain',
      'ecological succession',
      'biogeochemical cycles',
      'nitrogen cycle',
      'carbon cycle',
      'ecotone',
      'ecological niche',
    ],
    relatedConcepts: [
      'Biodiversity Conservation',
      'Primary Productivity & Trophic Levels',
      'Symbiotic Relationships (Mycorrhiza, Lichens)',
    ],
    conceptualKeywords: [
      'ecological niche',
      'ecotone',
      'edge effect',
      'ecological succession',
      'pioneer species',
      'climax community',
      'food chain',
      'food web',
      'trophic level',
      'ecological pyramid',
      'pyramid of biomass',
      'pyramid of energy',
      'primary productivity',
      'nitrogen fixation',
      'nitrogen cycle',
      'phosphorus cycle',
      'sulphur cycle',
      'detritivores',
      'decomposers',
      'symbiosis',
      'mutualism',
      'mycorrhiza',
      'lichens',
      'carrying capacity',
    ],
    syllabusKeywords: ['ecology', 'ecosystems', 'biomes'],
  },

  // --- GEOGRAPHY ---
  {
    id: 'concept_monsoon_climate',
    title: 'Indian Monsoon, El Nino, IOD, Jet Streams & Climatology',
    subject: 'Geography',
    gsPapers: ['GS1'],
    aliases: [
      'monsoon',
      'indian monsoon',
      'el nino',
      'la nina',
      'enso',
      'indian ocean dipole',
      'iod',
      'western disturbances',
      'jet stream',
      'itcz',
      'cyclones',
    ],
    relatedConcepts: [
      'Tropical & Temperate Cyclones',
      'Ocean Currents & SST Anomalies',
      'Climatic Regions of India',
      'Agriculture & Cropping Seasons',
    ],
    conceptualKeywords: [
      'monsoon',
      'southwest monsoon',
      'retreating monsoon',
      'northeast monsoon',
      'el nino',
      'la nina',
      'southern oscillation',
      'indian ocean dipole',
      'madden-julian oscillation',
      'inter-tropical convergence zone',
      'itcz',
      'tibetan plateau',
      'tropical easterly jet',
      'subtropical westerly jet',
      'western disturbances',
      'tropical cyclone',
      'extra-tropical cyclone',
      'coriolis force',
      'temperature inversion',
      'albedo',
      'insolation',
      'heat budget',
      'westerlies',
      'trade winds',
      'horse latitudes',
      'roaring forties',
    ],
    syllabusKeywords: ['climatology', 'monsoon', 'indian climate', 'atmosphere'],
  },
  {
    id: 'concept_geomorphology_tectonics',
    title: 'Geomorphology, Plate Tectonics, Earthquakes, Volcanoes & Landforms',
    subject: 'Geography',
    gsPapers: ['GS1'],
    aliases: [
      'geomorphology',
      'plate tectonics',
      'earthquake',
      'volcano',
      'continental drift',
      'interior of earth',
      'seismic waves',
      'landforms',
    ],
    relatedConcepts: [
      'Himalayan & Peninsular Physiography',
      'Disaster Management (Tsunami, Landslides)',
      'Rock Cycle & Minerals',
    ],
    conceptualKeywords: [
      'plate tectonics',
      'continental drift',
      'sea floor spreading',
      'subduction zone',
      'mid-oceanic ridge',
      'ring of fire',
      'earthquake',
      'seismic wave',
      'p-wave',
      's-wave',
      'shadow zone',
      'volcano',
      'magma',
      'caldera',
      'shield volcano',
      'fold mountain',
      'block mountain',
      'rift valley',
      'weathering',
      'mass wasting',
      'karst topography',
      'glacial landform',
      'fluvial landform',
      'igneous rock',
      'sedimentary rock',
      'metamorphic rock',
    ],
    syllabusKeywords: ['geomorphology', 'physical geography', 'landforms', 'earthquakes'],
  },
  {
    id: 'concept_indian_rivers_drainage',
    title: 'Indian Drainage Systems: Himalayan & Peninsular Rivers',
    subject: 'Geography',
    gsPapers: ['GS1', 'GS3'],
    aliases: [
      'indian rivers',
      'drainage system',
      'himalayan rivers',
      'peninsular rivers',
      'ganga river system',
      'indus river system',
      'brahmaputra',
      'godavari',
      'krishna',
      'cauvery',
    ],
    relatedConcepts: [
      'Wetlands & Lakes of India',
      'Inter-State River Water Disputes',
      'Dams, Reservoirs & Hydropower',
      'Glaciers of Himalayas',
    ],
    conceptualKeywords: [
      'tributary',
      'tributaries',
      'indus',
      'jhelum',
      'chenab',
      'ravi',
      'beas',
      'sutlej',
      'ganga',
      'yamuna',
      'chambal',
      'son',
      'kosi',
      'gandak',
      'brahmaputra',
      'teesta',
      'subansiri',
      'barak',
      'godavari',
      'pranhita',
      'indravati',
      'krishna',
      'tungabhadra',
      'bhima',
      'kaveri',
      'cauvery',
      'mahanadi',
      'narmada',
      'tapti',
      'tapi',
      'luni',
      'mahadayi',
      'pennar',
      'vamsadhara',
      'rift valley',
      'west flowing river',
      'east flowing river',
      'estuary',
      'delta',
    ],
    syllabusKeywords: ['drainage system', 'indian rivers', 'indian geography'],
  },
  {
    id: 'concept_oceanography',
    title: 'Oceanography: Ocean Currents, Tides, Salinity & Marine Resources',
    subject: 'Geography',
    gsPapers: ['GS1', 'GS3'],
    aliases: [
      'oceanography',
      'ocean currents',
      'tides',
      'ocean salinity',
      'continental shelf',
      'upwelling',
      'thermohaline circulation',
    ],
    relatedConcepts: [
      'Monsoon & ENSO',
      'Coral Reefs & Marine Biodiversity',
      'Polymetallic Nodules & Deep Ocean Mission',
    ],
    conceptualKeywords: [
      'ocean current',
      'warm current',
      'cold current',
      'gulf stream',
      'kuroshio',
      'oyashio',
      'humboldt current',
      'peru current',
      'benguela current',
      'agulhas current',
      'canary current',
      'labrador current',
      'thermohaline',
      'upwelling',
      'fishing bank',
      'spring tide',
      'neap tide',
      'salinity',
      'halocline',
      'thermocline',
      'continental shelf',
      'oceanic trench',
      'polymetallic nodules',
      'exclusive economic zone',
    ],
    syllabusKeywords: ['oceanography', 'oceans', 'marine resources'],
  },
  {
    id: 'concept_soils_vegetation_minerals',
    title: 'Soils, Natural Vegetation & Mineral Resources of India',
    subject: 'Geography',
    gsPapers: ['GS1', 'GS3'],
    aliases: [
      'soils of india',
      'natural vegetation',
      'forest types',
      'minerals of india',
      'critical minerals',
      'black soil',
      'laterite soil',
      'tropical evergreen forest',
    ],
    relatedConcepts: [
      'Agriculture & Cropping Patterns',
      'Biodiversity & Forest Conservation',
      'Renewable & Non-Renewable Energy',
    ],
    conceptualKeywords: [
      'alluvial soil',
      'black soil',
      'regur',
      'laterite soil',
      'red soil',
      'salinization',
      'soil erosion',
      'tropical evergreen',
      'tropical deciduous',
      'shola forest',
      'alpine vegetation',
      'mangrove forest',
      'iron ore',
      'bauxite',
      'mica',
      'monazite',
      'thorium',
      'uranium',
      'lithium',
      'cobalt',
      'rare earth elements',
      'critical minerals',
      'gondwana coal',
      'shale gas',
      'coalbed methane',
    ],
    syllabusKeywords: ['soils', 'vegetation', 'minerals', 'resources', 'indian geography'],
  },

  // --- HISTORY & ART & CULTURE ---
  {
    id: 'concept_indus_valley',
    title: 'Indus Valley Civilization (Harappan Culture)',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1'],
    aliases: [
      'indus valley civilization',
      'harappan civilization',
      'ivc',
      'harappa',
      'mohenjo-daro',
      'dholavira',
      'lothal',
      'kalibangan',
    ],
    relatedConcepts: [
      'Vedic Period & Chalcolithic Cultures',
      'Ancient Indian Urbanization & Town Planning',
      'UNESCO World Heritage Sites',
    ],
    conceptualKeywords: [
      'indus valley',
      'harappan',
      'harappa',
      'mohenjo-daro',
      'mohenjodaro',
      'dholavira',
      'lothal',
      'kalibangan',
      'rakhigarhi',
      'banawali',
      'chanhudaro',
      'surkotada',
      'daimabad',
      'great bath',
      'dockyard',
      'water management',
      'pashupati seal',
      'dancing girl',
      'lost wax',
      'terracotta',
      'steatite seal',
      'meluhha',
    ],
    syllabusKeywords: ['indus valley', 'ancient history', 'art and culture'],
  },
  {
    id: 'concept_buddhism_jainism',
    title: 'Buddhism & Jainism: Philosophy, Sects, Literature & Architecture',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1', 'GS4'],
    aliases: [
      'buddhism',
      'jainism',
      'gautama buddha',
      'mahavira',
      'hinayana',
      'mahayana',
      'vajrayana',
      'bodhisattva',
      'tirthankara',
      'stupa',
      'tripitaka',
    ],
    relatedConcepts: [
      'Mauryan Empire & Ashoka Dhamma',
      'Rock-Cut Cave Architecture (Ajanta, Ellora, Karle)',
      'Gandhara, Mathura & Amaravati Schools of Art',
      'Indian Philosophical Systems',
    ],
    conceptualKeywords: [
      'buddhism',
      'buddhist',
      'buddha',
      'jainism',
      'jaina',
      'mahavira',
      'tirthankara',
      'parshvanatha',
      'bodhisattva',
      'maitreya',
      'avalokitesvara',
      'padmapani',
      'mahayana',
      'hinayana',
      'theravada',
      'vajrayana',
      'sthanakvasi',
      'svetambara',
      'digambara',
      'sautrantika',
      'sammitiya',
      'sarvastivadin',
      'madhyamaka',
      'nagarjuna',
      'yogacara',
      'tripitaka',
      'vinaya pitaka',
      'sutta pitaka',
      'abhidhamma pitaka',
      'jatakas',
      'milinda panha',
      'anekantavada',
      'syadvada',
      'nayavada',
      'triratna',
      'eightfold path',
      'ashtangika marga',
      'pratityasamutpada',
      'nirvana',
      'stupa',
      'chaitya',
      'vihara',
      'sanchi',
      'bharhut',
      'amaravati',
      'nalanda',
      'vikramashila',
    ],
    syllabusKeywords: ['buddhism', 'jainism', 'ancient history', 'religion and philosophy'],
  },
  {
    id: 'concept_mauryan_gupta',
    title: 'Mauryan, Post-Mauryan & Gupta Empires (Polity, Economy, Epigraphy)',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1'],
    aliases: [
      'mauryan empire',
      'ashoka',
      'ashokan edicts',
      'arthashastra',
      'kautilya',
      'gupta empire',
      'samudragupta',
      'chandragupta',
      'harshavardhana',
      'sangam age',
    ],
    relatedConcepts: [
      'Buddhism & Jainism',
      'Temple & Cave Architecture',
      'Ancient Ports, Guilds (Shrenis) & Coinage',
      'Sangam Literature & South Indian Kingdoms',
    ],
    conceptualKeywords: [
      'maurya',
      'mauryan',
      'ashoka',
      'asoka',
      'rock edicts',
      'pillar edicts',
      'dhamma',
      'kautilya',
      'arthashastra',
      'megasthenes',
      'indica',
      'chandragupta',
      'samudragupta',
      'prayag prashasti',
      'harisena',
      'kalidasa',
      'aryabhata',
      'varahamihira',
      'visakhadatta',
      'mudrarakshasa',
      'fa-hien',
      'faxian',
      'hieun tsang',
      'xuanzang',
      'harshavardhana',
      'satavahana',
      'kushana',
      'kanishka',
      'shreni',
      'guilds',
      'vishti',
      'forced labour',
      'agrahara',
      'sangam',
      'tolkappiyam',
      'silappadikaram',
      'puhar',
      'korkai',
      'muziris',
    ],
    syllabusKeywords: ['mauryan', 'gupta', 'ancient history', 'sangam age'],
  },
  {
    id: 'concept_architecture_sculpture',
    title: 'Indian Temple Architecture, Cave Art, Sculpture & Performing Arts',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1'],
    aliases: [
      'temple architecture',
      'nagara',
      'dravida',
      'vesara',
      'cave architecture',
      'ajanta',
      'ellora',
      'chola bronzes',
      'classical dances',
      'indian paintings',
    ],
    relatedConcepts: [
      'Chola, Pallava, Chalukya & Vijayanagara Art',
      'Indo-Islamic & Mughal Architecture',
      'UNESCO Heritage Sites in India',
    ],
    conceptualKeywords: [
      'nagara',
      'dravida',
      'vesara',
      'shikhara',
      'vimana',
      'gopuram',
      'mandapa',
      'garbhagriha',
      'panchayatana',
      'ajanta',
      'ellora',
      'elephanta',
      'badami',
      'udayagiri',
      'barabar caves',
      'mahabalipuram',
      'mamallapuram',
      'khajuraho',
      'konark',
      'brihadisvara',
      'tanjavur',
      'hoysala',
      'vijayanagara',
      'hampi',
      'gandhara',
      'mathura school',
      'amaravati school',
      'nataraja',
      'chola bronze',
      'madhubani',
      'kangra',
      'pahari',
      'mughal miniature',
      'baisoli',
      'kishangarh',
      'bani thani',
      'kalamkari',
      'bharatanatyam',
      'kathakali',
      'kuchipudi',
      'odissi',
      'manipuri',
      'sattriya',
      'mohiniyattam',
      'dhrupad',
      'hindustani music',
      'carnatic music',
    ],
    syllabusKeywords: ['art and culture', 'architecture', 'paintings', 'dance', 'sculpture'],
  },
  {
    id: 'concept_bhakti_sufi_medieval',
    title: 'Bhakti & Sufi Movements, Vijayanagara, Delhi Sultanate & Mughal India',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1'],
    aliases: [
      'bhakti movement',
      'sufi movement',
      'vijayanagara empire',
      'krishnadevaraya',
      'delhi sultanate',
      'mughal empire',
      'chola empire',
    ],
    relatedConcepts: [
      'Indian Philosophy (Advaita, Vishishtadvaita)',
      'Medieval Revenue & Administrative Systems (Iqta, Mansabdari, Amara-Nayaka)',
      'Medieval Travellers (Ibn Battuta, Abdur Razzaq, Domingo Paes)',
    ],
    conceptualKeywords: [
      'bhakti',
      'sufi',
      'chishti',
      'suhrawardi',
      'nizamuddin auliya',
      'amir khusrau',
      'shankaracharya',
      'advaita',
      'ramanuja',
      'vishishtadvaita',
      'madhvacharya',
      'basavanna',
      'virashaiva',
      'lingayat',
      'alvars',
      'nayanars',
      'kabir',
      'guru nanak',
      'tukaram',
      'chaitanya',
      'tyagaraja',
      'vijayanagara',
      'krishnadevaraya',
      'amara-nayaka',
      'ashtadiggajas',
      'abdur razzaq',
      'domingo paes',
      'nuniz',
      'iqta',
      'mansabdari',
      'jagirdari',
      'zabti',
      'dahsala',
      'todar mal',
      'akbar',
      'ibadat khana',
      'sulh-i-kul',
      'dara shikoh',
      'chola',
      'uttaramerur inscription',
    ],
    syllabusKeywords: ['medieval history', 'bhakti', 'sufi', 'vijayanagara', 'mughal'],
  },
  {
    id: 'concept_british_acts_administration',
    title: 'British Constitutional Acts (1773–1947), Land Revenue & Colonial Impact',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1', 'GS2'],
    aliases: [
      'british acts',
      'regulating act 1773',
      'charter act',
      'government of india act 1919',
      'government of india act 1935',
      'montagu chelmsford',
      'morley minto',
      'permanent settlement',
      'ryotwari',
      'mahalwari',
    ],
    relatedConcepts: [
      'Historical Underpinnings of Indian Constitution',
      'Drain of Wealth & Deindustrialization',
      'Peasant & Tribal Uprisings',
    ],
    conceptualKeywords: [
      'regulating act of 1773',
      'pitt’s india act',
      'charter act of 1813',
      'charter act of 1833',
      'charter act of 1853',
      'government of india act, 1858',
      'indian councils act',
      'morley-minto',
      'montagu-chelmsford',
      'government of india act, 1919',
      'government of india act, 1935',
      'dyarchy',
      'diarchy',
      'communal electorate',
      'separate electorate',
      'permanent settlement',
      'zamindari',
      'cornwallis',
      'ryotwari',
      'thomas munro',
      'mahalwari',
      'drain of wealth',
      'dadabhai naoroji',
      'r.c. dutt',
      'wood’s despatch',
      'macaulay',
      'vernacular press act',
      'ilbert bill',
    ],
    syllabusKeywords: ['modern history', 'historical underpinnings', 'british rule'],
  },
  {
    id: 'concept_gandhian_freedom_struggle',
    title: 'Indian National Movement, Gandhian Era, Social Reform & Revolutionaries',
    subject: 'History & Art & Culture',
    gsPapers: ['GS1'],
    aliases: [
      'freedom struggle',
      'indian national movement',
      'mahatma gandhi',
      'non-cooperation movement',
      'civil disobedience movement',
      'quit india movement',
      'swadeshi movement',
      'social reform movements',
      '1857 revolt',
    ],
    relatedConcepts: [
      'Socio-Religious Reform Movements (Raja Rammohan Roy, Phule, Ambedkar)',
      'Revolutionary Nationalism (HSRA, Ghadar, INA)',
      'Cabinet Mission, Cripps Mission & Partition',
    ],
    conceptualKeywords: [
      'swadeshi movement',
      'partition of bengal',
      'surat split',
      'home rule league',
      'annie besant',
      'bal gangadhar tilak',
      'lucknow pact',
      'champaran satyagraha',
      'kheda satyagraha',
      'ahmedabad mill strike',
      'rowlatt act',
      'jallianwala bagh',
      'khilafat',
      'non-cooperation movement',
      'swaraj party',
      'simon commission',
      'nehru report',
      'lahore session',
      'purna swaraj',
      'civil disobedience',
      'dandi march',
      'salt satyagraha',
      'gandhi-irwin pact',
      'round table conference',
      'poona pact',
      'communal award',
      'quit india movement',
      'cripps mission',
      'august offer',
      'wavell plan',
      'cabinet mission',
      'mountbatten plan',
      'indian national army',
      'subhash chandra bose',
      'bhagat singh',
      'ghadar party',
      'brahmo samaj',
      'arya samaj',
      'satyashodhak samaj',
      'jyotirao phule',
      'b.r. ambedkar',
      'santhal rebellion',
      'birsa munda',
      'ulgulan',
    ],
    syllabusKeywords: ['modern history', 'freedom struggle', 'national movement', 'social reform'],
  },

  // --- SCIENCE & TECHNOLOGY ---
  {
    id: 'concept_biotechnology_genetics',
    title: 'Biotechnology, Genetic Engineering, CRISPR, Vaccines & Stem Cells',
    subject: 'Science & Technology',
    gsPapers: ['GS3'],
    aliases: [
      'biotechnology',
      'genetic engineering',
      'crispr',
      'cas9',
      'genome sequencing',
      'recombinant dna',
      'gm crops',
      'stem cells',
      'mrna vaccine',
      'mitochondrial replacement',
    ],
    relatedConcepts: [
      'Genetically Modified Crops (Bt Cotton, GM Mustard) & GEAC',
      'Vaccines, Immunity (T-cells, B-cells) & Antimicrobial Resistance',
      'Intellectual Property Rights & Biopiracy',
    ],
    conceptualKeywords: [
      'crispr',
      'cas9',
      'gene editing',
      'genome sequencing',
      'recombinant dna',
      'somatic cell nuclear transfer',
      'mitochondrial replacement',
      'three parent baby',
      'pronuclear transfer',
      'stem cell',
      'pluripotent',
      'genetically modified',
      'gm mustard',
      'dmh-11',
      'bt cotton',
      'bt brinjal',
      'genetic engineering appraisal committee',
      'geac',
      'rna interference',
      'mrna vaccine',
      'viral vector vaccine',
      'conjugate vaccine',
      'monoclonal antibodies',
      't-cells',
      'b-cells',
      'antimicrobial resistance',
      'probiotics',
      'bioinformatics',
      'transcriptome',
      'microsatellite dna',
      'cell-free dna',
      'aerial metagenomics',
    ],
    syllabusKeywords: ['biotechnology', 'health and diseases', 'genetics', 'science and technology'],
  },
  {
    id: 'concept_space_technology',
    title: 'Space Technology, ISRO Missions, Orbits, Launch Vehicles & Astronomy',
    subject: 'Science & Technology',
    gsPapers: ['GS3'],
    aliases: [
      'space technology',
      'isro',
      'pslv',
      'gslv',
      'chandrayaan',
      'aditya l1',
      'gaganyaan',
      'navic',
      'gravitational waves',
      'black hole',
      'orbits',
    ],
    relatedConcepts: [
      'Low Earth Orbit (LEO), GEO & Lagrange Points',
      'Cryogenic, Scramjet & Ion Propulsion',
      'Astrophysics (Gravitational Waves, Pulsars, Neutrinos)',
    ],
    conceptualKeywords: [
      'isro',
      'pslv',
      'gslv',
      'lvm3',
      'cryogenic engine',
      'geostationary orbit',
      'geosynchronous',
      'sun-synchronous',
      'low earth orbit',
      'lagrange point',
      'chandrayaan',
      'mangalyaan',
      'aditya-l1',
      'gaganyaan',
      'astroSat',
      'navic',
      'irnss',
      'remote sensing satellite',
      'james webb',
      'event horizon',
      'singularity',
      'black hole',
      'gravitational wave',
      'ligo',
      'elas',
      'pulsar',
      'cepheid',
      'neutrino',
      'higgs boson',
      'dark matter',
      'solar storm',
      'coronal mass ejection',
    ],
    syllabusKeywords: ['space technology', 'isro', 'astronomy', 'satellites'],
  },
  {
    id: 'concept_digital_tech_ai_cyber',
    title: 'Information Technology, AI, Blockchain, Quantum Computing & Cyber Security',
    subject: 'Science & Technology',
    gsPapers: ['GS3'],
    aliases: [
      'artificial intelligence',
      'blockchain',
      'cryptocurrency',
      'web 3.0',
      'nft',
      'quantum computing',
      'qubit',
      '5g',
      'internet of things',
      'iot',
      'cyber security',
      'digital public infrastructure',
    ],
    relatedConcepts: [
      'Digital India & Digital Public Infrastructure (Aadhaar, UPI, ONDC)',
      'Cyber Warfare & Critical Information Infrastructure',
      'Semiconductors, Li-Fi & Visible Light Communication',
    ],
    conceptualKeywords: [
      'artificial intelligence',
      'machine learning',
      'large language model',
      'generative ai',
      'deepfake',
      'blockchain',
      'distributed ledger',
      'smart contract',
      'non-fungible token',
      'web 3.0',
      'cryptocurrency',
      'quantum computing',
      'qubit',
      'superposition',
      'quantum entanglement',
      'quantum key distribution',
      'internet of things',
      '5g',
      'li-fi',
      'visible light communication',
      'near field communication',
      'rfid',
      'open source digital platform',
      'public key infrastructure',
      'digital signature',
      'ransomware',
      'phishing',
      'zero-day',
      'software as a service',
      'cloud computing',
      'metaverse',
      'organic light emitting diode',
      'oled',
    ],
    syllabusKeywords: ['information technology', 'computers', 'cyber security', 'emerging technology'],
  },
  {
    id: 'concept_defence_nuclear_energy',
    title: 'Defence Technology, Missiles, Nuclear Energy & Renewable Technologies',
    subject: 'Science & Technology',
    gsPapers: ['GS3'],
    aliases: [
      'defence technology',
      'missiles',
      'ballistic missile',
      'cruise missile',
      'brahmos',
      'agni',
      'nuclear energy',
      'fast breeder reactor',
      'green hydrogen',
      'fuel cell',
    ],
    relatedConcepts: [
      'India Three-Stage Nuclear Programme (Uranium, Plutonium, Thorium)',
      'Air Defence Systems (S-400, Iron Dome, THAAD)',
      'Hydrogen Fuel Cells, Lithium-Ion Batteries & Solar PV',
    ],
    conceptualKeywords: [
      'ballistic missile',
      'cruise missile',
      'agni',
      'prithvi',
      'brahmos',
      'hypersonic',
      'scramjet',
      'ramjet',
      's-400',
      'thaad',
      'iron dome',
      'unmanned aerial vehicle',
      'aircraft carrier',
      'ins vikrant',
      'nuclear reactor',
      'heavy water',
      'fast breeder reactor',
      'thorium',
      'uranium enrichment',
      'fission',
      'nuclear fusion',
      'iter',
      'tokamak',
      'hydrogen fuel cell',
      'green hydrogen',
      'sodium-ion battery',
      'lithium-ion',
      'photovoltaic',
      'nanotechnology',
      'carbon nanotube',
      'graphene',
    ],
    syllabusKeywords: ['defence technology', 'nuclear technology', 'energy', 'nanotechnology'],
  },

  // --- INTERNATIONAL RELATIONS ---
  {
    id: 'concept_international_orgs_groupings',
    title: 'International Organizations, Groupings & Treaties (UN, WTO, IMF, G20, BRICS, SCO)',
    subject: 'International Relations',
    gsPapers: ['GS2', 'GS1'],
    aliases: [
      'international organizations',
      'united nations',
      'wto',
      'world trade organization',
      'imf',
      'world bank',
      'g20',
      'brics',
      'sco',
      'asean',
      'quad',
      'nuclear non-proliferation',
    ],
    relatedConcepts: [
      'UN Security Council Reforms & ICJ',
      'WTO Dispute Settlement & Subsidies',
      'Indo-Pacific Geopolitics, Quad & IPEF',
      'India Neighbourhood First & West Asia Policy',
    ],
    conceptualKeywords: [
      'united nations',
      'general assembly',
      'security council',
      'international court of justice',
      'international criminal court',
      'world trade organization',
      'wto',
      'most favoured nation',
      'trims',
      'trips',
      'international monetary fund',
      'world bank',
      'ibRD',
      'asian infrastructure investment bank',
      'aiib',
      'new development bank',
      'g20',
      'g-20',
      'brics',
      'shanghai cooperation organisation',
      'sco',
      'asean',
      'east asia summit',
      'bimstec',
      'saarc',
      'indian ocean rim association',
      'quad',
      'aukus',
      'i2u2',
      'opec',
      'European union',
      'nato',
      'financial action task force',
      'fatf',
      'nuclear suppliers group',
      'mtcr',
      'wassenaar',
      'australia group',
      'unclos',
      'exclusive economic zone',
      'chabahar',
      'instc',
    ],
    syllabusKeywords: ['international relations', 'international organizations', 'foreign policy'],
  },

  // --- MAINS GS4: ETHICS, INTEGRITY & APTITUDE ---
  {
    id: 'concept_ethics_integrity_probity',
    title: 'Ethics, Integrity, Probity in Governance & Public Service Values',
    subject: 'Ethics, Integrity & Aptitude',
    gsPapers: ['GS4'],
    aliases: [
      'ethics',
      'integrity',
      'probity in governance',
      'public service values',
      'emotional intelligence',
      'civil service values',
      'code of conduct',
      'code of ethics',
      'conflict of interest',
      'ethical dilemma',
    ],
    relatedConcepts: [
      'Emotional Intelligence in Administration',
      'Citizen Charter, RTI & Social Audit',
      'Moral Thinkers (Kant, Aristotle, Mill, Gandhi, Kautilya)',
      'Ethical Case Studies & Corporate Governance',
    ],
    conceptualKeywords: [
      'probity',
      'integrity',
      'impartiality',
      'non-partisanship',
      'objectivity',
      'empathy',
      'compassion',
      'emotional intelligence',
      'conflict of interest',
      'ethical dilemma',
      'conscience',
      'citizen charter',
      'right to information',
      'social audit',
      'code of ethics',
      'code of conduct',
      'corporate social responsibility',
      'utilitarianism',
      'deontology',
      'categorical imperative',
      'nishkama karma',
      'sarvodaya',
      'trusteeship',
      'seven sins',
      'nolan committee',
      'second arc',
      'work culture',
      'corruption',
    ],
    syllabusKeywords: ['ethics', 'integrity', 'aptitude', 'probity', 'case study'],
  },
];

// ============================================================================
// SPELLING & SYNONYM NORMALIZATION DICTIONARY
// ============================================================================

const SYNONYM_EXPANSION_MAP: Record<string, string[]> = {
  jr: ['judicial review'],
  pil: ['public interest litigation', 'judicial activism'],
  sc: ['supreme court', 'supreme court jurisdiction'],
  hc: ['high court'],
  fr: ['fundamental rights'],
  frs: ['fundamental rights'],
  dpsp: ['directive principles of state policy', 'directive principles'],
  fd: ['fundamental duties'],
  ucc: ['uniform civil code', 'article 44'],
  caa: ['citizenship amendment act', 'citizenship'],
  njac: ['national judicial appointments commission', 'judicial independence', 'collegium'],
  pri: ['panchayati raj', '73rd amendment'],
  ulb: ['urban local bodies', 'municipalities', '74th amendment'],
  cag: ['comptroller and auditor general'],
  eci: ['election commission'],
  rpa: ['representation of the people act'],
  rbi: ['reserve bank of india', 'monetary policy'],
  mpc: ['monetary policy committee', 'monetary policy'],
  cpi: ['consumer price index', 'inflation'],
  wpi: ['wholesale price index', 'inflation'],
  npa: ['non-performing assets', 'banking'],
  ibc: ['insolvency and bankruptcy code'],
  gst: ['goods and services tax', 'gst council'],
  frbm: ['fiscal responsibility and budget management', 'fiscal deficit'],
  bop: ['balance of payments'],
  cad: ['current account deficit', 'balance of payments'],
  fdi: ['foreign direct investment'],
  fpi: ['foreign portfolio investment'],
  sebi: ['securities and exchange board of india', 'capital market'],
  msp: ['minimum support price', 'agriculture'],
  pds: ['public distribution system', 'food security'],
  unfccc: ['climate change', 'paris agreement'],
  ghg: ['greenhouse gas', 'climate change'],
  cop: ['conference of parties', 'unfccc', 'climate change'],
  cbd: ['convention on biological diversity', 'biodiversity'],
  iucn: ['red list', 'critically endangered', 'biodiversity'],
  eia: ['environmental impact assessment'],
  ngt: ['national green tribunal'],
  enso: ['el nino', 'southern oscillation', 'monsoon'],
  iod: ['indian ocean dipole', 'monsoon'],
  itcz: ['inter-tropical convergence zone', 'monsoon'],
  ivc: ['indus valley civilization', 'harappan'],
  isro: ['space technology', 'pslv', 'gslv'],
  ai: ['artificial intelligence'],
  iot: ['internet of things'],
  dpi: ['digital public infrastructure'],
  wto: ['world trade organization'],
  imf: ['international monetary fund'],
  unsc: ['united nations security council'],
  ei: ['emotional intelligence'],
  rti: ['right to information'],
};

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'which',
  'what',
  'when',
  'where',
  'who',
  'whom',
  'whose',
  'why',
  'how',
  'are',
  'was',
  'were',
  'been',
  'have',
  'has',
  'had',
  'following',
  'consider',
  'statement',
  'statements',
  'correct',
  'above',
  'given',
  'below',
  'reference',
  'context',
  'india',
  'indian',
  'select',
  'answer',
  'using',
  'code',
  'only',
  'both',
  'neither',
  'nor',
  'one',
  'two',
  'three',
  'all',
  'none',
  'about',
  'into',
  'over',
  'under',
  'between',
  'among',
  'their',
  'there',
  'they',
  'them',
  'these',
  'those',
]);

// ============================================================================
// TEXT NORMALIZATION & LEVENSHTEIN HELPERS
// ============================================================================

export function normalizeSearchText(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeQuery(query: string): string[] {
  const norm = normalizeSearchText(query);
  if (!norm) return [];
  return norm
    .split(/[\s-]+/)
    .filter((tok) => tok.length >= 2 && !STOP_WORDS.has(tok));
}

export function stemToken(token: string): string {
  if (token.length <= 4) return token;
  if (token.endsWith('ies') && token.length > 5) return token.slice(0, -3) + 'y';
  if (token.endsWith('tion') && token.length > 6) return token.slice(0, -3);
  if (token.endsWith('ism') && token.length > 6) return token.slice(0, -3);
  if (token.endsWith('ing') && token.length > 6) return token.slice(0, -3);
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 4) return token.slice(0, -1);
  return token;
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

// ============================================================================
// QUESTION FORMAT DETECTION & INDEXING
// ============================================================================

export function detectPrelimsQuestionFormat(q: PYQQuestion): PYQQuestionFormat {
  if (q.passageText && q.passageText.trim().length > 20) {
    return 'PASSAGE';
  }
  const text = q.questionText || '';
  if (/match list|pair|correctly matched|how many of the above pairs/i.test(text)) {
    return 'MATCH_LIST';
  }
  if (/consider the following|which of the statements given above|statement-i/i.test(text)) {
    return 'STATEMENT';
  }
  return 'MCQ';
}

export function detectMainsQuestionFormat(q: MainsQuestionRecord): PYQQuestionFormat {
  if (q.paper_id === 'ESSAY') return 'ESSAY';
  if (q.is_case_study) return 'MAINS_CASE_STUDY';
  return 'MAINS_THEORY';
}

export function inferMainsDifficulty(q: MainsQuestionRecord): DifficultyLevel {
  if (q.is_case_study || q.marks >= 20) return 'Hard';
  if (q.marks >= 15) return 'Medium';
  return 'Medium';
}

interface IndexedQuestionRecord {
  id: string;
  examType: PYQExamType;
  year: number;
  gsPaper: PYQGSPaper;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: DifficultyLevel;
  questionType: PYQQuestionFormat;
  /** Primary searchable text (stem + options + topic + subtopic + coreConcept) */
  primarySearchBlob: string;
  /** Secondary searchable text (detailed explanation + tags) */
  secondarySearchBlob: string;
  /** Topic/subtopic/tag blob for high-weight metadata match */
  metadataBlob: string;
  prelimsQuestion?: PYQQuestion;
  mainsQuestion?: MainsQuestionRecord;
}

let cachedIndex: IndexedQuestionRecord[] | null = null;

function buildQuestionIndex(): IndexedQuestionRecord[] {
  if (cachedIndex) return cachedIndex;

  const records: IndexedQuestionRecord[] = [];

  // 1. Index Official Prelims PYQs
  for (const pq of ALL_CLASSIFIED_PYQS) {
    const optionsText = (pq.options || []).map((o) => o.text).join(' ');
    const coreConcept = pq.explanation?.coreConcept || '';
    const detailed = pq.explanation?.detailedAnalysis || '';
    const tagsText = [...(pq.tags || []), ...(pq.secondaryTags || [])].join(' ');

    const metadataBlob = normalizeSearchText(
      `${pq.subjectName} ${pq.chapterName} ${pq.subtopicName} ${pq.rawTopic || ''} ${coreConcept} ${tagsText}`
    );

    const primarySearchBlob = normalizeSearchText(
      `${pq.questionText} ${pq.passageText || ''} ${optionsText} ${pq.chapterName} ${pq.subtopicName} ${pq.rawTopic || ''} ${coreConcept}`
    );

    const secondarySearchBlob = normalizeSearchText(`${detailed} ${tagsText}`);

    records.push({
      id: pq.id,
      examType: 'PRELIMS',
      year: pq.year,
      gsPaper: pq.paper === 'GS2' ? 'CSAT' : 'GS1',
      subject: pq.subjectName || 'General Studies',
      topic: pq.chapterName || pq.rawTopic || 'General',
      subtopic: pq.subtopicName || pq.chapterName || 'General',
      difficulty: pq.difficulty || 'Medium',
      questionType: detectPrelimsQuestionFormat(pq),
      primarySearchBlob,
      secondarySearchBlob,
      metadataBlob,
      prelimsQuestion: pq,
    });
  }

  // 2. Index Official Mains PYQs
  const mainsQuestions = getAllMainsQuestions();
  for (const mq of mainsQuestions) {
    const subQs = (mq.sub_questions || []).join(' ');
    const metadataBlob = normalizeSearchText(
      `${mq.subject_area} ${mq.topic} ${mq.title || ''} ${mq.section_name}`
    );
    const primarySearchBlob = normalizeSearchText(
      `${mq.text_english} ${mq.title || ''} ${mq.scenario_english || ''} ${subQs} ${mq.topic} ${mq.subject_area}`
    );
    const secondarySearchBlob = normalizeSearchText(`${mq.paper_title} ${mq.section_name}`);

    const gsPaper: PYQGSPaper =
      mq.paper_id === 'GS1' ||
      mq.paper_id === 'GS2' ||
      mq.paper_id === 'GS3' ||
      mq.paper_id === 'GS4' ||
      mq.paper_id === 'ESSAY'
        ? mq.paper_id
        : 'GS1';

    records.push({
      id: mq.id,
      examType: 'MAINS',
      year: mq.year,
      gsPaper,
      subject: mq.subject_area || mq.paper_title,
      topic: mq.topic || mq.subject_area || 'General Studies',
      subtopic: mq.topic || mq.section_name || 'Mains Practice',
      difficulty: inferMainsDifficulty(mq),
      questionType: detectMainsQuestionFormat(mq),
      primarySearchBlob,
      secondarySearchBlob,
      metadataBlob,
      mainsQuestion: mq,
    });
  }

  cachedIndex = records;
  return records;
}

/**
 * Helper to check if a phrase occurs with word boundaries inside normalized text.
 */
function containsPhraseBounded(haystack: string, needle: string): boolean {
  if (!needle || !haystack) return false;
  const idx = haystack.indexOf(needle);
  if (idx === -1) return false;
  const beforeOk = idx === 0 || haystack[idx - 1] === ' ';
  const afterIdx = idx + needle.length;
  const afterOk = afterIdx === haystack.length || haystack[afterIdx] === ' ';
  return beforeOk && afterOk;
}

// ============================================================================
// MATCHING ENGINE CORE
// ============================================================================

export class PYQMatchingService {
  /**
   * Returns all pre-indexed records for fast global inspection.
   */
  static getAllIndexedQuestions(): IndexedQuestionRecord[] {
    return buildQuestionIndex();
  }

  /**
   * Resolves a user query to matching Concept Ontology nodes (Level 2)
   * and Syllabus Taxonomy subtopics (Level 3).
   */
  static resolveConceptNodes(rawQuery: string): {
    primaryConcepts: UPSCConceptNode[];
    secondaryConcepts: UPSCConceptNode[];
    expandedPhrases: string[];
  } {
    const normQuery = normalizeSearchText(rawQuery);
    if (!normQuery) {
      return { primaryConcepts: [], secondaryConcepts: [], expandedPhrases: [] };
    }

    const tokens = tokenizeQuery(rawQuery);
    const expandedPhrases = new Set<string>([normQuery]);

    // Check abbreviation / synonym dictionary
    if (SYNONYM_EXPANSION_MAP[normQuery]) {
      SYNONYM_EXPANSION_MAP[normQuery].forEach((p) => expandedPhrases.add(normalizeSearchText(p)));
    }
    for (const tok of tokens) {
      if (SYNONYM_EXPANSION_MAP[tok]) {
        SYNONYM_EXPANSION_MAP[tok].forEach((p) => expandedPhrases.add(normalizeSearchText(p)));
      }
    }

    const primaryConcepts: UPSCConceptNode[] = [];
    const secondaryConcepts: UPSCConceptNode[] = [];

    for (const node of UPSC_CONCEPT_ONTOLOGY) {
      const normTitle = normalizeSearchText(node.title);
      const normAliases = node.aliases.map((a) => normalizeSearchText(a));

      // Direct title or alias match -> Primary Concept
      const isDirectMatch =
        normTitle === normQuery ||
        normTitle.includes(normQuery) ||
        normQuery.includes(normTitle) ||
        normAliases.some(
          (alias) =>
            alias === normQuery ||
            (normQuery.length >= 4 && (alias.includes(normQuery) || normQuery.includes(alias))) ||
            (normQuery.length >= 5 && editDistance(alias, normQuery) <= 1)
        ) ||
        Array.from(expandedPhrases).some((ep) => normAliases.includes(ep) || normTitle === ep);

      if (isDirectMatch) {
        primaryConcepts.push(node);
        continue;
      }

      // Check if query matches one of the node's conceptual keywords or related concepts
      const matchesConceptualKeyword = node.conceptualKeywords.some((kw) => {
        const nkw = normalizeSearchText(kw);
        return nkw === normQuery || (normQuery.length >= 5 && nkw.includes(normQuery));
      });

      const matchesRelated = node.relatedConcepts.some((rc) => {
        const nrc = normalizeSearchText(rc);
        return nrc === normQuery || (normQuery.length >= 5 && nrc.includes(normQuery));
      });

      if (matchesConceptualKeyword || matchesRelated) {
        secondaryConcepts.push(node);
      }
    }

    return {
      primaryConcepts,
      secondaryConcepts,
      expandedPhrases: Array.from(expandedPhrases),
    };
  }

  /**
   * Executes the 3-Level Hybrid Search across all Prelims and Mains PYQs.
   * Deduplicates by question ID and sorts by relevanceScore descending.
   */
  static matchQuestionsForTopic(
    rawQuery: string,
    options?: {
      examType?: 'ALL' | PYQExamType;
      minRelevanceScore?: number;
    }
  ): MatchedPYQItem[] {
    const normQuery = normalizeSearchText(rawQuery);
    if (!normQuery) return [];

    const examFilter = options?.examType || 'ALL';
    const minScore = options?.minRelevanceScore ?? 45;

    const index = buildQuestionIndex();
    const queryTokens = tokenizeQuery(rawQuery);
    const stemmedQueryTokens = queryTokens.map(stemToken);

    const { primaryConcepts, secondaryConcepts, expandedPhrases } =
      this.resolveConceptNodes(rawQuery);

    // Collect Level 2 conceptual keywords from matched primary & secondary concept nodes
    const primaryConceptualKeywords = new Set<string>();
    const secondaryConceptualKeywords = new Set<string>();
    const syllabusTargetTerms = new Set<string>();
    const excludeTerms = new Set<string>();

    for (const node of primaryConcepts) {
      node.aliases.forEach((a) => primaryConceptualKeywords.add(normalizeSearchText(a)));
      node.conceptualKeywords.forEach((k) => primaryConceptualKeywords.add(normalizeSearchText(k)));
      node.syllabusKeywords.forEach((s) => syllabusTargetTerms.add(normalizeSearchText(s)));
      (node.excludeTerms || []).forEach((e) => excludeTerms.add(normalizeSearchText(e)));
    }

    for (const node of secondaryConcepts) {
      node.aliases.forEach((a) => secondaryConceptualKeywords.add(normalizeSearchText(a)));
      node.conceptualKeywords
        .slice(0, 12)
        .forEach((k) => secondaryConceptualKeywords.add(normalizeSearchText(k)));
    }

    // Also inspect UPSC_PRELIMS_TAXONOMY for Level 3 syllabus subtopic keyword matches
    for (const subject of UPSC_PRELIMS_TAXONOMY) {
      for (const topic of subject.topics) {
        const normTopicName = normalizeSearchText(topic.name);
        if (normTopicName.includes(normQuery) || normQuery.includes(normTopicName)) {
          syllabusTargetTerms.add(normTopicName);
          for (const sub of topic.subtopics) {
            syllabusTargetTerms.add(normalizeSearchText(sub.name));
            sub.keywords.slice(0, 8).forEach((kw) => {
              const nkw = normalizeSearchText(kw);
              if (nkw.length >= 4) primaryConceptualKeywords.add(nkw);
            });
          }
        } else {
          for (const sub of topic.subtopics) {
            const normSubName = normalizeSearchText(sub.name);
            if (normSubName.includes(normQuery) || normQuery.includes(normSubName)) {
              syllabusTargetTerms.add(normSubName);
              syllabusTargetTerms.add(normTopicName);
              sub.keywords.forEach((kw) => {
                const nkw = normalizeSearchText(kw);
                if (nkw.length >= 4) primaryConceptualKeywords.add(nkw);
              });
            }
          }
        }
      }
    }

    const matchedById = new Map<string, MatchedPYQItem>();

    for (const rec of index) {
      if (examFilter !== 'ALL' && rec.examType !== examFilter) {
        continue;
      }

      // Guard against excluded terms
      let isExcluded = false;
      for (const ex of excludeTerms) {
        if (ex && containsPhraseBounded(rec.primarySearchBlob, ex)) {
          isExcluded = true;
          break;
        }
      }
      if (isExcluded) continue;

      let bestScore = 0;
      let matchTier: PYQMatchTier = 'syllabus';
      const matchedTerms: string[] = [];
      let matchReason = '';

      // ----------------------------------------------------------------------
      // LEVEL 1: EXACT KEYWORD & PHRASE MATCHING
      // ----------------------------------------------------------------------
      let exactPhraseMatched = false;
      for (const phrase of expandedPhrases) {
        if (phrase.length < 2) continue;
        if (containsPhraseBounded(rec.metadataBlob, phrase)) {
          bestScore = Math.max(bestScore, 98);
          matchTier = 'exact';
          exactPhraseMatched = true;
          matchedTerms.push(phrase);
          matchReason = `Exact topic/concept match: "${phrase}"`;
          break;
        }
        if (containsPhraseBounded(rec.primarySearchBlob, phrase)) {
          bestScore = Math.max(bestScore, 94);
          matchTier = 'exact';
          exactPhraseMatched = true;
          matchedTerms.push(phrase);
          matchReason = `Direct match in question text: "${phrase}"`;
          break;
        }
        if (containsPhraseBounded(rec.secondarySearchBlob, phrase)) {
          bestScore = Math.max(bestScore, 86);
          matchTier = 'exact';
          exactPhraseMatched = true;
          matchedTerms.push(phrase);
          matchReason = `Matched in official concept analysis: "${phrase}"`;
          break;
        }
      }

      // Multi-token exact match when query has >= 2 words
      if (!exactPhraseMatched && queryTokens.length >= 2) {
        const matchedTokenCount = queryTokens.filter(
          (tok, idx) =>
            containsPhraseBounded(rec.primarySearchBlob, tok) ||
            (stemmedQueryTokens[idx].length >= 4 &&
              rec.primarySearchBlob.includes(stemmedQueryTokens[idx]))
        ).length;

        if (matchedTokenCount === queryTokens.length) {
          const inMeta = queryTokens.every((tok) => rec.metadataBlob.includes(tok));
          bestScore = Math.max(bestScore, inMeta ? 92 : 85);
          matchTier = 'exact';
          matchedTerms.push(...queryTokens);
          matchReason = `Matches all key terms: ${queryTokens.join(', ')}`;
        }
      }

      // ----------------------------------------------------------------------
      // LEVEL 2: SEMANTIC / CONCEPTUAL ONTOLOGY MATCHING
      // ----------------------------------------------------------------------
      if (bestScore < 85 && (primaryConceptualKeywords.size > 0 || secondaryConceptualKeywords.size > 0)) {
        const conceptualHitsInPrimary: string[] = [];
        const conceptualHitsInSecondary: string[] = [];

        for (const ckw of primaryConceptualKeywords) {
          if (ckw.length < 3) continue;
          if (containsPhraseBounded(rec.primarySearchBlob, ckw)) {
            conceptualHitsInPrimary.push(ckw);
          } else if (containsPhraseBounded(rec.secondarySearchBlob, ckw)) {
            conceptualHitsInSecondary.push(ckw);
          }
        }

        // Check if question belongs to a compatible subject when matching via conceptual keywords
        const recSubjectNorm = normalizeSearchText(rec.subject);
        const subjectCompatible =
          primaryConcepts.length === 0 ||
          primaryConcepts.some((c) => {
            const cSubNorm = normalizeSearchText(c.subject);
            return (
              recSubjectNorm.includes(cSubNorm.split(' ')[0]) ||
              cSubNorm.includes(recSubjectNorm.split(' ')[0]) ||
              c.gsPapers.includes(rec.gsPaper)
            );
          });

        if (subjectCompatible && conceptualHitsInPrimary.length > 0) {
          const hitBonus = Math.min(16, (conceptualHitsInPrimary.length - 1) * 5);
          const metaBonus = conceptualHitsInPrimary.some((h) => rec.metadataBlob.includes(h))
            ? 6
            : 0;
          const conceptualScore = Math.min(89, 68 + hitBonus + metaBonus);

          if (conceptualScore > bestScore) {
            bestScore = conceptualScore;
            matchTier = 'conceptual';
            matchedTerms.push(...conceptualHitsInPrimary.slice(0, 4));
            const conceptLabel = primaryConcepts[0]?.title || rawQuery;
            matchReason = `Conceptual match (${conceptLabel}): ${conceptualHitsInPrimary
              .slice(0, 3)
              .join(', ')}`;
          }
        } else if (
          subjectCompatible &&
          conceptualHitsInSecondary.length >= 2
        ) {
          const conceptualScore = Math.min(76, 60 + conceptualHitsInSecondary.length * 4);
          if (conceptualScore > bestScore) {
            bestScore = conceptualScore;
            matchTier = 'conceptual';
            matchedTerms.push(...conceptualHitsInSecondary.slice(0, 3));
            matchReason = `Related concept analysis: ${conceptualHitsInSecondary
              .slice(0, 2)
              .join(', ')}`;
          }
        } else if (secondaryConceptualKeywords.size > 0) {
          const secHits: string[] = [];
          for (const skw of secondaryConceptualKeywords) {
            if (skw.length >= 4 && containsPhraseBounded(rec.primarySearchBlob, skw)) {
              secHits.push(skw);
            }
          }
          if (secHits.length >= 2) {
            const score = Math.min(74, 58 + secHits.length * 4);
            if (score > bestScore) {
              bestScore = score;
              matchTier = 'conceptual';
              matchedTerms.push(...secHits.slice(0, 3));
              matchReason = `Related UPSC concept: ${secHits.slice(0, 2).join(', ')}`;
            }
          }
        }
      }

      // ----------------------------------------------------------------------
      // LEVEL 3: SUBJECT & SYLLABUS HIERARCHY MAPPING
      // ----------------------------------------------------------------------
      if (bestScore < 62) {
        // Check if topic/subtopic metadata matches syllabus target terms
        const syllabusHits: string[] = [];
        for (const sterm of syllabusTargetTerms) {
          if (sterm.length >= 4 && containsPhraseBounded(rec.metadataBlob, sterm)) {
            syllabusHits.push(sterm);
          }
        }

        if (syllabusHits.length > 0 && queryTokens.length > 0) {
          // Require either a strong subtopic match or at least one token / conceptual signal
          const hasAnyTokenOrConcept =
            queryTokens.some((t) => rec.primarySearchBlob.includes(stemToken(t))) ||
            syllabusHits.some((sh) => sh.includes(normQuery) || normQuery.includes(sh));

          if (hasAnyTokenOrConcept) {
            const syllabusScore = Math.min(66, 52 + syllabusHits.length * 5);
            if (syllabusScore > bestScore) {
              bestScore = syllabusScore;
              matchTier = 'syllabus';
              matchedTerms.push(...syllabusHits.slice(0, 2));
              matchReason = `UPSC Syllabus Mapping: ${rec.topic} › ${rec.subtopic}`;
            }
          }
        }

        // Partial word / prefix & fuzzy fallback for single-token or multi-token queries
        if (bestScore < minScore && queryTokens.length >= 1) {
          const strongTokens = queryTokens.filter((t) => t.length >= 4);
          if (strongTokens.length > 0) {
            const matchedStrong = strongTokens.filter((t) => {
              const st = stemToken(t);
              return (
                rec.metadataBlob.includes(st) ||
                containsPhraseBounded(rec.primarySearchBlob, t)
              );
            });

            if (
              matchedStrong.length === strongTokens.length ||
              (strongTokens.length >= 2 && matchedStrong.length >= strongTokens.length - 1 && rec.metadataBlob.includes(stemToken(matchedStrong[0])))
            ) {
              const fallbackScore = rec.metadataBlob.includes(stemToken(matchedStrong[0])) ? 64 : 54;
              if (fallbackScore > bestScore) {
                bestScore = fallbackScore;
                matchTier = 'syllabus';
                matchedTerms.push(...matchedStrong);
                matchReason = `Syllabus & keyword match: ${matchedStrong.join(', ')}`;
              }
            }
          }
        }
      }

      if (bestScore >= minScore) {
        const uniqueTerms = Array.from(new Set(matchedTerms)).slice(0, 5);
        matchedById.set(rec.id, {
          id: rec.id,
          examType: rec.examType,
          year: rec.year,
          gsPaper: rec.gsPaper,
          subject: rec.subject,
          topic: rec.topic,
          subtopic: rec.subtopic,
          difficulty: rec.difficulty,
          questionType: rec.questionType,
          relevanceScore: bestScore,
          matchTier,
          matchedTerms: uniqueTerms,
          matchReason: matchReason || `Relevant to ${rawQuery}`,
          prelimsQuestion: rec.prelimsQuestion,
          mainsQuestion: rec.mainsQuestion,
        });
      }
    }

    const results = Array.from(matchedById.values());

    // Sort by relevanceScore DESC, then year DESC
    results.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.year - a.year;
    });

    return results;
  }
}

