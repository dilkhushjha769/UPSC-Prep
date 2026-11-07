import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  PenLine,
} from 'lucide-react-native';
import {
  CommunityNotification,
  CommunityPost,
  ExchangeSubmission,
  PeerReviewExchangeRequest,
} from '@/types/community';
import { CommunityService } from '@/services/communityService';
import { CommunityFeedTab } from './CommunityFeedTab';
import { PeerReviewExchangeTab } from './PeerReviewExchangeTab';
import { MyActivityTab } from './MyActivityTab';
import { AnswerSheetViewerModal } from './AnswerSheetViewerModal';
import { PublishAnswerModal } from './PublishAnswerModal';
import { CreateExchangeModal } from './CreateExchangeModal';
import { PeerEvaluationModal } from './PeerEvaluationModal';
import { CommunityNotificationsModal } from './CommunityNotificationsModal';

interface MainsCommunityViewProps {
  isDark: boolean;
  onBackToPractice: () => void;
  onToggleTheme?: () => void;
}

export function MainsCommunityView({
  isDark,
  onBackToPractice,
}: MainsCommunityViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'exchange' | 'activity'>('feed');

  // Data state
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [exchanges, setExchanges] = useState<PeerReviewExchangeRequest[]>([]);
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreateExchangeModalOpen, setIsCreateExchangeModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Peer Evaluation in progress
  const [evaluatingExchange, setEvaluatingExchange] =
    useState<PeerReviewExchangeRequest | null>(null);
  const [evaluatingTarget, setEvaluatingTarget] = useState<ExchangeSubmission | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPosts, fetchedExchanges, fetchedNotifs] = await Promise.all([
        CommunityService.getPosts(),
        CommunityService.getExchangeRequests(),
        CommunityService.getNotifications(),
      ]);
      setPosts(fetchedPosts);
      setExchanges(fetchedExchanges);
      setNotifications(fetchedNotifs);
    } catch {}
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [fetchedPosts, fetchedExchanges, fetchedNotifs] = await Promise.all([
          CommunityService.getPosts(),
          CommunityService.getExchangeRequests(),
          CommunityService.getNotifications(),
        ]);
        if (!cancelled) {
          setPosts(fetchedPosts);
          setExchanges(fetchedExchanges);
          setNotifications(fetchedNotifs);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const accent = '#F58235';

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  const handlePostUpdated = (updated: CommunityPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPost && selectedPost.id === updated.id) {
      setSelectedPost(updated);
    }
  };

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleExchangeCreated = (newExchange: PeerReviewExchangeRequest) => {
    setExchanges((prev) => [newExchange, ...prev]);
  };

  const handleOpenEvaluation = (
    exchange: PeerReviewExchangeRequest,
    targetSubmission: ExchangeSubmission
  ) => {
    setEvaluatingExchange(exchange);
    setEvaluatingTarget(targetSubmission);
  };

  const handleReviewSubmitted = (updatedExchange: PeerReviewExchangeRequest) => {
    setExchanges((prev) => prev.map((e) => (e.id === updatedExchange.id ? updatedExchange : e)));
    setEvaluatingExchange(null);
    setEvaluatingTarget(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Community Header */}
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBackToPractice} style={styles.backBtn}>
            <ArrowLeft size={18} color={textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Mains Community</Text>
            <Text style={[styles.headerSub, { color: textSecondary }]}>
              Peer Answer Sheets & Mutual Reviews
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsNotificationsModalOpen(true)}
            style={[styles.notifBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
            <Bell size={17} color={textPrimary} />
            {unreadNotifsCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: accent }]}>
                <Text style={styles.notifBadgeText}>{unreadNotifsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsPublishModalOpen(true)}
            style={[styles.publishBtn, { backgroundColor: accent }]}>
            <PenLine size={14} color="#FFFFFF" />
            <Text style={styles.publishBtnText}>Publish Answer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3 Main Community Tabs */}
      <View style={[styles.tabBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('feed')}
          style={[styles.tabItem, activeTab === 'feed' && [styles.tabItemActive, { borderBottomColor: accent }]]}>
          <Text
            style={[
              styles.tabItemText,
              { color: activeTab === 'feed' ? accent : textSecondary },
              activeTab === 'feed' && { fontWeight: '800' },
            ]}>
            Community Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('exchange')}
          style={[styles.tabItem, activeTab === 'exchange' && [styles.tabItemActive, { borderBottomColor: accent }]]}>
          <Text
            style={[
              styles.tabItemText,
              { color: activeTab === 'exchange' ? accent : textSecondary },
              activeTab === 'exchange' && { fontWeight: '800' },
            ]}>
            Peer Review Exchange
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('activity')}
          style={[styles.tabItem, activeTab === 'activity' && [styles.tabItemActive, { borderBottomColor: accent }]]}>
          <Text
            style={[
              styles.tabItemText,
              { color: activeTab === 'activity' ? accent : textSecondary },
              activeTab === 'activity' && { fontWeight: '800' },
            ]}>
            My Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab View Body */}
      <View style={styles.body}>
        {activeTab === 'feed' && (
          <CommunityFeedTab
            posts={posts}
            isLoading={isLoading}
            onRefresh={loadData}
            onSelectPost={(post) => setSelectedPost(post)}
            onPostUpdated={handlePostUpdated}
            onRequestPublish={() => setIsPublishModalOpen(true)}
            isDark={isDark}
          />
        )}

        {activeTab === 'exchange' && (
          <PeerReviewExchangeTab
            exchanges={exchanges}
            isLoading={isLoading}
            onRefresh={loadData}
            onRequestCreateExchange={() => setIsCreateExchangeModalOpen(true)}
            onOpenEvaluation={handleOpenEvaluation}
            isDark={isDark}
          />
        )}

        {activeTab === 'activity' && (
          <MyActivityTab
            onSelectPost={(post) => setSelectedPost(post)}
            onRequestPublish={() => setIsPublishModalOpen(true)}
            isDark={isDark}
          />
        )}
      </View>

      {/* MODALS */}
      <AnswerSheetViewerModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        isDark={isDark}
        onPostUpdated={handlePostUpdated}
      />

      <PublishAnswerModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        isDark={isDark}
        onPostCreated={handlePostCreated}
      />

      <CreateExchangeModal
        isOpen={isCreateExchangeModalOpen}
        onClose={() => setIsCreateExchangeModalOpen(false)}
        isDark={isDark}
        onExchangeCreated={handleExchangeCreated}
      />

      <PeerEvaluationModal
        exchange={evaluatingExchange}
        targetSubmission={evaluatingTarget}
        isOpen={!!evaluatingExchange && !!evaluatingTarget}
        onClose={() => {
          setEvaluatingExchange(null);
          setEvaluatingTarget(null);
        }}
        isDark={isDark}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <CommunityNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {},
  tabItemText: {
    fontSize: 12.5,
  },
  body: {
    flex: 1,
  },
});

