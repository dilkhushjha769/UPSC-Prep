import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  FileText,
  Hourglass,
  Layers,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface PreparationProgressProps {
  isDark: boolean;
}

export function PreparationProgress({ isDark }: PreparationProgressProps) {
  const { config, setIsConfigModalOpen } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  // Real countdown calculation to user configured target exam date
  const now = new Date();
  const targetDate = new Date(config.targetExamDate);
  const diffMs = targetDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const monthsLeft = Math.floor(daysLeft / 30.5);

  const pillars = [
    {
      title: 'General Studies (GS 1-4)',
      subtitle: 'Syllabus & Standard References',
      progress: 68,
      completedLabel: '68% covered',
      color: colors.primary,
      icon: BookOpen,
    },
    {
      title: 'CSAT (Paper II)',
      subtitle: 'Quant, Reasoning & Comprehension',
      progress: 74,
      completedLabel: '74% prepared',
      color: '#4F46E5',
      icon: Layers,
    },
    {
      title: 'Current Affairs 365',
      subtitle: 'Newspapers, Monthly Digests & Schemes',
      progress: 82,
      completedLabel: '82% up to date',
      color: colors.accentEmerald,
      icon: FileText,
    },
    {
      title: 'Prelims Revision Cycles',
      subtitle: 'Core Subject Pyqs & Mock Series',
      progress: 60,
      completedLabel: 'Cycle 2 of 3',
      color: colors.accentAmber,
      icon: Award,
    },
    {
      title: 'Mains Answer Writing',
      subtitle: 'Daily answer drafting & evaluation',
      progress: 52,
      completedLabel: '52 answers submitted',
      color: colors.accentPink,
      icon: CheckCircle2,
    },
  ];

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleIconRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.primarySoft },
              ]}>
              <Compass size={16} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Your UPSC Journey
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Long-term milestone tracking towards the final rank list
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsConfigModalOpen(true)}
          style={[
            styles.configBtn,
            { borderColor: colors.cardBorderSubtle },
          ]}>
          <Text style={[styles.configBtnText, { color: colors.primary }]}>
            Edit Goal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Exam Countdown Banner */}
      <View
        style={[
          styles.countdownBanner,
          {
            backgroundColor: isDark ? '#201A38' : '#F6F2FF',
            borderColor: colors.cardBorder,
          },
        ]}>
        <View style={styles.countdownLeft}>
          <View style={styles.countdownTagRow}>
            <Hourglass size={13} color={colors.primary} />
            <Text style={[styles.countdownTag, { color: colors.primary }]}>
              EXAM COUNTDOWN
            </Text>
          </View>
          <Text style={[styles.countdownExamTitle, { color: colors.textPrimary }]}>
            {config.examPhase}
          </Text>
          <Text style={[styles.countdownTargetDate, { color: colors.textSecondary }]}>
            Target Date: {config.targetExamDate}
          </Text>
        </View>

        <View style={styles.countdownNumbersBox}>
          <Text style={[styles.daysBigNumber, { color: colors.primary }]}>
            {daysLeft}
          </Text>
          <Text style={[styles.daysLabel, { color: colors.textSecondary }]}>
            Days Left (~{monthsLeft} mos)
          </Text>
        </View>
      </View>

      {/* Progress Bars for Preparation Pillars */}
      <View style={styles.pillarsList}>
        {pillars.map((item, index) => {
          const Icon = item.icon;
          return (
            <View key={index} style={styles.pillarItem}>
              <View style={styles.pillarInfoRow}>
                <View style={styles.pillarTitleCluster}>
                  <Icon size={14} color={item.color} style={{ marginTop: 2 }} />
                  <View>
                    <Text
                      style={[styles.pillarTitle, { color: colors.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.pillarSubtitle, { color: colors.textMuted }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.pillarCompletedText, { color: colors.textPrimary }]}>
                  {item.completedLabel}
                </Text>
              </View>

              {/* Progress Bar */}
              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: isDark ? '#232136' : '#EDE9FE' },
                ]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  configBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  configBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countdownBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  countdownLeft: {
    flex: 1,
    minWidth: 160,
  },
  countdownTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  countdownTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countdownExamTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countdownTargetDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  countdownNumbersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  daysBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  daysLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillarsList: {
    gap: 14,
  },
  pillarItem: {},
  pillarInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  pillarTitleCluster: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  pillarTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillarSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  pillarCompletedText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
