import { Button } from '@/components/ui/Button';
import { PALETTE, SemanticColors, Typography } from '@/constants/colors';
import { primaryButtonStyle } from '@/constants/designTokens';
import { TASK_COLOR_PALETTES, TaskColorScheme } from '@/constants/taskColors';
import { useAppTheme } from '@/context/ThemeContext';
import { StudyTask, TaskColorTag } from '@/types/study';
import { Check, Clock, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<StudyTask, 'id' | 'completed'>) => Promise<void>;
  initialDate?: string;
  isDark?: boolean;
}

const TIME_PRESETS = [
  '08:00 AM',
  '10:00 AM',
  '02:00 PM',
  '05:00 PM',
  '08:00 PM',
];

export function TaskFormModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  isDark: propIsDark,
}: TaskFormModalProps) {
  const { isDark: appIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : appIsDark;
  const theme = isDark ? SemanticColors.dark : SemanticColors.light;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [colorTag, setColorTag] = useState<TaskColorTag>('green');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const taskDate = initialDate || new Date().toISOString().split('T')[0];

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setTitle('');
    setDescription('');
    setTime('');
    setErrorMsg('');
    setColorTag('green');
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a task title.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        topic: title.trim(),
        date: taskDate,
        colorTag,
        startTime: time.trim() || undefined,
        status: 'todo',
        priority: 'Normal',
        estimatedMinutes: 60,
      });
      onClose();
    } catch (e) {
      setErrorMsg('Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const paletteList: TaskColorScheme[] = Object.values(TASK_COLOR_PALETTES);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
              borderColor: isDark ? '#253244' : '#EAE5DC',
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                New Task
              </Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                For {taskDate}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1B2534' : '#F0EDE6',
                  borderColor: isDark ? '#253244' : '#EAE5DC',
                },
              ]}>
              <X size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formBody}>
            {Boolean(errorMsg) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Task Title */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Task Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. English Literature Revision"
                placeholderTextColor={theme.textMuted}
                autoFocus
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#FAF9F6',
                    borderColor: isDark ? '#253244' : '#EAE5DC',
                    color: theme.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Read chapters 3 and 4, make notes"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={2}
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#FAF9F6',
                    borderColor: isDark ? '#253244' : '#EAE5DC',
                    color: theme.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Time (Clean & Solid) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Time (Optional)
                </Text>
                {Boolean(time) && (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setTime('')} hitSlop={6}>
                    <Text style={[styles.clearTimeText, { color: PALETTE.highlight.primary }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={[
                  styles.timeInputContainer,
                  {
                    backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#FAF9F6',
                    borderColor: isDark ? '#253244' : '#EAE5DC',
                  },
                ]}>
                <Clock size={15} color={theme.textMuted} strokeWidth={2} />
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="e.g. 10:30 AM or 10:30 AM - 12:00 PM"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.timeTextInput,
                    { color: theme.textPrimary },
                  ]}
                />
              </View>

              {/* Quick Solid Preset Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeChipsScroll}>
                {TIME_PRESETS.map((preset) => {
                  const isSelected = time === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      activeOpacity={0.8}
                      onPress={() => setTime(preset)}
                      style={[
                        styles.timePresetChip,
                        {
                          backgroundColor: isSelected
                            ? PALETTE.highlight.primary
                            : (isDark ? PALETTE.neutral.dark.darkest : '#F0EDE6'),
                          borderColor: isSelected
                            ? PALETTE.highlight.primary
                            : (isDark ? '#253244' : '#EAE5DC'),
                        },
                      ]}>
                      <Text
                        style={[
                          styles.timePresetText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}>
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Color Picker */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Color: {TASK_COLOR_PALETTES[colorTag].label}
              </Text>

              <View style={styles.colorSwatchesRow}>
                {paletteList.map((palette) => {
                  const isSelected = colorTag === palette.id;
                  return (
                    <TouchableOpacity
                      key={palette.id}
                      activeOpacity={0.8}
                      onPress={() => setColorTag(palette.id)}
                      style={[
                        styles.colorSwatchBtn,
                        {
                          backgroundColor: palette.lightBg,
                          borderColor: isSelected ? PALETTE.highlight.primary : palette.lightBorder,
                          borderWidth: isSelected ? 2.5 : 1,
                        },
                      ]}>
                      {isSelected && (
                        <Check size={14} color={palette.lightText} strokeWidth={3} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button (Solid Primary Blue #B9570A) */}
            <Button
              variant="primary"
              title={isSaving ? 'Adding...' : 'Add Task'}
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.saveSubmitBtn, primaryButtonStyle(isDark)]}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBody: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  errorBox: {
    backgroundColor: 'rgba(180, 35, 24, 0.12)',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.2,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: Typography.fontFamily,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    paddingVertical: 2,
  },
  colorSwatchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearTimeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  timeTextInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  timeChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  timePresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePresetText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  saveSubmitBtn: {
    marginTop: 6,
    backgroundColor: '#F58235',
  },
});
