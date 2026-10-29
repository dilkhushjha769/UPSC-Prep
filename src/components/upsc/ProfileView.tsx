import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Edit3,
  FileText,
  GraduationCap,
  Languages,
  Lock,
  MapPin,
  Moon,
  Settings,
  Smartphone,
  Sun,
  X,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { PALETTE, Typography } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';
import { ExamMedium, PreparationStage, SocialCategory } from '@/types/study';
import { EditProfileScreen } from './EditProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { LegalScreen } from './LegalScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { FocusModeSettingsScreen } from './FocusModeSettingsScreen';
import { PhotoViewerModal } from './PhotoViewerModal';
import { ProfileActivitySection } from './profile/ProfileActivitySection';
import {
  SubjectPracticeGroup,
  SubjectPracticeReviewScreen,
} from './profile/SubjectPracticeReviewScreen';

interface ProfileViewProps {
  isDark: boolean;
  onNavigateToTab?: (tabKey: any) => void;
  onToggleTheme?: () => void;
  onBack?: () => void;
}

type SubScreen =
  | 'focus-settings'
  | 'main'
  | 'edit-profile'
  | 'settings'
  | 'notification-settings'
  | 'privacy'
  | 'terms'
  | 'subject-practice-review';

type ProfileTab = 'activity' | 'exam' | 'preferences';

// Target field type for interactive modal prompt
type EditableFieldType =
  | 'targetExamYear'
  | 'optionalSubject'
  | 'dailyGoalMinutes'
  | 'medium'
  | 'preparationStage'
  | 'place'
  | 'category';

// ============================================================================
// PRIMARY BLUE TOGGLE SWITCH (Replaces Green/White Toggles as in Image 3)
// ============================================================================

function PrimaryToggle({
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
      style={[
        styles.primaryToggleTrack,
        {
          backgroundColor: value
            ? PALETTE.highlight.primary // #006FFD (Primary Blue)
            : (isDark ? '#2D3039' : '#D1D5DB'),
        },
      ]}>
      <View
        style={[
          styles.primaryToggleThumb,
          {
            transform: [{ translateX: value ? 18 : 2 }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

// ============================================================================
// MAIN PROFILE VIEW
// ============================================================================

export function ProfileView({
  isDark,
  onNavigateToTab,
  onToggleTheme,
  onBack,
}: ProfileViewProps) {
  const { config, updateConfig } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  const primaryBlue = PALETTE.highlight.primary; // #006FFD

  // Active full-screen flow state
  const [currentScreen, setCurrentScreen] = useState<SubScreen>('main');
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
  const [isEnlargePhotoOpen, setIsEnlargePhotoOpen] = useState(false);
  const [activeSubjectReviewGroup, setActiveSubjectReviewGroup] = useState<SubjectPracticeGroup | null>(null);

  // Field Edit Modal State (Interactively prompts data from user)
  const [activeEditField, setActiveEditField] = useState<EditableFieldType | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Preference Toggles (uses Primary Blue #006FFD)
  const [studyReminders, setStudyReminders] = useState<boolean>(
    config.notificationPreferences?.studyReminders ?? true
  );
  const [streakAlerts, setStreakAlerts] = useState<boolean>(
    config.notificationPreferences?.streakAlerts ?? true
  );
  const [mockAlerts, setMockAlerts] = useState<boolean>(
    config.notificationPreferences?.mockTestAnnouncements ?? true
  );

  // Display values
  const displayName = config.aspirantName || config.firstName || 'Dilkhush Jha';
  const displayEmail = config.email || 'dilkhush.jha@gmail.com';
  const displayYear = config.targetExamYear || 2027;
  const displayOptional = config.optionalSubject || 'Geography';
  const displayDailyHours = Math.round((config.dailyGoalMinutes || 240) / 60);
  const displayMedium = config.medium || 'Hindi';
  const displayStage = config.preparationStage || 'Prelims Intensive';
  const displayPlace = config.place || 'New Delhi, India';

  const initials =
    displayName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DJ';

  // Theme tokens
  const cardBg = isDark ? '#20232A' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAEDF2';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';

  // Handler for Interactive Field Edit Modal
  const openFieldEditor = (field: EditableFieldType) => {
    setActiveEditField(field);
    switch (field) {
      case 'targetExamYear':
        setTempValue(String(displayYear));
        break;
      case 'optionalSubject':
        setTempValue(displayOptional);
        break;
      case 'dailyGoalMinutes':
        setTempValue(String(displayDailyHours));
        break;
      case 'medium':
        setTempValue(displayMedium);
        break;
      case 'preparationStage':
        setTempValue(displayStage);
        break;
      case 'place':
        setTempValue(displayPlace);
        break;
      default:
        setTempValue('');
    }
  };

  const handleSaveField = async (customVal?: string) => {
    const val = customVal !== undefined ? customVal : tempValue;
    if (!activeEditField) return;

    try {
      if (activeEditField === 'targetExamYear') {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          await updateConfig({ targetExamYear: num });
        }
      } else if (activeEditField === 'optionalSubject') {
        await updateConfig({ optionalSubject: val.trim() });
      } else if (activeEditField === 'dailyGoalMinutes') {
        const hrs = parseInt(val, 10);
        if (!isNaN(hrs)) {
          await updateConfig({ dailyGoalMinutes: hrs * 60 });
        }
      } else if (activeEditField === 'medium') {
        await updateConfig({ medium: val as ExamMedium });
      } else if (activeEditField === 'preparationStage') {
        await updateConfig({ preparationStage: val as PreparationStage });
      } else if (activeEditField === 'place') {
        await updateConfig({ place: val.trim() });
      } else if (activeEditField === 'category') {
        await updateConfig({ category: val as SocialCategory });
      }
    } catch (e) {
      console.warn('Could not save profile field:', e);
    } finally {
      setActiveEditField(null);
    }
  };

  const handleToggleReminder = async (enabled: boolean) => {
    setStudyReminders(enabled);
    await updateConfig({
      notificationPreferences: {
        ...(config.notificationPreferences || {
          soundEnabled: true,
          vibrationEnabled: true,
          quietHoursEnabled: false,
          streakAlerts: true,
          currentAffairsDigest: true,
          focusModeDuringTests: true,
          mockTestAnnouncements: true,
        }),
        studyReminders: enabled,
      },
    });
  };

  const handleToggleStreakAlerts = async (enabled: boolean) => {
    setStreakAlerts(enabled);
    await updateConfig({
      notificationPreferences: {
        ...(config.notificationPreferences || {
          soundEnabled: true,
          vibrationEnabled: true,
          quietHoursEnabled: false,
          studyReminders: true,
          currentAffairsDigest: true,
          focusModeDuringTests: true,
          mockTestAnnouncements: true,
        }),
        streakAlerts: enabled,
      },
    });
  };

  const handleToggleMockAlerts = async (enabled: boolean) => {
    setMockAlerts(enabled);
    await updateConfig({
      notificationPreferences: {
        ...(config.notificationPreferences || {
          soundEnabled: true,
          vibrationEnabled: true,
          quietHoursEnabled: false,
          studyReminders: true,
          streakAlerts: true,
          currentAffairsDigest: true,
          focusModeDuringTests: true,
        }),
        mockTestAnnouncements: enabled,
      },
    });
  };

  // SUB-SCREEN 1: Edit Profile (Full Screen)
  if (currentScreen === 'edit-profile') {
    return (
      <EditProfileScreen
        isDark={isDark}
        onBack={() => setCurrentScreen('main')}
        onSaved={() => setCurrentScreen('main')}
      />
    );
  }

  // SUB-SCREEN 2: Settings (Full Screen)
  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        isDark={isDark}
        onBack={() => setCurrentScreen('main')}
        onToggleTheme={onToggleTheme}
        onOpenPrivacy={() => setCurrentScreen('privacy')}
        onOpenTerms={() => setCurrentScreen('terms')}
        onOpenNotificationSettings={() => setCurrentScreen('notification-settings')}
        onOpenFocusSettings={() => setCurrentScreen('focus-settings')}
        onNavigateToNotifications={() => onNavigateToTab?.('notifications')}
      />
    );
  }

  if (currentScreen === 'focus-settings') {
    return <FocusModeSettingsScreen isDark={isDark} onBack={() => setCurrentScreen('settings')} />;
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

  // SUB-SCREEN 5: Dedicated Subject Practice Review Screen (Full Page)
  if (currentScreen === 'subject-practice-review' && activeSubjectReviewGroup) {
    return (
      <SubjectPracticeReviewScreen
        isDark={isDark}
        subjectGroup={activeSubjectReviewGroup}
        onBack={() => {
          setActiveSubjectReviewGroup(null);
          setCurrentScreen('main');
        }}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* 1. TOP HEADER BAR */}
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
              styles.headerBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <ChevronLeft size={18} color={theme.textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.headerBarTitle, { color: theme.textPrimary }]}>
            Profile
          </Text>
        )}

        <View style={styles.headerRightRow}>
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.headerBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}>
              {isDark ? (
                <Sun size={16} color="#F59E0B" strokeWidth={2.4} />
              ) : (
                <Moon size={16} color="#6366F1" strokeWidth={2.4} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('settings')}
            accessibilityLabel="Settings"
            style={[
              styles.headerBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <Settings size={16} color={isDark ? '#9CA3AF' : '#6B7280'} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. SCROLLABLE BODY */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* HERO CARD: Clean Horizontal Identity Layout */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (config.avatarUri) {
                setIsEnlargePhotoOpen(true);
              } else {
                setCurrentScreen('edit-profile');
              }
            }}
            accessibilityLabel="Profile photo"
            style={styles.avatarWrap}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? '#181C26' : '#F1F3F7',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}>
              {config.avatarUri ? (
                <Image
                  source={{ uri: config.avatarUri }}
                  style={[
                    styles.avatarImg,
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
                <Text style={[styles.avatarInitials, { color: textPrimary }]}>
                  {initials}
                </Text>
              )}
            </View>

            <View style={[styles.avatarBadge, { backgroundColor: primaryBlue }]}>
              <Edit3 size={9} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          </TouchableOpacity>

          <View style={styles.heroDetailsCol}>
            <Text numberOfLines={1} style={[styles.heroName, { color: textPrimary }]}>
              {displayName}
            </Text>

            <Text numberOfLines={1} style={[styles.heroEmail, { color: textMuted }]}>
              {displayEmail}
            </Text>

            <View style={styles.heroTagsRow}>
              <View
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: isDark ? 'rgba(0, 111, 253, 0.15)' : '#EFF6FF',
                    borderColor: isDark ? 'rgba(0, 111, 253, 0.3)' : '#BFDBFE',
                  },
                ]}>
                <Text
                  style={[
                    styles.tagPillText,
                    { color: isDark ? '#93C5FD' : '#1D4ED8' },
                  ]}>
                  UPSC {displayYear}
                </Text>
              </View>

              <View
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                    borderColor: isDark ? '#383A44' : '#E5E7EB',
                  },
                ]}>
                <Text style={[styles.tagPillText, { color: textSecondary }]}>
                  {displayOptional}
                </Text>
              </View>
            </View>
          </View>

          {/* PRIMARY BLUE BUTTON FOR EDIT PROFILE */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('edit-profile')}
            style={[
              styles.editProfileBtn,
              {
                backgroundColor: primaryBlue, // Solid Primary Blue #006FFD
              },
            ]}>
            <Edit3 size={12} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.editProfileBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 3. SEGMENTED TABS CONTROLLER (Primary Blue Active State) */}
        <View
          style={[
            styles.segmentedTabsWrap,
            {
              backgroundColor: isDark ? '#191B22' : '#EFF1F5',
              borderColor: isDark ? '#2D3039' : '#E2E5EC',
            },
          ]}>
          {[
            { key: 'activity' as const, label: 'Activity' },
            { key: 'exam' as const, label: 'Exam Target' },
            { key: 'preferences' as const, label: 'Preferences' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabBtn,
                  isActive
                    ? {
                        backgroundColor: primaryBlue, // PRIMARY BLUE!
                        shadowColor: primaryBlue,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 3,
                      }
                    : {
                        backgroundColor: 'transparent',
                      },
                ]}>
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: isActive ? '#FFFFFF' : textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. TAB 1: ACTIVITY CONTENT */}
        {activeTab === 'activity' && (
          <ProfileActivitySection
            isDark={isDark}
            onNavigateToTab={onNavigateToTab}
            onOpenSubjectReview={(group) => {
              setActiveSubjectReviewGroup(group);
              setCurrentScreen('subject-practice-review');
            }}
          />
        )}

        {/* 5. TAB 2: EXAM TARGET CONTENT (Interactive Data from User) */}
        {activeTab === 'exam' && (
          <View
            style={[
              styles.groupedListCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}>
            {/* Header Hint */}
            <View style={[styles.cardTopHeader, { borderBottomColor: dividerColor }]}>
              <Text style={[styles.cardTopHeaderText, { color: textMuted }]}>
                Tap any row to update your exam settings
              </Text>
            </View>

            {/* Row 1: Target Year */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openFieldEditor('targetExamYear')}
              style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
              <View style={styles.groupRowLeft}>
                <CalendarDays size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.rowLabel, { color: textPrimary }]}>
                  Target Exam Year
                </Text>
              </View>
              <View style={styles.groupRowRight}>
                <Text style={[styles.rowValue, { color: textSecondary }]}>
                  {displayYear}
                </Text>
                <ChevronRight size={14} color={textMuted} />
              </View>
            </TouchableOpacity>

            {/* Row 2: Optional Subject */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openFieldEditor('optionalSubject')}
              style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
              <View style={styles.groupRowLeft}>
                <BookOpenCheck size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.rowLabel, { color: textPrimary }]}>
                  Optional Subject
                </Text>
              </View>
              <View style={styles.groupRowRight}>
                <Text style={[styles.rowValue, { color: textSecondary }]}>
                  {displayOptional}
                </Text>
                <ChevronRight size={14} color={textMuted} />
              </View>
            </TouchableOpacity>

            {/* Row 3: Daily Study Goal */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openFieldEditor('dailyGoalMinutes')}
              style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
              <View style={styles.groupRowLeft}>
                <Clock size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.rowLabel, { color: textPrimary }]}>
                  Daily Study Goal
                </Text>
              </View>
              <View style={styles.groupRowRight}>
                <Text style={[styles.rowValue, { color: textSecondary }]}>
                  {displayDailyHours} Hours / day
                </Text>
                <ChevronRight size={14} color={textMuted} />
              </View>
            </TouchableOpacity>

            {/* Row 4: Examination Medium */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openFieldEditor('medium')}
              style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
              <View style={styles.groupRowLeft}>
                <Languages size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.rowLabel, { color: textPrimary }]}>
                  Examination Medium
                </Text>
              </View>
              <View style={styles.groupRowRight}>
                <Text style={[styles.rowValue, { color: textSecondary }]}>
                  {displayMedium}
                </Text>
                <ChevronRight size={14} color={textMuted} />
              </View>
            </TouchableOpacity>

            {/* Row 5: Preparation Stage */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openFieldEditor('preparationStage')}
              style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
              <View style={styles.groupRowLeft}>
                <Compass size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.rowLabel, { color: textPrimary }]}>
                  Preparation Stage
                </Text>
              </View>
              <View style={styles.groupRowRight}>
                <Text style={[styles.rowValue, { color: textSecondary }]}>
                  {displayStage}
                </Text>
                <ChevronRight size={14} color={textMuted} />
              </View>
            </TouchableOpacity>

            {/* Row 6: Location */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openFieldEditor('place')}
              style={styles.groupRow}>
              <View style={styles.groupRowLeft}>
                <MapPin size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.rowLabel, { color: textPrimary }]}>
                  Study Location
                </Text>
              </View>
              <View style={styles.groupRowRight}>
                <Text style={[styles.rowValue, { color: textSecondary }]}>
                  {displayPlace}
                </Text>
                <ChevronRight size={14} color={textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. TAB 3: PREFERENCES CONTENT (Primary Blue Toggles) */}
        {activeTab === 'preferences' && (
          <View style={styles.preferencesTabWrap}>
            {/* Toggles Card */}
            <View
              style={[
                styles.groupedListCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}>
              <View style={[styles.cardTopHeader, { borderBottomColor: dividerColor }]}>
                <Text style={[styles.cardTopHeaderText, { color: textMuted }]}>
                  STUDY NOTIFICATIONS & ALERTS
                </Text>
              </View>

              {/* Toggle 1: Study Reminders */}
              <View style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
                <View style={styles.groupRowLeft}>
                  <Bell size={16} color={theme.textSecondary} strokeWidth={2} />
                  <View>
                    <Text style={[styles.rowLabel, { color: textPrimary }]}>
                      Daily Study Reminders
                    </Text>
                    <Text style={[styles.rowSubLabel, { color: textMuted }]}>
                      Alerts for goal milestones
                    </Text>
                  </View>
                </View>

                {/* PRIMARY BLUE TOGGLE SWITCH */}
                <PrimaryToggle
                  value={studyReminders}
                  onValueChange={handleToggleReminder}
                  isDark={isDark}
                />
              </View>

              {/* Toggle 2: Streak Alerts */}
              <View style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
                <View style={styles.groupRowLeft}>
                  <Clock size={16} color={theme.textSecondary} strokeWidth={2} />
                  <View>
                    <Text style={[styles.rowLabel, { color: textPrimary }]}>
                      Study Streak Protection
                    </Text>
                    <Text style={[styles.rowSubLabel, { color: textMuted }]}>
                      Reminders before midnight
                    </Text>
                  </View>
                </View>

                {/* PRIMARY BLUE TOGGLE SWITCH */}
                <PrimaryToggle
                  value={streakAlerts}
                  onValueChange={handleToggleStreakAlerts}
                  isDark={isDark}
                />
              </View>

              {/* Toggle 3: Mock Test Announcements */}
              <View style={styles.groupRow}>
                <View style={styles.groupRowLeft}>
                  <GraduationCap size={16} color={theme.textSecondary} strokeWidth={2} />
                  <View>
                    <Text style={[styles.rowLabel, { color: textPrimary }]}>
                      Mock Test Updates
                    </Text>
                    <Text style={[styles.rowSubLabel, { color: textMuted }]}>
                      New test series releases
                    </Text>
                  </View>
                </View>

                {/* PRIMARY BLUE TOGGLE SWITCH */}
                <PrimaryToggle
                  value={mockAlerts}
                  onValueChange={handleToggleMockAlerts}
                  isDark={isDark}
                />
              </View>
            </View>

            {/* Legal & App Info Card */}
            <View
              style={[
                styles.groupedListCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  marginTop: 14,
                },
              ]}>
              <View style={[styles.cardTopHeader, { borderBottomColor: dividerColor }]}>
                <Text style={[styles.cardTopHeaderText, { color: textMuted }]}>
                  APPLICATION & LEGAL
                </Text>
              </View>

              {/* Privacy Policy */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentScreen('privacy')}
                style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
                <View style={styles.groupRowLeft}>
                  <Lock size={16} color={theme.textSecondary} strokeWidth={2} />
                  <Text style={[styles.rowLabel, { color: textPrimary }]}>
                    Privacy Policy
                  </Text>
                </View>
                <View style={styles.groupRowRight}>
                  <Text style={[styles.rowValue, { color: textMuted }]}>v2.4</Text>
                  <ChevronRight size={14} color={textMuted} />
                </View>
              </TouchableOpacity>

              {/* Terms of Service */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentScreen('terms')}
                style={[styles.groupRow, { borderBottomColor: dividerColor }]}>
                <View style={styles.groupRowLeft}>
                  <FileText size={16} color={theme.textSecondary} strokeWidth={2} />
                  <Text style={[styles.rowLabel, { color: textPrimary }]}>
                    Terms of Service
                  </Text>
                </View>
                <ChevronRight size={14} color={textMuted} />
              </TouchableOpacity>

              {/* App Build */}
              <View style={styles.groupRow}>
                <View style={styles.groupRowLeft}>
                  <Smartphone size={16} color={theme.textSecondary} strokeWidth={2} />
                  <Text style={[styles.rowLabel, { color: textPrimary }]}>
                    Application Version
                  </Text>
                </View>
                <Text style={[styles.rowValue, { color: textMuted }]}>
                  1.0.0 (Build 2026.10)
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* INTERACTIVE FIELD EDIT MODAL (Asks Data from User)        */}
      {/* ========================================================= */}
      <Modal
        visible={Boolean(activeEditField)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveEditField(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActiveEditField(null)}
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
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  {activeEditField === 'targetExamYear' && 'Target Exam Year'}
                  {activeEditField === 'optionalSubject' && 'Optional Subject'}
                  {activeEditField === 'dailyGoalMinutes' && 'Daily Study Goal'}
                  {activeEditField === 'medium' && 'Examination Medium'}
                  {activeEditField === 'preparationStage' && 'Preparation Stage'}
                  {activeEditField === 'place' && 'Study Location'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: textMuted }]}>
                  {activeEditField === 'targetExamYear' && 'Select the UPSC CSE cycle you are preparing for'}
                  {activeEditField === 'optionalSubject' && 'Choose your optional paper subject'}
                  {activeEditField === 'dailyGoalMinutes' && 'Set target study focus hours per day'}
                  {activeEditField === 'medium' && 'Select your language medium'}
                  {activeEditField === 'preparationStage' && 'Current preparation phase'}
                  {activeEditField === 'place' && 'City or location of study'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setActiveEditField(null)}
                hitSlop={8}
                style={styles.modalCloseBtn}>
                <X size={18} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Field-Specific Options */}

            {/* 1. Target Exam Year Chips */}
            {activeEditField === 'targetExamYear' && (
              <View style={styles.chipsGrid}>
                {[2025, 2026, 2027, 2028, 2029].map((yr) => {
                  const isSelected = tempValue === String(yr);
                  return (
                    <TouchableOpacity
                      key={yr}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTempValue(String(yr));
                        void handleSaveField(String(yr));
                      }}
                      style={[
                        styles.chipOption,
                        isSelected
                          ? { backgroundColor: primaryBlue, borderColor: primaryBlue }
                          : { backgroundColor: isDark ? '#282A33' : '#F3F4F6', borderColor: isDark ? '#3D3F4A' : '#E5E7EB' },
                      ]}>
                      <Text
                        style={[
                          styles.chipOptionText,
                          {
                            color: isSelected ? '#FFFFFF' : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 2. Optional Subject Chips + Input */}
            {activeEditField === 'optionalSubject' && (
              <View style={styles.modalBody}>
                <View style={styles.chipsGrid}>
                  {[
                    'PSIR',
                    'Geography',
                    'History',
                    'Sociology',
                    'Public Admin',
                    'Anthropology',
                    'Philosophy',
                    'Economics',
                    'Law',
                  ].map((subj) => {
                    const isSelected = tempValue === subj;
                    return (
                      <TouchableOpacity
                        key={subj}
                        activeOpacity={0.7}
                        onPress={() => {
                          setTempValue(subj);
                          void handleSaveField(subj);
                        }}
                        style={[
                          styles.chipOption,
                          isSelected
                            ? { backgroundColor: primaryBlue, borderColor: primaryBlue }
                            : { backgroundColor: isDark ? '#282A33' : '#F3F4F6', borderColor: isDark ? '#3D3F4A' : '#E5E7EB' },
                        ]}>
                        <Text
                          style={[
                            styles.chipOptionText,
                            {
                              color: isSelected ? '#FFFFFF' : textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {subj}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  value={tempValue}
                  onChangeText={setTempValue}
                  placeholder="Or enter custom optional..."
                  placeholderTextColor={textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark ? '#282A33' : '#F9FAFB',
                      borderColor: isDark ? '#3D3F4A' : '#D1D5DB',
                      color: textPrimary,
                    },
                  ]}
                />
              </View>
            )}

            {/* 3. Daily Study Goal Chips */}
            {activeEditField === 'dailyGoalMinutes' && (
              <View style={styles.chipsGrid}>
                {[2, 4, 6, 8, 10, 12].map((hrs) => {
                  const isSelected = tempValue === String(hrs);
                  return (
                    <TouchableOpacity
                      key={hrs}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTempValue(String(hrs));
                        void handleSaveField(String(hrs));
                      }}
                      style={[
                        styles.chipOption,
                        isSelected
                          ? { backgroundColor: primaryBlue, borderColor: primaryBlue }
                          : { backgroundColor: isDark ? '#282A33' : '#F3F4F6', borderColor: isDark ? '#3D3F4A' : '#E5E7EB' },
                      ]}>
                      <Text
                        style={[
                          styles.chipOptionText,
                          {
                            color: isSelected ? '#FFFFFF' : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {hrs} Hours / day
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 4. Medium Chips */}
            {activeEditField === 'medium' && (
              <View style={styles.chipsGrid}>
                {['English', 'Hindi'].map((med) => {
                  const isSelected = tempValue === med;
                  return (
                    <TouchableOpacity
                      key={med}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTempValue(med);
                        void handleSaveField(med);
                      }}
                      style={[
                        styles.chipOption,
                        isSelected
                          ? { backgroundColor: primaryBlue, borderColor: primaryBlue }
                          : { backgroundColor: isDark ? '#282A33' : '#F3F4F6', borderColor: isDark ? '#3D3F4A' : '#E5E7EB' },
                      ]}>
                      <Text
                        style={[
                          styles.chipOptionText,
                          {
                            color: isSelected ? '#FFFFFF' : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {med}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 5. Preparation Stage Chips */}
            {activeEditField === 'preparationStage' && (
              <View style={styles.stageOptionsList}>
                {[
                  'Beginner Foundation',
                  'Prelims Intensive',
                  'Mains Answer Writing',
                  'Interview Guidance',
                ].map((stg) => {
                  const isSelected = tempValue === stg;
                  return (
                    <TouchableOpacity
                      key={stg}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTempValue(stg);
                        void handleSaveField(stg);
                      }}
                      style={[
                        styles.stageOptionBtn,
                        isSelected
                          ? { backgroundColor: primaryBlue, borderColor: primaryBlue }
                          : { backgroundColor: isDark ? '#282A33' : '#F3F4F6', borderColor: isDark ? '#3D3F4A' : '#E5E7EB' },
                      ]}>
                      <Text
                        style={[
                          styles.stageOptionBtnText,
                          {
                            color: isSelected ? '#FFFFFF' : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {stg}
                      </Text>
                      {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={2.8} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 6. Location Input + Suggestions */}
            {activeEditField === 'place' && (
              <View style={styles.modalBody}>
                <TextInput
                  value={tempValue}
                  onChangeText={setTempValue}
                  placeholder="e.g. New Delhi, India"
                  placeholderTextColor={textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark ? '#282A33' : '#F9FAFB',
                      borderColor: isDark ? '#3D3F4A' : '#D1D5DB',
                      color: textPrimary,
                    },
                  ]}
                />

                <Text style={[styles.suggestionLabel, { color: textMuted }]}>
                  Quick suggestions:
                </Text>
                <View style={styles.chipsGrid}>
                  {[
                    'New Delhi, India',
                    'Patna, Bihar',
                    'Bangalore, Karnataka',
                    'Hyderabad, Telangana',
                    'Jaipur, Rajasthan',
                    'Pune, Maharashtra',
                  ].map((city) => (
                    <TouchableOpacity
                      key={city}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTempValue(city);
                        void handleSaveField(city);
                      }}
                      style={[
                        styles.chipOptionSmall,
                        {
                          backgroundColor: isDark ? '#282A33' : '#F3F4F6',
                          borderColor: isDark ? '#3D3F4A' : '#E5E7EB',
                        },
                      ]}>
                      <Text style={[styles.chipOptionTextSmall, { color: textPrimary }]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Save Button */}
            {(activeEditField === 'place' || activeEditField === 'optionalSubject') && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSaveField()}
                style={[styles.modalSaveBtn, { backgroundColor: primaryBlue }]}>
                <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Photo Enlarge Viewer Modal */}
      {config.avatarUri && (
        <PhotoViewerModal
          visible={isEnlargePhotoOpen}
          imageUri={config.avatarUri}
          title={displayName}
          onClose={() => setIsEnlargePhotoOpen(false)}
          onEdit={() => {
            setIsEnlargePhotoOpen(false);
            setCurrentScreen('edit-profile');
          }}
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.3,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  desktopScrollContent: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroDetailsCol: {
    flex: 1,
    gap: 3,
  },
  heroName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.2,
  },
  heroEmail: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  heroTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    shadowColor: '#006FFD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
  segmentedTabsWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7.5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontFamily: Typography.fontFamily,
  },
  groupedListCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTopHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.4,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.1,
  },
  rowSubLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily,
    marginTop: 1,
  },
  groupRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
  preferencesTabWrap: {
    gap: 14,
  },
  primaryToggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  primaryToggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chipOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipOptionText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  chipOptionSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipOptionTextSmall: {
    fontSize: 11.5,
    fontFamily: Typography.fontFamily,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    marginTop: 4,
  },
  stageOptionsList: {
    gap: 8,
    marginBottom: 10,
  },
  stageOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  stageOptionBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    marginTop: 10,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
});
