import React, { useState, useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Calendar as CalendarIcon, X } from 'lucide-react-native';
import { PALETTE, Typography } from '@/constants/colors';
import { Calendar } from './Calendar';
import { Button } from './Button';

// ============================================================================
// ICONS
// ============================================================================

function ChevronLeftIcon({
  size = 14,
  color = '#FFFFFF',
}: {
  size?: number;
  color: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

function ChevronRightIcon({
  size = 14,
  color = '#FFFFFF',
}: {
  size?: number;
  color: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

// ============================================================================
// TYPES
// ============================================================================

export interface WeeklyCalendarDay {
  dateStr: string; // 'YYYY-MM-DD'
  dayName: string; // 'Mon', 'Tue', 'Wed', etc.
  dayNumber: number; // 12, 13, 14, etc.
  isToday?: boolean;
  isPast?: boolean;
  isFuture?: boolean;
  isCompleted?: boolean;
  hasData?: boolean;
  totalMinutes?: number;
}

export interface WeeklyCalendarProps {
  /** Array of 7 days for the current week. If not passed, computed dynamically. */
  days?: WeeklyCalendarDay[];
  /** Currently selected date key ('YYYY-MM-DD'). */
  selectedDate?: string | null;
  /** Callback fired when a day circle is tapped. */
  onSelectDate: (dateStr: string) => void;
  /** Whether dark mode is active. Defaults to true. */
  isDark?: boolean;
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
  /** Marked dates for the full month calendar. */
  markedDates?: Record<string, { marked?: boolean; dotColor?: string }>;
}

// ============================================================================
// HELPERS
// ============================================================================

export function formatDayName(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim();
  const firstThree = clean.slice(0, 3);
  return firstThree.charAt(0).toUpperCase() + firstThree.slice(1).toLowerCase();
}

export function getWeekDaysForOffset(
  offset: number = 0,
  baseDays?: WeeklyCalendarDay[]
): WeeklyCalendarDay[] {
  const now = new Date();
  // Start on Sunday (0) as shown in the reference image (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
  const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek + offset * 7);

  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days: WeeklyCalendarDay[] = [];

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const baseMap = new Map<string, WeeklyCalendarDay>();
  if (baseDays && baseDays.length > 0) {
    baseDays.forEach((d) => baseMap.set(d.dateStr, d));
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;

    const isToday = dateStr === todayKey;
    const isPast = dateStr < todayKey;
    const isFuture = dateStr > todayKey;

    const existing = baseMap.get(dateStr);

    days.push({
      dateStr,
      dayName: WEEKDAY_NAMES[i],
      dayNumber: d.getDate(),
      isToday,
      isPast,
      isFuture,
      isCompleted: existing ? existing.isCompleted : undefined,
      hasData: existing ? existing.hasData : undefined,
      totalMinutes: existing ? existing.totalMinutes : undefined,
    });
  }

  return days;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WeeklyCalendar({
  days,
  selectedDate,
  onSelectDate,
  isDark = true,
  style,
  markedDates,
}: WeeklyCalendarProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isCompact = width < 420;

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  // Compute today's local date string 'YYYY-MM-DD'
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Get days for currently selected week offset
  const displayedWeekDays = useMemo(() => {
    return getWeekDaysForOffset(weekOffset, days);
  }, [weekOffset, days]);

  // Display Month & Year from Wednesday (mid-week) of displayed week
  const monthTitle = useMemo(() => {
    if (!displayedWeekDays || displayedWeekDays.length === 0) return '';
    const midDay = displayedWeekDays[3] || displayedWeekDays[0];
    const [y, m, d] = midDay.dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [displayedWeekDays]);

  // Theme tokens
  const theme = {
    cardBg: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
    cardBorder: isDark ? '#383A42' : '#F0F1F5',
    weekdayNormal: isDark ? '#8F9098' : '#71727A',
    dateNormal: isDark ? '#FFFFFF' : '#1F2024',

    // Future disabled text tokens (clearly legible)
    futureWeekdayText: isDark ? '#71727A' : '#8F9098',
    futureDateText: isDark ? '#8F9098' : '#71727A',

    // Solid circle badges
    solidBlueBg: PALETTE.highlight.primary, // #006FFD (Current day)
    solidGreenBg: PALETTE.support.success.medium, // #3AC0A0 (Past streak days)

    whiteText: '#FFFFFF',
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          paddingHorizontal: isCompact ? 12 : isMobile ? 14 : 16,
          paddingVertical: isCompact ? 14 : 18,
        },
        style,
      ]}>
      {/* ========================================================= */}
      {/* HEADER: Month & Year Title on Left, Arrows & Calendar on Right */}
      {/* ========================================================= */}
      <View style={styles.cardHeader}>
        <Text
          numberOfLines={1}
          style={[
            styles.headerTitle,
            {
              color: theme.dateNormal,
              fontSize: isCompact ? 15 : isMobile ? 16 : 18,
            },
          ]}>
          {monthTitle}
        </Text>

        <View
          style={[
            styles.headerControls,
            { gap: isCompact ? 5 : isMobile ? 6 : 8 },
          ]}>
          {/* Previous Week Arrow Button */}
          <Pressable
            onPress={() => setWeekOffset((prev) => prev - 1)}
            style={({ pressed }) => [
              styles.arrowBtn,
              {
                width: isCompact ? 28 : isMobile ? 30 : 32,
                height: isCompact ? 28 : isMobile ? 30 : 32,
                borderRadius: isCompact ? 14 : isMobile ? 15 : 16,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F5F9',
                borderColor: isDark ? '#383A42' : '#E8E9F1',
              },
              pressed && { opacity: 0.7 },
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            ]}
            hitSlop={6}
            accessibilityLabel="Previous week">
            <ChevronLeftIcon size={isCompact ? 12 : 14} color={theme.dateNormal} />
          </Pressable>

          {/* Next Week Arrow Button (Disabled if currently on today's week) */}
          <Pressable
            onPress={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
            disabled={weekOffset >= 0}
            style={({ pressed }) => [
              styles.arrowBtn,
              {
                width: isCompact ? 28 : isMobile ? 30 : 32,
                height: isCompact ? 28 : isMobile ? 30 : 32,
                borderRadius: isCompact ? 14 : isMobile ? 15 : 16,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F5F9',
                borderColor: isDark ? '#383A42' : '#E8E9F1',
                opacity: weekOffset >= 0 ? 0.35 : 1,
              },
              pressed && weekOffset < 0 && { opacity: 0.7 },
              Platform.OS === 'web' &&
                ({ cursor: weekOffset >= 0 ? 'default' : 'pointer' } as object),
            ]}
            hitSlop={6}
            accessibilityLabel="Next week">
            <ChevronRightIcon size={isCompact ? 12 : 14} color={theme.dateNormal} />
          </Pressable>

          {/* Calendar Button (Opens Calendar in Modal Form) */}
          <Button
            variant="secondary"
            size="sm"
            title="Calendar"
            isDark={isDark}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FE',
              borderColor: isDark ? '#494A50' : '#D4D6DD',
              borderWidth: 1,
              paddingHorizontal: isCompact ? 8 : isMobile ? 10 : 14,
              paddingVertical: isCompact ? 5 : isMobile ? 6 : 8,
              borderRadius: isCompact ? 8 : 10,
            }}
            textStyle={{
              color: isDark ? '#FFFFFF' : '#1F2024',
              fontWeight: '600',
              fontSize: isCompact ? 11 : 12,
            }}
            leftIcon={
              <CalendarIcon
                size={isCompact ? 11 : 13}
                color={isDark ? '#8F9098' : '#71727A'}
              />
            }
            onPress={() => setIsCalendarModalOpen(true)}
          />
        </View>
      </View>

      {/* ========================================================= */}
      {/* 7-DAY ROW: Weekday on Top, Date in CIRCLE Below           */}
      {/* ========================================================= */}
      <View style={styles.daysRow}>
        {displayedWeekDays.map((day) => {
          const isToday = Boolean(day.isToday || day.dateStr === todayKey);
          const isPast = Boolean(day.isPast || (!isToday && day.dateStr < todayKey));
          const isFuture = !isToday && !isPast;
          const isSelected = selectedDate === day.dateStr;

          // Circle background & borders
          let circleBg: string = 'transparent';
          let circleBorderColor: string = isDark ? '#383A42' : '#E8E9F1';
          let circleBorderWidth: number = 1;
          let labelColor: string = theme.weekdayNormal;
          let numberColor: string = theme.dateNormal;

          if (isToday) {
            // Current day is solid blue circle with white text
            circleBg = theme.solidBlueBg;
            numberColor = theme.whiteText;
            circleBorderWidth = isSelected ? 2.5 : 1;
            circleBorderColor = isSelected
              ? isDark ? '#FFFFFF' : '#1F2024'
              : theme.solidBlueBg;
            labelColor = PALETTE.highlight.primary;
          } else if (isPast) {
            // Past days are solid green circles with white text
            circleBg = theme.solidGreenBg;
            numberColor = theme.whiteText;
            circleBorderWidth = isSelected ? 2.5 : 1;
            circleBorderColor = isSelected
              ? isDark ? '#FFFFFF' : '#1F2024'
              : theme.solidGreenBg;
            labelColor = theme.weekdayNormal;
          } else {
            // Future days: Disabled circle outline with muted text
            circleBg = 'transparent';
            circleBorderWidth = 1;
            circleBorderColor = isDark ? '#383A42' : '#E8E9F1';
            labelColor = theme.futureWeekdayText;
            numberColor = theme.futureDateText;
          }

          return (
            <View key={day.dateStr} style={[styles.dayCol, { gap: isCompact ? 5 : 8 }]}>
              {/* Weekday Label on Top (Mon, Tue, Wed, Thu, Fri, Sat, Sun) */}
              <Text
                style={[
                  styles.dayLabelText,
                  {
                    color: labelColor,
                    fontWeight: isToday ? '700' : isPast ? '600' : '500',
                    fontSize: isCompact ? 10 : isMobile ? 11 : 12,
                  },
                ]}>
                {formatDayName(day.dayName)}
              </Text>

              {/* Circular Date Badge */}
              <Pressable
                onPress={() => {
                  if (!isFuture) {
                    onSelectDate(day.dateStr);
                  }
                }}
                disabled={isFuture}
                style={({ pressed }) => [
                  styles.circleDate,
                  {
                    width: isCompact ? 33 : isMobile ? 36 : 40,
                    height: isCompact ? 33 : isMobile ? 36 : 40,
                    borderRadius: isCompact ? 16.5 : isMobile ? 18 : 20,
                    backgroundColor: circleBg,
                    borderColor: circleBorderColor,
                    borderWidth: circleBorderWidth,
                  },
                  pressed && !isFuture && {
                    opacity: 0.8,
                  },
                  Platform.OS === 'web' &&
                    ({
                      cursor: isFuture ? 'default' : 'pointer',
                    } as object),
                ]}>
                <Text
                  style={[
                    styles.circleNumberText,
                    {
                      color: numberColor,
                      fontWeight: isToday || isPast ? '700' : '500',
                      fontSize: isCompact ? 13 : isMobile ? 14 : 16,
                    },
                  ]}>
                  {day.dayNumber}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* ========================================================= */}
      {/* CALENDAR MODAL FORM                                       */}
      {/* ========================================================= */}
      <Modal
        visible={isCalendarModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarModalOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsCalendarModalOpen(false)}>
          <Pressable
            style={[
              styles.modalContentCard,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                borderColor: isDark ? '#383A42' : '#E8E9F1',
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Text style={[styles.modalTitle, { color: theme.dateNormal }]}>
                  Study Calendar
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.weekdayNormal }]}>
                  Monthly Overview & History
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F4F5F9',
                    borderColor: isDark ? '#383A42' : '#E8E9F1',
                  },
                  pressed && { opacity: 0.7 },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                ]}
                onPress={() => setIsCalendarModalOpen(false)}
                hitSlop={8}
                accessibilityLabel="Close calendar">
                <X size={16} color={theme.dateNormal} />
              </Pressable>
            </View>

            {/* Figma Full Month Calendar Component */}
            <Calendar
              isDark={isDark}
              selectedDate={selectedDate || undefined}
              maxDate={todayKey}
              markedDates={markedDates}
              onSelectDate={(_date, dateKey) => {
                if (dateKey <= todayKey) {
                  onSelectDate(dateKey);
                  setIsCalendarModalOpen(false);
                }
              }}
              style={styles.calendarModalOverride}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  dayLabelText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.2,
  },
  circleDate: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNumberText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalTitleGroup: {
    gap: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarModalOverride: {
    maxWidth: '100%',
    width: '100%',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 4,
  },
});

export default WeeklyCalendar;
