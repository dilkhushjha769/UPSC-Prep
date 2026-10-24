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
import { Plus, X } from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';
import { UPSCSubject } from '@/types/study';

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

interface AddTaskModalProps {
  isDark: boolean;
}

export function AddTaskModal({ isDark }: AddTaskModalProps) {
  const { isAddTaskModalOpen, setIsAddTaskModalOpen, addTask } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const [subject, setSubject] = useState<UPSCSubject>('Polity');
  const [topic, setTopic] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Normal'>('Medium');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddTask = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please specify a topic or syllabus module.');
      return;
    }
    const mins = parseInt(estimatedMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      setErrorMsg('Please enter a valid estimated duration.');
      return;
    }

    await addTask(subject, topic.trim(), mins, priority, notes.trim());
    setTopic('');
    setNotes('');
    setErrorMsg('');
    setIsAddTaskModalOpen(false);
  };

  return (
    <Modal
      visible={isAddTaskModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsAddTaskModalOpen(false)}>
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
              Schedule Study Task
            </Text>
            <TouchableOpacity onPress={() => setIsAddTaskModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Subject */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Subject
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {SUBJECT_OPTIONS.map((sub) => {
                const isSelected = sub === subject;
                return (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setSubject(sub)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? '#232036'
                          : '#F1F3F9',
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

            {/* Topic */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Topic / Target Chapter
            </Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Modern History: Indian National Congress Sessions"
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

            {/* Priority */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Priority
            </Text>
            <View style={styles.priorityRow}>
              {(['High', 'Medium', 'Normal'] as const).map((p) => {
                const isSelected = p === priority;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityBtn,
                      isSelected && {
                        backgroundColor:
                          p === 'High'
                            ? '#DC2626'
                            : p === 'Medium'
                            ? '#D97706'
                            : colors.primary,
                      },
                      !isSelected && {
                        backgroundColor: isDark ? '#232036' : '#F1F5F9',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.priorityBtnText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Duration */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Estimated Duration (Minutes)
            </Text>
            <TextInput
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
              keyboardType="numeric"
              placeholder="e.g. 60"
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

            {/* Notes */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Notes / Key Pointers (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Chapters to read, questions to attempt..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[
                styles.input,
                {
                  minHeight: 50,
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Add Button */}
            <TouchableOpacity
              onPress={handleAddTask}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Plus size={17} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{"Add to Today's Plan"}</Text>
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
    borderBottomColor: 'rgba(124, 58, 237, 0.08)',
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
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtnText: {
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
