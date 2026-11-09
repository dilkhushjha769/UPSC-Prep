import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  LayoutGrid,
  X,
  Clock,
  Eye,
  Languages,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useAppTheme } from '@/context/ThemeContext';
import { MockTestQuestionRecord, MockTestRecord, MockTestResponseRecord } from '@/types/mockTest';
import { EditorialExplanationView } from '@/components/common/EditorialExplanationView';

interface MockTestResultsViewProps {
  test: MockTestRecord;
  questions: MockTestQuestionRecord[];
  responses: Record<string, MockTestResponseRecord>;
  onBackToDashboard: () => void;
  onRetakeTest?: () => void;
  isDark?: boolean;
}

type QuestionStatus = 'correct' | 'incorrect' | 'unattempted';

export function MockTestResultsView({
  test,
  questions,
  responses,
  onBackToDashboard,
  isDark: propIsDark,
}: MockTestResultsViewProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isMobile = width < 768;

  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  // Navigation mode: null = Scorecard page with 3 sections; number = Single Question Solution view
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const questionScrollRef = useRef<any>(null);

  // Classify each question with its original index
  const classifiedQuestions = useMemo(() => {
    return questions.map((q, index) => {
      const resp = responses[q.question_id];
      const userAns = resp?.selected_answer?.trim().toUpperCase() || null;
      const correctAns = q.snapshot.correct_answer.trim().toUpperCase();
      const hasAnswer = Boolean(userAns);
      const isCorrect = hasAnswer && userAns === correctAns;

      let status: QuestionStatus = 'unattempted';
      if (hasAnswer && isCorrect) status = 'correct';
      else if (hasAnswer && !isCorrect) status = 'incorrect';

      return {
        q,
        originalIndex: index,
        userAns,
        correctAns,
        isCorrect,
        status,
      };
    });
  }, [questions, responses]);

  const correctList = useMemo(
    () => classifiedQuestions.filter((item) => item.status === 'correct'),
    [classifiedQuestions]
  );
  const incorrectList = useMemo(
    () => classifiedQuestions.filter((item) => item.status === 'incorrect'),
    [classifiedQuestions]
  );
  const unattemptedList = useMemo(
    () => classifiedQuestions.filter((item) => item.status === 'unattempted'),
    [classifiedQuestions]
  );

  // Active list based on review filter in single-question mode
  const activeReviewList = useMemo(() => {
    if (reviewFilter === 'correct') return correctList;
    if (reviewFilter === 'incorrect') return incorrectList;
    if (reviewFilter === 'unattempted') return unattemptedList;
    return classifiedQuestions;
  }, [reviewFilter, correctList, incorrectList, unattemptedList, classifiedQuestions]);

  // Safe accuracy calculation
  const attemptedCount = test.correct_count + test.incorrect_count;
  const accuracy =
    attemptedCount > 0 ? Number(((test.correct_count / attemptedCount) * 100).toFixed(1)) : 0;

  // Format time spent
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const subjectStatsList = useMemo(() => {
    if (!test.subject_stats) return [];
    return Object.entries(test.subject_stats).map(([subj, stat]) => ({
      subject: subj,
      ...stat,
      accuracy:
        stat.correct + stat.incorrect > 0
          ? Math.round((stat.correct / (stat.correct + stat.incorrect)) * 100)
          : 0,
    }));
  }, [test.subject_stats]);

  // Jump to a question in solution mode and smoothly scroll to top
  const handleSelectQuestion = (index: number) => {
    setReviewIndex(index);
    setPaletteVisible(false);
    questionScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Next / Previous navigation within the active review list
  const activeListPosition = useMemo(() => {
    if (reviewIndex === null) return -1;
    return activeReviewList.findIndex((item) => item.originalIndex === reviewIndex);
  }, [reviewIndex, activeReviewList]);

  const handleNextQuestion = () => {
    if (activeListPosition >= 0 && activeListPosition < activeReviewList.length - 1) {
      const nextItem = activeReviewList[activeListPosition + 1];
      handleSelectQuestion(nextItem.originalIndex);
    }
  };

  const handlePrevQuestion = () => {
    if (activeListPosition > 0) {
      const prevItem = activeReviewList[activeListPosition - 1];
      handleSelectQuestion(prevItem.originalIndex);
    }
  };

  // =========================================================================
  // VIEW B: MOCK TEST SCREEN (ONE QUESTION AT A TIME REVIEW & SOLUTION)
  // =========================================================================
  if (reviewIndex !== null && reviewIndex >= 0 && reviewIndex < questions.length) {
    const currentItem = classifiedQuestions[reviewIndex];
    const snap = currentItem.q.snapshot;
    const hasHindi = Boolean(snap.question_text_hi);
    const currentQText = language === 'hi' && snap.question_text_hi ? snap.question_text_hi : snap.question_text_en;

    const isCurrentCorrect = currentItem.status === 'correct';
    const isCurrentIncorrect = currentItem.status === 'incorrect';

    const canGoPrev = activeListPosition > 0;
    const canGoNext = activeListPosition >= 0 && activeListPosition < activeReviewList.length - 1;

    // Non-repeating topic text
    const topicClean =
      snap.topic && snap.topic.trim().toLowerCase() !== snap.subject.trim().toLowerCase()
        ? ` • ${snap.topic}`
        : '';

    // Palette modal/panel content
    const renderPaletteContent = () => (
      <View style={[styles.paletteContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[styles.paletteHeader, { borderBottomColor: theme.divider }]}>
          <View>
            <Text style={[styles.paletteTitle, { color: theme.textPrimary }]}>Question Palette</Text>
            <Text style={[styles.paletteSubtitle, { color: theme.textSecondary }]}>
              {correctList.length} Correct • {incorrectList.length} Incorrect • {unattemptedList.length} Skipped
            </Text>
          </View>
          {isMobile && (
            <Pressable
              onPress={() => setPaletteVisible(false)}
              style={[styles.paletteCloseBtn, { backgroundColor: theme.activeBg }]}>
              <X size={18} color={theme.textPrimary} />
            </Pressable>
          )}
        </View>

        {/* Legend */}
        <View style={[styles.paletteLegend, { backgroundColor: '#FAF9F6' }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Correct ({correctList.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Incorrect ({incorrectList.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.textMuted }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Skipped ({unattemptedList.length})</Text>
          </View>
        </View>

        {/* Palette Filter Tabs */}
        <View style={styles.paletteFilterRow}>
          {(['all', 'correct', 'incorrect', 'unattempted'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setReviewFilter(tab)}
              style={[
                styles.paletteFilterTab,
                reviewFilter === tab && {
                  backgroundColor: theme.buttonPrimaryBg,
                  borderColor: theme.buttonPrimaryBg,
                },
              ]}>
              <Text
                style={[
                  styles.paletteFilterTabText,
                  { color: reviewFilter === tab ? theme.buttonPrimaryText : theme.textSecondary },
                ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Question Bubbles Grid */}
        <ScrollView contentContainerStyle={styles.paletteGrid} showsVerticalScrollIndicator={false}>
          {classifiedQuestions
            .filter((item) => {
              if (reviewFilter === 'all') return true;
              return item.status === reviewFilter;
            })
            .map((item) => {
              const isSelected = item.originalIndex === reviewIndex;
              let bubbleBg = '#EAE5DC';
              let bubbleColor = '#475569';

              if (item.status === 'correct') {
                bubbleBg = '#DCFCE7';
                bubbleColor = '#15803D';
              } else if (item.status === 'incorrect') {
                bubbleBg = '#FEE2E2';
                bubbleColor = '#B91C1C';
              }

              return (
                <Pressable
                  key={item.q.id}
                  onPress={() => handleSelectQuestion(item.originalIndex)}
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: bubbleBg,
                      borderColor: isSelected ? '#2563EB' : 'transparent',
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}>
                  <Text style={[styles.bubbleText, { color: bubbleColor, fontWeight: isSelected ? '800' : '600' }]}>
                    {item.originalIndex + 1}
                  </Text>
                </Pressable>
              );
            })}
        </ScrollView>
      </View>
    );

    return (
      <View style={[styles.solutionRoot, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Top Header Bar */}
        <View style={[styles.solutionHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.cardBorder }]}>
          <View style={styles.headerLeftCol}>
            <Pressable
              onPress={() => setReviewIndex(null)}
              style={[styles.returnScorecardBtn, { backgroundColor: theme.activeBg }]}>
              <ArrowLeft size={16} color={theme.textPrimary} />
              <Text style={[styles.returnScorecardText, { color: theme.textPrimary }]}>Results</Text>
            </Pressable>
            <Text style={[styles.solutionTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
              Q{reviewIndex + 1} of {questions.length}
            </Text>
          </View>

          <View style={styles.headerRightCol}>
            {/* Status Pill */}
            {isCurrentCorrect ? (
              <View style={[styles.statusHeaderPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981' }]}>
                <CheckCircle2 size={13} color="#10B981" />
                <Text style={[styles.statusHeaderPillText, { color: '#10B981' }]}>
                  {isMobile ? 'Correct' : `Correct (+${test.marks_per_correct} M)`}
                </Text>
              </View>
            ) : isCurrentIncorrect ? (
              <View style={[styles.statusHeaderPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#EF4444' }]}>
                <XCircle size={13} color="#EF4444" />
                <Text style={[styles.statusHeaderPillText, { color: '#EF4444' }]}>
                  {isMobile ? 'Incorrect' : `Incorrect (-${test.negative_marks} M)`}
                </Text>
              </View>
            ) : (
              <View style={[styles.statusHeaderPill, { backgroundColor: '#F1F5F9', borderColor: theme.divider }]}>
                <HelpCircle size={13} color={theme.textMuted} />
                <Text style={[styles.statusHeaderPillText, { color: theme.textMuted }]}>
                  {isMobile ? 'Skipped' : 'Unattempted'}
                </Text>
              </View>
            )}

            {/* Language toggle if Hindi exists */}
            {hasHindi && (
              <Pressable
                onPress={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
                style={[styles.langToggleBtn, { backgroundColor: theme.activeBg, borderColor: theme.cardBorder }]}>
                <Languages size={14} color={theme.textPrimary} />
                <Text style={[styles.langToggleText, { color: theme.textPrimary }]}>
                  {language === 'en' ? 'हिन्दी' : 'ENG'}
                </Text>
              </Pressable>
            )}

            {/* Palette toggle */}
            <Pressable
              onPress={() => setPaletteVisible(true)}
              style={[styles.paletteToggleHeaderBtn, { backgroundColor: theme.activeBg }]}>
              <LayoutGrid size={16} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Main Solution Area */}
        <View style={styles.solutionMainBody}>
          <ScrollView
            ref={questionScrollRef}
            style={styles.solutionScroll}
            contentContainerStyle={styles.solutionScrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Clean Question Metadata - Single Line, No Repeating Topic, No Repeating Marks */}
            <View style={styles.qBannerRow}>
              <View style={[styles.qNumBadge, { backgroundColor: '#E2E8F0' }]}>
                <Text style={[styles.qNumBadgeText, { color: theme.textPrimary }]}>Q{reviewIndex + 1}</Text>
              </View>
              <Text style={[styles.qMetaText, { color: theme.textMuted }]}>
                {snap.year} • {snap.subject}{topicClean}
              </Text>
            </View>

            {/* Reading Comprehension Passage */}
            {snap.passage_text && (
              <View style={[styles.passageCard, { backgroundColor: '#F8FAFC', borderColor: theme.cardBorder }]}>
                <Text style={[styles.passageLabel, { color: '#64748B' }]}>PASSAGE</Text>
                <Text style={[styles.passageBody, { color: theme.textPrimary }]}>{snap.passage_text}</Text>
              </View>
            )}

            {/* Question Text */}
            <Text style={[styles.qBodyText, { color: theme.textPrimary }]}>{currentQText}</Text>

            {/* Statements list */}
            {snap.statements && snap.statements.length > 0 && (
              <View style={[styles.statementsCard, { backgroundColor: '#FFFFFF', borderColor: theme.divider }]}>
                {snap.statements.map((stmt: string, sIdx: number) => (
                  <Text key={sIdx} style={[styles.statementItemText, { color: theme.textSecondary }]}>
                    {stmt}
                  </Text>
                ))}
              </View>
            )}

            {/* 4 Options Review */}
            <View style={styles.optionsWrapper}>
              {snap.options.map((opt: any) => {
                const optLetter = opt.id.toUpperCase();
                const isUserPick = currentItem.userAns === optLetter;
                const isOfficialCorrect = currentItem.correctAns === optLetter;

                let optBg = '#FFFFFF';
                let optBorder = theme.divider;
                let optTextColor = theme.textPrimary;

                if (isOfficialCorrect) {
                  optBg = '#F0FDF4';
                  optBorder = '#10B981';
                  optTextColor = '#065F46';
                } else if (isUserPick && !isCurrentCorrect) {
                  optBg = '#FEF2F2';
                  optBorder = '#EF4444';
                  optTextColor = '#991B1B';
                }

                return (
                  <View
                    key={opt.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: optBg,
                        borderColor: optBorder,
                        borderWidth: isOfficialCorrect || isUserPick ? 1.5 : 1,
                      },
                    ]}>
                    <View
                      style={[
                        styles.optionLetterCircle,
                        {
                          backgroundColor: isOfficialCorrect
                            ? '#10B981'
                            : isUserPick
                            ? '#EF4444'
                            : '#F1F5F9',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.optionLetterText,
                          { color: isOfficialCorrect || isUserPick ? '#FFFFFF' : theme.textPrimary },
                        ]}>
                        {opt.id}
                      </Text>
                    </View>

                    <Text style={[styles.optionBodyText, { color: optTextColor }]}>{opt.text}</Text>

                    <View style={styles.optionBadgesRow}>
                      {isOfficialCorrect && (
                        <View style={[styles.keyBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.keyBadgeText}>Official Key</Text>
                        </View>
                      )}
                      {isUserPick && !isOfficialCorrect && (
                        <View style={[styles.userAnswerBadge, { backgroundColor: '#EF4444' }]}>
                          <Text style={styles.userAnswerBadgeText}>Your Answer ✗</Text>
                        </View>
                      )}
                      {isUserPick && isOfficialCorrect && (
                        <View style={[styles.userAnswerBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.userAnswerBadgeText}>Your Answer ✓</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Official Solution Card */}
            {snap.explanation_en && (
              <View style={[styles.solutionCard, { backgroundColor: '#FFFFFF', borderColor: theme.cardBorder }]}>
                <View style={styles.solutionCardHeader}>
                  <BookOpen size={16} color="#2563EB" />
                  <Text style={[styles.solutionCardTitle, { color: theme.textPrimary }]}>
                    Official Solution & Analysis
                  </Text>
                </View>

                <EditorialExplanationView
                  isDark={false}
                  correctAnswer={snap.correct_answer}
                  explanationText={snap.explanation_en || undefined}
                  showHeaderBadge={false}
                />
              </View>
            )}
          </ScrollView>

          {/* Desktop Side Palette */}
          {isDesktop && <View style={styles.desktopPaletteWrapper}>{renderPaletteContent()}</View>}
        </View>

        {/* Bottom Navigation Toolbar */}
        <View style={[styles.solutionBottomBar, { backgroundColor: theme.cardBg, borderTopColor: theme.cardBorder }]}>
          <Pressable
            disabled={!canGoPrev}
            onPress={handlePrevQuestion}
            style={[
              styles.navBtn,
              { backgroundColor: theme.activeBg },
              !canGoPrev && { opacity: 0.35 },
            ]}>
            <ChevronLeft size={18} color={theme.textPrimary} />
            <Text style={[styles.navBtnText, { color: theme.textPrimary }]}>Previous</Text>
          </Pressable>

          {/* Question Index Indicator / Palette trigger */}
          <Pressable
            onPress={() => setPaletteVisible(true)}
            style={[styles.paletteCenterIndicator, { backgroundColor: '#E2E8F0' }]}>
            <LayoutGrid size={13} color={theme.textPrimary} />
            <Text style={[styles.paletteCenterText, { color: theme.textPrimary }]}>
              Q{reviewIndex + 1} of {questions.length}
            </Text>
          </Pressable>

          <Pressable
            disabled={!canGoNext}
            onPress={handleNextQuestion}
            style={[
              styles.navBtn,
              { backgroundColor: theme.buttonPrimaryBg },
              !canGoNext && { opacity: 0.35 },
            ]}>
            <Text style={[styles.navBtnText, { color: theme.buttonPrimaryText }]}>Next</Text>
            <ChevronRight size={18} color={theme.buttonPrimaryText} />
          </Pressable>
        </View>

        {/* Mobile Palette Modal */}
        {!isDesktop && (
          <Modal
            visible={paletteVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setPaletteVisible(false)}>
            <View style={styles.modalBackdrop}>
              <Pressable style={styles.modalDismissArea} onPress={() => setPaletteVisible(false)} />
              <View style={[styles.mobilePaletteSheet, { maxHeight: '80%' }]}>
                {renderPaletteContent()}
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // =========================================================================
  // VIEW A: RESULT SCORECARD PAGE WITH COMPACT QUESTION PALETTES
  // =========================================================================
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <Pressable
          onPress={onBackToDashboard}
          style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <ArrowLeft size={18} color={theme.textPrimary} />
          <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>Dashboard</Text>
        </Pressable>
        <Text style={[styles.paperBadge, { color: theme.textSecondary }]}>
          {test.exam} • {test.paper_type === 'CSAT' ? 'CSAT Paper-II' : 'General Studies Paper-I'}
        </Text>
      </View>

      {/* Main Score Hero Card */}
      <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={[styles.heroSubTitle, { color: theme.textMuted }]}>TEST COMPLETED</Text>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{test.test_title}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: '#F2C9A3' }]}>
            <Award size={22} color={theme.textPrimary} />
          </View>
        </View>

        {/* Big Marks Display */}
        <View style={styles.scoreRow}>
          <View style={styles.bigScoreBox}>
            <Text style={[styles.scoreNumber, { color: theme.textPrimary }]}>{test.score}</Text>
            <Text style={[styles.scoreTotal, { color: theme.textSecondary }]}>/ {test.total_marks} Marks</Text>
          </View>
          <View style={styles.accuracyBox}>
            <Text
              style={[
                styles.accuracyPercent,
                { color: accuracy >= 60 ? '#10B981' : accuracy >= 40 ? '#F59E0B' : '#EF4444' },
              ]}>
              {accuracy}%
            </Text>
            <Text style={[styles.accuracyLabel, { color: theme.textMuted }]}>Accuracy</Text>
          </View>
        </View>

        {/* Metrics Bar */}
        <View style={[styles.metricsGrid, { borderTopColor: theme.divider }]}>
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{test.correct_count}</Text>
            <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Correct</Text>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{test.incorrect_count}</Text>
            <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Incorrect</Text>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: theme.textMuted }]} />
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{test.unattempted_count}</Text>
            <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Unattempted</Text>
          </View>

          <View style={styles.metricItem}>
            <Clock size={14} color={theme.textSecondary} />
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
              {formatTime(test.time_spent_seconds || 0)}
            </Text>
            <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Time Spent</Text>
          </View>
        </View>
      </View>

      {/* Primary CTA: Clean, single-line, mobile-friendly button */}
      <Pressable
        onPress={() => handleSelectQuestion(0)}
        style={styles.startReviewCtaBtn}>
        <Eye size={18} color="#FFFFFF" />
        <Text style={styles.startReviewCtaText}>Start Question Review (One by One)</Text>
        <ChevronRight size={18} color="#FFFFFF" />
      </Pressable>

      {/* Subject-Wise Performance Breakdown */}
      {subjectStatsList.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Subject-Wise Performance</Text>
          <View style={styles.subjectTable}>
            {subjectStatsList.map((stat) => (
              <View key={stat.subject} style={[styles.subjectRow, { borderBottomColor: theme.divider }]}>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: theme.textPrimary }]}>{stat.subject}</Text>
                  <Text style={[styles.subjectDetails, { color: theme.textMuted }]}>
                    {stat.total} Qs • {stat.correct} Correct • {stat.incorrect} Wrong
                  </Text>
                </View>
                <View style={styles.subjectMarks}>
                  <Text style={[styles.subjectMarkText, { color: theme.textPrimary }]}>
                    {stat.marks > 0 ? `+${stat.marks}` : stat.marks} M
                  </Text>
                  <Text style={[styles.subjectAccuracy, { color: stat.accuracy >= 60 ? '#10B981' : '#F59E0B' }]}>
                    {stat.accuracy}% acc
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* =================================================================== */}
      {/* SECTION 1: CORRECT QUESTIONS (COMPACT GRID PALETTE)                 */}
      {/* =================================================================== */}
      <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <CheckCircle2 size={16} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.sectionGroupTitle, { color: theme.textPrimary }]}>
                Correct Questions ({correctList.length})
              </Text>
              <Text style={[styles.sectionGroupSubtitle, { color: theme.textSecondary }]}>
                Tap any question number to review its solution
              </Text>
            </View>
          </View>
          <View style={[styles.sectionCountPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Text style={[styles.sectionCountText, { color: '#10B981' }]}>
              +{Number((correctList.length * (test.marks_per_correct || 2)).toFixed(1))} M
            </Text>
          </View>
        </View>

        {correctList.length === 0 ? (
          <View style={styles.emptySectionBox}>
            <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
              No correct questions attempted in this test.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionGridWrap}>
            {correctList.map((item) => (
              <Pressable
                key={item.q.id}
                onPress={() => handleSelectQuestion(item.originalIndex)}
                style={[styles.sectionChipBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                <Text style={[styles.sectionChipText, { color: '#15803D' }]}>Q{item.originalIndex + 1}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* =================================================================== */}
      {/* SECTION 2: INCORRECT QUESTIONS (COMPACT GRID PALETTE)               */}
      {/* =================================================================== */}
      <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <XCircle size={16} color="#EF4444" />
            </View>
            <View>
              <Text style={[styles.sectionGroupTitle, { color: theme.textPrimary }]}>
                Incorrect Questions ({incorrectList.length})
              </Text>
              <Text style={[styles.sectionGroupSubtitle, { color: theme.textSecondary }]}>
                Tap any question number to review negative marks & concepts
              </Text>
            </View>
          </View>
          <View style={[styles.sectionCountPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <Text style={[styles.sectionCountText, { color: '#EF4444' }]}>
              -{Number((incorrectList.length * (test.negative_marks || 0.66)).toFixed(1))} M
            </Text>
          </View>
        </View>

        {incorrectList.length === 0 ? (
          <View style={styles.emptySectionBox}>
            <Text style={[styles.emptySectionText, { color: '#10B981', fontWeight: '600' }]}>
              🎉 Zero incorrect questions! Perfect accuracy on all attempts.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionGridWrap}>
            {incorrectList.map((item) => (
              <Pressable
                key={item.q.id}
                onPress={() => handleSelectQuestion(item.originalIndex)}
                style={[styles.sectionChipBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                <Text style={[styles.sectionChipText, { color: '#B91C1C' }]}>Q{item.originalIndex + 1}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* =================================================================== */}
      {/* SECTION 3: UNATTEMPTED QUESTIONS (COMPACT GRID PALETTE)             */}
      {/* =================================================================== */}
      <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#E2E8F0' }]}>
              <HelpCircle size={16} color={theme.textMuted} />
            </View>
            <View>
              <Text style={[styles.sectionGroupTitle, { color: theme.textPrimary }]}>
                Unattempted Questions ({unattemptedList.length})
              </Text>
              <Text style={[styles.sectionGroupSubtitle, { color: theme.textSecondary }]}>
                Tap any question number to explore core questions & keys
              </Text>
            </View>
          </View>
          <View style={[styles.sectionCountPill, { backgroundColor: '#F1F5F9' }]}>
            <Text style={[styles.sectionCountText, { color: theme.textMuted }]}>0 M</Text>
          </View>
        </View>

        {unattemptedList.length === 0 ? (
          <View style={styles.emptySectionBox}>
            <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
              All questions were attempted in this test.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionGridWrap}>
            {unattemptedList.map((item) => (
              <Pressable
                key={item.q.id}
                onPress={() => handleSelectQuestion(item.originalIndex)}
                style={[styles.sectionChipBtn, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                <Text style={[styles.sectionChipText, { color: '#475569' }]}>Q{item.originalIndex + 1}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Footer Return Action */}
      <View style={styles.footerActions}>
        <Pressable
          onPress={onBackToDashboard}
          style={[styles.primaryActionBtn, { backgroundColor: theme.buttonPrimaryBg }]}>
          <Text style={[styles.primaryActionText, { color: theme.buttonPrimaryText }]}>
            Return to Mock Test Dashboard
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  paperBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroSubTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bigScoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  scoreTotal: {
    fontSize: 18,
    fontWeight: '600',
  },
  accuracyBox: {
    alignItems: 'flex-end',
  },
  accuracyPercent: {
    fontSize: 28,
    fontWeight: '900',
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '500',
  },
  startReviewCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  startReviewCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionGroupSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptySectionBox: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  sectionGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  sectionChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subjectTable: {
    gap: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
  },
  subjectDetails: {
    fontSize: 11,
    marginTop: 2,
  },
  subjectMarks: {
    alignItems: 'flex-end',
  },
  subjectMarkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectAccuracy: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  footerActions: {
    marginTop: 8,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // =========================================================================
  // SOLUTION MODE STYLES
  // =========================================================================
  solutionRoot: {
    flex: 1,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  returnScorecardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  returnScorecardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  solutionTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusHeaderPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  langToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paletteToggleHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solutionMainBody: {
    flex: 1,
    flexDirection: 'row',
  },
  solutionScroll: {
    flex: 1,
  },
  solutionScrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
  },
  desktopPaletteWrapper: {
    width: 300,
    borderLeftWidth: 1,
    borderLeftColor: '#EAE5DC',
  },
  qBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  qNumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qNumBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  qMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  passageCard: {
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  passageLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  passageBody: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  qBodyText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    marginBottom: 16,
  },
  statementsCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  statementItemText: {
    fontSize: 13,
    lineHeight: 19,
  },
  optionsWrapper: {
    gap: 10,
    marginBottom: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  optionLetterCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionBodyText: {
    fontSize: 13.5,
    lineHeight: 19,
    flex: 1,
  },
  optionBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  keyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  userAnswerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  userAnswerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  solutionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  solutionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  solutionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  solutionBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paletteCenterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paletteCenterText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // =========================================================================
  // PALETTE STYLES
  // =========================================================================
  paletteContainer: {
    flex: 1,
    padding: 14,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  paletteTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  paletteSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },
  paletteCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    marginVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  paletteFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 4,
  },
  paletteFilterTab: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  paletteFilterTabText: {
    fontSize: 10,
    fontWeight: '700',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 12,
  },

  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  mobilePaletteSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
});
