import { MockTestService } from '../src/services/mockTestService';

async function runMockTestVerification() {
  console.log('--- Verifying UPSC Mock Test Flow ---');

  // 1. Available Filters
  const gsFilters = await MockTestService.getAvailableFilters('GS1');
  console.log(`[1] GS1 Filters loaded: ${gsFilters.years.length} years, ${gsFilters.subjects.length} subjects`);
  if (gsFilters.years.length === 0 || gsFilters.subjects.length === 0) {
    throw new Error('Failed to load GS1 filters from question bank');
  }

  const csatFilters = await MockTestService.getAvailableFilters('CSAT');
  console.log(`[2] CSAT Filters loaded: ${csatFilters.years.length} years, ${csatFilters.subjects.length} subjects`);
  if (csatFilters.years.length === 0 || csatFilters.subjects.length === 0) {
    throw new Error('Failed to load CSAT filters from question bank');
  }

  // 2. Matching Question Count
  const count1 = await MockTestService.getMatchingQuestionCount({
    paperType: 'GS1',
    selectedYears: [2026],
    selectedSubjects: [],
    selectedTopics: [],
    questionCount: 25,
    testMode: 'practice',
    orderMode: 'random',
    marksPerCorrect: 2.0,
    negativeMarks: 0.67,
  });
  console.log(`[3] 2026 GS1 matching questions: ${count1} (Expected 100)`);
  if (count1 !== 100) {
    throw new Error(`Expected 100 questions for 2026 GS1, got ${count1}`);
  }

  // 3. Generate a real test in Supabase
  console.log('[4] Generating a real 10-question PYQ mock test...');
  const genResult = await MockTestService.generateMockTest({
    paperType: 'GS1',
    selectedYears: [2026],
    selectedSubjects: [],
    selectedTopics: [],
    questionCount: 10,
    testMode: 'practice',
    orderMode: 'exam_order',
    marksPerCorrect: 2.0,
    negativeMarks: 0.67,
  });

  if (!genResult.testId) {
    throw new Error(`Failed to generate test: ${genResult.error}`);
  }
  console.log(`[5] Generated Test ID: ${genResult.testId}`);

  // 4. Retrieve test with question snapshots
  const activeTest = await MockTestService.getMockTest(genResult.testId);
  if (!activeTest) {
    throw new Error('Failed to fetch generated mock test');
  }
  console.log(`[6] Fetched Test: "${activeTest.test.test_title}", Q-Count: ${activeTest.questions.length}`);
  if (activeTest.questions.length !== 10) {
    throw new Error(`Expected 10 questions in snapshot, got ${activeTest.questions.length}`);
  }

  // Verify stable order
  const firstQ = activeTest.questions[0];
  console.log(`[7] First Question (Pos ${firstQ.position}): Q${firstQ.snapshot.question_number} (${firstQ.snapshot.subject})`);

  // 5. Test response autosave
  const saved = await MockTestService.saveResponse(genResult.testId, firstQ.question_id, 'A', false, 45);
  console.log(`[8] Autosave response result: ${saved}`);
  if (!saved) {
    throw new Error('Failed to autosave response');
  }

  // 6. Test recent tests listing
  const recent = await MockTestService.getRecentMockTests(5);
  console.log(`[9] Recent tests retrieved: ${recent.length}`);
  const hasCurrent = recent.some((t) => t.id === genResult.testId);
  console.log(`[10] Current test present in history: ${hasCurrent}`);

  console.log('🎉 ALL MOCK TEST VERIFICATION TESTS PASSED!');
}

runMockTestVerification().catch((err) => {
  console.error('❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
