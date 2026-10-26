import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  Flame,
  Play,
  PlusCircle,
  Sparkles,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';
import { ArcGauge } from './CircularGauge';

interface DailyStudyGoalProps {
  isDark: boolean;
}

export function DailyStudyGoal({ isDark }: DailyStudyGoalProps) {
  const {
    todayTotalMinutes,
    todayGoalMinutes,
    todayProgressPercent,
    todayRemainingMinutes,
    setIsFocusModalOpen,
    setIsLogModalOpen,
  } = useStudy();

  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  // Format hours and minutes
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const completedStr = formatTime(todayTotalMinutes);
  const goalStr = formatTime(todayGoalMinutes);
  const remainingStr = formatTime(todayRemainingMinutes);
  const progressRatio = Math.min(1, todayTotalMinutes / Math.max(1, todayGoalMinutes));
  const isGoalReached = todayTotalMinutes >= todayGoalMinutes;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}>
      {/* Top Main Section */}
      <View
        style={[
          styles.mainContentRow,
          isMobile && styles.mainContentColumn,
        ]}>
        {/* Left Side: Stats & Information */}
        <View style={styles.statsColumn}>
          <View style={styles.tagRow}>
            <View
              style={[
                styles.categoryChip,
                { backgroundColor: colors.primarySoft },
              ]}>
              <Sparkles size={12} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {"Today's Target"}
              </Text>
            </View>

            {isGoalReached ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.accentEmerald },
                ]}>
                <CheckCircle2 size={12} color="#FFFFFF" />
                <Text style={styles.statusBadgeText}>GOAL ACHIEVED</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isDark ? '#2D2342' : '#F1EDFD' },
                ]}>
                <Clock size={12} color={colors.primary} />
                <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
                  {remainingStr} left
                </Text>
              </View>
            )}
          </View>

          {/* Large Numbers */}
          <View style={styles.bigNumbersContainer}>
            <Text style={[styles.completedTimeText, { color: colors.textPrimary }]}>
              {completedStr}
            </Text>
            <Text style={[styles.goalTimeText, { color: colors.textMuted }]}>
              {' '}/ {goalStr}
            </Text>
          </View>

          <Text style={[styles.subStatusText, { color: colors.textSecondary }]}>
            {isGoalReached
              ? 'Outstanding effort! You have met your study goal today.'
              : `${todayProgressPercent}% of your 6-hour daily study target completed.`}
          </Text>

          {/* Linear mini progress indicator */}
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: isDark ? '#1A2130' : '#FFEDE0' },
            ]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${todayProgressPercent}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Right Side: Circular Gauge */}
        <View style={styles.gaugeContainer}>
          <ArcGauge
            size={120}
            strokeWidth={11}
            progress={progressRatio}
            trackColor={isDark ? '#26243A' : '#FFEDE0'}
            fillColor={colors.primary}
            gradientColors={[colors.primaryLight, colors.primary]}
            gradientId="todayGoalGrad">
            <View style={styles.gaugeInnerContent}>
              <View
                style={[
                  styles.innerFlameBadge,
                  { backgroundColor: colors.primarySoft },
                ]}>
                <Flame
                  size={20}
                  color={isGoalReached ? colors.accentEmerald : colors.primary}
                  fill={isGoalReached ? colors.accentEmerald : colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.gaugePercentText,
                  { color: colors.textPrimary },
                ]}>
                {todayProgressPercent}%
              </Text>
              <Text style={[styles.gaugeLabelText, { color: colors.textMuted }]}>
                Focus
              </Text>
            </View>
          </ArcGauge>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View
        style={[
          styles.actionButtonsRow,
          { borderTopColor: colors.cardBorderSubtle },
        ]}>
        {/* Primary Action: Start Study Session */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsFocusModalOpen(true)}
          style={[
            styles.primaryActionBtn,
            { backgroundColor: colors.primary },
          ]}>
          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.primaryActionText}>Start Study Session</Text>
        </TouchableOpacity>

        {/* Secondary Action: Log Study Session */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsLogModalOpen(true)}
          style={[
            styles.secondaryActionBtn,
            {
              backgroundColor: isDark ? '#1A2130' : '#F8FAFC',
              borderColor: colors.cardBorderSubtle,
            },
          ]}>
          <PlusCircle size={16} color={colors.textPrimary} />
          <Text style={[styles.secondaryActionText, { color: colors.textPrimary }]}>
            Log Session
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
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  mainContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  mainContentColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  statsColumn: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bigNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  completedTimeText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  goalTimeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  subStatusText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  gaugeInnerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFlameBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  gaugePercentText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeLabelText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    flex: 1,
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryActionBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
