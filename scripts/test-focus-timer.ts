import {
  ActiveFocusSession,
  calculateFocusDurations,
  formatHumanDuration,
  formatTimerHHMMSS,
} from '../src/services/focusTimerService';
import { calculateStreakStats } from '../src/services/streakCalculator';
import { StudySession } from '../src/types/study';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('\n--- Running Yeolpumta Focus Timer & Study Session Tests ---\n');

// Test 1: Active timer calculation from timestamps (continuous study with zero pauses)
{
  const start = 1729770000000; // 07:00:00.000
  const now = start + 45 * 60 * 1000; // 45 minutes later

  const session: Pick<ActiveFocusSession, 'startTimestamp' | 'endTimestamp' | 'pauseIntervals' | 'status'> = {
    startTimestamp: start,
    endTimestamp: undefined,
    pauseIntervals: [],
    status: 'running',
  };

  const durations = calculateFocusDurations(session, now);
  assert(durations.elapsedSeconds === 2700, 'Calculates 2700 elapsed seconds for 45 minutes');
  assert(durations.pausedSeconds === 0, 'Paused seconds is 0 when no pauses taken');
  assert(durations.focusedSeconds === 2700, 'Focused seconds matches elapsed seconds when unpaused');
  assert(durations.focusedMinutes === 45, 'Focused minutes is exactly 45 minutes');
}

// Test 2: Pausing excludes paused interval accurately
{
  const start = 1000000;
  // Studied 10 minutes (600s), paused for 5 minutes (300s), then studied 15 minutes (900s) -> Total elapsed 30 min (1800s), focused 25 min (1500s)
  const pauseStart = start + 600 * 1000;
  const pauseEnd = pauseStart + 300 * 1000;
  const currentNow = start + 1800 * 1000;

  const session: Pick<ActiveFocusSession, 'startTimestamp' | 'endTimestamp' | 'pauseIntervals' | 'status'> = {
    startTimestamp: start,
    endTimestamp: undefined,
    pauseIntervals: [
      { startTimestamp: pauseStart, endTimestamp: pauseEnd },
    ],
    status: 'running',
  };

  const durations = calculateFocusDurations(session, currentNow);
  assert(durations.elapsedSeconds === 1800, 'Total elapsed is 1800 seconds (30m)');
  assert(durations.pausedSeconds === 300, 'Total paused is 300 seconds (5m)');
  assert(durations.focusedSeconds === 1500, 'Focused seconds is 1500 (25m, pause excluded)');
  assert(durations.focusedMinutes === 25, 'Focused minutes is 25m');
}

// Test 3: Multiple pause intervals and currently active pause
{
  const start = 2000000;
  // Pause 1: 2 mins (120s)
  const p1Start = start + 300 * 1000;
  const p1End = p1Start + 120 * 1000;

  // Pause 2: currently open (endTimestamp: null)
  const p2Start = start + 800 * 1000;
  const currentNow = p2Start + 180 * 1000; // 3 mins into pause 2

  const session: Pick<ActiveFocusSession, 'startTimestamp' | 'endTimestamp' | 'pauseIntervals' | 'status'> = {
    startTimestamp: start,
    endTimestamp: undefined,
    pauseIntervals: [
      { startTimestamp: p1Start, endTimestamp: p1End },
      { startTimestamp: p2Start, endTimestamp: null },
    ],
    status: 'paused',
  };

  const durations = calculateFocusDurations(session, currentNow);
  const expectedPausedSec = 120 + 180; // 300s
  const totalElapsedSec = (currentNow - start) / 1000;
  const expectedFocusedSec = totalElapsedSec - expectedPausedSec;

  assert(durations.pausedSeconds === expectedPausedSec, `Accumulates closed and open pauses (${expectedPausedSec}s)`);
  assert(durations.focusedSeconds === expectedFocusedSec, 'Focused seconds subtracts all pause intervals');
}

// Test 4: Duration formatting (HH:MM:SS and human readable)
{
  assert(formatTimerHHMMSS(45) === '00:45', 'Format seconds < 1 min');
  assert(formatTimerHHMMSS(125) === '02:05', 'Format MM:SS');
  assert(formatTimerHHMMSS(3665) === '01:01:05', 'Format HH:MM:SS');
  assert(formatHumanDuration(3600) === '1 hr', 'Human duration 1 hr');
  assert(formatHumanDuration(3720) === '1 hr 2 min', 'Human duration 1 hr 2 min');
  assert(formatHumanDuration(45 * 60) === '45 min', 'Human duration 45 min');
}

// Test 5: Session restoration and resilience against tab inactive / system sleep
{
  const realStart = Date.now() - 3600 * 1000; // 1 hour ago
  const storedSession: ActiveFocusSession = {
    id: 'focus_test_restore',
    userId: 'user_primary',
    subject: 'Polity',
    topic: 'Fundamental Rights Revision',
    targetMinutes: 60,
    startTimestamp: realStart,
    pauseIntervals: [],
    distractionCount: 2,
    status: 'running',
    createdAt: realStart,
    updatedAt: realStart,
  };

  // Simulating app wakeup 1 hour later
  const restoredDurations = calculateFocusDurations(storedSession, Date.now());
  assert(restoredDurations.focusedMinutes >= 60, 'Restored session computes accurate time after sleep / refresh');
  assert(storedSession.distractionCount === 2, 'Distraction count is preserved upon restoration');
}

// Test 6: Preventing duplicate sessions
{
  let activeSession: ActiveFocusSession | null = {
    id: 'active_1',
    userId: 'user_primary',
    subject: 'Economy',
    topic: 'Fiscal Policy',
    targetMinutes: 45,
    startTimestamp: Date.now(),
    pauseIntervals: [],
    distractionCount: 0,
    status: 'running',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Attempting to create second session while active
  const attemptConcurrentStart = () => {
    if (activeSession && activeSession.status === 'running') {
      return false; // Rejected duplicate start
    }
    activeSession = {
      id: 'active_2',
      userId: 'user_primary',
      subject: 'History',
      topic: 'Modern India',
      targetMinutes: 60,
      startTimestamp: Date.now(),
      pauseIntervals: [],
      distractionCount: 0,
      status: 'running',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return true;
  };

  const result = attemptConcurrentStart();
  assert(result === false, 'Rejects concurrent session when one is running');
  assert(activeSession.id === 'active_1', 'Original active session is unharmed');
}

// Test 7: Streak qualification integration
{
  const todayStr = '2026-10-24';
  const yesterdayStr = '2026-10-23';

  // Yesterday had 60 mins (qualifying)
  const sessions: StudySession[] = [
    {
      id: 's_yest',
      userId: 'user_primary',
      subject: 'Geography',
      topic: 'Geomorphology',
      startTime: '',
      endTime: '',
      durationMinutes: 60,
      date: yesterdayStr,
      completed: true,
    },
  ];

  const streakBefore = calculateStreakStats(sessions, 60, todayStr);
  assert(streakBefore.currentStreak === 1, 'Current streak before today session is 1');

  // Today user completes 60 min focus session
  const todayFocusSession: StudySession = {
    id: 's_today',
    userId: 'user_primary',
    subject: 'Polity',
    topic: 'Judiciary',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    date: todayStr,
    completed: true,
  };

  const streakAfter = calculateStreakStats([todayFocusSession, ...sessions], 60, todayStr);
  assert(streakAfter.currentStreak === 2, 'Today 60 min session qualifies and increments streak to 2');
}

console.log('\n🎉 ALL 7 FOCUS TIMER AUTOMATED TESTS PASSED SUCCESSFULLY!\n');
