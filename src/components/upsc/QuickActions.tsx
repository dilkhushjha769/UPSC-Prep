import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FileQuestion,
  History,
  Newspaper,
  PenLine,
  Play,
  PlusCircle,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface QuickActionsProps {
  isDark: boolean;
}

export function QuickActions({ isDark }: QuickActionsProps) {
  const {
    setIsFocusModalOpen,
    setIsAddTaskModalOpen,
    setIsMCQModalOpen,
    setIsMainsModalOpen,
    setIsHistoryModalOpen,
    recordArticleRead,
  } = useStudy();

  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const actions = [
    {
      id: 'focus',
      title: 'Focus Session',
      subtitle: 'Timer & Topic',
      icon: Play,
      color: colors.primary,
      bgColor: colors.primarySoft,
      onPress: () => setIsFocusModalOpen(true),
    },
    {
      id: 'task',
      title: 'Add Study Task',
      subtitle: 'Schedule target',
      icon: PlusCircle,
      color: '#FF5500',
      bgColor: isDark ? '#1C203A' : '#EEF2FF',
      onPress: () => setIsAddTaskModalOpen(true),
    },
    {
      id: 'mcq',
      title: 'Practice MCQs',
      subtitle: 'Prelims quiz',
      icon: FileQuestion,
      color: colors.accentEmerald,
      bgColor: isDark ? '#162822' : '#ECFDF5',
      onPress: () => setIsMCQModalOpen(true),
    },
    {
      id: 'current_affairs',
      title: 'Current Affairs',
      subtitle: 'Editorial note',
      icon: Newspaper,
      color: colors.accentSky,
      bgColor: isDark ? '#132838' : '#F0F9FF',
      onPress: () => recordArticleRead(),
    },
    {
      id: 'mains',
      title: 'Mains Answer',
      subtitle: 'Draft 150w prompt',
      icon: PenLine,
      color: colors.accentPink,
      bgColor: isDark ? '#2E1928' : '#FDF2F8',
      onPress: () => setIsMainsModalOpen(true),
    },
    {
      id: 'history',
      title: 'Study History',
      subtitle: 'View past logs',
      icon: History,
      color: colors.accentAmber,
      bgColor: isDark ? '#2D2517' : '#FFFBEB',
      onPress: () => setIsHistoryModalOpen(true),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Quick Actions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            High-impact shortcuts for daily preparation routines
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <TouchableOpacity
              key={act.id}
              activeOpacity={0.8}
              onPress={act.onPress}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorderSubtle,
                },
              ]}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: act.bgColor },
                ]}>
                <Icon size={18} color={act.color} />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                  {act.title}
                </Text>
                <Text
                  style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                  {act.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  headerRow: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
