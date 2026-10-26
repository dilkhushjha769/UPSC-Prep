import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  CalendarCheck,
  Check,
  Flame,
  HelpCircle,
  TrendingUp,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';
import { DayStudySummary } from '@/types/study';

interface StudyStreakCalendarProps {
  isDark: boolean;
}

export function StudyStreakCalendar({ isDark }: StudyStreakCalendarProps) {
  const { streak, weekDays, setIsStreakInfoModalOpen, config } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}>
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.flameIconContainer,
              { backgroundColor: isDark ? '#3B1D28' : '#FEF2F2' },
            ]}>
            <Flame size={20} color="#EF4444" fill="#EF4444" />
          </View>
          <View>
            <View style={styles.streakTitleRow}>
              <Text style={[styles.streakCountTitle, { color: colors.textPrimary }]}>
                {streak.currentStreak}-Day Streak
              </Text>
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor:
                      streak.currentStreak > 0 ? colors.accentEmerald : colors.textMuted,
                  },
                ]}>
                <Text style={styles.activeBadgeText}>
                  {streak.currentStreak > 0 ? 'ACTIVE' : 'START TODAY'}
                </Text>
              </View>
            </View>
            <Text style={[styles.streakSubtitle, { color: colors.textSecondary }]}>
              {streak.currentStreak >= 7
                ? '🔥 Outstanding momentum! Consistency is your competitive edge.'
                : 'Your consistency is building. Keep showing up every day.'}
            </Text>
          </View>
        </View>

        {/* Info button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsStreakInfoModalOpen(true)}
          style={[styles.infoBtn, { borderColor: colors.cardBorderSubtle }]}>
          <HelpCircle size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 7-Day Horizontal Scrollable Calendar */}
      <View style={styles.calendarSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScroll}>
          {weekDays.map((day: DayStudySummary) => {
            const hours = (day.totalMinutes / 60).toFixed(1);

            // Determine styling based on day status
            let itemBg = colors.cardBg;
            let itemBorder = colors.cardBorderSubtle;
            let dayColor = colors.textSecondary;
            let numColor = colors.textPrimary;

            if (day.isToday) {
              itemBg = colors.primarySoft;
              itemBorder = colors.primary;
              dayColor = colors.primary;
              numColor = colors.primary;
            } else if (day.isCompleted) {
              itemBg = isDark ? '#1E293B' : '#F8FAFC';
              itemBorder = isDark ? '#334155' : '#E2E8F0';
            } else if (day.isPast && !day.isCompleted) {
              itemBg = isDark ? '#121622' : '#FAFAFA';
              itemBorder = colors.cardBorderSubtle;
              dayColor = colors.textMuted;
              numColor = colors.textMuted;
            }

            return (
              <View
                key={day.dateStr}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: itemBg,
                    borderColor: itemBorder,
                  },
                ]}>
                {/* Day Abbreviation */}
                <Text style={[styles.dayText, { color: dayColor }]}>
                  {day.dayName}
                </Text>

                {/* Day Date Number */}
                <View
                  style={[
                    styles.dateCircle,
                    day.isToday && { backgroundColor: colors.primary },
                  ]}>
                  <Text
                    style={[
                      styles.dateNumber,
                      { color: day.isToday ? '#FFFFFF' : numColor },
                    ]}>
                    {day.dayNumber}
                  </Text>
                </View>

                {/* Status Indicator */}
                <View style={styles.statusIndicatorSlot}>
                  {day.isCompleted ? (
                    <View
                      style={[
                        styles.checkIndicator,
                        { backgroundColor: colors.accentEmerald },
                      ]}>
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : day.isToday ? (
                    <View
                      style={[
                        styles.todayIndicator,
                        { borderColor: colors.primary },
                      ]}>
                      <View
                        style={[
                          styles.todayDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                  ) : day.isPast ? (
                    <View
                      style={[
                        styles.missedIndicator,
                        { backgroundColor: colors.divider },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.futureIndicator,
                        { borderColor: colors.cardBorderSubtle },
                      ]}
                    />
                  )}
                </View>

                {/* Study Time Tag */}
                <Text
                  style={[
                    styles.minutesTag,
                    {
                      color: day.isCompleted ? colors.accentEmerald : colors.textMuted,
                    },
                  ]}>
                  {day.totalMinutes > 0 ? `${hours}h` : '—'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Streak Statistics Strip */}
      <View
        style={[
          styles.statsGrid,
          {
            backgroundColor: isDark ? '#141320' : '#FBFBFE',
            borderColor: colors.cardBorderSubtle,
          },
        ]}>
        {/* Metric 1: Current Streak */}
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <Flame size={13} color="#EF4444" />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Current
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {streak.currentStreak}{' '}
            <Text style={styles.statUnit}>days</Text>
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

        {/* Metric 2: Longest Streak */}
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <Award size={13} color={colors.accentAmber} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Longest
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {streak.longestStreak}{' '}
            <Text style={styles.statUnit}>days</Text>
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

        {/* Metric 3: Total Study Days */}
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <CalendarCheck size={13} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Days
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {streak.totalStudyDays}{' '}
            <Text style={styles.statUnit}>days</Text>
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

        {/* Metric 4: Weekly Consistency */}
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <TrendingUp size={13} color={colors.accentEmerald} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Consistency
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.accentEmerald }]}>
            {streak.weeklyConsistencyPercent}%
          </Text>
        </View>
      </View>

      {/* Qualification note footer */}
      <View style={styles.footerNoteRow}>
        <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
          * Qualifying study day requires at least {config.qualifyingStreakMinutes} minutes of focused study.
        </Text>
        <TouchableOpacity onPress={() => setIsStreakInfoModalOpen(true)}>
          <Text style={[styles.learnMoreText, { color: colors.primary }]}>
            Rules & FAQ
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flameIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakCountTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSection: {
    marginBottom: 16,
  },
  calendarScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  dayCard: {
    width: 60,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 104,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusIndicatorSlot: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  missedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  futureIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  minutesTag: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  footerNoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  footerNoteText: {
    fontSize: 11,
    fontWeight: '500',
  },
  learnMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
