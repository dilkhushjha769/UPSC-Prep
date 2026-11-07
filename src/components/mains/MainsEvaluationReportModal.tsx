import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Lightbulb,
  Maximize2,
  PenTool,
  RefreshCw,
  Scale,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react-native';
import {
  MainsEvaluationRecord,
  MainsQuestionRecord,
  MainsSubmissionRecord,
} from '@/types/mains';

interface MainsEvaluationReportModalProps {
  visible: boolean;
  onClose: () => void;
  submission: MainsSubmissionRecord | null;
  question: MainsQuestionRecord | null;
  evaluation: MainsEvaluationRecord | null;
  onReattempt?: () => void;
  isDark: boolean;
}

export function MainsEvaluationReportModal({
  visible,
  onClose,
  submission,
  question,
  evaluation,
  onReattempt,
  isDark,
}: MainsEvaluationReportModalProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<'evaluation' | 'student_answer' | 'model_answer'>('evaluation');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  if (!visible || !submission || !question) return null;

  const evalRecord = evaluation || submission.evaluation;
  const isCaseStudy = question.is_case_study;

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const cardBg = isDark ? '#141C28' : '#FFFFFF';
  const cardBorder = isDark ? '#253244' : '#EAE5DC';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#9DA8B9' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  const scorePct = evalRecord ? evalRecord.score_percentage : 0;
  const scoreColor =
    scorePct >= 60 ? '#10B981' : scorePct >= 45 ? '#F59E0B' : '#EF4444';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: bg }]}>
        {/* Top Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerTagRow}>
              <View style={[styles.paperBadge, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)' }]}>
                <Text style={[styles.paperBadgeText, { color: accent }]}>{question.paper_id}</Text>
              </View>
              <Text style={[styles.qNumText, { color: textSecondary }]}>Q.{question.question_number}</Text>
              <View style={[styles.attemptBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.attemptBadgeText, { color: textSecondary }]}>Attempt #{submission.attempt_number}</Text>
              </View>
            </View>
            <Text style={[styles.headerMainTitle, { color: textPrimary }]} numberOfLines={1}>
              {question.title || question.text_english.slice(0, 70) + '...'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {onReattempt && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onReattempt();
                }}
                style={[styles.reattemptBtn, { borderColor: cardBorder }]}>
                <RefreshCw size={15} color={textPrimary} />
                <Text style={[styles.reattemptBtnText, { color: textPrimary }]}>Re-attempt</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <X size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Switcher Tabs */}
        <View style={[styles.tabBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('evaluation')}
            style={[styles.tabItem, activeTab === 'evaluation' && styles.tabItemActive]}>
            <Award size={16} color={activeTab === 'evaluation' ? accent : textSecondary} />
            <Text style={[styles.tabItemText, { color: activeTab === 'evaluation' ? accent : textSecondary }]}>
              Evaluation Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('student_answer')}
            style={[styles.tabItem, activeTab === 'student_answer' && styles.tabItemActive]}>
            <FileText size={16} color={activeTab === 'student_answer' ? accent : textSecondary} />
            <Text style={[styles.tabItemText, { color: activeTab === 'student_answer' ? accent : textSecondary }]}>
              Your Answer ({submission.submission_mode === 'handwritten' ? `${submission.attachments.length} Pages` : `${submission.word_count} Words`})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('model_answer')}
            style={[styles.tabItem, activeTab === 'model_answer' && styles.tabItemActive]}>
            <BookOpen size={16} color={activeTab === 'model_answer' ? accent : textSecondary} />
            <Text style={[styles.tabItemText, { color: activeTab === 'model_answer' ? accent : textSecondary }]}>
              Model UPSC Answer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'evaluation' && (
            <View style={styles.sectionContainer}>
              {/* Score Header Card */}
              {evalRecord ? (
                <View style={[styles.scoreHeroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.scoreRow}>
                    <View>
                      <Text style={[styles.scoreLabel, { color: textSecondary }]}>Marks Awarded</Text>
                      <View style={styles.scoreNumbersRow}>
                        <Text style={[styles.scoreBig, { color: scoreColor }]}>{evalRecord.total_score}</Text>
                        <Text style={[styles.scoreTotal, { color: textMuted }]}> / {evalRecord.max_score}</Text>
                      </View>
                      <Text style={[styles.scorePctText, { color: scoreColor }]}>
                        {evalRecord.score_percentage}% • {evalRecord.score_percentage >= 55 ? 'Good UPSC Standard' : evalRecord.score_percentage >= 45 ? 'Average Standard' : 'Needs Development'}
                      </Text>
                    </View>

                    <View style={[styles.examinerPill, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                      <Text style={[styles.examinerPillTitle, { color: textSecondary }]}>{"Examiner's Verdict"}</Text>
                      <Text style={[styles.examinerPillBody, { color: textPrimary }]}>
                        {`"${evalRecord.examiners_remarks}"`}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.marksExplanationBox, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.08)' : '#FFFBF5', borderColor: isDark ? 'rgba(245, 130, 53, 0.2)' : '#FDE8D4' }]}>
                    <Text style={[styles.marksExplanationTitle, { color: accent }]}>Marking Rationale:</Text>
                    <Text style={[styles.marksExplanationText, { color: textPrimary }]}>
                      {evalRecord.marks_explanation}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.evaluatingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Clock size={28} color={accent} />
                  <Text style={[styles.evaluatingTitle, { color: textPrimary }]}>Evaluating Answer...</Text>
                  <Text style={[styles.evaluatingSub, { color: textSecondary }]}>
                    Your answer has been submitted and is currently being scored against UPSC Mains parameters.
                  </Text>
                </View>
              )}

              {evalRecord && (
                <>
                  {/* Parameter-wise Score Breakdown */}
                  <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={styles.cardHeader}>
                      <Scale size={18} color={accent} />
                      <Text style={[styles.cardTitle, { color: textPrimary }]}>Parameter-Wise Evaluation</Text>
                    </View>

                    <View style={styles.parametersList}>
                      {evalRecord.parameters.map((param, index) => {
                        const paramPct = param.max_score > 0 ? (param.score / param.max_score) * 100 : 0;
                        const barColor = paramPct >= 60 ? '#10B981' : paramPct >= 45 ? '#F59E0B' : '#EF4444';

                        return (
                          <View key={index} style={[styles.paramRow, index > 0 && { borderTopColor: cardBorder, borderTopWidth: 1 }]}>
                            <View style={styles.paramMetaRow}>
                              <Text style={[styles.paramName, { color: textPrimary }]}>{param.parameter}</Text>
                              <Text style={[styles.paramScore, { color: textPrimary }]}>
                                <Text style={{ color: barColor, fontWeight: '700' }}>{param.score}</Text> / {param.max_score}
                              </Text>
                            </View>

                            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                              <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, paramPct))}%`, backgroundColor: barColor }]} />
                            </View>

                            {param.feedback ? (
                              <Text style={[styles.paramFeedback, { color: textSecondary }]}>{param.feedback}</Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* GS4 Case Study Detailed Breakdown (if case study) */}
                  {isCaseStudy && evalRecord.case_study_details && (
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <View style={styles.cardHeader}>
                        <Users size={18} color="#8B5CF6" />
                        <Text style={[styles.cardTitle, { color: textPrimary }]}>Case Study Framework Analysis (GS Paper IV)</Text>
                      </View>

                      {/* Stakeholders Identified */}
                      <View style={styles.csBlock}>
                        <Text style={[styles.csBlockLabel, { color: textSecondary }]}>Stakeholders Identified:</Text>
                        <View style={styles.tagWrap}>
                          {evalRecord.case_study_details.stakeholders_identified.map((stk, i) => (
                            <View key={i} style={[styles.csTag, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF' }]}>
                              <Text style={[styles.csTagText, { color: '#8B5CF6' }]}>{stk}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Ethical Issues & Dilemmas */}
                      <View style={styles.csBlock}>
                        <Text style={[styles.csBlockLabel, { color: textSecondary }]}>Ethical Issues & Dilemmas in Conflict:</Text>
                        {evalRecord.case_study_details.ethical_issues_and_dilemmas.map((dil, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <View style={[styles.bulletDot, { backgroundColor: '#8B5CF6' }]} />
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{dil}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Options Analyzed */}
                      {evalRecord.case_study_details.options_analyzed && evalRecord.case_study_details.options_analyzed.length > 0 && (
                        <View style={styles.csBlock}>
                          <Text style={[styles.csBlockLabel, { color: textSecondary }]}>Options & Trade-Offs Evaluated:</Text>
                          {evalRecord.case_study_details.options_analyzed.map((opt, i) => (
                            <View key={i} style={[styles.optionCard, { backgroundColor: isDark ? '#1A2333' : '#F8FAFC', borderColor: cardBorder }]}>
                              <Text style={[styles.optionTitle, { color: textPrimary }]}>Option {i + 1}: {opt.option}</Text>
                              <View style={styles.proConRow}>
                                <Text style={[styles.proText, { color: '#10B981' }]}>• Pros: {opt.pros}</Text>
                                <Text style={[styles.conText, { color: '#EF4444' }]}>• Cons: {opt.cons}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Final Recommendation */}
                      <View style={[styles.decisionBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
                        <Text style={[styles.decisionTitle, { color: '#10B981' }]}>Recommended Course of Action & Justification:</Text>
                        <Text style={[styles.decisionBody, { color: textPrimary }]}>
                          {evalRecord.case_study_details.final_decision_and_justification}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Strengths & Weaknesses Grid */}
                  <View style={[styles.gridRow, !isDesktop && { flexDirection: 'column' }]}>
                    {/* Strengths */}
                    <View style={[styles.card, styles.gridCol, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <View style={styles.cardHeader}>
                        <CheckCircle2 size={18} color="#10B981" />
                        <Text style={[styles.cardTitle, { color: textPrimary }]}>Strengths</Text>
                      </View>
                      <View style={styles.listWrap}>
                        {evalRecord.strengths.map((str, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <View style={[styles.bulletDot, { backgroundColor: '#10B981' }]} />
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{str}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Weaknesses */}
                    <View style={[styles.card, styles.gridCol, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <View style={styles.cardHeader}>
                        <AlertTriangle size={18} color="#F59E0B" />
                        <Text style={[styles.cardTitle, { color: textPrimary }]}>Areas of Weakness</Text>
                      </View>
                      <View style={styles.listWrap}>
                        {evalRecord.weaknesses.map((wk, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <View style={[styles.bulletDot, { backgroundColor: '#F59E0B' }]} />
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{wk}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Missing Points & Actionable Suggestions */}
                  <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={styles.cardHeader}>
                      <Lightbulb size={18} color="#3B82F6" />
                      <Text style={[styles.cardTitle, { color: textPrimary }]}>Missing Dimensions & Actionable Improvements</Text>
                    </View>

                    <Text style={[styles.subSectionTitle, { color: textSecondary }]}>Points/Data You Could Have Included:</Text>
                    <View style={styles.listWrap}>
                      {evalRecord.missing_points.map((mp, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <ChevronRight size={16} color="#3B82F6" style={{ marginTop: 2 }} />
                          <Text style={[styles.bulletText, { color: textPrimary }]}>{mp}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={{ height: 12 }} />
                    <Text style={[styles.subSectionTitle, { color: textSecondary }]}>Actionable Steps for Next Attempt:</Text>
                    <View style={styles.listWrap}>
                      {evalRecord.improvement_suggestions.map((sug, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={[styles.numberCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                            <Text style={[styles.numberCircleText, { color: '#3B82F6' }]}>{i + 1}</Text>
                          </View>
                          <Text style={[styles.bulletText, { color: textPrimary }]}>{sug}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* UPSC Disclaimer */}
                  <View style={[styles.disclaimerBox, { backgroundColor: isDark ? '#141C28' : '#F8FAFC', borderColor: cardBorder }]}>
                    <ShieldAlert size={16} color={textMuted} />
                    <Text style={[styles.disclaimerText, { color: textMuted }]}>{evalRecord.disclaimer}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'student_answer' && (
            <View style={styles.sectionContainer}>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.cardHeader}>
                  <PenTool size={18} color={accent} />
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>
                    Submitted Answer ({submission.submission_mode === 'handwritten' ? 'Handwritten Upload' : 'Typed Answer'})
                  </Text>
                </View>

                {submission.submission_mode === 'handwritten' ? (
                  <View style={styles.handwrittenViewWrap}>
                    <Text style={[styles.handwrittenNotice, { color: textSecondary }]}>
                      {submission.attachments.length} handwritten sheet(s) uploaded:
                    </Text>

                    <View style={styles.pagesGrid}>
                      {submission.attachments.map((att, i) => (
                        <TouchableOpacity
                          key={att.id || i}
                          activeOpacity={0.8}
                          onPress={() => setSelectedImagePreview(att.file_uri)}
                          style={[styles.pageThumbCard, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: cardBorder }]}>
                          <Image source={{ uri: att.file_uri }} style={styles.pageThumbImg} resizeMode="contain" />
                          <View style={styles.pageNumberBadge}>
                            <Text style={styles.pageNumberBadgeText}>Page {att.page_number || i + 1}</Text>
                            <Maximize2 size={13} color="#FFF" style={{ marginLeft: 4 }} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {submission.ocr_extracted_text && (
                      <View style={[styles.ocrBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                        <Text style={[styles.ocrBoxTitle, { color: accent }]}>Transcribed Answer (OCR):</Text>
                        <Text style={[styles.answerBodyText, { color: textPrimary }]}>
                          {submission.ocr_extracted_text}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.typedViewWrap}>
                    <View style={styles.wordCountMetaRow}>
                      <Text style={[styles.wordCountMetaText, { color: textSecondary }]}>
                        Word Count: <Text style={{ color: textPrimary, fontWeight: '700' }}>{submission.word_count}</Text> words (Limit: {question.word_limit})
                      </Text>
                    </View>
                    <Text style={[styles.answerBodyText, { color: textPrimary }]}>
                      {submission.answer_text}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'model_answer' && (
            <View style={styles.sectionContainer}>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.cardHeader}>
                  <BookOpen size={18} color={accent} />
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>UPSC Standard Model Answer</Text>
                  <View style={[styles.wordPill, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)' }]}>
                    <Text style={[styles.wordPillText, { color: accent }]}>
                      {evalRecord?.model_answer_word_count || question.word_limit} Words
                    </Text>
                  </View>
                </View>

                <View style={[styles.modelAnswerBox, { backgroundColor: isDark ? '#141C28' : '#FFFDF9' }]}>
                  <Text style={[styles.modelAnswerText, { color: textPrimary }]}>
                    {evalRecord?.model_answer || 'Model answer not available.'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Image Fullscreen Preview Modal */}
        {selectedImagePreview && (
          <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setSelectedImagePreview(null)}>
            <View style={styles.imageModalBackdrop}>
              <TouchableOpacity style={styles.imageModalCloseBtn} onPress={() => setSelectedImagePreview(null)}>
                <X size={26} color="#FFFFFF" />
              </TouchableOpacity>
              <Image source={{ uri: selectedImagePreview }} style={styles.imageModalFull} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: { flex: 1, marginRight: 16 },
  headerTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paperBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  paperBadgeText: { fontSize: 11, fontWeight: '700' },
  qNumText: { fontSize: 13, fontWeight: '600' },
  attemptBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  attemptBadgeText: { fontSize: 11, fontWeight: '600' },
  headerMainTitle: { fontSize: 16, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reattemptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  reattemptBtnText: { fontSize: 13, fontWeight: '600' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#FF9500',
  },
  tabItemText: { fontSize: 13, fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 60 },
  sectionContainer: { maxWidth: 900, alignSelf: 'center', width: '100%', gap: 16 },
  scoreHeroCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  scoreLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreNumbersRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  scoreBig: { fontSize: 36, fontWeight: '800' },
  scoreTotal: { fontSize: 20, fontWeight: '600' },
  scorePctText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  examinerPill: {
    flex: 1,
    minWidth: 260,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  examinerPillTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  examinerPillBody: { fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  marksExplanationBox: { padding: 14, borderRadius: 8, borderWidth: 1, gap: 4 },
  marksExplanationTitle: { fontSize: 12, fontWeight: '700' },
  marksExplanationText: { fontSize: 13, lineHeight: 20 },
  evaluatingCard: {
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  evaluatingTitle: { fontSize: 18, fontWeight: '700' },
  evaluatingSub: { fontSize: 14, textAlign: 'center', maxWidth: 450, lineHeight: 22 },
  card: { padding: 18, borderRadius: 12, borderWidth: 1, gap: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  wordPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  wordPillText: { fontSize: 11, fontWeight: '700' },
  parametersList: { gap: 14 },
  paramRow: { paddingTop: 10, gap: 6 },
  paramMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paramName: { fontSize: 13, fontWeight: '600' },
  paramScore: { fontSize: 13 },
  progressBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  paramFeedback: { fontSize: 12, lineHeight: 18 },
  csBlock: { gap: 8 },
  csBlockLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  csTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  csTagText: { fontSize: 12, fontWeight: '600' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 13, lineHeight: 21, flex: 1 },
  optionCard: { padding: 12, borderRadius: 8, borderWidth: 1, gap: 6, marginBottom: 8 },
  optionTitle: { fontSize: 13, fontWeight: '700' },
  proConRow: { gap: 4 },
  proText: { fontSize: 12, lineHeight: 18 },
  conText: { fontSize: 12, lineHeight: 18 },
  decisionBox: { padding: 14, borderRadius: 8, borderWidth: 1, gap: 6 },
  decisionTitle: { fontSize: 13, fontWeight: '700' },
  decisionBody: { fontSize: 13, lineHeight: 21 },
  gridRow: { flexDirection: 'row', gap: 16 },
  gridCol: { flex: 1 },
  listWrap: { gap: 8 },
  subSectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  numberCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numberCircleText: { fontSize: 11, fontWeight: '700' },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  disclaimerText: { fontSize: 11, flex: 1, lineHeight: 16 },
  handwrittenViewWrap: { gap: 14 },
  handwrittenNotice: { fontSize: 13 },
  pagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pageThumbCard: {
    width: 140,
    height: 190,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  pageThumbImg: { width: '100%', height: '100%' },
  pageNumberBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  ocrBox: { padding: 16, borderRadius: 8, borderWidth: 1, gap: 10, marginTop: 8 },
  ocrBoxTitle: { fontSize: 13, fontWeight: '700' },
  typedViewWrap: { gap: 12 },
  wordCountMetaRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  wordCountMetaText: { fontSize: 12 },
  answerBodyText: { fontSize: 14, lineHeight: 24 },
  modelAnswerBox: { padding: 16, borderRadius: 8 },
  modelAnswerText: { fontSize: 14, lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  imageModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  imageModalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  imageModalFull: { width: '92%', height: '85%' },
});
