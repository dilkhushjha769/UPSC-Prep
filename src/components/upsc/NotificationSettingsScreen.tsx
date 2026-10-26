import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
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
        {/* GROUP 1: Updates & Promotion */}
        <View style={styles.groupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Updates & Announcements
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Be the first to know about new syllabus features, exam notifications and editorials.
          </Text>

          <View style={[styles.roundedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Emails
              </Text>
              <Switch
                value={prefs.currentAffairsDigest}
                onValueChange={() => handleToggle('currentAffairsDigest')}
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Editorial Summaries
              </Text>
              <Switch
                value={prefs.studyReminders}
                onValueChange={() => handleToggle('studyReminders')}
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.rowItem}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                PYQ & Mock Tests
              </Text>
              <Switch
                value={prefs.mockTestAnnouncements}
                onValueChange={() => handleToggle('mockTestAnnouncements')}
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* GROUP 2: Reminders */}
        <View style={styles.groupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Reminders
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Get daily reminders about your study targets, streak status, revision reviews and tests.
          </Text>

          <View style={[styles.roundedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.rowItem, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Daily Study Target
              </Text>
              <Switch
                value={prefs.soundEnabled}
                onValueChange={() => handleToggle('soundEnabled')}
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.rowItem}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Streak Protection Alert
              </Text>
              <Switch
                value={prefs.streakAlerts}
                onValueChange={() => handleToggle('streakAlerts')}
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* GROUP 3: Account Notification */}
        <View style={styles.groupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account Notification
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            For important notifications on preparation backups, cloud sync summaries and test scorecards.
          </Text>

          <View style={[styles.roundedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.rowItem}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Push Notification
              </Text>
              <Switch
                value={!prefs.quietHoursEnabled}
                onValueChange={() => handleToggle('quietHoursEnabled')}
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                thumbColor="#FFFFFF"
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
