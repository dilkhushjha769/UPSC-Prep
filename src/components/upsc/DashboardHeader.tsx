import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  Calendar,
  Moon,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface DashboardHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function DashboardHeader({ isDark, onToggleTheme }: DashboardHeaderProps) {
  const { config, setIsNotificationsModalOpen, setIsConfigModalOpen } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  // Calculate dynamic greeting based on current local hour
  const now = new Date();
  const currentHour = now.getHours();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    timeGreeting = 'Good evening';
  }

  // Format date: e.g., "Saturday, 24 October 2026"
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate days remaining to target exam date
  const targetDate = new Date(config.targetExamDate);
  const diffTime = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <View style={styles.container}>
      {/* Top Bar: Profile & Actions */}
      <View style={styles.topRow}>
        {/* Left: Avatar & Greeting */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsConfigModalOpen(true)}
            style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {config.aspirantName ? config.aspirantName.charAt(0).toUpperCase() : 'A'}
            </Text>
            <View style={[styles.avatarBadge, { backgroundColor: colors.accentEmerald }]} />
          </TouchableOpacity>

          <View style={styles.greetingTextContainer}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
                {timeGreeting},
              </Text>
              <Sparkles size={14} color={colors.primary} style={{ marginLeft: 4 }} />
            </View>
            <Text style={[styles.aspirantName, { color: colors.textPrimary }]}>
              {config.aspirantName}
            </Text>
          </View>
        </View>

        {/* Right: Notification & Theme Toggle */}
        <View style={styles.actionsCluster}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsNotificationsModalOpen(true)}
            style={[
              styles.actionIconButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorderSubtle,
              },
            ]}>
            <Bell size={18} color={colors.textPrimary} />
            <View style={[styles.notificationDot, { backgroundColor: colors.accentPink }]} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleTheme}
            style={[
              styles.actionIconButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorderSubtle,
              },
            ]}>
            {isDark ? (
              <Sun size={18} color="#FBBF24" />
            ) : (
              <Moon size={18} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date & Exam Target Chip Bar */}
      <View style={styles.infoBar}>
        <View style={styles.dateRow}>
          <Calendar size={13} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsConfigModalOpen(true)}
          style={[
            styles.targetChip,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.cardBorder,
            },
          ]}>
          <Target size={13} color={colors.primary} />
          <Text style={[styles.targetChipText, { color: colors.primary }]}>
            {config.examPhase} • {daysRemaining} days left
          </Text>
        </TouchableOpacity>
      </View>

      {/* Understated Motivation */}
      <View style={styles.mottoRow}>
        <Text style={[styles.mottoText, { color: colors.textSecondary }]}>
          “Small, consistent steps lead to success. Stay committed today.”
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingTop: Platform.OS === 'web' ? 68 : 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingTextContainer: {
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  aspirantName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  targetChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  mottoRow: {
    marginTop: 10,
  },
  mottoText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '400',
  },
});
