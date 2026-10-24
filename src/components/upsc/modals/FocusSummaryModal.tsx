import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  EyeOff,
  Flame,
  PauseCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { BW_THEME } from '@/constants/bwTheme';
import { formatHumanDuration } from '@/services/focusTimerService';

interface FocusSummaryModalProps {
  isDark: boolean;
}

export function FocusSummaryModal({ isDark }: FocusSummaryModalProps) {
  const {
    isFocusSummaryModalOpen,
    setIsFocusSummaryModalOpen,
    lastSessionSummary,
    setIsFocusModalOpen,
  } = useStudy();

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  if (!lastSessionSummary) {
    return null;
  }

  const handleFinish = () => {
    setIsFocusSummaryModalOpen(false);
  };

  const handleStartAnother = () => {
    setIsFocusSummaryModalOpen(false);
    setIsFocusModalOpen(true);
  };

  const subjectDisplay = lastSessionSummary.subject === 'Custom Subject' && lastSessionSummary.customSubjectName
    ? lastSessionSummary.customSubjectName
    : lastSessionSummary.subject;

  return (
    <Modal
      visible={isFocusSummaryModalOpen}
      animationType="fade"
      transparent
      onRequestClose={handleFinish}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.cardBg,
              borderColor: isDark ? '#2D3444' : theme.cardBorder,
            },
            Platform.OS === 'web' && ({
              boxShadow: isDark
                ? '0 20px 60px rgba(0, 0, 0, 0.7)'
                : '0 16px 40px rgba(0, 0, 0, 0.12)',
            } as object),
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconSquircle,
                  {
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                    borderColor: isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  },
                ]}>
                <CheckCircle2 size={16} color={isDark ? '#34D399' : '#059669'} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  Focus Session Completed
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  Verified and recorded in study history
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFinish}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1C202B' : '#F1F5F9',
                  borderColor: isDark ? '#2D3444' : '#E2E8F0',
                },
              ]}>
              <X size={15} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Subject & Topic Banner */}
            <View
              style={[
                styles.subjectBanner,
                {
                  backgroundColor: isDark ? '#141722' : '#F8FAFC',
                  borderColor: isDark ? '#262D3D' : '#E2E8F0',
                },
              ]}>
              <View style={styles.bannerRow}>
                <View
                  style={[
                    styles.subjectBadge,
                    {
                      backgroundColor: isDark ? '#232938' : '#E2E8F0',
                    },
                  ]}>
                  <BookOpen size={11} color={theme.textPrimary} />
                  <Text style={[styles.subjectBadgeText, { color: theme.textPrimary }]}>
                    {subjectDisplay}
                  </Text>
                </View>

                {lastSessionSummary.isStreakQualified && (
                  <View style={styles.streakBadge}>
                    <Flame size={12} color="#D97706" fill="#FBBF24" />
                    <Text style={styles.streakBadgeText}>Streak Qualifying</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.topicTitle, { color: theme.textPrimary }]}>
                {lastSessionSummary.topic || `${subjectDisplay} Study Session`}
              </Text>

              <View style={styles.timestampRow}>
                <Clock size={12} color={theme.textMuted} />
                <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
                  {lastSessionSummary.startTimeFormatted} → {lastSessionSummary.endTimeFormatted}
                </Text>
              </View>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
              {/* Focused Time */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#151822' : '#FFFFFF',
                    borderColor: isDark ? '#262D3D' : '#E2E8F0',
                  },
                ]}>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  FOCUSED TIME
                </Text>
                <Text
                  style={[
                    styles.statValueLarge,
                    { color: isDark ? '#34D399' : '#059669' },
                  ]}>
                  {formatHumanDuration(lastSessionSummary.focusedSeconds)}
                </Text>
                <Text style={[styles.statSub, { color: theme.textMuted }]}>
                  Actual concentrated study
                </Text>
              </View>

              {/* Total Elapsed Time */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#151822' : '#FFFFFF',
                    borderColor: isDark ? '#262D3D' : '#E2E8F0',
                  },
                ]}>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  TOTAL ELAPSED
                </Text>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {formatHumanDuration(lastSessionSummary.totalElapsedSeconds)}
                </Text>
                <Text style={[styles.statSub, { color: theme.textMuted }]}>
                  Start to end duration
                </Text>
              </View>

              {/* Paused Time */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#151822' : '#FFFFFF',
                    borderColor: isDark ? '#262D3D' : '#E2E8F0',
                  },
                ]}>
                <View style={styles.statLabelRow}>
                  <PauseCircle size={11} color={theme.textMuted} />
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    PAUSED TIME
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                  {lastSessionSummary.totalPausedSeconds > 0
                    ? formatHumanDuration(lastSessionSummary.totalPausedSeconds)
                    : '0 min'}
                </Text>
                <Text style={[styles.statSub, { color: theme.textMuted }]}>
                  Excluded from focused total
                </Text>
              </View>

              {/* Distractions Detected */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#151822' : '#FFFFFF',
                    borderColor: isDark ? '#262D3D' : '#E2E8F0',
                  },
                ]}>
                <View style={styles.statLabelRow}>
                  <EyeOff size={11} color={theme.textMuted} />
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    DISTRACTIONS
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color: lastSessionSummary.distractionCount === 0
                        ? isDark ? '#34D399' : '#059669'
                        : '#F59E0B',
                    },
                  ]}>
                  {lastSessionSummary.distractionCount === 0
                    ? '0 (Zero Distractions!)'
                    : `${lastSessionSummary.distractionCount} Events`}
                </Text>
                <Text style={[styles.statSub, { color: theme.textMuted }]}>
                  App / tab switches logged
                </Text>
              </View>
            </View>

            {/* Daily Goal & Streak Progress Card */}
            <View
              style={[
                styles.goalProgressCard,
                {
                  backgroundColor: isDark ? '#141722' : '#F8FAFC',
                  borderColor: isDark ? '#262D3D' : '#E2E8F0',
                },
              ]}>
              <View style={styles.goalHeaderRow}>
                <View style={styles.goalLeft}>
                  <TrendingUp size={14} color={theme.textPrimary} />
                  <Text style={[styles.goalSectionTitle, { color: theme.textPrimary }]}>
                    {"Today's UPSC Target"}
                  </Text>
                </View>
                <Text style={[styles.goalPercentText, { color: theme.textPrimary }]}>
                  {lastSessionSummary.goalCompletionPercent}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: isDark ? '#232938' : '#E2E8F0' },
                ]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, lastSessionSummary.goalCompletionPercent)}%`,
                      backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                    },
                  ]}
                />
              </View>

              <View style={styles.goalStatsRow}>
                <Text style={[styles.goalStatText, { color: theme.textSecondary }]}>
                  {"Today's Total: "}{' '}
                  <Text style={{ fontWeight: '700', color: theme.textPrimary }}>
                    {Math.floor(lastSessionSummary.todayTotalMinutesAfter / 60)}h{' '}
                    {lastSessionSummary.todayTotalMinutesAfter % 60}m
                  </Text>{' '}
                  / {Math.floor(lastSessionSummary.dailyGoalMinutes / 60)}h
                </Text>

                <View style={styles.streakIndicator}>
                  <Flame size={13} color="#D97706" fill="#FBBF24" />
                  <Text style={[styles.streakText, { color: theme.textPrimary }]}>
                    {lastSessionSummary.currentStreak} Day Streak
                  </Text>
                </View>
              </View>
            </View>

            {/* UPSC Motivational Quote Box */}
            <View
              style={[
                styles.quoteCard,
                {
                  backgroundColor: isDark ? '#151822' : '#F1F5F9',
                  borderColor: isDark ? '#242B3B' : '#E2E8F0',
                },
              ]}>
              <Sparkles size={14} color={theme.textPrimary} />
              <Text style={[styles.quoteText, { color: theme.textSecondary }]}>
                {lastSessionSummary.motivationalQuote}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleFinish}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                  },
                ]}>
                <CheckCircle2 size={16} color={isDark ? '#09090B' : '#FFFFFF'} />
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: isDark ? '#09090B' : '#FFFFFF' },
                  ]}>
                  Save and Finish
                </Text>
              </TouchableOpacity>

              <View style={styles.secondaryBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleStartAnother}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark ? '#1C202B' : '#F4F4F5',
                      borderColor: isDark ? '#2E3547' : '#E2E8F0',
                    },
                  ]}>
                  <Play size={14} color={theme.textPrimary} />
                  <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
                    Start Another Session
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleFinish}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark ? '#1C202B' : '#F4F4F5',
                      borderColor: isDark ? '#2E3547' : '#E2E8F0',
                    },
                  ]}>
                  <RotateCcw size={14} color={theme.textSecondary} />
                  <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                    Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.12)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconSquircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  subjectBanner: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statValueLarge: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statSub: {
    fontSize: 10,
  },
  goalProgressCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalPercentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalStatText: {
    fontSize: 12,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quoteText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
