import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

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
import { MainsDashboard } from '@/components/mains';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { MockTestDashboard, ActiveMockTestScreen } from '@/components/mockTest';
import { TasksScreen } from '@/components/tasks';

import { SemanticColors } from '@/constants/colors';
import { useAppTheme } from '@/context/ThemeContext';

export default function AppScreen() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeMockTestId, setActiveMockTestId] = useState<string | null>(null);
  const [openMockTestHistoryOnMount, setOpenMockTestHistoryOnMount] = useState(false);
  const { isDark, themeMode, toggleTheme } = useAppTheme();
  const { isLoading } = useStudy();
  const { width } = useWindowDimensions();

  const handleNavigateToTab = useCallback(
    (tabKey: any, params?: { testId?: string; openHistory?: boolean }) => {
      const normalizedTab = tabKey === 'mockTest' || tabKey === 'mock-test' ? 'mock-test' : tabKey;
      if (params?.testId) {
        setActiveMockTestId(params.testId);
      } else if (params?.openHistory) {
        setOpenMockTestHistoryOnMount(true);
      }
      setActiveTab(normalizedTab);
    },
    []
  );

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  const shellBg = SemanticColors[themeMode].background;
  const useLightIcons = isDark;

  // Bottom inset is applied by MobileBottomNav on mobile (so it's not applied twice).
  const shellEdges: Edge[] = isDesktop
    ? ['top', 'bottom', 'left', 'right']
    : ['top', 'left', 'right'];

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
        {isDesktop && activeTab !== 'mains' && (
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
              onOpenMains={() => setActiveTab('mains')}
              onOpenMockTests={() => setActiveTab('mock-test')}
              onOpenTasks={() => setActiveTab('tasks')}
              onOpenProfile={() => setActiveTab('profile')}
              onOpenNotifications={() => setActiveTab('notifications')}
              onOpenCurrentAffairs={() => setActiveTab('current-affairs')}
              onToggleTheme={toggleTheme}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksScreen
              isDark={isDark}
              onOpenNotifications={() => setActiveTab('notifications')}
              onBackToHome={() => setActiveTab('home')}
              onToggleTheme={toggleTheme}
            />
          )}

          {activeTab === 'prelims' && (
            <PrelimsScreen
              isDark={isDark}
              onBack={() => setActiveTab('home')}
              onToggleTheme={toggleTheme}
            />
          )}

          {activeTab === 'mains' && (
            <MainsDashboard
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onBackToHome={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'mock-test' && (
            <MockTestDashboard
              onStartTest={(testId) => setActiveMockTestId(testId)}
              onToggleTheme={toggleTheme}
              onBack={() => setActiveTab('home')}
              isDark={isDark}
              initialShowHistory={openMockTestHistoryOnMount}
            />
          )}

          {activeTab === 'current-affairs' && (
            <CurrentAffairsView isDark={isDark} />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              isDark={isDark}
              onNavigateToTab={handleNavigateToTab}
              onToggleTheme={toggleTheme}
              onBack={() => setActiveTab('home')}
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
});
