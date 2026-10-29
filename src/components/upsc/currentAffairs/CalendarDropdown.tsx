import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Check } from 'lucide-react-native';
import { PALETTE, Typography } from '@/constants/colors';
import { DAILY_EVENTS_DATA, getTodayDateKey } from '@/data/currentAffairsData';

// ============================================================================
// FIGMA CALENDAR ICONS (Matching src/components/ui/Calendar.tsx)
// ============================================================================

function ChevronLeftIcon({
  size = 18,
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
  size = 18,
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

interface CalendarDropdownProps {
  visible: boolean;
  onClose: () => void;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  topOffset?: number;
  rightOffset?: number;
  leftOffset?: number;
  isDark?: boolean;
  completedDates?: string[];
}

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

export function CalendarDropdown({
  visible,
  onClose,
  selectedDateKey,
  onSelectDate,
  topOffset = 180,
  rightOffset = 16,
  leftOffset,
  isDark = true,
  completedDates = [],
}: CalendarDropdownProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  // Dynamic Today reference (updates automatically every day)
  const todayKey = useMemo(() => getTodayDateKey(), []);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }, []);

  // Parse currently selected date
  const parsedSelected = useMemo(() => {
    const parts = selectedDateKey.split('-');
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
        day: parseInt(parts[2], 10),
      };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [selectedDateKey]);

  // Browse month/year state
  const [viewYear, setViewYear] = useState<number>(parsedSelected.year);
  const [viewMonth, setViewMonth] = useState<number>(parsedSelected.month);
  const [prevSelectedKey, setPrevSelectedKey] = useState<string>(selectedDateKey);

  // Sync state if selectedDateKey changes externally
  if (prevSelectedKey !== selectedDateKey) {
    setPrevSelectedKey(selectedDateKey);
    setViewYear(parsedSelected.year);
    setViewMonth(parsedSelected.month);
  }

  // Set of dates that have curated summaries
  const curatedDatesSet = useMemo(() => {
    return new Set(DAILY_EVENTS_DATA.map((d) => d.dateKey));
  }, []);

  // Set of dates marked as read/completed by the user
  const completedDatesSet = useMemo(() => {
    return new Set(completedDates);
  }, [completedDates]);

  // Figma Color Theme definitions (Matching src/components/ui/Calendar.tsx)
  const theme = useMemo(() => {
    if (isDark) {
      return {
        cardBg: PALETTE.neutral.dark.darkest, // #1F2024
        cardBorder: PALETTE.neutral.dark.textMuted, // #494A50
        divider: PALETTE.neutral.dark.surface, // #2F3036
        titleText: PALETTE.neutral.light.lightest, // #FFFFFF
        arrowColor: PALETTE.neutral.light.lightest, // #FFFFFF
        arrowHoverBg: PALETTE.neutral.dark.surface, // #2F3036
        weekdayText: PALETTE.neutral.dark.textSecondary, // #71727A
        dayText: PALETTE.neutral.light.lightest, // #FFFFFF
        dayTextDisabled: PALETTE.neutral.dark.textMuted, // #494A50
        todayBg: PALETTE.neutral.dark.surface, // #2F3036
        todayText: PALETTE.neutral.light.lightest, // #FFFFFF
        selectedBg: PALETTE.highlight.primary, // #006FFD
        selectedText: PALETTE.neutral.light.lightest, // #FFFFFF
        curatedDot: PALETTE.highlight.tint80, // #2897FF
        completedDot: PALETTE.support.success.medium, // #3AC0A0
        pillBg: PALETTE.neutral.dark.surface, // #2F3036
        pillBorder: PALETTE.neutral.dark.textMuted, // #494A50
        pillText: PALETTE.neutral.light.muted, // #C5C6CC
      };
    }

    return {
      cardBg: PALETTE.neutral.light.lightest, // #FFFFFF
      cardBorder: PALETTE.neutral.light.borderSubtle, // #E8E9F1
      divider: PALETTE.neutral.light.borderSubtle, // #E8E9F1
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
      curatedDot: PALETTE.highlight.primary, // #006FFD
      completedDot: PALETTE.support.success.medium, // #3AC0A0
      pillBg: PALETTE.neutral.light.surface, // #F8F9FE
      pillBorder: PALETTE.neutral.light.borderSubtle, // #E8E9F1
      pillText: PALETTE.neutral.dark.textSecondary, // #71727A
    };
  }, [isDark]);

  // Calendar cells (Monday = 0 ... Sunday = 6)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const cells: {
      day: number | null;
      dateKey: string;
      isFuture: boolean;
      isSelected: boolean;
      isCurated: boolean;
      isToday: boolean;
      isCompleted: boolean;
    }[] = [];

    for (let i = 0; i < startDayIndex; i++) {
      cells.push({
        day: null,
        dateKey: `empty-lead-${i}`,
        isFuture: false,
        isSelected: false,
        isCurated: false,
        isToday: false,
        isCompleted: false,
      });
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const key = `${viewYear}-${mStr}-${dStr}`;

      const isFuture = cellDate.getTime() > today.getTime();
      const isSelected = key === selectedDateKey;
      const isCurated = curatedDatesSet.has(key);
      const isCompleted = completedDatesSet.has(key);
      const isToday = key === todayKey;

      cells.push({
        day: d,
        dateKey: key,
        isFuture,
        isSelected,
        isCurated,
        isToday,
        isCompleted,
      });
    }

    return cells;
  }, [viewYear, viewMonth, today, todayKey, selectedDateKey, curatedDatesSet, completedDatesSet]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const isNextMonthDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (key: string, isFuture: boolean) => {
    if (isFuture) return;
    onSelectDate(key);
    onClose();
  };

  if (!visible) return null;

  // Clamp dropdown position so the 324px Figma calendar card never overflows viewport
  const cardWidth = Math.min(324, width - 24);
  const safeTop = Math.max(72, Math.min(topOffset, height - 430));
  const safeLeft =
    leftOffset !== undefined
      ? Math.max(12, Math.min(leftOffset, width - cardWidth - 12))
      : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, isMobile && styles.overlayMobile]}>
        {/* Dismiss backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Figma Design System Calendar Card */}
        <View
          style={[
            styles.card,
            {
              width: cardWidth,
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
            !isMobile
              ? {
                  position: 'absolute',
                  top: safeTop,
                  ...(safeLeft !== undefined ? { left: safeLeft } : { right: rightOffset }),
                }
              : {
                  position: 'absolute',
                  top: safeTop,
                  alignSelf: 'center',
                },
          ]}
        >
          {/* Figma Header Row: "Oct 2026" on Left, Nav Arrows on Right */}
          <View style={styles.headerRow}>
            <Text style={[styles.monthTitle, { color: theme.titleText }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <View style={styles.arrowsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.navBtn,
                  { backgroundColor: theme.arrowHoverBg },
                  pressed && { opacity: 0.7 },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                ]}
                onPress={handlePrevMonth}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <ChevronLeftIcon size={17} color={theme.arrowColor} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.navBtn,
                  { backgroundColor: theme.arrowHoverBg },
                  isNextMonthDisabled && styles.arrowDisabled,
                  pressed && !isNextMonthDisabled && { opacity: 0.7 },
                  Platform.OS === 'web' &&
                    ({ cursor: isNextMonthDisabled ? 'default' : 'pointer' } as object),
                ]}
                onPress={handleNextMonth}
                disabled={isNextMonthDisabled}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <ChevronRightIcon size={17} color={theme.arrowColor} />
              </Pressable>
            </View>
          </View>

          {/* Figma Weekdays Row: MO TU WE TH FR SA SU */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: theme.weekdayText }]}>
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Figma Circular Days Grid */}
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
                      !cell.isSelected &&
                        cell.isToday && { backgroundColor: theme.todayBg },
                      !cell.isSelected &&
                        cell.isCompleted &&
                        !cell.isToday && {
                          backgroundColor: isDark
                            ? 'rgba(58, 192, 160, 0.14)'
                            : PALETTE.support.success.light,
                        },
                      pressed && !cell.isSelected && !cell.isFuture && { opacity: 0.7 },
                      Platform.OS === 'web' &&
                        ({ cursor: cell.isFuture ? 'default' : 'pointer' } as object),
                    ]}
                    onPress={() => handleSelectDay(cell.dateKey, cell.isFuture)}
                    disabled={cell.isFuture}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: cell.isSelected
                            ? theme.selectedText
                            : cell.isToday
                            ? theme.todayText
                            : cell.isFuture
                            ? theme.dayTextDisabled
                            : cell.isCompleted
                            ? isDark
                              ? PALETTE.support.success.medium
                              : PALETTE.support.success.dark
                            : theme.dayText,
                        },
                      ]}
                    >
                      {cell.day}
                    </Text>

                    {/* Status Marker Dot / Check (Figma Bottom Dot Slot) */}
                    {cell.isCompleted ? (
                      <View style={styles.completedCheckIndicator}>
                        <Check
                          size={8}
                          color={cell.isSelected ? '#FFFFFF' : theme.completedDot}
                          strokeWidth={3}
                        />
                      </View>
                    ) : cell.isCurated ? (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: cell.isSelected
                              ? '#FFFFFF'
                              : theme.curatedDot,
                          },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Figma Legend Footer */}
          <View style={[styles.footerRow, { borderTopColor: theme.divider }]}>
            <View style={styles.footerIndicatorsRow}>
              <View style={styles.footerIndicatorItem}>
                <Check size={10} color={theme.completedDot} strokeWidth={3} />
                <Text style={[styles.legendText, { color: theme.weekdayText }]}>
                  Read
                </Text>
              </View>
              <View style={styles.footerIndicatorItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.curatedDot },
                  ]}
                />
                <Text style={[styles.legendText, { color: theme.weekdayText }]}>
                  Brief
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayMobile: {
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  arrowDisabled: {
    opacity: 0.3,
  },
  weekdaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11,
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 13.5,
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
  completedCheckIndicator: {
    position: 'absolute',
    bottom: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerIndicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});
