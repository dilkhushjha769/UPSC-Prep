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
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  CheckCheck,
  ChevronLeft,
  Moon,
  MoreVertical,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';

interface NotificationsScreenProps {
  isDark: boolean;
  onBack: () => void;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
}

type FilterPeriod = 'All' | 'Today' | 'Yesterday' | 'Earlier';

// =========================================================================
// PREMIUM CUSTOM FILLED SVG ICONS (Matching Mobbin / Adeoluwa Danad Design)
// =========================================================================

/** 1. Solid Red Alarm Clock (Class is starting soon!) */
function PremiumAlarmClockIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="alarmGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F87171" />
          <Stop offset="1" stopColor="#EF4444" />
        </LinearGradient>
      </Defs>
      {/* Top Left Bell */}
      <Path
        d="M4.5 4.5C3.8 5.2 3.2 6.1 2.8 7.1L4.8 7.9C5.1 7.2 5.5 6.5 6 6L4.5 4.5Z"
        fill="#DC2626"
      />
      {/* Top Right Bell */}
      <Path
        d="M19.5 4.5L18 6C18.5 6.5 18.9 7.2 19.2 7.9L21.2 7.1C20.8 6.1 20.2 5.2 19.5 4.5Z"
        fill="#DC2626"
      />
      {/* Clock Face Circle */}
      <Circle cx="12" cy="13" r="7.5" fill="url(#alarmGrad)" />
      {/* Inner White Rim Highlight */}
      <Circle
        cx="12"
        cy="13"
        r="6.8"
        stroke="#FFFFFF"
        strokeOpacity={0.25}
        strokeWidth={0.8}
        fill="none"
      />
      {/* Clock Hands in Crisp White */}
      <Path
        d="M12 9.5V13L14.6 14.8"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="1.2" fill="#FFFFFF" />
      {/* Bottom Feet */}
      <Path
        d="M6 19.5L4.5 21M18 19.5L19.5 21"
        stroke="#DC2626"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 2. Solid Emerald Info Discus (You were mentioned in class.) */
function PremiumInfoBadgeIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="infoGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#34D399" />
          <Stop offset="1" stopColor="#10B981" />
        </LinearGradient>
      </Defs>
      {/* Solid Disc */}
      <Circle cx="12" cy="12" r="9" fill="url(#infoGrad)" />
      {/* Crisp White Lowercase "i" */}
      <Circle cx="12" cy="8" r="1.25" fill="#FFFFFF" />
      <Path
        d="M11 11H12.2V16.2H13.2"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10.5 16.2H13.5" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** 3. Solid Slate/Navy Open Book (Assignment is closing soon!) */
function PremiumBookAssignmentIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2D25" />
          <Stop offset="1" stopColor="#2B2019" />
        </LinearGradient>
      </Defs>
      {/* Left Page (Curved 3D appearance) */}
      <Path
        d="M4.5 6C6.5 5.5 9 5.8 11.5 7V18.5C9 17.5 6.5 17.2 4.5 17.8V6Z"
        fill="url(#bookGrad)"
      />
      {/* Right Page */}
      <Path
        d="M19.5 6C17.5 5.5 15 5.8 12.5 7V18.5C15 17.5 17.5 17.2 19.5 17.8V6Z"
        fill="url(#bookGrad)"
      />
      {/* Spine Gap & Highlights */}
      <Path d="M12 6.5V18.5" stroke="#4F4036" strokeWidth={1.2} />
      {/* White Page Ridge Accents */}
      <Path
        d="M7 9C8.5 8.7 10 9 11 9.6M7 12C8.5 11.7 10 12 11 12.6"
        stroke="#FFFFFF"
        strokeOpacity={0.65}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M17 9C15.5 8.7 14 9 13 9.6M17 12C15.5 11.7 14 12 13 12.6"
        stroke="#FFFFFF"
        strokeOpacity={0.65}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 4. Solid Golden Amber Microphone (Class recording ready!) */
function PremiumAudioMicIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="micGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBBF24" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      {/* Mic Rounded Capsule Body */}
      <Rect x="8.5" y="4" width="7" height="10" rx="3.5" fill="url(#micGrad)" />
      {/* Capsule Horizontal Acoustic Slits */}
      <Path
        d="M10 7.5H14M10 10H14"
        stroke="#B45309"
        strokeOpacity={0.5}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      {/* Cradle Arc */}
      <Path
        d="M6 10.5C6 14 8.7 16.5 12 16.5C15.3 16.5 18 14 18 10.5"
        stroke="#D97706"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Stem & Stand Base */}
      <Path d="M12 16.5V19.5M8.5 19.5H15.5" stroke="#D97706" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** 5. Solid Royal Blue Bell (Account verified / Notification alert) */
function PremiumRoyalBellIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF8A3D" />
          <Stop offset="1" stopColor="#FF6A13" />
        </LinearGradient>
      </Defs>
      {/* Top Suspension Loop */}
      <Path
        d="M12 3.5C11.2 3.5 10.5 4.1 10.5 5H13.5C13.5 4.1 12.8 3.5 12 3.5Z"
        fill="#E85A0C"
      />
      {/* Main Flared Bell Body */}
      <Path
        d="M12 5C8.8 5 6.5 7.5 6.5 11.5V14.5L5 16.5H19L17.5 14.5V11.5C17.5 7.5 15.2 5 12 5Z"
        fill="url(#bellGrad)"
      />
      {/* Bottom Clapper */}
      <Path
        d="M10.2 17.5C10.5 18.8 11.2 19.5 12 19.5C12.8 19.5 13.5 18.8 13.8 17.5H10.2Z"
        fill="#C94A06"
      />
    </Svg>
  );
}

/** 6. Dual-Tone Energetic Flame (Study streak protected) */
function PremiumStreakFlameIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="outerFlame" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FB923C" />
          <Stop offset="1" stopColor="#EA580C" />
        </LinearGradient>
        <LinearGradient id="innerFlame" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FEF08A" />
          <Stop offset="1" stopColor="#FACC15" />
        </LinearGradient>
      </Defs>
      {/* Outer Flame Shell */}
      <Path
        d="M12 2C10.5 4.5 9 6.8 9 9C9 10.5 9.7 11.7 10.6 12.3C9.4 12.8 8.5 14 8.5 15.5C8.5 18 10.5 20.5 13 20.5C16.5 20.5 19 17.5 19 13.8C19 9.8 15.8 6.5 15.5 3C14.2 4.5 13.2 6.5 13 8C12.5 5.5 12.2 3.5 12 2Z"
        fill="url(#outerFlame)"
      />
      {/* Inner Glowing Core */}
      <Path
        d="M12.5 12C11.5 13.2 11 14.5 11 15.5C11 17 12 18.5 13.5 18.5C15 18.5 16 17 16 15.2C16 13.8 14.5 12.8 14 11C13.4 11.8 12.9 12 12.5 12Z"
        fill="url(#innerFlame)"
      />
    </Svg>
  );
}

/** 7. Solid Royal Purple Trophy Cup (Full Mock Test Leaderboard) */
function PremiumTrophyAwardIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="trophyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFAA70" />
          <Stop offset="1" stopColor="#FF6A13" />
        </LinearGradient>
      </Defs>
      {/* Trophy Goblet Cup */}
      <Path
        d="M7 4H17V9.5C17 12.5 14.8 15 12 15C9.2 15 7 12.5 7 9.5V4Z"
        fill="url(#trophyGrad)"
      />
      {/* Left Handle */}
      <Path
        d="M7 5.5H5C4.2 5.5 3.5 6.2 3.5 7C3.5 8.8 5 10 7 10"
        stroke="#C94A06"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Right Handle */}
      <Path
        d="M17 5.5H19C19.8 5.5 20.5 6.2 20.5 7C20.5 8.8 19 10 17 10"
        stroke="#C94A06"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Stem & Solid Weighted Pedestal Base */}
      <Path d="M12 15V18" stroke="#C94A06" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M8 18.5H16V20.5H8V18.5Z" fill="#A63D05" />
    </Svg>
  );
}

// =========================================================================
// DATA INTERFACES
// =========================================================================

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  period: 'Today' | 'Yesterday' | 'Earlier';
  iconRenderer: (size?: number) => React.ReactNode;
  iconBgLight: string;
  iconBgDark: string;
  isRead: boolean;
}

export function NotificationsScreen({
  isDark,
  onBack,
  onToggleTheme,
  onOpenSettings,
}: NotificationsScreenProps) {
  const { streak } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterPeriod>('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  // Notification items matching reference style
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Class is starting soon!',
      description: 'Your next live Polity Revision class starts in 12 minutes, tap to join session now.',
      time: '5:52 PM',
      period: 'Today',
      iconRenderer: (size) => <PremiumAlarmClockIcon size={size} />,
      iconBgLight: '#FEE2E2',
      iconBgDark: 'rgba(239, 68, 68, 0.16)',
      isRead: false,
    },
    {
      id: '2',
      title: 'You were mentioned in class.',
      description: 'The faculty just reviewed your Mains GS-2 answer copy. Visit feedback section to see details.',
      time: '4:30 PM',
      period: 'Today',
      iconRenderer: (size) => <PremiumInfoBadgeIcon size={size} />,
      iconBgLight: '#D1FAE5',
      iconBgDark: 'rgba(16, 185, 129, 0.16)',
      isRead: false,
    },
    {
      id: '3',
      title: 'Assignment is closing soon!',
      description: 'GS Paper 1 Mock #8 submission is closing at 11:59 PM. Complete and submit your test paper.',
      time: '2:15 PM',
      period: 'Today',
      iconRenderer: (size) => <PremiumBookAssignmentIcon size={size} />,
      iconBgLight: '#F0E2D5',
      iconBgDark: 'rgba(163, 148, 136, 0.16)',
      isRead: false,
    },
    {
      id: '4',
      title: 'Class recording is ready!',
      description: 'The Modern History editorial analysis audio podcast has just been uploaded. Check dashboard to listen.',
      time: '11:20 AM',
      period: 'Today',
      iconRenderer: (size) => <PremiumAudioMicIcon size={size} />,
      iconBgLight: '#FEF3C7',
      iconBgDark: 'rgba(245, 158, 11, 0.16)',
      isRead: true,
    },
    {
      id: '5',
      title: 'Aspirant account verified!',
      description: 'Your UPSC preparation profile and target year metrics have been synchronized with the cloud ledger.',
      time: 'Yesterday, 8:10 PM',
      period: 'Yesterday',
      iconRenderer: (size) => <PremiumRoyalBellIcon size={size} />,
      iconBgLight: '#FFEBDB',
      iconBgDark: 'rgba(255, 106, 19, 0.16)',
      isRead: true,
    },
    {
      id: '6',
      title: 'Study streak protected 🔥',
      description: `Great discipline! Your ${streak.currentStreak}-day study streak is secure. Advance to tomorrow's daily target.`,
      time: 'Yesterday, 9:40 PM',
      period: 'Yesterday',
      iconRenderer: (size) => <PremiumStreakFlameIcon size={size} />,
      iconBgLight: '#FFEDD5',
      iconBgDark: 'rgba(249, 115, 22, 0.16)',
      isRead: true,
    },
    {
      id: '7',
      title: 'Full Mock Test leaderboard live',
      description: 'All India Rank percentiles and subject accuracy trends for the Weekend Prelims Mock have been published.',
      time: '2 days ago',
      period: 'Earlier',
      iconRenderer: (size) => <PremiumTrophyAwardIcon size={size} />,
      iconBgLight: '#FFEDE0',
      iconBgDark: 'rgba(255, 138, 61, 0.16)',
      isRead: true,
    },
  ]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setActiveMenuId(null);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setActiveMenuId(null);
  };

  const handleDeleteItem = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setActiveMenuId(null);
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item))
    );
    setActiveMenuId(null);
  };

  const filteredNotifications = notifications.filter((item) => {
    if (selectedFilter === 'All') return true;
    return item.period === selectedFilter;
  });

  if (isSettingsOpen) {
    return (
      <NotificationSettingsScreen
        isDark={isDark}
        onBack={() => setIsSettingsOpen(false)}
      />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Top Navigation Bar with Circular Back Button */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.bg,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
        ]}>
        {/* Left: Rounded Back Arrow Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          accessibilityLabel="Back"
          style={[
            styles.backButton,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FBEFE5',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
            },
          ]}>
          <ChevronLeft
            size={20}
            color={theme.textPrimary}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        {/* Center: Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Notifications
          </Text>
        </View>

        {/* Right: Quick Action Controls */}
        <View style={styles.headerRightGroup}>
          {/* In-flow Theme Toggle (Prevents overlap with floating button) */}
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.headerActionBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark
                    ? 'rgba(251, 191, 36, 0.12)'
                    : 'rgba(255, 106, 19, 0.08)',
                  borderColor: isDark
                    ? 'rgba(251, 191, 36, 0.28)'
                    : 'rgba(255, 106, 19, 0.22)',
                },
              ]}>
              {isDark ? (
                <Sun size={17} color="#FBBF24" strokeWidth={2.3} />
              ) : (
                <Moon size={17} color="#E85A0C" strokeWidth={2.3} />
              )}
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsConfirmDeleteAllOpen(true)}
              accessibilityLabel="Clear all"
              style={[
                styles.headerActionBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FBEFE5',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                },
              ]}>
              <Trash2 size={15} color={theme.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllAsRead}
              accessibilityLabel="Mark all as read"
              style={[
                styles.headerActionBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FBEFE5',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                },
              ]}>
              <CheckCheck size={16} color={theme.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setIsSettingsOpen(true);
              }
            }}
            accessibilityLabel="Notification Preferences"
            style={[
              styles.headerActionBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FBEFE5',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              },
            ]}>
            <Settings size={16} color={theme.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Filter Period Tabs (Matching Reference Image 2) */}
        <View style={styles.filterPillsRow}>
          {(['All', 'Today', 'Yesterday', 'Earlier'] as FilterPeriod[]).map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedFilter(tab);
                  setActiveMenuId(null);
                }}
                style={[
                  styles.filterPill,
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                  isActive
                    ? [
                        styles.filterPillActive,
                        {
                          backgroundColor: isDark ? '#FFF8F2' : '#1F1612',
                          borderColor: isDark ? '#FFF8F2' : '#1F1612',
                        },
                      ]
                    : [
                        styles.filterPillInactive,
                        {
                          backgroundColor: isDark ? '#241A12' : '#FBEFE5',
                          borderColor: isDark ? '#33261C' : '#F0E2D5',
                        },
                      ],
                ]}>
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive
                        ? isDark
                          ? '#1F1612'
                          : '#FFFFFF'
                        : theme.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notifications List or Empty State */}
        {filteredNotifications.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredNotifications.map((item, index) => {
              const isLast = index === filteredNotifications.length - 1;
              const isMenuOpen = activeMenuId === item.id;
              const iconBackground = isDark ? item.iconBgDark : item.iconBgLight;

              return (
                <View key={item.id} style={styles.rowWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleToggleRead(item.id)}
                    style={[
                      styles.notificationRow,
                      Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                      !item.isRead && {
                        backgroundColor: isDark
                          ? 'rgba(255, 106, 19, 0.08)'
                          : 'rgba(239, 246, 255, 0.75)',
                      },
                      !isLast && [
                        styles.rowDivider,
                        {
                          borderBottomColor: isDark
                            ? 'rgba(255, 255, 255, 0.07)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ],
                    ]}>
                    {/* Left: Solid Pastel Icon Circle */}
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: iconBackground,
                          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        },
                      ]}>
                      {item.iconRenderer(22)}
                    </View>

                    {/* Middle: Content */}
                    <View style={styles.contentCol}>
                      <View style={styles.itemTitleRow}>
                        <Text
                          style={[
                            styles.itemTitle,
                            {
                              color: theme.textPrimary,
                              fontWeight: !item.isRead ? '700' : '600',
                            },
                          ]}
                          numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <View
                            style={[
                              styles.unreadDot,
                              { backgroundColor: '#FF6A13' },
                            ]}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.itemDescription,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={2}>
                        {item.description}
                      </Text>

                      <Text
                        style={[styles.itemTime, { color: theme.textMuted }]}>
                        {item.time}
                      </Text>
                    </View>

                    {/* Right: Three Dots Action */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveMenuId((prev) => (prev === item.id ? null : item.id))
                      }
                      accessibilityLabel="Options"
                      style={[
                        styles.menuButton,
                        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                      ]}>
                      <MoreVertical
                        size={17}
                        color={theme.textMuted}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Context Popup Menu */}
                  {isMenuOpen && (
                    <View
                      style={[
                        styles.inlineMenuPopup,
                        {
                          backgroundColor: isDark ? '#2A1E15' : '#FFFFFF',
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleToggleRead(item.id)}
                        style={styles.menuActionItem}>
                        <CheckCheck size={14} color={theme.textPrimary} />
                        <Text
                          style={[styles.menuActionText, { color: theme.textPrimary }]}>
                          {item.isRead ? 'Mark as unread' : 'Mark as read'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDeleteItem(item.id)}
                        style={styles.menuActionItem}>
                        <Trash2 size={14} color="#EF4444" />
                        <Text style={[styles.menuActionText, { color: '#EF4444' }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty State (Matching Reference Image 1 Right Side) */
          <View style={styles.emptyContainer}>
            {/* Cloud Illustration Graphic */}
            <View style={styles.emptyIllustrationBox}>
              <View
                style={[
                  styles.emptyBigHalo,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : '#FBEFE5',
                  },
                ]}>
                <View
                  style={[
                    styles.emptySpeechBubble,
                    {
                      backgroundColor: isDark ? '#263048' : '#D9C7B8',
                    },
                  ]}>
                  <View style={styles.emptyBubbleDots}>
                    <View style={styles.emptyDot} />
                    <View style={styles.emptyDot} />
                    <View style={styles.emptyDot} />
                  </View>
                </View>

                {/* Overlapping Pink Notification Badge */}
                <View style={styles.emptyPinkBadge}>
                  <View style={styles.emptyMiniDot} />
                  <View style={styles.emptyMiniDot} />
                  <View style={styles.emptyMiniDot} />
                </View>
              </View>
            </View>

            {/* Empty Title & Subtitle */}
            <Text style={[styles.emptyMainTitle, { color: theme.textPrimary }]}>
              No notification yet.
            </Text>
            <Text
              style={[
                styles.emptySubDescription,
                { color: theme.textSecondary },
              ]}>
              You don’t have any notification yet,{'\n'}
              notifications will appear here when you do.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal for Delete All */}
      <Modal
        visible={isConfirmDeleteAllOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsConfirmDeleteAllOpen(false)}>
        <View style={styles.confirmBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsConfirmDeleteAllOpen(false)}
          />
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              },
            ]}>
            {/* Trash Icon Circle */}
            <View
              style={[
                styles.confirmIconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(239, 68, 68, 0.16)'
                    : '#FEE2E2',
                  borderColor: isDark
                    ? 'rgba(239, 68, 68, 0.3)'
                    : '#FCA5A5',
                },
              ]}>
              <Trash2 size={24} color="#EF4444" strokeWidth={2.2} />
            </View>

            <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
              Clear All Notifications?
            </Text>

            <Text style={[styles.confirmSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to delete all {notifications.length} notifications? This action cannot be undone.
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setIsConfirmDeleteAllOpen(false)}
                style={[
                  styles.confirmCancelBtn,
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#FBEFE5',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.confirmCancelText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  handleClearAll();
                  setIsConfirmDeleteAllOpen(false);
                }}
                style={[
                  styles.confirmDeleteBtn,
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                ]}>
                <Text style={styles.confirmDeleteText}>
                  Delete All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 18 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 40,
    width: '100%',
  },
  desktopScrollContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {},
  filterPillInactive: {},
  filterPillText: {
    fontSize: 12.5,
  },
  listContainer: {
    width: '100%',
  },
  rowWrapper: {
    position: 'relative',
    width: '100%',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 14,
    width: '100%',
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contentCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14.5,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  itemDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  menuButton: {
    padding: 6,
    marginTop: 2,
  },
  inlineMenuPopup: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 99,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    gap: 4,
  },
  menuActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 60,
  },
  emptyIllustrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyBigHalo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptySpeechBubble: {
    width: 76,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBubbleDots: {
    flexDirection: 'row',
    gap: 4,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
  emptyPinkBadge: {
    position: 'absolute',
    bottom: 30,
    right: 28,
    width: 30,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2.5,
  },
  emptyMiniDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FFFFFF',
  },
  emptyMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptySubDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  confirmIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
