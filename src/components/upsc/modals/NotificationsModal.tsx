import React, { useState } from 'react';
import {
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
  Award,
  BellOff,
  BookOpen,
  CheckCheck,
  ChevronRight,
  Flame,
  Sparkles,
  Target,
  X,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface NotificationsModalProps {
  isDark: boolean;
}

type NotificationCategory = 'all' | 'unread' | 'streak' | 'mocks' | 'study';

interface NotificationItem {
  id: string;
  category: 'streak' | 'mocks' | 'study' | 'motivation';
  categoryLabel: string;
  title: string;
  message: string;
  time: string;
  section: 'Today' | 'Yesterday' | 'Earlier';
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number; fill?: string }>;
  accentColor: string;
  bgTint: string;
  isRead: boolean;
  actionLabel?: string;
  actionType?: 'focus' | 'mock';
}

export function NotificationsModal({ isDark }: NotificationsModalProps) {
  const {
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    setIsFocusModalOpen,
    streak,
  } = useStudy();

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');

  // Interactive notification items
  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: 'streak_alert',
      category: 'streak',
      categoryLabel: 'STREAK PROTECT',
      title: 'Active Study Streak Protected 🔥',
      message: `You are on a ${streak.currentStreak}-day study streak! Complete your daily focus goal to advance to Day ${
        streak.currentStreak + 1
      }.`,
      time: '12m ago',
      section: 'Today',
      icon: Flame,
      accentColor: '#F59E0B',
      bgTint: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
      isRead: false,
      actionLabel: 'Start Focus Session',
      actionType: 'focus',
    },
    {
      id: 'prelims_mock',
      category: 'mocks',
      categoryLabel: 'MOCK TESTS',
      title: 'GS Paper 1 Full Mock Ready',
      message:
        'Prelims GS Paper 1 Mock #8 is live with 100 high-yield questions on Polity, Modern History & Environment.',
      time: '2h ago',
      section: 'Today',
      icon: Award,
      accentColor: '#3B82F6',
      bgTint: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      isRead: false,
      actionLabel: 'View Test Paper',
      actionType: 'mock',
    },
    {
      id: 'daily_quote',
      category: 'motivation',
      categoryLabel: 'ASPIRANT DAILY',
      title: 'Daily Consistency Thought',
      message:
        '“It does not matter how slowly you go as long as you do not stop.” — Every syllabus topic revised today is one step closer to LBSNAA.',
      time: '5h ago',
      section: 'Today',
      icon: Sparkles,
      accentColor: '#8B5CF6',
      bgTint: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
      isRead: true,
    },
    {
      id: 'editorial_digest',
      category: 'study',
      categoryLabel: 'CURRENT AFFAIRS',
      title: 'GS-2 Governance Digest Summary',
      message:
        'Remember to extract GS-2 governance points and GS-3 economic indicators from today’s editorial analysis.',
      time: 'Yesterday, 8:30 PM',
      section: 'Yesterday',
      icon: BookOpen,
      accentColor: '#10B981',
      bgTint: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      isRead: true,
    },
    {
      id: 'target_reminder',
      category: 'study',
      categoryLabel: 'SYLLABUS TARGET',
      title: 'Weekly Revision Tracker: 82% Complete',
      message:
        'You have covered 24 out of 28 planned subtopics for this revision cycle. Keep going!',
      time: '2 days ago',
      section: 'Earlier',
      icon: Target,
      accentColor: '#06B6D4',
      bgTint: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)',
      isRead: true,
    },
  ]);

  const unreadCount = items.filter((i) => !i.isRead).length;

  const handleMarkAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleItemPress = (item: NotificationItem) => {
    // Mark clicked item as read
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i))
    );

    if (item.actionType === 'focus') {
      setIsNotificationsModalOpen(false);
      setIsFocusModalOpen(true);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'unread') return !item.isRead;
    if (activeCategory === 'streak') return item.category === 'streak';
    if (activeCategory === 'mocks') return item.category === 'mocks';
    if (activeCategory === 'study') return item.category === 'study' || item.category === 'motivation';
    return true;
  });

  // Group by section (Today, Yesterday, Earlier)
  const sections: { title: string; data: NotificationItem[] }[] = [
    { title: 'TODAY', data: filteredItems.filter((i) => i.section === 'Today') },
    { title: 'YESTERDAY', data: filteredItems.filter((i) => i.section === 'Yesterday') },
    { title: 'EARLIER', data: filteredItems.filter((i) => i.section === 'Earlier') },
  ].filter((sec) => sec.data.length > 0);

  return (
    <Modal
      visible={isNotificationsModalOpen}
      animationType={isDesktop ? 'fade' : 'slide'}
      transparent={true}
      onRequestClose={() => setIsNotificationsModalOpen(false)}>
      <View style={styles.backdrop}>
        {/* Backdrop touch to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setIsNotificationsModalOpen(false)}
        />

        <View
          style={[
            styles.container,
            isDesktop ? styles.desktopContainer : styles.mobileContainer,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          {/* Top Handle on Mobile */}
          {!isDesktop && (
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                ]}
              />
            </View>
          )}

          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View
                    style={[
                      styles.unreadPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(239, 68, 68, 0.18)'
                          : '#FEE2E2',
                        borderColor: isDark
                          ? 'rgba(239, 68, 68, 0.35)'
                          : '#FCA5A5',
                      },
                    ]}>
                    <Text style={styles.unreadPillText}>
                      {unreadCount} new
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Study alerts, streak updates & mock test reminders
              </Text>
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleMarkAllAsRead}
                  accessibilityLabel="Mark all as read"
                  style={[
                    styles.actionBtn,
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.04)',
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <CheckCheck size={16} color={theme.textPrimary} strokeWidth={2} />
                  <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
                    Mark read
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsNotificationsModalOpen(false)}
                accessibilityLabel="Close"
                style={[
                  styles.closeBtn,
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Segmented Filter Pills */}
          <View style={styles.tabsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}>
              {[
                { id: 'all' as NotificationCategory, label: 'All' },
                { id: 'unread' as NotificationCategory, label: `Unread (${unreadCount})` },
                { id: 'streak' as NotificationCategory, label: 'Streak' },
                { id: 'mocks' as NotificationCategory, label: 'Mock Tests' },
                { id: 'study' as NotificationCategory, label: 'Syllabus' },
              ].map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.75}
                    onPress={() => setActiveCategory(tab.id)}
                    style={[
                      styles.tabChip,
                      Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                      {
                        backgroundColor: isActive
                          ? theme.buttonPrimaryBg
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isActive
                          ? theme.buttonPrimaryBg
                          : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tabChipText,
                        {
                          color: isActive
                            ? theme.buttonPrimaryText
                            : theme.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Notifications List */}
          <ScrollView
            contentContainerStyle={styles.scrollList}
            showsVerticalScrollIndicator={false}>
            {sections.length > 0 ? (
              sections.map((section) => (
                <View key={section.title} style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                    {section.title}
                  </Text>

                  <View style={styles.itemsColumn}>
                    {section.data.map((item) => {
                      const Icon = item.icon;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.85}
                          onPress={() => handleItemPress(item)}
                          style={[
                            styles.notificationCard,
                            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                            {
                              backgroundColor: !item.isRead
                                ? isDark
                                  ? '#192033'
                                  : '#F8FAFF'
                                : isDark
                                ? '#141824'
                                : '#FFFFFF',
                              borderColor: !item.isRead
                                ? isDark
                                  ? 'rgba(59, 130, 246, 0.3)'
                                  : 'rgba(59, 130, 246, 0.25)'
                                : theme.cardBorder,
                            },
                          ]}>
                          {/* Unread Indicator Bar */}
                          {!item.isRead && (
                            <View
                              style={[
                                styles.unreadIndicatorBar,
                                { backgroundColor: item.accentColor },
                              ]}
                            />
                          )}

                          {/* Icon Squircle with Ambient Tint */}
                          <View
                            style={[
                              styles.iconBox,
                              {
                                backgroundColor: item.bgTint,
                                borderColor: isDark
                                  ? 'rgba(255,255,255,0.08)'
                                  : 'rgba(0,0,0,0.04)',
                              },
                            ]}>
                            <Icon
                              size={19}
                              color={item.accentColor}
                              strokeWidth={2.3}
                              fill={item.category === 'streak' ? '#FBBF24' : undefined}
                            />
                          </View>

                          {/* Content Column */}
                          <View style={styles.contentCol}>
                            <View style={styles.cardTopRow}>
                              <Text
                                style={[
                                  styles.categoryTag,
                                  { color: item.accentColor },
                                ]}>
                                {item.categoryLabel}
                              </Text>
                              <Text style={[styles.timeText, { color: theme.textMuted }]}>
                                {item.time}
                              </Text>
                            </View>

                            <Text
                              style={[
                                styles.itemTitle,
                                {
                                  color: theme.textPrimary,
                                  fontWeight: !item.isRead ? '700' : '600',
                                },
                              ]}>
                              {item.title}
                            </Text>

                            <Text
                              style={[
                                styles.itemMessage,
                                { color: theme.textSecondary },
                              ]}>
                              {item.message}
                            </Text>

                            {/* Optional Action CTA */}
                            {Boolean(item.actionLabel) && (
                              <View style={styles.cardActionRow}>
                                <View
                                  style={[
                                    styles.actionPill,
                                    {
                                      backgroundColor: isDark
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                      borderColor: theme.cardBorder,
                                    },
                                  ]}>
                                  <Text
                                    style={[
                                      styles.actionPillText,
                                      { color: theme.textPrimary },
                                    ]}>
                                    {item.actionLabel}
                                  </Text>
                                  <ChevronRight size={13} color={theme.textPrimary} />
                                </View>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            ) : (
              /* Empty State */
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconHalo,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <BellOff size={32} color={theme.textMuted} strokeWidth={1.8} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  All caught up!
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  {activeCategory === 'unread'
                    ? 'No unread notifications at the moment.'
                    : 'No notifications in this category right now.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
  },
  desktopContainer: {
    width: '92%',
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
  },
  mobileContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 17,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabsScrollContent: {
    paddingHorizontal: 22,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
  },
  scrollList: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  itemsColumn: {
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 14,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  itemMessage: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  cardActionRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
