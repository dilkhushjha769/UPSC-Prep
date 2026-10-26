import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Flame,
  Globe,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Target,
  X,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { ExamMedium } from '@/types/study';

interface ProfileViewProps {
  isDark: boolean;
  onNavigateToTab?: (tabKey: any) => void;
  onToggleTheme?: () => void;
  onBack?: () => void;
}

const POPULAR_OPTIONALS = [
  'PSIR',
  'Geography',
  'History',
  'Sociology',
  'Public Admin',
  'Anthropology',
  'Philosophy',
  'Economics',
];

const TARGET_YEARS = [2025, 2026, 2027, 2028];
const DAILY_HOUR_OPTIONS = [4, 6, 8, 10];

export function ProfileView({
  isDark,
  onNavigateToTab,
  onToggleTheme,
  onBack,
}: ProfileViewProps) {
  const { config, streak, updateConfig, resetToDefaults } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [targetYearInput, setTargetYearInput] = useState(2026);
  const [optionalInput, setOptionalInput] = useState('PSIR');
  const [dailyHoursInput, setDailyHoursInput] = useState(6);
  const [mediumInput, setMediumInput] = useState<ExamMedium>('English');

  // Display values
  const displayName = config.aspirantName || config.firstName || 'Dilkhush Jha';
  const displayEmail = config.email || 'aspirant@upscprep.com';
  const displayYear = config.targetExamYear || 2026;
  const displayOptional = config.optionalSubject || 'PSIR (Political Science)';
  const displayDailyHours = Math.round((config.dailyGoalMinutes || 360) / 60);
  const displayMedium = config.medium || 'English';

  // Avatar Initials
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'UP';

  const handleOpenEdit = () => {
    setNameInput(displayName);
    setEmailInput(displayEmail);
    setTargetYearInput(displayYear);
    setOptionalInput(config.optionalSubject || 'PSIR');
    setDailyHoursInput(displayDailyHours);
    setMediumInput(displayMedium);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    await updateConfig({
      aspirantName: nameInput.trim() || displayName,
      email: emailInput.trim() || displayEmail,
      targetExamYear: targetYearInput,
      optionalSubject: optionalInput.trim() || displayOptional,
      dailyGoalMinutes: dailyHoursInput * 60,
      medium: mediumInput,
    });
    setIsEditModalOpen(false);
  };

  const handleConfirmReset = async () => {
    await resetToDefaults();
    setIsResetConfirmOpen(false);
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.bg,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
        ]}>
        {Boolean(onBack) ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            accessibilityLabel="Back to Home"
            style={[
              styles.navIconBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F3F6',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
              },
            ]}>
            <ChevronLeft size={20} color={theme.textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : (
          <View style={styles.navPlaceholder} />
        )}

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Profile
          </Text>
        </View>

        <View style={styles.headerActions}>
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.navIconBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark
                    ? 'rgba(251, 191, 36, 0.12)'
                    : 'rgba(99, 102, 241, 0.08)',
                  borderColor: isDark
                    ? 'rgba(251, 191, 36, 0.28)'
                    : 'rgba(99, 102, 241, 0.22)',
                },
              ]}>
              {isDark ? (
                <Sun size={17} color="#FBBF24" strokeWidth={2.3} />
              ) : (
                <Moon size={17} color="#4F46E5" strokeWidth={2.3} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenEdit}
            accessibilityLabel="Edit Profile"
            style={[
              styles.navIconBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F3F6',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
              },
            ]}>
            <Edit3 size={15} color={theme.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Hero Identity Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#141824' : '#FFFFFF',
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.heroTopRow}>
            {/* Avatar Circle */}
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? '#1E263D' : '#0F172A',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                },
              ]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <View style={styles.heroDetails}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.heroName, { color: theme.textPrimary }]}
                  numberOfLines={1}>
                  {displayName}
                </Text>
                <View
                  style={[
                    styles.verifiedPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(16, 185, 129, 0.12)',
                      borderColor: isDark
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(16, 185, 129, 0.25)',
                    },
                  ]}>
                  <ShieldCheck size={12} color="#10B981" strokeWidth={2.4} />
                  <Text style={styles.verifiedText}>Aspirant</Text>
                </View>
              </View>

              <Text style={[styles.heroEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                {displayEmail}
              </Text>

              <View
                style={[
                  styles.targetBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'rgba(99, 102, 241, 0.08)',
                    borderColor: isDark
                      ? 'rgba(99, 102, 241, 0.28)'
                      : 'rgba(99, 102, 241, 0.2)',
                  },
                ]}>
                <Target size={12} color="#6366F1" strokeWidth={2.2} />
                <Text style={styles.targetBadgeText}>
                  UPSC CSE {displayYear} Goal
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Edit Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleOpenEdit}
            style={[
              styles.editDetailsBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Edit3 size={13} color={theme.textPrimary} strokeWidth={2.2} />
            <Text style={[styles.editDetailsBtnText, { color: theme.textPrimary }]}>
              Edit Aspirant Details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Highlight Metrics (Mobbin 3-stat bar) */}
        <View style={styles.metricRow}>
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
              ]}>
              <Flame size={17} color="#F59E0B" strokeWidth={2.4} />
            </View>
            <Text style={[styles.metricNumber, { color: theme.textPrimary }]}>
              {streak.currentStreak || 8} Days
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Current Streak
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: 'rgba(99, 102, 241, 0.12)' },
              ]}>
              <Clock size={17} color="#6366F1" strokeWidth={2.4} />
            </View>
            <Text style={[styles.metricNumber, { color: theme.textPrimary }]}>
              {displayDailyHours} Hours
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Daily Target
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
              ]}>
              <BookOpen size={17} color="#10B981" strokeWidth={2.4} />
            </View>
            <Text
              style={[styles.metricNumber, { color: theme.textPrimary }]}
              numberOfLines={1}>
              {config.optionalSubject ? config.optionalSubject.split(' ')[0] : 'PSIR'}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Optional
            </Text>
          </View>
        </View>

        {/* Section 1: Exam Target & Strategy (Grouped List) */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textMuted }]}>
            EXAM TARGET & STRATEGY
          </Text>

          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            {/* Target Year Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenEdit}
              style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#1C2234' : '#EFF6FF' },
                ]}>
                <Calendar size={16} color="#3B82F6" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Target Exam Year
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Civil Services Examination
                </Text>
              </View>
              <Text style={[styles.cellValue, { color: theme.textPrimary }]}>
                {displayYear}
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </TouchableOpacity>

            <View
              style={[
                styles.cellDivider,
                { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            />

            {/* Optional Subject Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenEdit}
              style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#1E2522' : '#ECFDF5' },
                ]}>
                <BookOpen size={16} color="#10B981" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Optional Subject
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Mains Paper I & II (500 Marks)
                </Text>
              </View>
              <Text style={[styles.cellValue, { color: theme.textPrimary }]} numberOfLines={1}>
                {displayOptional}
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </TouchableOpacity>

            <View
              style={[
                styles.cellDivider,
                { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            />

            {/* Daily Goal Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenEdit}
              style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#261F1A' : '#FFF7ED' },
                ]}>
                <Clock size={16} color="#F97316" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Daily Study Goal
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Minimum target for streak
                </Text>
              </View>
              <Text style={[styles.cellValue, { color: theme.textPrimary }]}>
                {displayDailyHours} Hours / day
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </TouchableOpacity>

            <View
              style={[
                styles.cellDivider,
                { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            />

            {/* Examination Medium Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenEdit}
              style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#221D2C' : '#F5F3FF' },
                ]}>
                <Globe size={16} color="#8B5CF6" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Exam Medium
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Question papers & answers
                </Text>
              </View>
              <Text style={[styles.cellValue, { color: theme.textPrimary }]}>
                {displayMedium}
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Preferences */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textMuted }]}>
            PREFERENCES
          </Text>

          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            {/* Dark Mode Switch Row */}
            <View style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#262217' : '#FEF3C7' },
                ]}>
                {isDark ? (
                  <Moon size={16} color="#FBBF24" strokeWidth={2.2} />
                ) : (
                  <Sun size={16} color="#F59E0B" strokeWidth={2.2} />
                )}
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Appearance
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => onToggleTheme?.()}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.cellDivider,
                { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            />

            {/* Notifications Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigateToTab?.('notifications')}
              style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#1C2234' : '#EEF2FF' },
                ]}>
                <Bell size={16} color="#6366F1" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Notifications
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Daily alerts & class updates
                </Text>
              </View>
              <ChevronRight size={15} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Data & Account */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textMuted }]}>
            DATA & BACKUP
          </Text>

          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            {/* Cloud Sync Status */}
            <View style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#15241E' : '#ECFDF5' },
                ]}>
                <CheckCircle2 size={16} color="#10B981" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: theme.textPrimary }]}>
                  Cloud Backup
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Sync with Supabase Cloud
                </Text>
              </View>
              <View style={styles.statusOnlineTag}>
                <View style={styles.statusDot} />
                <Text style={styles.statusOnlineText}>Active</Text>
              </View>
            </View>

            <View
              style={[
                styles.cellDivider,
                { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            />

            {/* Reset Streak Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsResetConfirmOpen(true)}
              style={styles.cellRow}>
              <View
                style={[
                  styles.cellIconWrap,
                  { backgroundColor: isDark ? '#2B171A' : '#FEF2F2' },
                ]}>
                <RotateCcw size={16} color="#EF4444" strokeWidth={2.2} />
              </View>
              <View style={styles.cellContent}>
                <Text style={[styles.cellLabel, { color: '#EF4444' }]}>
                  Reset Study Progress
                </Text>
                <Text style={[styles.cellSubtitle, { color: theme.textMuted }]}>
                  Re-initialize demo study sessions
                </Text>
              </View>
              <ChevronRight size={15} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 3. Simple & Focused Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Edit Aspirant Profile
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  Essential preparation goals & details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              {/* Name Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Full Name
                </Text>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#1C2234' : '#F8FAFC',
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Email Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Email Address
                </Text>
                <TextInput
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#1C2234' : '#F8FAFC',
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Target Year Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Target Exam Year
                </Text>
                <View style={styles.pillsRow}>
                  {TARGET_YEARS.map((yr) => {
                    const isSelected = targetYearInput === yr;
                    return (
                      <Pressable
                        key={yr}
                        onPress={() => setTargetYearInput(yr)}
                        style={[
                          styles.pillOption,
                          {
                            backgroundColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#1C2234'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#2B344C'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.pillOptionText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {yr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Optional Subject Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Optional Subject
                </Text>
                <View style={styles.pillsRow}>
                  {POPULAR_OPTIONALS.map((opt) => {
                    const isSelected = optionalInput.toLowerCase().includes(opt.toLowerCase());
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setOptionalInput(opt)}
                        style={[
                          styles.pillOption,
                          {
                            backgroundColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#1C2234'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#2B344C'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.pillOptionText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Daily Study Goal */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Daily Study Goal
                </Text>
                <View style={styles.pillsRow}>
                  {DAILY_HOUR_OPTIONS.map((hrs) => {
                    const isSelected = dailyHoursInput === hrs;
                    return (
                      <Pressable
                        key={hrs}
                        onPress={() => setDailyHoursInput(hrs)}
                        style={[
                          styles.pillOption,
                          {
                            backgroundColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#1C2234'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#2B344C'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.pillOptionText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {hrs} Hours
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Examination Medium */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Examination Medium
                </Text>
                <View style={styles.pillsRow}>
                  {(['English', 'Hindi'] as ExamMedium[]).map((med) => {
                    const isSelected = mediumInput === med;
                    return (
                      <Pressable
                        key={med}
                        onPress={() => setMediumInput(med)}
                        style={[
                          styles.pillOption,
                          {
                            backgroundColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#1C2234'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? '#0F172A'
                              : isDark
                              ? '#2B344C'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.pillOptionText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {med}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsEditModalOpen(false)}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#1C2234' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveEdit}
                style={[
                  styles.saveBtn,
                  { backgroundColor: isDark ? '#F8FAFC' : '#0F172A' },
                ]}>
                <Check size={16} color={isDark ? '#0F1117' : '#FFFFFF'} strokeWidth={2.4} />
                <Text
                  style={[
                    styles.saveBtnText,
                    { color: isDark ? '#0F1117' : '#FFFFFF' },
                  ]}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Reset Confirmation Modal */}
      <Modal visible={isResetConfirmOpen} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            <View
              style={[
                styles.confirmIconCircle,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                },
              ]}>
              <RotateCcw size={22} color="#EF4444" strokeWidth={2.2} />
            </View>

            <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
              Reset Study Data?
            </Text>
            <Text style={[styles.confirmDesc, { color: theme.textSecondary }]}>
              This will re-initialize study sessions and streak records to demo defaults.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                onPress={() => setIsResetConfirmOpen(false)}
                style={[
                  styles.confirmCancelBtn,
                  {
                    backgroundColor: isDark ? '#1C2234' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.confirmCancelText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmReset}
                style={styles.confirmDeleteBtn}>
                <Text style={styles.confirmDeleteText}>Reset Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  navPlaceholder: {
    width: 38,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
    width: '100%',
  },
  desktopScrollContent: {
    maxWidth: 680,
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10B981',
  },
  heroEmail: {
    fontSize: 12.5,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  editDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  editDetailsBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupedCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cellIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellContent: {
    flex: 1,
  },
  cellLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  cellSubtitle: {
    fontSize: 11.5,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  cellDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  statusOnlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusOnlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  formScroll: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillOptionText: {
    fontSize: 12,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  confirmDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
