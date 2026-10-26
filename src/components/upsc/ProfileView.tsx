import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Moon,
  Settings,
  Sun,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { EditProfileScreen } from './EditProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { LegalScreen } from './LegalScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';

interface ProfileViewProps {
  isDark: boolean;
  onNavigateToTab?: (tabKey: any) => void;
  onToggleTheme?: () => void;
  onBack?: () => void;
}

type SubScreen =
  | 'main'
  | 'edit-profile'
  | 'settings'
  | 'notification-settings'
  | 'privacy'
  | 'terms';

export function ProfileView({
  isDark,
  onNavigateToTab,
  onToggleTheme,
  onBack,
}: ProfileViewProps) {
  const { config } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  // Active full-screen flow state
  const [currentScreen, setCurrentScreen] = useState<SubScreen>('main');

  // Display values
  const displayName = config.aspirantName || config.firstName || 'Dilkhush Jha';
  const displayEmail = config.email || 'dilkhush.jha@gmail.com';
  const displayYear = config.targetExamYear || 2026;
  const displayOptional = config.optionalSubject || 'PSIR';
  const displayDailyHours = Math.round((config.dailyGoalMinutes || 360) / 60);
  const displayMedium = config.medium || 'English';

  const initials =
    displayName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DJ';

  const dividerStyle = [
    styles.rowDivider,
    { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)' },
  ];

  // SUB-SCREEN 1: Edit Profile (Independent Full Screen)
  if (currentScreen === 'edit-profile') {
    return (
      <EditProfileScreen
        isDark={isDark}
        onBack={() => setCurrentScreen('main')}
        onSaved={() => setCurrentScreen('main')}
      />
    );
  }

  // SUB-SCREEN 2: Settings (Independent Full Screen)
  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        isDark={isDark}
        onBack={() => setCurrentScreen('main')}
        onToggleTheme={onToggleTheme}
        onOpenPrivacy={() => setCurrentScreen('privacy')}
        onOpenTerms={() => setCurrentScreen('terms')}
        onOpenNotificationSettings={() => setCurrentScreen('notification-settings')}
        onNavigateToNotifications={() => onNavigateToTab?.('notifications')}
      />
    );
  }

  // SUB-SCREEN 2.5: Notification Settings Screen
  if (currentScreen === 'notification-settings') {
    return (
      <NotificationSettingsScreen
        isDark={isDark}
        onBack={() => setCurrentScreen('settings')}
      />
    );
  }

  // SUB-SCREEN 3: Privacy Policy Document
  if (currentScreen === 'privacy') {
    return (
      <LegalScreen
        isDark={isDark}
        initialTab="privacy"
        onBack={() => setCurrentScreen('settings')}
      />
    );
  }

  // SUB-SCREEN 4: Terms & Conditions Document
  if (currentScreen === 'terms') {
    return (
      <LegalScreen
        isDark={isDark}
        initialTab="terms"
        onBack={() => setCurrentScreen('settings')}
      />
    );
  }

  // MAIN SCREEN: Quiet Luxury Monochromatic Profile View
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* 1. Minimal Header */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.bg,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}>
        {Boolean(onBack) ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            accessibilityLabel="Back"
            style={[
              styles.navBackBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <ChevronLeft size={20} color={theme.textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : (
          <View style={styles.navPlaceholder} />
        )}

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Profile
        </Text>

        <View style={styles.headerRightRow}>
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.navBackBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}>
              {isDark ? (
                <Sun size={17} color={theme.textPrimary} strokeWidth={2.2} />
              ) : (
                <Moon size={17} color={theme.textPrimary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('settings')}
            accessibilityLabel="Settings"
            style={[
              styles.navBackBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <Settings size={17} color={theme.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Scrollable Body */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Understated Aspirant Identity */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('edit-profile')}
            style={styles.avatarTouchWrap}>
            <View
              style={[
                styles.avatarBox,
                {
                  backgroundColor: isDark ? '#181C26' : '#F1F3F7',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}>
              {config.avatarUri ? (
                <Image
                  source={{ uri: config.avatarUri }}
                  style={[
                    styles.avatarImage,
                    {
                      transform: [
                        { scale: config.avatarScale || 1 },
                        { translateX: config.avatarOffsetX || 0 },
                        { translateY: config.avatarOffsetY || 0 },
                        { rotate: `${config.avatarRotation || 0}deg` },
                      ],
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarInitialsText, { color: theme.textPrimary }]}>
                  {initials}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.editBadgeCircle,
                {
                  backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? '#09090B' : '#FFFFFF',
                },
              ]}>
              <Edit3 size={11} color={isDark ? '#09090B' : '#FFFFFF'} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {displayName}
          </Text>

          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {displayEmail}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('edit-profile')}
            style={[
              styles.editProfilePill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}>
            <Text style={[styles.editProfilePillText, { color: theme.textPrimary }]}>
              Edit Profile & Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: EXAM TARGET (Flat, Hairline-Divided Rows) */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            EXAM TARGET
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('edit-profile')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Target Exam Year
            </Text>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                {displayYear}
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('edit-profile')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Optional Subject
            </Text>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                {displayOptional}
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('edit-profile')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Daily Study Goal
            </Text>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                {displayDailyHours} Hours / day
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('edit-profile')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Examination Medium
            </Text>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                {displayMedium}
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: SYSTEM & SETTINGS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            SETTINGS & LEGAL
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('settings')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Settings & Preferences
            </Text>
            <View style={styles.rowRightGroup}>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('privacy')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Privacy Policy
            </Text>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textMuted }]}>
                v2.4
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('terms')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Terms & Conditions
            </Text>
            <View style={styles.rowRightGroup}>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
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
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPlaceholder: {
    width: 36,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  desktopScrollContent: {
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarTouchWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  editBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12.5,
    marginBottom: 12,
  },
  editProfilePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editProfilePillText: {
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
