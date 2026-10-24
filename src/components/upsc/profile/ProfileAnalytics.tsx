// @ts-ignore
import React, { useState, useMemo } from 'react';
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
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import {
  Activity,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Flame,
  PieChart,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface ProfileAnalyticsProps {
  isDark: boolean;
}

interface SyllabusPaper {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  percent: number;
}

export function ProfileAnalytics({ isDark }: ProfileAnalyticsProps) {
  const { config, streak, weekDays, metrics } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isMobile = width < 720;
  const isNarrow = width < 500;

  // View mode for syllabus graph: 'radar' | 'bar'
  const [syllabusGraphMode, setSyllabusGraphMode] = useState<'radar' | 'bar'>('radar');
  const [selectedMockIndex, setSelectedMockIndex] = useState<number>(5);

  const syllabusBase = config.syllabusCompletionPercent ?? 68;
  const papers: SyllabusPaper[] = useMemo(
    () => [
      {
        id: 'gs1',
        name: 'GS-1: History, Heritage, Geography & Society',
        shortLabel: 'GS-1',
        description: 'Ancient, Medieval, Modern History, Art & Culture, Geography',
        percent: Math.min(100, Math.max(10, Math.round(syllabusBase * 1.08))),
      },
      {
        id: 'gs2',
        name: 'GS-2: Governance, Constitution, Polity & IR',
        shortLabel: 'GS-2',
        description: 'Polity, Laxmikanth, Governance, Social Justice, International Relations',
        percent: Math.min(100, Math.max(10, Math.round(syllabusBase * 1.18))),
      },
      {
        id: 'gs3',
        name: 'GS-3: Economy, S&T, Environment & Security',
        shortLabel: 'GS-3',
        description: 'Macroeconomics, Agriculture, Ecology, Disaster Mgmt, Internal Security',
        percent: Math.min(100, Math.max(10, Math.round(syllabusBase * 0.88))),
      },
      {
        id: 'gs4',
        name: 'GS-4: Ethics, Integrity & Aptitude',
        shortLabel: 'GS-4',
        description: 'Moral Thinkers, Probity in Governance, Applied Case Studies',
        percent: Math.min(100, Math.max(10, Math.round(syllabusBase * 1.02))),
      },
      {
        id: 'csat',
        name: 'CSAT: Paper-2 Aptitude & Comprehension',
        shortLabel: 'CSAT',
        description: 'Comprehension passages, Quantitative Aptitude, Logical Reasoning',
        percent: Math.min(100, Math.max(10, Math.round(syllabusBase * 1.22))),
      },
      {
        id: 'optional',
        name: `Optional: ${config.optionalSubject || 'Geography'}`,
        shortLabel: 'Optional',
        description: 'Core Optional theories, maps, thinkers and previous year questions',
        percent: Math.min(100, Math.max(10, Math.round(syllabusBase * 0.82))),
      },
    ],
    [syllabusBase, config.optionalSubject]
  );

  const overallAvg = Math.round(
    papers.reduce((sum: number, p: SyllabusPaper) => sum + p.percent, 0) / papers.length
  );

  // Live solved metrics
  const totalAttempted = metrics.mcqsAttempted || 35;
  const totalCorrect = metrics.mcqsCorrect || 29;
  const liveAccuracy = ((totalCorrect / totalAttempted) * 100).toFixed(1);

  // Mock test score progression history
  const mockScore = config.mockAverageScore || 108.5;
  const cutoffBenchmark = 88.0;

  const mockHistory = [
    { name: 'M-13', score: 92.5, accuracy: 68.0, date: '04 Oct' },
    { name: 'M-14', score: 96.0, accuracy: 71.2, date: '08 Oct' },
    { name: 'M-15', score: 101.5, accuracy: 73.0, date: '12 Oct' },
    { name: 'M-16', score: 98.0, accuracy: 70.5, date: '16 Oct' },
    { name: 'M-17', score: 104.5, accuracy: 74.8, date: '20 Oct' },
    { name: 'M-18', score: mockScore, accuracy: Number(liveAccuracy), date: 'Realtime' },
  ];

  const activeMock = mockHistory[selectedMockIndex] || mockHistory[5];
  const activeDiff = +(activeMock.score - cutoffBenchmark).toFixed(1);

  // Responsive chart widths
  const containerMaxWidth = Math.min(width - 40, 780);

  // -------------------------------------------------------------
  // RADAR CHART MATH (6 Axes)
  // -------------------------------------------------------------
  const radarSize = Math.max(260, Math.min(containerMaxWidth - 40, isNarrow ? 290 : 360));
  const radarCenter = radarSize / 2;
  const radarRadius = radarSize * 0.34;
  const numAxes = papers.length;

  const radarLevels = [0.25, 0.5, 0.75, 1.0];

  const getAxisPoint = (axisIndex: number, scale: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / numAxes;
    const r = radarRadius * scale;
    return {
      x: radarCenter + r * Math.cos(angle),
      y: radarCenter + r * Math.sin(angle),
    };
  };

  const dataPolygonPoints = papers
    .map((p: SyllabusPaper, i: number) => {
      const pt = getAxisPoint(i, p.percent / 100);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  // -------------------------------------------------------------
  // MOCK TEST TREND CHART MATH
  // -------------------------------------------------------------
  const trendHeight = 180;
  const trendPadLeft = 38;
  const trendPadRight = 20;
  const trendPadTop = 24;
  const trendPadBottom = 28;
  const trendPlotWidth = Math.max(180, containerMaxWidth - 36 - trendPadLeft - trendPadRight);
  const trendPlotHeight = trendHeight - trendPadTop - trendPadBottom;

  const minScore = 70;
  const maxScore = 130;

  const trendPoints = mockHistory.map((m: typeof mockHistory[0], i: number) => {
    const x = trendPadLeft + (i / (mockHistory.length - 1)) * trendPlotWidth;
    const normY = (m.score - minScore) / (maxScore - minScore);
    const y = trendPadTop + trendPlotHeight - normY * trendPlotHeight;
    return { x, y, ...m };
  });

  const cutoffY =
    trendPadTop +
    trendPlotHeight -
    ((cutoffBenchmark - minScore) / (maxScore - minScore)) * trendPlotHeight;

  // Build smooth bezier curve
  let trendCurve = '';
  if (trendPoints.length > 0) {
    trendCurve = `M ${trendPoints[0].x} ${trendPoints[0].y}`;
    for (let i = 0; i < trendPoints.length - 1; i++) {
      const p0 = trendPoints[i];
      const p1 = trendPoints[i + 1];
      const cx = (p0.x + p1.x) / 2;
      trendCurve += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  const trendArea =
    trendCurve +
    ` L ${trendPoints[trendPoints.length - 1].x} ${trendPadTop + trendPlotHeight} L ${
      trendPoints[0].x
    } ${trendPadTop + trendPlotHeight} Z`;

  // -------------------------------------------------------------
  // DONUT CHART MATH (Study Time Allocation)
  // -------------------------------------------------------------
  const donutSize = 130;
  const donutCenter = donutSize / 2;
  const donutRadius = 45;
  const circumference = 2 * Math.PI * donutRadius; // ~282.74

  const timeShares = [
    { label: 'GS Core (Papers 1-4)', share: 0.45, hours: '18.5h', color: isDark ? '#FFFFFF' : '#0F172A' },
    { label: 'Optional Subject', share: 0.25, hours: '10.2h', color: isDark ? '#A1A1AA' : '#475569' },
    { label: 'Current Affairs & Editorials', share: 0.18, hours: '7.5h', color: isDark ? '#71717A' : '#94A3B8' },
    { label: 'CSAT & Mains Practice', share: 0.12, hours: '5.0h', color: isDark ? '#3F3F46' : '#CBD5E1' },
  ];

  let accumulatedShare = 0;

  // -------------------------------------------------------------
  // WEEKLY OUTPUT BAR GRAPH
  // -------------------------------------------------------------
  const dailyGoalHours = (config.dailyGoalMinutes || 360) / 60;
  const maxWeeklyHours = Math.max(
    8,
    ...weekDays.map((d: typeof weekDays[0]) => d.totalMinutes / 60)
  );

  return (
    <View style={styles.container}>
      {/* 1. Header & KPI High-Contrast Tiles */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.cardSubTitle, { color: theme.textMuted }]}>
              UPSC PERFORMANCE ANALYTICS
            </Text>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Visual Graph Analytics Suite
            </Text>
          </View>
          <View
            style={[
              styles.overallBadge,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text
              style={[
                styles.overallBadgeText,
                { color: theme.buttonPrimaryText },
              ]}>
              {overallAvg}%
            </Text>
            <Text
              style={[
                styles.overallBadgeLabel,
                { color: theme.buttonPrimaryText },
              ]}>
              Syllabus
            </Text>
          </View>
        </View>

        {/* 4 Mini Graph KPI Cards */}
        <View style={[styles.kpiGrid, isMobile && { flexWrap: 'wrap' }]}>
          <View
            style={[
              styles.kpiCard,
              isMobile && { minWidth: '47%', flexBasis: '47%' },
              {
                backgroundColor: isDark ? '#141416' : '#F8FAFC',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Target size={13} color={theme.textPrimary} />
            <Text style={[styles.kpiVal, { color: theme.textPrimary }]}>
              {mockScore}
            </Text>
            <Text style={[styles.kpiLbl, { color: theme.textMuted }]}>
              Mock Avg (/200)
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              isMobile && { minWidth: '47%', flexBasis: '47%' },
              {
                backgroundColor: isDark ? '#141416' : '#F8FAFC',
                borderColor: theme.cardBorder,
              },
            ]}>
            <TrendingUp size={13} color={theme.textPrimary} />
            <Text style={[styles.kpiVal, { color: theme.textPrimary }]}>
              {activeDiff >= 0 ? `+${activeDiff}` : activeDiff}
            </Text>
            <Text style={[styles.kpiLbl, { color: theme.textMuted }]}>
              Cut-off Margin
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              isMobile && { minWidth: '47%', flexBasis: '47%' },
              {
                backgroundColor: isDark ? '#141416' : '#F8FAFC',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Activity size={13} color={theme.textPrimary} />
            <Text style={[styles.kpiVal, { color: theme.textPrimary }]}>
              {liveAccuracy}%
            </Text>
            <Text style={[styles.kpiLbl, { color: theme.textMuted }]}>
              {totalAttempted} Solved
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              isMobile && { minWidth: '47%', flexBasis: '47%' },
              {
                backgroundColor: isDark ? '#141416' : '#F8FAFC',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Flame size={13} color={theme.textPrimary} />
            <Text style={[styles.kpiVal, { color: theme.textPrimary }]}>
              {streak.weeklyConsistencyPercent}%
            </Text>
            <Text style={[styles.kpiLbl, { color: theme.textMuted }]}>
              Consistency
            </Text>
          </View>
        </View>

        {/* Real-Time Sync Indicator */}
        <View
          style={[
            styles.syncBanner,
            {
              backgroundColor: isDark ? '#141416' : '#F1F5F9',
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.syncBannerRow}>
            <Activity size={13} color={theme.textPrimary} />
            <Text style={[styles.syncBannerTitle, { color: theme.textPrimary }]}>
              Live Sync Active
            </Text>
          </View>
          <Text style={[styles.syncBannerText, { color: theme.textSecondary }]}>
            {totalAttempted} MCQs ({totalCorrect} correct) • {metrics.mainsAnswersWritten || 2} Mains answers
          </Text>
        </View>
      </View>

      {/* 2. GRAPH: Syllabus Mastery Radar Web & Bar Chart */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={[styles.chartSub, { color: theme.textMuted }]}>
              COVERAGE
            </Text>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Syllabus Mastery
            </Text>
          </View>

          {/* Mode Switcher Buttons */}
          <View
            style={[
              styles.modeSwitcher,
              {
                backgroundColor: isDark ? '#141416' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSyllabusGraphMode('radar')}
              style={[
                styles.modeBtn,
                syllabusGraphMode === 'radar' && [
                  styles.modeBtnActive,
                  { backgroundColor: theme.buttonPrimaryBg },
                ],
              ]}>
              <Text
                style={[
                  styles.modeBtnText,
                  {
                    color:
                      syllabusGraphMode === 'radar'
                        ? theme.buttonPrimaryText
                        : theme.textSecondary,
                  },
                ]}>
                Radar Web
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSyllabusGraphMode('bar')}
              style={[
                styles.modeBtn,
                syllabusGraphMode === 'bar' && [
                  styles.modeBtnActive,
                  { backgroundColor: theme.buttonPrimaryBg },
                ],
              ]}>
              <Text
                style={[
                  styles.modeBtnText,
                  {
                    color:
                      syllabusGraphMode === 'bar'
                        ? theme.buttonPrimaryText
                        : theme.textSecondary,
                  },
                ]}>
                Bars
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RADAR GRAPH RENDERING */}
        {syllabusGraphMode === 'radar' && (
          <View style={styles.radarWrapper}>
            <Svg width={radarSize} height={radarSize}>
              {/* Concentric Web Polygons */}
              {radarLevels.map((lvl: number) => {
                const ringPoints = papers
                  .map((_: SyllabusPaper, i: number) => {
                    const pt = getAxisPoint(i, lvl);
                    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <G key={`radar-lvl-${lvl}`}>
                    <Polygon
                      points={ringPoints}
                      fill="none"
                      stroke={isDark ? '#262933' : '#E2E8F0'}
                      strokeWidth={1}
                      strokeDasharray={lvl === 1.0 ? 'none' : '3, 3'}
                    />
                  </G>
                );
              })}

              {/* Radial Axis Lines */}
              {papers.map((_: SyllabusPaper, i: number) => {
                const pt = getAxisPoint(i, 1.05);
                return (
                  <G key={`radar-line-${i}`}>
                    <Line
                      x1={radarCenter}
                      y1={radarCenter}
                      x2={pt.x}
                      y2={pt.y}
                      stroke={isDark ? '#2B2F3A' : '#CBD5E1'}
                      strokeWidth={1}
                    />
                  </G>
                );
              })}

              {/* Filled Syllabus Mastery Data Polygon */}
              <Polygon
                points={dataPolygonPoints}
                fill={isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.12)'}
                stroke={theme.textPrimary}
                strokeWidth={2}
              />

              {/* Data Vertex Markers */}
              {papers.map((p: SyllabusPaper, i: number) => {
                const pt = getAxisPoint(i, p.percent / 100);
                return (
                  <G key={`radar-dot-${p.id}`}>
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={theme.textPrimary}
                      stroke={theme.cardBg}
                      strokeWidth={1.5}
                    />
                  </G>
                );
              })}

              {/* Axis Labels */}
              {papers.map((p: SyllabusPaper, i: number) => {
                const labelPt = getAxisPoint(i, 1.22);
                return (
                  <G key={`radar-text-${p.id}`}>
                    <SvgText
                      x={labelPt.x}
                      y={labelPt.y + 4}
                      fontSize={10}
                      fontWeight="700"
                      fill={theme.textPrimary}
                      textAnchor="middle">
                      {`${p.shortLabel} (${p.percent}%)`}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        )}

        {/* BAR GRAPH RENDERING */}
        {syllabusGraphMode === 'bar' && (
          <View style={styles.barGraphContainer}>
            {papers.map((p: SyllabusPaper) => (
              <View key={`bar-view-${p.id}`} style={styles.barColumnItem}>
                <Text style={[styles.barColValue, { color: theme.textPrimary }]}>
                  {p.percent}%
                </Text>
                <View
                  style={[
                    styles.barColumnTrack,
                    { backgroundColor: isDark ? '#1C1F28' : '#E2E8F0' },
                  ]}>
                  <View
                    style={[
                      styles.barColumnFill,
                      {
                        height: `${p.percent}%`,
                        backgroundColor: theme.textPrimary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barColLabel, { color: theme.textSecondary }]}>
                  {p.shortLabel}
                </Text>
              </View>
            ))}
          </View>
        )}


      </View>

      {/* 3. GRAPH: Prelims Mock Test Progression Curve (Line & Area Chart) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={[styles.chartSub, { color: theme.textMuted }]}>
              MOCKS
            </Text>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Score Progression
            </Text>
          </View>
          <View
            style={[
              styles.cutoffBadge,
              {
                backgroundColor: isDark ? '#20242E' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.cutoffBadgeText, { color: theme.textPrimary }]}>
              Cutoff: 88
            </Text>
          </View>
        </View>

        {/* Selected Point Status Banner */}
        <View
          style={[
            styles.mockStatusBanner,
            {
              backgroundColor: isDark ? '#141416' : '#F8FAFC',
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.mockStatusLeft}>
            <Text style={[styles.mockStatusName, { color: theme.textPrimary }]}>
              {activeMock.name} ({activeMock.date})
            </Text>
            <Text style={[styles.mockStatusScore, { color: theme.textPrimary }]}>
              {activeMock.score} <Text style={styles.mockUnit}>/ 200 marks</Text>
            </Text>
          </View>
          <View style={styles.mockStatusRight}>
            <Text style={[styles.mockAccuracy, { color: theme.textPrimary }]}>
              Accuracy: {activeMock.accuracy}%
            </Text>
            <Text style={[styles.mockMargin, { color: theme.textSecondary }]}>
              {activeDiff >= 0 ? `+${activeDiff}` : activeDiff} above prelims cutoff
            </Text>
          </View>
        </View>

        {/* SVG Area & Line Chart */}
        <View style={styles.trendSvgWrapper}>
          <Svg width="100%" height={trendHeight} viewBox={`0 0 ${containerMaxWidth - 36} ${trendHeight}`}>
            <Defs>
              <LinearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0%"
                  stopColor={theme.textPrimary}
                  stopOpacity={isDark ? 0.35 : 0.25}
                />
                <Stop
                  offset="100%"
                  stopColor={theme.textPrimary}
                  stopOpacity={0.0}
                />
              </LinearGradient>
            </Defs>

            {/* Horizontal Grid Lines */}
            {[70, 88, 110, 130].map((score: number) => {
              const y =
                trendPadTop +
                trendPlotHeight -
                ((score - minScore) / (maxScore - minScore)) * trendPlotHeight;
              const isCutoff = score === 88;
              return (
                <G key={`trend-grid-${score}`}>
                  <Line
                    x1={trendPadLeft}
                    y1={y}
                    x2={trendPadLeft + trendPlotWidth}
                    y2={y}
                    stroke={isCutoff ? (isDark ? '#52525B' : '#94A3B8') : (isDark ? '#262933' : '#E2E8F0')}
                    strokeWidth={isCutoff ? 1.5 : 1}
                    strokeDasharray={isCutoff ? '4, 4' : 'none'}
                  />
                  <SvgText
                    x={trendPadLeft - 6}
                    y={y + 3}
                    fontSize={9}
                    fontWeight={isCutoff ? '800' : '500'}
                    fill={isCutoff ? theme.textPrimary : theme.textMuted}
                    textAnchor="end">
                    {score}
                  </SvgText>
                </G>
              );
            })}

            {/* Gradient Area Fill */}
            <Path d={trendArea} fill="url(#trendGradient)" />

            {/* Main Trend Line */}
            <Path
              d={trendCurve}
              fill="none"
              stroke={theme.textPrimary}
              strokeWidth={2.5}
            />

            {/* Cutoff Label tag on right */}
            <SvgText
              x={trendPadLeft + trendPlotWidth - 2}
              y={cutoffY - 4}
              fontSize={9}
              fontWeight="700"
              fill={theme.textMuted}
              textAnchor="end">
              CUTOFF (88)
            </SvgText>

            {/* Interactive Data Point Dots */}
            {trendPoints.map((pt: typeof trendPoints[0], index: number) => {
              const isSelected = index === selectedMockIndex;
              return (
                <G key={`mock-dot-${pt.name}`}>
                  {isSelected && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={8}
                      fill={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)'}
                    />
                  )}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5 : 3.5}
                    fill={isSelected ? theme.buttonPrimaryBg : theme.textPrimary}
                    stroke={theme.cardBg}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={pt.x}
                    y={trendHeight - 8}
                    fontSize={10}
                    fontWeight={isSelected ? '800' : '600'}
                    fill={isSelected ? theme.textPrimary : theme.textMuted}
                    textAnchor="middle">
                    {pt.name}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Test Selector Tabs */}
        <View style={[styles.testPillsRow, isMobile && { flexWrap: 'wrap' }]}>
          {mockHistory.map((m: typeof mockHistory[0], idx: number) => {
            const isSelected = idx === selectedMockIndex;
            return (
              <TouchableOpacity
                key={`test-pill-${m.name}`}
                activeOpacity={0.8}
                onPress={() => setSelectedMockIndex(idx)}
                style={[
                  styles.testPill,
                  {
                    backgroundColor: isSelected
                      ? theme.buttonPrimaryBg
                      : isDark
                      ? '#141416'
                      : '#F1F5F9',
                    borderColor: isSelected ? theme.buttonPrimaryBg : theme.cardBorder,
                  },
                ]}>
                <Text
                  style={[
                    styles.testPillText,
                    {
                      color: isSelected
                        ? theme.buttonPrimaryText
                        : theme.textSecondary,
                    },
                  ]}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. TWO-COLUMN GRAPHS: Weekly Output + Time Allocation Donut */}
      <View style={[styles.twoColGraphRow, isMobile && { flexDirection: 'column' }]}>
        {/* Weekly Study Output Bar Chart */}
        <View
          style={[
            styles.cardHalf,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={[styles.chartSub, { color: theme.textMuted }]}>
                7-DAY DISCIPLINE
              </Text>
              <Text style={[styles.cardTitleSmall, { color: theme.textPrimary }]}>
                Daily Study Hours
              </Text>
            </View>
            <BarChart2 size={15} color={theme.textPrimary} />
          </View>

          {/* 7 Vertical Bars */}
          <View style={styles.weeklyBarsRow}>
            {weekDays.map((d: typeof weekDays[0]) => {
              const hrs = d.totalMinutes / 60;
              const barHeightPercent = Math.min(100, Math.round((hrs / maxWeeklyHours) * 100));
              const metGoal = hrs >= dailyGoalHours;

              return (
                <View key={`weekly-bar-${d.dateStr}`} style={styles.weeklyBarCol}>
                  <Text style={[styles.weeklyBarHrs, { color: theme.textPrimary }]}>
                    {hrs.toFixed(1)}
                  </Text>
                  <View
                    style={[
                      styles.weeklyBarTrack,
                      { backgroundColor: isDark ? '#1C1F28' : '#E2E8F0' },
                    ]}>
                    <View
                      style={[
                        styles.weeklyBarFill,
                        {
                          height: `${Math.max(8, barHeightPercent)}%`,
                          backgroundColor: metGoal
                            ? theme.textPrimary
                            : isDark
                            ? '#52525B'
                            : '#94A3B8',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.weeklyBarDay,
                      {
                        color: d.isToday ? theme.textPrimary : theme.textMuted,
                        fontWeight: d.isToday ? '800' : '600',
                      },
                    ]}>
                    {d.dayName}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.targetLegendRow, { borderTopColor: theme.divider }]}>
            <Text style={[styles.targetLegendText, { color: theme.textSecondary }]}>
              Target: {dailyGoalHours.toFixed(1)} hrs/day • {streak.currentStreak}d streak active
            </Text>
          </View>
        </View>

        {/* Study Time Allocation Donut Chart */}
        <View
          style={[
            styles.cardHalf,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={[styles.chartSub, { color: theme.textMuted }]}>
                PREP SPLIT
              </Text>
              <Text style={[styles.cardTitleSmall, { color: theme.textPrimary }]}>
                Time Allocation
              </Text>
            </View>
            <PieChart size={15} color={theme.textPrimary} />
          </View>

          {/* Donut Graphic */}
          <View style={styles.donutCenterWrap}>
            <Svg width={donutSize} height={donutSize} style={{ transform: [{ rotate: '-90deg' }] }}>
              {timeShares.map((slice: typeof timeShares[0], i: number) => {
                const strokeLength = slice.share * circumference;
                const offset = accumulatedShare * circumference;
                accumulatedShare += slice.share;

                return (
                  <G key={`donut-slice-${i}`}>
                    <Circle
                      cx={donutCenter}
                      cy={donutCenter}
                      r={donutRadius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={14}
                      strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                      strokeDashoffset={-offset}
                    />
                  </G>
                );
              })}
            </Svg>
            <View style={styles.donutInnerContent}>
              <Text style={[styles.donutInnerNum, { color: theme.textPrimary }]}>
                41.2h
              </Text>
              <Text style={[styles.donutInnerLbl, { color: theme.textMuted }]}>
                Total
              </Text>
            </View>
          </View>

          {/* Donut Legend */}
          <View style={styles.donutLegendList}>
            {timeShares.map((slice: typeof timeShares[0], i: number) => (
              <View key={`donut-legend-${i}`} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={[styles.legendLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  {slice.label}
                </Text>
                <Text style={[styles.legendVal, { color: theme.textPrimary }]}>
                  {slice.hours}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 5. Mains Answer Writing Step Progression */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={[styles.chartSub, { color: theme.textMuted }]}>
              MAINS
            </Text>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Answer Writing Scores
            </Text>
          </View>
          <BookOpen size={16} color={theme.textPrimary} />
        </View>

        <View style={[styles.mainsStepGrid, isMobile && { flexWrap: 'wrap' }]}>
          {[
            { round: 'Week 1', score: '4.2', label: 'Baseline' },
            { round: 'Week 2', score: '4.8', label: 'Structure' },
            { round: 'Week 3', score: '5.2', label: 'Headings' },
            { round: 'Week 4', score: '5.5', label: 'Case Studies' },
            { round: 'Latest', score: `${Math.min(10, (5.0 + (metrics.mainsAnswersWritten || 2) * 0.2)).toFixed(1)}`, label: `${metrics.mainsAnswersWritten || 2} Answers` },
          ].map((item: { round: string; score: string; label: string }, idx: number) => (
            <View
              key={`mains-step-${idx}`}
              style={[
                styles.mainsStepCard,
                isMobile && { minWidth: '47%', flexBasis: '47%' },
                {
                  backgroundColor: isDark ? '#141416' : '#F8FAFC',
                  borderColor: theme.cardBorder,
                },
              ]}>
              <Text style={[styles.mainsStepRound, { color: theme.textMuted }]}>
                {item.round}
              </Text>
              <Text style={[styles.mainsStepScore, { color: theme.textPrimary }]}>
                {item.score} <Text style={styles.mainsTen}>/10</Text>
              </Text>
              <Text style={[styles.mainsStepLbl, { color: theme.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.mainsFeedbackRow, { borderTopColor: theme.divider }]}>
          <CheckCircle2 size={14} color={theme.textPrimary} />
          <Text style={[styles.mainsFeedbackText, { color: theme.textSecondary }]}>
            Trajectory shows steady progression towards the competitive 6.5+ marks benchmark. Focus next on conclusion forward-looking keywords.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  overallBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallBadgeText: {
    fontSize: 18,
    fontWeight: '900',
  },
  overallBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiLbl: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  syncBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  syncBannerText: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: '800',
  },
  modeSwitcher: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modeBtnActive: {},
  modeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  barGraphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    paddingVertical: 10,
  },
  barColumnItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  barColValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  barColumnTrack: {
    width: 24,
    height: 120,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barColumnFill: {
    width: '100%',
    borderRadius: 6,
  },
  barColLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  cutoffBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  cutoffBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mockStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  mockStatusLeft: {
    gap: 2,
  },
  mockStatusName: {
    fontSize: 11,
    fontWeight: '600',
  },
  mockStatusScore: {
    fontSize: 17,
    fontWeight: '900',
  },
  mockUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  mockStatusRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mockAccuracy: {
    fontSize: 12,
    fontWeight: '700',
  },
  mockMargin: {
    fontSize: 10,
    fontWeight: '500',
  },
  trendSvgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  testPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  testPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  testPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  twoColGraphRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: 6,
  },
  weeklyBarCol: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  weeklyBarHrs: {
    fontSize: 9,
    fontWeight: '700',
  },
  weeklyBarTrack: {
    width: 14,
    height: 75,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  weeklyBarDay: {
    fontSize: 10,
  },
  targetLegendRow: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  targetLegendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  donutCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 130,
    position: 'relative',
  },
  donutInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInnerNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  donutInnerLbl: {
    fontSize: 9,
    fontWeight: '700',
  },
  donutLegendList: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
  },
  legendVal: {
    fontSize: 10,
    fontWeight: '700',
  },
  mainsStepGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mainsStepCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  mainsStepRound: {
    fontSize: 9,
    fontWeight: '700',
  },
  mainsStepScore: {
    fontSize: 14,
    fontWeight: '900',
  },
  mainsTen: {
    fontSize: 9,
    fontWeight: '500',
  },
  mainsStepLbl: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  mainsFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  mainsFeedbackText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
});
