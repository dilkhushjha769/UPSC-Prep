import React, { useState, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react-native';
import { PALETTE, SemanticColors, Typography } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';
import { StudyTask } from '@/types/study';
import { TaskCard } from './TaskCard';
import { TaskFormModal } from './TaskFormModal';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui';
import { resolveTaskColorTag } from '@/constants/taskColors';

type TaskFilter = 'today' | 'todo' | 'done' | 'all';
type TaskSortOption = 'newest' | 'title';

const FILTER_BUTTONS: { id: TaskFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'todo', label: 'To Do' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All Tasks' },
];

interface TasksScreenProps {
  isDark?: boolean;
  onOpenNotifications?: () => void;
  onBackToHome?: () => void;
  onToggleTheme?: () => void;
}

export function TasksScreen({
  isDark = false,
  onOpenNotifications,
  onBackToHome,
  onToggleTheme,
}: TasksScreenProps) {
  const { tasks, toggleTask, addTask, deleteTask } = useStudy();
  const theme = isDark ? SemanticColors.dark : SemanticColors.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sortBy, setSortBy] = useState<TaskSortOption>('newest');

  // User's local date ('YYYY-MM-DD')
  const todayKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Friendly formatted date string for today (e.g. "Wednesday, Oct 28")
  const formattedTodayDate = useMemo(() => {
    const [y, m, d] = todayKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [todayKey]);

  // Friendly formatted date string for selected date
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (selectedDate === todayKey) {
      return `Today, ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDate, todayKey]);

  // Rolling 7-day strip centered on current week
  const weekStrip = useMemo(() => {
    const now = new Date();
    const days = [];
    const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = -2; i <= 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      days.push({
        dateStr,
        dayAbbr: WEEK_DAYS[d.getDay()],
        dayNumber: d.getDate(),
        isToday: dateStr === todayKey,
      });
    }
    return days;
  }, [todayKey]);

  // Filter tasks based on activeFilter (Today, To Do, Done, All Tasks), search, and sorting
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // 1. Mutually exclusive filter button handling:
        if (activeFilter === 'today') {
          // Display all tasks scheduled for the current date, including both completed and pending
          if (task.date !== todayKey) return false;
        } else if (activeFilter === 'todo') {
          // Display only incomplete or pending tasks scheduled for the current date
          if (task.date !== todayKey) return false;
          if (task.completed || task.status === 'completed') return false;
        } else if (activeFilter === 'done') {
          // Display only completed tasks scheduled for the current date
          if (task.date !== todayKey) return false;
          if (!task.completed && task.status !== 'completed') return false;
        } else if (activeFilter === 'all') {
          // Display every task across all dates, regardless of completion status
          // No date filtering applied
        }

        // 2. Search query: checks title, topic, description, subject, notes, time, date
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const title = (task.title || task.topic || '').toLowerCase();
          const desc = (task.description || task.subtitle || task.notes || '').toLowerCase();
          const subject = (task.subject || '').toLowerCase();
          const time = (task.startTime || '').toLowerCase();
          const date = (task.date || '').toLowerCase();
          return (
            title.includes(q) ||
            desc.includes(q) ||
            subject.includes(q) ||
            time.includes(q) ||
            date.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          const titleA = a.title || a.topic || '';
          const titleB = b.title || b.topic || '';
          return titleA.localeCompare(titleB);
        }
        if (activeFilter === 'all') {
          // In All Tasks view, sort chronologically by date
          if (a.date && b.date && a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
        }
        return b.id.localeCompare(a.id);
      });
  }, [tasks, todayKey, activeFilter, searchQuery, sortBy]);

  // Group tasks by date for "All Tasks" view so dates are not repeated on every card
  const groupedTasks = useMemo(() => {
    if (activeFilter !== 'all') {
      return null;
    }
    const map = new Map<string, StudyTask[]>();
    for (const task of filteredTasks) {
      const key = task.date || 'Unscheduled';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }

    const groups: { dateKey: string; formattedDate: string; tasks: StudyTask[] }[] = [];
    map.forEach((taskList, dateKey) => {
      let formatted = dateKey;
      if (dateKey === todayKey) {
        formatted = 'Today';
      } else if (dateKey !== 'Unscheduled') {
        try {
          const parts = dateKey.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            const dateObj = new Date(y, m, d);
            formatted = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
          }
        } catch {
          formatted = dateKey;
        }
      }
      groups.push({
        dateKey,
        formattedDate: formatted,
        tasks: taskList,
      });
    });
    return groups;
  }, [filteredTasks, activeFilter, todayKey]);

  // Context-aware tasks for progress calculation
  const tasksForProgress = useMemo(() => {
    if (activeFilter === 'today' || activeFilter === 'todo' || activeFilter === 'done') {
      return tasks.filter((t) => t.date === todayKey);
    }
    if (selectedDate && activeFilter !== 'all') {
      return tasks.filter((t) => t.date === selectedDate);
    }
    return tasks;
  }, [tasks, activeFilter, todayKey, selectedDate]);

  const tasksCompletedCount = useMemo(() => {
    return tasksForProgress.filter((t) => t.completed || t.status === 'completed').length;
  }, [tasksForProgress]);

  const tasksProgressPct = tasksForProgress.length > 0
    ? Math.min(100, (tasksCompletedCount / tasksForProgress.length) * 100)
    : 0;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingBottom: isDesktop ? 60 : 40 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* ========================================================= */}
      {/* 1. TOP HEADER ("My tasks", Search, Notification)          */}
      {/* ========================================================= */}
      <View style={styles.topHeaderRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.mainHeading, { color: theme.textPrimary }]}>
            My tasks
          </Text>
        </View>

        <View style={styles.headerIconsCluster}>
          {/* Search Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsSearchActive((prev) => !prev)}
            accessibilityLabel="Search tasks"
            style={[
              styles.circleIconBtn,
              {
                backgroundColor: isSearchActive
                  ? 'rgba(0, 111, 253, 0.12)'
                  : (isDark ? PALETTE.neutral.dark.surface : '#FFFFFF'),
                borderColor: isSearchActive ? PALETTE.highlight.primary : (isDark ? '#383A42' : '#F0F1F5'),
              },
            ]}>
            <Search
              size={18}
              color={isSearchActive ? PALETTE.highlight.primary : theme.textPrimary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>

          {/* Theme Toggle Button (Mobile & Desktop) */}
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.circleIconBtn,
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                  borderColor: isDark ? '#383A42' : '#F0F1F5',
                },
              ]}>
              {isDark ? (
                <Sun size={17} color="#FBBF24" strokeWidth={2.2} />
              ) : (
                <Moon size={17} color={PALETTE.highlight.primary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          )}

          {/* Notification Bell Button (with PRIMARY BLUE badge dot) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onOpenNotifications && onOpenNotifications()}
            accessibilityLabel="Notifications"
            style={[
              styles.circleIconBtn,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <Bell size={18} color={theme.textPrimary} strokeWidth={2.2} />
            <View
              style={[
                styles.blueNotificationDot,
                {
                  backgroundColor: PALETTE.highlight.primary, // #006FFD (Primary Blue)
                  borderColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Input Bar */}
      {isSearchActive && (
        <View
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
              borderColor: isDark ? '#383A42' : '#E8E9F1',
            },
          ]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            placeholderTextColor={theme.textMuted}
            autoFocus
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={15} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* 2. FILTER BUTTONS ROW (STANDALONE AS IN FIGMA/MOCKUP)     */}
      {/* ========================================================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsScroll}>
        {FILTER_BUTTONS.map((pill) => {
          const isActive = activeFilter === pill.id;
          return (
            <TouchableOpacity
              key={pill.id}
              activeOpacity={0.8}
              onPress={() => {
                setActiveFilter(pill.id);
                if (pill.id !== 'all') {
                  setSelectedDate(todayKey);
                }
              }}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isActive
                    ? PALETTE.highlight.primary // #006FFD (Primary Blue)
                    : (isDark ? PALETTE.neutral.dark.surface : '#FFFFFF'),
                  borderColor: isActive
                    ? PALETTE.highlight.primary
                    : (isDark ? '#383A42' : '#E8E9F1'),
                },
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color: isActive ? '#FFFFFF' : theme.textPrimary,
                    fontWeight: isActive ? '700' : '600',
                  },
                ]}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ========================================================= */}
      {/* 3. DAILY SCHEDULE CARD (Days Strip & Header)              */}
      {/* ========================================================= */}
      <View
        style={[
          styles.scheduleStripCard,
          {
            backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
            borderColor: isDark ? '#383A42' : '#F0F1F5',
          },
        ]}>
        <View style={styles.scheduleHeaderRow}>
          <View style={styles.scheduleTitleGroup}>
            <Text style={[styles.scheduleHeading, { color: theme.textPrimary }]}>
              Daily Schedule
            </Text>
            <Text style={[styles.scheduleSubtext, { color: theme.textSecondary }]}>
              {activeFilter === 'all'
                ? 'All tasks across all dates'
                : formattedTodayDate}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setActiveFilter('today');
              setSelectedDate(todayKey);
            }}
            accessibilityLabel="Filter today"
            style={[
              styles.todayCapsuleBtn,
              {
                backgroundColor: (selectedDate === todayKey && activeFilter === 'today')
                  ? PALETTE.highlight.primary // #006FFD (Solid Blue)
                  : (isDark ? PALETTE.neutral.dark.darkest : '#F8F9FE'),
                borderColor: (selectedDate === todayKey && activeFilter === 'today')
                  ? PALETTE.highlight.primary
                  : (isDark ? '#383A42' : '#E8E9F1'),
              },
            ]}>
            <CalendarIcon
              size={12}
              color={(selectedDate === todayKey && activeFilter === 'today') ? '#FFFFFF' : (isDark ? '#FFFFFF' : PALETTE.highlight.primary)}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.todayCapsuleText,
                {
                  color: (selectedDate === todayKey && activeFilter === 'today') ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: (selectedDate === todayKey && activeFilter === 'today') ? '700' : '600',
                },
              ]}>
              Today
            </Text>
          </TouchableOpacity>
        </View>

        {/* Days Strip with PRIMARY BLUE selected capsule */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysStripScroll}>
          {weekStrip.map((day) => {
            const isSelected = selectedDate === day.dateStr && activeFilter !== 'all';
            return (
              <TouchableOpacity
                key={day.dateStr}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedDate(day.dateStr);
                  if (day.dateStr === todayKey) {
                    if (activeFilter === 'all') setActiveFilter('today');
                  }
                }}
                style={[
                  styles.dayStripCapsule,
                  {
                    backgroundColor: isSelected
                      ? PALETTE.highlight.primary // #006FFD (Primary Blue)
                      : (isDark ? PALETTE.neutral.dark.darkest : '#F8F9FE'),
                    borderColor: isSelected
                      ? PALETTE.highlight.primary
                      : (isDark ? '#383A42' : '#E8E9F1'),
                  },
                ]}>
                <Text
                  style={[
                    styles.dayStripAbbr,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                    },
                  ]}>
                  {day.dayAbbr}
                </Text>
                <Text
                  style={[
                    styles.dayStripNumber,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textPrimary,
                      fontWeight: isSelected ? '800' : '700',
                    },
                  ]}>
                  {day.dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ========================================================= */}
      {/* 3.5 TASK PROGRESS BAR                                     */}
      {/* ========================================================= */}
      {tasksForProgress.length > 0 && (
        <View
          style={[
            styles.tasksProgressBarCard,
            {
              backgroundColor: isDark ? '#141824' : '#F8FAFC',
              borderColor: isDark ? '#262D3D' : '#E2E8F0',
            },
          ]}>
          <View style={styles.tasksProgressBarHeader}>
            <Text style={[styles.tasksProgressBarLabel, { color: theme.textSecondary }]}>
              {activeFilter === 'today'
                ? "Today's Task Completion"
                : activeFilter === 'all'
                ? 'Total Task Completion'
                : `${formattedSelectedDate} Task Completion`}
            </Text>
            <Text
              style={[
                styles.tasksProgressBarValue,
                { color: tasksProgressPct === 100 ? '#10B981' : theme.textPrimary },
              ]}>
              {tasksCompletedCount} of {tasksForProgress.length} tasks ({Math.round(tasksProgressPct)}%)
            </Text>
          </View>
          <ProgressBar
            progress={tasksProgressPct}
            height={3}
            fillColor={tasksProgressPct === 100 ? '#10B981' : PALETTE.highlight.primary}
            trackColor={isDark ? 'rgba(255, 255, 255, 0.08)' : '#E8E9F1'}
            borderRadius={2}
          />
        </View>
      )}

      {/* ========================================================= */}
      {/* 4. CONTROLS BAR: Sort & + Add Task Button                 */}
      {/* ========================================================= */}
      <View style={styles.controlsRow}>
        <View style={styles.leftControlsGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSortBy((prev) => (prev === 'newest' ? 'title' : 'newest'))}
            style={[
              styles.controlBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FE',
                borderColor: isDark ? '#383A42' : '#E8E9F1',
              },
            ]}>
            <SlidersHorizontal size={13} color={theme.textPrimary} strokeWidth={2.2} />
            <Text style={[styles.controlBtnText, { color: theme.textPrimary }]}>
              {sortBy === 'newest' ? 'Newest first' : 'By title'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Primary Blue "+ Add Task" Button */}
        <Button
          variant="primary"
          size="sm"
          title="Add Task"
          leftIcon={<Plus size={14} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={() => setIsFormModalOpen(true)}
        />
      </View>

      {/* ========================================================= */}
      {/* 5. TASKS LIST OR CLEAN EMPTY STATE                        */}
      {/* ========================================================= */}
      <View style={styles.tasksListContainer}>
        {groupedTasks && groupedTasks.length > 0 ? (
          groupedTasks.map((group, groupIdx) => (
            <View key={group.dateKey} style={styles.dateGroupContainer}>
              <View style={styles.dateGroupHeaderRow}>
                <Text style={[styles.dateGroupHeaderText, { color: theme.textSecondary }]}>
                  {group.formattedDate}
                </Text>
                <View
                  style={[
                    styles.dateGroupCountBadge,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F1F5' },
                  ]}>
                  <Text style={[styles.dateGroupCountText, { color: theme.textSecondary }]}>
                    {group.tasks.length}
                  </Text>
                </View>
              </View>

              <View style={styles.dateGroupTasksList}>
                {group.tasks.map((task, taskIdx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDark={isDark}
                    colorTagOverride={resolveTaskColorTag(task.colorTag, groupIdx * 3 + taskIdx)}
                    onToggleComplete={(id) => toggleTask(id)}
                    onDelete={(id) => deleteTask(id)}
                  />
                ))}
              </View>
            </View>
          ))
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              isDark={isDark}
              colorTagOverride={resolveTaskColorTag(task.colorTag, idx)}
              onToggleComplete={(id) => toggleTask(id)}
              onDelete={(id) => deleteTask(id)}
            />
          ))
        ) : searchQuery.trim() ? (
          <View
            style={[
              styles.cleanEmptyCard,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#F0F1F5',
                },
              ]}>
              <Search size={20} color={theme.textMuted} strokeWidth={2} />
            </View>

            <Text style={[styles.emptyHeading, { color: theme.textPrimary }]}>
              No tasks found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              No tasks matching &quot;{searchQuery.trim()}&quot;. Try searching with other keywords.
            </Text>

            <Button
              variant="secondary"
              size="sm"
              title="Clear Search"
              isDark={isDark}
              leftIcon={<X size={14} color={theme.textPrimary} strokeWidth={2.5} />}
              onPress={() => setSearchQuery('')}
              style={styles.emptyAddBtn}
            />
          </View>
        ) : activeFilter === 'todo' ? (
          <View
            style={[
              styles.cleanEmptyCard,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                },
              ]}>
              <CheckCircle2 size={24} color="#10B981" strokeWidth={2.2} />
            </View>

            <Text style={[styles.emptyHeading, { color: theme.textPrimary }]}>
              All tasks completed!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              You have no pending tasks remaining for today. Great job staying on track!
            </Text>

            <Button
              variant="primary"
              size="sm"
              title="Add New Task"
              leftIcon={<Plus size={14} color="#FFFFFF" strokeWidth={2.5} />}
              onPress={() => setIsFormModalOpen(true)}
              style={styles.emptyAddBtn}
            />
          </View>
        ) : activeFilter === 'done' ? (
          <View
            style={[
              styles.cleanEmptyCard,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#F0F1F5',
                },
              ]}>
              <CheckCircle2 size={24} color={PALETTE.highlight.primary} strokeWidth={2} />
            </View>

            <Text style={[styles.emptyHeading, { color: theme.textPrimary }]}>
              No completed tasks yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Tasks completed today will appear here. Check off tasks in &quot;To Do&quot; when finished!
            </Text>

            <Button
              variant="secondary"
              size="sm"
              title="View To Do Tasks"
              isDark={isDark}
              onPress={() => setActiveFilter('todo')}
              style={styles.emptyAddBtn}
            />
          </View>
        ) : activeFilter === 'all' ? (
          <View
            style={[
              styles.cleanEmptyCard,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#F0F1F5',
                },
              ]}>
              <CalendarIcon size={22} color={theme.textMuted} strokeWidth={2} />
            </View>

            <Text style={[styles.emptyHeading, { color: theme.textPrimary }]}>
              No tasks found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              There are no tasks recorded across any dates. Tap below to create your first task!
            </Text>

            <Button
              variant="primary"
              size="sm"
              title="Create Task"
              leftIcon={<Plus size={14} color="#FFFFFF" strokeWidth={2.5} />}
              onPress={() => setIsFormModalOpen(true)}
              style={styles.emptyAddBtn}
            />
          </View>
        ) : (
          <View
            style={[
              styles.cleanEmptyCard,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#F0F1F5',
              },
            ]}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#F0F1F5',
                },
              ]}>
              <CalendarIcon size={22} color={PALETTE.highlight.primary} strokeWidth={2} />
            </View>

            <Text style={[styles.emptyHeading, { color: theme.textPrimary }]}>
              No tasks for today
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              You have no tasks scheduled for today. Tap below to plan your study session!
            </Text>

            <Button
              variant="primary"
              size="sm"
              title="Add Task for Today"
              leftIcon={<Plus size={14} color="#FFFFFF" strokeWidth={2.5} />}
              onPress={() => setIsFormModalOpen(true)}
              style={styles.emptyAddBtn}
            />
          </View>
        )}
      </View>

      {/* ========================================================= */}
      {/* 6. SIMPLE TASK CREATION MODAL                             */}
      {/* ========================================================= */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialDate={selectedDate}
        isDark={isDark}
        onSave={async (newTask) => {
          await addTask(newTask);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  headerTitleGroup: {
    flex: 1,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.4,
  },
  headerIconsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  blueNotificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    padding: 0,
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
      } as any,
    }),
  },
  filterPillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.1,
  },
  scheduleStripCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitleGroup: {
    gap: 2,
  },
  scheduleHeading: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.2,
  },
  scheduleSubtext: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  todayCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  todayCapsuleText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  daysStripScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  dayStripCapsule: {
    width: 52,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayStripAbbr: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  dayStripNumber: {
    fontSize: 16,
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  leftControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  tasksListContainer: {
    gap: 8,
  },
  dateGroupContainer: {
    gap: 8,
    marginBottom: 14,
  },
  dateGroupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  dateGroupHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.1,
  },
  dateGroupCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dateGroupCountText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  dateGroupTasksList: {
    gap: 6,
  },
  cleanEmptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: PALETTE.highlight.primary, // #006FFD
  },
  tasksProgressBarCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tasksProgressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasksProgressBarLabel: {
    fontSize: 11.5,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
  tasksProgressBarValue: {
    fontSize: 11.5,
    fontFamily: Typography.fontFamily,
    fontWeight: '700',
  },
});
