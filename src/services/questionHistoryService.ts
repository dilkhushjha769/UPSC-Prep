import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUserIdOrGuestId } from './supabase';

const LOCAL_ATTEMPTS_STORAGE_KEY = '@upsc_local_question_attempts_v1';

export type DatePeriodFilter = 'this_week' | 'this_month' | 'select_month';
export type QuestionStatusFilter = 'all' | 'correct' | 'incorrect' | 'unanswered';

export interface QuestionOptionItem {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuestionAttemptItem {
  id: string;
  questionId: string;
  source: 'mock' | 'practice';
  sourceTitle: string;
  questionNumber?: number;
  questionText: string;
  statements?: string[];
  options: QuestionOptionItem[];
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  status: 'correct' | 'incorrect' | 'unanswered';
  timeSpentSeconds: number;
  subject: string;
  topic?: string;
  explanation?: string;
  timestamp: number; // Unix ms
  dateStr: string; // 'YYYY-MM-DD'
  attemptedAtIso: string;
  attemptIndex?: number; // 1, 2, ... if attempted multiple times
}

export interface DailyTrendPoint {
  dateStr: string;
  dayLabel: string;
  dayNumber: number;
  questionsCount: number;
  accuracy: number;
}

export interface PeriodSummaryMetrics {
  questionsSolved: number; // unique answered
  totalAttempts: number;
  accuracy: number;
  avgTimeSeconds: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  trend: DailyTrendPoint[];
}

export interface MonthOption {
  year: number;
  month: number; // 0-indexed (0 = Jan, 9 = Oct)
  label: string; // e.g. "October 2026"
}

// Fallback seed question attempts to guarantee rich first-run experience if database is empty
function generateSeedAttempts(): QuestionAttemptItem[] {
  return [
    {
      id: 'seed-q-csat-1',
      questionId: 'seed-csat-equations-1',
      source: 'practice',
      sourceTitle: 'CSAT Logical Reasoning Practice',
      questionNumber: 1,
      questionText:
        'The weight of X, in kg, is denoted by X. The weights of A, B, C, D, P, Q, R and S are measured. Given: A + B + C + D = 17; A + C = 6; P + Q + S + D = 15; P + Q + R + B = 17; P = R and Q = S. Which one of the following statements is correct?',
      options: [
        { id: 'A', text: 'B and D together weigh less than the total weight of P and Q.' },
        { id: 'B', text: 'P and Q together weigh more than the total weight of A and C.' },
        { id: 'C', text: 'P weighs more than Q.' },
        { id: 'D', text: 'Q weighs more than P.' },
      ],
      selectedAnswer: 'B',
      correctAnswer: 'B',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 6,
      subject: 'Logical Reasoning (Equations)',
      topic: 'Logical Reasoning (Equations)',
      explanation: `1. From the first two equations
A + B + C + D = 17 and A + C = 6
So, B + D = 17 - 6 = 11.

2. Find P + Q
Using P = R and Q = S:
P + Q + S + D = 15  and  P + Q + R + B = 17
Adding, 3P + 3Q + B + D = 32  ⇒  3(P + Q) = 21  ⇒  P + Q = 7.

Conclusion:
B + D = 11 and P + Q = 7, so B + D > P + Q is false and P + Q > A + C = 6.
Therefore, option B is correct.`,
      timestamp: new Date('2026-10-26T09:45:00Z').getTime(),
      dateStr: '2026-10-26',
      attemptedAtIso: '2026-10-26T09:45:00Z',
    },
    {
      id: 'seed-q-1',
      questionId: 'seed-polity-1',
      source: 'practice',
      sourceTitle: 'Polity Daily MCQ Drill',
      questionNumber: 1,
      questionText:
        'Which of the following constitutional amendments incorporated the Fundamental Duties in Part IV-A of the Indian Constitution?',
      options: [
        { id: 'A', text: '42nd Constitutional Amendment Act, 1976' },
        { id: 'B', text: '44th Constitutional Amendment Act, 1978' },
        { id: 'C', text: '86th Constitutional Amendment Act, 2002' },
        { id: 'D', text: '91st Constitutional Amendment Act, 2003' },
      ],
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 42,
      subject: 'Polity & Governance',
      topic: 'Fundamental Duties & Amendments',
      explanation:
        'The 42nd Amendment Act of 1976 added Part IV-A and Article 51A upon recommendation of the Swaran Singh Committee. The 86th Amendment later added the 11th duty.',
      timestamp: new Date('2026-10-28T10:15:00Z').getTime(),
      dateStr: '2026-10-28',
      attemptedAtIso: '2026-10-28T10:15:00Z',
    },
    {
      id: 'seed-q-2',
      questionId: 'seed-history-1',
      source: 'practice',
      sourceTitle: 'Modern History Drill',
      questionNumber: 2,
      questionText:
        'With reference to the Indian freedom struggle, who among the following was known as "Deshbandhu"?',
      options: [
        { id: 'A', text: 'Chittaranjan Das' },
        { id: 'B', text: 'Surendranath Banerjee' },
        { id: 'C', text: 'Gopal Krishna Gokhale' },
        { id: 'D', text: 'Subhash Chandra Bose' },
      ],
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 31,
      subject: 'History & Culture',
      topic: 'Modern Freedom Struggle',
      explanation:
        'Chittaranjan Das was affectionately titled "Deshbandhu" (Friend of the Nation). He co-founded the Swaraj Party alongside Motilal Nehru in 1923.',
      timestamp: new Date('2026-10-28T10:17:00Z').getTime(),
      dateStr: '2026-10-28',
      attemptedAtIso: '2026-10-28T10:17:00Z',
    },
    {
      id: 'seed-q-3',
      questionId: 'seed-geo-1',
      source: 'practice',
      sourceTitle: 'Physical Geography Drill',
      questionNumber: 3,
      questionText:
        'Which one of the following river basins in India covers the second largest drainage area after the Ganges basin?',
      options: [
        { id: 'A', text: 'Godavari Basin' },
        { id: 'B', text: 'Krishna Basin' },
        { id: 'C', text: 'Mahanadi Basin' },
        { id: 'D', text: 'Narmada Basin' },
      ],
      selectedAnswer: 'B',
      correctAnswer: 'A',
      isCorrect: false,
      status: 'incorrect',
      timeSpentSeconds: 58,
      subject: 'Geography',
      topic: 'Drainage Systems of India',
      explanation:
        'The Godavari basin is the second largest river basin in India after the Ganges, covering about 9.5% of the total geographical area of India.',
      timestamp: new Date('2026-10-27T14:30:00Z').getTime(),
      dateStr: '2026-10-27',
      attemptedAtIso: '2026-10-27T14:30:00Z',
    },
    {
      id: 'seed-q-4',
      questionId: 'seed-econ-1',
      source: 'mock',
      sourceTitle: 'UPSC GS Paper-I PYQ Mock',
      questionNumber: 4,
      questionText:
        'Which of the following bodies is responsible for fixing the benchmark policy interest rate (Repo Rate) in India?',
      options: [
        { id: 'A', text: 'Monetary Policy Committee (MPC)' },
        { id: 'B', text: 'RBI Central Board of Directors alone' },
        { id: 'C', text: 'Financial Stability and Development Council (FSDC)' },
        { id: 'D', text: 'Cabinet Committee on Economic Affairs (CCEA)' },
      ],
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 45,
      subject: 'Economy & Development',
      topic: 'Banking & Monetary Policy',
      explanation:
        'The 6-member Monetary Policy Committee (MPC), established under the RBI Act, 1934, is statutory tasked with fixing the benchmark repo rate.',
      timestamp: new Date('2026-10-26T16:20:00Z').getTime(),
      dateStr: '2026-10-26',
      attemptedAtIso: '2026-10-26T16:20:00Z',
    },
    {
      id: 'seed-q-5',
      questionId: 'seed-env-1',
      source: 'mock',
      sourceTitle: 'Environment & Ecology Practice',
      questionNumber: 5,
      questionText:
        'Consider the following statements regarding the "Montreux Record":\n1. It is a register of wetland sites on the List of Wetlands of International Importance.\n2. In India, Keoladeo National Park and Loktak Lake are currently in the Montreux Record.',
      statements: [
        '1. It is a register of wetland sites on the List of Wetlands of International Importance.',
        '2. In India, Keoladeo National Park and Loktak Lake are currently in the Montreux Record.',
      ],
      options: [
        { id: 'A', text: '1 only' },
        { id: 'B', text: '2 only' },
        { id: 'C', text: 'Both 1 and 2' },
        { id: 'D', text: 'Neither 1 nor 2' },
      ],
      selectedAnswer: 'C',
      correctAnswer: 'C',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 64,
      subject: 'Environment & Ecology',
      topic: 'Wetlands & Conservation Treaties',
      explanation:
        'The Montreux Record is a register of wetland sites on the Ramsar List where changes in ecological character have occurred, are occurring, or are likely to occur. In India, Keoladeo NP and Loktak Lake are included.',
      timestamp: new Date('2026-10-25T11:10:00Z').getTime(),
      dateStr: '2026-10-25',
      attemptedAtIso: '2026-10-25T11:10:00Z',
    },
    {
      id: 'seed-q-6',
      questionId: 'seed-csat-1',
      source: 'mock',
      sourceTitle: 'UPSC CSAT PYQ Mock',
      questionNumber: 6,
      questionText:
        'In a tournament of 64 teams played on a knockout basis, how many total matches are required to determine the champion winner?',
      options: [
        { id: 'A', text: '63' },
        { id: 'B', text: '64' },
        { id: 'C', text: '32' },
        { id: 'D', text: '127' },
      ],
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 28,
      subject: 'CSAT',
      topic: 'Quantitative Aptitude',
      explanation:
        'In any single-elimination tournament with N teams, every match eliminates exactly one team. To leave 1 champion, N - 1 = 64 - 1 = 63 matches must be played.',
      timestamp: new Date('2026-10-24T09:40:00Z').getTime(),
      dateStr: '2026-10-24',
      attemptedAtIso: '2026-10-24T09:40:00Z',
    },
    {
      id: 'seed-q-7',
      questionId: 'seed-polity-2',
      source: 'mock',
      sourceTitle: 'Polity & Governance Mock',
      questionNumber: 7,
      questionText:
        'Which article of the Constitution of India safeguards the right to marry the person of one’s choice?',
      options: [
        { id: 'A', text: 'Article 19' },
        { id: 'B', text: 'Article 21' },
        { id: 'C', text: 'Article 25' },
        { id: 'D', text: 'Article 29' },
      ],
      selectedAnswer: 'B',
      correctAnswer: 'B',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 35,
      subject: 'Polity & Governance',
      topic: 'Fundamental Rights (Article 21)',
      explanation:
        'In the landmark Hadiya Case (Shafin Jahan v. Asokan K.M., 2018), the Supreme Court affirmed that the right to marry a person of one’s choice is integral to Article 21 (Right to Life and Personal Liberty).',
      timestamp: new Date('2026-10-23T15:00:00Z').getTime(),
      dateStr: '2026-10-23',
      attemptedAtIso: '2026-10-23T15:00:00Z',
    },
    {
      id: 'seed-q-8',
      questionId: 'seed-sci-1',
      source: 'practice',
      sourceTitle: 'Science & Technology Drill',
      questionNumber: 8,
      questionText:
        'The terms "Event Horizon", "Singularity", and "Accretion Disk" are frequently mentioned in the context of:',
      options: [
        { id: 'A', text: 'Observation and study of Black Holes' },
        { id: 'B', text: 'Origin and early expansion of the Universe' },
        { id: 'C', text: 'Solar and Lunar Eclipses' },
        { id: 'D', text: 'Placement of satellites in orbit' },
      ],
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      status: 'correct',
      timeSpentSeconds: 30,
      subject: 'Science & Technology',
      topic: 'Space & Astronomy',
      explanation:
        'Event Horizon, Singularity, and Accretion Disk are fundamental astrophysical concepts associated with Black Holes.',
      timestamp: new Date('2026-10-22T17:15:00Z').getTime(),
      dateStr: '2026-10-22',
      attemptedAtIso: '2026-10-22T17:15:00Z',
    },
  ];
}

export class QuestionHistoryService {
  /**
   * Save a completed practice question attempt locally into AsyncStorage.
   */
  static async recordPracticeAttempt(attempt: Omit<QuestionAttemptItem, 'id' | 'timestamp' | 'attemptedAtIso'>): Promise<void> {
    try {
      const now = new Date();
      const fullItem: QuestionAttemptItem = {
        ...attempt,
        id: `local_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now.getTime(),
        attemptedAtIso: now.toISOString(),
      };

      const existingRaw = await AsyncStorage.getItem(LOCAL_ATTEMPTS_STORAGE_KEY);
      const list: QuestionAttemptItem[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(fullItem);

      // Keep up to 500 recent local attempts
      if (list.length > 500) {
        list.length = 500;
      }

      await AsyncStorage.setItem(LOCAL_ATTEMPTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not record practice attempt:', e);
    }
  }

  /**
   * Fetch all raw attempts from both Supabase (mock tests) and AsyncStorage (practice drills).
   */
  static async fetchAllRawAttempts(): Promise<QuestionAttemptItem[]> {
    const combined: QuestionAttemptItem[] = [];

    // 1. Supabase mock tests and responses
    try {
      const { userId, guestId } = await getCurrentUserIdOrGuestId();

      let query = supabase
        .from('mock_tests')
        .select('id, test_title, created_at, status, user_id, guest_id')
        .order('created_at', { ascending: false })
        .limit(30);

      if (userId) {
        query = query.or(`user_id.eq.${userId},guest_id.eq.${guestId}`);
      } else {
        query = query.eq('guest_id', guestId);
      }

      const { data: tests, error: testErr } = await query;

      if (!testErr && tests && tests.length > 0) {
        const testIds = tests.map((t) => t.id);
        const testMap = new Map<string, any>(tests.map((t) => [t.id, t]));

        const [questionsRes, responsesRes] = await Promise.all([
          supabase.from('mock_test_questions').select('*').in('mock_test_id', testIds),
          supabase.from('mock_test_responses').select('*').in('mock_test_id', testIds),
        ]);

        if (responsesRes.data && questionsRes.data) {
          const qMap = new Map<string, any>();
          questionsRes.data.forEach((q) => {
            qMap.set(`${q.mock_test_id}_${q.question_id}`, q);
          });

          responsesRes.data.forEach((r) => {
            const test = testMap.get(r.mock_test_id);
            const mq = qMap.get(`${r.mock_test_id}_${r.question_id}`);
            const snap = mq?.snapshot || {};

            const hasAnswer = Boolean(r.selected_answer && r.selected_answer.trim().length > 0);
            const isCorrect = Boolean(r.is_correct);
            const status: 'correct' | 'incorrect' | 'unanswered' =
              r.answer_status === 'unattempted' || !hasAnswer
                ? 'unanswered'
                : isCorrect
                ? 'correct'
                : 'incorrect';

            const itemDate = r.last_updated || test?.created_at || new Date().toISOString();
            const dateObj = new Date(itemDate);

            // Normalized options
            const options: QuestionOptionItem[] = Array.isArray(snap.options)
              ? snap.options.map((opt: any) => ({
                  id: String(opt.id || opt.key || 'A'),
                  text: String(opt.text || opt.label || ''),
                }))
              : [
                  { id: 'A', text: 'Option A' },
                  { id: 'B', text: 'Option B' },
                  { id: 'C', text: 'Option C' },
                  { id: 'D', text: 'Option D' },
                ];

            combined.push({
              id: r.id || `resp_${r.mock_test_id}_${r.question_id}`,
              questionId: r.question_id,
              source: 'mock',
              sourceTitle: test?.test_title || 'UPSC Mock Test',
              questionNumber: snap.question_number || mq?.position || 1,
              questionText: snap.question_text_en || 'UPSC Question',
              statements: snap.statements || [],
              options,
              selectedAnswer: r.selected_answer || null,
              correctAnswer: snap.correct_answer || 'A',
              isCorrect,
              status,
              timeSpentSeconds: Number(r.time_spent_seconds) || 0,
              subject: snap.subject || 'General Studies',
              topic: snap.topic || 'General',
              explanation: snap.explanation_en || snap.explanation_hi || undefined,
              timestamp: dateObj.getTime(),
              dateStr: dateObj.toISOString().slice(0, 10),
              attemptedAtIso: itemDate,
            });
          });
        }
      }
    } catch (e) {
      console.warn('Could not query Supabase mock test responses:', e);
    }

    // 2. Local storage practice attempts
    try {
      const localRaw = await AsyncStorage.getItem(LOCAL_ATTEMPTS_STORAGE_KEY);
      if (localRaw) {
        const localList: QuestionAttemptItem[] = JSON.parse(localRaw);
        combined.push(...localList);
      }
    } catch (e) {
      console.warn('Could not query local question attempts:', e);
    }

    // 3. Fallback seeds if no attempts exist yet
    if (combined.length === 0) {
      combined.push(...generateSeedAttempts());
    }

    // Sort chronologically newest first
    combined.sort((a, b) => b.timestamp - a.timestamp);

    // Annotate repeat attempts (e.g. attempt #2)
    const countMap = new Map<string, number>();
    // Traverse from oldest to newest to count attempt indices
    const reversed = [...combined].sort((a, b) => a.timestamp - b.timestamp);
    reversed.forEach((item) => {
      const curr = (countMap.get(item.questionId) || 0) + 1;
      countMap.set(item.questionId, curr);
      item.attemptIndex = curr;
    });

    return combined;
  }

  /**
   * Determine date range boundaries based on the user's local timezone.
   */
  static getDateBoundaries(
    period: DatePeriodFilter,
    customMonthYear?: { year: number; month: number }
  ): { startDate: Date; endDate: Date; label: string } {
    const now = new Date();

    if (period === 'this_week') {
      // Monday 00:00:00 to Sunday 23:59:59
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
      return {
        startDate,
        endDate,
        label: 'This Week',
      };
    }

    if (period === 'this_month') {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        startDate,
        endDate,
        label,
      };
    }

    // Select Month (custom)
    const targetYear = customMonthYear?.year ?? now.getFullYear();
    const targetMonth = customMonthYear?.month ?? now.getMonth();
    const startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    const label = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      startDate,
      endDate,
      label,
    };
  }

  /**
   * Fetch attempts filtered strictly within the selected date boundaries.
   */
  static async getAttemptsForPeriod(
    period: DatePeriodFilter,
    customMonthYear?: { year: number; month: number }
  ): Promise<{ attempts: QuestionAttemptItem[]; boundaries: { startDate: Date; endDate: Date; label: string } }> {
    const boundaries = this.getDateBoundaries(period, customMonthYear);
    const startMs = boundaries.startDate.getTime();
    const endMs = boundaries.endDate.getTime();

    const allAttempts = await this.fetchAllRawAttempts();

    const filtered = allAttempts.filter(
      (att) => att.timestamp >= startMs && att.timestamp <= endMs
    );

    return {
      attempts: filtered,
      boundaries,
    };
  }

  /**
   * Compute metrics & daily trend for the selected period.
   * Repeat attempts rule: For summary metrics, count each unique question once, using its latest completed attempt.
   */
  static calculatePeriodMetrics(
    attempts: QuestionAttemptItem[],
    boundaries: { startDate: Date; endDate: Date; label: string },
    period: DatePeriodFilter
  ): PeriodSummaryMetrics {
    // 1. Group by unique questionId to get latest attempt per question
    const latestByQuestion = new Map<string, QuestionAttemptItem>();
    attempts.forEach((att) => {
      const existing = latestByQuestion.get(att.questionId);
      if (!existing || att.timestamp > existing.timestamp) {
        latestByQuestion.set(att.questionId, att);
      }
    });

    const uniqueAttempts = Array.from(latestByQuestion.values());
    const validAnswered = uniqueAttempts.filter((att) => att.status !== 'unanswered');

    const questionsSolved = validAnswered.length;
    const correctCount = validAnswered.filter((att) => att.isCorrect).length;
    const incorrectCount = validAnswered.filter((att) => !att.isCorrect).length;
    const unansweredCount = uniqueAttempts.filter((att) => att.status === 'unanswered').length;

    // Accuracy excludes unanswered questions from denominator
    const accuracy =
      validAnswered.length > 0
        ? Math.round((correctCount / validAnswered.length) * 100)
        : 0;

    // Average time: sum of active valid time divided by valid answered questions
    const totalValidTimeSeconds = validAnswered.reduce(
      (sum, att) => sum + Math.min(600, att.timeSpentSeconds || 0), // clamp outlier background idle time at 10m
      0
    );
    const avgTimeSeconds =
      validAnswered.length > 0
        ? Math.round(totalValidTimeSeconds / validAnswered.length)
        : 0;

    // 2. Daily Trend Points
    const trend: DailyTrendPoint[] = [];

    if (period === 'this_week') {
      // 7 days from Monday to Sunday
      const start = new Date(boundaries.startDate);
      for (let i = 0; i < 7; i++) {
        const curDate = new Date(start);
        curDate.setDate(start.getDate() + i);

        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const dayName = curDate.toLocaleDateString('en-US', { weekday: 'narrow' });
        const dayNumber = curDate.getDate();

        // Unique questions answered on this day
        const dayAttempts = attempts.filter((a) => a.dateStr === dateStr && a.status !== 'unanswered');
        const dayUniqueQuestions = new Set(dayAttempts.map((a) => a.questionId));
        const dayCorrect = dayAttempts.filter((a) => a.isCorrect).length;
        const dayAcc = dayAttempts.length > 0 ? Math.round((dayCorrect / dayAttempts.length) * 100) : 0;

        trend.push({
          dateStr,
          dayLabel: dayName,
          dayNumber,
          questionsCount: dayUniqueQuestions.size,
          accuracy: dayAcc,
        });
      }
    } else {
      // For This Month or Select Month:
      // Group by active dates or full calendar days in month
      const start = new Date(boundaries.startDate);
      const totalDaysInMonth = new Date(boundaries.startDate.getFullYear(), boundaries.startDate.getMonth() + 1, 0).getDate();

      for (let i = 1; i <= totalDaysInMonth; i++) {
        const curDate = new Date(start.getFullYear(), start.getMonth(), i);
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(i).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const dayName = curDate.toLocaleDateString('en-US', { weekday: 'narrow' });
        const dayAttempts = attempts.filter((a) => a.dateStr === dateStr && a.status !== 'unanswered');
        const dayUniqueQuestions = new Set(dayAttempts.map((a) => a.questionId));
        const dayCorrect = dayAttempts.filter((a) => a.isCorrect).length;
        const dayAcc = dayAttempts.length > 0 ? Math.round((dayCorrect / dayAttempts.length) * 100) : 0;

        trend.push({
          dateStr,
          dayLabel: dayName,
          dayNumber: i,
          questionsCount: dayUniqueQuestions.size,
          accuracy: dayAcc,
        });
      }
    }

    return {
      questionsSolved,
      totalAttempts: attempts.length,
      accuracy,
      avgTimeSeconds,
      correctCount,
      incorrectCount,
      unansweredCount,
      trend,
    };
  }

  /**
   * Generates a list of months for the Month/Year picker (e.g. past 12 months up to current).
   */
  static getMonthOptions(): MonthOption[] {
    const options: MonthOption[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
    }

    return options;
  }
}

