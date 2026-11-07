import { CommunityService } from '@/services/communityService';
import {
  ExchangeStatus,
  ExchangeSubmission,
  PeerEvaluationRecord,
  PeerReviewExchangeRequest
} from '@/types/community';
import { MainsAttachmentRecord } from '@/types/mains';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeftRight,
  Award,
  CheckCircle2,
  Eye,
  FileCheck,
  Plus,
  Upload,
  Users
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface PeerReviewExchangeTabProps {
  exchanges: PeerReviewExchangeRequest[];
  isLoading: boolean;
  onRefresh: () => void;
  onRequestCreateExchange: () => void;
  onOpenEvaluation: (
    exchange: PeerReviewExchangeRequest,
    targetSubmission: ExchangeSubmission
  ) => void;
  isDark: boolean;
}

const EXCHANGE_TYPE_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Types' },
  { id: 'mutual', label: 'Mutual Exchanges' },
  { id: 'review_only', label: 'Review Only' },
  { id: 'open_review', label: 'Open Review' },
];

export function PeerReviewExchangeTab({
  exchanges,
  isLoading,
  onRefresh,
  onRequestCreateExchange,
  onOpenEvaluation,
  isDark,
}: PeerReviewExchangeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'my_exchanges'>('opportunities');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);

  // Feedback modal view
  const [viewingEvaluation, setViewingEvaluation] = useState<PeerEvaluationRecord | null>(null);

  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  const myUserId = 'user_local_aspirant';

  // Opportunities = requests waiting for a partner (excluding my own)
  const opportunities = useMemo(() => {
    return exchanges.filter((e) => {
      const isWaiting = e.status === 'waiting_for_partner';
      const isNotMine = e.creator_user_id !== myUserId;
      const matchesType = typeFilter === 'ALL' || e.exchange_type === typeFilter;
      return isWaiting && isNotMine && matchesType;
    });
  }, [exchanges, typeFilter]);

  // My Exchanges = where I am either the creator or the accepted partner
  const myExchanges = useMemo(() => {
    return exchanges.filter(
      (e) => e.creator_user_id === myUserId || e.partner_user_id === myUserId
    );
  }, [exchanges]);

  const handleAcceptExchange = async (exchange: PeerReviewExchangeRequest) => {
    if (exchange.creator_user_id === myUserId) {
      Alert.alert('Notice', 'You cannot accept your own exchange request.');
      return;
    }

    Alert.alert(
      'Accept Review Exchange',
      `Accept exchange for ${exchange.paper_id}: "${exchange.topic}"?\n\n${exchange.exchange_type === 'mutual'
        ? 'This is a Mutual Exchange. You will also submit your answer sheet and review each other.'
        : 'You will review their answer sheet and provide feedback.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setIsAcceptingId(exchange.id);
            try {
              await CommunityService.acceptExchangeRequest(exchange.id);
              Alert.alert(
                'Exchange Accepted!',
                exchange.exchange_type === 'mutual'
                  ? 'Please upload your answer sheet to activate mutual evaluations.'
                  : 'You can now evaluate your peer\'s answer sheet.'
              );
              onRefresh();
              setActiveSubTab('my_exchanges');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not accept exchange.');
            } finally {
              setIsAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const handleUploadPartnerAnswer = async (exchange: PeerReviewExchangeRequest) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access to select your answer sheet.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets) {
        const atts: MainsAttachmentRecord[] = result.assets.map((asset, idx) => ({
          id: `att_partner_${Date.now()}_${idx}`,
          file_uri: asset.uri,
          file_name: `My_Answer_Page_${idx + 1}.jpg`,
          file_type: 'image/jpeg',
          page_number: idx + 1,
        }));

        await CommunityService.submitPartnerAnswer(exchange.id, {
          attachments: atts,
        });

        Alert.alert(
          'Answer Sheet Uploaded!',
          'Both answer sheets are now locked in. You and your partner can now evaluate each other!'
        );
        onRefresh();
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to submit answer.');
    }
  };

  const getStatusBadge = (status: ExchangeStatus) => {
    switch (status) {
      case 'waiting_for_partner':
        return { label: 'Waiting for Partner', color: '#F59E0B', bg: '#FEF3C7' };
      case 'partner_accepted':
      case 'waiting_for_second_answer':
        return { label: 'Waiting for 2nd Answer', color: '#3B82F6', bg: '#EFF6FF' };
      case 'review_pending':
        return { label: 'Review Pending', color: '#8B5CF6', bg: '#F5F3FF' };
      case 'one_review_completed':
        return { label: '1 Review Done', color: '#FF9500', bg: '#FFF7ED' };
      case 'completed':
        return { label: 'Exchange Completed', color: '#10B981', bg: '#ECFDF5' };
      default:
        return { label: status, color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner & Sub-Tabs */}
      <View style={[styles.topBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={styles.subTabRow}>
          <TouchableOpacity
            onPress={() => setActiveSubTab('opportunities')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'opportunities' && [styles.subTabBtnActive, { borderBottomColor: accent }],
            ]}>
            <Text
              style={[
                styles.subTabText,
                { color: activeSubTab === 'opportunities' ? accent : textSecondary },
                activeSubTab === 'opportunities' && { fontWeight: '800' },
              ]}>
              Available Opportunities ({opportunities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('my_exchanges')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'my_exchanges' && [styles.subTabBtnActive, { borderBottomColor: accent }],
            ]}>
            <Text
              style={[
                styles.subTabText,
                { color: activeSubTab === 'my_exchanges' ? accent : textSecondary },
                activeSubTab === 'my_exchanges' && { fontWeight: '800' },
              ]}>
              My Active Exchanges ({myExchanges.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeSubTab === 'opportunities' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilterRow}>
            {EXCHANGE_TYPE_FILTERS.map((f) => {
              const isSelected = f.id === typeFilter;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setTypeFilter(f.id)}
                  style={[
                    styles.typePill,
                    { borderColor: isSelected ? accent : border },
                    isSelected && { backgroundColor: `${accent}15` },
                  ]}>
                  <Text
                    style={[
                      styles.typePillText,
                      { color: isSelected ? accent : textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={accent} />}>
        {/* OPPORTUNITIES TAB */}
        {activeSubTab === 'opportunities' && (
          <>
            {/* Create CTA Card */}
            <View style={[styles.ctaBanner, { backgroundColor: `${accent}10`, borderColor: `${accent}30` }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.ctaBannerTitle, { color: textPrimary }]}>
                  Want your answer sheet reviewed?
                </Text>
                <Text style={[styles.ctaBannerDesc, { color: textSecondary }]}>
                  Post a mutual answer exchange to swap answer sheets with a serious UPSC peer.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRequestCreateExchange}
                style={[styles.createBtn, { backgroundColor: accent }]}>
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.createBtnText}>New Request</Text>
              </TouchableOpacity>
            </View>

            {opportunities.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
                <Users size={36} color={textMuted} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  No review requests waiting
                </Text>
                <Text style={[styles.emptyDesc, { color: textSecondary }]}>
                  All current exchange opportunities have been claimed. Post a new request to invite peers!
                </Text>
                <TouchableOpacity
                  onPress={onRequestCreateExchange}
                  style={[styles.emptyActionBtn, { backgroundColor: accent }]}>
                  <Text style={styles.emptyActionText}>Create Review Request</Text>
                </TouchableOpacity>
              </View>
            ) : (
              opportunities.map((req) => {
                const isAccepting = isAcceptingId === req.id;

                return (
                  <View
                    key={req.id}
                    style={[styles.exchangeCard, { backgroundColor: surface, borderColor: border }]}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <Image
                        source={{
                          uri:
                            req.creator_user_avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                        }}
                        style={styles.creatorAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.creatorName, { color: textPrimary }]}>
                            {req.creator_user_name}
                          </Text>
                          <View style={[styles.repPill, { backgroundColor: '#10B98115' }]}>
                            <Award size={10} color="#10B981" />
                            <Text style={styles.repPillText}>
                              {req.creator_reputation_score || 85} Rep
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.metaSub, { color: textMuted }]}>
                          {req.paper_id} • {req.question_marks}M • Deadline {req.deadline_hours}h
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.exchangeTypeTag,
                          {
                            backgroundColor:
                              req.exchange_type === 'mutual' ? `${accent}15` : '#3B82F615',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.exchangeTypeTagText,
                            { color: req.exchange_type === 'mutual' ? accent : '#3B82F6' },
                          ]}>
                          {req.exchange_type === 'mutual' ? 'Mutual Exchange' : 'Review Only'}
                        </Text>
                      </View>
                    </View>

                    {/* Question snippet */}
                    <View style={styles.questionBox}>
                      <Text style={[styles.questionTopic, { color: textPrimary }]}>{req.topic}</Text>
                      <Text style={[styles.questionText, { color: textSecondary }]} numberOfLines={3}>
                        {req.question_text}
                      </Text>
                    </View>

                    {/* Submission Attachment Info */}
                    <View style={[styles.submissionInfoRow, { backgroundColor: surfaceSubtle }]}>
                      <FileCheck size={14} color="#10B981" />
                      <Text style={[styles.submissionInfoText, { color: textSecondary }]}>
                        Handwritten Sheet Attached ({req.creator_submission?.attachments?.length || 1}{' '}
                        {req.creator_submission?.attachments?.length === 1 ? 'Page' : 'Pages'})
                      </Text>
                    </View>

                    {/* Partner Requirements */}
                    {req.partner_requirements ? (
                      <Text style={[styles.partnerReq, { color: textMuted }]}>
                        <Text style={{ fontWeight: '700', color: textSecondary }}>Note: </Text>
                        {req.partner_requirements}
                      </Text>
                    ) : null}

                    {/* Accept Action */}
                    <TouchableOpacity
                      disabled={isAccepting}
                      onPress={() => handleAcceptExchange(req)}
                      style={[styles.acceptBtn, { backgroundColor: accent }, isAccepting && { opacity: 0.6 }]}>
                      {isAccepting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.acceptBtnText}>
                          {req.exchange_type === 'mutual' ? 'Accept & Swap Answers' : 'Accept Review'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* MY EXCHANGES TAB */}
        {activeSubTab === 'my_exchanges' && (
          <>
            {myExchanges.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
                <ArrowLeftRight size={36} color={textMuted} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No active exchanges</Text>
                <Text style={[styles.emptyDesc, { color: textSecondary }]}>
                  You haven&apos;t created or accepted any peer review exchanges yet. Explore available opportunities!
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveSubTab('opportunities')}
                  style={[styles.emptyActionBtn, { backgroundColor: accent }]}>
                  <Text style={styles.emptyActionText}>Browse Opportunities</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myExchanges.map((req) => {
                const isCreator = req.creator_user_id === myUserId;
                const statusMeta = getStatusBadge(req.status);

                const hasPartnerAnswer = !!req.partner_submission;
                const needMyAnswer = !isCreator && !hasPartnerAnswer && req.exchange_type === 'mutual';

                // Determine if I have pending review to complete
                const iAmReviewing = isCreator ? req.partner_submission : req.creator_submission;
                const myReviewDone = isCreator
                  ? !!req.creator_review_of_partner
                  : !!req.partner_review_of_creator;
                const canIReviewNow =
                  (req.status === 'review_pending' || req.status === 'one_review_completed') &&
                  !myReviewDone &&
                  iAmReviewing;

                // Received review on my answer
                const reviewOfMyAnswer = isCreator
                  ? req.partner_review_of_creator
                  : req.creator_review_of_partner;

                return (
                  <View
                    key={req.id}
                    style={[styles.myExchangeCard, { backgroundColor: surface, borderColor: border }]}>
                    <View style={styles.myExchangeTopRow}>
                      <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                          {statusMeta.label}
                        </Text>
                      </View>
                      <Text style={[styles.paperIdText, { color: textMuted }]}>
                        {req.paper_id} • {req.question_marks} Marks
                      </Text>
                    </View>

                    <Text style={[styles.myExchangeTitle, { color: textPrimary }]}>{req.topic}</Text>
                    <Text style={[styles.myExchangeQuestion, { color: textSecondary }]} numberOfLines={2}>
                      {req.question_text}
                    </Text>

                    {/* Partner Info */}
                    <View style={[styles.partnerRow, { backgroundColor: surfaceSubtle }]}>
                      <Text style={[styles.partnerLabel, { color: textMuted }]}>
                        {isCreator ? 'Partner: ' : 'Created by: '}
                      </Text>
                      <Text style={[styles.partnerName, { color: textPrimary }]}>
                        {isCreator
                          ? req.partner_user_name || 'Waiting for partner to join...'
                          : req.creator_user_name}
                      </Text>
                    </View>

                    {/* Action Rows based on state */}
                    <View style={styles.myExchangeActions}>
                      {needMyAnswer && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleUploadPartnerAnswer(req)}
                          style={[styles.actionBtnPrimary, { backgroundColor: accent }]}>
                          <Upload size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnPrimaryText}>Upload Your Answer Sheet</Text>
                        </TouchableOpacity>
                      )}

                      {canIReviewNow && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => onOpenEvaluation(req, iAmReviewing!)}
                          style={[styles.actionBtnPrimary, { backgroundColor: '#8B5CF6' }]}>
                          <CheckCircle2 size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnPrimaryText}>
                            Evaluate {iAmReviewing?.user_name}&apos;s Answer
                          </Text>
                        </TouchableOpacity>
                      )}

                      {reviewOfMyAnswer && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setViewingEvaluation(reviewOfMyAnswer)}
                          style={[styles.actionBtnSecondary, { borderColor: border }]}>
                          <Eye size={14} color={textPrimary} />
                          <Text style={[styles.actionBtnSecondaryText, { color: textPrimary }]}>
                            View Received Feedback ({reviewOfMyAnswer.total_score.toFixed(1)}/
                            {reviewOfMyAnswer.max_score}M)
                          </Text>
                        </TouchableOpacity>
                      )}

                      {req.status === 'completed' && (
                        <View style={styles.completedBadgeRow}>
                          <CheckCircle2 size={16} color="#10B981" />
                          <Text style={styles.completedBadgeText}>
                            Both peer reviews finished! Exchange Complete.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Received Feedback Report Modal */}
      {viewingEvaluation && (
        <View style={[styles.evalReportOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.evalReportCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.evalReportHeader}>
              <View>
                <Text style={[styles.evalReportTitle, { color: textPrimary }]}>
                  Peer Review Evaluation
                </Text>
                <Text style={[styles.evalReportSub, { color: textSecondary }]}>
                  Evaluated by {viewingEvaluation.reviewer_user_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setViewingEvaluation(null)}
                style={styles.closeEvalBtn}>
                <Text style={{ color: textPrimary, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
              <View style={[styles.scoreBox, { backgroundColor: `${accent}15`, borderColor: accent }]}>
                <Text style={[styles.scoreBoxLabel, { color: accent }]}>Awarded Peer Score</Text>
                <Text style={[styles.scoreBoxVal, { color: accent }]}>
                  {viewingEvaluation.total_score.toFixed(1)} / {viewingEvaluation.max_score} Marks
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { color: textPrimary }]}>Rubric Breakdown</Text>
              {viewingEvaluation.scores.map((sc, i) => (
                <View key={i} style={[styles.evalRow, { borderBottomColor: border }]}>
                  <Text style={[styles.evalRowLabel, { color: textPrimary }]}>{sc.criteria_name}</Text>
                  <Text style={[styles.evalRowVal, { color: accent }]}>
                    {sc.marks_awarded.toFixed(1)} / {sc.max_marks}M
                  </Text>
                </View>
              ))}

              <Text style={[styles.sectionHeading, { color: textPrimary }]}>Examiner Remarks</Text>
              <Text style={[styles.evalRemarkText, { color: textSecondary }]}>
                {viewingEvaluation.overall_feedback}
              </Text>

              {viewingEvaluation.strengths.length > 0 && (
                <>
                  <Text style={[styles.sectionHeading, { color: '#10B981' }]}>Strengths</Text>
                  {viewingEvaluation.strengths.map((str, idx) => (
                    <Text key={idx} style={[styles.bullet, { color: textPrimary }]}>
                      ✓ {str}
                    </Text>
                  ))}
                </>
              )}

              {viewingEvaluation.missing_points.length > 0 && (
                <>
                  <Text style={[styles.sectionHeading, { color: accent }]}>
                    Missing Points & Recommended Citations
                  </Text>
                  {viewingEvaluation.missing_points.map((mp, idx) => (
                    <Text key={idx} style={[styles.bullet, { color: textPrimary }]}>
                      • {mp}
                    </Text>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 18,
  },
  subTabBtn: {
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {},
  subTabText: {
    fontSize: 13,
  },
  typeFilterRow: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  typePillText: {
    fontSize: 11.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  ctaBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  ctaBannerDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  exchangeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  creatorName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  repPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  repPillText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
  },
  metaSub: {
    fontSize: 11,
    marginTop: 1,
  },
  exchangeTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exchangeTypeTagText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  questionBox: {
    gap: 3,
  },
  questionTopic: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 12.5,
    lineHeight: 17.5,
  },
  submissionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  submissionInfoText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  partnerReq: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  acceptBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  myExchangeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  myExchangeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  paperIdText: {
    fontSize: 11,
    fontWeight: '600',
  },
  myExchangeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  myExchangeQuestion: {
    fontSize: 12,
    lineHeight: 16,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  partnerLabel: {
    fontSize: 11.5,
  },
  partnerName: {
    fontSize: 12,
    fontWeight: '700',
  },
  myExchangeActions: {
    marginTop: 4,
    gap: 8,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontWeight: '700',
    fontSize: 12,
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  completedBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  evalReportOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 16,
  },
  evalReportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  evalReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  evalReportTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  evalReportSub: {
    fontSize: 12,
  },
  closeEvalBtn: {
    padding: 6,
  },
  scoreBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  scoreBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scoreBoxVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  evalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  evalRowLabel: {
    fontSize: 12,
  },
  evalRowVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  evalRemarkText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 17,
  },
});

