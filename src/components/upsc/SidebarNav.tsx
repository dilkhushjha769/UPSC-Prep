import React, { useState } from 'react';
// Navigation components
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award,
  BookOpen,
  CheckSquare,
  Edit3,
  Flame,
  Home,
  Moon,
  Newspaper,
  PenLine,
  Sun,
  User,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { useAppTheme } from '@/context/ThemeContext';
import { QuickEditProfileModal } from './modals/QuickEditProfileModal';

export type NavTab = 'home' | 'tasks' | 'prelims' | 'mains' | 'mock-test' | 'current-affairs' | 'profile' | 'notifications';

export interface SidebarNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function SidebarNav({
  activeTab,
  onSelectTab,
  isDark: propIsDark,
  onToggleTheme: propToggleTheme,
}: SidebarNavProps) {
  const { isDark: contextIsDark, toggleTheme: contextToggleTheme } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const onToggleTheme = propToggleTheme || contextToggleTheme;
  const { config, streak } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'tasks' as NavTab,
      label: 'My Tasks',
      icon: CheckSquare,
    },
    {
      id: 'prelims' as NavTab,
      label: 'Prelims',
      icon: BookOpen,
    },
    {
      id: 'mains' as NavTab,
      label: 'Mains Practice',
      icon: PenLine,
    },
    {
      id: 'mock-test' as NavTab,
      label: 'Mock Tests',
      icon: Award,
    },
    {
      id: 'current-affairs' as NavTab,
      label: 'Current Affairs',
      icon: Newspaper,
    },
    {
      id: 'profile' as NavTab,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <View
      style={[
        styles.sidebarContainer,
        {
          backgroundColor: theme.sidebarBg,
          borderRightColor: theme.cardBorder,
        },
      ]}>
      {/* Top Brand Section */}
      <View style={styles.brandRow}>
        <View style={[styles.brandDot, { backgroundColor: theme.textPrimary }]} />
        <View>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            UPSC
          </Text>
          <Text style={[styles.brandSub, { color: theme.textSecondary }]}>
            Consistency OS
          </Text>
        </View>
      </View>

      {/* Navigation Links */}
      <View style={styles.navSection}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => onSelectTab(item.id)}
              style={[
                styles.navItemBtn,
                {
                  backgroundColor: isActive
                    ? (isDark ? 'rgba(245, 130, 53, 0.12)' : 'rgba(245, 130, 53, 0.08)')
                    : 'transparent',
                  borderWidth: 0,
                  borderColor: 'transparent',
                },
              ]}>
              {isActive && <View style={styles.activeIndicatorBar} />}
              <Icon
                size={18}
                color={isActive ? '#FF9500' : (isDark ? '#9DA8B9' : theme.textSecondary)}
              />
              <Text
                style={[
                  styles.navItemText,
                  {
                    color: isActive ? (isDark ? '#FF9500' : '#D96E14') : (isDark ? '#9DA8B9' : theme.textSecondary),
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}>
                {item.label}
              </Text>
              {item.id === 'home' && streak.currentStreak > 0 ? (
                <View
                  style={[
                    styles.streakMiniPill,
                    {
                      backgroundColor: isDark ? '#2B1A0A' : '#FFF7ED',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                    },
                  ]}>
                  <Flame size={11} color="#FF9500" fill="#FF9500" />
                  <Text
                    style={[
                      styles.streakMiniPillText,
                      { color: isDark ? '#EB853C' : '#FF9500' },
                    ]}>
                    {streak.currentStreak}d
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Profile & Theme Section */}
      <View
        style={[
          styles.bottomSection,
          { borderTopColor: theme.divider },
        ]}>
        {/* Theme Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleTheme}
          style={[
            styles.themeToggleBtn,
            { borderColor: theme.cardBorder },
          ]}>
          {isDark ? (
            <Sun size={15} color={theme.textPrimary} />
          ) : (
            <Moon size={15} color={theme.textPrimary} />
          )}
          <Text style={[styles.themeToggleText, { color: theme.textPrimary }]}>
            {isDark ? 'Light' : 'Dark'} Mode
          </Text>
        </TouchableOpacity>

        {/* User Mini Profile */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectTab('profile')}
          style={styles.profileMiniRow}
          accessibilityLabel="Open Profile">
          <View
            style={[
              styles.avatarBox,
              { backgroundColor: theme.buttonPrimaryBg },
            ]}>
            {config.avatarUri ? (
              <Image
                source={{ uri: config.avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={[
                  styles.avatarText,
                  { color: theme.buttonPrimaryText },
                ]}>
                {config.aspirantName ? config.aspirantName.charAt(0).toUpperCase() : 'A'}
              </Text>
            )}
          </View>
          <View style={styles.profileNameCol}>
            <Text
              style={[styles.profileNameText, { color: theme.textPrimary }]}
              numberOfLines={1}>
              {config.aspirantName || 'Aspirant'}
            </Text>
            <Text
              style={[styles.profilePhaseText, { color: theme.textSecondary }]}>
              {streak.currentStreak}d Active
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsQuickEditOpen(true)}
            hitSlop={8}
            style={[
              styles.editProfileBtn,
              {
                backgroundColor: isDark ? '#1B2534' : '#F0EDE6',
                borderColor: isDark ? '#253244' : '#EAE5DC',
              },
            ]}
            accessibilityLabel="Edit name and profile photo">
            <Edit3 size={13} color={theme.textPrimary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Quick Profile & Photo Editor Modal */}
        <QuickEditProfileModal
          isOpen={isQuickEditOpen}
          onClose={() => setIsQuickEditOpen(false)}
          isDark={isDark}
        />
      </View>
    </View>
  );
}

/**
 * Clean Mobile Bottom Navigation Bar - Premium Redesign
 */
export function MobileBottomNav({
  activeTab,
  onSelectTab,
  isDark,
}: {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark: boolean;
}) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  // Real bottom inset (gesture bar / 3-button nav / home indicator)
  const insets = useSafeAreaInsets();

  const items = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'prelims' as NavTab, label: 'Prelims', icon: BookOpen },
    { id: 'mains' as NavTab, label: 'Mains', icon: PenLine },
    { id: 'mock-test' as NavTab, label: 'Mocks', icon: Award },
    { id: 'current-affairs' as NavTab, label: 'Affairs', icon: Newspaper },
  ];

  return (
    <View
      style={[
        styles.mobileBottomBar,
        {
          backgroundColor: isDark
            ? '#0B1018'
            : 'rgba(255, 255, 255, 0.98)',
          borderTopColor: isDark ? '#253244' : '#EAE5DC',
          paddingBottom: Math.max(insets.bottom, 6) + 4,
        },
      ]}>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onSelectTab(item.id)}
            style={styles.mobileNavBtn}>
            <View
              style={[
                styles.mobileIconCapsule,
                {
                  backgroundColor: isActive
                    ? '#FF9500'
                    : 'transparent',
                  borderWidth: 0,
                  borderColor: 'transparent',
                },
              ]}>
              <Icon
                size={19}
                color={
                  isActive
                    ? '#FFFFFF'
                    : (isDark ? '#9DA8B9' : theme.textMuted)
                }
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            </View>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.mobileNavText,
                {
                  color: isActive
                    ? '#FF9500'
                    : (isDark ? '#9DA8B9' : theme.textMuted),
                  fontWeight: isActive ? '700' : '500',
                },
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 220,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  navSection: {
    gap: 6,
    flex: 1,
  },
  navItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingLeft: 16,
    borderRadius: 10,
    position: 'relative',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -10,
    width: 3.5,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#FF9500',
  },
  navItemText: {
    fontSize: 14,
    flex: 1,
  },
  streakMiniPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakMiniPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bottomSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  avatarBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  profileNameCol: {
    flex: 1,
  },
  profileNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profilePhaseText: {
    fontSize: 11,
    fontWeight: '500',
  },
  editProfileBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // In-flow footer (flexShrink: 0): content above it can never be covered.
  mobileBottomBar: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  mobileNavBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  mobileIconCapsule: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  mobileNavText: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
});
