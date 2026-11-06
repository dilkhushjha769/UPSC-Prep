import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import {
  CriteriaScore,
  ExchangeSubmission,
  PeerReviewExchangeRequest,
} from '@/types/community';
import { CommunityService } from '@/services/communityService';

interface PeerEvaluationModalProps {
  exchange: PeerReviewExchangeRequest | null;
  targetSubmission: ExchangeSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onReviewSubmitted: (updatedExchange: PeerReviewExchangeRequest) => void;
}

export function PeerEvaluationModal({
  exchange,
  targetSubmission,
  isOpen,
  onClose,
  isDark,
  onReviewSubmitted,
}: PeerEvaluationModalProps) {
  const isCaseStudy =
    exchange?.paper_id === 'GS4' &&
    (exchange.question_marks >= 20 ||
      exchange.topic.toLowerCase().includes('case') ||
      exchange.question_text.toLowerCase().includes('you are'));

  // Default criteria breakdown based on question marks
  const totalMarks = exchange?.question_marks || 10;

  // Initialize Rubric Criteria
  const defaultCriteria = useMemo<CriteriaScore[]>(() => {
    if (totalMarks === 10) {
      return [
        { criteria_name: 'Introduction & Core Concept', marks_awarded: 1, max_marks: 1.5 },
        { criteria_name: 'Understanding of Question & Direct Address', marks_awarded: 1.5, max_marks: 2 },
        { criteria_name: 'Content Relevance & Arguments', marks_awarded: 1.5, max_marks: 2 },
        { criteria_name: 'Analysis & Multiple Dimensions', marks_awarded: 1.5, max_marks: 2 },
        { criteria_name: 'Examples, Cases & Committee References', marks_awarded: 1, max_marks: 1 },
        { criteria_name: 'Conclusion & Presentation Quality', marks_awarded: 1, max_marks: 1.5 },
      ];
    } else if (totalMarks === 15) {
      return [
        { criteria_name: 'Introduction & Contextualization', marks_awarded: 1.5, max_marks: 2 },
        { criteria_name: 'Demand of the Question & Direct Address', marks_awarded: 2.5, max_marks: 3 },
        { criteria_name: 'Content Depth & Analytical Substance', marks_awarded: 2.5, max_marks: 3 },
        { criteria_name: 'Multi-dimensional Coverage (PESTLE)', marks_awarded: 2.5, max_marks: 3 },
        { criteria_name: 'Constitutional Provisions & Examples', marks_awarded: 1.5, max_marks: 2 },
        { criteria_name: 'Conclusion, Forward Path & Structure', marks_awarded: 1.5, max_marks: 2 },
      ];
    } else {
      // 20 Marks (Standard Case Study)
      return [
        { criteria_name: 'Stakeholder Matrix & Issue Identification', marks_awarded: 3, max_marks: 4 },
        { criteria_name: 'Ethical Dilemmas & Values Involved', marks_awarded: 2.5, max_marks: 3.5 },
        { criteria_name: 'Evaluation of Alternative Options', marks_awarded: 3, max_marks: 4 },
        { criteria_name: 'Application of Ethical & Legal Principles', marks_awarded: 2.5, max_marks: 3.5 },
        { criteria_name: 'Administrative Feasibility & Practicality', marks_awarded: 2.5, max_marks: 3 },
        { criteria_name: 'Final Decision, Justification & Action Plan', marks_awarded: 1.5, max_marks: 2 },
      ];
    }
  }, [totalMarks]);

  const [criteriaScores, setCriteriaScores] = useState<CriteriaScore[]>(defaultCriteria);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Qualitative Feedback
  const [strengths, setStrengths] = useState<string[]>([
    'Good handwriting clarity and appropriate margins.',
  ]);
  const [newStrength, setNewStrength] = useState('');

  const [weaknesses, setWeaknesses] = useState<string[]>([
    'Could incorporate more specific constitutional articles or committee reports.',
  ]);
  const [newWeakness, setNewWeakness] = useState('');

  const [missingPoints, setMissingPoints] = useState<string[]>([
    'Reference to Nolan Committee principles on Public Life.',
  ]);
  const [newMissingPoint, setNewMissingPoint] = useState('');

  const [pageComments, setPageComments] = useState<{ page_number: number; note: string }[]>([]);
  const [currentPageNote, setCurrentPageNote] = useState('');

  const [overallFeedback, setOverallFeedback] = useState(
    'A commendable attempt. Structuring with bullet points helped readability. Elevate with more concrete administrative precedents.'
  );

  // AI Assistance
  const [isGettingAI, setIsGettingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    suggestedStrengths: string[];
    suggestedWeaknesses: string[];
    suggestedMissingPoints: string[];
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalEvaluatedMarks = useMemo(() => {
    return criteriaScores.reduce((sum, c) => sum + (c.marks_awarded || 0), 0);
  }, [criteriaScores]);

  if (!exchange || !targetSubmission) return null;

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#F58235';

  const attachments = targetSubmission.attachments || [];
  const currentAttachment = attachments[currentPageIndex];

  const handleUpdateScore = (idx: number, delta: number) => {
    setCriteriaScores((prev) => {
      const updated = [...prev];
      const curr = updated[idx];
      const newScore = Math.max(0, Math.min(curr.max_marks, curr.marks_awarded + delta));
      updated[idx] = { ...curr, marks_awarded: Math.round(newScore * 10) / 10 };
      return updated;
    });
  };

  const handleFetchAISuggestions = async () => {
    setIsGettingAI(true);
    try {
      const result = await CommunityService.getAISuggestionsForPeerReview({
        questionText: exchange.question_text,
        answerText: targetSubmission.answer_text,
        isCaseStudy,
        marks: totalMarks,
      });
      setAiSuggestions(result);
    } catch {
      Alert.alert('AI Helper Notice', 'Could not generate recommendations right now.');
    } finally {
      setIsGettingAI(false);
    }
  };

  const handleAddPageComment = () => {
    if (!currentPageNote.trim()) return;
    setPageComments((prev) => [
      ...prev,
      { page_number: currentPageIndex + 1, note: currentPageNote.trim() },
    ]);
    setCurrentPageNote('');
  };

  const handleSubmitReview = async () => {
    if (!overallFeedback.trim()) {
      Alert.alert('Feedback Required', 'Please provide overall evaluation remarks for your peer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await CommunityService.submitPeerEvaluation({
        exchangeId: exchange.id,
        targetSubmissionId: targetSubmission.submission_id,
        scores: criteriaScores,
        isCaseStudy,
        strengths,
        weaknesses,
        missingPoints,
        pageComments,
        overallFeedback: overallFeedback.trim(),
      });

      Alert.alert(
        'Evaluation Submitted!',
        `Your peer review for ${targetSubmission.user_name} has been published successfully (+25 Reputation points awarded!).`
      );
      onReviewSubmitted(updated);
      onClose();
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>
              Evaluating {targetSubmission.user_name}&apos;s Answer
            </Text>
            <Text style={[styles.headerSub, { color: textSecondary }]}>
              {exchange.paper_id} • Question Marks: {totalMarks}M • Rubric Score:{' '}
              <Text style={{ color: accent, fontWeight: '800' }}>
                {totalEvaluatedMarks.toFixed(1)} / {totalMarks}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleSubmitReview}
            style={[styles.submitBtn, { backgroundColor: accent }, isSubmitting && { opacity: 0.6 }]}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* UPSC Peer Review Disclaimer Pill */}
          <View style={[styles.disclaimerBox, { backgroundColor: `${accent}10`, borderColor: `${accent}30` }]}>
            <AlertTriangle size={15} color={accent} />
            <Text style={[styles.disclaimerText, { color: textSecondary }]}>
              Peer evaluation represents student feedback and community perspectives to foster collaborative learning.
            </Text>
          </View>

          {/* Question Banner */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.questionMetaRow}>
              <View style={[styles.badge, { backgroundColor: `${accent}15` }]}>
                <Text style={[styles.badgeText, { color: accent }]}>{exchange.paper_id}</Text>
              </View>
              <Text style={[styles.questionTopic, { color: textSecondary }]} numberOfLines={1}>
                {exchange.topic}
              </Text>
              <Text style={[styles.questionMarksBadge, { color: textPrimary }]}>
                {exchange.question_marks} Marks ({exchange.question_word_limit} words)
              </Text>
            </View>

            <Text style={[styles.questionText, { color: textPrimary }]}>{exchange.question_text}</Text>
          </View>

          {/* Answer Sheet Viewer */}
          <View style={[styles.sheetBox, { backgroundColor: surface, borderColor: border }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: border }]}>
              <TouchableOpacity
                disabled={currentPageIndex === 0}
                onPress={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                style={[styles.navBtn, currentPageIndex === 0 && { opacity: 0.3 }]}>
                <ChevronLeft size={18} color={textPrimary} />
              </TouchableOpacity>

              <Text style={[styles.sheetTitle, { color: textPrimary }]}>
                Answer Sheet • Page {currentPageIndex + 1} of {Math.max(1, attachments.length)}
              </Text>

              <TouchableOpacity
                disabled={currentPageIndex >= attachments.length - 1}
                onPress={() => setCurrentPageIndex((p) => Math.min(attachments.length - 1, p + 1))}
                style={[styles.navBtn, currentPageIndex >= attachments.length - 1 && { opacity: 0.3 }]}>
                <ChevronRight size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {currentAttachment?.file_uri ? (
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: currentAttachment.file_uri }}
                  style={styles.sheetImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <FileText size={32} color={textMuted} />
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  {targetSubmission.answer_text
                    ? targetSubmission.answer_text
                    : 'No handwritten sheets uploaded.'}
                </Text>
              </View>
            )}

            {/* Page specific comment input */}
            <View style={[styles.pageNoteBox, { backgroundColor: surfaceSubtle, borderTopColor: border }]}>
              <TextInput
                style={[styles.pageNoteInput, { color: textPrimary }]}
                placeholder={`Add note for Page ${currentPageIndex + 1} (e.g. underline key Nolan point)...`}
                placeholderTextColor={textMuted}
                value={currentPageNote}
                onChangeText={setCurrentPageNote}
              />
              <TouchableOpacity
                onPress={handleAddPageComment}
                style={[styles.addNoteBtn, { backgroundColor: accent }]}>
                <Plus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Page Notes List */}
          {pageComments.length > 0 && (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Page-Specific Annotations ({pageComments.length})
              </Text>
              {pageComments.map((note, idx) => (
                <View key={idx} style={[styles.noteRow, { borderBottomColor: border }]}>
                  <Text style={[styles.notePageBadge, { color: accent }]}>Page {note.page_number}:</Text>
                  <Text style={[styles.noteText, { color: textPrimary }]}>{note.note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* AI Helper Card */}
          <View
            style={[
              styles.aiCard,
              { backgroundColor: isDark ? '#1E1B2E' : '#FAF5FF', borderColor: '#D8B4FE' },
            ]}>
            <View style={styles.aiHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#9333EA" />
                <Text style={styles.aiTitle}>AI Peer Review Helper</Text>
              </View>

              <TouchableOpacity
                disabled={isGettingAI}
                onPress={handleFetchAISuggestions}
                style={[styles.aiBtn, isGettingAI && { opacity: 0.6 }]}>
                {isGettingAI ? (
                  <ActivityIndicator size="small" color="#9333EA" />
                ) : (
                  <Text style={styles.aiBtnText}>Get AI Suggestions</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.aiDesc}>
              Tap to analyze the question and receive suggested missing dimensions, committee quotes, and rubric hints to assist your review.
            </Text>

            {aiSuggestions && (
              <View style={styles.aiResultsBox}>
                <Text style={styles.aiSubheading}>Recommended Missing Dimensions:</Text>
                {aiSuggestions.suggestedMissingPoints.map((mp, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      if (!missingPoints.includes(mp)) setMissingPoints((prev) => [...prev, mp]);
                    }}
                    style={styles.suggestionPill}>
                    <Plus size={12} color="#9333EA" />
                    <Text style={styles.suggestionText}>{mp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Criterion Scoring Form */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.rubricHeaderRow}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                {isCaseStudy ? 'Case Study Evaluation Rubric' : 'Structured Scoring Rubric'}
              </Text>
              <Text style={[styles.rubricTotalScore, { color: accent }]}>
                Total: {totalEvaluatedMarks.toFixed(1)} / {totalMarks}
              </Text>
            </View>

            {criteriaScores.map((c, idx) => (
              <View key={idx} style={[styles.criterionRow, { borderBottomColor: border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.criterionName, { color: textPrimary }]}>{c.criteria_name}</Text>
                  <Text style={[styles.criterionMax, { color: textSecondary }]}>
                    Weightage: {c.max_marks} Marks
                  </Text>
                </View>

                <View style={styles.scoreStepper}>
                  <TouchableOpacity
                    onPress={() => handleUpdateScore(idx, -0.5)}
                    style={[styles.stepperBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <Text style={[styles.stepperBtnText, { color: textPrimary }]}>-</Text>
                  </TouchableOpacity>

                  <Text style={[styles.stepperValue, { color: accent }]}>
                    {c.marks_awarded.toFixed(1)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleUpdateScore(idx, +0.5)}
                    style={[styles.stepperBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <Text style={[styles.stepperBtnText, { color: textPrimary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Strengths & Weaknesses */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Answer Strengths</Text>
            {strengths.map((str, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={{ color: '#10B981', fontWeight: '800' }}>✓</Text>
                <Text style={[styles.bulletText, { color: textPrimary }]}>{str}</Text>
                <TouchableOpacity
                  onPress={() => setStrengths((prev) => prev.filter((_, i) => i !== idx))}>
                  <Trash2 size={12} color={textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addInputRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="Add positive observation..."
                placeholderTextColor={textMuted}
                value={newStrength}
                onChangeText={setNewStrength}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newStrength.trim()) {
                    setStrengths((p) => [...p, newStrength.trim()]);
                    setNewStrength('');
                  }
                }}
                style={[styles.addBtn, { backgroundColor: accent }]}>
                <Plus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weaknesses & Critical Feedback */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Weaknesses & Areas to Improve</Text>
            {weaknesses.map((w, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={{ color: '#EF4444', fontWeight: '800' }}>✗</Text>
                <Text style={[styles.bulletText, { color: textPrimary }]}>{w}</Text>
                <TouchableOpacity
                  onPress={() => setWeaknesses((prev) => prev.filter((_, i) => i !== idx))}>
                  <Trash2 size={12} color={textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addInputRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="Add critical observation or weak argument..."
                placeholderTextColor={textMuted}
                value={newWeakness}
                onChangeText={setNewWeakness}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newWeakness.trim()) {
                    setWeaknesses((p) => [...p, newWeakness.trim()]);
                    setNewWeakness('');
                  }
                }}
                style={[styles.addBtn, { backgroundColor: accent }]}>
                <Plus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Missing Points & Dimensions */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Missing Points & Committee Citations
            </Text>
            {missingPoints.map((mp, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={{ color: accent, fontWeight: '800' }}>•</Text>
                <Text style={[styles.bulletText, { color: textPrimary }]}>{mp}</Text>
                <TouchableOpacity
                  onPress={() => setMissingPoints((prev) => prev.filter((_, i) => i !== idx))}>
                  <Trash2 size={12} color={textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addInputRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="Suggest missing dimension (e.g. 2nd ARC, Art 21)..."
                placeholderTextColor={textMuted}
                value={newMissingPoint}
                onChangeText={setNewMissingPoint}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newMissingPoint.trim()) {
                    setMissingPoints((p) => [...p, newMissingPoint.trim()]);
                    setNewMissingPoint('');
                  }
                }}
                style={[styles.addBtn, { backgroundColor: accent }]}>
                <Plus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Examiner's Overall Remarks */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Overall Examiner Remarks & Feedback *
            </Text>
            <TextInput
              style={[
                styles.feedbackArea,
                { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border },
              ]}
              placeholder="Provide constructive, encouraging, and actionable feedback..."
              placeholderTextColor={textMuted}
              value={overallFeedback}
              onChangeText={setOverallFeedback}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  closeBtn: {
    padding: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  questionTopic: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  questionMarksBadge: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  sheetBox: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  imageWrap: {
    width: '100%',
    height: 420,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetImage: {
    width: '100%',
    height: '100%',
  },
  emptyWrap: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  pageNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
  },
  pageNoteInput: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addNoteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  notePageBadge: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
  },
  aiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTitle: {
    color: '#9333EA',
    fontSize: 13.5,
    fontWeight: '800',
  },
  aiBtn: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiBtnText: {
    color: '#9333EA',
    fontSize: 11,
    fontWeight: '700',
  },
  aiDesc: {
    color: '#6B7280',
    fontSize: 11.5,
    lineHeight: 16,
  },
  aiResultsBox: {
    marginTop: 6,
    gap: 6,
  },
  aiSubheading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(147, 51, 234, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 11.5,
    color: '#7E22CE',
  },
  rubricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rubricTotalScore: {
    fontSize: 13,
    fontWeight: '800',
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  criterionName: {
    fontSize: 13,
    fontWeight: '700',
  },
  criterionMax: {
    fontSize: 11,
    marginTop: 2,
  },
  scoreStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  addInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackArea: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

