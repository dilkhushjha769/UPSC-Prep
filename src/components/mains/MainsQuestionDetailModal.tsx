import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  Layers,
  PenTool,
  Plus,
  Users,
  X,
} from 'lucide-react-native';
import {
  MainsQuestionRecord,
  MainsSubmissionRecord,
} from '@/types/mains';
import { CommunityPost } from '@/types/community';
import { MainsService } from '@/services/mainsService';
import { CommunityService } from '@/services/communityService';
import { AnswerSheetViewerModal } from './community/AnswerSheetViewerModal';
import { PublishAnswerModal } from './community/PublishAnswerModal';

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

  // Question-specific community answers
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [selectedCommunityPost, setSelectedCommunityPost] = useState<CommunityPost | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (visible && question) {
      MainsService.getSubmissionsForQuestion(question.id).then((subs) => {
        if (!cancelled) setPreviousSubmissions(subs);
      });
      MainsService.getDraft(question.id).then((d) => {
        if (!cancelled) setHasDraft(Boolean(d && (d.answer_text.length > 0 || d.attachments.length > 0)));
      });
      CommunityService.getPostsForQuestion(question.id, question.paper_id, question.text_english).then((posts) => {
        if (!cancelled) setCommunityPosts(posts);
      });
    }
    return () => {
      cancelled = true;
    };
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
        {/* Header Bar with Back Button */}
        <View style={[styles.headerBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <View style={styles.headerLeftWrap}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              accessibilityLabel="Go back">
              <ArrowLeft size={18} color={textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <View style={styles.tagRow}>
                <View
                  style={[
                    styles.paperBadge,
                    { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)' },
                  ]}>
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
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              accessibilityLabel="Close">
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
                  <View
                    style={[
                      styles.scenarioBox,
                      { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder },
                    ]}>
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

            {/* Action Buttons (Write / Attempt Answer) */}
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

            {/* Community Answers Section - Exclusively for this Question */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.communityHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Users size={18} color={accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                      Community Answers ({communityPosts.length})
                    </Text>
                    <Text style={[styles.communitySubtitle, { color: textSecondary }]}>
                      Handwritten answer sheets from peers for Question {question.question_number}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsPublishModalOpen(true)}
                  style={[styles.publishAnswerPill, { backgroundColor: `${accent}15`, borderColor: accent }]}>
                  <Plus size={13} color={accent} />
                  <Text style={[styles.publishAnswerPillText, { color: accent }]}>Publish Yours</Text>
                </TouchableOpacity>
              </View>

              {communityPosts.length === 0 ? (
                <View style={[styles.emptyCommunityBox, { backgroundColor: isDark ? '#161F2E' : '#F8FAFC', borderColor: cardBorder }]}>
                  <FileText size={28} color={textMuted} />
                  <Text style={[styles.emptyCommunityTitle, { color: textPrimary }]}>
                    No community answers yet for Question {question.question_number}
                  </Text>
                  <Text style={[styles.emptyCommunityDesc, { color: textSecondary }]}>
                    Be the first UPSC aspirant to publish your handwritten answer sheet for this question and get peer feedback!
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setIsPublishModalOpen(true)}
                    style={[styles.emptyPublishBtn, { backgroundColor: accent }]}>
                    <Text style={styles.emptyPublishBtnText}>Publish Your Answer Sheet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.communityAnswersList}>
                  {communityPosts.map((post) => {
                    const firstAtt = post.attachments?.[0];
                    return (
                      <View
                        key={post.id}
                        style={[
                          styles.communityPostCard,
                          { backgroundColor: isDark ? '#161F2E' : '#F8FAFC', borderColor: cardBorder },
                        ]}>
                        <View style={styles.postAuthorTop}>
                          <Image
                            source={{
                              uri:
                                post.user_avatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                            }}
                            style={styles.authorImg}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.authorName, { color: textPrimary }]}>{post.user_name}</Text>
                              {post.user_badge && (
                                <View style={[styles.badgeTag, { backgroundColor: `${accent}15` }]}>
                                  <Text style={[styles.badgeTagText, { color: accent }]}>{post.user_badge}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.authorSub, { color: textMuted }]}>
                              {new Date(post.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              • {post.attachments.length} {post.attachments.length === 1 ? 'Page' : 'Pages'}
                            </Text>
                          </View>
                        </View>

                        {/* Handwritten Sheet Preview Thumbnail */}
                        {firstAtt?.file_uri && (
                          <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={() => setSelectedCommunityPost(post)}
                            style={[styles.thumbnailBox, { borderColor: cardBorder }]}>
                            <Image source={{ uri: firstAtt.file_uri }} style={styles.thumbnailImg} />
                            <View style={styles.thumbnailBadgeRow}>
                              <View style={styles.pagesPill}>
                                <Layers size={11} color="#FFFFFF" />
                                <Text style={styles.pagesPillText}>
                                  {post.attachments.length} {post.attachments.length === 1 ? 'Page' : 'Pages'}
                                </Text>
                              </View>
                              <View style={[styles.viewPill, { backgroundColor: accent }]}>
                                <Eye size={11} color="#FFFFFF" />
                                <Text style={styles.viewPillText}>Inspect Sheet</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}

                        {post.approach_note ? (
                          <Text style={[styles.strategyNote, { color: textSecondary }]} numberOfLines={2}>
                            <Text style={{ fontWeight: '700', color: textPrimary }}>Aspirant&apos;s Approach: </Text>
                            {post.approach_note}
                          </Text>
                        ) : null}

                        <View style={[styles.postBottomRow, { borderTopColor: cardBorder }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <Text style={[styles.postStat, { color: textSecondary }]}>
                              ❤️ {post.likes_count}
                            </Text>
                            <Text style={[styles.postStat, { color: textSecondary }]}>
                              💬 {post.comments_count} Feedback
                            </Text>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setSelectedCommunityPost(post)}
                            style={styles.inspectBtn}>
                            <Text style={[styles.inspectBtnText, { color: accent }]}>
                              Read Full Answer →
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Answer Sheet Viewer Modal */}
        <AnswerSheetViewerModal
          post={selectedCommunityPost}
          isOpen={!!selectedCommunityPost}
          onClose={() => setSelectedCommunityPost(null)}
          isDark={isDark}
          onPostUpdated={(updated) => {
            setCommunityPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setSelectedCommunityPost(updated);
          }}
        />

        {/* Publish Answer Sheet Modal */}
        <PublishAnswerModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          isDark={isDark}
          onPostCreated={(newPost) => {
            setCommunityPosts((prev) => [newPost, ...prev]);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { flex: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paperBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  paperBadgeText: { fontSize: 11, fontWeight: '700' },
  paperYearText: { fontSize: 12, fontWeight: '600' },
  headerMainTitle: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  card: { padding: 18, borderRadius: 14, borderWidth: 1, gap: 14 },
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
  cardHeaderTitle: { fontSize: 14.5, fontWeight: '800' },
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
  actionButtonsRow: { marginTop: 4 },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 10,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  communityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  communitySubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  publishAnswerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  publishAnswerPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyCommunityBox: {
    padding: 22,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCommunityTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCommunityDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyPublishBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyPublishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  communityAnswersList: {
    gap: 12,
  },
  communityPostCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  postAuthorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  authorSub: {
    fontSize: 10.5,
  },
  thumbnailBox: {
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailBadgeRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  pagesPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  viewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  viewPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  strategyNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  postBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  postStat: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  inspectBtn: {
    paddingVertical: 2,
  },
  inspectBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
