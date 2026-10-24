import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  Flame,
  Play,
  Plus,
  X,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { DayStudySummary, StudySession } from '@/types/study';
import { ExamReadinessCard } from './ExamReadinessCard';
import { PrelimsCountdownCard } from './PrelimsCountdownCard';
import { StreakCalendarModal } from './modals/StreakCalendarModal';

interface CleanStreakDashboardProps {
  isDark: boolean;
}

export function CleanStreakDashboard({ isDark }: CleanStreakDashboardProps) {
  const {
    streak,
    weekDays,
    sessions,
    setIsFocusModalOpen,
    setIsLogModalOpen,
    setIsStreakInfoModalOpen,
    config,
  } = useStudy();

  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 860;

  // Today's date string
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isStreakCalendarModalOpen, setIsStreakCalendarModalOpen] = useState(false);

  // Active day and its sessions (only populated when a day is selected)
  const activeDay: DayStudySummary | undefined = selectedDate
    ? weekDays.find((d) => d.dateStr === selectedDate)
    : undefined;

  const activeDaySessions: StudySession[] = activeDay
    ? sessions.filter((s) => s.date === activeDay.dateStr)
    : [];

  const formatLongDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatHoursMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingBottom: isDesktop ? 60 : 100 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Top Greeting & Action Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {todayDateStr}
          </Text>
          <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
            {config.aspirantName}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFocusModalOpen(true)}
            style={[styles.actionPillPrimary, { backgroundColor: theme.buttonPrimaryBg }]}>
            <Play
              size={12}
              color={theme.buttonPrimaryText}
              fill={theme.buttonPrimaryText}
            />
            <Text
              style={[
                styles.actionPillPrimaryText,
                { color: theme.buttonPrimaryText },
              ]}>
              Focus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsLogModalOpen(true)}
            style={[
              styles.actionPillSecondary,
              {
                backgroundColor: theme.buttonSecondaryBg,
                borderColor: theme.buttonSecondaryBorder,
              },
            ]}>
            <Plus size={13} color={theme.textPrimary} />
            <Text style={[styles.actionPillSecondaryText, { color: theme.textPrimary }]}>
              Notes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================= */}
      {/* UPSC PRELIMS COUNTDOWN TIMER (Compact Top Banner)         */}
      {/* ========================================================= */}
      <PrelimsCountdownCard isDark={isDark} />

      {/* ========================================================= */}
      {/* HERO STREAK CARD (The Core Focus of the Dashboard)        */}
      {/* ========================================================= */}
      <View
        style={[
          styles.streakHeroCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        {/* Streak Top Row with Yellow Glowing Flame */}
        <View style={styles.streakTopRow}>
          <View>
            <Text style={[styles.streakSubLabel, { color: theme.textSecondary }]}>
              CURRENT STREAK
            </Text>
            <View style={styles.flameRow}>
              {/* Premium Yellow/Amber Flame inside soft glow badge */}
              <View
                style={[
                  styles.flameAura,
                  {
                    backgroundColor: theme.flameGlow,
                    borderColor: theme.flameBorder,
                  },
                ]}>
                <Flame size={30} color="#D97706" fill="#FBBF24" />
              </View>
              <Text style={[styles.streakBigNumber, { color: theme.textPrimary }]}>
                {streak.currentStreak}
              </Text>
              <Text style={[styles.streakDaysUnit, { color: theme.textSecondary }]}>
                DAYS
              </Text>
            </View>
          </View>

          {/* Calendar Icon Button: View Previous Streak History */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setIsStreakCalendarModalOpen(true)}
            style={[
              styles.streakCalendarBtn,
              {
                backgroundColor: isDark ? '#1C202B' : '#F4F4F5',
                borderColor: isDark ? '#2D3444' : '#E4E4E7',
              },
            ]}>
            <Calendar size={14} color={isDark ? '#FFFFFF' : '#09090B'} />
            <Text style={[styles.streakCalendarBtnText, { color: theme.textPrimary }]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>

        {/* 7-Day Consistency Week Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeaderRow}>
            <Text style={[styles.sectionMicroHeader, { color: theme.textSecondary }]}>
              WEEKLY CONSISTENCY
            </Text>
          </View>

          <View style={styles.weekGrid}>
            {weekDays.map((day: DayStudySummary) => {
              const isToday = day.isToday;
              const isDone = day.isCompleted;
              const isSelected = selectedDate === day.dateStr;
              const hours = (day.totalMinutes / 60).toFixed(1);

              return (
                <TouchableOpacity
                  key={day.dateStr}
                  activeOpacity={0.75}
                  onPress={() =>
                    setSelectedDate((prev) => (prev === day.dateStr ? null : day.dateStr))
                  }
                  style={[
                    styles.dayBox,
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#232938'
                          : '#EFF6FF'
                        : isToday
                        ? theme.activeBg
                        : isDone
                        ? isDark
                          ? '#1C202B'
                          : '#F8FAFC'
                        : 'transparent',
                      borderColor: isSelected
                        ? theme.cardBorderActive
                        : isToday
                        ? theme.cardBorderHover
                        : theme.cardBorder,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}>
                  {/* Selected Indicator Pill */}
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedTopBar,
                        { backgroundColor: theme.cardBorderActive },
                      ]}
                    />
                  )}

                  <Text
                    style={[
                      styles.dayLetter,
                      {
                        color: isSelected
                          ? theme.textPrimary
                          : isToday
                          ? theme.textPrimary
                          : theme.textSecondary,
                        fontWeight: isSelected || isToday ? '800' : '600',
                      },
                    ]}>
                    {day.dayName}
                  </Text>

                  {/* Day Indicator Circle: Green Tick for Done, Red Cross for Losing/Missed */}
                  {(() => {
                    const isMissed = !isDone && !isToday && !day.isFuture;

                    let circleBg = 'transparent';
                    let circleBorder = theme.cardBorder;
                    let borderWidth = 1;

                    if (isDone) {
                      circleBg = isDark ? '#059669' : '#10B981';
                      circleBorder = isDark ? '#10B981' : '#059669';
                    } else if (isMissed) {
                      circleBg = isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2';
                      circleBorder = isDark ? '#EF4444' : '#FCA5A5';
                    } else if (isToday) {
                      circleBorder = isDark ? '#FFFFFF' : '#09090B';
                      borderWidth = 2;
                    }

                    return (
                      <View
                        style={[
                          styles.dayCircle,
                          {
                            backgroundColor: circleBg,
                            borderColor: circleBorder,
                            borderWidth,
                          },
                        ]}>
                        {isDone ? (
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        ) : isMissed ? (
                          <X size={11} color={isDark ? '#F87171' : '#DC2626'} strokeWidth={2.8} />
                        ) : (
                          <Text
                            style={[
                              styles.dayNumText,
                              {
                                color: isToday ? theme.textPrimary : theme.textMuted,
                              },
                            ]}>
                            {day.dayNumber}
                          </Text>
                        )}
                      </View>
                    );
                  })()}

                  <Text
                    style={[
                      styles.dayHoursText,
                      {
                        color: isDone
                          ? isSelected
                            ? theme.textPrimary
                            : isDark
                            ? '#E2E8F0'
                            : '#0F172A'
                          : theme.textMuted,
                        fontWeight: isDone ? '700' : '500',
                      },
                    ]}>
                    {day.totalMinutes > 0 ? `${hours}h` : '—'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================= */}
        {/* CLEAN, MINIMAL DAY BREAKDOWN (Visible on tap, toggled off on re-tap) */}
        {/* ========================================================= */}
        {Boolean(selectedDate && activeDay) && (
          <View
            style={[
              styles.cleanDetailSection,
              {
                borderTopColor: theme.cardBorder,
              },
            ]}>
            {/* Header Row */}
            <View style={styles.cleanDetailHeader}>
              <View style={styles.cleanDetailHeaderLeft}>
                <Text style={[styles.cleanDateTitle, { color: theme.textPrimary }]}>
                  {formatLongDate(activeDay?.dateStr)}
                </Text>
                {activeDay?.isToday && (
                  <View
                    style={[
                      styles.cleanTodayBadge,
                      { backgroundColor: isDark ? '#232938' : '#E2E8F0' },
                    ]}>
                    <Text style={[styles.cleanTodayBadgeText, { color: theme.textPrimary }]}>
                      TODAY
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cleanDetailHeaderRight}>
                <Text style={[styles.cleanTotalTime, { color: theme.textSecondary }]}>
                  {activeDay?.totalMinutes ? formatHoursMinutes(activeDay.totalMinutes) : '0m'}
                </Text>
                {activeDay?.isCompleted && (
                  <View style={styles.cleanQualifiedRow}>
                    <Check size={12} color="#10B981" strokeWidth={3} />
                    <Text style={styles.cleanQualifiedText}>Qualified</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Clean List Items (Hairline row dividers, no nested cards or cheesy quotes) */}
            {activeDaySessions.length > 0 ? (
              <View style={styles.cleanItemsList}>
                {activeDaySessions.map((session, index) => {
                  const isLast = index === activeDaySessions.length - 1;
                  return (
                    <View
                      key={session.id}
                      style={[
                        styles.cleanItemRow,
                        !isLast && {
                          borderBottomColor: theme.cardBorder,
                          borderBottomWidth: 1,
                        },
                      ]}>
                      <View style={styles.cleanItemMain}>
                        <Text style={[styles.cleanSubjectText, { color: theme.textPrimary }]}>
                          {session.subject}
                        </Text>
                        <Text
                          style={[styles.cleanTopicText, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          {session.topic}
                        </Text>
                      </View>

                      <Text style={[styles.cleanDurationText, { color: theme.textSecondary }]}>
                        {formatHoursMinutes(session.durationMinutes)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.cleanEmptyState}>
                <Text style={[styles.cleanEmptyText, { color: theme.textMuted }]}>
                  {activeDay?.isToday
                    ? 'No study sessions logged today.'
                    : 'No study recorded on this day.'}
                </Text>
                {activeDay?.isToday && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsFocusModalOpen(true)}
                    style={[
                      styles.cleanStartBtn,
                      { backgroundColor: theme.buttonPrimaryBg },
                    ]}>
                    <Play
                      size={11}
                      color={theme.buttonPrimaryText}
                      fill={theme.buttonPrimaryText}
                    />
                    <Text
                      style={[
                        styles.cleanStartBtnText,
                        { color: theme.buttonPrimaryText },
                      ]}>
                      Start Focus
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* 4 Metric Stats Strip */}
        <View
          style={[
            styles.statsStrip,
            {
              borderTopColor: theme.cardBorder,
              backgroundColor: isDark ? '#141720' : '#F8FAFC',
            },
          ]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsStreakInfoModalOpen(true)}
            style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Current
            </Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {streak.currentStreak}d
            </Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsStreakInfoModalOpen(true)}
            style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Longest
            </Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {streak.longestStreak}d
            </Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsStreakInfoModalOpen(true)}
            style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Total Days
            </Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {streak.totalStudyDays}d
            </Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsStreakInfoModalOpen(true)}
            style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Consistency
            </Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {streak.weeklyConsistencyPercent}%
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================= */}
      {/* EXAM READINESS & ALL INDIA RANK SECTION                   */}
      {/* ========================================================= */}
      <ExamReadinessCard isDark={isDark} />

      {/* Monthly Streak History Calendar Modal */}
      <StreakCalendarModal
        isDark={isDark}
        isOpen={isStreakCalendarModalOpen}
        onClose={() => setIsStreakCalendarModalOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 160,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionPillPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionPillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  streakTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  streakCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakCalendarBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  streakSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  flameAura: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBigNumber: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 48,
  },
  streakDaysUnit: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calendarSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionMicroHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedTopBar: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  dayLetter: {
    fontSize: 11,
  },
  dayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayHoursText: {
    fontSize: 10,
  },

  /* Ultra-clean minimal day breakdown */
  cleanDetailSection: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  cleanDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cleanDetailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cleanDateTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cleanTodayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cleanTodayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cleanDetailHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cleanTotalTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  cleanQualifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cleanQualifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  cleanItemsList: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  cleanItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  cleanItemMain: {
    flex: 1,
    gap: 2,
  },
  cleanSubjectText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  cleanTopicText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  cleanDurationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cleanEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  cleanEmptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cleanStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  cleanStartBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* 4 Metric stats */
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});
