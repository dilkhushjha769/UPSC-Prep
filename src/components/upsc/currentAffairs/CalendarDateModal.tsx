import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { DAILY_EVENTS_DATA } from '@/data/currentAffairsData';

interface CalendarDateModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  isDark?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarDateModal({
  visible,
  onClose,
  selectedDateKey,
  onSelectDate,
  isDark = true,
}: CalendarDateModalProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  // Today reference (2026-10-25)
  const today = useMemo(() => new Date(2026, 9, 25), []);

  // Selected date components
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

  // View state for browsing month/year
  const [viewYear, setViewYear] = useState<number>(parsedSelected.year);
  const [viewMonth, setViewMonth] = useState<number>(parsedSelected.month);
  const [prevSelectedKey, setPrevSelectedKey] = useState<string>(selectedDateKey);

  // Sync view when selectedDateKey changes without effect cascading renders
  if (prevSelectedKey !== selectedDateKey) {
    setPrevSelectedKey(selectedDateKey);
    setViewYear(parsedSelected.year);
    setViewMonth(parsedSelected.month);
  }

  // Known curated date keys set for quick dot indicator
  const curatedDatesSet = useMemo(() => {
    return new Set(DAILY_EVENTS_DATA.map((d) => d.dateKey));
  }, []);

  // Calendar matrix calculation
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // In JS getDay(): 0 is Sunday, 1 is Monday... 6 is Saturday
    // Convert to Monday = 0, Sunday = 6
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const cells: {
      day: number | null;
      dateKey: string;
      isFuture: boolean;
      isSelected: boolean;
      isCurated: boolean;
      isToday: boolean;
    }[] = [];

    // Empty cells before first day
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({
        day: null,
        dateKey: `empty-${i}`,
        isFuture: false,
        isSelected: false,
        isCurated: false,
        isToday: false,
      });
    }

    // Actual day cells
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const key = `${viewYear}-${mStr}-${dStr}`;

      const isFuture = cellDate.getTime() > today.getTime();
      const isSelected = key === selectedDateKey;
      const isCurated = curatedDatesSet.has(key);
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
      });
    }

    return cells;
  }, [viewYear, viewMonth, today, selectedDateKey, curatedDatesSet]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentOrFutureMonth =
      viewYear > today.getFullYear() ||
      (viewYear === today.getFullYear() && viewMonth >= today.getMonth());
    if (isCurrentOrFutureMonth) return;

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isNextMonthDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const handleSelectDay = (key: string, isFuture: boolean) => {
    if (isFuture) return;
    onSelectDate(key);
    onClose();
  };

  const handleQuickSelect = (dateStr: string) => {
    onSelectDate(dateStr);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconBox}>
                <CalendarIcon size={18} color={theme.textPrimary} strokeWidth={1.8} />
              </View>
              <View>
                <Text style={styles.titleText}>Select Archive Date</Text>
                <Text style={styles.subtitleText}>Choose any past date for daily current affairs</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={18} color={theme.textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Quick Shortcuts */}
          <View style={styles.shortcutsRow}>
            <Pressable
              style={[
                styles.shortcutPill,
                selectedDateKey === '2026-10-25' && styles.shortcutPillActive,
              ]}
              onPress={() => handleQuickSelect('2026-10-25')}
            >
              <Text
                style={[
                  styles.shortcutText,
                  selectedDateKey === '2026-10-25' && styles.shortcutTextActive,
                ]}
              >
                Today (25 Oct)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.shortcutPill,
                selectedDateKey === '2026-10-24' && styles.shortcutPillActive,
              ]}
              onPress={() => handleQuickSelect('2026-10-24')}
            >
              <Text
                style={[
                  styles.shortcutText,
                  selectedDateKey === '2026-10-24' && styles.shortcutTextActive,
                ]}
              >
                Yesterday (24 Oct)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.shortcutPill,
                selectedDateKey === '2026-10-19' && styles.shortcutPillActive,
              ]}
              onPress={() => handleQuickSelect('2026-10-19')}
            >
              <Text
                style={[
                  styles.shortcutText,
                  selectedDateKey === '2026-10-19' && styles.shortcutTextActive,
                ]}
              >
                Week Start (19 Oct)
              </Text>
            </Pressable>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNavigator}>
            <Pressable
              style={({ pressed }) => [styles.navArrowBtn, pressed && styles.pressed]}
              onPress={handlePrevMonth}
              hitSlop={8}
            >
              <ChevronLeft size={18} color={theme.textPrimary} strokeWidth={2} />
            </Pressable>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.navArrowBtn,
                isNextMonthDisabled && styles.navArrowDisabled,
                pressed && !isNextMonthDisabled && styles.pressed,
              ]}
              onPress={handleNextMonth}
              disabled={isNextMonthDisabled}
              hitSlop={8}
            >
              <ChevronRight
                size={18}
                color={isNextMonthDisabled ? theme.textMuted : theme.textPrimary}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          {/* Weekday Names Header */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((name) => (
              <View key={name} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
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
                      styles.dayCellText,
                      cell.isSelected && styles.dayCellTextSelected,
                      cell.isFuture && styles.dayCellTextFuture,
                    ]}
                  >
                    {cell.day}
                  </Text>

                  {/* Indicator Dot for Curated Editions */}
                  {cell.isCurated && (
                    <View
                      style={[
                        styles.curatedDot,
                        cell.isSelected && styles.curatedDotSelected,
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Legend and Footer */}
          <View style={styles.modalFooter}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={styles.legendDotActive} />
                <Text style={styles.legendText}>Curated Edition</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendDotSelected} />
                <Text style={styles.legendText}>Selected Date</Text>
              </View>
            </View>

            <Text style={styles.selectedDisplay}>
              Selected: <Text style={styles.selectedDisplayBold}>{selectedDateKey}</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: typeof BW_THEME.dark, isDark: boolean, isDesktop: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: isDark ? '#141414' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E5E5E5',
      padding: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      marginBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    titleText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    subtitleText: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      padding: 4,
    },
    pressed: {
      opacity: 0.7,
    },
    shortcutsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
      flexWrap: 'wrap',
    },
    shortcutPill: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: isDark ? '#1C1C1C' : '#F0F0F0',
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    shortcutPillActive: {
      backgroundColor: theme.textPrimary,
      borderColor: theme.textPrimary,
    },
    shortcutText: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    shortcutTextActive: {
      color: isDark ? '#000000' : '#FFFFFF',
      fontWeight: '600',
    },
    monthNavigator: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 6,
      marginBottom: 8,
      backgroundColor: isDark ? '#181818' : '#FAFAFA',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    navArrowBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isDark ? '#222222' : '#EEEEEE',
    },
    navArrowDisabled: {
      opacity: 0.25,
    },
    monthYearTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.1,
    },
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: 6,
      paddingHorizontal: 2,
    },
    weekdayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    weekdayText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -2,
    },
    dayCellEmpty: {
      width: `${100 / 7}%`,
      aspectRatio: 1.1,
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1.1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
      marginVertical: 2,
      position: 'relative',
    },
    dayCellSelected: {
      backgroundColor: theme.textPrimary,
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    dayCellFuture: {
      opacity: 0.25,
    },
    dayCellText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    dayCellTextSelected: {
      color: isDark ? '#000000' : '#FFFFFF',
      fontWeight: '700',
    },
    dayCellTextFuture: {
      color: theme.textMuted,
    },
    curatedDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#10B981', // subtle green dot for curated
      position: 'absolute',
      bottom: 4,
    },
    curatedDotSelected: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    modalFooter: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    legendRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDotActive: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    legendDotSelected: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textPrimary,
    },
    legendText: {
      fontSize: 10,
      color: theme.textMuted,
    },
    selectedDisplay: {
      fontSize: 11,
      color: theme.textMuted,
    },
    selectedDisplayBold: {
      fontWeight: '600',
      color: theme.textPrimary,
    },
  });
}
