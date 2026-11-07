import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bookmark,
  Eye,
  FileText,
  Heart,
  Layers,
  MessageSquare,
  Search,
  UserCheck,
} from 'lucide-react-native';
import { CommunityPost } from '@/types/community';
import { CommunityService } from '@/services/communityService';

interface CommunityFeedTabProps {
  posts: CommunityPost[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPost: (post: CommunityPost) => void;
  onPostUpdated: (post: CommunityPost) => void;
  onRequestPublish: () => void;
  isDark: boolean;
}

const PAPERS_FILTER: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Papers' },
  { id: 'GS4', label: 'GS IV' },
  { id: 'GS1', label: 'GS I' },
  { id: 'GS2', label: 'GS II' },
  { id: 'GS3', label: 'GS III' },
  { id: 'ESSAY', label: 'Essay' },
  { id: 'OPTIONAL', label: 'Optional' },
];

const SORTS: { id: 'recent' | 'likes' | 'comments' | 'reviews'; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'likes', label: 'Most Liked' },
  { id: 'comments', label: 'Most Discussed' },
  { id: 'reviews', label: 'Most Reviewed' },
];

export function CommunityFeedTab({
  posts,
  isLoading,
  onRefresh,
  onSelectPost,
  onPostUpdated,
  onRequestPublish,
  isDark,
}: CommunityFeedTabProps) {
  const [selectedPaper, setSelectedPaper] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState<'recent' | 'likes' | 'comments' | 'reviews'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (selectedPaper !== 'ALL') {
      result = result.filter((p) => p.paper_id === selectedPaper);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.question_title?.toLowerCase().includes(q) ||
          p.question_text.toLowerCase().includes(q) ||
          p.user_name.toLowerCase().includes(q) ||
          p.topic?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (selectedSort === 'likes') return b.likes_count - a.likes_count;
      if (selectedSort === 'comments') return b.comments_count - a.comments_count;
      if (selectedSort === 'reviews') return b.peer_reviews_count - a.peer_reviews_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [posts, selectedPaper, selectedSort, searchQuery]);

  const handleToggleLike = async (post: CommunityPost) => {
    const prevLiked = post.is_liked_by_me;
    const prevCount = post.likes_count;
    const updated = {
      ...post,
      is_liked_by_me: !prevLiked,
      likes_count: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    };
    onPostUpdated(updated);

    try {
      const res = await CommunityService.toggleLikePost(post.id);
      onPostUpdated({ ...post, is_liked_by_me: res.liked, likes_count: res.count });
    } catch {
      onPostUpdated(post);
    }
  };

  const handleToggleBookmark = async (post: CommunityPost) => {
    const prev = post.is_bookmarked_by_me;
    onPostUpdated({ ...post, is_bookmarked_by_me: !prev });
    try {
      const res = await CommunityService.toggleBookmarkPost(post.id);
      onPostUpdated({ ...post, is_bookmarked_by_me: res });
    } catch {
      onPostUpdated(post);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={[styles.filterBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={[styles.searchBox, { backgroundColor: surfaceSubtle, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search answers by topic, ethics keyword, or aspirant..."
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Paper Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {PAPERS_FILTER.map((p) => {
            const isSelected = p.id === selectedPaper;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPaper(p.id)}
                style={[
                  styles.filterPill,
                  { borderColor: isSelected ? accent : border },
                  isSelected && { backgroundColor: `${accent}15` },
                ]}>
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? accent : textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort Row */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: textMuted }]}>SORT BY:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORTS.map((s) => {
              const isSelected = s.id === selectedSort;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedSort(s.id)}
                  style={[
                    styles.sortPill,
                    isSelected && [styles.sortPillActive, { backgroundColor: surfaceSubtle, borderColor: border }],
                  ]}>
                  <Text
                    style={[
                      styles.sortPillText,
                      { color: isSelected ? accent : textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Posts Feed */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={accent} />}>
        {isLoading && posts.length === 0 ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={[styles.loaderText, { color: textSecondary }]}>
              Loading UPSC community answers...
            </Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
            <FileText size={36} color={textMuted} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No answer sheets found</Text>
            <Text style={[styles.emptyDesc, { color: textSecondary }]}>
              No peer answers match your current filter. Be the first aspirant to publish an answer for this paper!
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRequestPublish}
              style={[styles.emptyActionBtn, { backgroundColor: accent }]}>
              <Text style={styles.emptyActionText}>Publish Your Answer Sheet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPosts.map((post) => {
            const hasAttachments = post.attachments && post.attachments.length > 0;
            const firstAttachment = post.attachments?.[0];

            return (
              <View
                key={post.id}
                style={[styles.postCard, { backgroundColor: surface, borderColor: border }]}>
                {/* Author Info */}
                <View style={styles.postAuthorRow}>
                  <Image
                    source={{
                      uri:
                        post.user_avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                    }}
                    style={styles.authorAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.authorName, { color: textPrimary }]}>{post.user_name}</Text>
                      {post.user_badge && (
                        <View style={[styles.badgePill, { backgroundColor: `${accent}15` }]}>
                          <Text style={[styles.badgePillText, { color: accent }]}>{post.user_badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.postTime, { color: textMuted }]}>
                      {new Date(post.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      • {post.paper_id} • {post.marks}M
                    </Text>
                  </View>

                  <View style={[styles.paperTag, { backgroundColor: `${accent}12` }]}>
                    <Text style={[styles.paperTagText, { color: accent }]}>{post.paper_id}</Text>
                  </View>
                </View>

                {/* Question Title & Snippet */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onSelectPost(post)}
                  style={styles.questionSection}>
                  <Text style={[styles.questionTitle, { color: textPrimary }]}>
                    {post.question_title || post.question_text.slice(0, 75) + '...'}
                  </Text>
                  <Text style={[styles.questionSnippet, { color: textSecondary }]} numberOfLines={2}>
                    {post.question_text}
                  </Text>
                </TouchableOpacity>

                {/* Handwritten Answer Sheet Preview */}
                {hasAttachments && firstAttachment?.file_uri && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectPost(post)}
                    style={[
                      styles.sheetDocCardRow,
                      { backgroundColor: surfaceSubtle, borderColor: border },
                    ]}>
                    {/* A4 Paper Portrait Thumbnail */}
                    <View style={[styles.docThumbnailWrap, { borderColor: border }]}>
                      <Image
                        source={{ uri: firstAttachment.file_uri }}
                        style={styles.docThumbnailImg}
                        resizeMode="cover"
                      />
                      <View style={styles.docCornerBadge}>
                        <Text style={styles.docCornerBadgeText}>QCAB</Text>
                      </View>
                    </View>

                    {/* Meta info & action */}
                    <View style={styles.docMetaCol}>
                      <View style={styles.docMetaTop}>
                        <View style={[styles.qcabBadge, { backgroundColor: `${accent}15` }]}>
                          <FileText size={11} color={accent} />
                          <Text style={[styles.qcabBadgeText, { color: accent }]}>
                            UPSC Answer Booklet
                          </Text>
                        </View>
                        <View style={[styles.pagesBadge, { backgroundColor: surface }]}>
                          <Layers size={10} color={textMuted} />
                          <Text style={[styles.pagesBadgeText, { color: textSecondary }]}>
                            {post.attachments.length} {post.attachments.length === 1 ? 'Page' : 'Pages'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.docActionRow}>
                        <View style={[styles.inspectSheetBtn, { backgroundColor: accent }]}>
                          <Eye size={12} color="#FFFFFF" strokeWidth={2.4} />
                          <Text style={styles.inspectSheetBtnText}>Inspect Sheet</Text>
                        </View>
                        <Text style={[styles.docClickHint, { color: textMuted }]}>
                          Click to upscale & read
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Strategy Note */}
                {post.approach_note ? (
                  <View style={[styles.approachBox, { backgroundColor: surfaceSubtle }]}>
                    <Text style={[styles.approachSnippet, { color: textSecondary }]} numberOfLines={2}>
                      <Text style={{ fontWeight: '700', color: textPrimary }}>Approach: </Text>
                      {post.approach_note}
                    </Text>
                  </View>
                ) : null}

                {/* Footer Interactions */}
                <View style={[styles.footerRow, { borderTopColor: border }]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleToggleLike(post)}
                    style={styles.actionBtn}>
                    <Heart
                      size={17}
                      color={post.is_liked_by_me ? '#EF4444' : textSecondary}
                      fill={post.is_liked_by_me ? '#EF4444' : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: post.is_liked_by_me ? '#EF4444' : textSecondary,
                          fontWeight: post.is_liked_by_me ? '700' : '500',
                        },
                      ]}>
                      {post.likes_count}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onSelectPost(post)}
                    style={styles.actionBtn}>
                    <MessageSquare size={17} color={textSecondary} />
                    <Text style={[styles.actionText, { color: textSecondary }]}>
                      {post.comments_count}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleToggleBookmark(post)}
                    style={styles.actionBtn}>
                    <Bookmark
                      size={17}
                      color={post.is_bookmarked_by_me ? accent : textSecondary}
                      fill={post.is_bookmarked_by_me ? accent : 'transparent'}
                    />
                  </TouchableOpacity>

                  {/* Peer Review Status Badge */}
                  {post.peer_review_status && post.peer_review_status !== 'none' && (
                    <View style={[styles.peerReviewStatusPill, { backgroundColor: `${accent}15` }]}>
                      <UserCheck size={12} color={accent} />
                      <Text style={[styles.peerReviewStatusText, { color: accent }]}>
                        {post.peer_reviews_count > 0
                          ? `${post.peer_reviews_count} Peer ${post.peer_reviews_count === 1 ? 'Review' : 'Reviews'}`
                          : 'Review Requested'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  sortPillActive: {
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 11.5,
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
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
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  postTime: {
    fontSize: 11,
    marginTop: 1,
  },
  paperTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paperTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  questionSection: {
    gap: 4,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  questionSnippet: {
    fontSize: 12.5,
    lineHeight: 17.5,
  },
  sheetDocCardRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  docThumbnailWrap: {
    width: 80,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  docThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  docCornerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  docCornerBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  docMetaCol: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  docMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  qcabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qcabBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  pagesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pagesBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  docActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inspectSheetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  docClickHint: {
    fontSize: 10.5,
  },
  approachBox: {
    borderRadius: 8,
    padding: 8,
  },
  approachSnippet: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12.5,
  },
  peerReviewStatusPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  peerReviewStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});

