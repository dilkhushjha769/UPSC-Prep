/// <reference path="../../../types/react-native-fix.d.ts" />
// @ts-ignore
import React, { Fragment, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  CheckCircle,
  RotateCcw,
  Save,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import {
  ExamMedium,
  PreparationStage,
} from '@/types/study';

interface ProfileSettingsProps {
  isDark: boolean;
  onSaved?: () => void;
}

const COMMON_OPTIONALS = [
  'Geography',
  'PSIR',
  'Public Administration',
  'Sociology',
  'Anthropology',
  'History',
  'Economics',
];

const STAGES: PreparationStage[] = [
  'Foundation',
  'Prelims Intensive',
  'Mains Focus',
  'Interview / Personality Test',
];

const TARGET_YEARS = [2025, 2026, 2027, 2028];
const MEDIUMS: ExamMedium[] = ['English', 'Hindi'];

export function ProfileSettings({ isDark, onSaved }: ProfileSettingsProps) {
  const { config, updateConfig, resetToDefaults } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isNarrow = width < 500;

  // Form State
  const [firstName, setFirstName] = useState(config.firstName || 'Dipanker');
  const [lastName, setLastName] = useState(config.lastName || 'Biswas');
  const [email, setEmail] = useState(config.email || 'dipanker.biswas@gmail.com');
  const [mobile, setMobile] = useState(config.mobile || '+91-9123456780');
  const [gender, setGender] = useState(config.gender || 'Male');
  const [residentialStatus, setResidentialStatus] = useState(config.residentialStatus || 'Indian');
  const [profession, setProfession] = useState(config.profession || 'Self Employeed');
  const [organisationName, setOrganisationName] = useState(config.organisationName || 'Zendot');
  const [fatherName, setFatherName] = useState(config.fatherName || 'Dipanker');
  const [place, setPlace] = useState(config.place || 'New Delhi, India');
  const [dateOfBirth, setDateOfBirth] = useState(config.dateOfBirth || '1990-01-01');
  const category = config.category || 'General';

  const [targetExamYear, setTargetExamYear] = useState<number>(config.targetExamYear || 2027);
  const [examPhase, setExamPhase] = useState(config.examPhase || 'UPSC CSE 2027 • Prelims & Mains');
  const [targetExamDate, setTargetExamDate] = useState(config.targetExamDate || '2027-05-23');
  const [optionalSubject, setOptionalSubject] = useState(config.optionalSubject || 'Geography');
  const [medium, setMedium] = useState<ExamMedium>(config.medium || 'English');
  const [stage, setStage] = useState<PreparationStage>(config.preparationStage || 'Prelims Intensive');

  const [dailyGoalHours, setDailyGoalHours] = useState(
    (config.dailyGoalMinutes / 60).toString()
  );
  const [mockScore, setMockScore] = useState(
    (config.mockAverageScore || 108.5).toString()
  );
  const [mockCount, setMockCount] = useState(
    (config.mockTestsAttempted || 18).toString()
  );
  const [syllabusPercent, setSyllabusPercent] = useState(
    (config.syllabusCompletionPercent || 68).toString()
  );

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async () => {
    const hours = parseFloat(dailyGoalHours) || 6;
    const score = parseFloat(mockScore) || 108.5;
    const count = parseInt(mockCount, 10) || 18;
    const syllabus = Math.min(100, Math.max(0, parseInt(syllabusPercent, 10) || 68));

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Dipanker Biswas';

    await updateConfig({
      aspirantName: fullName,
      firstName: firstName.trim() || 'Dipanker',
      lastName: lastName.trim() || 'Biswas',
      email: email.trim() || 'dipanker.biswas@gmail.com',
      mobile: mobile.trim() || '+91-9123456780',
      gender: gender.trim() || 'Male',
      residentialStatus: residentialStatus.trim() || 'Indian',
      profession: profession.trim() || 'Self Employeed',
      organisationName: organisationName.trim() || 'Zendot',
      fatherName: fatherName.trim() || 'Dipanker',
      place: place.trim() || 'New Delhi, India',
      dateOfBirth: dateOfBirth.trim() || '1990-01-01',
      category,
      targetExamYear,
      examPhase: examPhase.trim() || `UPSC CSE ${targetExamYear} • Prelims & Mains`,
      targetExamDate: targetExamDate.trim() || `${targetExamYear}-05-23`,
      optionalSubject: optionalSubject.trim() || 'Geography',
      medium,
      preparationStage: stage,
      dailyGoalMinutes: Math.round(hours * 60),
      mockAverageScore: score,
      mockTestsAttempted: count,
      syllabusCompletionPercent: syllabus,
    });

    setSavedNotice(true);
    onSaved?.();
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Save confirmation toast */}
      {savedNotice && (
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: isDark ? '#1C1C1C' : '#EFEFEF',
              borderColor: theme.cardBorder,
            },
          ]}>
          <CheckCircle size={16} color={theme.textPrimary} />
          <Text style={[styles.noticeText, { color: theme.textPrimary }]}>
            Profile preferences saved!
          </Text>
        </View>
      )}

      {/* 1. Basic Aspirant Details Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Personal Details
        </Text>

        {/* First & Last Name */}
        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              First Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Dipanker"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Last Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Biswas"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Email & Mobile */}
        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="dipanker.biswas@gmail.com"
              keyboardType="email-address"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Mobile
            </Text>
            <TextInput
              value={mobile}
              onChangeText={setMobile}
              placeholder="+91-9123456780"
              keyboardType="phone-pad"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Date of Birth & Gender */}
        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Date of Birth (YYYY-MM-DD)
            </Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="1990-01-01"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Gender
            </Text>
            <TextInput
              value={gender}
              onChangeText={setGender}
              placeholder="Male"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Father's Name & Residential Status */}
        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Father&apos;s Name
            </Text>
            <TextInput
              value={fatherName}
              onChangeText={setFatherName}
              placeholder="Dipanker"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Residential status
            </Text>
            <TextInput
              value={residentialStatus}
              onChangeText={setResidentialStatus}
              placeholder="Indian"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Profession & Organisation Name */}
        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Profession
            </Text>
            <TextInput
              value={profession}
              onChangeText={setProfession}
              placeholder="Self Employeed"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Organisation Name
            </Text>
            <TextInput
              value={organisationName}
              onChangeText={setOrganisationName}
              placeholder="Zendot"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Location
          </Text>
          <TextInput
            value={place}
            onChangeText={setPlace}
            placeholder="e.g. New Delhi, India"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#141416' : '#F7F7F7',
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
          />
        </View>

        {/* Date of Birth */}
        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Date of Birth (YYYY-MM-DD)
            </Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="2002-08-15"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 2. Target Year & Examination Stage Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Target & Strategy
        </Text>

        {/* Target Year Chips */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Target Examination Year
          </Text>
          <View style={styles.chipsRow}>
            {TARGET_YEARS.map((yr) => {
              const selected = targetExamYear === yr;
              return (
                <Fragment key={yr}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setTargetExamYear(yr);
                      setExamPhase(`UPSC CSE ${yr} • Prelims & Mains`);
                      setTargetExamDate(`${yr}-05-23`);
                    }}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: selected
                          ? theme.buttonPrimaryBg
                          : isDark
                          ? '#141416'
                          : '#F1F5F9',
                        borderColor: selected ? theme.buttonPrimaryBg : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipBtnText,
                        {
                          color: selected
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                        },
                      ]}>
                      CSE {yr}
                    </Text>
                  </TouchableOpacity>
                </Fragment>
              );
            })}
          </View>
        </View>

        {/* Medium of Examination */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Medium of Examination
          </Text>
          <View style={styles.chipsRow}>
            {MEDIUMS.map((med) => {
              const selected = medium === med;
              return (
                <Fragment key={med}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setMedium(med)}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: selected
                          ? theme.buttonPrimaryBg
                          : isDark
                          ? '#141416'
                          : '#F1F5F9',
                        borderColor: selected ? theme.buttonPrimaryBg : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipBtnText,
                        {
                          color: selected
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                        },
                      ]}>
                      {med} Medium
                    </Text>
                  </TouchableOpacity>
                </Fragment>
              );
            })}
          </View>
        </View>

        {/* Current Preparation Stage */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Current Preparation Stage
          </Text>
          <View style={styles.chipsWrap}>
            {STAGES.map((stg) => {
              const selected = stage === stg;
              return (
                <Fragment key={stg}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setStage(stg)}
                    style={[
                      styles.chipBtnLarge,
                      {
                        backgroundColor: selected
                          ? theme.buttonPrimaryBg
                          : isDark
                          ? '#141416'
                          : '#F1F5F9',
                        borderColor: selected ? theme.buttonPrimaryBg : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipBtnText,
                        {
                          color: selected
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                        },
                      ]}>
                      {stg}
                    </Text>
                  </TouchableOpacity>
                </Fragment>
              );
            })}
          </View>
        </View>

        {/* Optional Subject */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Optional Subject
          </Text>
          <TextInput
            value={optionalSubject}
            onChangeText={setOptionalSubject}
            placeholder="e.g. Geography, PSIR, Anthropology"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#141416' : '#F7F7F7',
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
          />

          <View style={styles.quickOptionalsRow}>
            {COMMON_OPTIONALS.map((opt) => (
              <Fragment key={opt}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setOptionalSubject(opt)}
                  style={[
                    styles.miniTag,
                    {
                      backgroundColor: isDark ? '#1E212A' : '#ECEFF4',
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Text style={[styles.miniTagText, { color: theme.textSecondary }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              </Fragment>
            ))}
          </View>
        </View>
      </View>

      {/* 3. Study Goals & Performance Metrics Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Study Targets & Mock Score Baseline
        </Text>

        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Daily Study Goal (Hours)
            </Text>
            <TextInput
              value={dailyGoalHours}
              onChangeText={setDailyGoalHours}
              keyboardType="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Syllabus Completed (%)
            </Text>
            <TextInput
              value={syllabusPercent}
              onChangeText={setSyllabusPercent}
              keyboardType="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>

        <View style={[styles.twoColRow, isNarrow && { flexDirection: 'column' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Prelims Mock Avg Score
            </Text>
            <TextInput
              value={mockScore}
              onChangeText={setMockScore}
              keyboardType="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Mocks Attempted Count
            </Text>
            <TextInput
              value={mockCount}
              onChangeText={setMockCount}
              keyboardType="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#141416' : '#F7F7F7',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        style={[
          styles.saveBtn,
          { backgroundColor: theme.buttonPrimaryBg },
        ]}>
        <Save size={16} color={theme.buttonPrimaryText} />
        <Text style={[styles.saveBtnText, { color: theme.buttonPrimaryText }]}>
          Save Profile & Target Settings
        </Text>
      </TouchableOpacity>

      {/* Reset Data Helper */}
      <View style={styles.resetRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={resetToDefaults}
          style={[styles.resetBtn, { borderColor: theme.cardBorder }]}>
          <RotateCcw size={14} color={theme.textMuted} />
          <Text style={[styles.resetBtnText, { color: theme.textMuted }]}>
            Reset to Sample Study Logs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipBtnLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quickOptionalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eligibilityPreviewBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    marginTop: 4,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewDetail: {
    fontSize: 11,
    lineHeight: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resetRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
