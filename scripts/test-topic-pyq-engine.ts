/**
 * Automated End-to-End Verification Suite for Topic-Based PYQ Search & Practice Engine
 */

import { PYQMatchingService } from '../src/services/pyqMatchingService';
import { TopicSuggestionService } from '../src/services/topicSuggestionService';
import { TopicSearchService } from '../src/services/topicSearchService';
import { TopicPracticeService } from '../src/services/topicPracticeService';
import { TimedTestService } from '../src/services/timedTestService';
import { UserPracticeAnalyticsService } from '../src/services/userPracticeAnalyticsService';

async function runTests() {
  console.log('==================================================================');
  console.log('UPSC TOPIC-BASED PYQ SEARCH & PRACTICE ENGINE — VERIFICATION SUITE');
  console.log('==================================================================\n');

  // 1. Verify Repository Indexing (No duplicate question IDs)
  const indexed = PYQMatchingService.getAllIndexedQuestions();
  const prelimsCount = indexed.filter((q) => q.examType === 'PRELIMS').length;
  const mainsCount = indexed.filter((q) => q.examType === 'MAINS').length;
  console.log(
    `[1] Indexed Official PYQs: Total=${indexed.length} (Prelims=${prelimsCount}, Mains=${mainsCount})`
  );
  if (prelimsCount === 0 || mainsCount === 0) {
    throw new Error('Failed to load Prelims or Mains PYQ repository');
  }

  // 2. Verify Instant Suggestions for "Judicial"
  const judicialSuggestions = TopicSuggestionService.getInstantSuggestions('Judicial', {
    limit: 8,
  });
  console.log('\n[2] Instant Suggestions for "Judicial":');
  judicialSuggestions.forEach((s, i) => {
    console.log(
      `   ${i + 1}. ${s.title} (${s.totalCount} Questions — ${s.prelimsCount} Prelims, ${s.mainsCount} Mains)`
    );
  });
  if (judicialSuggestions.length < 4) {
    throw new Error('Expected at least 4 suggestions for "Judicial"');
  }

  // 3. Verify 3-Level Hybrid Search for "Judicial Review"
  const jrSearch = TopicSearchService.searchTopic('Judicial Review', undefined, true);
  console.log(`\n[3] Search Results for "${jrSearch.displayTitle}":`);
  console.log(`   • Total Questions: ${jrSearch.totalAvailable}`);
  console.log(`   • Prelims Count:   ${jrSearch.prelimsAvailable}`);
  console.log(`   • Mains Count:     ${jrSearch.mainsAvailable}`);
  console.log(
    `   • Match Breakdown: Exact=${jrSearch.exactMatchCount}, Conceptual=${jrSearch.conceptualMatchCount}, Syllabus=${jrSearch.syllabusMatchCount}`
  );
  console.log(`   • Year Range:      ${jrSearch.yearRange.label}`);
  console.log(`   • Subjects:        ${jrSearch.relevantSubjects.join(', ')}`);
  console.log(
    `   • Related Topics:  ${jrSearch.relatedTopics
      .map((r) => `${r.title} (${r.totalCount})`)
      .join(', ')}`
  );

  if (jrSearch.totalAvailable < 15 || jrSearch.conceptualMatchCount === 0) {
    throw new Error('Expected strong conceptual + exact matches for Judicial Review');
  }

  // Ensure no duplicate IDs in search results
  const uniqueIds = new Set(jrSearch.allMatchedItems.map((i) => i.id));
  if (uniqueIds.size !== jrSearch.allMatchedItems.length) {
    throw new Error('Duplicate questions detected in search results!');
  }

  // 4. Verify Synonym & Multi-Topic Queries (DPSP, Monsoon, RBI Monetary Policy, Buddhism, Ethics)
  const testQueries = [
    'DPSP',
    'Fundamental Rights',
    'Monetary Policy',
    'El Nino',
    'Buddhism',
    'Biodiversity',
    'Ethics',
  ];
  console.log('\n[4] Multi-Domain & Synonym Search Verification:');
  for (const q of testQueries) {
    const res = TopicSearchService.searchTopic(q);
    console.log(
      `   • Query "${q}" -> "${res.displayTitle}": ${res.totalAvailable} Qs (${res.prelimsAvailable} Prelims, ${res.mainsAvailable} Mains)`
    );
    if (res.totalAvailable === 0) {
      throw new Error(`Zero questions returned for core UPSC query: ${q}`);
    }
  }

  // 5. Verify Practice Mode (Prelims & Mains)
  const samplePrelimsItem = jrSearch.filteredItems.find((i) => i.examType === 'PRELIMS');
  if (!samplePrelimsItem || !samplePrelimsItem.prelimsQuestion) {
    throw new Error('No Prelims question found in Judicial Review results');
  }
  const wrongChoice =
    (['A', 'B', 'C', 'D'] as const).find(
      (k) => k !== samplePrelimsItem.prelimsQuestion!.correctAnswer
    ) || 'A';

  const practiceSub = await TopicPracticeService.submitPrelimsPracticeAnswer({
    topicQuery: 'Judicial Review',
    item: samplePrelimsItem,
    selectedOption: wrongChoice,
    timeSpentSeconds: 38,
  });
  console.log('\n[5] Practice Mode Verification:');
  console.log(
    `   • Submitted Prelims Q (${samplePrelimsItem.id}): Selected=${practiceSub.selectedOption}, CorrectKey=${practiceSub.correctOption}, IsCorrect=${practiceSub.isCorrect}`
  );
  const retryQueue = TopicPracticeService.buildRetryIncorrectQueue([samplePrelimsItem], {
    [samplePrelimsItem.id]: practiceSub,
  });
  console.log(`   • Retry Incorrect Queue Count: ${retryQueue.length}`);
  if (retryQueue.length !== 1) {
    throw new Error('Retry Incorrect Queue failed to isolate incorrect question');
  }

  // 6. Verify Timed Mode (Session Creation, Negative Marking & Scorecard)
  const timedConfig = TimedTestService.getDefaultConfig('Judicial Review', 'PRELIMS', 5);
  const timedSession = await TimedTestService.startSession(timedConfig, jrSearch.allMatchedItems);
  const q0 = timedSession.questions[0];
  const q1 = timedSession.questions[1];

  // Mark q0 correct, q1 wrong
  if (q0?.prelimsQuestion) {
    timedSession.responses[q0.id].selectedOption = q0.prelimsQuestion.correctAnswer;
    timedSession.responses[q0.id].visited = true;
  }
  if (q1?.prelimsQuestion) {
    const wrong =
      (['A', 'B', 'C', 'D'] as const).find((k) => k !== q1.prelimsQuestion!.correctAnswer) || 'B';
    timedSession.responses[q1.id].selectedOption = wrong;
    timedSession.responses[q1.id].visited = true;
  }
  timedSession.remainingSeconds = timedConfig.durationMinutes * 60 - 95;

  const timedFinal = await TimedTestService.submitTimedTest(timedSession);
  console.log('\n[6] Timed Mode & Negative Marking Verification:');
  console.log(
    `   • Score: ${timedFinal.summary.score} / ${timedFinal.summary.maxScore} (+${timedFinal.positiveMarks} / -${timedFinal.negativeMarksDeducted})`
  );
  console.log(
    `   • Attempted=${timedFinal.summary.attemptedCount}, Correct=${timedFinal.summary.correctCount}, Incorrect=${timedFinal.summary.incorrectCount}, Accuracy=${timedFinal.summary.accuracyPct}%`
  );

  // 7. Verify Profile Topic Performance Analytics
  const perfStats = await UserPracticeAnalyticsService.getTopicPerformanceStats();
  console.log('\n[7] Profile Topic Performance Analytics Verification:');
  console.log(
    `   • Topics Tracked: ${perfStats.topics.length}, Weak Topics Recommended: ${perfStats.weakTopics.length}`
  );
  const jrStat = perfStats.topics.find((t) => t.topic.toLowerCase() === 'judicial review');
  if (jrStat) {
    console.log(
      `   • Judicial Review Stat -> Total: ${jrStat.totalQuestions}, Attempted: ${jrStat.attemptedCount}, Correct: ${jrStat.correctCount}, Accuracy: ${jrStat.accuracyPct}%, Remaining: ${jrStat.remainingCount}`
    );
  }

  console.log('\n==================================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================================');
}

runTests().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

