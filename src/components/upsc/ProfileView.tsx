// @ts-ignore
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BarChart2,
  Compass,
  Settings,
  User,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { ProfilePersonalDetails } from './profile/ProfilePersonalDetails';
import { ProfileOverview } from './profile/ProfileOverview';
import { ProfileAnalytics } from './profile/ProfileAnalytics';
import { ProfileSettings } from './profile/ProfileSettings';

export type ProfileSubTab = 'profile' | 'overview' | 'analytics' | 'settings';

interface ProfileViewProps {
  isDark: boolean;
  onNavigateToTab?: (tabKey: any) => void;
}

export function ProfileView({ isDark, onNavigateToTab }: ProfileViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>('profile');
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const handleSubTabChange = (tab: ProfileSubTab) => {
    setActiveSubTab(tab);
  };

  const handleNavigate = (tabKey: 'overview' | 'analytics' | 'settings') => {
    setActiveSubTab(tabKey);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Profile
        </Text>
      </View>

      {/* Segmented Black & White Tab Switcher (4 Tabs) */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? '#141416' : '#F1F5F9',
            borderColor: theme.cardBorder,
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSubTabChange('profile')}
          style={[
            styles.tabItem,
            activeSubTab === 'profile' && [
              styles.tabItemActive,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorderActive,
              },
            ],
          ]}>
          <User
            size={13}
            color={
              activeSubTab === 'profile'
                ? theme.buttonPrimaryText
                : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeSubTab === 'profile'
                    ? theme.buttonPrimaryText
                    : theme.textSecondary,
                fontWeight: activeSubTab === 'profile' ? '800' : '600',
              },
            ]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSubTabChange('overview')}
          style={[
            styles.tabItem,
            activeSubTab === 'overview' && [
              styles.tabItemActive,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorderActive,
              },
            ],
          ]}>
          <Compass
            size={13}
            color={
              activeSubTab === 'overview'
                ? theme.buttonPrimaryText
                : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeSubTab === 'overview'
                    ? theme.buttonPrimaryText
                    : theme.textSecondary,
                fontWeight: activeSubTab === 'overview' ? '800' : '600',
              },
            ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSubTabChange('analytics')}
          style={[
            styles.tabItem,
            activeSubTab === 'analytics' && [
              styles.tabItemActive,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorderActive,
              },
            ],
          ]}>
          <BarChart2
            size={13}
            color={
              activeSubTab === 'analytics'
                ? theme.buttonPrimaryText
                : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeSubTab === 'analytics'
                    ? theme.buttonPrimaryText
                    : theme.textSecondary,
                fontWeight: activeSubTab === 'analytics' ? '800' : '600',
              },
            ]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSubTabChange('settings')}
          style={[
            styles.tabItem,
            activeSubTab === 'settings' && [
              styles.tabItemActive,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorderActive,
              },
            ],
          ]}>
          <Settings
            size={13}
            color={
              activeSubTab === 'settings'
                ? theme.buttonPrimaryText
                : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeSubTab === 'settings'
                    ? theme.buttonPrimaryText
                    : theme.textSecondary,
                fontWeight: activeSubTab === 'settings' ? '800' : '600',
              },
            ]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render Active Sub Tab View */}
      {activeSubTab === 'profile' && (
        <ProfilePersonalDetails
          isDark={isDark}
          onNavigateToTab={handleNavigate}
        />
      )}

      {activeSubTab === 'overview' && (
        <ProfileOverview
          isDark={isDark}
          onNavigateToTab={handleNavigate}
        />
      )}

      {activeSubTab === 'analytics' && (
        <ProfileAnalytics isDark={isDark} />
      )}

      {activeSubTab === 'settings' && (
        <ProfileSettings
          isDark={isDark}
          onSaved={() => handleSubTabChange('profile')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabItemActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
  },
});
