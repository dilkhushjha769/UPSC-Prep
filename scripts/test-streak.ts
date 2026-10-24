import {
  addDays,
  aggregateDailyStudyMinutes,
  calculateStreakStats,
  getWeekDaysSummary,
  parseLocalDateString,
} from '../src/services/streakCalculator';
import { StudySession } from '../src/types/study';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('\n--- Running Streak & Study Logic Tests ---\n');

const TODAY = '2026-10-24';
const YESTERDAY = '2026-10-23';
const TWO_DAYS_AGO = '2026-10-22';
const THREE_DAYS_AGO = '2026-10-21';
const TOMORROW = '2026-10-25';

// Test 1: Date helpers
{
  const parsed = parseLocalDateString('2026-10-24');
  assert(parsed.getFullYear() === 2026 && parsed.getMonth() === 9 && parsed.getDate() === 24, 'parseLocalDateString creates correct local date');
  assert(addDays('2026-10-24', 1) === '2026-10-25', 'addDays forward');
  assert(addDays('2026-10-24', -1) === '2026-10-23', 'addDays backward');
  assert(addDays('2026-10-31', 1) === '2026-11-01', 'addDays month boundary');
}

// Test 2: Incomplete & future sessions are ignored
{
  const sessions: StudySession[] = [
    {
      id: 's1',
      userId: 'u1',
      subject: 'Polity',
      topic: 'Preamble',
      startTime: '',
      endTime: '',
      durationMinutes: 90,
      date: TODAY,
      completed: false, // Incomplete!
    },
    {
      id: 's2',
      userId: 'u1',
      subject: 'Economy',
      topic: 'Banking',
      startTime: '',
      endTime: '',
      durationMinutes: 60,
      date: TOMORROW, // Future!
      completed: true,
    },
    {
      id: 's3',
      userId: 'u1',
      subject: 'Modern History',
      topic: 'Indus Valley',
      startTime: '',
      endTime: '',
      durationMinutes: 0, // Zero duration!
      date: TODAY,
      completed: true,
    },
  ];

  const map = aggregateDailyStudyMinutes(sessions, TODAY);
  assert(!map.has(TODAY), 'Incomplete and zero duration sessions not counted');
  assert(!map.has(TOMORROW), 'Future sessions not counted');
}

// Test 3: Deduplication of sessions prevents artificial inflation
{
  const sessions: StudySession[] = [
    {
      id: 's-duplicate-1',
      userId: 'u1',
      subject: 'Polity',
      topic: 'DPSP',
      startTime: '',
      endTime: '',
      durationMinutes: 45,
      date: TODAY,
      completed: true,
    },
    {
      id: 's-duplicate-1', // Same ID!
      userId: 'u1',
      subject: 'Polity',
      topic: 'DPSP',
      startTime: '',
      endTime: '',
      durationMinutes: 45,
      date: TODAY,
      completed: true,
    },
  ];

  const map = aggregateDailyStudyMinutes(sessions, TODAY);
  assert(map.get(TODAY) === 45, 'Duplicate session ID is counted only once');
}

// Test 4: Qualifying study threshold (e.g. 60 mins)
{
  const sessions: StudySession[] = [
    {
      id: 's-short',
      userId: 'u1',
      subject: 'CSAT',
      topic: 'Maths',
      startTime: '',
      endTime: '',
      durationMinutes: 50, // Less than 60!
      date: YESTERDAY,
      completed: true,
    },
  ];

  const stats = calculateStreakStats(sessions, 60, TODAY);
  assert(stats.currentStreak === 0, 'Sub-threshold study (50m < 60m) does not qualify for streak');
}

// Test 5: Today in progress preserves yesterday active streak
{
  // User studied on 21st, 22nd, 23rd (yesterday). Today (24th) they have not yet reached 60 mins.
  const sessions: StudySession[] = [
    { id: '1', userId: 'u1', subject: 'Polity', topic: 'T1', startTime: '', endTime: '', durationMinutes: 60, date: THREE_DAYS_AGO, completed: true },
    { id: '2', userId: 'u1', subject: 'Polity', topic: 'T2', startTime: '', endTime: '', durationMinutes: 70, date: TWO_DAYS_AGO, completed: true },
    { id: '3', userId: 'u1', subject: 'Polity', topic: 'T3', startTime: '', endTime: '', durationMinutes: 80, date: YESTERDAY, completed: true },
    { id: '4', userId: 'u1', subject: 'Polity', topic: 'T4', startTime: '', endTime: '', durationMinutes: 20, date: TODAY, completed: true }, // Not yet 60m
  ];

  const stats = calculateStreakStats(sessions, 60, TODAY);
  assert(stats.currentStreak === 3, `Preserves active streak during today in progress (expected 3, got ${stats.currentStreak})`);
  assert(stats.totalStudyDays === 3, 'Total study days only counts qualified days (3)');
}

// Test 6: Completing today increases streak
{
  const sessions: StudySession[] = [
    { id: '1', userId: 'u1', subject: 'Polity', topic: 'T1', startTime: '', endTime: '', durationMinutes: 60, date: THREE_DAYS_AGO, completed: true },
    { id: '2', userId: 'u1', subject: 'Polity', topic: 'T2', startTime: '', endTime: '', durationMinutes: 70, date: TWO_DAYS_AGO, completed: true },
    { id: '3', userId: 'u1', subject: 'Polity', topic: 'T3', startTime: '', endTime: '', durationMinutes: 80, date: YESTERDAY, completed: true },
    { id: '4', userId: 'u1', subject: 'Polity', topic: 'T4', startTime: '', endTime: '', durationMinutes: 65, date: TODAY, completed: true }, // Completed today!
  ];

  const stats = calculateStreakStats(sessions, 60, TODAY);
  assert(stats.currentStreak === 4, `Current streak increases to 4 when today qualifies (got ${stats.currentStreak})`);
  assert(stats.totalStudyDays === 4, 'Total study days increases to 4');
}

// Test 7: Missed day resets current streak, but longest streak persists
{
  // User had a 5-day streak 10 days ago. Then missed several days.
  const pastDates = [
    '2026-10-10',
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
    '2026-10-14',
  ];

  const sessions: StudySession[] = pastDates.map((date, idx) => ({
    id: `hist-${idx}`,
    userId: 'u1',
    subject: 'Modern History',
    topic: 'Medieval India',
    startTime: '',
    endTime: '',
    durationMinutes: 90,
    date,
    completed: true,
  }));

  const stats = calculateStreakStats(sessions, 60, TODAY);
  assert(stats.currentStreak === 0, 'Current streak is 0 after missed days');
  assert(stats.longestStreak === 5, `Longest streak persists at 5 despite streak break (got ${stats.longestStreak})`);
}

// Test 8: Multiple sessions on the same day sum together to qualify
{
  const sessions: StudySession[] = [
    { id: 'm1', userId: 'u1', subject: 'Current Affairs', topic: 'Editorials', startTime: '', endTime: '', durationMinutes: 30, date: YESTERDAY, completed: true },
    { id: 'm2', userId: 'u1', subject: 'Polity', topic: 'Judiciary', startTime: '', endTime: '', durationMinutes: 35, date: YESTERDAY, completed: true },
  ];

  // 30 + 35 = 65 mins >= 60 mins
  const stats = calculateStreakStats(sessions, 60, TODAY);
  assert(stats.currentStreak === 1, 'Multiple sessions on same day combine to meet threshold (30 + 35 = 65m)');
}

// Test 9: Week summary returns 7 days with correct metadata
{
  const week = getWeekDaysSummary([], 360, 60, TODAY);
  assert(week.length === 7, 'Week summary contains 7 days');
  assert(week[0].dayName === 'Mon', 'Week starts on Monday');
  assert(week[6].dayName === 'Sun', 'Week ends on Sunday');
  const todayEntry = week.find((w) => w.isToday);
  assert(!!todayEntry && todayEntry.dateStr === TODAY, 'Finds today correctly in week summary');
}

console.log('\n🎉 ALL STREAK & STUDY TESTS PASSED SUCCESSFULLY!\n');
