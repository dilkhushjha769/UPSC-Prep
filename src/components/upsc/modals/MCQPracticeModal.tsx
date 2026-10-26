import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  FileQuestion,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';

interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const UPSC_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: 'Polity',
    question:
      'Which of the following constitutional amendments incorporated the Fundamental Duties in Part IV-A of the Indian Constitution?',
    options: [
      '42nd Constitutional Amendment Act, 1976',
      '44th Constitutional Amendment Act, 1978',
      '86th Constitutional Amendment Act, 2002',
      '91st Constitutional Amendment Act, 2003',
    ],
    correctIndex: 0,
    explanation:
      'The 42nd Amendment Act of 1976 added Part IV-A and Article 51A upon the recommendation of the Swaran Singh Committee. The 86th Amendment later added the 11th duty.',
  },
  {
    id: 2,
    subject: 'Modern History',
    question:
      'With reference to the Indian freedom struggle, who among the following was known as "Deshbandhu"?',
    options: [
      'Chittaranjan Das',
      'Surendranath Banerjee',
      'Gopal Krishna Gokhale',
      'Subhash Chandra Bose',
    ],
    correctIndex: 0,
    explanation:
      'Chittaranjan Das was affectionately titled "Deshbandhu" (Friend of the Nation). He was a key leader of the Swaraj Party alongside Motilal Nehru.',
  },
  {
    id: 3,
    subject: 'Geography',
    question:
      'Which one of the following river basins in India covers the second largest drainage area after the Ganges basin?',
    options: [
      'Godavari Basin',
      'Krishna Basin',
      'Mahanadi Basin',
      'Narmada Basin',
    ],
    correctIndex: 0,
    explanation:
      'The Godavari basin is the second largest river basin in India, covering about 9.5% of the total geographical area of the country.',
  },
  {
    id: 4,
    subject: 'Economy',
    question:
      'Which of the following bodies is responsible for fixing the benchmark policy interest rate (Repo Rate) in India?',
    options: [
      'Monetary Policy Committee (MPC)',
      'RBI Board of Directors alone',
      'Financial Stability and Development Council (FSDC)',
      'Cabinet Committee on Economic Affairs (CCEA)',
    ],
    correctIndex: 0,
    explanation:
      'The 6-member Monetary Policy Committee (MPC), established under the RBI Act, 1934, is statutory tasked with fixing the policy repo rate to target inflation.',
  },
  {
    id: 5,
    subject: 'Environment & Ecology',
    question:
      'Which of the following is an "ex-situ" method of biodiversity conservation?',
    options: [
      'Seed Banks & Botanical Gardens',
      'National Parks',
      'Wildlife Sanctuaries',
      'Biosphere Reserves',
    ],
    correctIndex: 0,
    explanation:
      'Seed banks, botanical gardens, and zoological parks are ex-situ (off-site) conservation methods, whereas national parks and sanctuaries are in-situ.',
  },
];

interface MCQPracticeModalProps {
  isDark: boolean;
}

export function MCQPracticeModal({ isDark }: MCQPracticeModalProps) {
  const { isMCQModalOpen, setIsMCQModalOpen, recordMCQSession } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  let correctCount = 0;
  UPSC_QUESTIONS.forEach((q) => {
    if (selectedAnswers[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  });

  const handleSubmit = async () => {
    setShowResults(true);
    await recordMCQSession(UPSC_QUESTIONS.length, correctCount);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <Modal
      visible={isMCQModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsMCQModalOpen(false)}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}>
          <BlueTextureBackground isDark={isDark} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <FileQuestion size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                UPSC Prelims Daily MCQ Drill
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsMCQModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Score Banner when completed */}
            {showResults && (
              <View
                style={[
                  styles.scoreBanner,
                  {
                    backgroundColor: isDark ? '#1F2A24' : '#ECFDF5',
                    borderColor: colors.accentEmerald,
                  },
                ]}>
                <Award size={24} color={colors.accentEmerald} />
                <View style={styles.scoreTextCol}>
                  <Text style={[styles.scoreTitle, { color: colors.textPrimary }]}>
                    Drill Completed: {correctCount} / {UPSC_QUESTIONS.length} Correct
                  </Text>
                  <Text style={[styles.scoreSubtitle, { color: colors.textSecondary }]}>
                    {Math.round((correctCount / UPSC_QUESTIONS.length) * 100)}% Accuracy • Recorded to your daily preparation statistics.
                  </Text>
                </View>
              </View>
            )}

            {/* Questions List */}
            <View style={styles.questionsList}>
              {UPSC_QUESTIONS.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];

                return (
                  <View
                    key={q.id}
                    style={[
                      styles.questionCard,
                      {
                        backgroundColor: isDark ? '#1B1A28' : '#FBFBFE',
                        borderColor: colors.cardBorderSubtle,
                      },
                    ]}>
                    <View style={styles.qTopRow}>
                      <View
                        style={[
                          styles.subjectChip,
                          { backgroundColor: colors.primarySoft },
                        ]}>
                        <Text
                          style={[styles.subjectChipText, { color: colors.primary }]}>
                          Q{idx + 1} • {q.subject}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                      {q.question}
                    </Text>

                    {/* Options */}
                    <View style={styles.optionsList}>
                      {q.options.map((opt, oIdx) => {
                        const isChosen = userChoice === oIdx;
                        const isCorrect = q.correctIndex === oIdx;

                        let optBg = isDark ? '#232136' : '#FFFFFF';
                        let optBorder = colors.cardBorderSubtle;
                        let optTextColor = colors.textPrimary;

                        if (showResults) {
                          if (isCorrect) {
                            optBg = isDark ? '#1C3328' : '#DCFCE7';
                            optBorder = colors.accentEmerald;
                            optTextColor = isDark ? '#6EE7B7' : '#15803D';
                          } else if (isChosen && !isCorrect) {
                            optBg = isDark ? '#3D1D22' : '#FEE2E2';
                            optBorder = '#EF4444';
                            optTextColor = '#DC2626';
                          }
                        } else if (isChosen) {
                          optBg = colors.primarySoft;
                          optBorder = colors.primary;
                          optTextColor = colors.primary;
                        }

                        return (
                          <TouchableOpacity
                            key={oIdx}
                            activeOpacity={0.8}
                            onPress={() => handleSelectOption(q.id, oIdx)}
                            style={[
                              styles.optionBtn,
                              {
                                backgroundColor: optBg,
                                borderColor: optBorder,
                              },
                            ]}>
                            <View
                              style={[
                                styles.optionLetterCircle,
                                isChosen && { backgroundColor: colors.primary },
                              ]}>
                              <Text
                                style={[
                                  styles.optionLetterText,
                                  {
                                    color: isChosen
                                      ? '#FFFFFF'
                                      : colors.textSecondary,
                                  },
                                ]}>
                                {String.fromCharCode(65 + oIdx)}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                { color: optTextColor },
                              ]}>
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Explanation after submission */}
                    {showResults && (
                      <View
                        style={[
                          styles.explanationBox,
                          {
                            backgroundColor: isDark ? '#242038' : '#F4F0FD',
                            borderColor: colors.cardBorder,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.explanationTitle,
                            { color: colors.primary },
                          ]}>
                          UPSC Key & Explanation:
                        </Text>
                        <Text
                          style={[
                            styles.explanationText,
                            { color: colors.textSecondary },
                          ]}>
                          {q.explanation}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            {!showResults ? (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={answeredCount === 0}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor:
                      answeredCount > 0 ? colors.primary : colors.textMuted,
                  },
                ]}>
                <Text style={styles.submitBtnText}>
                  Submit Answers ({answeredCount}/{UPSC_QUESTIONS.length})
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.afterButtonsRow}>
                <TouchableOpacity
                  onPress={handleReset}
                  style={[styles.retryBtn, { borderColor: colors.cardBorder }]}>
                  <Text style={[styles.retryBtnText, { color: colors.textPrimary }]}>
                    Practice Again
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsMCQModalOpen(false)}
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
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
    padding: 18,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  scoreTextCol: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  scoreSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  questionsList: {
    gap: 16,
  },
  questionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  qTopRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  subjectChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLetterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  explanationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 17,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  afterButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  retryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
