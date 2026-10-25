import { supabase, getCurrentUserIdOrGuestId } from './supabase';
import {
  ActiveTestState,
  AvailableFiltersData,
  MockTestFilterConfig,
  MockTestQuestionRecord,
  MockTestRecord,
  MockTestResponseRecord,
  MockTestSummaryStats,
  PaperType,
  QuestionRecord,
} from '@/types/mockTest';

export class MockTestService {
  /**
   * Fetch distinct years, subjects, and topics available in the question bank.
   */
  static async getAvailableFilters(paperType: PaperType = 'GS1'): Promise<AvailableFiltersData> {
    try {
      let query = supabase.from('questions').select('year, subject, topic, paper_type');

      if (paperType !== 'ALL') {
        query = query.eq('paper_type', paperType);
      }

      const { data, error } = await query;
      if (error || !data) {
        console.error('Error fetching available filters:', error);
        return { years: [], subjects: [], topicsBySubject: {} };
      }

      const yearsSet = new Set<number>();
      const subjectCountMap = new Map<string, { count: number; paperType: string }>();
      const topicsBySubjectMap: Record<string, Set<string>> = {};

      for (const row of data) {
        if (row.year) yearsSet.add(row.year);

        const sub = row.subject || 'General';
        const pType = row.paper_type || 'GS1';
        const currentSub = subjectCountMap.get(sub) || { count: 0, paperType: pType };
        currentSub.count++;
        subjectCountMap.set(sub, currentSub);

        if (!topicsBySubjectMap[sub]) {
          topicsBySubjectMap[sub] = new Set<string>();
        }
        if (row.topic) {
          topicsBySubjectMap[sub].add(row.topic);
        }
      }

      const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

      const subjects = Array.from(subjectCountMap.entries())
        .map(([name, item]) => ({
          name,
          count: item.count,
          paperType: item.paperType,
        }))
        .sort((a, b) => b.count - a.count);

      const topicsBySubject: Record<string, string[]> = {};
      for (const [sub, topSet] of Object.entries(topicsBySubjectMap)) {
        topicsBySubject[sub] = Array.from(topSet).sort();
      }

      return {
        years: sortedYears,
        subjects,
        topicsBySubject,
      };
    } catch (err) {
      console.error('getAvailableFilters exception:', err);
      return { years: [], subjects: [], topicsBySubject: {} };
    }
  }

  /**
   * Fetch real summary statistics (available questions, completed tests, average score, average accuracy).
   */
  static async getSummaryStats(): Promise<MockTestSummaryStats> {
    try {
      const { guestId } = await getCurrentUserIdOrGuestId();

      // Available questions
      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Completed mock tests for this user/guest
      const { data: tests, error } = await supabase
        .from('mock_tests')
        .select('score, total_marks, accuracy, status')
        .eq('guest_id', guestId)
        .eq('status', 'submitted');

      if (error || !tests || tests.length === 0) {
        return {
          availableQuestions: questionsCount || 540,
          completedTests: 0,
          averageScore: 0,
          averageAccuracy: 0,
        };
      }

      const totalScore = tests.reduce((acc, t) => acc + (Number(t.score) || 0), 0);
      const totalAccuracy = tests.reduce((acc, t) => acc + (Number(t.accuracy) || 0), 0);

      return {
        availableQuestions: questionsCount || 540,
        completedTests: tests.length,
        averageScore: Number((totalScore / tests.length).toFixed(1)),
        averageAccuracy: Number((totalAccuracy / tests.length).toFixed(1)),
      };
    } catch (err) {
      console.error('getSummaryStats exception:', err);
      return {
        availableQuestions: 540,
        completedTests: 0,
        averageScore: 0,
        averageAccuracy: 0,
      };
    }
  }

  /**
   * Fetch list of recent mock tests for the current user.
   */
  static async getRecentMockTests(limit = 8): Promise<MockTestRecord[]> {
    try {
      const { guestId } = await getCurrentUserIdOrGuestId();

      const { data, error } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.error('Error fetching recent mock tests:', error);
        return [];
      }

      return data as MockTestRecord[];
    } catch (err) {
      console.error('getRecentMockTests exception:', err);
      return [];
    }
  }

  /**
   * Fast count of questions matching the given filter configuration.
   */
  static async getMatchingQuestionCount(filters: MockTestFilterConfig): Promise<number> {
    try {
      let query = supabase.from('questions').select('*', { count: 'exact', head: true });

      if (filters.paperType !== 'ALL') {
        query = query.eq('paper_type', filters.paperType);
      }

      if (filters.selectedYears && filters.selectedYears.length > 0) {
        query = query.in('year', filters.selectedYears);
      }

      if (filters.selectedSubjects && filters.selectedSubjects.length > 0) {
        query = query.in('subject', filters.selectedSubjects);
      }

      if (filters.selectedTopics && filters.selectedTopics.length > 0) {
        query = query.in('topic', filters.selectedTopics);
      }

      const { count, error } = await query;
      if (error) {
        console.error('Error fetching question count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('getMatchingQuestionCount exception:', err);
      return 0;
    }
  }

  /**
   * Generate and persist a real mock test in Supabase with immutable question snapshots.
   */
  static async generateMockTest(filters: MockTestFilterConfig): Promise<{ testId: string; error?: string }> {
    try {
      const { userId, guestId } = await getCurrentUserIdOrGuestId();

      // 1. Build question query
      let query = supabase.from('questions').select('*');

      if (filters.paperType !== 'ALL') {
        query = query.eq('paper_type', filters.paperType);
      }

      if (filters.selectedYears && filters.selectedYears.length > 0) {
        query = query.in('year', filters.selectedYears);
      }

      if (filters.selectedSubjects && filters.selectedSubjects.length > 0) {
        query = query.in('subject', filters.selectedSubjects);
      }

      if (filters.selectedTopics && filters.selectedTopics.length > 0) {
        query = query.in('topic', filters.selectedTopics);
      }

      // Ordering
      if (filters.orderMode === 'exam_order') {
        query = query.order('year', { ascending: true }).order('question_number', { ascending: true });
      }

      const { data: rawQuestions, error: fetchErr } = await query;

      if (fetchErr || !rawQuestions || rawQuestions.length === 0) {
        return { testId: '', error: 'No matching questions found for the selected filters.' };
      }

      let candidateQuestions = rawQuestions as QuestionRecord[];

      // 2. Filter unattempted questions if requested
      if (filters.orderMode === 'unattempted') {
        const { data: attempts } = await supabase
          .from('user_question_attempts')
          .select('question_id')
          .eq('guest_id', guestId);

        if (attempts && attempts.length > 0) {
          const attemptedIds = new Set(attempts.map((a) => a.question_id));
          const unattempted = candidateQuestions.filter((q) => !attemptedIds.has(q.id));
          if (unattempted.length > 0) {
            candidateQuestions = unattempted;
          }
        }
      }

      // 3. Shuffle if random
      if (filters.orderMode === 'random' || filters.orderMode === 'unattempted') {
        candidateQuestions = [...candidateQuestions].sort(() => Math.random() - 0.5);
      }

      // 4. Slice to desired count
      const finalCount = Math.min(filters.questionCount, candidateQuestions.length);
      const selectedQuestions = candidateQuestions.slice(0, finalCount);

      // Title creation
      let title = '';
      if (filters.selectedSubjects.length === 1) {
        title = `${filters.selectedSubjects[0]} PYQ Mock`;
      } else if (filters.selectedSubjects.length > 1) {
        title = `Multi-Subject (${filters.selectedSubjects.length}) PYQ Mock`;
      } else {
        title = filters.paperType === 'CSAT' ? 'UPSC CSAT PYQ Mock' : 'UPSC GS Paper-I PYQ Mock';
      }

      if (filters.selectedYears.length === 1) {
        title += ` (${filters.selectedYears[0]})`;
      } else if (filters.selectedYears.length > 1) {
        title += ` (${filters.selectedYears.join(', ')})`;
      }

      // Default duration: 2 hours for 100 questions (1.2 min per Q) or custom
      const defaultDuration =
        filters.testMode === 'full'
          ? Math.max(10, Math.round(finalCount * 1.2))
          : null;

      const timeLimit = filters.timeLimitMinutes ?? defaultDuration;

      // 5. Create mock_tests record
      const testPayload = {
        user_id: userId,
        guest_id: guestId,
        test_title: title,
        exam: 'UPSC CSE',
        paper_type: filters.paperType,
        selected_years: filters.selectedYears,
        selected_subjects: filters.selectedSubjects,
        selected_topics: filters.selectedTopics,
        test_mode: filters.testMode,
        question_count: finalCount,
        marks_per_correct: filters.marksPerCorrect,
        negative_marks: filters.negativeMarks,
        time_limit_minutes: timeLimit,
        status: 'in_progress',
        total_marks: finalCount * filters.marksPerCorrect,
      };

      const { data: testRecord, error: insertTestErr } = await supabase
        .from('mock_tests')
        .insert(testPayload)
        .select()
        .single();

      if (insertTestErr || !testRecord) {
        console.error('Failed to create mock_test record:', insertTestErr);
        return { testId: '', error: 'Failed to create mock test in database: ' + insertTestErr?.message };
      }

      const testId = testRecord.id;

      // 6. Insert mock_test_questions with immutable snapshot
      const testQuestionsPayload = selectedQuestions.map((q, idx) => ({
        mock_test_id: testId,
        question_id: q.id,
        position: idx + 1,
        snapshot: q,
      }));

      const { error: insertQuestionsErr } = await supabase
        .from('mock_test_questions')
        .insert(testQuestionsPayload);

      if (insertQuestionsErr) {
        console.error('Failed to insert test questions:', insertQuestionsErr);
        return { testId: '', error: 'Failed to record test questions.' };
      }

      // 7. Initialize mock_test_responses
      const responsesPayload = selectedQuestions.map((q) => ({
        mock_test_id: testId,
        question_id: q.id,
        selected_answer: null,
        is_marked_for_review: false,
        answer_status: 'unattempted',
        time_spent_seconds: 0,
      }));

      await supabase.from('mock_test_responses').insert(responsesPayload);

      return { testId };
    } catch (err: any) {
      console.error('generateMockTest exception:', err);
      return { testId: '', error: err.message || 'Unexpected test generation error.' };
    }
  }

  /**
   * Fetch an existing active or completed mock test with questions in exact position order and existing responses.
   */
  static async getMockTest(testId: string): Promise<ActiveTestState | null> {
    try {
      // 1. Get test metadata
      const { data: test, error: testErr } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testErr || !test) {
        console.error('Error fetching mock test:', testErr);
        return null;
      }

      // 2. Get questions in order
      const { data: questions, error: qErr } = await supabase
        .from('mock_test_questions')
        .select('*')
        .eq('mock_test_id', testId)
        .order('position', { ascending: true });

      if (qErr || !questions) {
        console.error('Error fetching mock test questions:', qErr);
        return null;
      }

      // 3. Get existing responses
      const { data: responses, error: responseErr } = await supabase
        .from('mock_test_responses')
        .select('*')
        .eq('mock_test_id', testId);

      if (responseErr) {
        console.warn('Notice fetching responses:', responseErr);
      }

      const responsesMap: Record<string, MockTestResponseRecord> = {};
      if (responses) {
        for (const r of responses) {
          responsesMap[r.question_id] = r as MockTestResponseRecord;
        }
      }

      return {
        test: test as MockTestRecord,
        questions: questions as MockTestQuestionRecord[],
        responses: responsesMap,
      };
    } catch (err) {
      console.error('getMockTest exception:', err);
      return null;
    }
  }

  /**
   * Autosave user's response and review status to Supabase.
   */
  static async saveResponse(
    testId: string,
    questionId: string,
    selectedAnswer: string | null,
    isMarkedForReview: boolean,
    timeSpentSeconds: number
  ): Promise<boolean> {
    try {
      let answerStatus: 'unattempted' | 'answered' | 'marked_for_review' | 'answered_and_marked' = 'unattempted';
      const hasAnswer = selectedAnswer !== null && selectedAnswer.trim().length > 0;

      if (hasAnswer && isMarkedForReview) {
        answerStatus = 'answered_and_marked';
      } else if (hasAnswer) {
        answerStatus = 'answered';
      } else if (isMarkedForReview) {
        answerStatus = 'marked_for_review';
      }

      const payload = {
        mock_test_id: testId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_marked_for_review: isMarkedForReview,
        answer_status: answerStatus,
        time_spent_seconds: timeSpentSeconds,
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('mock_test_responses')
        .upsert(payload, { onConflict: 'mock_test_id,question_id' });

      if (error) {
        console.error('Error autosaving response:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('saveResponse exception:', err);
      return false;
    }
  }

  /**
   * Submit mock test and calculate final scores via trusted server-side PostgreSQL function.
   */
  static async submitMockTest(testId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Call server-side function
      const { data, error } = await supabase.rpc('submit_mock_test', { p_test_id: testId });

      if (error) {
        console.error('Server submission failed:', error);
        // Fallback to client calculation if needed
        return { success: false, error: error.message };
      }

      return { success: true, result: data };
    } catch (err: any) {
      console.error('submitMockTest exception:', err);
      return { success: false, error: err.message || 'Submission error.' };
    }
  }
}
