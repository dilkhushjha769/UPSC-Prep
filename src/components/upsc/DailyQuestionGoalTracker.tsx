import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { BookOpen, Check, GraduationCap, X } from 'lucide-react-native';
import { PALETTE, Typography } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';

interface DailyQuestionGoalTrackerProps {
  isDark: boolean;
  onOpenPractice?: () => void;
}

export function DailyQuestionGoalTracker({
  isDark,
}: DailyQuestionGoalTrackerProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const {
    dailyQuestionsGoal,
    todayQuestionsSolved,
    updateDailyQuestionsGoal,
  } = useStudy();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState<string>(String(dailyQuestionsGoal));

  const goal = Math.max(1, dailyQuestionsGoal);
  const solved = Math.max(0, todayQuestionsSolved);
  const isTargetAchieved = solved >= goal;
  const percentage = Math.min(100, Math.round((solved / goal) * 100));

  // Color tokens matching the reference capsule design
  const cardBg = isDark ? '#20232A' : '#FFFFFF';
  const cardBorder = isDark ? '#2D3039' : '#EEF0F4';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const trackBg = isDark ? '#2C2E38' : '#EEF1F6';

  // Badge icon colors
  const badgeBg = isTargetAchieved
    ? (isDark ? '#064E3B' : '#D1FAE5')
    : (isDark ? '#1E2D4A' : '#9EBFF8');

  const badgeIconColor = isTargetAchieved
    ? (isDark ? '#6EE7B7' : '#065F46')
    : (isDark ? '#93C5FD' : '#1A2333');

  const fillBarColor = isTargetAchieved ? '#10B981' : PALETTE.highlight.primary;

  const handleSaveGoal = async (newGoal: number) => {
    const valid = Math.max(1, Math.min(200, newGoal));
    await updateDailyQuestionsGoal(valid);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setGoalInput(String(goal));
          setIsEditModalOpen(true);
        }}
        accessibilityLabel="Daily practice progress. Tap to adjust goal."
        style={[
          styles.capsuleCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            paddingVertical: isMobile ? 12 : 14,
            paddingHorizontal: isMobile ? 14 : 18,
          },
        ]}>
        {/* Top Row: Icon Badge, Title/Subtitle, and Percentage/Target */}
        <View style={styles.topRow}>
          {/* Left: Soft Circular Icon Badge (Graduation Cap) */}
          <View
            style={[
              styles.iconBadge,
              {
                width: isMobile ? 42 : 46,
                height: isMobile ? 42 : 46,
                borderRadius: isMobile ? 21 : 23,
                backgroundColor: badgeBg,
              },
            ]}>
            <GraduationCap
              size={isMobile ? 19 : 21}
              color={badgeIconColor}
              strokeWidth={2.2}
            />
          </View>

          {/* Center: Title ("Progress") & Subtitle (Book Icon + "Learning activity") */}
          <View style={styles.centerSection}>
            <Text
              style={[
                styles.titleText,
                {
                  color: textPrimary,
                  fontSize: isMobile ? 15 : 16,
                },
              ]}>
              Progress
            </Text>

            <View style={styles.subtitleRow}>
              <BookOpen
                size={isMobile ? 11 : 12}
                color={textSecondary}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.subtitleText,
                  {
                    color: textSecondary,
                    fontSize: isMobile ? 11 : 12,
                  },
                ]}>
                Learning activity
              </Text>
            </View>
          </View>

          {/* Right: Large Percentage & Solved Questions Count */}
          <View style={styles.rightSection}>
            <Text
              style={[
                styles.percentageText,
                {
                  color: isTargetAchieved ? '#10B981' : textPrimary,
                  fontSize: isMobile ? 19 : 21,
                },
              ]}>
              {percentage}%
            </Text>

            <Text
              style={[
                styles.countText,
                {
                  color: textSecondary,
                  fontSize: isMobile ? 11 : 12,
                },
              ]}>
              {solved} / {goal} Qs
            </Text>
          </View>
        </View>

        {/* Bottom: Question Tracking Progress Bar inside the card */}
        <View
          style={[
            styles.progressBarTrack,
            {
              backgroundColor: trackBg,
              marginTop: isMobile ? 10 : 12,
            },
          ]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(solved > 0 ? 3 : 0, percentage))}%`,
                backgroundColor: fillBarColor,
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* ========================================================= */}
      {/* TARGET SETTINGS MODAL (Triggered on Card Tap)             */}
      {/* ========================================================= */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsEditModalOpen(false)}
          style={styles.modalBackdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#20232A' : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#E5E7EB',
              },
            ]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Daily Question Goal
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Set your target questions to solve each day
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}>
                <X size={18} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>
              Quick Presets
            </Text>
            <View style={styles.presetsGrid}>
              {[10, 15, 20, 25, 30, 40, 50].map((preset) => {
                const isSelected = preset === goal;
                return (
                  <TouchableOpacity
                    key={preset}
                    activeOpacity={0.7}
                    onPress={() => {
                      setGoalInput(String(preset));
                      void handleSaveGoal(preset);
                    }}
                    style={[
                      styles.presetChip,
                      isSelected
                        ? {
                            backgroundColor: PALETTE.highlight.primary,
                            borderColor: PALETTE.highlight.primary,
                          }
                        : {
                            backgroundColor: isDark ? '#282A33' : '#F3F4F6',
                            borderColor: isDark ? '#3D3F4A' : '#E5E7EB',
                          },
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color: isSelected ? '#FFFFFF' : textPrimary,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}>
                      {preset} Qs
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Input */}
            <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 14 }]}>
              Custom Target (Questions / Day)
            </Text>
            <View style={styles.customInputRow}>
              <TextInput
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                maxLength={3}
                placeholder="20"
                placeholderTextColor={textMuted}
                style={[
                  styles.customInput,
                  {
                    backgroundColor: isDark ? '#282A33' : '#F9FAFB',
                    borderColor: isDark ? '#3D3F4A' : '#D1D5DB',
                    color: textPrimary,
                  },
                ]}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const num = parseInt(goalInput, 10);
                  if (!isNaN(num) && num > 0) {
                    void handleSaveGoal(num);
                  }
                }}
                style={styles.saveGoalBtn}>
                <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.saveGoalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  capsuleCard: {
    borderRadius: 22,
    borderWidth: 1,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  subtitleText: {
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
    justifyContent: 'center',
  },
  percentageText: {
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.4,
  },
  countText: {
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  saveGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.highlight.primary,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveGoalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
});
