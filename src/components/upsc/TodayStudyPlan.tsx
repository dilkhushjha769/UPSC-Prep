import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Check,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { SUBJECT_COLORS, UPSC_THEME } from '@/constants/themeColors';
import { StudyTask } from '@/types/study';

interface TodayStudyPlanProps {
  isDark: boolean;
}

export function TodayStudyPlan({ isDark }: TodayStudyPlanProps) {
  const { tasks, toggleTask, deleteTask, setIsAddTaskModalOpen } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleBadgeRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {"Today's Study Plan"}
            </Text>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor:
                    completedCount === totalCount && totalCount > 0
                      ? colors.accentEmerald
                      : colors.primarySoft,
                },
              ]}>
              <Text
                style={[
                  styles.countBadgeText,
                  {
                    color:
                      completedCount === totalCount && totalCount > 0
                        ? '#FFFFFF'
                        : colors.primary,
                  },
                ]}>
                {completedCount}/{totalCount} Done
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Prioritized daily targets for targeted preparation
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsAddTaskModalOpen(true)}
          style={[
            styles.addTaskBtn,
            { backgroundColor: colors.primary },
          ]}>
          <Plus size={15} color="#FFFFFF" />
          <Text style={styles.addTaskBtnText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={32} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No tasks planned yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Build your momentum by scheduling your first study session for today.
          </Text>
          <TouchableOpacity
            style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsAddTaskModalOpen(true)}>
            <Text style={styles.emptyAddBtnText}>Add Your First Study Task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.taskList}>
          {tasks.map((task: StudyTask) => {
            const subjectStyle =
              SUBJECT_COLORS[task.subject] || SUBJECT_COLORS.Polity;

            let priorityBg = isDark ? '#1A2130' : '#F1F5F9';
            let priorityText = colors.textSecondary;
            if (task.priority === 'High') {
              priorityBg = isDark ? '#3D1E24' : '#FEE2E2';
              priorityText = '#DC2626';
            } else if (task.priority === 'Medium') {
              priorityBg = isDark ? '#3A2E1A' : '#FEF3C7';
              priorityText = '#D97706';
            }

            return (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  {
                    backgroundColor: isDark ? '#1C1B2B' : '#FBFBFE',
                    borderColor: task.completed
                      ? isDark
                        ? '#26332E'
                        : '#DCFCE7'
                      : colors.cardBorderSubtle,
                  },
                ]}>
                {/* Completion Checkbox */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleTask(task.id)}
                  style={[
                    styles.checkbox,
                    task.completed
                      ? {
                          backgroundColor: colors.accentEmerald,
                          borderColor: colors.accentEmerald,
                        }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: colors.cardBorder,
                        },
                  ]}>
                  {task.completed && (
                    <Check size={13} color="#FFFFFF" strokeWidth={3} />
                  )}
                </TouchableOpacity>

                {/* Task Details */}
                <View style={styles.taskContent}>
                  <View style={styles.taskMetaRow}>
                    <View
                      style={[
                        styles.subjectBadge,
                        {
                          backgroundColor: isDark ? '#28233C' : subjectStyle.bg,
                          borderColor: subjectStyle.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.subjectBadgeText,
                          { color: subjectStyle.text },
                        ]}>
                        {task.subject}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityBg },
                      ]}>
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          { color: priorityText },
                        ]}>
                        {task.priority}
                      </Text>
                    </View>

                    <View style={styles.durationRow}>
                      <Clock size={11} color={colors.textMuted} />
                      <Text
                        style={[styles.durationText, { color: colors.textMuted }]}>
                        {task.estimatedMinutes}m
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.taskTopic,
                      { color: colors.textPrimary },
                      task.completed && styles.taskCompletedText,
                    ]}>
                    {task.topic}
                  </Text>

                  {task.notes ? (
                    <Text
                      style={[styles.taskNotes, { color: colors.textSecondary }]}>
                      {task.notes}
                    </Text>
                  ) : null}
                </View>

                {/* Delete action */}
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => deleteTask(task.id)}
                  style={styles.deleteBtn}>
                  <Trash2 size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  taskList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 2,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  taskTopic: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  taskNotes: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  deleteBtn: {
    padding: 6,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  emptyAddBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
