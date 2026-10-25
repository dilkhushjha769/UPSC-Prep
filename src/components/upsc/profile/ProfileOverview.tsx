import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Award,
  BookOpen,
  Clock,
  Compass,
  Flame,
  Globe,
  MapPin,
  Target,
  Trophy,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface ProfileOverviewProps {
  isDark: boolean;
  onNavigateToTab?: (tabKey: 'analytics' | 'settings' | 'leaderboard') => void;
}

export function ProfileOverview({ isDark, onNavigateToTab }: ProfileOverviewProps) {
  const {
    config,
    metrics,
    streak,
    todayTotalMinutes,
    todayGoalMinutes,
    todayProgressPercent,
  } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isMobile = width < 720;

  const attemptedCount = metrics.mcqsAttempted || 35;
  const correctCount = metrics.mcqsCorrect || 29;
  const liveAccuracy = ((correctCount / attemptedCount) * 100).toFixed(1);

  const targetYear = config.targetExamYear || 2027;

  // Format today's study minutes
  const todayHrs = Math.floor(todayTotalMinutes / 60);
  const todayMins = todayTotalMinutes % 60;
  const goalHrs = (todayGoalMinutes / 60).toFixed(1);

  // Avatar initials
  const initials = (config.aspirantName || 'Aspirant')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');

  // Target year countdown estimation
  const examDate = new Date(config.targetExamDate || `${targetYear}-05-23`);
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const syllabusPercent = config.syllabusCompletionPercent ?? 68;

  return (
    <View style={styles.container}>
      {/* 1. Main Aspirant Identity Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.heroRow}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.avatarText, { color: theme.buttonPrimaryText }]}>
              {initials}
            </Text>
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.aspirantName, { color: theme.textPrimary }]} numberOfLines={1}>
                {config.aspirantName || 'Aspirant'}
              </Text>
              <View
                style={[
                  styles.stageBadge,
                  {
                    backgroundColor: isDark ? '#232733' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.stageBadgeText, { color: theme.textPrimary }]}>
                  {config.preparationStage || 'Prelims Intensive'}
                </Text>
              </View>
            </View>

            <View style={styles.placeRow}>
              <MapPin size={13} color={theme.textMuted} />
              <Text style={[styles.placeText, { color: theme.textSecondary }]}>
                {config.place || 'New Delhi, India'}
              </Text>
            </View>

            <Text style={[styles.cycleSubtitle, { color: theme.textMuted }]}>
              {config.examPhase || `UPSC CSE ${targetYear}`}
            </Text>
          </View>
        </View>

        {/* Chips for Key Aspirant Details */}
        <View style={[styles.chipsWrap, { borderTopColor: theme.divider }]}>
          <View style={[styles.chip, { backgroundColor: isDark ? '#141416' : '#F8FAFC', borderColor: theme.cardBorder }]}>
            <Target size={12} color={theme.textPrimary} />
            <Text style={[styles.chipText, { color: theme.textPrimary }]}>
              Target {targetYear} • {diffDays}d left
            </Text>
          </View>

          <View style={[styles.chip, { backgroundColor: isDark ? '#141416' : '#F8FAFC', borderColor: theme.cardBorder }]}>
            <BookOpen size={12} color={theme.textPrimary} />
            <Text style={[styles.chipText, { color: theme.textPrimary }]}>
              {config.optionalSubject || 'Geography'}
            </Text>
          </View>

          <View style={[styles.chip, { backgroundColor: isDark ? '#141416' : '#F8FAFC', borderColor: theme.cardBorder }]}>
            <Globe size={12} color={theme.textPrimary} />
            <Text style={[styles.chipText, { color: theme.textPrimary }]}>
              {config.medium || 'English'}
            </Text>
          </View>

          <View style={[styles.chip, { backgroundColor: isDark ? '#141416' : '#F8FAFC', borderColor: theme.cardBorder }]}>
            <Compass size={12} color={theme.textPrimary} />
            <Text style={[styles.chipText, { color: theme.textPrimary }]}>
              {config.preparationStage || 'Prelims Intensive'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Today's Study Goal & Streak Consistency */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTitleRow}>
            <Clock size={17} color={theme.textPrimary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Today&apos;s Goal & Streak
            </Text>
          </View>
          <Text style={[styles.cardHeaderBadge, { color: theme.textSecondary }]}>
            {todayProgressPercent}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.goalProgressSection}>
          <View style={styles.goalLabelsRow}>
            <Text style={[styles.goalProgressText, { color: theme.textPrimary }]}>
              {todayHrs}h {todayMins}m
            </Text>
            <Text style={[styles.goalTargetText, { color: theme.textSecondary }]}>
              Goal: {goalHrs}h
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#232733' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.textPrimary,
                  width: `${Math.min(100, todayProgressPercent)}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* 4-Item Streak Stats */}
        <View
          style={[
            styles.streakStatsRow,
            {
              backgroundColor: isDark ? '#0F1014' : '#FAFAFA',
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.streakCol}>
            <View style={styles.streakIconRow}>
              <Flame size={14} color={theme.textPrimary} />
              <Text style={[styles.streakValue, { color: theme.textPrimary }]}>
                {streak.currentStreak}d
              </Text>
            </View>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Current</Text>
          </View>

          <View style={[styles.vDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.streakCol}>
            <Text style={[styles.streakValue, { color: theme.textPrimary }]}>
              {streak.longestStreak}d
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Best</Text>
          </View>

          <View style={[styles.vDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.streakCol}>
            <Text style={[styles.streakValue, { color: theme.textPrimary }]}>
              {streak.totalStudyDays}d
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Total</Text>
          </View>

          <View style={[styles.vDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.streakCol}>
            <Text style={[styles.streakValue, { color: theme.textPrimary }]}>
              {streak.weeklyConsistencyPercent}%
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Rate</Text>
          </View>
        </View>
      </View>

      {/* 4. Syllabus Completion Snapshot */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTitleRow}>
            <Award size={17} color={theme.textPrimary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Syllabus
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigateToTab?.('analytics')}>
            <Text style={[styles.editLink, { color: theme.textSecondary }]}>
              Breakdown →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.syllabusOverviewRow, width < 480 && { flexDirection: 'column', alignItems: 'stretch' }]}>
          <View
            style={[
              styles.syllabusBigGauge,
              {
                backgroundColor: isDark ? '#141416' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.syllabusBigGaugeNum, { color: theme.textPrimary }]}>
              {syllabusPercent}%
            </Text>
            <Text style={[styles.syllabusBigGaugeLbl, { color: theme.textMuted }]}>
              Completed
            </Text>
          </View>

          <View style={styles.syllabusMiniBarsCol}>
            <View style={styles.miniBarRow}>
              <Text style={[styles.miniBarTitle, { color: theme.textSecondary }]}>GS 1–4</Text>
              <Text style={[styles.miniBarPercent, { color: theme.textPrimary }]}>71%</Text>
            </View>
            <View style={[styles.miniBarTrack, { backgroundColor: isDark ? '#232733' : '#E2E8F0' }]}>
              <View style={[styles.miniBarFill, { width: '71%', backgroundColor: theme.textPrimary }]} />
            </View>

            <View style={[styles.miniBarRow, { marginTop: 8 }]}>
              <Text style={[styles.miniBarTitle, { color: theme.textSecondary }]}>CSAT</Text>
              <Text style={[styles.miniBarPercent, { color: theme.textPrimary }]}>85%</Text>
            </View>
            <View style={[styles.miniBarTrack, { backgroundColor: isDark ? '#232733' : '#E2E8F0' }]}>
              <View style={[styles.miniBarFill, { width: '85%', backgroundColor: theme.textPrimary }]} />
            </View>

            <View style={[styles.miniBarRow, { marginTop: 8 }]}>
              <Text style={[styles.miniBarTitle, { color: theme.textSecondary }]}>Optional</Text>
              <Text style={[styles.miniBarPercent, { color: theme.textPrimary }]}>55%</Text>
            </View>
            <View style={[styles.miniBarTrack, { backgroundColor: isDark ? '#232733' : '#E2E8F0' }]}>
              <View style={[styles.miniBarFill, { width: '55%', backgroundColor: theme.textPrimary }]} />
            </View>
          </View>
        </View>
      </View>

      {/* 5. Exam Performance & Leaderboard Snapshot */}
      <View style={[styles.twoColumnGrid, isMobile && { flexDirection: 'column' }]}>
        {/* Exam Performance Card */}
        <View
          style={[
            styles.cardHalf,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Target size={16} color={theme.textPrimary} />
              <Text style={[styles.cardTitleSmall, { color: theme.textPrimary }]}>
                Exam Performance
              </Text>
            </View>
            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: isDark ? '#1C2029' : '#F1F5F9',
                  borderColor: theme.cardBorder,
                },
              ]}>
              <Text style={[styles.liveBadgeText, { color: theme.textPrimary }]}>
                Live
              </Text>
            </View>
          </View>

          <View style={styles.perfItem}>
            <Text style={[styles.perfLabel, { color: theme.textMuted }]}>MOCK AVERAGE</Text>
            <Text style={[styles.perfVal, { color: theme.textPrimary }]}>
              {config.mockAverageScore || 108.5} <Text style={styles.perfUnit}>/ 200</Text>
            </Text>
            <Text style={[styles.perfSub, { color: theme.textSecondary }]}>
              Cutoff ~88 marks
            </Text>
          </View>

          <View style={[styles.hDivider, { backgroundColor: theme.divider }]} />

          <View style={styles.perfItem}>
            <Text style={[styles.perfLabel, { color: theme.textMuted }]}>MCQs SOLVED</Text>
            <Text style={[styles.perfVal, { color: theme.textPrimary }]}>
              {attemptedCount} <Text style={styles.perfUnit}>MCQs ({correctCount} correct)</Text>
            </Text>
            <Text style={[styles.perfSub, { color: theme.textSecondary }]}>
              Accuracy: {liveAccuracy}% • Mains: {metrics.mainsAnswersWritten || 2}
            </Text>
          </View>
        </View>

        {/* Leaderboard Standing Card */}
        <View
          style={[
            styles.cardHalf,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Trophy size={16} color={theme.textPrimary} />
              <Text style={[styles.cardTitleSmall, { color: theme.textPrimary }]}>
                Leaderboard
              </Text>
            </View>
          </View>

          <View style={styles.perfItem}>
            <Text style={[styles.perfLabel, { color: theme.textMuted }]}>Standing</Text>
            <Text style={[styles.perfVal, { color: theme.textPrimary }]}>
              Rank #5 <Text style={styles.perfUnit}>/ 1,280</Text>
            </Text>
            <Text style={[styles.perfSub, { color: theme.textSecondary }]}>
              Top 2% consistency
            </Text>
          </View>

          <View style={[styles.hDivider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigateToTab?.('leaderboard')}
            style={[
              styles.leaderboardBtn,
              {
                backgroundColor: isDark ? '#20242E' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.leaderboardBtnText, { color: theme.textPrimary }]}>
              View Leaderboard →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  aspirantName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cycleSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: '800',
  },
  liveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardHeaderBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  editLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  eligibilityGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  eligibilityCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  vDivider: {
    width: 1,
    height: 32,
  },
  hDivider: {
    height: 1,
    marginVertical: 4,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  statusBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  goalProgressSection: {
    gap: 8,
  },
  goalLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgressText: {
    fontSize: 15,
    fontWeight: '800',
  },
  goalTargetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  streakCol: {
    alignItems: 'center',
    gap: 2,
  },
  streakIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  syllabusOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  syllabusBigGauge: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syllabusBigGaugeNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  syllabusBigGaugeLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  syllabusMiniBarsCol: {
    flex: 1,
  },
  miniBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniBarTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniBarPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
  miniBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  perfItem: {
    gap: 2,
  },
  perfLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  perfVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  perfUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  perfSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  leaderboardBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  leaderboardBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
