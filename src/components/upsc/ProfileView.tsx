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
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
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

const TARGET_YEARS = [2025, 2026, 2027, 2028];
const DAILY_HOURS = [4, 6, 8, 10];
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

export function ProfileView({
  isDark,
  onNavigateToTab,
  onToggleTheme,
  onBack,
}: ProfileViewProps) {
  const { config, updateConfig, resetToDefaults } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form input state
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [targetYearInput, setTargetYearInput] = useState(2026);
  const [optionalInput, setOptionalInput] = useState('PSIR');
  const [dailyHoursInput, setDailyHoursInput] = useState(6);
  const [mediumInput, setMediumInput] = useState<ExamMedium>('English');

  // Display values
  const displayName = config.aspirantName || config.firstName || 'Dilkhush Jha';
  const displayEmail = config.email || 'dilkhush.jha@gmail.com';
  const displayYear = config.targetExamYear || 2026;
  const displayOptional = config.optionalSubject || 'PSIR';
  const displayDailyHours = Math.round((config.dailyGoalMinutes || 360) / 60);
  const displayMedium = config.medium || 'English';

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DJ';

  const handleOpenEdit = () => {
    setNameInput(displayName);
    setEmailInput(displayEmail);
    setTargetYearInput(displayYear);
    setOptionalInput(displayOptional);
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

  const dividerStyle = [
    styles.rowDivider,
    { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)' },
  ];

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
            onPress={handleOpenEdit}
            style={[
              styles.navEditBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
              },
            ]}>
            <Text
              style={[
                styles.navEditBtnText,
                { color: isDark ? '#09090B' : '#FFFFFF' },
              ]}>
              Edit
            </Text>
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
          <View
            style={[
              styles.avatarBox,
              {
                backgroundColor: isDark ? '#181C26' : '#F1F3F7',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}>
            <Text style={[styles.avatarInitialsText, { color: theme.textPrimary }]}>
              {initials}
            </Text>
          </View>

          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {displayName}
          </Text>

          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {displayEmail}
          </Text>

          <View
            style={[
              styles.aspirantPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}>
            <Text style={[styles.aspirantPillText, { color: theme.textSecondary }]}>
              UPSC CSE {displayYear} · {displayOptional}
            </Text>
          </View>
        </View>

        {/* SECTION 1: EXAM TARGET (Flat, Hairline-Divided Rows) */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            EXAM TARGET
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenEdit}
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
            onPress={handleOpenEdit}
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
            onPress={handleOpenEdit}
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
            onPress={handleOpenEdit}
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

        {/* SECTION 2: PREFERENCES (Flat, Hairline-Divided Rows) */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            PREFERENCES
          </Text>

          <View style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={() => onToggleTheme?.()}
              trackColor={{ false: '#CBD5E1', true: isDark ? '#475569' : '#0F172A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigateToTab?.('notifications')}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Notifications
            </Text>
            <View style={styles.rowRightGroup}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
                Daily Alerts
              </Text>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 3: SYSTEM & DATA */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
            DATA
          </Text>

          <View style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Cloud Backup
            </Text>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
              Synchronized
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsResetConfirmOpen(true)}
            style={[styles.listRow, dividerStyle]}>
            <Text style={[styles.rowLabel, { color: isDark ? '#F87171' : '#DC2626' }]}>
              Reset Study Data
            </Text>
            <View style={styles.rowRightGroup}>
              <ChevronRight size={15} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* 3. Minimalist Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            {/* Modal Title Row */}
            <View style={styles.modalTopRow}>
              <Text style={[styles.modalHeading, { color: theme.textPrimary }]}>
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseIcon}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  NAME
                </Text>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your Name"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.plainTextInput,
                    {
                      backgroundColor: isDark ? '#1A1F2D' : '#F8FAFC',
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  EMAIL
                </Text>
                <TextInput
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.plainTextInput,
                    {
                      backgroundColor: isDark ? '#1A1F2D' : '#F8FAFC',
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Target Exam Year */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  TARGET EXAM YEAR
                </Text>
                <View style={styles.minimalPillRow}>
                  {TARGET_YEARS.map((yr) => {
                    const isSelected = targetYearInput === yr;
                    return (
                      <Pressable
                        key={yr}
                        onPress={() => setTargetYearInput(yr)}
                        style={[
                          styles.minimalPill,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#1A1F2D'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#272E3F'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.minimalPillText,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#09090B'
                                  : '#FFFFFF'
                                : theme.textPrimary,
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

              {/* Optional Subject */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  OPTIONAL SUBJECT
                </Text>
                <View style={styles.minimalPillRow}>
                  {POPULAR_OPTIONALS.map((opt) => {
                    const isSelected = optionalInput.toLowerCase() === opt.toLowerCase();
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setOptionalInput(opt)}
                        style={[
                          styles.minimalPill,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#1A1F2D'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#272E3F'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.minimalPillText,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#09090B'
                                  : '#FFFFFF'
                                : theme.textPrimary,
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

              {/* Daily Goal */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  DAILY STUDY GOAL
                </Text>
                <View style={styles.minimalPillRow}>
                  {DAILY_HOURS.map((hrs) => {
                    const isSelected = dailyHoursInput === hrs;
                    return (
                      <Pressable
                        key={hrs}
                        onPress={() => setDailyHoursInput(hrs)}
                        style={[
                          styles.minimalPill,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#1A1F2D'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#272E3F'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.minimalPillText,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#09090B'
                                  : '#FFFFFF'
                                : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {hrs}h / day
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Medium */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  MEDIUM
                </Text>
                <View style={styles.minimalPillRow}>
                  {(['English', 'Hindi'] as ExamMedium[]).map((med) => {
                    const isSelected = mediumInput === med;
                    return (
                      <Pressable
                        key={med}
                        onPress={() => setMediumInput(med)}
                        style={[
                          styles.minimalPill,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#1A1F2D'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? isDark
                                ? '#FFFFFF'
                                : '#0F172A'
                              : isDark
                              ? '#272E3F'
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.minimalPillText,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#09090B'
                                  : '#FFFFFF'
                                : theme.textPrimary,
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

            {/* Modal Bottom Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={[
                  styles.sheetCancelBtn,
                  {
                    backgroundColor: isDark ? '#1C2230' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[
                  styles.sheetSaveBtn,
                  { backgroundColor: isDark ? '#FFFFFF' : '#0F172A' },
                ]}>
                <Text
                  style={[
                    styles.sheetSaveText,
                    { color: isDark ? '#09090B' : '#FFFFFF' },
                  ]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Reset Confirmation Dialog */}
      <Modal visible={isResetConfirmOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.resetDialog,
              {
                backgroundColor: isDark ? '#141824' : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.resetDialogTitle, { color: theme.textPrimary }]}>
              Reset Study Data?
            </Text>
            <Text style={[styles.resetDialogDesc, { color: theme.textSecondary }]}>
              This will re-initialize study sessions and streak records to defaults.
            </Text>

            <View style={styles.resetBtnRow}>
              <TouchableOpacity
                onPress={() => setIsResetConfirmOpen(false)}
                style={[
                  styles.sheetCancelBtn,
                  {
                    backgroundColor: isDark ? '#1C2230' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmReset}
                style={[
                  styles.sheetSaveBtn,
                  { backgroundColor: isDark ? '#EF4444' : '#DC2626' },
                ]}>
                <Text style={[styles.sheetSaveText, { color: '#FFFFFF' }]}>
                  Reset
                </Text>
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
    width: 36,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navEditBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    width: '100%',
  },
  desktopScrollContent: {
    maxWidth: 620,
    alignSelf: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitialsText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12.5,
    marginBottom: 10,
  },
  aspirantPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  aspirantPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '82%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  plainTextInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  minimalPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  minimalPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  minimalPillText: {
    fontSize: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetSaveBtn: {
    flex: 1.2,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  resetDialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  resetDialogDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  resetBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
