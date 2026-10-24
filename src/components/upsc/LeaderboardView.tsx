import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Flame, Trophy } from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { LEADERBOARD_ASPIRANTS } from '@/services/leaderboardData';
import { useStudy } from '@/context/StudyContext';

interface LeaderboardViewProps {
  isDark: boolean;
}

export function LeaderboardView({ isDark }: LeaderboardViewProps) {
  const { streak, config } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  // Sync current user's streak in the list
  const aspirants = LEADERBOARD_ASPIRANTS.map((item) => {
    if (item.isCurrentUser) {
      return {
        ...item,
        name: `${config.aspirantName} (You)`,
        streakDays: streak.currentStreak,
        consistencyPercent: streak.weeklyConsistencyPercent,
      };
    }
    return item;
  }).sort((a, b) => b.streakDays - a.streakDays);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
          UPSC CSE ASPIRANTS
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Consistency Leaderboard
        </Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          Ranked by unbroken qualifying study streaks. Consistency beats intensity.
        </Text>
      </View>

      {/* Your Rank Banner */}
      <View
        style={[
          styles.yourRankCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.yourRankLeft}>
          <View style={[styles.trophyCircle, { backgroundColor: theme.activeBg }]}>
            <Trophy size={18} color={theme.textPrimary} />
          </View>
          <View>
            <Text style={[styles.yourRankLabel, { color: theme.textSecondary }]}>
              YOUR POSITION
            </Text>
            <Text style={[styles.yourRankNumber, { color: theme.textPrimary }]}>
              Rank #{aspirants.findIndex((a) => a.isCurrentUser) + 1}
            </Text>
          </View>
        </View>

        <View style={styles.yourRankStats}>
          <Text style={[styles.yourStreakText, { color: theme.textPrimary }]}>
            {streak.currentStreak} Days
          </Text>
          <Text style={[styles.yourStreakSub, { color: theme.textSecondary }]}>
            {streak.weeklyConsistencyPercent}% Consistency
          </Text>
        </View>
      </View>

      {/* Leaderboard Table */}
      <View
        style={[
          styles.tableCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={[styles.tableHeaderRow, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.thRank, { color: theme.textMuted }]}>#</Text>
          <Text style={[styles.thName, { color: theme.textMuted }]}>ASPIRANT</Text>
          <Text style={[styles.thStreak, { color: theme.textMuted }]}>STREAK</Text>
          <Text style={[styles.thHours, { color: theme.textMuted }]}>HOURS</Text>
        </View>

        {aspirants.map((asp, index) => {
          const isUser = asp.isCurrentUser;

          return (
            <View
              key={asp.id}
              style={[
                styles.tableRow,
                { borderBottomColor: theme.cardBorder },
                isUser && {
                  backgroundColor: isDark ? '#171717' : '#F2F2F2',
                },
              ]}>
              <View style={styles.tdRank}>
                {index < 3 ? (
                  <View
                    style={[
                      styles.topRankCircle,
                      {
                        backgroundColor:
                          index === 0
                            ? theme.textPrimary
                            : isDark
                            ? '#2A2A2A'
                            : '#E0E0E0',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.topRankNum,
                        {
                          color:
                            index === 0
                              ? isDark
                                ? '#000000'
                                : '#FFFFFF'
                              : theme.textPrimary,
                        },
                      ]}>
                      {index + 1}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.rankNumber, { color: theme.textSecondary }]}>
                    {index + 1}
                  </Text>
                )}
              </View>

              <View style={styles.tdName}>
                <Text
                  style={[
                    styles.aspirantName,
                    { color: theme.textPrimary },
                    isUser && { fontWeight: '800' },
                  ]}>
                  {asp.name}
                </Text>
                <Text style={[styles.aspirantState, { color: theme.textMuted }]}>
                  {asp.state}
                </Text>
              </View>

              <View style={styles.tdStreak}>
                <View style={styles.streakCellRow}>
                  <Flame size={13} color="#D97706" fill="#FBBF24" />
                  <Text style={[styles.streakText, { color: theme.textPrimary }]}>
                    {asp.streakDays}d
                  </Text>
                </View>
              </View>

              <View style={styles.tdHours}>
                <Text style={[styles.hoursText, { color: theme.textSecondary }]}>
                  {asp.totalStudyHours}h
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  yourRankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  yourRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yourRankLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  yourRankNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  yourRankStats: {
    alignItems: 'flex-end',
  },
  yourStreakText: {
    fontSize: 16,
    fontWeight: '800',
  },
  yourStreakSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tableCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  thRank: {
    width: 44,
    fontSize: 11,
    fontWeight: '700',
  },
  thName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  thStreak: {
    width: 80,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  thHours: {
    width: 60,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tdRank: {
    width: 44,
    justifyContent: 'center',
  },
  topRankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankNum: {
    fontSize: 12,
    fontWeight: '900',
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  tdName: {
    flex: 1,
  },
  aspirantName: {
    fontSize: 13,
    fontWeight: '600',
  },
  aspirantState: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  tdStreak: {
    width: 80,
    alignItems: 'center',
  },
  streakCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tdHours: {
    width: 60,
    alignItems: 'flex-end',
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
