import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import {
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfileViewProps {
  isDark: boolean;
}

export function ProfileView({ isDark }: ProfileViewProps) {
  const { config, updateConfig, streak, resetToDefaults } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const [aspirantName, setAspirantName] = useState(config.aspirantName);
  const [examPhase, setExamPhase] = useState(config.examPhase);
  const [targetExamDate, setTargetExamDate] = useState(config.targetExamDate);
  const [dailyGoalHours, setDailyGoalHours] = useState(
    (config.dailyGoalMinutes / 60).toString()
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async () => {
    const hours = parseFloat(dailyGoalHours) || 6;
    await updateConfig({
      aspirantName: aspirantName.trim() || 'Aspirant',
      examPhase: examPhase.trim() || 'UPSC CSE 2027 • Prelims & Mains',
      targetExamDate: targetExamDate.trim() || '2027-05-23',
      dailyGoalMinutes: Math.round(hours * 60),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
          ASPIRANT PROFILE
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Preparation Settings
        </Text>
      </View>

      {/* User Info Card */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.avatarRow}>
          <View
            style={[
              styles.avatarBig,
              { backgroundColor: theme.buttonPrimaryBg },
            ]}>
            <Text
              style={[
                styles.avatarBigText,
                { color: theme.buttonPrimaryText },
              ]}>
              {config.aspirantName ? config.aspirantName.charAt(0) : 'A'}
            </Text>
          </View>

          <View style={styles.nameBlock}>
            <Text style={[styles.nameText, { color: theme.textPrimary }]}>
              {config.aspirantName}
            </Text>
            <Text style={[styles.phaseText, { color: theme.textSecondary }]}>
              {config.examPhase}
            </Text>
          </View>
        </View>

        {/* 3 Streak Stats */}
        <View
          style={[
            styles.statsRow,
            {
              backgroundColor: isDark ? '#080808' : '#FAFAFA',
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.textPrimary }]}>
              {streak.currentStreak}d
            </Text>
          </View>

          <View style={[styles.vDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.textPrimary }]}>
              {streak.longestStreak}d
            </Text>
            <Text style={[styles.statLbl, { color: theme.textMuted }]}>
              Longest Streak
            </Text>
          </View>

          <View style={[styles.vDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.textPrimary }]}>
              {streak.totalStudyDays}d
            </Text>
            <Text style={[styles.statLbl, { color: theme.textMuted }]}>
              Total Study Days
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Form Card */}
      <View
        style={[
          styles.formCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Goal & Target Configuration
        </Text>

        {savedNotice && (
          <View
            style={[
              styles.savedNoticeBox,
              { backgroundColor: isDark ? '#1C1C1C' : '#EFEFEF' },
            ]}>
            <ShieldCheck size={16} color={theme.textPrimary} />
            <Text style={[styles.savedNoticeText, { color: theme.textPrimary }]}>
              Preferences updated successfully.
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Aspirant Name
          </Text>
          <TextInput
            value={aspirantName}
            onChangeText={setAspirantName}
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#141414' : '#F7F7F7',
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Examination Phase / Cycle
          </Text>
          <TextInput
            value={examPhase}
            onChangeText={setExamPhase}
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#141414' : '#F7F7F7',
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Target Exam Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={targetExamDate}
            onChangeText={setTargetExamDate}
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#141414' : '#F7F7F7',
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
          />
        </View>

        <View style={styles.formGroup}>
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
                backgroundColor: isDark ? '#141414' : '#F7F7F7',
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          style={[
            styles.saveBtn,
            { backgroundColor: theme.buttonPrimaryBg },
          ]}>
          <Save size={16} color={theme.buttonPrimaryText} />
          <Text style={[styles.saveBtnText, { color: theme.buttonPrimaryText }]}>
            Save Target Settings
          </Text>
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  profileCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBig: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBigText: {
    fontSize: 20,
    fontWeight: '900',
  },
  nameBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
  },
  phaseText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  vDivider: {
    width: 1,
    height: 24,
  },
  formCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  savedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  savedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  resetRow: {
    alignItems: 'center',
    marginTop: 8,
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
    fontSize: 12,
    fontWeight: '600',
  },
});
