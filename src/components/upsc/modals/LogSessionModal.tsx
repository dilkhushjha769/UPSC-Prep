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
import { PlusCircle, X } from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';
import { UPSCSubject } from '@/types/study';
import { getLocalDateString } from '@/services/streakCalculator';

const SUBJECT_OPTIONS: UPSCSubject[] = [
  'Polity',
  'Modern History',
  'Ancient & Medieval',
  'Geography',
  'Economy',
  'Environment & Ecology',
  'Science & Technology',
  'Current Affairs',
  'CSAT',
  'Ethics (GS 4)',
  'Essay',
  'Optional Subject',
];

interface LogSessionModalProps {
  isDark: boolean;
}

export function LogSessionModal({ isDark }: LogSessionModalProps) {
  const { isLogModalOpen, setIsLogModalOpen, logManualSession } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const [selectedSubject, setSelectedSubject] = useState<UPSCSubject>('Polity');
  const [topic, setTopic] = useState('');
  const [durationMins, setDurationMins] = useState('60');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    const mins = parseInt(durationMins, 10);
    if (isNaN(mins) || mins <= 0) {
      setErrorMsg('Please enter a valid study duration in minutes (e.g., 60).');
      return;
    }
    if (!topic.trim()) {
      setErrorMsg('Please provide a brief topic or chapter name.');
      return;
    }

    try {
      await logManualSession(
        selectedSubject,
        topic.trim(),
        mins,
        getLocalDateString(),
        notes.trim()
      );
      setTopic('');
      setNotes('');
      setErrorMsg('');
      setIsLogModalOpen(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save session');
    }
  };

  return (
    <Modal
      visible={isLogModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsLogModalOpen(false)}>
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Log Offline Study Session
            </Text>
            <TouchableOpacity onPress={() => setIsLogModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Subject Selector */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              UPSC Subject
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {SUBJECT_OPTIONS.map((sub) => {
                const isSelected = sub === selectedSubject;
                return (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setSelectedSubject(sub)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? '#232036'
                          : '#F1F5F9',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Topic Input */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Topic / Chapter
            </Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Laxmikanth: Parliamentary Committees"
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

            {/* Duration Input */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Study Duration (Minutes)
            </Text>
            <View style={styles.durationRow}>
              {['30', '45', '60', '90', '120'].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  onPress={() => setDurationMins(mins)}
                  style={[
                    styles.durationPreset,
                    durationMins === mins && {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primary,
                    },
                    { borderColor: colors.cardBorderSubtle },
                  ]}>
                  <Text
                    style={[
                      styles.durationPresetText,
                      {
                        color:
                          durationMins === mins ? colors.primary : colors.textSecondary,
                      },
                    ]}>
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={durationMins}
              onChangeText={setDurationMins}
              keyboardType="numeric"
              placeholder="Custom minutes (e.g. 75)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  marginTop: 8,
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Notes */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Study Notes / Insights (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Key notes, references, or PYQ observations..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[
                styles.input,
                {
                  minHeight: 60,
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <PlusCircle size={17} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Log Study Session</Text>
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
    maxHeight: '90%',
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
  headerTitle: {
    fontSize: 17,
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
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  durationPreset: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPresetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
