import {
  UPSC_PRELIMS_TAXONOMY,
  TaxonomySubject,
  TaxonomyTopic,
} from '@/constants/upscTaxonomy';
import {
  Chapter,
  ConfidenceBand,
  DifficultyLevel,
  PYQQuestion,
  Subject,
  SubtopicSummary,
  ValidationStatus,
  YearTrend,
} from '@/types/prelims';
import { QuestionRecord } from '@/types/mockTest';

// Static imports of all 20 classified & validated UPSC Prelims PYQ JSON files (2016–2026)
import gs2016 from '../../assets/data/pyqs/gs_2016_paper1_set_A.json';
import gs2017 from '../../assets/data/pyqs/gs_2017_paper1_set_A.json';
import gs2018 from '../../assets/data/pyqs/gs_2018_paper1_set_A.json';
import gs2019 from '../../assets/data/pyqs/gs_2019_paper1_set_A.json';
import gs2020 from '../../assets/data/pyqs/gs_2020_paper1_set_A.json';
import gs2021 from '../../assets/data/pyqs/gs_2021_paper1_set_A.json';
import gs2022 from '../../assets/data/pyqs/gs_2022_paper1_set_A.json';
import gs2023 from '../../assets/data/pyqs/gs_2023_paper1_set_A.json';
import gs2024 from '../../assets/data/pyqs/gs_2024_paper1_set_A.json';
import gs2025 from '../../assets/data/pyqs/upsc_2025_gs_paper1_set_a_corrected.json';
import gs2026 from '../../assets/data/pyqs/csat_2026_paper1_set_A.json';

import csat2018 from '../../assets/data/pyqs/csat_2018_paper2_set_A.json';
import csat2019 from '../../assets/data/pyqs/csat_2019_paper2_set_A.json';
import csat2020 from '../../assets/data/pyqs/csat_2020_paper2_set_A.json';
import csat2021 from '../../assets/data/pyqs/csat_2021_paper2_set_A.json';
import csat2022 from '../../assets/data/pyqs/csat_2022_paper2_set_A.json';
import csat2023 from '../../assets/data/pyqs/csat_2023_paper2_set_A.json';
import csat2024 from '../../assets/data/pyqs/csat_2024_paper2_set_A.json';
import csat2025 from '../../assets/data/pyqs/csat_2025_paper2_set_A.json';
import csat2026 from '../../assets/data/pyqs/csat_2026_paper2_set_A.json';

const RAW_EXAM_FILES: { fileName: string; data: any }[] = [
  { fileName: 'gs_2016_paper1_set_A.json', data: gs2016 },
  { fileName: 'gs_2017_paper1_set_A.json', data: gs2017 },
  { fileName: 'gs_2018_paper1_set_A.json', data: gs2018 },
  { fileName: 'gs_2019_paper1_set_A.json', data: gs2019 },
  { fileName: 'gs_2020_paper1_set_A.json', data: gs2020 },
  { fileName: 'gs_2021_paper1_set_A.json', data: gs2021 },
  { fileName: 'gs_2022_paper1_set_A.json', data: gs2022 },
  { fileName: 'gs_2023_paper1_set_A.json', data: gs2023 },
  { fileName: 'gs_2024_paper1_set_A.json', data: gs2024 },
  { fileName: 'upsc_2025_gs_paper1_set_a_corrected.json', data: gs2025 },
  { fileName: 'csat_2026_paper1_set_A.json', data: gs2026 },
  { fileName: 'csat_2018_paper2_set_A.json', data: csat2018 },
  { fileName: 'csat_2019_paper2_set_A.json', data: csat2019 },
  { fileName: 'csat_2020_paper2_set_A.json', data: csat2020 },
  { fileName: 'csat_2021_paper2_set_A.json', data: csat2021 },
  { fileName: 'csat_2022_paper2_set_A.json', data: csat2022 },
  { fileName: 'csat_2023_paper2_set_A.json', data: csat2023 },
  { fileName: 'csat_2024_paper2_set_A.json', data: csat2024 },
  { fileName: 'csat_2025_paper2_set_A.json', data: csat2025 },
  { fileName: 'csat_2026_paper2_set_A.json', data: csat2026 },
];

export const SUBJECT_LEGACY_ALIAS_MAP: Record<string, string> = {
  polity: 'polity_governance',
  economy: 'economy',
  history: 'history_culture',
  culture: 'history_culture',
  environment: 'environment_ecology',
  geography: 'geography',
  scitech: 'science_technology',
  'csat-quant': 'csat_quant_numeracy',
  'csat-comprehension': 'csat_reading_comprehension',
  'csat-reasoning': 'csat_reasoning',
  'csat-data': 'csat_data_interpretation',
};

function composeFullQuestionText(
  q: any,
  passageText: string | null
): string {
  const parts: string[] = [];

  if (passageText) {
    parts.push(`Passage:\n${passageText.trim()}`);
  }

  if (q.directions && typeof q.directions === 'string') {
    parts.push(`Directions: ${q.directions.trim()}`);
  }

  const baseQuestion = (q.question || q.question_text || q.question_en || q.text || '').trim();
  const statements: string[] = Array.isArray(q.statements) ? q.statements : [];

  // Format table or List-I / List-II if present
  let formattedTable = '';
  const tbl = q.table || q.table_data;
  if (tbl && Array.isArray(tbl.rows)) {
    const headerLine = Array.isArray(tbl.headers) ? tbl.headers.join(' | ') : '';
    const rowLines = tbl.rows.map((r: any) => (Array.isArray(r) ? r.join(' — ') : String(r)));
    formattedTable = [headerLine, ...rowLines].filter(Boolean).join('\n');
  } else if (Array.isArray(q.list_i) && Array.isArray(q.list_ii)) {
    const l1Title = q.list_i_title || 'List I';
    const l2Title = q.list_ii_title || 'List II';
    const maxLen = Math.max(q.list_i.length, q.list_ii.length);
    const lines: string[] = [`${l1Title}  |  ${l2Title}`];
    for (let i = 0; i < maxLen; i++) {
      lines.push(`${q.list_i[i] || ''}  —  ${q.list_ii[i] || ''}`);
    }
    formattedTable = lines.join('\n');
  }

  const seqString = q.string && typeof q.string === 'string' ? `\nSequence: ${q.string.trim()}` : '';

  // Insert statements/table naturally before the final "Which of the..." / "Select the..." line if split
  const lines = baseQuestion.split('\n');
  if (lines.length > 1 && (statements.length > 0 || formattedTable)) {
    const intro = lines[0];
    const outro = lines.slice(1).join('\n');
    const middle: string[] = [];
    if (statements.length > 0) middle.push(statements.join('\n'));
    if (formattedTable) middle.push(formattedTable);
    parts.push([intro, ...middle, outro].join('\n\n') + seqString);
  } else {
    const combined: string[] = [baseQuestion];
    if (seqString) combined.push(seqString.trim());
    if (statements.length > 0) combined.push(statements.join('\n'));
    if (formattedTable) combined.push(formattedTable);
    parts.push(combined.filter(Boolean).join('\n\n'));
  }

  return parts.join('\n\n');
}

function inferDifficulty(q: any, statementsCount: number): DifficultyLevel {
  const qText = String(q.question || '').toLowerCase();
  if (
    qText.includes('how many of the above') ||
    qText.includes('statement-i') ||
    statementsCount >= 3 ||
    q.verification_note
  ) {
    return 'Hard';
  }
  if (statementsCount >= 2 || q.passage_id || q.table || q.list_i) {
    return 'Medium';
  }
  return 'Easy';
}

function buildRepository(): {
  allPyqs: PYQQuestion[];
  allQuestionRecords: QuestionRecord[];
  gs1Subjects: Subject[];
  csatSubjects: Subject[];
} {
  const allPyqs: PYQQuestion[] = [];
  const allQuestionRecords: QuestionRecord[] = [];
  const pyqsByTopicId = new Map<string, PYQQuestion[]>();
  const pyqsBySubjectId = new Map<string, PYQQuestion[]>();

  for (const { fileName, data } of RAW_EXAM_FILES) {
    const meta = data.meta || {};
    const year: number = meta.year || 2025;
    const isCsat = meta.paper_type === 'CSAT' || fileName.includes('paper2');
    const paperCode: 'GS1' | 'GS2' = isCsat ? 'GS2' : 'GS1';
    const paperTypeRecord: 'GS1' | 'CSAT' = isCsat ? 'CSAT' : 'GS1';
    const paperName = meta.paper || (isCsat ? 'General Studies Paper II (CSAT)' : 'General Studies Paper I');

    const passagesMap = new Map<string, string>();
    if (Array.isArray(data.passages)) {
      for (const p of data.passages) {
        if (p.id && p.text) {
          passagesMap.set(p.id, p.text);
          if (Array.isArray(p.question_numbers)) {
            for (const qn of p.question_numbers) {
              passagesMap.set(`q_${qn}`, p.text);
            }
          }
        }
      }
    }

    const questions: any[] = data.questions || [];
    questions.forEach((q, idx) => {
      const qNum: number = q.number || q.question_number || idx + 1;
      const id: string = q.id || `upsc_${year}_${paperTypeRecord.toLowerCase()}_q${qNum}`;
      const subjectId: string = q.subject_id || (isCsat ? 'csat_quant_numeracy' : 'current_affairs_misc');
      const subjectName: string = q.subject || 'General Studies';
      const topicId: string = q.topic_id || (isCsat ? 'basic_numeracy' : 'national_and_international_developments');
      const topicName: string = q.topic || 'General';
      const subtopicId: string = q.subtopic_id || `${topicId}_core`;
      const subtopicName: string = q.subtopic || topicName;
      const rawTopic: string = q.raw_topic || topicName;

      let passageText: string | null = q.passage_text || q.passage || null;
      if (!passageText) {
        if (q.passage_id && passagesMap.has(q.passage_id)) {
          passageText = passagesMap.get(q.passage_id) || null;
        } else if (passagesMap.has(`q_${qNum}`)) {
          passageText = passagesMap.get(`q_${qNum}`) || null;
        }
      }

      const fullQuestionText = composeFullQuestionText(q, passageText);

      const rawOpts: any[] = Array.isArray(q.options) ? q.options : [];
      const normalizedOptions = rawOpts.map((opt, oIdx) => {
        const letter = String(opt.id || opt.key || String.fromCharCode(65 + oIdx))
          .trim()
          .toUpperCase() as 'A' | 'B' | 'C' | 'D';
        return {
          key: (['A', 'B', 'C', 'D'].includes(letter) ? letter : 'A') as 'A' | 'B' | 'C' | 'D',
          text: String(opt.text || opt || '').trim(),
        };
      });

      const rawAns = String(q.correct_option || q.correct_answer || q.answer || 'A')
        .trim()
        .toUpperCase();
      const correctAnswer = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';

      const expText = String(q.explanation || q.explanation_en || q.solution || '').trim();
      const expLines = expText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const statementsList: string[] = Array.isArray(q.statements) ? q.statements : [];
      const difficulty = inferDifficulty(q, statementsList.length);
      const secondaryTags: string[] = Array.isArray(q.secondary_tags) ? q.secondary_tags : [];
      const confidence: number = typeof q.classification_confidence === 'number' ? q.classification_confidence : 0.95;
      const confidenceBand: ConfidenceBand = q.confidence_band || 'High';
      const validationStatus: ValidationStatus = q.validation_status || 'verified';

      const pyqItem: PYQQuestion = {
        id,
        year,
        paper: paperCode,
        questionNumber: qNum,
        subjectId,
        subjectName,
        chapterId: topicId,
        chapterName: topicName,
        subtopicId,
        subtopicName,
        rawTopic,
        passageText,
        questionText: fullQuestionText,
        options: normalizedOptions,
        correctAnswer,
        explanation: {
          officialAnswer: `Option (${correctAnswer}) is correct.`,
          coreConcept: `${topicName} · ${subtopicName}`,
          detailedAnalysis: expLines.length > 0 ? expLines : [`Official UPSC Answer Key: Option (${correctAnswer}).`],
          eliminationTechnique: q.verification_note ? `Key Verification Note: ${q.verification_note}` : undefined,
          upscTrendNote: `Asked in UPSC CSE Prelims ${year} (${paperName}, Set A, Q.${qNum}).`,
        },
        difficulty,
        tags: [topicName, subtopicName, `UPSC ${year}`, ...secondaryTags],
        secondaryTags,
        confidence,
        confidenceBand,
        classificationRationale: q.classification_rationale || undefined,
        validationStatus,
        validationNotes: q.validation_notes || null,
        verificationNote: q.verification_note || null,
      };

      allPyqs.push(pyqItem);

      if (!pyqsByTopicId.has(topicId)) pyqsByTopicId.set(topicId, []);
      pyqsByTopicId.get(topicId)!.push(pyqItem);

      if (!pyqsBySubjectId.has(subjectId)) pyqsBySubjectId.set(subjectId, []);
      pyqsBySubjectId.get(subjectId)!.push(pyqItem);

      let tableData = q.table || q.table_data || null;
      if (!tableData && Array.isArray(q.list_i) && Array.isArray(q.list_ii)) {
        tableData = {
          headers: [q.list_i_title || 'List I', q.list_ii_title || 'List II'],
          rows: q.list_i.map((item: string, i: number) => [item, q.list_ii?.[i] || '']),
        };
      }

      const recordItem: QuestionRecord = {
        id,
        exam: 'UPSC CSE Prelims',
        year,
        paper: paperName,
        paper_type: paperTypeRecord,
        question_number: qNum,
        question_text_en: fullQuestionText,
        question_text_hi: null,
        statements: statementsList,
        table_data: tableData,
        passage_id: q.passage_id || null,
        passage_text: passageText,
        options: normalizedOptions.map((o) => ({ id: o.key, text: o.text })),
        correct_answer: correctAnswer,
        explanation_en: expText || null,
        explanation_hi: null,
        subject_id: subjectId,
        subject: subjectName,
        topic_id: topicId,
        topic: topicName,
        subtopic_id: subtopicId,
        subtopic: subtopicName,
        raw_topic: rawTopic,
        secondary_tags: secondaryTags,
        classification_confidence: confidence,
        confidence_band: confidenceBand,
        classification_rationale: q.classification_rationale || undefined,
        validation_status: validationStatus,
        validation_notes: q.validation_notes || null,
        question_image_url: null,
        metadata: {
          source_file: fileName,
          verification_note: q.verification_note || null,
          directions: q.directions || null,
        },
        created_at: new Date().toISOString(),
      };

      allQuestionRecords.push(recordItem);
    });
  }

  // Sort questions within each topic newest year first, then by question number
  for (const list of pyqsByTopicId.values()) {
    list.sort((a, b) => b.year - a.year || (a.questionNumber || 0) - (b.questionNumber || 0));
  }

  const totalGs1Count = allPyqs.filter((q) => q.paper === 'GS1').length || 1100;
  const totalCsatCount = allPyqs.filter((q) => q.paper === 'GS2').length || 720;

  const YEAR_RANGE_GS1 = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const YEAR_RANGE_CSAT = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  function buildSubjectModel(taxSub: TaxonomySubject): Subject {
    const subQuestions = pyqsBySubjectId.get(taxSub.id) || [];
    const subTotal = subQuestions.length;
    const paperTotal = taxSub.paper === 'GS1' ? totalGs1Count : totalCsatCount;
    const yearsList = taxSub.paper === 'GS1' ? YEAR_RANGE_GS1 : YEAR_RANGE_CSAT;

    const chapters: Chapter[] = taxSub.topics.map((taxTop: TaxonomyTopic) => {
      const topQuestions = pyqsByTopicId.get(taxTop.id) || [];
      const topCount = topQuestions.length;
      const weightagePercent = subTotal > 0 ? Number(((topCount / subTotal) * 100).toFixed(1)) : 0;

      const yearTrends: YearTrend[] = yearsList.map((yr) => ({
        year: yr,
        count: topQuestions.filter((q) => q.year === yr).length,
      }));

      // Aggregate distinct subtopics with real question counts
      const subtopicCounts = new Map<string, { id: string; name: string; count: number }>();
      for (const q of topQuestions) {
        const stId = q.subtopicId || `${taxTop.id}_core`;
        const stName = q.subtopicName || taxTop.name;
        const curr = subtopicCounts.get(stId) || { id: stId, name: stName, count: 0 };
        curr.count++;
        subtopicCounts.set(stId, curr);
      }

      const subtopics: SubtopicSummary[] = Array.from(subtopicCounts.values()).sort(
        (a, b) => b.count - a.count
      );

      const recurringTopics =
        subtopics.length > 0
          ? subtopics.slice(0, 5).map((s) => `${s.name} (${s.count} Qs)`)
          : taxTop.subtopics.map((s) => s.name);

      return {
        id: taxTop.id,
        subjectId: taxSub.id,
        title: taxTop.name,
        code: taxTop.code,
        weightagePercent,
        totalQuestions10Yrs: topCount,
        isHighYield: weightagePercent >= 12 || topCount >= 20,
        yearTrends,
        trendSummary: taxTop.description,
        recurringTopics,
        subtopics,
        pyqs: topQuestions,
      };
    });

    const subjectWeightage = Number(((subTotal / paperTotal) * 100).toFixed(1));

    return {
      id: taxSub.id,
      title: taxSub.name,
      shortTitle: taxSub.shortName,
      iconName: taxSub.iconName,
      accentColor: taxSub.accentColor,
      lightBg: taxSub.lightBg,
      weightageInGS1: subjectWeightage,
      totalQuestions10Yrs: subTotal,
      masteredPercent: 0,
      paper: taxSub.paper === 'GS1' ? 'GS1' : 'GS2',
      chapters,
    };
  }

  const gs1Subjects = UPSC_PRELIMS_TAXONOMY.filter((s) => s.paper === 'GS1').map(buildSubjectModel);
  const csatSubjects = UPSC_PRELIMS_TAXONOMY.filter((s) => s.paper === 'CSAT').map(buildSubjectModel);

  return {
    allPyqs,
    allQuestionRecords,
    gs1Subjects,
    csatSubjects,
  };
}

const REPO = buildRepository();

export const ALL_CLASSIFIED_PYQS: PYQQuestion[] = REPO.allPyqs;
export const ALL_QUESTION_RECORDS: QuestionRecord[] = REPO.allQuestionRecords;
export const CANONICAL_GS1_SUBJECTS: Subject[] = REPO.gs1Subjects;
export const CANONICAL_CSAT_SUBJECTS: Subject[] = REPO.csatSubjects;
export const CANONICAL_ALL_SUBJECTS: Subject[] = [
  ...CANONICAL_GS1_SUBJECTS,
  ...CANONICAL_CSAT_SUBJECTS,
];

export interface QuestionBankFilterParams {
  paper?: 'ALL' | 'GS1' | 'GS2' | 'CSAT';
  subjectId?: string | 'all';
  topicId?: string | 'all';
  subtopicId?: string | 'all';
  year?: number | 'all';
  difficulty?: DifficultyLevel | 'all';
  confidenceBand?: ConfidenceBand | 'all';
  onlyNeedsReview?: boolean;
  searchQuery?: string;
}

/**
 * Fast, deterministic filter & search across all 1,820 classified UPSC Prelims questions.
 */
export function queryQuestionBank(params: QuestionBankFilterParams): PYQQuestion[] {
  const {
    paper = 'ALL',
    subjectId = 'all',
    topicId = 'all',
    subtopicId = 'all',
    year = 'all',
    difficulty = 'all',
    confidenceBand = 'all',
    onlyNeedsReview = false,
    searchQuery = '',
  } = params;

  const normalizedSubjectId =
    subjectId !== 'all' ? SUBJECT_LEGACY_ALIAS_MAP[subjectId] || subjectId : 'all';
  const qLower = searchQuery.trim().toLowerCase();

  return ALL_CLASSIFIED_PYQS.filter((q) => {
    if (paper === 'GS1' && q.paper !== 'GS1') return false;
    if ((paper === 'GS2' || paper === 'CSAT') && q.paper !== 'GS2') return false;

    if (normalizedSubjectId !== 'all' && q.subjectId !== normalizedSubjectId) {
      return false;
    }

    if (topicId !== 'all' && q.chapterId !== topicId) {
      return false;
    }

    if (subtopicId !== 'all' && q.subtopicId !== subtopicId) {
      return false;
    }

    if (year !== 'all' && q.year !== year) {
      return false;
    }

    if (difficulty !== 'all' && q.difficulty !== difficulty) {
      return false;
    }

    if (confidenceBand !== 'all' && q.confidenceBand !== confidenceBand) {
      return false;
    }

    if (onlyNeedsReview && q.validationStatus !== 'needs_review' && q.confidenceBand === 'High') {
      return false;
    }

    if (qLower.length > 0) {
      const inQuestion = q.questionText.toLowerCase().includes(qLower);
      const inTopic = q.chapterName.toLowerCase().includes(qLower);
      const inSubtopic = (q.subtopicName || '').toLowerCase().includes(qLower);
      const inSubject = (q.subjectName || '').toLowerCase().includes(qLower);
      const inRawTopic = (q.rawTopic || '').toLowerCase().includes(qLower);
      const inOptions = q.options.some((o) => o.text.toLowerCase().includes(qLower));
      const inTags = q.tags.some((t) => t.toLowerCase().includes(qLower));
      if (!inQuestion && !inTopic && !inSubtopic && !inSubject && !inRawTopic && !inOptions && !inTags) {
        return false;
      }
    }

    return true;
  });
}

export function getAvailableYearsForFilter(paper: 'ALL' | 'GS1' | 'GS2' = 'ALL'): number[] {
  const years = new Set<number>();
  for (const q of ALL_CLASSIFIED_PYQS) {
    if (paper === 'ALL' || q.paper === paper) {
      years.add(q.year);
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

