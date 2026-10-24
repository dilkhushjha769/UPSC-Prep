import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Flame,
  Home,
  Moon,
  Newspaper,
  Sun,
  Trophy,
  User,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

export type NavTab = 'home' | 'prelims' | 'current-affairs' | 'leaderboard' | 'profile';

interface SidebarNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SidebarNav({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
}: SidebarNavProps) {
  const { config, streak } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'prelims' as NavTab,
      label: 'Prelims',
      icon: BookOpen,
    },
    {
      id: 'current-affairs' as NavTab,
      label: 'Current Affairs',
      icon: Newspaper,
    },
    {
      id: 'leaderboard' as NavTab,
      label: 'Leaderboard',
      icon: Trophy,
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
                    ? theme.activeBg
                    : 'transparent',
                },
              ]}>
              <Icon
                size={18}
                color={isActive ? theme.textPrimary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.navItemText,
                  {
                    color: isActive ? theme.textPrimary : theme.textSecondary,
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
                      backgroundColor: isDark ? '#261E0A' : '#FEF3C7',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                    },
                  ]}>
                  <Flame size={11} color="#D97706" fill="#FBBF24" />
                  <Text
                    style={[
                      styles.streakMiniPillText,
                      { color: isDark ? '#FBBF24' : '#B45309' },
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
          style={styles.profileMiniRow}>
          <View
            style={[
              styles.avatarBox,
              { backgroundColor: theme.buttonPrimaryBg },
            ]}>
            <Text
              style={[
                styles.avatarText,
                { color: theme.buttonPrimaryText },
              ]}>
              {config.aspirantName ? config.aspirantName.charAt(0) : 'A'}
            </Text>
          </View>
          <View style={styles.profileNameCol}>
            <Text
              style={[styles.profileNameText, { color: theme.textPrimary }]}
              numberOfLines={1}>
              {config.aspirantName}
            </Text>
            <Text
              style={[styles.profilePhaseText, { color: theme.textSecondary }]}>
              {streak.currentStreak}d Active
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Clean Mobile Bottom Navigation Bar
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
    { id: 'current-affairs' as NavTab, label: 'Affairs', icon: Newspaper },
    { id: 'leaderboard' as NavTab, label: 'Board', icon: Trophy },
    { id: 'profile' as NavTab, label: 'Profile', icon: User },
  ];

  return (
    <View
      style={[
        styles.mobileBottomBar,
        {
          backgroundColor: theme.sidebarBg,
          borderTopColor: theme.cardBorder,
          paddingBottom: insets.bottom + 6,
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
            <Icon
              size={20}
              color={isActive ? theme.textPrimary : theme.textMuted}
            />
            <Text
              style={[
                styles.mobileNavText,
                {
                  color: isActive ? theme.textPrimary : theme.textMuted,
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
    borderRadius: 10,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  // In-flow footer (flexShrink: 0): content above it can never be covered.
  mobileBottomBar: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  mobileNavBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  mobileNavText: {
    fontSize: 11,
  },
});
