import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from '@/components/common/LucideIcons';
import { BW_THEME } from '@/constants/bwTheme';
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

export function MockTestResultsView({
  test,
  questions,
  responses,
  onBackToDashboard,
  onRetakeTest,
  isDark = true,
}: MockTestResultsViewProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'unattempted'>('all');
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  const toggleExplanation = (questionId: string) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Safe accuracy calculation
  const attemptedCount = test.correct_count + test.incorrect_count;
  const accuracy = attemptedCount > 0 ? Number(((test.correct_count / attemptedCount) * 100).toFixed(1)) : 0;

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

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const resp = responses[q.question_id];
      const hasAnswer = Boolean(resp?.selected_answer && resp.selected_answer.trim().length > 0);
      const isCorrect = hasAnswer && resp?.selected_answer?.toUpperCase() === q.snapshot.correct_answer.toUpperCase();

      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'incorrect') return hasAnswer && !isCorrect;
      if (reviewFilter === 'unattempted') return !hasAnswer;
      return true;
    });
  }, [questions, responses, reviewFilter]);

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <Pressable onPress={onBackToDashboard} style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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
          <View style={[styles.scoreBadge, { backgroundColor: isDark ? '#1C263D' : '#FFE8D6' }]}>
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
            <Text style={[styles.accuracyPercent, { color: accuracy >= 60 ? '#10B981' : accuracy >= 40 ? '#F59E0B' : '#EF4444' }]}>
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

      {/* Detailed Question Review Section */}
      <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.reviewHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Question Review & Solutions</Text>
          {/* Review Filter Pills */}
          <View style={styles.filterPillsRow}>
            {(['all', 'incorrect', 'correct', 'unattempted'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setReviewFilter(f)}
                style={[
                  styles.filterPill,
                  reviewFilter === f && {
                    backgroundColor: theme.buttonPrimaryBg,
                    borderColor: theme.buttonPrimaryBg,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterPillText,
                    { color: reviewFilter === f ? theme.buttonPrimaryText : theme.textSecondary },
                  ]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyFilterBox}>
            <Text style={[styles.emptyFilterText, { color: theme.textMuted }]}>
              No questions found in this filter.
            </Text>
          </View>
        ) : (
          filteredQuestions.map((q) => {
            const resp = responses[q.question_id];
            const snap = q.snapshot;
            const position = q.position;
            const userAns = resp?.selected_answer?.toUpperCase() || null;
            const correctAns = snap.correct_answer.toUpperCase();
            const isCorrect = userAns === correctAns;
            const isExpanded = Boolean(expandedExplanation[q.id]);

            return (
              <View
                key={q.id}
                style={[
                  styles.questionCard,
                  {
                    backgroundColor: isDark ? '#0C0F17' : '#F8FAFC',
                    borderColor: isCorrect ? '#059669' : userAns ? '#DC2626' : theme.divider,
                  },
                ]}>
                {/* Question Header */}
                <View style={styles.qHeader}>
                  <View style={styles.qNumberRow}>
                    <Text style={[styles.qNumBadge, { color: theme.textPrimary }]}>Q{position}</Text>
                    <Text style={[styles.qMetaText, { color: theme.textMuted }]}>
                      {snap.year} • {snap.subject} {snap.topic ? `• ${snap.topic}` : ''}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    {isCorrect ? (
                      <View style={[styles.badgeCorrect, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <CheckCircle2 size={13} color="#10B981" />
                        <Text style={styles.badgeCorrectText}>Correct (+{test.marks_per_correct})</Text>
                      </View>
                    ) : userAns ? (
                      <View style={[styles.badgeIncorrect, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <XCircle size={13} color="#EF4444" />
                        <Text style={styles.badgeIncorrectText}>Incorrect (-{test.negative_marks})</Text>
                      </View>
                    ) : (
                      <View style={[styles.badgeUnattempted, { backgroundColor: isDark ? '#181E2C' : '#E2E8F0' }]}>
                        <HelpCircle size={13} color={theme.textMuted} />
                        <Text style={[styles.badgeUnattemptedText, { color: theme.textMuted }]}>Unattempted (0)</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Question Text */}
                <Text style={[styles.questionText, { color: theme.textPrimary }]}>{snap.question_text_en}</Text>

                {/* Statements if present */}
                {snap.statements && snap.statements.length > 0 && (
                  <View style={[styles.statementsBox, { backgroundColor: isDark ? '#121622' : '#FFFFFF', borderColor: theme.divider }]}>
                    {snap.statements.map((stmt: string, sIdx: number) => (
                      <Text key={sIdx} style={[styles.statementText, { color: theme.textSecondary }]}>
                        {stmt}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Options List */}
                <View style={styles.optionsList}>
                  {snap.options.map((opt: any) => {
                    const isUserPick = userAns === opt.id.toUpperCase();
                    const isOfficialCorrect = correctAns === opt.id.toUpperCase();

                    let optBg = isDark ? '#121622' : '#FFFFFF';
                    let optBorder = theme.divider;
                    let optTextColor = theme.textPrimary;

                    if (isOfficialCorrect) {
                      optBg = isDark ? '#064E3B' : '#ECFDF5';
                      optBorder = '#10B981';
                      optTextColor = isDark ? '#A7F3D0' : '#065F46';
                    } else if (isUserPick && !isCorrect) {
                      optBg = isDark ? '#7F1D1D' : '#FEF2F2';
                      optBorder = '#EF4444';
                      optTextColor = isDark ? '#FECACA' : '#991B1B';
                    }

                    return (
                      <View
                        key={opt.id}
                        style={[
                          styles.optionReviewItem,
                          {
                            backgroundColor: optBg,
                            borderColor: optBorder,
                          },
                        ]}>
                        <View style={[styles.optionIdCircle, { backgroundColor: isOfficialCorrect ? '#10B981' : isUserPick ? '#EF4444' : theme.activeBg }]}>
                          <Text
                            style={[
                              styles.optionIdText,
                              { color: isOfficialCorrect || isUserPick ? '#FFFFFF' : theme.textPrimary },
                            ]}>
                            {opt.id}
                          </Text>
                        </View>
                        <Text style={[styles.optionReviewText, { color: optTextColor }]}>{opt.text}</Text>
                        {isOfficialCorrect && (
                          <Text style={styles.officialAnswerTag}>Official Key</Text>
                        )}
                        {isUserPick && !isOfficialCorrect && (
                          <Text style={styles.yourPickTag}>Your Answer</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Explanation Toggle */}
                {snap.explanation_en && (
                  <View style={styles.explanationSection}>
                    <Pressable
                      onPress={() => toggleExplanation(q.id)}
                      style={[styles.explanationToggle, { backgroundColor: isDark ? '#1C2438' : '#EEF4FF' }]}>
                      <BookOpen size={15} color={theme.textPrimary} />
                      <Text style={[styles.explanationToggleText, { color: theme.textPrimary }]}>
                        {isExpanded ? 'Hide Explanation' : 'View Official Solution & Analysis'}
                      </Text>
                      {isExpanded ? <ChevronUp size={16} color={theme.textPrimary} /> : <ChevronDown size={16} color={theme.textPrimary} />}
                    </Pressable>

                    {isExpanded && (
                      <View style={{ marginTop: 10 }}>
                        <EditorialExplanationView
                          isDark={isDark}
                          correctAnswer={snap.correct_answer}
                          explanationText={snap.explanation_en}
                          showHeaderBadge={false}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.footerActions}>
        <Pressable
          onPress={onBackToDashboard}
          style={[styles.primaryActionBtn, { backgroundColor: theme.buttonPrimaryBg }]}>
          <Text style={[styles.primaryActionText, { color: theme.buttonPrimaryText }]}>Return to Mock Test Dashboard</Text>
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
    marginBottom: 20,
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
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  subjectTable: {
    gap: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subjectDetails: {
    fontSize: 12,
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
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyFilterBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 13,
  },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qNumBadge: {
    fontSize: 14,
    fontWeight: '800',
  },
  qMetaText: {
    fontSize: 12,
  },
  statusPill: {},
  badgeCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeCorrectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  badgeIncorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeIncorrectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  badgeUnattempted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeUnattemptedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 12,
  },
  statementsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  statementText: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionsList: {
    gap: 8,
    marginBottom: 12,
  },
  optionReviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  optionIdCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionReviewText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  officialAnswerTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  yourPickTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  explanationSection: {
    marginTop: 8,
  },
  explanationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  explanationToggleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  explanationContent: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  explanationBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  footerActions: {
    marginTop: 10,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
