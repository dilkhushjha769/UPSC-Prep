import React, { useState } from 'react';
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
  ProfileView,
  SidebarNav,
  StreakInfoModal,
} from '@/components/upsc';
import { PrelimsScreen } from '@/components/prelims/PrelimsScreen';

export default function AppScreen() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
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

  return (
    <SafeAreaView
      edges={shellEdges}
      style={[styles.rootContainer, { backgroundColor: shellBg }]}>
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
            />
          )}

          {activeTab === 'prelims' && (
            <PrelimsScreen isDark={isDark} onBack={() => setActiveTab('home')} />
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
