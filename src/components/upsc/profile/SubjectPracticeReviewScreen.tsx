import React, { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  Moon,
  Sun,
  XCircle,
} from 'lucide-react-native';
import { GLOBAL_PRIMARY_BLUE } from '@/constants/colors';
import {
  QuestionAttemptItem,
  QuestionOptionItem,
} from '@/services/questionHistoryService';

export interface SubjectPracticeGroup {
  subject: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  questions: QuestionAttemptItem[];
}

interface SubjectPracticeReviewScreenProps {
  isDark: boolean;
  subjectGroup: SubjectPracticeGroup;
  onBack: () => void;
  onToggleTheme?: () => void;
}

type FilterTab = 'all' | 'correct' | 'incorrect' | 'unanswered';

interface ParsedStep {
  number: number;
  title: string;
  content: string[];
}

interface ParsedExplanation {
  steps: ParsedStep[];
  conclusionTitle?: string;
  conclusionLines: string[];
  finalHighlight?: string;
}

/**
 * Parses raw explanation text into structured steps and a highlighted conclusion,
 * matching the editorial UPSC examination layout in the reference design.
 */
function parseExplanationText(raw: string, correctAnswerId?: string): ParsedExplanation {
  if (!raw || !raw.trim()) {
    return {
      steps: [],
      conclusionLines: ['No detailed explanation available for this question.'],
    };
  }

  const cleanRaw = raw.trim();

  // Check if text has "Conclusion:" or similar separator
  const conclusionSplit = cleanRaw.split(/\n\s*(?:Conclusion|Key Takeaway|Summary):\s*\n?/i);
  let mainBody = cleanRaw;
  let conclusionText = '';

  if (conclusionSplit.length > 1) {
    mainBody = conclusionSplit[0].trim();
    conclusionText = conclusionSplit.slice(1).join('\n').trim();
  }

  // Parse mainBody into steps if it has "1.", "Step 1", etc.
  const stepBlocks = mainBody.split(/\n\s*(?:Step\s*\d+|^\d+[\.\)])\s*:?\s*/im);

  const steps: ParsedStep[] = [];

  if (stepBlocks.length > 1) {
    stepBlocks.forEach((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      const title = lines[0] || `Step ${idx}`;
      const content = lines.slice(1);

      steps.push({
        number: steps.length + 1,
        title,
        content: content.length > 0 ? content : [title],
      });
    });
  } else {
    // Single block or paragraphs
    const paragraphs = mainBody.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length > 1 && !conclusionText) {
      // Use the last paragraph as conclusion if it mentions conclusion/therefore
      const lastP = paragraphs[paragraphs.length - 1];
      if (/therefore|hence|thus|in summary|correct answer/i.test(lastP)) {
        conclusionText = lastP;
        paragraphs.pop();
      }
    }

    paragraphs.forEach((p, idx) => {
      const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
      steps.push({
        number: idx + 1,
        title: lines[0] || `Point ${idx + 1}`,
        content: lines.length > 1 ? lines.slice(1) : lines,
      });
    });
  }

  // Parse conclusion text and highlight statement
  let finalHighlight = correctAnswerId ? `Therefore, option ${correctAnswerId} is correct.` : '';
  const conclusionLines: string[] = [];

  if (conclusionText) {
    const rawLines = conclusionText.split('\n').map((l) => l.trim()).filter(Boolean);
    rawLines.forEach((line) => {
      if (/therefore.*option.*is correct/i.test(line)) {
        finalHighlight = line;
      } else {
        conclusionLines.push(line);
      }
    });
  } else if (correctAnswerId) {
    finalHighlight = `Therefore, option ${correctAnswerId} is correct.`;
  }

  return {
    steps,
    conclusionTitle: 'Conclusion',
    conclusionLines,
    finalHighlight,
  };
}

export function SubjectPracticeReviewScreen({
  isDark,
  subjectGroup,
  onBack,
  onToggleTheme,
}: SubjectPracticeReviewScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  const toggleBookmark = (qId: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Color tokens matching the reference design:
  // Light: Pure white surface (#FFFFFF), crisp border (#EAEDF2), high contrast text (#111827).
  // Dark: Deep charcoal surface (#12151D), subtle border (rgba(255,255,255,0.08)), crisp text (#FFFFFF).
  const pageBg = isDark ? '#0A0D14' : '#F8FAFC';
  const cardBg = isDark ? '#12151D' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAEDF2';
  const optionNeutralBg = isDark ? '#181C26' : '#FFFFFF';
  const optionNeutralBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAEDF2';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const textMuted = isDark ? '#6B7280' : '#6B7280';
  const primaryBlue = GLOBAL_PRIMARY_BLUE;

  // Aggregate metrics
  const totalQuestions = subjectGroup.questions.length;
  const correctCount = subjectGroup.questions.filter((q) => q.status === 'correct').length;
  const incorrectCount = subjectGroup.questions.filter((q) => q.status === 'incorrect').length;
  const unansweredCount = subjectGroup.questions.filter((q) => q.status === 'unanswered').length;
  const calculatedAccuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const totalTimeSeconds = subjectGroup.questions.reduce(
    (sum, q) => sum + (q.timeSpentSeconds || 0),
    0
  );
  const avgTimeSeconds =
    totalQuestions > 0 ? Math.round(totalTimeSeconds / totalQuestions) : 0;

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    switch (activeFilter) {
      case 'correct':
        return subjectGroup.questions.filter((q) => q.status === 'correct');
      case 'incorrect':
        return subjectGroup.questions.filter((q) => q.status === 'incorrect');
      case 'unanswered':
        return subjectGroup.questions.filter((q) => q.status === 'unanswered');
      case 'all':
      default:
        return subjectGroup.questions;
    }
  }, [subjectGroup.questions, activeFilter]);

  const formatDurationText = (secs: number) => {
    if (secs === 0) return '0 seconds';
    if (secs === 1) return '1 second';
    if (secs < 60) return `${secs} seconds`;
    const m = Math.floor(secs / 60);
    const rem = secs % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  };

  return (
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. TOP NAVIGATION HEADER */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: cardBg,
            borderBottomColor: dividerColor,
          },
        ]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            accessibilityLabel="Back to Activity"
            style={[
              styles.backButton,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                borderColor: cardBorder,
              },
            ]}>
            <ArrowLeft size={16} color={textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: textPrimary }]}>
              {subjectGroup.subject}
            </Text>
            <Text style={[styles.headerSubtitle, { color: textMuted }]}>
              Practice Question Review · {totalQuestions} Questions
            </Text>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.iconActionBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                  borderColor: cardBorder,
                },
              ]}>
              {isDark ? (
                <Sun size={15} color="#F59E0B" strokeWidth={2.4} />
              ) : (
                <Moon size={15} color="#6366F1" strokeWidth={2.4} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          isDesktop && styles.desktopScrollBody,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* SUMMARY STATS & FILTER BAR */}
        <View
          style={[
            styles.topMetaCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}>
          <View style={styles.topMetaRow}>
            <View>
              <Text style={[styles.subjectHeadline, { color: textPrimary }]}>
                {subjectGroup.subject}
              </Text>
              <Text style={[styles.summaryMetaText, { color: textMuted }]}>
                {totalQuestions} questions attempted • {calculatedAccuracy}% accuracy • Avg time: {formatDurationText(avgTimeSeconds)}
              </Text>
            </View>

            {/* Segmented Filter Chips */}
            <View style={styles.filterChipRow}>
              {[
                { key: 'all' as const, label: `All (${totalQuestions})` },
                { key: 'correct' as const, label: `Correct (${correctCount})` },
                { key: 'incorrect' as const, label: `Incorrect (${incorrectCount})` },
                ...(unansweredCount > 0
                  ? [{ key: 'unanswered' as const, label: `Unanswered (${unansweredCount})` }]
                  : []),
              ].map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.7}
                    onPress={() => setActiveFilter(tab.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? primaryBlue
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#F3F4F6',
                        borderColor: isActive ? primaryBlue : cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isActive ? '#FFFFFF' : textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 3. QUESTIONS LIST (EXACT EDITORIAL REDESIGN FROM REFERENCE IMAGE) */}
        {filteredQuestions.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}>
            <HelpCircle size={28} color={textMuted} />
            <Text style={[styles.emptyStateTitle, { color: textPrimary }]}>
              No questions found
            </Text>
            <Text style={[styles.emptyStateSub, { color: textMuted }]}>
              There are no {activeFilter} questions in this subject.
            </Text>
          </View>
        ) : (
          <View style={styles.questionsContainer}>
            {filteredQuestions.map((q, idx) => {
              const isCorrect = q.status === 'correct';
              const isIncorrect = q.status === 'incorrect';
              const parsed = parseExplanationText(q.explanation || '', q.correctAnswer);
              const formattedDate = new Date(q.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <View
                  key={q.id || `q-${idx}`}
                  style={[
                    styles.editorialCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                    },
                  ]}>
                  {/* QUESTION HEADER: Question 01 | Topic · Right Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.headerLeftGroup}>
                      <Text style={[styles.qNumberLabel, { color: textPrimary }]}>
                        Question {q.questionNumber || idx + 1}
                      </Text>
                      <Text style={[styles.headerPipe, { color: dividerColor }]}>|</Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.qTopicLabel, { color: textMuted }]}>
                        {q.topic || q.subject || 'General Studies'}
                      </Text>
                    </View>

                    {/* Subtle, Understated Status Badge */}
                    <View
                      style={[
                        styles.answerStatusBadge,
                        isCorrect
                          ? {
                              backgroundColor: isDark
                                ? 'rgba(16, 185, 129, 0.12)'
                                : '#F0FDF4',
                              borderColor: isDark
                                ? 'rgba(16, 185, 129, 0.3)'
                                : '#BBF7D0',
                            }
                          : isIncorrect
                          ? {
                              backgroundColor: isDark
                                ? 'rgba(239, 68, 68, 0.12)'
                                : '#FEF2F2',
                              borderColor: isDark
                                ? 'rgba(239, 68, 68, 0.3)'
                                : '#FECACA',
                            }
                          : {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : '#F3F4F6',
                              borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.1)'
                                : '#E5E7EB',
                            },
                      ]}>
                      {isCorrect ? (
                        <CheckCircle2 size={12} color="#10B981" strokeWidth={2.4} />
                      ) : isIncorrect ? (
                        <XCircle size={12} color="#EF4444" strokeWidth={2.4} />
                      ) : null}
                      <Text
                        style={[
                          styles.answerStatusBadgeText,
                          {
                            color: isCorrect
                              ? '#10B981'
                              : isIncorrect
                              ? '#EF4444'
                              : textMuted,
                          },
                        ]}>
                        {isCorrect ? 'Answered' : isIncorrect ? 'Incorrect' : 'Unanswered'}
                      </Text>
                    </View>
                  </View>

                  {/* QUESTION TEXT: Main Visual Focus, Generous Whitespace */}
                  <View style={styles.questionTextArea}>
                    <Text
                      style={[
                        styles.questionBodyText,
                        { color: textPrimary },
                        isDesktop && styles.desktopQuestionBodyText,
                      ]}>
                      {q.questionText}
                    </Text>

                    {/* Question Statements (if multi-statement format) */}
                    {Boolean(q.statements && q.statements.length > 0) && (
                      <View style={styles.statementsBlock}>
                        {q.statements?.map((statement, sIdx) => (
                          <View key={`st-${sIdx}`} style={styles.statementLine}>
                            <Text style={[styles.statementIndex, { color: textSecondary }]}>
                              {sIdx + 1}.
                            </Text>
                            <Text style={[styles.statementContent, { color: textPrimary }]}>
                              {statement}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* ANSWER OPTIONS: Full-width Clean Rows with Circular Letter Marker */}
                  <View style={styles.optionsList}>
                    {q.options.map((opt: QuestionOptionItem) => {
                      const isUserSelected = q.selectedAnswer === opt.id;
                      const isOptionCorrect = q.correctAnswer === opt.id;

                      let rowBg = optionNeutralBg;
                      let rowBorder = optionNeutralBorder;
                      let markerBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6';
                      let markerText = isDark ? '#9CA3AF' : '#4B5563';
                      let showCorrectLabel = false;
                      let showIncorrectLabel = false;

                      if (isOptionCorrect) {
                        // Correct Answer Style (matches reference image Option B)
                        rowBg = isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4';
                        rowBorder = isDark ? 'rgba(16, 185, 129, 0.45)' : '#86EFAC';
                        markerBg = '#10B981';
                        markerText = '#FFFFFF';
                        showCorrectLabel = true;
                      } else if (isUserSelected && !isOptionCorrect) {
                        // User's Incorrect Choice
                        rowBg = isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2';
                        rowBorder = isDark ? 'rgba(239, 68, 68, 0.45)' : '#FECACA';
                        markerBg = '#EF4444';
                        markerText = '#FFFFFF';
                        showIncorrectLabel = true;
                      }

                      return (
                        <View
                          key={opt.id}
                          style={[
                            styles.optionRow,
                            {
                              backgroundColor: rowBg,
                              borderColor: rowBorder,
                            },
                          ]}>
                          {/* Circular Letter Marker (A, B, C, D) */}
                          <View
                            style={[
                              styles.letterCircle,
                              {
                                backgroundColor: markerBg,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.letterText,
                                { color: markerText },
                              ]}>
                              {opt.id}
                            </Text>
                          </View>

                          {/* Option Body & Sub-Label */}
                          <View style={styles.optionContentCol}>
                            <Text style={[styles.optionBodyText, { color: textPrimary }]}>
                              {opt.text}
                            </Text>

                            {/* Correct Answer Label */}
                            {showCorrectLabel && (
                              <View style={styles.optionSubStatusRow}>
                                <CheckCircle2 size={13} color="#10B981" strokeWidth={2.4} />
                                <Text style={styles.correctAnswerLabelText}>
                                  Correct answer
                                </Text>
                              </View>
                            )}

                            {/* User's Incorrect Selection Label */}
                            {showIncorrectLabel && (
                              <View style={styles.optionSubStatusRow}>
                                <XCircle size={13} color="#EF4444" strokeWidth={2.4} />
                                <Text style={styles.incorrectAnswerLabelText}>
                                  Your answer
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* EXPLANATION SECTION: Calm, Editorial, No Blue Box */}
                  <View style={[styles.explanationSection, { borderTopColor: dividerColor }]}>
                    <View style={styles.explanationHeaderRow}>
                      <Text style={[styles.explanationHeading, { color: textPrimary }]}>
                        Explanation
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleBookmark(q.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Bookmark Question">
                        <Bookmark
                          size={16}
                          color={bookmarkedIds[q.id] ? '#10B981' : textMuted}
                          fill={bookmarkedIds[q.id] ? '#10B981' : 'transparent'}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Step-by-Step Solution Breakdown */}
                    {parsed.steps.length > 0 && (
                      <View style={styles.stepsContainer}>
                        {parsed.steps.map((step) => (
                          <View key={`step-${step.number}`} style={styles.stepItemRow}>
                            {/* Step Number Circle (1, 2) */}
                            <View
                              style={[
                                styles.stepBadgeCircle,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : '#F3F4F6',
                                },
                              ]}>
                              <Text style={[styles.stepBadgeText, { color: textPrimary }]}>
                                {step.number}
                              </Text>
                            </View>

                            {/* Step Title & Equation Lines */}
                            <View style={styles.stepContentCol}>
                              <Text style={[styles.stepTitleText, { color: textPrimary }]}>
                                {step.title}
                              </Text>
                              {step.content.map((line, lIdx) => (
                                <Text
                                  key={`line-${lIdx}`}
                                  style={[styles.stepBodyLine, { color: textSecondary }]}>
                                  {line}
                                </Text>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Conclusion Box (Subtle Green-Tinted Card with Lightbulb Icon) */}
                    <View
                      style={[
                        styles.conclusionBox,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.1)'
                            : '#F0FDF4',
                          borderColor: isDark
                            ? 'rgba(16, 185, 129, 0.25)'
                            : '#BBF7D0',
                        },
                      ]}>
                      <View style={styles.conclusionTopRow}>
                        <Lightbulb size={18} color="#10B981" strokeWidth={2.4} />
                        <Text
                          style={[
                            styles.conclusionTitleText,
                            { color: isDark ? '#34D399' : '#059669' },
                          ]}>
                          Conclusion
                        </Text>
                      </View>

                      {parsed.conclusionLines.map((cLine, cIdx) => (
                        <Text
                          key={`c-${cIdx}`}
                          style={[
                            styles.conclusionBodyText,
                            { color: textPrimary },
                          ]}>
                          {cLine}
                        </Text>
                      ))}

                      {Boolean(parsed.finalHighlight) && (
                        <Text style={styles.finalHighlightText}>
                          {parsed.finalHighlight}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* QUESTION FOOTER: Quiet Metadata (Time taken | Attempted on) */}
                  <View
                    style={[
                      styles.quietFooterRow,
                      { borderTopColor: dividerColor },
                    ]}>
                    <View style={styles.footerItem}>
                      <Clock size={13} color={textMuted} strokeWidth={2} />
                      <Text style={[styles.footerText, { color: textMuted }]}>
                        Time taken: {formatDurationText(q.timeSpentSeconds || 6)}
                      </Text>
                    </View>

                    <View style={[styles.footerPipe, { backgroundColor: dividerColor }]} />

                    <View style={styles.footerItem}>
                      <Calendar size={13} color={textMuted} strokeWidth={2} />
                      <Text style={[styles.footerText, { color: textMuted }]}>
                        Attempted on: {formattedDate}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  desktopScrollBody: {
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  topMetaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  topMetaRow: {
    gap: 12,
  },
  subjectHeadline: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summaryMetaText: {
    fontSize: 12,
    marginTop: 3,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  emptyStateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  questionsContainer: {
    gap: 20,
  },
  // Main Card matching reference image
  editorialCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  qNumberLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerPipe: {
    fontSize: 14,
    opacity: 0.6,
  },
  qTopicLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  answerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  answerStatusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  questionTextArea: {
    marginTop: 18,
    marginBottom: 20,
  },
  questionBodyText: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  desktopQuestionBodyText: {
    fontSize: 17,
    lineHeight: 26,
  },
  statementsBlock: {
    gap: 6,
    marginTop: 12,
    paddingLeft: 4,
  },
  statementLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  statementIndex: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 20,
  },
  statementContent: {
    fontSize: 13.5,
    lineHeight: 20,
    flex: 1,
  },
  optionsList: {
    gap: 10,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionContentCol: {
    flex: 1,
    gap: 4,
  },
  optionBodyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  optionSubStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  correctAnswerLabelText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10B981',
  },
  incorrectAnswerLabelText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Explanation Section
  explanationSection: {
    marginTop: 22,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  explanationHeading: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  bookmarkBtn: {
    padding: 4,
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepBadgeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  stepContentCol: {
    flex: 1,
    gap: 4,
  },
  stepTitleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  stepBodyLine: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : Platform.OS === 'android' ? 'monospace' : 'monospace',
  },
  conclusionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  conclusionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  conclusionTitleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  conclusionBodyText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  finalHighlightText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  // Quiet Footer Row
  quietFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerPipe: {
    width: 1,
    height: 12,
  },
  footerText: {
    fontSize: 12,
  },
});
