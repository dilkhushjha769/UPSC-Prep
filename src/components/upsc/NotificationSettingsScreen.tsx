import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { PrimaryToggle } from '@/components/common/PrimaryToggle';
import { BW_THEME } from '@/constants/bwTheme';
import { PALETTE } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';
import { NotificationPreferences } from '@/types/study';
import { examFocusService } from '@/services/examFocusService';
import { Platform } from 'react-native';

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
    focusModeDuringTests: true,
    androidDndRequested: false,
    ...config.notificationPreferences,
  };

  const [prefs, setPrefs] = useState<NotificationPreferences>(currentPrefs);
  const [isSaved, setIsSaved] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    await updateConfig({
      notificationPreferences: prefs,
    });
    await examFocusService.setEnabledByUser(prefs.focusModeDuringTests ?? true);
    if (prefs.androidDndRequested !== undefined) {
      await examFocusService.setSystemDndRequested(prefs.androidDndRequested);
    }
    setIsSaved(true);
    setTimeout(() => {
      onBack();
    }, 450);
  };

  const cardBg = isDark ? '#141824' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';


  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0C0F17' : '#F8FAFC' }]}>
      {/* Header matching design reference: Back arrow on left, Centered Title, Blue 'Save' link on right */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? '#0C0F17' : '#F8FAFC',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          accessibilityLabel="Back"
          style={styles.backButton}>
          <ChevronLeft size={22} color={theme.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Notifications
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSave}
          style={styles.saveButton}>
          <Text style={[styles.saveText, { color: isSaved ? '#10B981' : '#2563EB' }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          isDesktop && styles.desktopScrollBody,
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* GROUP 1: Study & Target Alerts */}
        <View style={styles.groupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Study & Target Alerts
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Personalized notifications to keep your preparation streak and study milestones on track.
          </Text>

          <View style={[styles.roundedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Daily Study Reminders
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Scheduled alerts for daily study goals and revision targets
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.studyReminders}
                onValueChange={() => handleToggle('studyReminders')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>

            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Streak Protection Alerts
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Warnings before midnight if your qualifying study streak is at risk
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.streakAlerts}
                onValueChange={() => handleToggle('streakAlerts')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>

            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Daily Current Affairs Digest
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Morning editorial synthesis, key events and daily drill release
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.currentAffairsDigest}
                onValueChange={() => handleToggle('currentAffairsDigest')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>

            <View style={styles.rowItem}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Mock Tests & Leaderboard
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Weekly All-India mocks, scorecards and rank updates
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.mockTestAnnouncements}
                onValueChange={() => handleToggle('mockTestAnnouncements')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>
          </View>
        </View>

        {/* GROUP 2: Sound & Vibration Settings */}
        <View style={styles.groupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Sound & Vibration
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Manage sound effects and haptic vibration for notifications and study timers.
          </Text>

          <View style={[styles.roundedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Notification Sounds
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Audible tones for study reminders and break timers
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.soundEnabled}
                onValueChange={() => handleToggle('soundEnabled')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>

            <View style={styles.rowItem}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Haptic Vibration
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Tactile feedback on answer selection and time alerts
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.vibrationEnabled}
                onValueChange={() => handleToggle('vibrationEnabled')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>
          </View>
        </View>

        {/* GROUP 3: Quiet Hours & Delivery Mode */}
        <View style={styles.groupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Delivery & Quiet Hours
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Restrict notifications during night-time to ensure uninterrupted sleep.
          </Text>

          <View style={[styles.roundedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.rowItem}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Quiet Hours (11:00 PM – 6:00 AM)
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  Mutes all non-critical notifications during sleep hours
                </Text>
              </View>
              <PrimaryToggle
                value={prefs.quietHoursEnabled}
                onValueChange={() => handleToggle('quietHoursEnabled')}
                isDark={isDark}
                activeTrackColor="#006FFD"
              />
            </View>
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
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  desktopScrollBody: {
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  groupContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  roundedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
