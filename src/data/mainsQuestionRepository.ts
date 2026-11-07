/**
 * Dynamic UPSC Mains Question Bank Repository
 * Reads, organizes, and indexes UPSC Mains papers from dynamic JSON structures.
 */

import {
  MainsPaperId,
  MainsPaperSummary,
  MainsQuestionRecord,
  MainsRawPaperFile,
  MainsRawQuestion,
} from '@/types/mains';

// Import bundled 2026 Mains papers
import GS1_RAW from '../../assets/data/mains/upsc_mains_2026_gs1.json';
import GS2_RAW from '../../assets/data/mains/upsc_mains_2026_gs2.json';
import GS3_RAW from '../../assets/data/mains/upsc_mains_2026_gs3.json';
import GS4_RAW from '../../assets/data/mains/upsc_mains_2026_gs4.json';
import ESSAY_RAW from '../../assets/data/mains/upsc_mains_2026_essay.json';

// In-memory registry of imported raw papers to allow dynamic runtime/future imports
const REGISTERED_PAPERS: MainsRawPaperFile[] = [
  GS1_RAW as unknown as MainsRawPaperFile,
  GS2_RAW as unknown as MainsRawPaperFile,
  GS3_RAW as unknown as MainsRawPaperFile,
  GS4_RAW as unknown as MainsRawPaperFile,
  ESSAY_RAW as unknown as MainsRawPaperFile,
];

function derivePaperId(raw: MainsRawPaperFile): MainsPaperId {
  const paperUpper = (raw.paper || '').toUpperCase();
  const subjectUpper = (raw.subject || '').toUpperCase();

  if (
    paperUpper.includes('PAPER IV') ||
    paperUpper.includes('PAPER 4') ||
    paperUpper.includes('GS 4') ||
    paperUpper.includes('GS-4') ||
    subjectUpper.includes('ETHICS')
  ) {
    return 'GS4';
  }
  if (
    paperUpper.includes('PAPER III') ||
    paperUpper.includes('PAPER 3') ||
    paperUpper.includes('GS 3') ||
    paperUpper.includes('GS-3') ||
    subjectUpper.includes('TECHNOLOGY') ||
    subjectUpper.includes('BIODIVERSITY')
  ) {
    return 'GS3';
  }
  if (
    paperUpper.includes('PAPER II') ||
    paperUpper.includes('PAPER 2') ||
    paperUpper.includes('GS 2') ||
    paperUpper.includes('GS-2') ||
    subjectUpper.includes('GOVERNANCE') ||
    subjectUpper.includes('POLITY')
  ) {
    return 'GS2';
  }
  if (
    paperUpper.includes('PAPER I') ||
    paperUpper.includes('PAPER 1') ||
    paperUpper.includes('GS 1') ||
    paperUpper.includes('GS-1') ||
    subjectUpper.includes('HERITAGE') ||
    subjectUpper.includes('GEOGRAPHY')
  ) {
    return 'GS1';
  }
  if (paperUpper.includes('ESSAY') || subjectUpper.includes('ESSAY')) {
    return 'ESSAY';
  }
  return 'OPTIONAL';
}

function parseWordLimit(limit: number | string | undefined, marks: number): number {
  if (typeof limit === 'number' && limit > 0) return limit;
  if (typeof limit === 'string') {
    const matched = limit.match(/\d+/g);
    if (matched && matched.length > 0) {
      // If range like "1000-1200", pick max
      return parseInt(matched[matched.length - 1], 10);
    }
  }
  // Standard UPSC defaults
  if (marks === 10) return 150;
  if (marks === 15) return 250;
  if (marks === 20) return 250;
  if (marks >= 100) return 1200;
  return 150;
}

function normalizeRawQuestion(
  q: MainsRawQuestion,
  paper: MainsRawPaperFile,
  paperId: MainsPaperId,
  sectionName: string,
  sectionCode: string
): MainsQuestionRecord {
  const isCaseStudy = Boolean(
    q.scenario_english ||
    (sectionName && sectionName.toLowerCase().includes('case stud')) ||
    (q.title && q.title.toLowerCase().includes('case stud')) ||
    (q.sub_questions && q.sub_questions.length > 0 && q.marks >= 20)
  );

  return {
    id: q.id || `${paper.year}_${paperId}_Q${q.question_number}`,
    paper_id: paperId,
    paper_title: paper.paper,
    paper_code: paper.paper_code || `${paperId}-${paper.year}`,
    year: paper.year || 2026,
    exam: paper.exam || 'Civil Services (Main) Examination',
    section_name: sectionName || (isCaseStudy ? 'Section B (Case Studies)' : 'General'),
    section_code: sectionCode || (isCaseStudy ? 'SECTION B' : 'SECTION A'),
    question_number: String(q.question_number),
    text_english: q.text_english || q.scenario_english || '',
    text_hindi: q.text_hindi || q.scenario_hindi,
    marks: q.marks || (paperId === 'ESSAY' ? 125 : 10),
    word_limit: parseWordLimit(q.word_limit, q.marks),
    subject_area: q.subject_area || (paperId === 'GS4' ? 'Ethics, Integrity & Aptitude' : paper.subject),
    topic: q.topic || 'General Practice',
    is_case_study: isCaseStudy,
    title: q.title,
    scenario_english: q.scenario_english,
    scenario_hindi: q.scenario_hindi,
    sub_questions: q.sub_questions,
    sub_questions_hindi: q.sub_questions_hindi,
  };
}

let cachedQuestions: MainsQuestionRecord[] | null = null;

function buildAllQuestions(): MainsQuestionRecord[] {
  if (cachedQuestions) return cachedQuestions;

  const records: MainsQuestionRecord[] = [];

  for (const paper of REGISTERED_PAPERS) {
    const paperId = derivePaperId(paper);

    if (paper.sections && Array.isArray(paper.sections) && paper.sections.length > 0) {
      for (const section of paper.sections) {
        if (section.questions && Array.isArray(section.questions)) {
          for (const q of section.questions) {
            records.push(
              normalizeRawQuestion(
                q,
                paper,
                paperId,
                section.section_name,
                section.section_code
              )
            );
          }
        }
      }
    } else if (paper.questions && Array.isArray(paper.questions)) {
      for (const q of paper.questions) {
        records.push(
          normalizeRawQuestion(
            q,
            paper,
            paperId,
            'Section A',
            'SECTION A'
          )
        );
      }
    }
  }

  cachedQuestions = records;
  return records;
}

/**
 * Register a newly imported Mains JSON paper dynamically.
 */
export function registerMainsPaperJson(raw: MainsRawPaperFile): boolean {
  if (!raw || !raw.paper) return false;
  REGISTERED_PAPERS.push(raw);
  cachedQuestions = null; // Invalidate cache
  return true;
}

/**
 * Get all normalized questions across all imported papers.
 */
export function getAllMainsQuestions(): MainsQuestionRecord[] {
  return buildAllQuestions();
}

/**
 * Get a specific question by its unique ID.
 */
export function getMainsQuestionById(id: string): MainsQuestionRecord | undefined {
  const all = getAllMainsQuestions();
  return all.find((q) => q.id === id);
}

/**
 * Get list of available papers and their metadata.
 */
export function getMainsPaperSummaries(): MainsPaperSummary[] {
  const all = getAllMainsQuestions();
  const paperOrder: MainsPaperId[] = ['GS1', 'GS2', 'GS3', 'GS4', 'ESSAY', 'OPTIONAL'];

  const paperNames: Record<MainsPaperId, { title: string; defaultSubject: string }> = {
    GS1: {
      title: 'General Studies Paper I',
      defaultSubject: 'Indian Heritage, History, Geography & Society',
    },
    GS2: {
      title: 'General Studies Paper II',
      defaultSubject: 'Governance, Constitution, Polity, Social Justice & IR',
    },
    GS3: {
      title: 'General Studies Paper III',
      defaultSubject: 'Technology, Economic Development, Biodiversity, Environment, Security & Disaster Management',
    },
    GS4: {
      title: 'General Studies Paper IV',
      defaultSubject: 'Ethics, Integrity and Aptitude',
    },
    ESSAY: {
      title: 'Essay Paper',
      defaultSubject: 'Philosophical, Socio-Economic, Environmental & Reflective Topics',
    },
    OPTIONAL: {
      title: 'Optional Subjects',
      defaultSubject: 'Candidate-selected Optional Paper I & II',
    },
  };

  return paperOrder.map((paperId) => {
    const questions = all.filter((q) => q.paper_id === paperId);
    const hasData = questions.length > 0;

    const sectionsMap = new Map<string, { name: string; code: string; count: number }>();
    const subjectAreasSet = new Set<string>();
    const topicsSet = new Set<string>();

    let totalMarks = 0;
    let paperCode = `${paperId}-2026`;
    let year = 2026;
    let subject = paperNames[paperId].defaultSubject;

    for (const q of questions) {
      totalMarks += q.marks;
      if (q.paper_code) paperCode = q.paper_code;
      if (q.year) year = q.year;
      if (q.subject_area) subjectAreasSet.add(q.subject_area);
      if (q.topic) topicsSet.add(q.topic);

      const secKey = q.section_code || q.section_name;
      const currentSec = sectionsMap.get(secKey) || {
        name: q.section_name,
        code: q.section_code,
        count: 0,
      };
      currentSec.count++;
      sectionsMap.set(secKey, currentSec);
    }

    return {
      paper_id: paperId,
      title: paperNames[paperId].title,
      subject,
      year,
      paper_code: paperCode,
      total_questions: questions.length,
      total_marks: totalMarks || 250,
      available: hasData,
      sections: Array.from(sectionsMap.values()),
      subject_areas: Array.from(subjectAreasSet),
      topics: Array.from(topicsSet),
    };
  });
}

/**
 * Mode A: Topic-wise filter
 */
export function getQuestionsByTopic(
  paperId: MainsPaperId,
  subjectArea?: string,
  topic?: string
): MainsQuestionRecord[] {
  return getAllMainsQuestions().filter((q) => {
    if (q.paper_id !== paperId) return false;
    if (subjectArea && q.subject_area !== subjectArea) return false;
    if (topic && q.topic !== topic) return false;
    return true;
  });
}

/**
 * Mode B: Paper-wise practice
 */
export function getQuestionsByPaper(paperId: MainsPaperId): MainsQuestionRecord[] {
  return getAllMainsQuestions().filter((q) => q.paper_id === paperId);
}

/**
 * Mode C: Section-wise practice (Section A vs Section B Case Studies)
 */
export function getQuestionsBySection(
  paperId: MainsPaperId,
  sectionCodeOrType: 'SECTION A' | 'SECTION B' | 'theories' | 'case_studies' | string
): MainsQuestionRecord[] {
  return getAllMainsQuestions().filter((q) => {
    if (q.paper_id !== paperId) return false;
    if (sectionCodeOrType === 'case_studies') return q.is_case_study;
    if (sectionCodeOrType === 'theories') return !q.is_case_study;
    return (
      q.section_code.toLowerCase().includes(sectionCodeOrType.toLowerCase()) ||
      q.section_name.toLowerCase().includes(sectionCodeOrType.toLowerCase())
    );
  });
}

/**
 * Mode D: Year-wise practice
 */
export function getQuestionsByYear(year: number, paperId?: MainsPaperId): MainsQuestionRecord[] {
  return getAllMainsQuestions().filter((q) => {
    if (q.year !== year) return false;
    if (paperId && q.paper_id !== paperId) return false;
    return true;
  });
}

/**
 * Mode E: Random practice
 */
export function getRandomMainsQuestion(filters?: {
  paperId?: MainsPaperId;
  subjectArea?: string;
  topic?: string;
  isCaseStudy?: boolean;
}): MainsQuestionRecord | null {
  const all = getAllMainsQuestions().filter((q) => {
    if (filters?.paperId && q.paper_id !== filters.paperId) return false;
    if (filters?.subjectArea && q.subject_area !== filters.subjectArea) return false;
    if (filters?.topic && q.topic !== filters.topic) return false;
    if (filters?.isCaseStudy !== undefined && q.is_case_study !== filters.isCaseStudy) return false;
    return true;
  });

  if (all.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * all.length);
  return all[randomIndex];
}

/**
 * Get distinct subject areas and topics mapped for a specific paper.
 */
export function getPaperTaxonomy(paperId: MainsPaperId): {
  subjectAreas: { name: string; questionCount: number; topics: string[] }[];
} {
  const questions = getQuestionsByPaper(paperId);
  const map = new Map<string, { count: number; topicsSet: Set<string> }>();

  for (const q of questions) {
    const area = q.subject_area || 'General';
    const entry = map.get(area) || { count: 0, topicsSet: new Set<string>() };
    entry.count++;
    if (q.topic) entry.topicsSet.add(q.topic);
    map.set(area, entry);
  }

  return {
    subjectAreas: Array.from(map.entries()).map(([name, val]) => ({
      name,
      questionCount: val.count,
      topics: Array.from(val.topicsSet),
    })),
  };
}
