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
import {
  CheckSquare,
  PenLine,
  Send,
  Square,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface MainsAnswerModalProps {
  isDark: boolean;
}

export function MainsAnswerModal({ isDark }: MainsAnswerModalProps) {
  const { isMainsModalOpen, setIsMainsModalOpen, recordMainsAnswer } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const questionPrompt =
    '“The institution of the Governor in India has often been described as an agent of the Centre rather than a constitutional head of the State.” In light of constitutional provisions and Supreme Court judgements (S.R. Bommai & Nabam Rebia), critically examine the discretionary powers of the Governor. (150 Words, 10 Marks)';

  const [answerText, setAnswerText] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    intro: false,
    bommai: false,
    discretion: false,
    sarkaria: false,
    conclusion: false,
  });
  const [isSaved, setIsSaved] = useState(false);

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAnswer = async () => {
    await recordMainsAnswer('Polity', 'Discretionary Powers of Governor (GS-2)', 20);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsMainsModalOpen(false);
      setAnswerText('');
    }, 1200);
  };

  // Word count helper
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  return (
    <Modal
      visible={isMainsModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsMainsModalOpen(false)}>
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
              <PenLine size={18} color={colors.accentPink} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                UPSC Mains Daily Answer Writing
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsMainsModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Prompt Box */}
            <View
              style={[
                styles.promptBox,
                {
                  backgroundColor: isDark ? '#231B2B' : '#FDF2F8',
                  borderColor: isDark ? '#3D2448' : '#FCE7F3',
                },
              ]}>
              <View style={styles.promptMeta}>
                <Text style={[styles.promptPaper, { color: colors.accentPink }]}>
                  GS PAPER 2 • CONSTITUTION & POLITY
                </Text>
                <Text style={[styles.promptTimer, { color: colors.textSecondary }]}>
                  Suggested Time: 7–8 mins
                </Text>
              </View>
              <Text style={[styles.promptQuestion, { color: colors.textPrimary }]}>
                {questionPrompt}
              </Text>
            </View>

            {/* Answer Blueprint Checklist */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              Mains Structural Checklist (Self-Evaluation):
            </Text>
            <View style={styles.checklistGrid}>
              {[
                { id: 'intro', label: 'Constitutional basis: Articles 153-163' },
                { id: 'bommai', label: 'Landmark rulings: S.R. Bommai / Nabam Rebia' },
                { id: 'discretion', label: 'Discretionary vs Aided powers (Art. 163)' },
                { id: 'sarkaria', label: 'Commissions: Sarkaria & Punchhi guidelines' },
                { id: 'conclusion', label: 'Way forward: Neutrality & constitutionalism' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => toggleCheck(item.id)}
                  style={[
                    styles.checkRow,
                    {
                      backgroundColor: checklist[item.id]
                        ? isDark
                          ? '#1A2E26'
                          : '#ECFDF5'
                        : isDark
                        ? '#1C1B2A'
                        : '#FBFBFE',
                      borderColor: checklist[item.id]
                        ? colors.accentEmerald
                        : colors.cardBorderSubtle,
                    },
                  ]}>
                  {checklist[item.id] ? (
                    <CheckSquare size={16} color={colors.accentEmerald} />
                  ) : (
                    <Square size={16} color={colors.textMuted} />
                  )}
                  <Text
                    style={[
                      styles.checkLabel,
                      {
                        color: checklist[item.id]
                          ? colors.accentEmerald
                          : colors.textPrimary,
                      },
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Answer Drafting Field */}
            <View style={styles.textInputSection}>
              <View style={styles.textInputMeta}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 0 }]}>
                  Draft Your Answer:
                </Text>
                <Text
                  style={[
                    styles.wordCount,
                    {
                      color:
                        wordCount >= 140 && wordCount <= 165
                          ? colors.accentEmerald
                          : colors.textMuted,
                    },
                  ]}>
                  {wordCount} / 150 words
                </Text>
              </View>

              <TextInput
                value={answerText}
                onChangeText={setAnswerText}
                placeholder="Type your structured introduction, arguments, case laws, and conclusion..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                    borderColor: colors.cardBorderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Submit / Save Button */}
            <TouchableOpacity
              onPress={handleSaveAnswer}
              style={[
                styles.saveAnswerBtn,
                { backgroundColor: colors.accentPink },
              ]}>
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.saveAnswerBtnText}>
                {isSaved ? 'Answer Saved & Logged! 🎉' : 'Record Mains Answer (20m Study Log)'}
              </Text>
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
    maxWidth: 540,
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
    padding: 18,
  },
  promptBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  promptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  promptPaper: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promptTimer: {
    fontSize: 11,
    fontWeight: '600',
  },
  promptQuestion: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  checklistGrid: {
    gap: 6,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInputSection: {
    marginBottom: 16,
  },
  textInputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    minHeight: 120,
    lineHeight: 18,
  },
  saveAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveAnswerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
