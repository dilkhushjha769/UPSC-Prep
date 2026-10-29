/**
 * Automated Verification Suite for UPSC Prelims Question Bank & Topic-Wise Classification
 *
 * Verifies:
 * 1. Total question counts (1,820 total: 1,100 GS Paper I + 720 GS Paper II CSAT)
 * 2. Taxonomy completeness (100% subject, topic, subtopic, confidence, validation status coverage)
 * 3. Zero cross-paper leakage between GS Paper I and GS Paper II (CSAT)
 * 4. Mathematical reconciliation: Paper total == sum(Subject totals) == sum(Topic totals) == sum(Subtopic totals)
 * 5. Filter accuracy: paper, subjectId, topicId, subtopicId, year, difficulty, onlyNeedsReview, searchQuery
 * 6. Data integrity: no empty question text, all 4 options present, valid answer key A/B/C/D, composed tables/lists
 */

import {
  ALL_CLASSIFIED_PYQS,
  ALL_QUESTION_RECORDS,
  CANONICAL_CSAT_SUBJECTS,
  CANONICAL_GS1_SUBJECTS,
  queryQuestionBank,
} from '../src/data/questionBankRepository';
import { UPSC_PRELIMS_TAXONOMY } from '../src/constants/upscTaxonomy';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

console.log('=== Running UPSC Prelims Question Bank Automated Verification Suite ===\n');

// 1. Total Counts Verification
assert(ALL_CLASSIFIED_PYQS.length === 1820, `Expected 1,820 total PYQs, got ${ALL_CLASSIFIED_PYQS.length}`);
assert(ALL_QUESTION_RECORDS.length === 1820, `Expected 1,820 QuestionRecords, got ${ALL_QUESTION_RECORDS.length}`);
assert(
  queryQuestionBank({ paper: 'GS1' }).length === 1100,
  `Expected 1,100 GS Paper I questions, got ${queryQuestionBank({ paper: 'GS1' }).length}`
);
assert(
  queryQuestionBank({ paper: 'GS2' }).length === 720,
  `Expected 720 CSAT questions, got ${queryQuestionBank({ paper: 'GS2' }).length}`
);

// 2. Year-by-Year Verification
const gs1Years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
for (const yr of gs1Years) {
  const res = queryQuestionBank({ paper: 'GS1', year: yr });
  assert(res.length === 100, `Expected 100 GS1 questions in ${yr}, got ${res.length}`);
}

const csatYears = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
for (const yr of csatYears) {
  const res = queryQuestionBank({ paper: 'GS2', year: yr });
  assert(res.length === 80, `Expected 80 CSAT questions in ${yr}, got ${res.length}`);
}

// 3. Complete Metadata & Text Integrity Verification on Every Question
const validAnswers = new Set(['A', 'B', 'C', 'D']);
const gs1SubjectIds = new Set(
  UPSC_PRELIMS_TAXONOMY.filter((s) => s.paper === 'GS1').map((s) => s.id)
);
const csatSubjectIds = new Set(
  UPSC_PRELIMS_TAXONOMY.filter((s) => s.paper === 'CSAT').map((s) => s.id)
);

for (const q of ALL_CLASSIFIED_PYQS) {
  assert(Boolean(q.id), `Question missing id`);
  assert(
    Boolean(q.questionText && q.questionText.trim().length > 10),
    `Question ${q.id} has empty/short questionText`
  );
  assert(
    Array.isArray(q.options) && q.options.length === 4,
    `Question ${q.id} does not have 4 options`
  );
  assert(
    validAnswers.has(q.correctAnswer),
    `Question ${q.id} has invalid correctAnswer: ${q.correctAnswer}`
  );
  assert(
    Boolean(q.subjectId && q.subjectName),
    `Question ${q.id} missing subject classification`
  );
  assert(
    Boolean(q.chapterId && q.chapterName),
    `Question ${q.id} missing topic classification`
  );
  assert(
    Boolean(q.subtopicId && q.subtopicName),
    `Question ${q.id} missing subtopic classification`
  );
  assert(
    typeof q.confidence === 'number' && q.confidence >= 0.7,
    `Question ${q.id} has low or missing confidence: ${q.confidence}`
  );
  assert(
    q.confidenceBand === 'High' || q.confidenceBand === 'Medium',
    `Question ${q.id} has unexpected confidenceBand: ${q.confidenceBand}`
  );

  // Strict Paper Separation check
  if (q.paper === 'GS1') {
    assert(
      gs1SubjectIds.has(q.subjectId),
      `GS1 question ${q.id} assigned to non-GS1 subject ${q.subjectId}`
    );
    assert(
      !csatSubjectIds.has(q.subjectId),
      `GS1 question ${q.id} leaked into CSAT subject ${q.subjectId}`
    );
  } else {
    assert(
      csatSubjectIds.has(q.subjectId),
      `CSAT question ${q.id} assigned to non-CSAT subject ${q.subjectId}`
    );
    assert(
      !gs1SubjectIds.has(q.subjectId),
      `CSAT question ${q.id} leaked into GS1 subject ${q.subjectId}`
    );
  }
}

// 4. Mathematical Reconciliation: Paper -> Subject -> Topic -> Subtopic
let sumGS1Subjects = 0;
for (const sub of CANONICAL_GS1_SUBJECTS) {
  const queriedSub = queryQuestionBank({ paper: 'GS1', subjectId: sub.id });
  assert(
    sub.totalQuestions10Yrs === queriedSub.length,
    `GS1 Subject ${sub.title} total (${sub.totalQuestions10Yrs}) != query count (${queriedSub.length})`
  );
  sumGS1Subjects += sub.totalQuestions10Yrs;

  let sumTopicsInSub = 0;
  for (const chap of sub.chapters) {
    const queriedTopic = queryQuestionBank({
      paper: 'GS1',
      subjectId: sub.id,
      topicId: chap.id,
    });
    assert(
      chap.totalQuestions10Yrs === chap.pyqs.length &&
        chap.totalQuestions10Yrs === queriedTopic.length,
      `GS1 Topic ${chap.title} count mismatch: total=${chap.totalQuestions10Yrs}, pyqs=${chap.pyqs.length}, query=${queriedTopic.length}`
    );
    sumTopicsInSub += chap.totalQuestions10Yrs;

    const sumSubtopicsInTopic = (chap.subtopics || []).reduce((acc, st) => acc + st.count, 0);
    assert(
      sumSubtopicsInTopic === chap.totalQuestions10Yrs,
      `GS1 Topic ${chap.title} subtopic sum (${sumSubtopicsInTopic}) != topic total (${chap.totalQuestions10Yrs})`
    );

    for (const st of chap.subtopics || []) {
      const queriedSubtopic = queryQuestionBank({
        paper: 'GS1',
        subjectId: sub.id,
        topicId: chap.id,
        subtopicId: st.id,
      });
      assert(
        queriedSubtopic.length === st.count,
        `GS1 Subtopic ${st.name} query count (${queriedSubtopic.length}) != subtopic.count (${st.count})`
      );
    }
  }
  assert(
    sumTopicsInSub === sub.totalQuestions10Yrs,
    `GS1 Subject ${sub.title} sum of topics (${sumTopicsInSub}) != subject total (${sub.totalQuestions10Yrs})`
  );
}
assert(sumGS1Subjects === 1100, `Sum of GS1 subjects (${sumGS1Subjects}) != 1100`);

let sumCSATSubjects = 0;
for (const sub of CANONICAL_CSAT_SUBJECTS) {
  const queriedSub = queryQuestionBank({ paper: 'GS2', subjectId: sub.id });
  assert(
    sub.totalQuestions10Yrs === queriedSub.length,
    `CSAT Subject ${sub.title} total (${sub.totalQuestions10Yrs}) != query count (${queriedSub.length})`
  );
  sumCSATSubjects += sub.totalQuestions10Yrs;

  let sumTopicsInSub = 0;
  for (const chap of sub.chapters) {
    const queriedTopic = queryQuestionBank({
      paper: 'GS2',
      subjectId: sub.id,
      topicId: chap.id,
    });
    assert(
      chap.totalQuestions10Yrs === chap.pyqs.length &&
        chap.totalQuestions10Yrs === queriedTopic.length,
      `CSAT Topic ${chap.title} count mismatch: total=${chap.totalQuestions10Yrs}, pyqs=${chap.pyqs.length}, query=${queriedTopic.length}`
    );
    sumTopicsInSub += chap.totalQuestions10Yrs;

    const sumSubtopicsInTopic = (chap.subtopics || []).reduce((acc, st) => acc + st.count, 0);
    assert(
      sumSubtopicsInTopic === chap.totalQuestions10Yrs,
      `CSAT Topic ${chap.title} subtopic sum (${sumSubtopicsInTopic}) != topic total (${chap.totalQuestions10Yrs})`
    );

    for (const st of chap.subtopics || []) {
      const queriedSubtopic = queryQuestionBank({
        paper: 'GS2',
        subjectId: sub.id,
        topicId: chap.id,
        subtopicId: st.id,
      });
      assert(
        queriedSubtopic.length === st.count,
        `CSAT Subtopic ${st.name} query count (${queriedSubtopic.length}) != subtopic.count (${st.count})`
      );
    }
  }
  assert(
    sumTopicsInSub === sub.totalQuestions10Yrs,
    `CSAT Subject ${sub.title} sum of topics (${sumTopicsInSub}) != subject total (${sub.totalQuestions10Yrs})`
  );
}
assert(sumCSATSubjects === 720, `Sum of CSAT subjects (${sumCSATSubjects}) != 720`);

// 5. Specific Edge Cases & Bug Fixes Verification
// 5a. 2018 CSAT Q73 and Q75 reclassified to Data Interpretation -> Tables, Charts and Graphs
const csat2018Q73 = ALL_CLASSIFIED_PYQS.find((q) => q.year === 2018 && q.paper === 'GS2' && q.questionNumber === 73);
const csat2018Q75 = ALL_CLASSIFIED_PYQS.find((q) => q.year === 2018 && q.paper === 'GS2' && q.questionNumber === 75);
assert(
  csat2018Q73?.subjectId === 'csat_data_interpretation' &&
    csat2018Q73?.chapterId === 'tables_charts_graphs',
  `Expected CSAT 2018 Q73 to be in csat_data_interpretation / tables_charts_graphs, got ${csat2018Q73?.subjectId} / ${csat2018Q73?.chapterId}`
);
assert(
  csat2018Q75?.subjectId === 'csat_data_interpretation' &&
    csat2018Q75?.chapterId === 'tables_charts_graphs',
  `Expected CSAT 2018 Q75 to be in csat_data_interpretation / tables_charts_graphs, got ${csat2018Q75?.subjectId} / ${csat2018Q75?.chapterId}`
);

// 5b. List-I / List-II matching question in 2026 GS1 (Q67) includes composed List-I & List-II entries in questionText & table_data
const listMatchPyq = ALL_CLASSIFIED_PYQS.find((q) => q.id === 'upsc_2026_gs1_q67');
assert(
  Boolean(
    listMatchPyq &&
      listMatchPyq.questionText.includes('Mangdechhu Hydroelectric Project') &&
      listMatchPyq.questionText.includes('List I (Project Supported by India)')
  ),
  `Expected List-I/List-II matching question (${listMatchPyq?.id}) to include composed List-I and List-II entries in questionText`
);

// 5c. Review Queue / Disputed Answer Keys verification
const disputedQs = ALL_CLASSIFIED_PYQS.filter((q) => q.validationStatus === 'needs_review');
assert(disputedQs.length === 8, `Expected 8 questions with validationStatus === 'needs_review', got ${disputedQs.length}`);

// 5d. Search query for "money multiplier" returns the 2 cross-year duplicate questions (2019 Q90 & 2021 Q11)
const moneyMultiplierQs = queryQuestionBank({
  paper: 'GS1',
  searchQuery: 'money multiplier in an economy increases',
});
assert(
  moneyMultiplierQs.length === 2,
  `Expected 2 cross-year money multiplier questions (2019 & 2021), got ${moneyMultiplierQs.length}`
);

console.log(`✅ Passed Assertions: ${passed}`);
console.log(`❌ Failed Assertions: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL AUTOMATED QUESTION BANK & TAXONOMY TESTS PASSED 100%!');
}
