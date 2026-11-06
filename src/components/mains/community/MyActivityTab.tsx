import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeftRight,
  Award,
  Bookmark,
  FileText,
  Trash2,
  UserCheck,
} from 'lucide-react-native';
import {
  CommunityPost,
  PeerEvaluationRecord,
  PeerReviewExchangeRequest,
  UserReputation,
} from '@/types/community';
import { CommunityService } from '@/services/communityService';

interface MyActivityTabProps {
  onSelectPost: (post: CommunityPost) => void;
  onRequestPublish: () => void;
  isDark: boolean;
}

export function MyActivityTab({ onSelectPost, onRequestPublish, isDark }: MyActivityTabProps) {
  const [subTab, setSubTab] = useState<
    'posts' | 'reviews' | 'received' | 'exchanges' | 'saved'
  >('posts');

  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [activity, setActivity] = useState<{
    myPosts: CommunityPost[];
    myReviews: PeerEvaluationRecord[];
    receivedFeedback: PeerEvaluationRecord[];
    activeExchanges: PeerReviewExchangeRequest[];
    savedPosts: CommunityPost[];
  }>({
    myPosts: [],
    myReviews: [],
    receivedFeedback: [],
    activeExchanges: [],
    savedPosts: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rep = await CommunityService.getUserReputation();
      const act = await CommunityService.getUserActivity();
      setReputation(rep);
      setActivity(act);
    } catch {}
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rep, act] = await Promise.all([
          CommunityService.getUserReputation(),
          CommunityService.getUserActivity(),
        ]);
        if (!cancelled) {
          setReputation(rep);
          setActivity(act);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Answer Sheet', 'Are you sure you want to remove this answer post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await CommunityService.deletePost(postId);
          setActivity((prev) => ({
            ...prev,
            myPosts: prev.myPosts.filter((p) => p.id !== postId),
          }));
        },
      },
    ]);
  };

  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#F58235';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={accent} />}>
      {/* Reputation Card */}
      {reputation && (
        <View style={[styles.repCard, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.repTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aspirantName, { color: textPrimary }]}>You (UPSC Aspirant)</Text>
              <Text style={[styles.aspirantRole, { color: textSecondary }]}>
                Mains Community Contributor
              </Text>
            </View>

            <View style={[styles.repScoreBox, { backgroundColor: `${accent}15`, borderColor: accent }]}>
              <Text style={[styles.repScoreNum, { color: accent }]}>{reputation.reputation_score}</Text>
              <Text style={[styles.repScoreLabel, { color: accent }]}>REP POINTS</Text>
            </View>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {reputation.badges.map((b, idx) => (
              <View key={idx} style={[styles.badgePill, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                <Award size={12} color={accent} />
                <Text style={[styles.badgeText, { color: textPrimary }]}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Stats 3-Col */}
          <View style={[styles.statsRow, { borderTopColor: border }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: textPrimary }]}>
                {reputation.total_answers_published}
              </Text>
              <Text style={[styles.statLbl, { color: textMuted }]}>Answers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: textPrimary }]}>
                {reputation.total_reviews_completed}
              </Text>
              <Text style={[styles.statLbl, { color: textMuted }]}>Reviews Given</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: textPrimary }]}>
                {reputation.helpful_feedback_count}
              </Text>
              <Text style={[styles.statLbl, { color: textMuted }]}>Helpful Marks</Text>
            </View>
          </View>
        </View>
      )}

      {/* Sub-Tabs Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {[
          { id: 'posts', label: `My Posts (${activity.myPosts.length})` },
          { id: 'reviews', label: `Reviews Given (${activity.myReviews.length})` },
          { id: 'received', label: `Feedback Received (${activity.receivedFeedback.length})` },
          { id: 'exchanges', label: `Exchanges (${activity.activeExchanges.length})` },
          { id: 'saved', label: `Saved (${activity.savedPosts.length})` },
        ].map((t) => {
          const isSelected = subTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSubTab(t.id as any)}
              style={[
                styles.tabBtn,
                { borderColor: isSelected ? accent : border },
                isSelected && { backgroundColor: `${accent}15` },
              ]}>
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isSelected ? accent : textSecondary, fontWeight: isSelected ? '700' : '500' },
                ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SUB-TAB CONTENTS */}
      {subTab === 'posts' && (
        <View style={styles.sectionCol}>
          {activity.myPosts.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
              <FileText size={32} color={textMuted} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                You haven&apos;t published any answer sheets yet.
              </Text>
              <TouchableOpacity
                onPress={onRequestPublish}
                style={[styles.emptyBtn, { backgroundColor: accent }]}>
                <Text style={styles.emptyBtnText}>Publish Your First Answer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activity.myPosts.map((post) => (
              <View
                key={post.id}
                style={[styles.itemCard, { backgroundColor: surface, borderColor: border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.paperBadge, { color: accent }]}>{post.paper_id}</Text>
                  <Text style={[styles.itemDate, { color: textMuted }]}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeletePost(post.id)}
                    style={styles.deleteBtn}>
                    <Trash2 size={13} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity activeOpacity={0.8} onPress={() => onSelectPost(post)}>
                  <Text style={[styles.itemTitle, { color: textPrimary }]}>
                    {post.question_title || post.question_text.slice(0, 70)}
                  </Text>
                  <Text style={[styles.itemSnippet, { color: textSecondary }]} numberOfLines={2}>
                    {post.question_text}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.itemFooter, { borderTopColor: border }]}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Text style={[styles.statText, { color: textSecondary }]}>
                      ❤️ {post.likes_count} Likes
                    </Text>
                    <Text style={[styles.statText, { color: textSecondary }]}>
                      💬 {post.comments_count} Feedback
                    </Text>
                  </View>

                  <TouchableOpacity activeOpacity={0.7} onPress={() => onSelectPost(post)}>
                    <Text style={[styles.viewLink, { color: accent }]}>View Sheet →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {subTab === 'reviews' && (
        <View style={styles.sectionCol}>
          {activity.myReviews.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
              <UserCheck size={32} color={textMuted} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                You haven&apos;t evaluated any peer answer sheets yet. Accept an exchange opportunity to earn +25 reputation!
              </Text>
            </View>
          ) : (
            activity.myReviews.map((rev) => (
              <View
                key={rev.id}
                style={[styles.itemCard, { backgroundColor: surface, borderColor: border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.scorePill, { color: accent }]}>
                    Awarded: {rev.total_score.toFixed(1)} / {rev.max_score}M
                  </Text>
                  <Text style={[styles.itemDate, { color: textMuted }]}>
                    {new Date(rev.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.itemRemarks, { color: textPrimary }]}>{rev.overall_feedback}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {subTab === 'received' && (
        <View style={styles.sectionCol}>
          {activity.receivedFeedback.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
              <Award size={32} color={textMuted} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No peer reviews received yet. Submit mutual exchange requests to have peers evaluate your answer sheets!
              </Text>
            </View>
          ) : (
            activity.receivedFeedback.map((rev) => (
              <View
                key={rev.id}
                style={[styles.itemCard, { backgroundColor: surface, borderColor: border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.scorePill, { color: accent }]}>
                    Score: {rev.total_score.toFixed(1)} / {rev.max_score} Marks
                  </Text>
                  <Text style={[styles.reviewerTag, { color: textSecondary }]}>
                    by {rev.reviewer_user_name}
                  </Text>
                </View>
                <Text style={[styles.itemRemarks, { color: textPrimary }]}>{rev.overall_feedback}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {subTab === 'saved' && (
        <View style={styles.sectionCol}>
          {activity.savedPosts.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
              <Bookmark size={32} color={textMuted} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No saved answers. Tap the bookmark icon on any peer answer in the feed to save it here for reference.
              </Text>
            </View>
          ) : (
            activity.savedPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                activeOpacity={0.8}
                onPress={() => onSelectPost(post)}
                style={[styles.itemCard, { backgroundColor: surface, borderColor: border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.paperBadge, { color: accent }]}>{post.paper_id}</Text>
                  <Text style={[styles.authorTag, { color: textSecondary }]}>by {post.user_name}</Text>
                </View>
                <Text style={[styles.itemTitle, { color: textPrimary }]}>
                  {post.question_title || post.question_text.slice(0, 70)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {subTab === 'exchanges' && (
        <View style={styles.sectionCol}>
          {activity.activeExchanges.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
              <ArrowLeftRight size={32} color={textMuted} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No active exchanges in progress.
              </Text>
            </View>
          ) : (
            activity.activeExchanges.map((ex) => (
              <View
                key={ex.id}
                style={[styles.itemCard, { backgroundColor: surface, borderColor: border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.statusText, { color: accent }]}>{ex.status.replace(/_/g, ' ')}</Text>
                  <Text style={[styles.paperBadge, { color: textSecondary }]}>{ex.paper_id}</Text>
                </View>
                <Text style={[styles.itemTitle, { color: textPrimary }]}>{ex.topic}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  repCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  repTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aspirantName: {
    fontSize: 15,
    fontWeight: '800',
  },
  aspirantRole: {
    fontSize: 12,
    marginTop: 1,
  },
  repScoreBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  repScoreNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  repScoreLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  tabsScroll: {
    flexDirection: 'row',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabBtnText: {
    fontSize: 12,
  },
  sectionCol: {
    gap: 12,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paperBadge: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  itemDate: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  itemSnippet: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statText: {
    fontSize: 11.5,
  },
  viewLink: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  scorePill: {
    fontSize: 12,
    fontWeight: '800',
  },
  reviewerTag: {
    fontSize: 11,
  },
  authorTag: {
    fontSize: 11,
  },
  itemRemarks: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

