import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Clock, Trash2 } from 'lucide-react-native';
import { PALETTE, Typography } from '@/constants/colors';
import { StudyTask, TaskColorTag } from '@/types/study';
import { getTaskColors } from '@/constants/taskColors';

interface TaskCardProps {
  task: StudyTask;
  isDark?: boolean;
  colorTagOverride?: TaskColorTag;
  onToggleComplete?: (id: string) => void;
  onPress?: (task: StudyTask) => void;
  onDelete?: (id: string) => void;
}

export function TaskCard({
  task,
  isDark = false,
  colorTagOverride,
  onToggleComplete,
  onPress,
  onDelete,
}: TaskCardProps) {
  const effectiveTag = colorTagOverride || (task.colorTag && task.colorTag !== 'default' ? task.colorTag : undefined);
  const colorTheme = getTaskColors(effectiveTag, isDark);
  const isCompleted = Boolean(task.completed || task.status === 'completed');

  // Display Title & Description (simple & clear)
  const taskTitle = task.title || task.topic || (task.subject ? `${task.subject} Task` : 'Untitled Task');
  const taskDesc = task.description || task.subtitle || task.notes || '';

  // Clean time string (e.g. "10:30 AM" or "10:30 AM - 12:00 PM")
  const displayTime = useMemo(() => {
    if (!task.startTime) return '';
    if (task.endTime && !task.startTime.includes('-')) {
      return `${task.startTime} - ${task.endTime}`;
    }
    return task.startTime;
  }, [task.startTime, task.endTime]);

  const metaColor = colorTheme.isColored ? colorTheme.subtext : (isDark ? '#9EA0AA' : '#6B6E7D');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress && onPress(task)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colorTheme.bg,
          borderColor: colorTheme.border,
        },
      ]}>
      {/* Left Colored Accent Bar */}
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: colorTheme.isColored
              ? colorTheme.chipDot
              : (isDark ? '#494A50' : '#D4D6DD'),
          },
        ]}
      />

      {/* Main Content: Time, Title & Description */}
      <View style={styles.contentCol}>
        {Boolean(displayTime) && (
          <View style={styles.timeRow}>
            <Clock size={11} color={metaColor} strokeWidth={2.2} />
            <Text style={[styles.metaText, { color: metaColor }]}>
              {displayTime}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.titleText,
            {
              color: colorTheme.text,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
              opacity: isCompleted ? 0.65 : 1,
            },
          ]}
          numberOfLines={2}>
          {taskTitle}
        </Text>

        {Boolean(taskDesc) && (
          <Text
            style={[
              styles.descText,
              {
                color: colorTheme.subtext,
                opacity: isCompleted ? 0.6 : 0.95,
              },
            ]}
            numberOfLines={2}>
            {taskDesc}
          </Text>
        )}
      </View>

      {/* Right Actions: Delete & Completion Checkbox */}
      <View style={styles.actionsRight}>
        {onDelete && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            hitSlop={8}
            style={styles.deleteBtn}
            accessibilityLabel="Delete task">
            <Trash2
              size={15}
              color={colorTheme.isColored ? colorTheme.subtext : (isDark ? '#71727A' : '#8F9098')}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            if (onToggleComplete) onToggleComplete(task.id);
          }}
          hitSlop={8}
          accessibilityLabel="Toggle complete"
          style={[
            styles.checkCircle,
            {
              borderColor: isCompleted
                ? '#10B981'
                : (colorTheme.isColored ? colorTheme.subtext : (isDark ? '#494A50' : '#D4D6DD')),
              backgroundColor: isCompleted
                ? '#10B981'
                : 'transparent',
            },
          ]}>
          {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 4,
    gap: 12,
  },
  accentBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  contentCol: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.2,
  },
  descText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Typography.fontFamily,
    lineHeight: 18,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    padding: 4,
    opacity: 0.8,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
