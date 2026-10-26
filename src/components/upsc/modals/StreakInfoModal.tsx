import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  Clock,
  Flame,
  Globe,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface StreakInfoModalProps {
  isDark: boolean;
}

export function StreakInfoModal({ isDark }: StreakInfoModalProps) {
  const { isStreakInfoModalOpen, setIsStreakInfoModalOpen, config } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const rules = [
    {
      title: `${config.qualifyingStreakMinutes}-Minute Focused Study Requirement`,
      desc: `A day counts toward your streak only when you complete at least ${config.qualifyingStreakMinutes} minutes of actual focused study. Opening the app or tapping buttons does not count.`,
      icon: Clock,
      color: colors.primary,
    },
    {
      title: 'Current Day Active Streak Preservation',
      desc: 'If you completed yesterday and today is currently in progress, your active streak is fully preserved throughout today until midnight.',
      icon: Flame,
      color: '#EF4444',
    },
    {
      title: 'Longest Streak Never Resets',
      desc: 'Even if an unavoidable emergency breaks your current streak, your all-time longest streak is permanently preserved in your preparation record.',
      icon: Award,
      color: colors.accentAmber,
    },
    {
      title: 'Local Timezone Day Boundaries',
      desc: 'Day boundaries are strictly calculated according to your device’s local timezone (midnight to midnight). No confusing UTC shifts.',
      icon: Globe,
      color: colors.accentSky,
    },
    {
      title: 'Anti-Inflation & Integrity Safeguards',
      desc: 'Streaks are derived idempotently from genuine study session logs. Duplicate requests, browser refreshes, or future dates are rejected.',
      icon: ShieldCheck,
      color: colors.accentEmerald,
    },
  ];

  return (
    <Modal
      visible={isStreakInfoModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsStreakInfoModalOpen(false)}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Flame size={18} color="#D97706" fill="#FBBF24" />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                UPSC Streak System Rules
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsStreakInfoModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Consistency is the single most vital factor in clearing the UPSC Civil Services Examination. The streak system is designed to build disciplined daily habits through real study effort.
            </Text>

            <View style={styles.rulesList}>
              {rules.map((rule, idx) => {
                const Icon = rule.icon;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.ruleCard,
                      {
                        backgroundColor: isDark ? '#1C1B2A' : '#FBFBFE',
                        borderColor: colors.cardBorderSubtle,
                      },
                    ]}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: isDark ? '#262238' : '#FFEDE0' },
                      ]}>
                      <Icon size={16} color={rule.color} />
                    </View>
                    <View style={styles.ruleContent}>
                      <Text
                        style={[styles.ruleTitle, { color: colors.textPrimary }]}>
                        {rule.title}
                      </Text>
                      <Text
                        style={[
                          styles.ruleDesc,
                          { color: colors.textSecondary },
                        ]}>
                        {rule.desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setIsStreakInfoModalOpen(false)}
              style={[styles.gotItBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.gotItBtnText}>Understood — Keep Streak Alive</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 106, 19, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    padding: 20,
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  rulesList: {
    gap: 12,
  },
  ruleCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  gotItBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  gotItBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
