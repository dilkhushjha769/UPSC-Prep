import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PALETTE, Typography } from '@/constants/colors';

// ============================================================================
// ICONS
// ============================================================================

function ChevronLeftIcon({
  size = 20,
  color = '#FFFFFF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

function ChevronRightIcon({
  size = 20,
  color = '#FFFFFF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const MONTH_NAMES = [
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

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export interface CalendarProps {
  /** Currently selected date (Date object or 'YYYY-MM-DD' string). Defaults to today. */
  selectedDate?: Date | string;
  /** Callback fired when a date is tapped. Returns (date: Date, dateKey: 'YYYY-MM-DD'). */
  onSelectDate?: (date: Date, dateKey: string) => void;
  /** Initial month/year to display (defaults to selectedDate or today). */
  initialDate?: Date | string;
  /** Optional today date reference. Defaults to current device date. */
  today?: Date | string;
  /** Whether to render in dark mode. Defaults to true as per design system requirements. */
  isDark?: boolean;
  /** Earliest selectable date. */
  minDate?: Date | string;
  /** Latest selectable date. */
  maxDate?: Date | string;
  /** Highlighted / marked dates (e.g. streaks, study days, events) mapping to badge/dot color. */
  markedDates?: Record<string, { marked?: boolean; dotColor?: string }>;
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
}

// Helper to normalize Date / string into a 'YYYY-MM-DD' string
function toDateKey(date: Date | string): string {
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return date;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): { year: number; month: number; day: number } {
  const parts = key.split('-');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      day: parseInt(parts[2], 10),
    };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Calendar({
  selectedDate,
  onSelectDate,
  initialDate,
  today = new Date(),
  isDark = true,
  minDate,
  maxDate,
  markedDates,
  style,
}: CalendarProps) {
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Selected date key
  const [internalSelectedKey, setInternalSelectedKey] = useState<string>(() =>
    selectedDate ? toDateKey(selectedDate) : todayKey
  );

  const activeSelectedKey = selectedDate ? toDateKey(selectedDate) : internalSelectedKey;

  // View Year and Month
  const initialParsed = useMemo(() => {
    if (initialDate) return parseDateKey(toDateKey(initialDate));
    if (selectedDate) return parseDateKey(toDateKey(selectedDate));
    return parseDateKey(todayKey);
  }, [initialDate, selectedDate, todayKey]);

  const [viewYear, setViewYear] = useState<number>(initialParsed.year);
  const [viewMonth, setViewMonth] = useState<number>(initialParsed.month);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix (Monday = 0 ... Sunday = 6)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday-based offset
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const cells: {
      day: number | null;
      dateKey: string;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
      markedInfo?: { marked?: boolean; dotColor?: string };
    }[] = [];

    // Empty leading padding cells
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({
        day: null,
        dateKey: `empty-lead-${i}`,
        isToday: false,
        isSelected: false,
        isDisabled: true,
      });
    }

    // Days in current month
    const minKey = minDate ? toDateKey(minDate) : null;
    const maxKey = maxDate ? toDateKey(maxDate) : null;

    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const key = `${viewYear}-${mStr}-${dStr}`;

      const isToday = key === todayKey;
      const isSelected = key === activeSelectedKey;
      const isDisabled = (minKey !== null && key < minKey) || (maxKey !== null && key > maxKey);
      const markedInfo = markedDates?.[key];

      cells.push({
        day: d,
        dateKey: key,
        isToday,
        isSelected,
        isDisabled,
        markedInfo,
      });
    }

    return cells;
  }, [viewYear, viewMonth, todayKey, activeSelectedKey, minDate, maxDate, markedDates]);

  // Color Theme definitions
  const theme = useMemo(() => {
    if (isDark) {
      return {
        cardBg: PALETTE.neutral.dark.darkest, // #1F2024
        cardBorder: PALETTE.neutral.dark.textMuted, // #494A50
        titleText: PALETTE.neutral.light.lightest, // #FFFFFF
        arrowColor: PALETTE.neutral.light.lightest, // #FFFFFF
        arrowHoverBg: PALETTE.neutral.dark.surface, // #2F3036
        weekdayText: PALETTE.neutral.dark.textSecondary, // #71727A
        dayText: PALETTE.neutral.light.lightest, // #FFFFFF
        dayTextDisabled: PALETTE.neutral.dark.textMuted, // #494A50
        todayBg: PALETTE.neutral.dark.surface, // #2F3036 (Pure constant neutral)
        todayText: PALETTE.neutral.light.lightest,
        selectedBg: PALETTE.highlight.primary, // #006FFD
        selectedText: PALETTE.neutral.light.lightest, // #FFFFFF
        markedDot: PALETTE.highlight.primary, // #006FFD
      };
    }

    return {
      cardBg: PALETTE.neutral.light.lightest, // #FFFFFF
      cardBorder: PALETTE.neutral.light.borderSubtle, // #E8E9F1
      titleText: PALETTE.neutral.dark.darkest, // #1F2024
      arrowColor: PALETTE.neutral.dark.textSecondary, // #71727A
      arrowHoverBg: PALETTE.neutral.light.surface, // #F8F9FE
      weekdayText: PALETTE.neutral.dark.textSecondary, // #71727A
      dayText: PALETTE.neutral.dark.darkest, // #1F2024
      dayTextDisabled: PALETTE.neutral.light.muted, // #C5C6CC
      todayBg: PALETTE.highlight.tint20, // #EAF2FF
      todayText: PALETTE.highlight.primary, // #006FFD
      selectedBg: PALETTE.highlight.primary, // #006FFD
      selectedText: PALETTE.neutral.light.lightest, // #FFFFFF
      markedDot: PALETTE.highlight.primary,
    };
  }, [isDark]);

  const handleDayPress = (cell: { day: number | null; dateKey: string; isDisabled: boolean }) => {
    if (!cell.day || cell.isDisabled) return;
    setInternalSelectedKey(cell.dateKey);
    if (onSelectDate) {
      const parts = cell.dateKey.split('-');
      const dateObj = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      onSelectDate(dateObj, cell.dateKey);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
        style,
      ]}>
      {/* Header Row: "Sep 2022" on Left, Nav Arrows on Right */}
      <View style={styles.headerRow}>
        <Text style={[styles.monthTitle, { color: theme.titleText }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>

        <View style={styles.arrowsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { backgroundColor: theme.arrowHoverBg },
            ]}
            onPress={handlePrevMonth}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous month">
            <ChevronLeftIcon size={18} color={theme.arrowColor} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { backgroundColor: theme.arrowHoverBg },
            ]}
            onPress={handleNextMonth}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next month">
            <ChevronRightIcon size={18} color={theme.arrowColor} />
          </Pressable>
        </View>
      </View>

      {/* Weekdays Row: MO TU WE TH FR SA SU */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((wd) => (
          <View key={wd} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: theme.weekdayText }]}>
              {wd}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {calendarCells.map((cell) => {
          if (cell.day === null) {
            return <View key={cell.dateKey} style={styles.dayCellContainer} />;
          }

          return (
            <View key={cell.dateKey} style={styles.dayCellContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.dayCircle,
                  cell.isSelected && { backgroundColor: theme.selectedBg },
                  !cell.isSelected && cell.isToday && { backgroundColor: theme.todayBg },
                  pressed && !cell.isSelected && { opacity: 0.7 },
                ]}
                onPress={() => handleDayPress(cell)}
                disabled={cell.isDisabled}>
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: cell.isSelected
                        ? theme.selectedText
                        : cell.isToday
                        ? theme.todayText
                        : cell.isDisabled
                        ? theme.dayTextDisabled
                        : theme.dayText,
                    },
                  ]}>
                  {cell.day}
                </Text>

                {/* Optional Status Marker Dot */}
                {cell.markedInfo?.marked && !cell.isSelected ? (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          cell.markedInfo.dotColor || theme.markedDot,
                      },
                    ]}
                  />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.2,
  },
  arrowsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCellContainer: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default Calendar;
