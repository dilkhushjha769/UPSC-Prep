import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useStudy } from '@/context/StudyContext';
import { BW_THEME } from '@/constants/bwTheme';
import {
  AddTaskModal,
  CleanStreakDashboard,
  ConfigModal,
  CurrentAffairsView,
  FocusSummaryModal,
  FocusTimerModal,
  LogSessionModal,
  MainsAnswerModal,
  MCQPracticeModal,
  MobileBottomNav,
  NavTab,
  NotificationsModal,
  NotificationsScreen,
  ProfileView,
  SidebarNav,
  StreakInfoModal,
} from '@/components/upsc';
import { PrelimsScreen } from '@/components/prelims/PrelimsScreen';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { MockTestDashboard, ActiveMockTestScreen } from '@/components/mockTest';

export default function AppScreen() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeMockTestId, setActiveMockTestId] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const { isLoading } = useStudy();
  const { width } = useWindowDimensions();

  const isDark = themeMode === 'dark';
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  const shellBg = theme.bg;
  const useLightIcons = isDark;

  // Bottom inset is applied by MobileBottomNav on mobile (so it's not applied twice).
  const shellEdges: Edge[] = isDesktop
    ? ['top', 'bottom', 'left', 'right']
    : ['top', 'left', 'right'];

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="small" color={theme.textPrimary} />
      </SafeAreaView>
    );
  }

  // Active Mock Test Screen (takes over view when a test is launched)
  if (activeMockTestId) {
    return (
      <View style={[styles.rootContainer, { backgroundColor: shellBg }]}>
        <BlueTextureBackground isDark={isDark} />
        <StatusBar barStyle={useLightIcons ? 'light-content' : 'dark-content'} />
        <ActiveMockTestScreen
          testId={activeMockTestId}
          onClose={() => setActiveMockTestId(null)}
          isDark={isDark}
        />
        {!isDesktop && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleTheme}
            accessibilityLabel="Toggle Theme"
            style={[
              styles.floatingThemeBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark
                  ? 'rgba(251, 191, 36, 0.14)'
                  : 'rgba(99, 102, 241, 0.1)',
                borderColor: isDark
                  ? 'rgba(251, 191, 36, 0.32)'
                  : 'rgba(99, 102, 241, 0.25)',
              },
            ]}>
            {isDark ? (
              <Sun size={19} color="#FBBF24" strokeWidth={2.3} />
            ) : (
              <Moon size={19} color="#4F46E5" strokeWidth={2.3} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={shellEdges}
      style={[styles.rootContainer, { backgroundColor: shellBg }]}>
      <BlueTextureBackground isDark={isDark} />
      <StatusBar barStyle={useLightIcons ? 'light-content' : 'dark-content'} />

      <View style={styles.layoutRow}>
        {/* Left Sidebar on Desktop */}
        {isDesktop && (
          <SidebarNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        )}

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {activeTab === 'home' && (
            <CleanStreakDashboard
              isDark={isDark}
              onOpenPrelims={() => setActiveTab('prelims')}
              onOpenMockTests={() => setActiveTab('mock-test')}
              onOpenProfile={() => setActiveTab('profile')}
              onOpenNotifications={() => setActiveTab('notifications')}
              onToggleTheme={toggleTheme}
            />
          )}

          {activeTab === 'prelims' && (
            <PrelimsScreen isDark={isDark} onBack={() => setActiveTab('home')} />
          )}

          {activeTab === 'mock-test' && (
            <MockTestDashboard
              onStartTest={(testId) => setActiveMockTestId(testId)}
              isDark={isDark}
            />
          )}

          {activeTab === 'current-affairs' && (
            <CurrentAffairsView isDark={isDark} />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              isDark={isDark}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsScreen
              isDark={isDark}
              onBack={() => setActiveTab('home')}
              onToggleTheme={toggleTheme}
            />
          )}
        </View>
      </View>

      {/* Floating Theme Changer across non-home screens on mobile (excluding notifications which has its own header theme button) */}
      {!isDesktop && activeTab !== 'home' && activeTab !== 'notifications' && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          accessibilityLabel="Toggle Theme"
          style={[
            styles.floatingThemeBtn,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            {
              backgroundColor: isDark
                ? 'rgba(251, 191, 36, 0.14)'
                : 'rgba(99, 102, 241, 0.1)',
              borderColor: isDark
                ? 'rgba(251, 191, 36, 0.32)'
                : 'rgba(99, 102, 241, 0.25)',
            },
          ]}>
          {isDark ? (
            <Sun size={19} color="#FBBF24" strokeWidth={2.3} />
          ) : (
            <Moon size={19} color="#4F46E5" strokeWidth={2.3} />
          )}
        </TouchableOpacity>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!isDesktop && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isDark={isDark}
        />
      )}

      {/* Modals for Quick Interaction */}
      <FocusTimerModal isDark={isDark} />
      <FocusSummaryModal isDark={isDark} />
      <LogSessionModal isDark={isDark} />
      <AddTaskModal isDark={isDark} />
      <StreakInfoModal isDark={isDark} />
      <ConfigModal isDark={isDark} />
      <NotificationsModal isDark={isDark} />
      <MCQPracticeModal isDark={isDark} />
      <MainsAnswerModal isDark={isDark} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
  },
  floatingThemeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    zIndex: 999,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
