import React, { useState, useMemo } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Bell,
  Moon,
  Plus,
  Sun,
} from 'lucide-react-native';
import { PALETTE, SemanticColors, Typography } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';
import { ExamReadinessCard } from './ExamReadinessCard';
import { PrelimsCountdownCard } from './PrelimsCountdownCard';
import { StreakCalendarModal } from './modals/StreakCalendarModal';
import { QuickEditProfileModal } from './modals/QuickEditProfileModal';
import { WeeklyCalendar, Button } from '@/components/ui';
import { TaskCard, TaskFormModal } from '@/components/tasks';

interface CleanStreakDashboardProps {
  isDark: boolean;
  onOpenPrelims?: () => void;
  onOpenMockTests?: () => void;
  onOpenTasks?: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onToggleTheme?: () => void;
}

export function CleanStreakDashboard({
  isDark,
  onOpenPrelims,
  onOpenMockTests,
  onOpenTasks,
  onOpenProfile,
  onOpenNotifications,
  onToggleTheme,
}: CleanStreakDashboardProps) {
  const {
    weekDays,
    sessions,
    tasks,
    toggleTask,
    addTask,
    deleteTask,
    setIsNotificationsModalOpen,
    config,
  } = useStudy();

  const { width } = useWindowDimensions();
  const theme = isDark ? SemanticColors.dark : SemanticColors.light;
  const isDesktop = width >= 768;

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  const todayKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Currently selected date on the calendar (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [isStreakCalendarModalOpen, setIsStreakCalendarModalOpen] = useState(false);

  // User name for header matching reference "Hello, Roam"
  const userGreetingName = useMemo(() => {
    if (config.firstName) return config.firstName;
    if (config.aspirantName) return config.aspirantName.split(' ')[0];
    return 'Roam';
  }, [config.firstName, config.aspirantName]);

  // Marked dates for the Calendar (session dates get a dot indicator)
  const markedDatesMap = useMemo(() => {
    const map: Record<string, { marked?: boolean; dotColor?: string }> = {};
    sessions.forEach((s) => {
      if (s.date) {
        map[s.date] = {
          marked: true,
          dotColor: PALETTE.support.success.medium,
        };
      }
    });
    return map;
  }, [sessions]);

  // Tasks scheduled for the currently selected date
  const selectedDateTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [tasks, selectedDate]);

  const formatLongDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingBottom: isDesktop ? 60 : 32 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* ========================================================= */}
      {/* 1. TOP GREETING & ACTIONS HEADER (MATCHING FIGMA MOCKUP)  */}
      {/* ========================================================= */}
      <View style={styles.headerRow}>
        {/* Left: Avatar & Greeting ("Hello, Roam" / "Level Up") */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsQuickEditOpen(true)}
          style={styles.headerProfileGroup}
          accessibilityLabel="Update profile photo and name">
          {config.avatarUri ? (
            <Image
              source={{ uri: config.avatarUri }}
              style={styles.headerAvatarImage}
            />
          ) : (
            <View style={styles.headerAvatarCircle}>
              <Text style={styles.headerAvatarInitial}>
                {userGreetingName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.headerTextCol}>
            <Text
              style={[styles.greetingTitle, { color: theme.textPrimary }]}
              numberOfLines={1}>
              Hello, {userGreetingName}
            </Text>
            <Text style={[styles.levelSubtext, { color: theme.textSecondary }]}>
              Level Up
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right: Round Action Buttons (Theme Switch & Notification Bell) */}
        <View style={styles.headerIconsCluster}>
          {!isDesktop && onToggleTheme && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.headerCircleBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark
                    ? PALETTE.neutral.dark.surface
                    : '#FFFFFF',
                  borderColor: isDark ? '#383A42' : '#F0F1F5',
                },
              ]}>
              {isDark ? (
                <Sun size={18} color="#FBBF24" strokeWidth={2.3} />
              ) : (
                <Moon size={18} color={PALETTE.highlight.primary} strokeWidth={2.3} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              } else {
                setIsNotificationsModalOpen(true);
              }
            }}
            accessibilityLabel="Notifications"
            style={[
              styles.headerCircleBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              {
                backgroundColor: isDark
                  ? PALETTE.neutral.dark.surface
                  : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <Bell size={20} color={theme.textPrimary} strokeWidth={2.2} />
            <View
              style={[
                styles.notificationBadgeDot,
                {
                  backgroundColor: PALETTE.support.error.dark,
                  borderColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================= */}
      {/* 2. UPSC PRELIMS COUNTDOWN TIMER BANNER                   */}
      {/* ========================================================= */}
      <PrelimsCountdownCard isDark={isDark} onOpenPrelims={onOpenPrelims} />

      {/* ========================================================= */}
      {/* 3. 7-DAY CAPSULE STREAK CARD (EXACT AS IN FIGMA REFERENCE) */}
      {/* ========================================================= */}
      <WeeklyCalendar
        days={weekDays}
        selectedDate={selectedDate}
        onSelectDate={(dateStr) => {
          if (dateStr <= todayKey) {
            setSelectedDate(dateStr);
          }
        }}
        markedDates={markedDatesMap}
        isDark={isDark}
      />

      {/* ========================================================= */}
      {/* 4. MY TASKS FOR SELECTED DATE                             */}
      {/* ========================================================= */}
      <View
        style={[
          styles.dayDetailCard,
          {
            backgroundColor: isDark
              ? PALETTE.neutral.dark.surface
              : '#FFFFFF',
            borderColor: isDark ? '#383A42' : '#F0F1F5',
          },
        ]}>
        <View style={styles.cleanDetailHeader}>
          <View style={styles.cleanDetailHeaderLeft}>
            <Text style={[styles.cleanDateTitle, { color: theme.textPrimary }]}>
              My Tasks
            </Text>
            <View
              style={[
                styles.cleanTodayBadge,
                {
                  backgroundColor: PALETTE.highlight.primary,
                },
              ]}>
              <Text
                style={[
                  styles.cleanTodayBadgeText,
                  { color: '#FFFFFF' },
                ]}>
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'TASK' : 'TASKS'}
              </Text>
            </View>
          </View>

          <View style={styles.headerControlsInline}>
            {Boolean(onOpenTasks) && (
              <Button
                variant="tertiary"
                size="sm"
                title="View All →"
                isDark={isDark}
                onPress={onOpenTasks}
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              title="Add"
              isDark={isDark}
              leftIcon={<Plus size={12} color={isDark ? '#6FBAFF' : PALETTE.highlight.primary} />}
              onPress={() => setIsTaskModalOpen(true)}
            />
          </View>
        </View>

        {/* List of Tasks for this Date with their chosen colors */}
        {selectedDateTasks.length > 0 ? (
          <View style={styles.tasksListGap}>
            {selectedDateTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isDark={isDark}
                onToggleComplete={(id) => toggleTask(id)}
                onDelete={(id) => deleteTask(id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.cleanEmptyState}>
            <Text style={[styles.cleanEmptyText, { color: theme.textMuted }]}>
              No tasks for {formatLongDate(selectedDate) || 'this date'}.
            </Text>
            <View style={{ marginTop: 8 }}>
              <Button
                variant="primary"
                size="sm"
                title="Add Task"
                isDark={isDark}
                leftIcon={<Plus size={12} color="#FFFFFF" />}
                onPress={() => setIsTaskModalOpen(true)}
              />
            </View>
          </View>
        )}
      </View>

      {/* ========================================================= */}
      {/* 6. EXAM READINESS & ALL INDIA RANK CARD                   */}
      {/* ========================================================= */}
      <ExamReadinessCard isDark={isDark} onOpenPrelims={onOpenPrelims} />

      {/* Monthly Streak History Modal */}
      <StreakCalendarModal
        isDark={isDark}
        isOpen={isStreakCalendarModalOpen}
        onClose={() => setIsStreakCalendarModalOpen(false)}
      />

      {/* Task Creation Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialDate={selectedDate}
        isDark={isDark}
        onSave={async (newTask) => {
          await addTask(newTask);
        }}
      />

      {/* Quick Profile Editor Modal */}
      <QuickEditProfileModal
        isOpen={isQuickEditOpen}
        onClose={() => setIsQuickEditOpen(false)}
        isDark={isDark}
      />
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingTop: 4,
  },
  headerProfileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerAvatarEmoji: {
    fontSize: 26,
    textAlign: 'center',
  },
  headerAvatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
  headerTextCol: {
    justifyContent: 'center',
    gap: 2,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.3,
  },
  levelSubtext: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  headerIconsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  notificationBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  dayDetailCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  cleanDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cleanDetailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cleanDateTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  cleanTodayBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cleanTodayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.4,
  },
  cleanEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  cleanEmptyText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  headerControlsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tasksListGap: {
    gap: 8,
  },
});

export default CleanStreakDashboard;
