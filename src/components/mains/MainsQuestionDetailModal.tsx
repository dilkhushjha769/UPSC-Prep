import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  ChevronRight,
  Globe,
  PenTool,
  X,
} from 'lucide-react-native';
import {
  MainsQuestionRecord,
  MainsSubmissionRecord,
} from '@/types/mains';
import { MainsService } from '@/services/mainsService';

interface MainsQuestionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  question: MainsQuestionRecord | null;
  onStartWriting: (question: MainsQuestionRecord) => void;
  onViewEvaluation: (submission: MainsSubmissionRecord) => void;
  isDark: boolean;
}

export function MainsQuestionDetailModal({
  visible,
  onClose,
  question,
  onStartWriting,
  onViewEvaluation,
  isDark,
}: MainsQuestionDetailModalProps) {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [previousSubmissions, setPreviousSubmissions] = useState<MainsSubmissionRecord[]>([]);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (visible && question) {
      MainsService.getSubmissionsForQuestion(question.id).then((subs) => {
        setPreviousSubmissions(subs);
      });
      MainsService.getDraft(question.id).then((d) => {
        setHasDraft(Boolean(d && (d.answer_text.length > 0 || d.attachments.length > 0)));
      });
    }
  }, [visible, question]);

  if (!visible || !question) return null;

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const cardBg = isDark ? '#141C28' : '#FFFFFF';
  const cardBorder = isDark ? '#253244' : '#EAE5DC';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#9DA8B9' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#F58235';

  const isCaseStudy = question.is_case_study;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: bg }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.tagRow}>
              <View style={[styles.paperBadge, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)' }]}>
                <Text style={[styles.paperBadgeText, { color: accent }]}>{question.paper_id}</Text>
              </View>
              <Text style={[styles.paperYearText, { color: textSecondary }]}>
                {question.year} • {question.section_name}
              </Text>
            </View>
            <Text style={[styles.headerMainTitle, { color: textPrimary }]}>
              Question {question.question_number}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {question.text_hindi ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                style={[styles.langToggleBtn, { borderColor: cardBorder }]}>
                <Globe size={13} color={accent} />
                <Text style={[styles.langToggleBtnText, { color: textPrimary }]}>
                  {language === 'en' ? 'हिंदी' : 'English'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <X size={18} color={textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Metadata Badges Bar */}
            <View style={[styles.metaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: textSecondary }]}>Marks</Text>
                  <Text style={[styles.metaVal, { color: textPrimary }]}>{question.marks} Marks</Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: textSecondary }]}>Word Limit</Text>
                  <Text style={[styles.metaVal, { color: textPrimary }]}>{question.word_limit} Words</Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: textSecondary }]}>Subject Area</Text>
                  <Text style={[styles.metaVal, { color: textPrimary }]} numberOfLines={1}>
                    {question.subject_area}
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: textSecondary }]}>Topic</Text>
                  <Text style={[styles.metaVal, { color: textPrimary }]} numberOfLines={1}>
                    {question.topic}
                  </Text>
                </View>
              </View>
            </View>

            {/* Question Text Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {question.title && (
                <View style={styles.titleWrap}>
                  <Text style={[styles.questionTitleText, { color: accent }]}>{question.title}</Text>
                </View>
              )}

              {isCaseStudy ? (
                <View style={styles.caseStudyContainer}>
                  <View style={[styles.scenarioBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                    <Text style={[styles.scenarioLabel, { color: textSecondary }]}>Case Scenario:</Text>
                    <Text style={[styles.questionBodyText, { color: textPrimary }]}>
                      {language === 'hi' && question.scenario_hindi
                        ? question.scenario_hindi
                        : question.scenario_english || question.text_english}
                    </Text>
                  </View>

                  {question.sub_questions && question.sub_questions.length > 0 && (
                    <View style={styles.subQuestionsBox}>
                      <Text style={[styles.subQuestionsLabel, { color: textSecondary }]}>Sub-Questions to Address:</Text>
                      {question.sub_questions.map((subQ, idx) => (
                        <View key={idx} style={styles.subQRow}>
                          <Text style={[styles.subQNum, { color: accent }]}>({String.fromCharCode(97 + idx)})</Text>
                          <Text style={[styles.subQText, { color: textPrimary }]}>{subQ}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.standardQContainer}>
                  <Text style={[styles.questionBodyText, { color: textPrimary }]}>
                    {language === 'hi' && question.text_hindi ? question.text_hindi : question.text_english}
                  </Text>
                </View>
              )}
            </View>

            {/* Previous Attempts Section */}
            {previousSubmissions.length > 0 && (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.cardHeaderRow}>
                  <Award size={16} color={accent} />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Previous Attempts ({previousSubmissions.length})
                  </Text>
                </View>

                <View style={styles.prevSubsList}>
                  {previousSubmissions.map((sub) => {
                    const marks = sub.marks_awarded;
                    const marksPct = marks !== undefined ? (marks / sub.max_marks) * 100 : 0;
                    const marksColor = marksPct >= 55 ? '#10B981' : marksPct >= 45 ? '#F59E0B' : '#EF4444';

                    return (
                      <TouchableOpacity
                        key={sub.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          onClose();
                          onViewEvaluation(sub);
                        }}
                        style={[styles.prevSubItem, { backgroundColor: isDark ? '#1A2333' : '#F8FAFC', borderColor: cardBorder }]}>
                        <View style={styles.prevSubLeft}>
                          <Text style={[styles.attemptNumberText, { color: textPrimary }]}>
                            Attempt #{sub.attempt_number}
                          </Text>
                          <Text style={[styles.subDateText, { color: textMuted }]}>
                            {new Date(sub.submitted_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })} • {sub.submission_mode === 'handwritten' ? 'Handwritten' : `${sub.word_count}w typed`}
                          </Text>
                        </View>

                        <View style={styles.prevSubRight}>
                          {marks !== undefined ? (
                            <View style={styles.marksBadge}>
                              <Text style={[styles.marksValue, { color: marksColor }]}>{marks}</Text>
                              <Text style={[styles.marksMax, { color: textMuted }]}> / {sub.max_marks}</Text>
                            </View>
                          ) : (
                            <Text style={[styles.evaluatingText, { color: accent }]}>Evaluating...</Text>
                          )}
                          <ChevronRight size={16} color={textSecondary} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onStartWriting(question);
                }}
                style={[styles.primaryActionBtn, { backgroundColor: accent }]}>
                <PenTool size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>
                  {hasDraft ? 'Resume Saved Draft' : previousSubmissions.length > 0 ? 'Attempt Question Again' : 'Write / Attempt Answer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paperBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  paperBadgeText: { fontSize: 11, fontWeight: '700' },
  paperYearText: { fontSize: 12, fontWeight: '600' },
  headerMainTitle: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  langToggleBtnText: { fontSize: 12, fontWeight: '600' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 60 },
  contentContainer: { maxWidth: 860, alignSelf: 'center', width: '100%', gap: 16 },
  metaCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  metaItem: { flex: 1, minWidth: 100, alignItems: 'center' },
  metaLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  metaVal: { fontSize: 13, fontWeight: '700' },
  metaDivider: { width: 1, height: 24, backgroundColor: 'rgba(150,150,150,0.2)' },
  card: { padding: 20, borderRadius: 12, borderWidth: 1, gap: 14 },
  titleWrap: { marginBottom: 4 },
  questionTitleText: { fontSize: 16, fontWeight: '700' },
  caseStudyContainer: { gap: 14 },
  scenarioBox: { padding: 16, borderRadius: 8, borderWidth: 1, gap: 8 },
  scenarioLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  questionBodyText: { fontSize: 15, lineHeight: 26 },
  subQuestionsBox: { gap: 10, marginTop: 4 },
  subQuestionsLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  subQRow: { flexDirection: 'row', gap: 8 },
  subQNum: { fontSize: 14, fontWeight: '700' },
  subQText: { fontSize: 14, flex: 1, lineHeight: 22 },
  standardQContainer: {},
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderTitle: { fontSize: 14, fontWeight: '700' },
  prevSubsList: { gap: 8 },
  prevSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  prevSubLeft: { gap: 2 },
  attemptNumberText: { fontSize: 13, fontWeight: '700' },
  subDateText: { fontSize: 11 },
  prevSubRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marksBadge: { flexDirection: 'row', alignItems: 'baseline' },
  marksValue: { fontSize: 15, fontWeight: '800' },
  marksMax: { fontSize: 11 },
  evaluatingText: { fontSize: 12, fontWeight: '600' },
  actionButtonsRow: { marginTop: 8 },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 10,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
