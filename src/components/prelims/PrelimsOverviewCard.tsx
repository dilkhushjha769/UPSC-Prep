import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BookCheck, Brain, CircleCheck, Layers } from 'lucide-react-native';

interface PrelimsOverviewCardProps {
  isDark?: boolean;
  paperTitle: string;
  subjectsCount: number;
  totalQuestions: number;
  solvedQuestions: number;
}

export function PrelimsOverviewCard({
  isDark = true,
  paperTitle,
  subjectsCount,
  totalQuestions,
  solvedQuestions,
}: PrelimsOverviewCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure actual container width to prevent collision in split-screen/sidebar/mobile
  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const isCompact = containerWidth > 0 ? containerWidth < 720 : windowWidth < 768;

  const isCSAT = paperTitle.toLowerCase().includes('csat') || paperTitle.includes('Paper 2');
  const progressPercent =
    totalQuestions > 0 ? Math.min(100, Math.round((solvedQuestions / totalQuestions) * 100)) : 0;

  // SVG Circular Gauge parameters
  const size = isCompact ? 48 : 54;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progressPercent / 100));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  const colors = {
    cardBg: isDark ? '#25272D' : '#FFFFFF',
    cardBorder: isDark ? '#35373F' : '#E8E9F1',
    innerBarBg: isDark ? '#202227' : '#F8F9FE',
    innerBarBorder: isDark ? '#30323A' : '#E8E9F1',
    metricBadgeBg: isDark ? '#2A2C33' : '#EFF1F7',
    textPrimary: isDark ? '#F5F5F7' : '#1F2024',
    textSecondary: isDark ? '#A7ABB5' : '#71727A',
    divider: isDark ? '#35373F' : '#E8E9F1',
    trackCircle: isDark ? '#343740' : '#E8E9F1',
  };

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
      onLayout={handleLayout}
    >
      {isCompact ? (
        /* ========================================================================= */
        /* COMPACT / MOBILE LAYOUT: Clean stacked sections, absolutely zero overlap  */
        /* ========================================================================= */
        <View style={styles.compactContainer}>
          {/* Top Row: General Studies Academic Icon Tile + Title + Subtitle */}
          <View style={styles.compactHeaderRow}>
            <View
              style={[
                styles.mainIconBadge,
                {
                  backgroundColor: isDark ? (isCSAT ? '#231838' : '#162338') : (isCSAT ? '#F5EDFF' : '#EAF2FF'),
                  borderColor: isDark ? (isCSAT ? '#3D275E' : '#243B5E') : (isCSAT ? '#D8B4FE' : '#B4DBFF'),
                },
              ]}
            >
              {isCSAT ? (
                <Brain size={22} color="#A855F7" strokeWidth={2.2} />
              ) : (
                <BookCheck size={22} color="#2F80ED" strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.compactTitleBlock}>
              <Text style={[styles.paperTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {paperTitle}
              </Text>
              <Text style={[styles.paperSubtitle, { color: colors.textSecondary }]}>
                {subjectsCount} Subjects • {totalQuestions.toLocaleString()} Verified Questions
              </Text>
            </View>
          </View>

          {/* Bottom Bar: 3 Cleanly Separated Metric Columns in a unified surface */}
          <View
            style={[
              styles.compactMetricsBar,
              { backgroundColor: colors.innerBarBg, borderColor: colors.innerBarBorder },
            ]}
          >
            {/* 1. Total Questions */}
            <View style={styles.compactStatItem}>
              <View style={styles.compactStatLabelRow}>
                <Layers size={13} color={colors.textSecondary} strokeWidth={2.2} />
                <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>
                  Total
                </Text>
              </View>
              <Text style={[styles.compactStatValue, { color: colors.textPrimary }]}>
                {totalQuestions.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.compactDivider, { backgroundColor: colors.divider }]} />

            {/* 2. Solved Questions */}
            <View style={styles.compactStatItem}>
              <View style={styles.compactStatLabelRow}>
                <CircleCheck
                  size={13}
                  color={solvedQuestions > 0 ? '#35C98A' : colors.textSecondary}
                  strokeWidth={2.2}
                />
                <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>
                  Solved
                </Text>
              </View>
              <Text
                style={[
                  styles.compactStatValue,
                  { color: solvedQuestions > 0 ? '#35C98A' : colors.textPrimary },
                ]}
              >
                {solvedQuestions.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.compactDivider, { backgroundColor: colors.divider }]} />

            {/* 3. Circular Progress Ring */}
            <View style={styles.compactStatItem}>
              <View style={styles.compactStatLabelRow}>
                <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>
                  Progress
                </Text>
              </View>
              <View style={styles.compactProgressRingBox}>
                <View style={{ width: 34, height: 34, position: 'relative' }}>
                  <Svg width={34} height={34} viewBox="0 0 34 34">
                    <Circle
                      cx={17}
                      cy={17}
                      r={13}
                      stroke={colors.trackCircle}
                      strokeWidth={3}
                      fill="none"
                    />
                    <Circle
                      cx={17}
                      cy={17}
                      r={13}
                      stroke="#35C98A"
                      strokeWidth={3}
                      strokeDasharray={`${2 * Math.PI * 13} ${2 * Math.PI * 13}`}
                      strokeDashoffset={2 * Math.PI * 13 * (1 - clampedProgress)}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 17 17)"
                    />
                  </Svg>
                  <View style={styles.compactGaugeOverlay}>
                    <Text style={[styles.compactGaugePercentText, { color: colors.textPrimary }]}>
                      {progressPercent}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* ========================================================================= */
        /* DESKTOP / WIDE LAYOUT: Structured row with ample breathing room           */
        /* ========================================================================= */
        <View style={styles.desktopRow}>
          {/* Section 1: General Studies Academic Icon Tile + Title + Subtitle */}
          <View style={styles.desktopPaperSection}>
            <View
              style={[
                styles.mainIconBadge,
                {
                  backgroundColor: isDark ? (isCSAT ? '#231838' : '#162338') : (isCSAT ? '#F5EDFF' : '#EAF2FF'),
                  borderColor: isDark ? (isCSAT ? '#3D275E' : '#243B5E') : (isCSAT ? '#D8B4FE' : '#B4DBFF'),
                },
              ]}
            >
              {isCSAT ? (
                <Brain size={24} color="#A855F7" strokeWidth={2.2} />
              ) : (
                <BookCheck size={24} color="#2F80ED" strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.desktopTitleBlock}>
              <Text style={[styles.paperTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {paperTitle}
              </Text>
              <Text style={[styles.paperSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subjectsCount} Subjects • {totalQuestions.toLocaleString()} Verified Questions
              </Text>
            </View>
          </View>

          <View style={[styles.desktopDivider, { backgroundColor: colors.divider }]} />

          {/* Section 2: Metrics (Total Questions & Solved) */}
          <View style={styles.desktopMetricsSection}>
            {/* Total Questions */}
            <View style={styles.metricItem}>
              <View style={[styles.metricIconBadge, { backgroundColor: colors.metricBadgeBg }]}>
                <Layers size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
              <View style={styles.metricTextCol}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Questions</Text>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                  {totalQuestions.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={[styles.desktopDividerSubtle, { backgroundColor: colors.divider }]} />

            {/* Solved */}
            <View style={styles.metricItem}>
              <View
                style={[
                  styles.metricIconBadge,
                  {
                    backgroundColor:
                      solvedQuestions > 0 ? (isDark ? '#1E382B' : '#E8FDF0') : colors.metricBadgeBg,
                  },
                ]}
              >
                <CircleCheck
                  size={16}
                  color={solvedQuestions > 0 ? '#35C98A' : colors.textSecondary}
                  strokeWidth={2.2}
                />
              </View>
              <View style={styles.metricTextCol}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Solved</Text>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                  {solvedQuestions.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.desktopDivider, { backgroundColor: colors.divider }]} />

          {/* Section 3: Circular Progress Gauge */}
          <View style={styles.desktopProgressSection}>
            <View style={{ width: size, height: size, position: 'relative' }}>
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={colors.trackCircle}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#35C98A"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </Svg>
              <View style={styles.gaugeTextOverlay}>
                <Text style={[styles.desktopGaugePercent, { color: colors.textPrimary }]}>
                  {progressPercent}%
                </Text>
              </View>
            </View>
            <Text style={[styles.desktopGaugeLabel, { color: colors.textSecondary }]}>
              Overall Progress
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)' } as object,
      default: {},
    }),
  },
  // Compact / Mobile Layout Styles
  compactContainer: {
    padding: 16,
    gap: 14,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactTitleBlock: {
    flex: 1,
  },
  compactMetricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  compactStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  compactStatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  compactStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  compactStatValue: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  compactDivider: {
    width: 1,
    height: 28,
  },
  compactProgressRingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactGaugeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactGaugePercentText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  // Desktop Row Styles
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 18,
  },
  desktopPaperSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 2.2,
    minWidth: 260,
  },
  desktopTitleBlock: {
    flex: 1,
  },
  mainIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  paperSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  desktopDivider: {
    width: 1,
    height: 42,
  },
  desktopDividerSubtle: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  desktopMetricsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    minWidth: 220,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextCol: {},
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  desktopProgressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1.4,
    justifyContent: 'flex-end',
    minWidth: 140,
  },
  desktopGaugePercent: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  desktopGaugeLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  gaugeTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
