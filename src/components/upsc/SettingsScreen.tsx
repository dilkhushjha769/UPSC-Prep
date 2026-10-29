import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  HelpCircle,
  Lock,
  Moon,
  RotateCcw,
  Shield,
  Smartphone,
  Sun,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { TOGGLE_ACTIVE_COLOR } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';

interface SettingsScreenProps {
  isDark: boolean;
  onBack: () => void;
  onToggleTheme?: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenFocusSettings?: () => void;
  onNavigateToNotifications?: () => void;
}

function PrimaryToggleSwitch({
  value,
  onValueChange,
  isDark,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? TOGGLE_ACTIVE_COLOR : isDark ? '#2D3039' : '#D1D5DB',
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          transform: [{ translateX: value ? 20 : 0 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
}

export function SettingsScreen({
  isDark,
  onBack,
  onToggleTheme,
  onOpenPrivacy,
  onOpenTerms,
  onOpenNotificationSettings,
  onOpenFocusSettings,
  onNavigateToNotifications,
}: SettingsScreenProps) {
  const { resetToDefaults } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  const [offlineSync, setOfflineSync] = useState(true);

  const dividerStyle = [
    styles.rowDivider,
    { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)' },
  ];

  const handleResetData = () => {
    Alert.alert(
      'Reset Study Data',
      'Are you sure you want to restore default demo benchmarks? All your custom tasks, focus session logs, and streak counts will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            Alert.alert('Reset Complete', 'Your study data has been reset to defaults.');
          },
        },
      ]
    );
  };

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
          accessibilityLabel="Back to Profile"
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
          Settings
        </Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          isDesktop && styles.desktopScrollBody,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* APPEARANCE */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            APPEARANCE & DISPLAY
          </Text>

          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              {isDark ? (
                <Moon size={16} color={theme.textSecondary} strokeWidth={2} />
              ) : (
                <Sun size={16} color={theme.textSecondary} strokeWidth={2} />
              )}
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Dark Mode
              </Text>
            </View>
            <PrimaryToggleSwitch
              value={isDark}
              onValueChange={() => onToggleTheme?.()}
              isDark={isDark}
            />
          </View>
        </View>

        {/* NOTIFICATIONS & SYNC */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            NOTIFICATIONS & CLOUD
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenNotificationSettings || onNavigateToNotifications}
            style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <Bell size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Notification Preferences
              </Text>
            </View>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                Custom Alert Rules
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>


          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenFocusSettings || onOpenNotificationSettings}
            style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <Shield size={16} color="#10B981" strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Exam Focus Mode
              </Text>
            </View>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: '#10B981' }]}>
                Apps & sound
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <Database size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Cloud & Offline Sync
              </Text>
            </View>
            <PrimaryToggleSwitch
              value={offlineSync}
              onValueChange={setOfflineSync}
              isDark={isDark}
            />
          </View>
        </View>

        {/* LEGAL & PRIVACY */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            LEGAL & COMPLIANCE
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenPrivacy}
            style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <Lock size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Privacy Policy
              </Text>
            </View>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textMuted }]}>
                v2.4
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenTerms}
            style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <FileText size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Terms & Conditions
              </Text>
            </View>
            <View style={styles.rowRightGroup}>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <Shield size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Security Standards
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
              AES-256 / TLS 1.3
            </Text>
          </View>
        </View>

        {/* ABOUT & APP INFO */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            ABOUT UPSC PREP
          </Text>

          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <Smartphone size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Application Version
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
              1.0.0 (Build 2026.10)
            </Text>
          </View>

          <View style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <HelpCircle size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Target Exam Cycle
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
              UPSC CSE 2025–2028
            </Text>
          </View>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            DATA MANAGEMENT
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResetData}
            style={[styles.listRow, dividerStyle]}>
            <View style={styles.rowLeftGroup}>
              <RotateCcw size={16} color={isDark ? '#F87171' : '#DC2626'} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: isDark ? '#F87171' : '#DC2626' }]}>
                Reset Study Data to Defaults
              </Text>
            </View>
            <ChevronRight size={15} color={theme.textMuted} />
          </TouchableOpacity>
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
  headerRightPlaceholder: {
    width: 36,
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
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 2,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  rowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '500',
  },
});
