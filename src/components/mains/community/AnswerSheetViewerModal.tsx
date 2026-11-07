import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Maximize2,
  MessageSquare,
  RotateCcw,
  Send,
  Share2,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import { CommunityComment, CommunityPost } from '@/types/community';
import { CommunityService } from '@/services/communityService';

interface AnswerSheetViewerModalProps {
  post: CommunityPost | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onPostUpdated?: (updated: CommunityPost) => void;
}

export function AnswerSheetViewerModal({
  post,
  isOpen,
  onClose,
  isDark,
  onPostUpdated,
}: AnswerSheetViewerModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommunityComment | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);

  // Image Upscale / Zoom Lightbox state
  const [isUpscaled, setIsUpscaled] = useState(false);
  const [upscaleScale, setUpscaleScale] = useState<number>(1);
  const [upscalePanX, setUpscalePanX] = useState<number>(0);
  const [upscalePanY, setUpscalePanY] = useState<number>(0);

  const stateRef = useRef({ scale: upscaleScale, panX: upscalePanX, panY: upscalePanY });
  useEffect(() => {
    stateRef.current = { scale: upscaleScale, panX: upscalePanX, panY: upscalePanY };
  }, [upscaleScale, upscalePanX, upscalePanY]);

  const initialDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const startPanXRef = useRef<number>(0);
  const startPanYRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const getDistance = (touches: readonly any[]) => {
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleResetZoom = useCallback(() => {
    setUpscaleScale(1);
    setUpscalePanX(0);
    setUpscalePanY(0);
  }, []);

  const handleDoubleTap = useCallback(() => {
    setUpscaleScale((s) => {
      if (s > 1) {
        setUpscalePanX(0);
        setUpscalePanY(0);
        return 1;
      }
      return 2.0;
    });
  }, []);

  const upscalePanResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const now = evt.nativeEvent.timestamp || 0;
          if (now - lastTapRef.current < 300) {
            handleDoubleTap();
            lastTapRef.current = 0;
            return;
          }
          lastTapRef.current = now;

          startPanXRef.current = stateRef.current.panX;
          startPanYRef.current = stateRef.current.panY;

          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            initialDistRef.current = getDistance(evt.nativeEvent.touches);
            initialScaleRef.current = stateRef.current.scale;
          } else {
            initialDistRef.current = null;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            if (!initialDistRef.current) {
              initialDistRef.current = getDistance(evt.nativeEvent.touches);
              initialScaleRef.current = stateRef.current.scale;
              return;
            }
            const dist = getDistance(evt.nativeEvent.touches);
            const multiplier = dist / initialDistRef.current;
            const newScale = Math.max(1.0, Math.min(3.5, +(initialScaleRef.current * multiplier).toFixed(2)));
            setUpscaleScale(newScale);
          } else if (stateRef.current.scale > 1) {
            const maxOffset = (windowWidth * (stateRef.current.scale - 1)) / 2;
            const maxOffsetY = (windowHeight * (stateRef.current.scale - 1)) / 2;
            const candidateX = startPanXRef.current + gestureState.dx;
            const candidateY = startPanYRef.current + gestureState.dy;
            setUpscalePanX(Math.max(-maxOffset, Math.min(maxOffset, candidateX)));
            setUpscalePanY(Math.max(-maxOffsetY, Math.min(maxOffsetY, candidateY)));
          }
        },
        onPanResponderRelease: () => {
          initialDistRef.current = null;
        },
        onPanResponderTerminate: () => {
          initialDistRef.current = null;
        },
      }),
    [windowWidth, windowHeight, handleDoubleTap]
  );

  const [likedOverride, setLikedOverride] = useState<{ postId: string; isLiked: boolean; count: number } | null>(null);
  const [bookmarkedOverride, setBookmarkedOverride] = useState<{ postId: string; isBookmarked: boolean } | null>(null);

  const isLiked =
    likedOverride && post && likedOverride.postId === post.id
      ? likedOverride.isLiked
      : !!post?.is_liked_by_me;
  const likesCount =
    likedOverride && post && likedOverride.postId === post.id
      ? likedOverride.count
      : post?.likes_count || 0;
  const isBookmarked =
    bookmarkedOverride && post && bookmarkedOverride.postId === post.id
      ? bookmarkedOverride.isBookmarked
      : !!post?.is_bookmarked_by_me;

  useEffect(() => {
    let cancelled = false;
    if (post) {
      CommunityService.getComments(post.id)
        .then((list) => {
          if (!cancelled) setComments(list);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [post]);

  if (!post) return null;

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  const totalPages = post.attachments?.length || 1;
  const currentAttachment = post.attachments?.[currentPageIndex];

  const handleToggleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setLikedOverride({ postId: post.id, isLiked: nextLiked, count: nextCount });

    try {
      const res = await CommunityService.toggleLikePost(post.id);
      setLikedOverride({ postId: post.id, isLiked: res.liked, count: res.count });
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_liked_by_me: res.liked, likes_count: res.count });
      }
    } catch {
      setLikedOverride({ postId: post.id, isLiked: prevLiked, count: prevCount });
    }
  };

  const handleToggleBookmark = async () => {
    const nextBookmarked = !isBookmarked;
    setBookmarkedOverride({ postId: post.id, isBookmarked: nextBookmarked });
    try {
      const res = await CommunityService.toggleBookmarkPost(post.id);
      setBookmarkedOverride({ postId: post.id, isBookmarked: res });
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_bookmarked_by_me: res });
      }
    } catch {
      setBookmarkedOverride({ postId: post.id, isBookmarked: !nextBookmarked });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${post.user_name}'s UPSC Mains answer on "${post.question_title || 'Mains Answer'}":\n\nPaper: ${post.paper_id} • Marks: ${post.marks}`,
        title: post.question_title || 'UPSC Mains Answer Sheet',
      });
    } catch {}
  };

  const handleReport = () => {
    Alert.alert(
      'Report Post',
      'Do you want to report this answer sheet for inappropriate content or violation of community guidelines?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            await CommunityService.reportContent({
              postId: post.id,
              reason: 'Community guidelines violation flag',
            });
            Alert.alert('Reported', 'Thank you. Our moderation team will review this answer sheet.');
          },
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await CommunityService.addComment(
        post.id,
        commentText.trim(),
        replyingTo?.id
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setReplyingTo(null);
      if (onPostUpdated) {
        onPostUpdated({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not post feedback.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Feedback', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await CommunityService.deleteComment(commentId, post.id);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        },
      },
    ]);
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: bg }]}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.headerBtn}>
            <ArrowLeft size={20} color={textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.authorName, { color: textPrimary }]} numberOfLines={1}>
              {post.user_name}
            </Text>
            <Text style={[styles.paperMeta, { color: textSecondary }]}>
              {post.paper_id} • {post.marks} Marks • {post.word_limit} Words
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.headerIconBtn}>
              <Share2 size={18} color={textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={handleReport} style={styles.headerIconBtn}>
              <Flag size={18} color={textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Question Collapsible Box */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsQuestionExpanded(!isQuestionExpanded)}
            style={[styles.questionCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.questionHeaderRow}>
              <View style={[styles.paperBadge, { backgroundColor: `${accent}15` }]}>
                <Text style={[styles.paperBadgeText, { color: accent }]}>{post.paper_id}</Text>
              </View>
              <Text style={[styles.questionTopic, { color: textSecondary }]} numberOfLines={1}>
                {post.topic || post.subject_area || 'UPSC Mains Question'}
              </Text>
              <Text style={[styles.expandHint, { color: accent }]}>
                {isQuestionExpanded ? 'Collapse' : 'View Question'}
              </Text>
            </View>

            <Text
              style={[styles.questionText, { color: textPrimary }]}
              numberOfLines={isQuestionExpanded ? undefined : 2}>
              {post.question_text}
            </Text>

            {post.approach_note ? (
              <View style={[styles.approachBox, { backgroundColor: surfaceSubtle }]}>
                <Text style={[styles.approachTitle, { color: accent }]}>Aspirant&apos;s Strategy:</Text>
                <Text style={[styles.approachText, { color: textSecondary }]}>
                  {post.approach_note}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Answer Sheet Viewer / Carousel */}
          <View style={[styles.sheetViewerBox, { backgroundColor: surface, borderColor: border }]}>
            {/* Page Navigation Banner */}
            <View style={[styles.pageNavBar, { borderBottomColor: border }]}>
              <TouchableOpacity
                disabled={currentPageIndex === 0}
                onPress={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                style={[styles.pageNavBtn, currentPageIndex === 0 && styles.disabledBtn]}>
                <ChevronLeft size={18} color={currentPageIndex === 0 ? textMuted : textPrimary} />
              </TouchableOpacity>

              <View style={styles.pageCountBadge}>
                <Text style={[styles.pageCountText, { color: textPrimary }]}>
                  Page {currentPageIndex + 1} of {totalPages}
                </Text>
              </View>

              <TouchableOpacity
                disabled={currentPageIndex >= totalPages - 1}
                onPress={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                style={[styles.pageNavBtn, currentPageIndex >= totalPages - 1 && styles.disabledBtn]}>
                <ChevronRight
                  size={18}
                  color={currentPageIndex >= totalPages - 1 ? textMuted : textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Answer Image Preview */}
            {currentAttachment?.file_uri ? (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => {
                  handleResetZoom();
                  setIsUpscaled(true);
                }}
                style={[
                  styles.imageContainer,
                  { backgroundColor: isDark ? '#0D1522' : '#F1F5F9' },
                ]}>
                <Image
                  source={{ uri: currentAttachment.file_uri }}
                  style={styles.sheetImage}
                  resizeMode="contain"
                />

                {/* Upscale / Zoom Action Pill */}
                <View style={styles.upscaleBadge}>
                  <Maximize2 size={13} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.upscaleBadgeText}>Click to upscale & zoom</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyImageBox}>
                <Text style={[styles.emptyImageText, { color: textMuted }]}>
                  Handwritten page preview unavailable.
                </Text>
              </View>
            )}

            {/* Page Thumbnails Row */}
            {totalPages > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbScroll}
                contentContainerStyle={styles.thumbScrollContent}>
                {post.attachments.map((att, idx) => {
                  const isActive = idx === currentPageIndex;
                  return (
                    <TouchableOpacity
                      key={att.id || idx}
                      onPress={() => {
                        setCurrentPageIndex(idx);
                        handleResetZoom();
                      }}
                      style={[
                        styles.thumbItem,
                        { borderColor: isActive ? accent : border, backgroundColor: surfaceSubtle },
                        isActive && { borderWidth: 2 },
                      ]}>
                      <Image source={{ uri: att.file_uri }} style={styles.thumbImage} resizeMode="cover" />
                      <Text style={[styles.thumbLabel, { color: textSecondary }]}>P{idx + 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Social Interaction Bar */}
          <View style={[styles.interactionBar, { backgroundColor: surface, borderColor: border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleLike}
              style={styles.interactionBtn}>
              <Heart
                size={18}
                color={isLiked ? '#EF4444' : textSecondary}
                fill={isLiked ? '#EF4444' : 'transparent'}
              />
              <Text
                style={[
                  styles.interactionText,
                  { color: isLiked ? '#EF4444' : textSecondary, fontWeight: isLiked ? '700' : '500' },
                ]}>
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>

            <View style={styles.interactionBtn}>
              <MessageSquare size={18} color={textSecondary} />
              <Text style={[styles.interactionText, { color: textSecondary }]}>
                {comments.length} Comments
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleBookmark}
              style={styles.interactionBtn}>
              <Bookmark
                size={18}
                color={isBookmarked ? accent : textSecondary}
                fill={isBookmarked ? accent : 'transparent'}
              />
              <Text
                style={[
                  styles.interactionText,
                  { color: isBookmarked ? accent : textSecondary, fontWeight: isBookmarked ? '700' : '500' },
                ]}>
                {isBookmarked ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Peer Feedback & Discussion Section */}
          <View style={[styles.discussionSection, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Peer Feedback & Discussion ({comments.length})
            </Text>
            <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
              UPSC aspirants giving actionable feedback, keyword recommendations, and committee citations.
            </Text>

            {comments.length === 0 ? (
              <View style={styles.noCommentsBox}>
                <Text style={[styles.noCommentsText, { color: textMuted }]}>
                  No peer feedback yet. Be the first aspirant to share constructive suggestions!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((c) => {
                  const isReply = !!c.parent_comment_id;
                  const isMyComment = c.user_id === 'user_local_aspirant';
                  return (
                    <View
                      key={c.id}
                      style={[
                        styles.commentItem,
                        isReply && [styles.replyItem, { borderLeftColor: accent }],
                        { borderBottomColor: border },
                      ]}>
                      <View style={styles.commentHeader}>
                        <Image
                          source={{
                            uri:
                              c.user_avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                          }}
                          style={styles.commentAvatar}
                        />
                        <View style={styles.commentMeta}>
                          <Text style={[styles.commentAuthor, { color: textPrimary }]}>
                            {c.user_name}
                          </Text>
                          <Text style={[styles.commentTime, { color: textMuted }]}>
                            {new Date(c.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>

                        {isMyComment && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(c.id)}
                            style={styles.deleteCommentBtn}>
                            <Trash2 size={14} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={[styles.commentBody, { color: textPrimary }]}>{c.content}</Text>

                      {!isReply && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setReplyingTo(c)}
                          style={styles.replyBtn}>
                          <Text style={[styles.replyBtnText, { color: accent }]}>Reply</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input Footer */}
        <View style={[styles.footerInputBar, { backgroundColor: surface, borderTopColor: border }]}>
          {replyingTo && (
            <View style={[styles.replyingBanner, { backgroundColor: surfaceSubtle }]}>
              <Text style={[styles.replyingText, { color: textSecondary }]} numberOfLines={1}>
                Replying to <Text style={{ fontWeight: '700', color: textPrimary }}>{replyingTo.user_name}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <X size={14} color={textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border },
              ]}
              placeholder={replyingTo ? 'Write a reply...' : 'Add constructive peer feedback...'}
              placeholderTextColor={textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={600}
            />

            <TouchableOpacity
              disabled={isSubmittingComment || !commentText.trim()}
              onPress={handleAddComment}
              style={[
                styles.sendBtn,
                { backgroundColor: accent },
                (!commentText.trim() || isSubmittingComment) && styles.disabledSendBtn,
              ]}>
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fullscreen Upscale Lightbox Modal */}
      <Modal
        visible={isUpscaled}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setIsUpscaled(false);
          handleResetZoom();
        }}>
        <View style={styles.upscaleBackdrop}>
          {/* Top Navigation & Status Bar */}
          <View style={styles.upscaleHeader}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsUpscaled(false);
                handleResetZoom();
              }}
              style={styles.upscaleCircleBtn}>
              <X size={20} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.upscaleHeaderCenter}>
              <Text style={styles.upscaleHeaderTitle} numberOfLines={1}>
                {post.user_name}&apos;s Answer Sheet
              </Text>
              <Text style={styles.upscaleHeaderSubtitle}>
                {post.paper_id} • Page {currentPageIndex + 1} of {totalPages} • {Math.round(upscaleScale * 100)}%
              </Text>
            </View>

            {totalPages > 1 ? (
              <View style={styles.upscalePageNavRow}>
                <TouchableOpacity
                  disabled={currentPageIndex === 0}
                  onPress={() => {
                    setCurrentPageIndex((p) => Math.max(0, p - 1));
                    handleResetZoom();
                  }}
                  style={[styles.upscaleNavMiniBtn, currentPageIndex === 0 && { opacity: 0.35 }]}>
                  <ChevronLeft size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.upscaleNavMiniText}>
                  {currentPageIndex + 1} / {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={currentPageIndex >= totalPages - 1}
                  onPress={() => {
                    setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1));
                    handleResetZoom();
                  }}
                  style={[
                    styles.upscaleNavMiniBtn,
                    currentPageIndex >= totalPages - 1 && { opacity: 0.35 },
                  ]}>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Enlarged / Upscaled Interactive Image Canvas */}
          <View style={styles.upscaleCanvas} {...upscalePanResponder.panHandlers}>
            {currentAttachment?.file_uri && (
              <Image
                source={{ uri: currentAttachment.file_uri }}
                style={[
                  styles.upscaleImage,
                  {
                    width: windowWidth,
                    height: Math.min(windowHeight * 0.74, windowWidth * 1.3),
                    transform: [
                      { scale: upscaleScale },
                      { translateX: upscalePanX },
                      { translateY: upscalePanY },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Bottom Floating Control Dock */}
          <View style={styles.upscaleBottomBar}>
            <View style={styles.upscaleZoomControls}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUpscaleScale((s) => Math.max(1, +(s - 0.25).toFixed(2)))}
                disabled={upscaleScale <= 1}
                accessibilityLabel="Zoom out"
                style={[styles.upscaleZoomBtn, upscaleScale <= 1 && { opacity: 0.35 }]}>
                <ZoomOut size={16} color="#FFFFFF" strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetZoom}
                style={styles.upscaleScaleBadge}>
                <Text style={styles.upscaleScaleBadgeText}>{Math.round(upscaleScale * 100)}%</Text>
                <RotateCcw size={12} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUpscaleScale((s) => Math.min(3.5, +(s + 0.25).toFixed(2)))}
                disabled={upscaleScale >= 3.5}
                accessibilityLabel="Zoom in"
                style={[styles.upscaleZoomBtn, upscaleScale >= 3.5 && { opacity: 0.35 }]}>
                <ZoomIn size={16} color="#FFFFFF" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Quick scale presets */}
            <View style={styles.upscalePresetsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetZoom}
                style={[
                  styles.upscalePresetBtn,
                  upscaleScale === 1 && styles.upscalePresetBtnActive,
                ]}>
                <Text
                  style={[
                    styles.upscalePresetText,
                    upscaleScale === 1 && styles.upscalePresetTextActive,
                  ]}>
                  Fit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUpscaleScale(1.5)}
                style={[
                  styles.upscalePresetBtn,
                  Math.abs(upscaleScale - 1.5) < 0.1 && styles.upscalePresetBtnActive,
                ]}>
                <Text
                  style={[
                    styles.upscalePresetText,
                    Math.abs(upscaleScale - 1.5) < 0.1 && styles.upscalePresetTextActive,
                  ]}>
                  1.5x
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUpscaleScale(2.2)}
                style={[
                  styles.upscalePresetBtn,
                  Math.abs(upscaleScale - 2.2) < 0.1 && styles.upscalePresetBtnActive,
                ]}>
                <Text
                  style={[
                    styles.upscalePresetText,
                    Math.abs(upscaleScale - 2.2) < 0.1 && styles.upscalePresetTextActive,
                  ]}>
                  2.2x
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.upscaleHintText}>
              Double-tap to toggle zoom • Drag to pan handwritten sheet
            </Text>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  paperMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 16,
  },
  questionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paperBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paperBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  questionTopic: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  expandHint: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  approachBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    gap: 3,
  },
  approachTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  approachText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  sheetViewerBox: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pageNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pageNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  pageCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pageCountText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  imageContainer: {
    width: '100%',
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sheetImage: {
    width: '100%',
    height: '100%',
  },
  upscaleBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  upscaleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyImageBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyImageText: {
    fontSize: 13,
  },
  thumbScroll: {
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  thumbScrollContent: {
    padding: 10,
    gap: 10,
  },
  thumbItem: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '75%',
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionText: {
    fontSize: 13,
  },
  discussionSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  noCommentsBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  commentsList: {
    marginTop: 8,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 6,
  },
  replyItem: {
    marginLeft: 18,
    borderLeftWidth: 2,
    paddingLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 10.5,
  },
  deleteCommentBtn: {
    padding: 4,
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18.5,
  },
  replyBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  replyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  footerInputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 11.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSendBtn: {
    opacity: 0.5,
  },
  upscaleBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.96)',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : Platform.OS === 'android' ? 36 : 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  upscaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  upscaleCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upscaleHeaderCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  upscaleHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upscaleHeaderSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  upscaleHeaderRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  upscalePageNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  upscaleNavMiniBtn: {
    padding: 3,
  },
  upscaleNavMiniText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  upscaleCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  upscaleImage: {
    width: '100%',
    height: '100%',
  },
  upscaleBottomBar: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 10,
  },
  upscaleZoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  upscaleZoomBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upscaleScaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  upscaleScaleBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  upscalePresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upscalePresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  upscalePresetBtnActive: {
    backgroundColor: '#FF9500',
  },
  upscalePresetText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  upscalePresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  upscaleHintText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
});

