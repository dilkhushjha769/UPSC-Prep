import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Save, Settings, X } from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface ConfigModalProps {
  isDark: boolean;
}

export function ConfigModal({ isDark }: ConfigModalProps) {
  const { isConfigModalOpen, setIsConfigModalOpen, config, updateConfig } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const [aspirantName, setAspirantName] = useState(config.aspirantName);
  const [examPhase, setExamPhase] = useState(config.examPhase);
  const [targetExamDate, setTargetExamDate] = useState(config.targetExamDate);
  const [dailyGoalHours, setDailyGoalHours] = useState(
    (config.dailyGoalMinutes / 60).toString()
  );
  const [qualifyingMins, setQualifyingMins] = useState(
    config.qualifyingStreakMinutes.toString()
  );

  const handleSave = async () => {
    const hours = parseFloat(dailyGoalHours) || 6;
    const qMins = parseInt(qualifyingMins, 10) || 60;

    await updateConfig({
      aspirantName: aspirantName.trim() || 'Aspirant',
      examPhase: examPhase.trim() || 'UPSC CSE 2027 • Prelims & Mains',
      targetExamDate: targetExamDate.trim() || '2027-05-23',
      dailyGoalMinutes: Math.round(hours * 60),
      qualifyingStreakMinutes: qMins,
    });
    setIsConfigModalOpen(false);
  };

  return (
    <Modal
      visible={isConfigModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsConfigModalOpen(false)}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Settings size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                UPSC Preparation Settings
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsConfigModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Aspirant Name */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Aspirant Name
            </Text>
            <TextInput
              value={aspirantName}
              onChangeText={setAspirantName}
              placeholder="e.g. Dilkhush Jha"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Target Exam Phase */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Target Exam Phase
            </Text>
            <TextInput
              value={examPhase}
              onChangeText={setExamPhase}
              placeholder="e.g. UPSC CSE 2027 • Prelims & Mains"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Target Exam Date */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Target Exam Date (YYYY-MM-DD)
            </Text>
            <TextInput
              value={targetExamDate}
              onChangeText={setTargetExamDate}
              placeholder="2027-05-23"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Daily Study Goal */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Daily Study Target (Hours)
            </Text>
            <TextInput
              value={dailyGoalHours}
              onChangeText={setDailyGoalHours}
              keyboardType="numeric"
              placeholder="6"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Qualifying Streak Minutes */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Streak Qualification Threshold (Minutes per day)
            </Text>
            <TextInput
              value={qualifyingMins}
              onChangeText={setQualifyingMins}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 106, 19, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
