import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flame,
  Moon,
  Newspaper,
  Volume2,
  Vibrate,
  Zap,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { NotificationPreferences } from '@/types/study';

interface NotificationSettingsScreenProps {
  isDark: boolean;
  onBack: () => void;
}

export function NotificationSettingsScreen({
  isDark,
  onBack,
}: NotificationSettingsScreenProps) {
  const { config, updateConfig } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  const currentPrefs: NotificationPreferences = {
    studyReminders: true,
    streakAlerts: true,
    currentAffairsDigest: true,
    mockTestAnnouncements: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    ...config.notificationPreferences,
  };

  const [prefs, setPrefs] = useState<NotificationPreferences>(currentPrefs);
  const [hasSavedNotice, setHasSavedNotice] = useState(false);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...prefs,
      [key]: !prefs[key],
    };
    setPrefs(updated);
    await updateConfig({
      notificationPreferences: updated,
    });
    setHasSavedNotice(true);
    setTimeout(() => setHasSavedNotice(false), 2000);
  };

  const handleEnableAll = async () => {
    const allEnabled: NotificationPreferences = {
      studyReminders: true,
      streakAlerts: true,
      currentAffairsDigest: true,
      mockTestAnnouncements: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursEnabled: false,
    };
    setPrefs(allEnabled);
    await updateConfig({ notificationPreferences: allEnabled });
    setHasSavedNotice(true);
    setTimeout(() => setHasSavedNotice(false), 2000);
  };

  const handleMuteAll = async () => {
    const allMuted: NotificationPreferences = {
      ...prefs,
      studyReminders: false,
      streakAlerts: false,
      currentAffairsDigest: false,
      mockTestAnnouncements: false,
    };
    setPrefs(allMuted);
    await updateConfig({ notificationPreferences: allMuted });
    setHasSavedNotice(true);
    setTimeout(() => setHasSavedNotice(false), 2000);
  };

  const dividerStyle = [
    styles.rowDivider,
    { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.bg,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          accessibilityLabel="Back"
          style={[
            styles.backBtn,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}>
          <ChevronLeft size={20} color={theme.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Notification Settings
        </Text>

        <View style={styles.headerRightAction}>
          {hasSavedNotice ? (
            <View style={styles.savedBadge}>
              <CheckCircle2 size={13} color="#10B981" />
              <Text style={styles.savedBadgeText}>Saved</Text>
            </View>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          isDesktop && styles.desktopScrollBody,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Quick Batch Controls */}
        <View style={styles.quickBatchRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleEnableAll}
            style={[
              styles.quickBatchPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
              },
            ]}>
            <Text style={[styles.quickBatchText, { color: theme.textPrimary }]}>
              Enable All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleMuteAll}
            style={[
              styles.quickBatchPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
              },
            ]}>
            <Text style={[styles.quickBatchText, { color: theme.textSecondary }]}>
              Mute Study Alerts
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: STUDY & PREPARATION NOTIFICATIONS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            PREPARATION & STUDY ALERTS
          </Text>

          {/* Daily Study Target */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                  },
                ]}>
                <Clock size={16} color="#3B82F6" strokeWidth={2.2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Daily Target Reminders
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Alerts to begin your daily {Math.round((config.dailyGoalMinutes || 360) / 60)}h study goal
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.studyReminders}
              onValueChange={() => handleToggle('studyReminders')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Streak Protection */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)',
                  },
                ]}>
                <Flame size={16} color="#F97316" strokeWidth={2.2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Streak Protection Alerts
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Warnings at 8:00 PM if qualifying study time is unrecorded
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.streakAlerts}
              onValueChange={() => handleToggle('streakAlerts')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Current Affairs Digest */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  },
                ]}>
                <Newspaper size={16} color="#10B981" strokeWidth={2.2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Current Affairs Daily Digest
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Morning editorial synthesis & key PIB releases
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.currentAffairsDigest}
              onValueChange={() => handleToggle('currentAffairsDigest')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Mock Test & PYQ Announcements */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)',
                  },
                ]}>
                <Zap size={16} color="#A855F7" strokeWidth={2.2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Mock Tests & PYQ Series
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Weekend All-India tests, percentile updates & analytics
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.mockTestAnnouncements}
              onValueChange={() => handleToggle('mockTestAnnouncements')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 2: DELIVERY & HAPTICS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            DELIVERY & SOUND
          </Text>

          {/* Sound Alerts */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}>
                <Volume2 size={16} color={theme.textPrimary} strokeWidth={2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Notification Sounds
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Play gentle tone for important preparation milestones
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.soundEnabled}
              onValueChange={() => handleToggle('soundEnabled')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Vibration */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}>
                <Vibrate size={16} color={theme.textPrimary} strokeWidth={2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Haptic Feedback
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Vibrate device on timer completion and task deadlines
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.vibrationEnabled}
              onValueChange={() => handleToggle('vibrationEnabled')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Quiet Hours */}
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}>
                <Moon size={16} color={theme.textPrimary} strokeWidth={2} />
              </View>
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Do Not Disturb (Quiet Hours)
                </Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>
                  Automatically mute all study notifications from 11 PM – 6 AM
                </Text>
              </View>
            </View>
            <Switch
              value={prefs.quietHoursEnabled}
              onValueChange={() => handleToggle('quietHoursEnabled')}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRightAction: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  desktopScrollBody: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  quickBatchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickBatchPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickBatchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 2,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowSubLabel: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
