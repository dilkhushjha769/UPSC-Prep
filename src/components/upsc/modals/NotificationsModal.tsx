import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  Bell,
  BookOpen,
  Flame,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface NotificationsModalProps {
  isDark: boolean;
}

export function NotificationsModal({ isDark }: NotificationsModalProps) {
  const {
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    streak,
  } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const notifications = [
    {
      id: 'streak_alert',
      title: 'Active Study Streak Protected 🔥',
      message: `You are on a ${streak.currentStreak}-day study streak! Complete your daily focus target to advance to Day ${
        streak.currentStreak + 1
      }.`,
      time: 'Just now',
      icon: Flame,
      color: '#EF4444',
      bg: isDark ? '#361D22' : '#FEF2F2',
    },
    {
      id: 'daily_quote',
      title: 'Daily Aspirant Motivation',
      message:
        '“It does not matter how slowly you go as long as you do not stop.” — Confucius. Every syllabus topic revised today is one step closer to LBSNAA.',
      time: '2 hours ago',
      icon: Sparkles,
      color: colors.primary,
      bg: colors.primarySoft,
    },
    {
      id: 'prelims_mock',
      title: 'Weekend Full-Length Mock Test',
      message:
        'Prelims GS Paper 1 Mock #8 is scheduled for Sunday 9:30 AM. Revise Polity & Modern History topics.',
      time: '1 day ago',
      icon: Award,
      color: colors.accentAmber,
      bg: isDark ? '#2D2316' : '#FFFBEB',
    },
    {
      id: 'editorial_digest',
      title: 'Current Affairs Reminder',
      message:
        'Remember to extract GS-2 governance points and GS-3 economic indicators from today’s editorial pages.',
      time: 'Yesterday',
      icon: BookOpen,
      color: colors.accentEmerald,
      bg: isDark ? '#162822' : '#ECFDF5',
    },
  ];

  return (
    <Modal
      visible={isNotificationsModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsNotificationsModalOpen(false)}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Bell size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Notifications & Study Alerts
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsNotificationsModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {notifications.map((item) => {
                const Icon = item.icon;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? '#1B1A28' : '#FBFBFE',
                        borderColor: colors.cardBorderSubtle,
                      },
                    ]}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: item.bg },
                      ]}>
                      <Icon size={16} color={item.color} />
                    </View>
                    <View style={styles.contentCol}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[styles.notifTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                        <Text
                          style={[styles.timeText, { color: colors.textMuted }]}>
                          {item.time}
                        </Text>
                      </View>
                      <Text
                        style={[styles.message, { color: colors.textSecondary }]}>
                        {item.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setIsNotificationsModalOpen(false)}
              style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.closeModalBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    padding: 18,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
  closeModalBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
