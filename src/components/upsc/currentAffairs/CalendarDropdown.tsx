import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react-native';
import { DAILY_EVENTS_DATA } from '@/data/currentAffairsData';

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

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarDropdown({
  visible,
  onClose,
  selectedDateKey,
  onSelectDate,
  topOffset = 180,
  rightOffset = 16,
  leftOffset,
  isDark = false,
  completedDates = [],
}: CalendarDropdownProps) {
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  // Today reference (2026-10-25)
  const today = useMemo(() => new Date(2026, 9, 25), []);

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
    return { year: 2026, month: 9, day: 25 };
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

  // Calendar cells
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday = 0, Sunday = 6
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
        dateKey: `empty-${i}`,
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
      const isToday =
        cellDate.getFullYear() === today.getFullYear() &&
        cellDate.getMonth() === today.getMonth() &&
        cellDate.getDate() === today.getDate();

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
  }, [viewYear, viewMonth, today, selectedDateKey, curatedDatesSet, completedDatesSet]);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Transparent dismiss backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Anchored Dropdown Menu Positioned Directly Below Calendar Button */}
        <View
          style={[
            styles.card,
            {
              position: 'absolute',
              top: topOffset,
              ...(leftOffset !== undefined ? { left: leftOffset } : { right: rightOffset }),
            },
          ]}
        >
          {/* Mini Month Navigator */}
          <View style={styles.monthHeader}>
            <Pressable
              style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressed]}
              onPress={handlePrevMonth}
              hitSlop={6}
            >
              <ChevronLeft size={14} color={isDark ? '#F8FAFC' : '#0F172A'} strokeWidth={2} />
            </Pressable>

            <View style={styles.monthTitleBox}>
              <CalendarIcon size={12} color={isDark ? '#38BDF8' : '#64748B'} strokeWidth={2} />
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.arrowBtn,
                isNextMonthDisabled && styles.arrowDisabled,
                pressed && !isNextMonthDisabled && styles.pressed,
              ]}
              onPress={handleNextMonth}
              disabled={isNextMonthDisabled}
              hitSlop={6}
            >
              <ChevronRight
                size={14}
                color={isNextMonthDisabled ? (isDark ? '#334155' : '#CBD5E1') : (isDark ? '#F8FAFC' : '#0F172A')}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          {/* Weekday Initials Row */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_INITIALS.map((init, i) => (
              <View key={i} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{init}</Text>
              </View>
            ))}
          </View>

          {/* Compact Day Grid */}
          <View style={styles.grid}>
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
              }

              return (
                <Pressable
                  key={cell.dateKey}
                  style={[
                    styles.dayCell,
                    cell.isSelected && styles.dayCellSelected,
                    cell.isToday && !cell.isSelected && styles.dayCellToday,
                    cell.isFuture && styles.dayCellFuture,
                  ]}
                  onPress={() => handleSelectDay(cell.dateKey, cell.isFuture)}
                  disabled={cell.isFuture}
                >
                  <Text
                    style={[
                      styles.dayText,
                      cell.isSelected && styles.dayTextSelected,
                      cell.isFuture && styles.dayTextFuture,
                    ]}
                  >
                    {cell.day}
                  </Text>

                  {cell.isCompleted ? (
                    <View style={styles.completedCheckIndicator}>
                      <Check size={8} color={cell.isSelected ? '#FFFFFF' : '#10B981'} strokeWidth={3} />
                    </View>
                  ) : cell.isCurated && !cell.isSelected ? (
                    <View style={styles.curatedDot} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Quick Shortcuts Footer */}
          <View style={styles.footerRow}>
            <Pressable
              style={[
                styles.quickPill,
                selectedDateKey === '2026-10-25' && styles.quickPillActive,
              ]}
              onPress={() => {
                onSelectDate('2026-10-25');
                onClose();
              }}
            >
              <Text
                style={[
                  styles.quickPillText,
                  selectedDateKey === '2026-10-25' && styles.quickPillTextActive,
                ]}
              >
                Today
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.quickPill,
                selectedDateKey === '2026-10-24' && styles.quickPillActive,
              ]}
              onPress={() => {
                onSelectDate('2026-10-24');
                onClose();
              }}
            >
              <Text
                style={[
                  styles.quickPillText,
                  selectedDateKey === '2026-10-24' && styles.quickPillTextActive,
                ]}
              >
                Yesterday
              </Text>
            </Pressable>

            <View style={styles.footerIndicatorsRow}>
              <View style={styles.footerIndicatorItem}>
                <Check size={9} color={isDark ? '#34D399' : '#10B981'} strokeWidth={3} />
                <Text style={styles.completedLegendText}>Read</Text>
              </View>
              <Text style={styles.editionIndicator}>
                ● Curated
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    card: {
      width: 268,
      backgroundColor: isDark ? '#111724' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1F2E45' : '#E2E8F0',
      padding: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    monthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1F2E45' : '#F1F5F9',
    },
    monthTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    monthTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : '#0F172A',
      letterSpacing: -0.1,
    },
    arrowBtn: {
      padding: 4,
      borderRadius: 5,
      backgroundColor: isDark ? '#17253B' : '#F8FAFC',
    },
    arrowDisabled: {
      opacity: 0.3,
    },
    pressed: {
      opacity: 0.6,
    },
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    weekdayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 2,
    },
    weekdayText: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#64748B' : '#94A3B8',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCellEmpty: {
      width: `${100 / 7}%`,
      height: 28,
    },
    dayCell: {
      width: `${100 / 7}%`,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
      position: 'relative',
      marginVertical: 1,
    },
    dayCellSelected: {
      backgroundColor: isDark ? '#38BDF8' : '#1E3A8A',
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: isDark ? '#38BDF8' : '#94A3B8',
    },
    dayCellFuture: {
      opacity: 0.2,
    },
    dayText: {
      fontSize: 11.5,
      fontWeight: '500',
      color: isDark ? '#E2E8F0' : '#1E293B',
    },
    dayTextSelected: {
      color: isDark ? '#041527' : '#FFFFFF',
      fontWeight: '700',
    },
    dayTextFuture: {
      color: isDark ? '#475569' : '#94A3B8',
    },
    curatedDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: isDark ? '#34D399' : '#10B981',
      position: 'absolute',
      bottom: 2,
    },
    completedCheckIndicator: {
      position: 'absolute',
      bottom: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1F2E45' : '#F1F5F9',
    },
    quickPill: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 5,
      backgroundColor: isDark ? '#17253B' : '#F1F5F9',
    },
    quickPillActive: {
      backgroundColor: isDark ? '#38BDF8' : '#1E3A8A',
    },
    quickPillText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#93C5FD' : '#475569',
    },
    quickPillTextActive: {
      color: isDark ? '#041527' : '#FFFFFF',
    },
    footerIndicatorsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    footerIndicatorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2.5,
    },
    completedLegendText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: isDark ? '#34D399' : '#10B981',
    },
    editionIndicator: {
      fontSize: 9.5,
      fontWeight: '600',
      color: isDark ? '#34D399' : '#10B981',
    },
  });
