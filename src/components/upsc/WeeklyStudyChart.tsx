import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import {
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';

interface WeeklyStudyChartProps {
  isDark: boolean;
}

export function WeeklyStudyChart({ isDark }: WeeklyStudyChartProps) {
  const { weekDays } = useStudy();
  const { width } = useWindowDimensions();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    weekDays.findIndex((d) => d.isToday) !== -1
      ? weekDays.findIndex((d) => d.isToday)
      : 3
  );

  // Calculate statistics from actual weekDays data
  const totalWeeklyMinutes = weekDays.reduce((acc, d) => acc + d.totalMinutes, 0);
  const weeklyTargetMinutes = 35 * 60; // 35 hours weekly target
  const weeklyTargetHours = 35;
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const averageDailyHours = (totalWeeklyMinutes / (7 * 60)).toFixed(1);
  const weeklyTargetCompletion = Math.min(
    100,
    Math.round((totalWeeklyMinutes / weeklyTargetMinutes) * 100)
  );

  // Find most productive day
  let maxMinutes = -1;
  let mostProductiveDay = weekDays[0] || { fullDayName: 'Monday', totalMinutes: 0 };
  weekDays.forEach((d) => {
    if (d.totalMinutes > maxMinutes) {
      maxMinutes = d.totalMinutes;
      mostProductiveDay = d;
    }
  });
  const mostProductiveHours = (mostProductiveDay.totalMinutes / 60).toFixed(1);

  // SVG Chart Layout parameters
  const chartHeight = 150;
  // Compute chart width based on parent card container
  const chartWidth = Math.min(width - 72, 600);
  const paddingX = 24;
  const paddingBottom = 28;
  const paddingTop = 20;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingTop - paddingBottom;

  // Max scale: at least 7 hours, or highest day
  const maxScaleHours = Math.max(7, Math.ceil(maxMinutes / 60));

  // Compute points for SVG curve
  const points = weekDays.map((d, index) => {
    const hours = d.totalMinutes / 60;
    const x = paddingX + (index / (weekDays.length - 1)) * availableWidth;
    const y = paddingTop + availableHeight - (hours / maxScaleHours) * availableHeight;
    return { x, y, hours, day: d };
  });

  // Construct smooth bezier curve path
  const buildSmoothPath = (pts: typeof points) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath(points);
  // Area path (closed at the bottom)
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${paddingTop + availableHeight} L ${points[0].x} ${
      paddingTop + availableHeight
    } Z`;

  const selectedDay = weekDays[selectedDayIndex] || weekDays[0];
  const selectedHours = (selectedDay.totalMinutes / 60).toFixed(1);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleIconRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.primarySoft },
              ]}>
              <TrendingUp size={16} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Weekly Study Analytics
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Hours tracked over the last 7 days
          </Text>
        </View>

        <View
          style={[
            styles.targetBadge,
            {
              backgroundColor: isDark ? '#232042' : '#FFEDE0',
              borderColor: colors.cardBorderSubtle,
            },
          ]}>
          <Text style={[styles.targetBadgeText, { color: colors.primary }]}>
            {weeklyTargetCompletion}% Weekly Goal
          </Text>
        </View>
      </View>

      {/* Top Stat Pills Row */}
      <View style={styles.statsRow}>
        {/* Total Time */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? '#1C1A2D' : '#FBFBFE',
              borderColor: colors.cardBorderSubtle,
            },
          ]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Weekly Total
          </Text>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {totalWeeklyHours}h{' '}
            <Text style={[styles.statSub, { color: colors.textMuted }]}>
              / {weeklyTargetHours}h
            </Text>
          </Text>
        </View>

        {/* Daily Average */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? '#1C1A2D' : '#FBFBFE',
              borderColor: colors.cardBorderSubtle,
            },
          ]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Daily Average
          </Text>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {averageDailyHours}h
          </Text>
        </View>

        {/* Most Productive */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? '#1C1A2D' : '#FBFBFE',
              borderColor: colors.cardBorderSubtle,
            },
          ]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Peak Day
          </Text>
          <Text style={[styles.statNumber, { color: colors.accentEmerald }]}>
            {mostProductiveDay.dayName}{' '}
            <Text style={[styles.statSub, { color: colors.textMuted }]}>
              ({mostProductiveHours}h)
            </Text>
          </Text>
        </View>
      </View>

      {/* Selected Day Tooltip / Indicator */}
      <View
        style={[
          styles.dayInspector,
          {
            backgroundColor: isDark ? '#232042' : '#F4F0FD',
            borderColor: colors.cardBorder,
          },
        ]}>
        <View style={styles.inspectorLeft}>
          <Clock size={14} color={colors.primary} />
          <Text style={[styles.inspectorDayName, { color: colors.textPrimary }]}>
            {selectedDay.fullDayName} ({selectedDay.dayNumber} {selectedDay.monthName})
          </Text>
        </View>
        <Text style={[styles.inspectorHours, { color: colors.primary }]}>
          {selectedHours} hours studied{' '}
          {selectedDay.isCompleted ? '• Goal Met' : ''}
        </Text>
      </View>

      {/* Elegant SVG Area & Line Chart (Inspired directly by the 3rd phone screen) */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#FF8A3D" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#chartGradient)" />

          {/* Curved Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={colors.primary}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive Data Points and Labels */}
          {points.map((pt, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <React.Fragment key={idx}>
                {/* Vertical guide line on selected point */}
                {isSelected && (
                  <Path
                    d={`M ${pt.x} ${pt.y} L ${pt.x} ${paddingTop + availableHeight}`}
                    stroke={colors.primary}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Outer Glow on Selected */}
                {isSelected && (
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill={colors.primary}
                    fillOpacity="0.25"
                  />
                )}

                {/* Point Circle */}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? '5.5' : '4'}
                  fill={isSelected ? colors.primary : colors.cardBg}
                  stroke={colors.primary}
                  strokeWidth="2.5"
                />

                {/* Day Label Text at bottom */}
                <SvgText
                  x={pt.x}
                  y={chartHeight - 6}
                  fontSize="11"
                  fontWeight={isSelected ? '800' : '600'}
                  fill={isSelected ? colors.primary : colors.textMuted}
                  textAnchor="middle">
                  {pt.day.dayName}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Day Selector Buttons for accessible touch targets */}
      <View style={styles.daySelectorRow}>
        {weekDays.map((d, index) => {
          const isSelected = index === selectedDayIndex;
          return (
            <TouchableOpacity
              key={d.dateStr}
              activeOpacity={0.7}
              onPress={() => setSelectedDayIndex(index)}
              style={[
                styles.dayTouchBtn,
                isSelected && {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}>
              <Text
                style={[
                  styles.dayTouchText,
                  { color: isSelected ? colors.primary : colors.textMuted },
                ]}>
                {d.dayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
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
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  targetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  targetBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  dayInspector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  inspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectorDayName: {
    fontSize: 12,
    fontWeight: '700',
  },
  inspectorHours: {
    fontSize: 12,
    fontWeight: '800',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
  },
  dayTouchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayTouchText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
