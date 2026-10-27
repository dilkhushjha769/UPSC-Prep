import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { BW_THEME } from '@/constants/bwTheme';
import { aggregateDailyStudyMinutes, getLocalDateString } from '@/services/streakCalculator';

interface StreakCalendarModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
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

const WEEKDAY_NAMES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

interface CalendarDayItem {
  dateStr: string;
  dayNum: number;
  totalMinutes: number;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function StreakCalendarModal({
  isDark,
  isOpen,
  onClose,
}: StreakCalendarModalProps) {
  const { sessions, streak, config } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const todayStr = useMemo(() => getLocalDateString(), []);
  const today = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState<number>(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => today.getMonth());

  const dailyMinutesMap = useMemo(() => {
    return aggregateDailyStudyMinutes(sessions, todayStr);
  }, [sessions, todayStr]);

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

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const days: (CalendarDayItem | null)[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${viewYear}-${mStr}-${dStr}`;
      const totalMinutes = dailyMinutesMap.get(dateStr) || 0;
      const isCompleted = totalMinutes >= config.qualifyingStreakMinutes;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      days.push({
        dateStr,
        dayNum: day,
        totalMinutes,
        isCompleted,
        isToday,
        isFuture,
      });
    }

    return days;
  }, [viewYear, viewMonth, dailyMinutesMap, config.qualifyingStreakMinutes, todayStr]);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#141722' : '#FFFFFF',
              borderColor: isDark ? '#252B3B' : '#E2E8F0',
            },
            Platform.OS === 'web' && ({
              boxShadow: isDark
                ? '0 12px 36px rgba(0, 0, 0, 0.55)'
                : '0 8px 30px rgba(0, 0, 0, 0.08)',
            } as object),
          ]}>
          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.titleGroup}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Streak History
              </Text>
              <View
                style={[
                  styles.streakBadge,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.28)' : '#FDE68A',
                  },
                ]}>
                <Flame size={11} color="#D97706" fill="#FBBF24" />
                <Text style={[styles.streakBadgeText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                  {streak.currentStreak}d streak
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1F2024' : '#F8F9FE',
                  borderColor: isDark ? '#494A50' : '#E8E9F1',
                },
              ]}>
              <X size={14} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              style={[
                styles.navArrow,
                { borderColor: isDark ? '#494A50' : '#E8E9F1' },
              ]}>
              <ChevronLeft size={15} color={theme.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.monthLabel, { color: theme.textPrimary }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              style={[
                styles.navArrow,
                { borderColor: isDark ? '#494A50' : '#E8E9F1' },
              ]}>
              <ChevronRight size={15} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((name, i) => (
              <Text
                key={`${name}-${i}`}
                style={[styles.weekdayText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                {name}
              </Text>
            ))}
          </View>

          {/* 7-Col Clean Refined Calendar Grid */}
          <View style={styles.grid}>
            {calendarDays.map((item, idx) => {
              if (!item) {
                return <View key={`empty-${idx}`} style={styles.daySlot} />;
              }

              const isMissed = !item.isCompleted && !item.isToday && !item.isFuture;

              let circleBg = 'transparent';
              let circleBorder = 'transparent';
              let numColor = isDark ? '#94A3B8' : '#64748B';

              if (item.isCompleted) {
                circleBg = isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5';
                circleBorder = isDark ? 'rgba(52, 211, 153, 0.35)' : '#A7F3D0';
                numColor = isDark ? '#34D399' : '#059669';
              } else if (item.isToday) {
                circleBorder = isDark ? '#FFFFFF' : '#09090B';
                numColor = theme.textPrimary;
              } else if (isMissed) {
                numColor = isDark ? '#64748B' : '#94A3B8';
              }

              return (
                <View key={item.dateStr} style={styles.daySlot}>
                  <View
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: circleBg,
                        borderColor: circleBorder,
                        opacity: item.isFuture ? 0.22 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: numColor,
                          fontWeight: item.isCompleted || item.isToday ? '700' : '500',
                        },
                      ]}>
                      {item.dayNum}
                    </Text>

                    {/* Subtle status dot indicator */}
                    {item.isCompleted && (
                      <View
                        style={[
                          styles.dotIndicator,
                          { backgroundColor: isDark ? '#34D399' : '#059669' },
                        ]}
                      />
                    )}
                    {isMissed && (
                      <View
                        style={[
                          styles.dotIndicator,
                          { backgroundColor: isDark ? '#EF4444' : '#DC2626', opacity: 0.65 },
                        ]}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Minimal Bottom Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: isDark ? '#34D399' : '#059669' },
                ]}
              />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                Done
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: isDark ? '#EF4444' : '#DC2626', opacity: 0.75 },
                ]}
              />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                Missed
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.todayDot,
                  { borderColor: isDark ? '#FFFFFF' : '#09090B' },
                ]}
              />
              <Text style={[styles.legendText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                Today
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  navArrow: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 11.5,
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.12)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.2,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});
