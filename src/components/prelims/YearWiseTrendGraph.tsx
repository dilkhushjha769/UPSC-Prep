import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowRight,
  BarChart2,
  Info,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from '@/components/common/LucideIcons';
import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';
import { Chapter, PYQQuestion, YearTrend } from '@/types/prelims';

export type YearRangeOption = '5Y' | '10Y' | 'All';

export interface YearWiseTrendGraphProps {
  chapter: Chapter;
  questions?: PYQQuestion[];
  onPracticeQuestions?: (year: number, matchingQuestions: PYQQuestion[]) => void;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  initialSelectedYear?: number;
}

export function YearWiseTrendGraph({
  chapter,
  questions = [],
  onPracticeQuestions,
  isLoading = false,
  hasError = false,
  onRetry,
  initialSelectedYear,
}: YearWiseTrendGraphProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isNarrow = width < 420;

  // Range selection: '5Y' | '10Y' | 'All' (Default '10Y')
  const [rangeOption, setRangeOption] = useState<YearRangeOption>('10Y');

  // Hovered year (Desktop/Web)
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Raw trends from chapter data or fallback to questions grouping
  const rawTrends: YearTrend[] = useMemo(() => {
    if (chapter.yearTrends && chapter.yearTrends.length > 0) {
      return [...chapter.yearTrends].sort((a, b) => a.year - b.year);
    }
    // Fallback: derive from questions
    const countsByYear: Record<number, number> = {};
    questions.forEach((q) => {
      if (q.year) {
        countsByYear[q.year] = (countsByYear[q.year] || 0) + 1;
      }
    });
    const years = Object.keys(countsByYear).map(Number).sort((a, b) => a - b);
    if (years.length === 0) return [];
    return years.map((y) => ({ year: y, count: countsByYear[y] }));
  }, [chapter.yearTrends, questions]);

  // Filter trends based on selected range
  const displayedTrends = useMemo(() => {
    if (rawTrends.length === 0) return [];
    if (rangeOption === '5Y') {
      return rawTrends.slice(-5);
    }
    if (rangeOption === '10Y') {
      return rawTrends.slice(-10);
    }
    return rawTrends;
  }, [rawTrends, rangeOption]);

  // Range metadata
  const startYear = displayedTrends.length > 0 ? displayedTrends[0].year : 2015;
  const endYear = displayedTrends.length > 0 ? displayedTrends[displayedTrends.length - 1].year : 2024;
  const rangeLabel = rangeOption === '5Y' ? '5-Year' : rangeOption === '10Y' ? '10-Year' : 'All-Years';

  // Find max count for scaling (ensure min 1 to avoid division by 0)
  const maxCount = useMemo(() => {
    if (displayedTrends.length === 0) return 1;
    const maxVal = Math.max(...displayedTrends.map((t) => t.count));
    return Math.max(maxVal, 1);
  }, [displayedTrends]);

  // Find peak year(s)
  const peakYearItem = useMemo(() => {
    if (displayedTrends.length === 0) return null;
    let peak = displayedTrends[0];
    displayedTrends.forEach((item) => {
      if (item.count > peak.count) {
        peak = item;
      }
    });
    return peak.count > 0 ? peak : null;
  }, [displayedTrends]);

  // Selected year: user choice or declarative fallback to peak / latest
  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(
    initialSelectedYear || null
  );

  const selectedYear = useMemo(() => {
    if (userSelectedYear && displayedTrends.some((t) => t.year === userSelectedYear)) {
      return userSelectedYear;
    }
    if (initialSelectedYear && displayedTrends.some((t) => t.year === initialSelectedYear)) {
      return initialSelectedYear;
    }
    if (peakYearItem && peakYearItem.count > 0) {
      return peakYearItem.year;
    }
    return displayedTrends.length > 0 ? displayedTrends[displayedTrends.length - 1].year : 2024;
  }, [userSelectedYear, displayedTrends, initialSelectedYear, peakYearItem]);

  // Active year object
  const activeYearItem = useMemo(() => {
    return displayedTrends.find((t) => t.year === selectedYear) || displayedTrends[displayedTrends.length - 1] || null;
  }, [displayedTrends, selectedYear]);

  // Calculate percentage change vs previous year
  const previousYearComparison = useMemo(() => {
    if (!activeYearItem || displayedTrends.length === 0) return null;
    const activeIndex = displayedTrends.findIndex((t) => t.year === activeYearItem.year);
    if (activeIndex <= 0) {
      return {
        type: 'baseline' as const,
        pct: null,
        text: 'Baseline year',
      };
    }
    const prevItem = displayedTrends[activeIndex - 1];
    const prevCount = prevItem.count;
    const curCount = activeYearItem.count;

    if (prevCount === 0) {
      if (curCount > 0) {
        return {
          type: 'increase' as const,
          pct: null,
          text: `+${curCount} vs '${String(prevItem.year).slice(2)}`,
        };
      }
      return {
        type: 'neutral' as const,
        pct: 0,
        text: `0 vs '${String(prevItem.year).slice(2)}`,
      };
    }

    const pctChange = Math.round(((curCount - prevCount) / prevCount) * 100);
    if (pctChange > 0) {
      return {
        type: 'increase' as const,
        pct: pctChange,
        text: `+${pctChange}% vs '${String(prevItem.year).slice(2)}`,
      };
    }
    if (pctChange < 0) {
      return {
        type: 'decrease' as const,
        pct: pctChange,
        text: `${pctChange}% vs '${String(prevItem.year).slice(2)}`,
      };
    }
    return {
      type: 'neutral' as const,
      pct: 0,
      text: `Same as '${String(prevItem.year).slice(2)}`,
    };
  }, [activeYearItem, displayedTrends]);

  // Questions matching active year
  const matchingQuestionsForActiveYear = useMemo(() => {
    if (!activeYearItem) return [];
    return questions.filter((q) => q.year === activeYearItem.year);
  }, [questions, activeYearItem]);

  // Real concise summary stats (e.g. peak year and frequency)
  const headerSubtitle = useMemo(() => {
    if (displayedTrends.length === 0) return 'Year-wise questions asked in UPSC';
    const activeYears = displayedTrends.filter((t) => t.count > 0).length;
    const totalYears = displayedTrends.length;
    if (peakYearItem) {
      return `Peak: ${peakYearItem.year} (${peakYearItem.count} Qs) • Appeared in ${activeYears}/${totalYears} yrs`;
    }
    return `Appeared in ${activeYears}/${totalYears} years`;
  }, [displayedTrends, peakYearItem]);

  // Handlers
  const handleSelectBar = (year: number) => {
    setUserSelectedYear(year);
  };

  const handlePracticeClick = () => {
    if (activeYearItem && onPracticeQuestions) {
      onPracticeQuestions(activeYearItem.year, matchingQuestionsForActiveYear);
    }
  };

  // -------------------------------------------------------------
  // RENDER: Loading Skeleton State
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <View style={{ gap: 6 }}>
            <View style={[styles.skeletonBar, { width: 120, height: 16 }]} />
            <View style={[styles.skeletonBar, { width: 160, height: 11 }]} />
          </View>
        </View>
        <View style={[styles.chartWrapper, { height: 110, justifyContent: 'flex-end' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            {[30, 60, 25, 80, 50, 100, 70, 40, 85, 55].map((h, i) => (
              <View key={i} style={[styles.skeletonBar, { width: 20, height: h, opacity: 0.3 + (i % 3) * 0.2 }]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Error State
  // -------------------------------------------------------------
  if (hasError) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.emptyStateContainer}>
          <Info size={20} color={theme.colors.incorrect} />
          <Text style={styles.emptyStateTitle}>Failed to load trend data</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
              <RotateCcw size={13} color={theme.colors.textWhite} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Empty State
  // -------------------------------------------------------------
  if (displayedTrends.length === 0) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.emptyStateContainer}>
          <BarChart2 size={20} color={theme.colors.textMuted} />
          <Text style={styles.emptyStateTitle}>No year-wise question data available yet</Text>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Clean & Modern Interactive Graph Card
  // -------------------------------------------------------------
  const chartHeight = 90;

  return (
    <View style={styles.cardContainer} accessibilityLabel="Year-Wise Question Trend Graph">
      {/* 1. Sleek Minimal Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.titleBadgeRow}>
            <TrendingUp size={15} color={theme.colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardTitle}>{rangeLabel} Trend</Text>
            <View style={styles.rangeBadge}>
              <Text style={styles.rangeBadgeText}>
                {startYear}–{endYear}
              </Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>{headerSubtitle}</Text>
        </View>

        {/* Range Selector Controls: 5Y | 10Y | All */}
        <View style={styles.rangeSelectorPills}>
          {(['5Y', '10Y', 'All'] as YearRangeOption[]).map((option) => {
            const isSelected = rangeOption === option;
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.7}
                onPress={() => setRangeOption(option)}
                style={[
                  styles.rangePillBtn,
                  isSelected && styles.rangePillBtnActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Show ${option === '5Y' ? '5 years' : option === '10Y' ? '10 years' : 'all years'} trend`}
              >
                <Text
                  style={[
                    styles.rangePillBtnText,
                    isSelected && styles.rangePillBtnTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Interactive Bar Chart */}
      <View style={styles.chartWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.chartScrollContent,
            !isNarrow && { flex: 1, justifyContent: 'space-between' },
          ]}
        >
          {displayedTrends.map((item) => {
            const isSelected = item.year === selectedYear;
            const isHovered = item.year === hoveredYear;
            const isPeak = peakYearItem !== null && item.year === peakYearItem.year && item.count > 0;
            const isZero = item.count === 0;

            // Bar height: 3px baseline mark for zero, otherwise scaled dynamically
            const barHeight = isZero
              ? 3
              : Math.max(8, Math.round((item.count / maxCount) * chartHeight));

            return (
              <Pressable
                key={item.year}
                onPress={() => handleSelectBar(item.year)}
                {...(Platform.OS === 'web'
                  ? {
                      onMouseEnter: () => setHoveredYear(item.year),
                      onMouseLeave: () => setHoveredYear(null),
                    }
                  : {})}
                style={[
                  styles.barColumn,
                  isSelected && styles.barColumnSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Year ${item.year}: ${item.count} questions${isPeak ? ', Peak frequency' : ''}${isSelected ? ', selected' : ''}`}
              >
                {/* Count Header */}
                <View style={styles.countWrapper}>
                  {isPeak && (
                    <View style={styles.peakDot} />
                  )}
                  <Text
                    style={[
                      styles.barCountText,
                      isZero && styles.barCountTextZero,
                      isSelected && styles.barCountTextSelected,
                      isPeak && !isSelected && styles.barCountTextPeak,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>

                {/* Vertical Bar Canvas */}
                <View style={[styles.barCanvas, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.barPill,
                      { height: barHeight },
                      isZero && styles.barPillZero,
                      isSelected && styles.barPillSelected,
                      isPeak && !isSelected && styles.barPillPeak,
                      isHovered && !isSelected && styles.barPillHovered,
                    ]}
                  />
                </View>

                {/* Horizontal Baseline Segment */}
                <View
                  style={[
                    styles.baselineSegment,
                    isSelected && styles.baselineSegmentActive,
                  ]}
                />

                {/* Year Label */}
                <Text
                  style={[
                    styles.yearLabelText,
                    isSelected && styles.yearLabelTextSelected,
                    isPeak && !isSelected && styles.yearLabelTextPeak,
                  ]}
                >
                  {"'" + String(item.year).slice(2)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Sleek Single-Row Action Strip (Clean & Zero Clutter) */}
      {activeYearItem && (
        <View style={styles.actionStrip}>
          <View style={styles.actionStripLeft}>
            <Text style={styles.activeYearTitle}>{activeYearItem.year}</Text>
            <View
              style={[
                styles.countBadge,
                activeYearItem.count === 0 && styles.countBadgeZero,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  activeYearItem.count === 0 && styles.countBadgeTextZero,
                ]}
              >
                {activeYearItem.count === 0
                  ? '0 Questions'
                  : `${activeYearItem.count} Question${activeYearItem.count > 1 ? 's' : ''}`}
              </Text>
            </View>

            {/* YoY Trend comparison badge */}
            {previousYearComparison && previousYearComparison.type !== 'baseline' && (
              <View
                style={[
                  styles.yoyBadge,
                  previousYearComparison.type === 'increase' && styles.yoyBadgeIncrease,
                  previousYearComparison.type === 'decrease' && styles.yoyBadgeDecrease,
                  previousYearComparison.type === 'neutral' && styles.yoyBadgeNeutral,
                ]}
              >
                {previousYearComparison.type === 'increase' && (
                  <TrendingUp size={10} color="#059669" strokeWidth={2.4} />
                )}
                {previousYearComparison.type === 'decrease' && (
                  <TrendingDown size={10} color="#DC2626" strokeWidth={2.4} />
                )}
                <Text
                  style={[
                    styles.yoyBadgeText,
                    previousYearComparison.type === 'increase' && styles.yoyBadgeTextIncrease,
                    previousYearComparison.type === 'decrease' && styles.yoyBadgeTextDecrease,
                    previousYearComparison.type === 'neutral' && styles.yoyBadgeTextNeutral,
                  ]}
                >
                  {previousYearComparison.text}
                </Text>
              </View>
            )}
          </View>

          {/* Compact Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePracticeClick}
            style={[
              styles.practiceBtnCompact,
              activeYearItem.count === 0 && styles.practiceBtnCompactZero,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Practice questions for year ${activeYearItem.year}`}
          >
            <Text
              style={[
                styles.practiceBtnText,
                activeYearItem.count === 0 && styles.practiceBtnTextZero,
              ]}
            >
              {activeYearItem.count > 0
                ? `Practice (${matchingQuestionsForActiveYear.length || activeYearItem.count})`
                : 'Practice Chapter'}
            </Text>
            <ArrowRight
              size={12}
              color={
                activeYearItem.count === 0
                  ? theme.colors.textPrimary
                  : theme.colors.darkButtonText
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getStyles(theme: PrelimsThemeType) {
  const isDark = theme.isDark;

  return StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.colors.bgSurface,
      borderColor: theme.colors.borderCard,
      borderWidth: 1,
      borderRadius: theme.radius.card,
      padding: 16,
      gap: 12,
      ...theme.shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    titleCol: {
      gap: 3,
    },
    titleBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    rangeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 5,
      backgroundColor: isDark ? '#262A36' : '#F1F5F9',
      borderColor: theme.colors.borderSubtle,
      borderWidth: 1,
    },
    rangeBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    cardSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    rangeSelectorPills: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1C2029' : '#F1F5F9',
      borderColor: theme.colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 7,
      padding: 2.5,
      gap: 2,
    },
    rangePillBtn: {
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 5,
    },
    rangePillBtnActive: {
      backgroundColor: isDark ? '#323746' : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 1,
    },
    rangePillBtnText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    rangePillBtnTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '800',
    },
    chartWrapper: {
      paddingTop: 4,
    },
    chartScrollContent: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingVertical: 2,
      minWidth: '100%',
      gap: 4,
    },
    barColumn: {
      alignItems: 'center',
      paddingHorizontal: 3,
      paddingVertical: 2,
      borderRadius: 6,
      minWidth: 32,
      flex: 1,
    },
    barColumnSelected: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.06)',
    },
    countWrapper: {
      alignItems: 'center',
      minHeight: 18,
      justifyContent: 'flex-end',
      marginBottom: 4,
    },
    peakDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#F59E0B' : '#D97706',
      marginBottom: 2,
    },
    barCountText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    barCountTextZero: {
      color: theme.colors.textMuted,
      opacity: 0.6,
      fontSize: 9.5,
    },
    barCountTextSelected: {
      color: theme.colors.primary,
      fontWeight: '900',
    },
    barCountTextPeak: {
      color: isDark ? '#FBBF24' : '#D97706',
      fontWeight: '800',
    },
    barCanvas: {
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    barPill: {
      width: 13,
      backgroundColor: isDark ? '#3A4050' : '#CBD5E1',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
    },
    barPillZero: {
      width: 10,
      height: 3,
      backgroundColor: isDark ? '#2E3342' : '#E2E8F0',
      borderRadius: 2,
    },
    barPillSelected: {
      backgroundColor: theme.colors.primary,
      width: 15,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
      elevation: 2,
    },
    barPillPeak: {
      backgroundColor: isDark ? '#D97706' : '#B45309',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    barPillHovered: {
      backgroundColor: isDark ? '#4B5563' : '#94A3B8',
    },
    baselineSegment: {
      width: '100%',
      height: 1.5,
      backgroundColor: isDark ? '#2E3342' : '#E2E8F0',
      marginVertical: 3,
    },
    baselineSegmentActive: {
      backgroundColor: theme.colors.primary,
      height: 2,
    },
    yearLabelText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    yearLabelTextSelected: {
      color: theme.colors.primary,
      fontWeight: '900',
    },
    yearLabelTextPeak: {
      color: isDark ? '#FBBF24' : '#B45309',
      fontWeight: '800',
    },
    actionStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1C202B' : '#F8FAFC',
      borderColor: isDark ? '#2C3140' : '#E2E8F0',
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 10,
      flexWrap: 'wrap',
    },
    actionStripLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      flexWrap: 'wrap',
    },
    activeYearTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    countBadge: {
      backgroundColor: isDark ? '#262C3A' : '#EDE9FE',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
    },
    countBadgeZero: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
    },
    countBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#C4B5FD' : '#6D28D9',
    },
    countBadgeTextZero: {
      color: theme.colors.textMuted,
    },
    yoyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    yoyBadgeIncrease: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#DCFCE7',
    },
    yoyBadgeDecrease: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
    },
    yoyBadgeNeutral: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
    },
    yoyBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
    },
    yoyBadgeTextIncrease: {
      color: isDark ? '#34D399' : '#059669',
    },
    yoyBadgeTextDecrease: {
      color: isDark ? '#F87171' : '#DC2626',
    },
    yoyBadgeTextNeutral: {
      color: theme.colors.textMuted,
    },
    practiceBtnCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: 6,
      gap: 6,
    },
    practiceBtnCompactZero: {
      backgroundColor: isDark ? '#262A36' : '#F1F5F9',
      borderColor: isDark ? '#313746' : '#CBD5E1',
      borderWidth: 1,
    },
    practiceBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    practiceBtnTextZero: {
      color: theme.colors.textPrimary,
    },
    emptyStateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 12,
      gap: 6,
    },
    emptyStateTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.darkButton,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginTop: 2,
    },
    retryBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    skeletonBar: {
      backgroundColor: isDark ? '#262A36' : '#E2E8F0',
      borderRadius: 4,
    },
  });
}
