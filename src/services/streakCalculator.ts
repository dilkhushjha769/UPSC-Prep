import { DayStudySummary, StreakData, StudySession } from '@/types/study';

/**
 * Formats a Date object to YYYY-MM-DD in local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD into a local Date object (at local noon to avoid DST/shift bugs)
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDateString(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Aggregate valid completed sessions into daily total minutes map { [date: string]: number }
 * - Ignores incomplete or future sessions
 * - Deduplicates by session ID
 */
export function aggregateDailyStudyMinutes(
  sessions: StudySession[],
  todayStr: string = getLocalDateString()
): Map<string, number> {
  const dailyTotals = new Map<string, number>();
  const seenSessionIds = new Set<string>();

  for (const session of sessions) {
    // Basic validation: must be completed and duration > 0
    if (!session || !session.completed || session.durationMinutes <= 0) {
      continue;
    }

    // Deduplication check
    if (seenSessionIds.has(session.id)) {
      continue;
    }
    seenSessionIds.add(session.id);

    // Date validation: do not count future dates
    if (session.date > todayStr) {
      continue;
    }

    const currentTotal = dailyTotals.get(session.date) || 0;
    dailyTotals.set(session.date, currentTotal + session.durationMinutes);
  }

  return dailyTotals;
}

/**
 * Computes current and longest streak according to strict UPSC preparation rules:
 * - Qualifying day: daily total minutes >= qualifyingMinutesThreshold (e.g. 60 mins).
 * - Today in progress: if today is not yet qualified, but yesterday was qualified, current streak is preserved!
 * - If today is qualified, today counts toward current streak.
 * - If yesterday was NOT qualified and today is NOT qualified, current streak is 0.
 * - Longest streak is the maximum consecutive qualifying run ever achieved.
 */
export function calculateStreakStats(
  sessions: StudySession[],
  qualifyingMinutesThreshold: number = 60,
  todayStr: string = getLocalDateString()
): StreakData {
  const dailyMinutes = aggregateDailyStudyMinutes(sessions, todayStr);

  // Collect all unique past and present dates sorted chronologically
  const qualifyingDates = new Set<string>();
  for (const [date, minutes] of dailyMinutes.entries()) {
    if (minutes >= qualifyingMinutesThreshold && date <= todayStr) {
      qualifyingDates.add(date);
    }
  }

  const totalStudyDays = qualifyingDates.size;

  if (qualifyingDates.size === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalStudyDays: 0,
      weeklyConsistencyPercent: 0,
      lastQualifyingDate: null,
      qualifyingMinutesThreshold,
    };
  }

  const sortedDates = Array.from(qualifyingDates).sort();
  const lastQualifyingDate = sortedDates[sortedDates.length - 1];

  // Calculate longest streak historically
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: string | null = null;

  for (const date of sortedDates) {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const expectedNext = addDays(prevDate, 1);
      if (date === expectedNext) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = date;
  }

  // Calculate current streak relative to today
  const yesterdayStr = addDays(todayStr, -1);
  const isTodayQualified = qualifyingDates.has(todayStr);
  const isYesterdayQualified = qualifyingDates.has(yesterdayStr);

  let currentStreak = 0;

  if (isTodayQualified) {
    // Today is completed: count backwards from today
    let checkDate = todayStr;
    while (qualifyingDates.has(checkDate)) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  } else if (isYesterdayQualified) {
    // Today not yet completed, but yesterday was completed:
    // Active streak is preserved!
    let checkDate = yesterdayStr;
    while (qualifyingDates.has(checkDate)) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  } else {
    // Neither today nor yesterday was qualified: streak is 0
    currentStreak = 0;
  }

  // If currentStreak happens to exceed recorded longestStreak (e.g. new run), update longest
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Calculate weekly consistency for the past 7 days (including today)
  let past7DaysQualified = 0;
  for (let i = 0; i < 7; i++) {
    const dStr = addDays(todayStr, -i);
    if (qualifyingDates.has(dStr)) {
      past7DaysQualified += 1;
    }
  }
  const weeklyConsistencyPercent = Math.round((past7DaysQualified / 7) * 100);

  return {
    currentStreak,
    longestStreak,
    totalStudyDays,
    weeklyConsistencyPercent,
    lastQualifyingDate,
    qualifyingMinutesThreshold,
  };
}

/**
 * Builds the 7-day week array for the horizontal streak calendar (current week Monday through Sunday)
 */
export function getWeekDaysSummary(
  sessions: StudySession[],
  dailyTargetMinutes: number = 360,
  qualifyingThresholdMinutes: number = 60,
  todayStr: string = getLocalDateString()
): DayStudySummary[] {
  const dailyMinutes = aggregateDailyStudyMinutes(sessions, todayStr);
  const today = parseLocalDateString(todayStr);

  // Determine current day of week (0 is Sun, 1 is Mon, ..., 6 is Sat)
  const dayOfWeek = today.getDay();
  // We want Monday as start of week: Monday is index 0
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() + diffToMonday);

  const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const weekSummary: DayStudySummary[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(mondayDate);
    current.setDate(mondayDate.getDate() + i);

    const dStr = getLocalDateString(current);
    const isToday = dStr === todayStr;
    const isPast = dStr < todayStr;
    const isFuture = dStr > todayStr;

    const totalMinutes = dailyMinutes.get(dStr) || 0;
    const isCompleted = totalMinutes >= qualifyingThresholdMinutes;
    const progressPercent = Math.min(
      100,
      Math.round((totalMinutes / dailyTargetMinutes) * 100)
    );

    weekSummary.push({
      dayName: dayAbbreviations[i],
      fullDayName: fullDayNames[i],
      dateStr: dStr,
      dayNumber: current.getDate(),
      monthName: monthNames[current.getMonth()],
      isToday,
      isPast,
      isFuture,
      isCompleted,
      totalMinutes,
      targetMinutes: dailyTargetMinutes,
      progressPercent,
    });
  }

  return weekSummary;
}
