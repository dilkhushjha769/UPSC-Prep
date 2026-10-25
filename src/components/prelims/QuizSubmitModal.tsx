import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Timer,
  X,
} from '@/components/common/LucideIcons';
import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';

export interface QuizSubmitModalProps {
  visible: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  notVisitedCount: number;
  timeLeftFormatted: string;
  onCancel: () => void;
  onConfirmSubmit: () => void;
}

export function QuizSubmitModal({
  visible,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  notVisitedCount,
  timeLeftFormatted,
  onCancel,
  onConfirmSubmit,
}: QuizSubmitModalProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  if (!visible) return null;

  const hasUnanswered = unansweredCount > 0 || notVisitedCount > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <View style={styles.titleCol}>
              <Text style={styles.dialogTitle}>Submit UPSC Mock Exam?</Text>
              <Text style={styles.dialogSubtitle}>
                Review your question summary before final scoring
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onCancel}>
              <X size={18} color={theme.colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Time Remaining Pill */}
          <View style={styles.timerPillRow}>
            <View style={styles.timerPill}>
              <Timer size={14} color={theme.colors.textPrimary} strokeWidth={2} />
              <Text style={styles.timerText}>Time Remaining: {timeLeftFormatted}</Text>
            </View>
          </View>

          {/* 4-Stat Summary Table */}
          <View style={styles.statsSummaryGrid}>
            <View style={[styles.summaryStatItem, styles.statBorderAnswered]}>
              <Text style={[styles.summaryStatNum, { color: '#10B981' }]}>
                {answeredCount}
              </Text>
              <Text style={styles.summaryStatLabel}>Answered</Text>
            </View>

            <View style={[styles.summaryStatItem, styles.statBorderUnanswered]}>
              <Text style={[styles.summaryStatNum, { color: '#EF4444' }]}>
                {unansweredCount}
              </Text>
              <Text style={styles.summaryStatLabel}>Unanswered</Text>
            </View>

            <View style={[styles.summaryStatItem, styles.statBorderMarked]}>
              <Text style={[styles.summaryStatNum, { color: '#8B5CF6' }]}>
                {markedCount}
              </Text>
              <Text style={styles.summaryStatLabel}>Marked Review</Text>
            </View>

            <View style={[styles.summaryStatItem, styles.statBorderNotVisited]}>
              <Text style={[styles.summaryStatNum, { color: theme.colors.textMuted }]}>
                {notVisitedCount}
              </Text>
              <Text style={styles.summaryStatLabel}>Not Visited</Text>
            </View>
          </View>

          {/* UPSC Negative Marking Warning Callout */}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {hasUnanswered
                ? `You still have ${unansweredCount + notVisitedCount} unattempted questions out of ${totalQuestions}. Negative marking (-0.66 per wrong answer) will be applied.`
                : 'All questions have been answered. Negative marking (-0.66 per wrong answer) will be applied.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelBtnText}>Continue Quiz</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.confirmSubmitBtn, pressed && styles.pressed]}
              onPress={onConfirmSubmit}
            >
              <Text style={styles.confirmSubmitBtnText}>Submit Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: PrelimsThemeType) => {
  const isDark = theme.isDark;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialogCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      gap: 14,
      ...theme.shadows.card,
    },
    dialogHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    titleCol: {
      flex: 1,
      paddingRight: 12,
      gap: 3,
    },
    dialogTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    dialogSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    closeBtn: {
      padding: 4,
      borderRadius: 6,
    },
    timerPillRow: {
      flexDirection: 'row',
    },
    timerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C2230' : '#F1F5F9',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      gap: 6,
    },
    timerText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    statsSummaryGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    summaryStatItem: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      backgroundColor: isDark ? '#181C26' : '#F8FAFC',
    },
    statBorderAnswered: {
      borderColor: isDark ? '#065F46' : '#A7F3D0',
    },
    statBorderUnanswered: {
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
    },
    statBorderMarked: {
      borderColor: isDark ? '#5B21B6' : '#DDD6FE',
    },
    statBorderNotVisited: {
      borderColor: theme.colors.borderSubtle,
    },
    summaryStatNum: {
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 22,
    },
    summaryStatLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    warningBox: {
      backgroundColor: isDark ? '#1F1E28' : '#FFFBEB',
      borderColor: isDark ? '#4A3B18' : '#FDE68A',
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
    },
    warningText: {
      fontSize: 12,
      color: isDark ? '#FDE68A' : '#92400E',
      lineHeight: 18,
      fontWeight: '500',
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 6,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: isDark ? '#262A36' : '#F1F5F9',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    confirmSubmitBtn: {
      flex: 1,
      backgroundColor: '#10B981',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmSubmitBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
  });
};
