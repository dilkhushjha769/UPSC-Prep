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
  BookOpen,
  Calendar,
  Info,
  RotateCcw,
  Sparkles,
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
        text: 'Baseline year in range',
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
          text: `+${curCount} from 0 in ${prevItem.year}`,
        };
      }
      return {
        type: 'neutral' as const,
        pct: 0,
        text: `0% vs ${prevItem.year} (0 questions)`,
      };
    }

    const pctChange = Math.round(((curCount - prevCount) / prevCount) * 100);
    if (pctChange > 0) {
      return {
        type: 'increase' as const,
        pct: pctChange,
        text: `+${pctChange}% vs ${prevItem.year}`,
      };
    }
    if (pctChange < 0) {
      return {
        type: 'decrease' as const,
        pct: pctChange,
        text: `${pctChange}% vs ${prevItem.year}`,
      };
    }
    return {
      type: 'neutral' as const,
      pct: 0,
      text: `Same as ${prevItem.year} (${curCount} Qs)`,
    };
  }, [activeYearItem, displayedTrends]);

  // Questions matching active year
  const matchingQuestionsForActiveYear = useMemo(() => {
    if (!activeYearItem) return [];
    return questions.filter((q) => q.year === activeYearItem.year);
  }, [questions, activeYearItem]);

  // Real insights derived strictly from displayed data
  const realInsights = useMemo(() => {
    if (displayedTrends.length === 0) return [];
    const insights: string[] = [];

    // 1. Peak frequency
    if (peakYearItem && peakYearItem.count > 0) {
      insights.push(
        `Highest frequency: ${peakYearItem.year} (${peakYearItem.count} question${peakYearItem.count > 1 ? 's' : ''})`
      );
    } else {
      insights.push(`No questions appeared from this topic in the selected range`);
    }

    // 2. Frequency consistency
    const yearsWithQs = displayedTrends.filter((t) => t.count > 0).length;
    const totalYrs = displayedTrends.length;
    if (totalYrs > 1) {
      insights.push(`Questions appeared in ${yearsWithQs} of the ${totalYrs} years`);
    }

    // 3. Zero question years
    const zeroYears = displayedTrends.filter((t) => t.count === 0).map((t) => t.year);
    if (zeroYears.length === 1) {
      insights.push(`No questions recorded in ${zeroYears[0]}`);
    } else if (zeroYears.length > 1 && zeroYears.length <= 3) {
      insights.push(`No questions recorded in ${zeroYears.join(', ')}`);
    }

    // 4. Recent 2-year momentum
    if (displayedTrends.length >= 2) {
      const last2 = displayedTrends.slice(-2);
      const last2Count = last2.reduce((sum, item) => sum + item.count, 0);
      const yearsLabel = `${last2[0].year}–${last2[1].year}`;
      insights.push(`${last2Count} question${last2Count !== 1 ? 's' : ''} asked in the last 2 years (${yearsLabel})`);
    }

    return insights;
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
          <View style={styles.headerTitleRow}>
            <View style={[styles.skeletonCircle, { backgroundColor: theme.colors.bgSurfaceMuted }]} />
            <View style={{ gap: 6 }}>
              <View style={[styles.skeletonBar, { width: 140, height: 16 }]} />
              <View style={[styles.skeletonBar, { width: 180, height: 11 }]} />
            </View>
          </View>
        </View>
        <View style={[styles.chartWrapper, { height: 140, justifyContent: 'flex-end' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            {[40, 70, 30, 90, 60, 110, 80, 50, 95, 65].map((h, i) => (
              <View key={i} style={[styles.skeletonBar, { width: 22, height: h, opacity: 0.4 + (i % 3) * 0.2 }]} />
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
          <Info size={24} color={theme.colors.incorrect} />
          <Text style={styles.emptyStateTitle}>Failed to load trend data</Text>
          <Text style={styles.emptyStateSubtitle}>
            Unable to fetch historical question trends for this topic.
          </Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
              <RotateCcw size={14} color={theme.colors.textWhite} />
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
          <BarChart2 size={24} color={theme.colors.textMuted} />
          <Text style={styles.emptyStateTitle}>No year-wise question data available yet.</Text>
          <Text style={styles.emptyStateSubtitle}>
            Historical question frequency for this topic will appear as PYQs are cataloged.
          </Text>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Interactive Graph Card
  // -------------------------------------------------------------
  const chartHeight = 110;

  return (
    <View style={styles.cardContainer} accessibilityLabel="Year-Wise Question Trend Graph">
      {/* 1. Header with Title, Range Badge & Range Toggle Buttons */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <View style={styles.trendIconBubble}>
            <TrendingUp size={16} color={theme.colors.primary} strokeWidth={2.4} />
          </View>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.cardTitle}>{rangeLabel} Question Trend</Text>
              <View style={styles.rangeBadge}>
                <Text style={styles.rangeBadgeText}>
                  {startYear}–{endYear}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Year-wise questions asked in UPSC</Text>
          </View>
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
                // Web hover support
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
                accessibilityLabel={`Year ${item.year}: ${item.count} question${item.count !== 1 ? 's' : ''}${isPeak ? ', Peak frequency' : ''}${isSelected ? ', selected' : ''}`}
              >
                {/* Peak Badge or Count Header */}
                <View style={styles.countBadgeWrapper}>
                  {isPeak && (
                    <View style={styles.peakBadge}>
                      <Text style={styles.peakBadgeText}>PEAK</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.barCountText,
                      isZero && styles.barCountTextZero,
                      isSelected && styles.barCountTextSelected,
                      isPeak && styles.barCountTextPeak,
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
                    isPeak && styles.yearLabelTextPeak,
                  ]}
                >
                  {"'" + String(item.year).slice(2)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Explanatory Note below the chart */}
      <View style={styles.explanationRow}>
        <Info size={13} color={theme.colors.textMuted} />
        <Text style={styles.explanationText}>
          Each bar shows the number of questions asked from this topic in that year.
        </Text>
      </View>

      {/* 4. Compact Selected Year Detail Panel */}
      {activeYearItem && (
        <View style={styles.detailPanel}>
          <View style={styles.detailHeaderRow}>
            <View style={styles.detailYearInfo}>
              <View style={styles.calendarIconBubble}>
                <Calendar size={14} color={theme.colors.primary} />
              </View>
              <Text style={styles.detailYearTitle}>
                UPSC CSE {activeYearItem.year}
              </Text>
              <View
                style={[
                  styles.detailCountPill,
                  activeYearItem.count === 0 && styles.detailCountPillZero,
                ]}
              >
                <Text
                  style={[
                    styles.detailCountPillText,
                    activeYearItem.count === 0 && styles.detailCountPillTextZero,
                  ]}
                >
                  {activeYearItem.count === 0
                    ? '0 Questions Asked'
                    : `${activeYearItem.count} Question${activeYearItem.count > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>

            {/* YoY Trend Comparison Tag */}
            {previousYearComparison && (
              <View
                style={[
                  styles.yoyTag,
                  previousYearComparison.type === 'increase' && styles.yoyTagIncrease,
                  previousYearComparison.type === 'decrease' && styles.yoyTagDecrease,
                  previousYearComparison.type === 'neutral' && styles.yoyTagNeutral,
                  previousYearComparison.type === 'baseline' && styles.yoyTagBaseline,
                ]}
              >
                {previousYearComparison.type === 'increase' && (
                  <TrendingUp size={11} color="#059669" strokeWidth={2.4} />
                )}
                {previousYearComparison.type === 'decrease' && (
                  <TrendingDown size={11} color="#DC2626" strokeWidth={2.4} />
                )}
                <Text
                  style={[
                    styles.yoyTagText,
                    previousYearComparison.type === 'increase' && styles.yoyTagTextIncrease,
                    previousYearComparison.type === 'decrease' && styles.yoyTagTextDecrease,
                    previousYearComparison.type === 'neutral' && styles.yoyTagTextNeutral,
                    previousYearComparison.type === 'baseline' && styles.yoyTagTextBaseline,
                  ]}
                >
                  {previousYearComparison.text}
                </Text>
              </View>
            )}
          </View>

          {/* Related Questions Preview */}
          <View style={styles.previewSection}>
            {matchingQuestionsForActiveYear.length > 0 ? (
              <View style={styles.questionsList}>
                <Text style={styles.previewSectionHeading}>
                  Questions Asked in {activeYearItem.year} ({matchingQuestionsForActiveYear.length})
                </Text>
                {matchingQuestionsForActiveYear.map((q, qIndex) => (
                  <View key={q.id || qIndex} style={styles.questionCard}>
                    <View style={styles.questionMetaRow}>
                      <View style={styles.qIndexBadge}>
                        <Text style={styles.qIndexText}>Q{qIndex + 1}</Text>
                      </View>
                      <View
                        style={[
                          styles.difficultyBadge,
                          q.difficulty === 'Easy' && styles.diffEasy,
                          q.difficulty === 'Medium' && styles.diffMedium,
                          q.difficulty === 'Hard' && styles.diffHard,
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            q.difficulty === 'Easy' && styles.diffTextEasy,
                            q.difficulty === 'Medium' && styles.diffTextMedium,
                            q.difficulty === 'Hard' && styles.diffTextHard,
                          ]}
                        >
                          {q.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.qOfficialBadge}>Official UPSC Prelims</Text>
                    </View>
                    <Text style={styles.questionSnippet} numberOfLines={2}>
                      {q.questionText.replace(/\n+/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : activeYearItem.count > 0 ? (
              <View style={styles.topicNoteBox}>
                <Text style={styles.topicNoteText}>
                  {activeYearItem.count} question{activeYearItem.count > 1 ? 's appeared' : ' appeared'} in UPSC CSE {activeYearItem.year}. Practice chapter PYQs to master these core concepts.
                </Text>
              </View>
            ) : (
              <View style={styles.zeroNoteBox}>
                <Text style={styles.zeroNoteText}>
                  No questions were recorded from this topic in UPSC CSE {activeYearItem.year}.
                </Text>
              </View>
            )}

            {/* Clear Primary CTA Action */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePracticeClick}
              style={[
                styles.practiceActionBtn,
                activeYearItem.count === 0 && styles.practiceActionBtnMuted,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Practice questions for year ${activeYearItem.year}`}
            >
              <BookOpen
                size={14}
                color={
                  activeYearItem.count === 0
                    ? theme.colors.textPrimary
                    : theme.colors.darkButtonText
                }
              />
              <Text
                style={[
                  styles.practiceActionBtnText,
                  activeYearItem.count === 0 && styles.practiceActionBtnTextMuted,
                ]}
              >
                {activeYearItem.count > 0
                  ? `Practice ${activeYearItem.year} Questions (${matchingQuestionsForActiveYear.length || activeYearItem.count})`
                  : `Practice Chapter Questions (${chapter.pyqs?.length || chapter.totalQuestions10Yrs})`}
              </Text>
              <ArrowRight
                size={14}
                color={
                  activeYearItem.count === 0
                    ? theme.colors.textPrimary
                    : theme.colors.darkButtonText
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Real Examiner Pattern Insights (Derived strictly from real data) */}
      {realInsights.length > 0 && (
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeaderRow}>
            <Sparkles size={14} color={theme.colors.primary} strokeWidth={2.2} />
            <Text style={styles.insightsTitle}>Historical Frequency Insights</Text>
          </View>
          <View style={styles.insightsList}>
            {realInsights.map((insight, idx) => (
              <View key={idx} style={styles.insightBulletRow}>
                <View style={styles.insightBulletDot} />
                <Text style={styles.insightBulletText}>{insight}</Text>
              </View>
            ))}
          </View>
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
      padding: 18,
      gap: 16,
      ...theme.shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    trendIconBubble: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primarySoftBorder,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    rangeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDark ? '#262A36' : '#F1F5F9',
      borderColor: theme.colors.borderSubtle,
      borderWidth: 1,
    },
    rangeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    cardSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    rangeSelectorPills: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1C2029' : '#F1F5F9',
      borderColor: theme.colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 8,
      padding: 3,
      gap: 2,
    },
    rangePillBtn: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
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
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    rangePillBtnTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '800',
    },
    chartWrapper: {
      paddingTop: 6,
    },
    chartScrollContent: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingVertical: 4,
      minWidth: '100%',
      gap: 6,
    },
    barColumn: {
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 4,
      borderRadius: 8,
      minWidth: 34,
      flex: 1,
    },
    barColumnSelected: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.06)',
    },
    countBadgeWrapper: {
      alignItems: 'center',
      minHeight: 28,
      justifyContent: 'flex-end',
      marginBottom: 6,
    },
    peakBadge: {
      backgroundColor: isDark ? '#F59E0B' : '#D97706',
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
      marginBottom: 2,
    },
    peakBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    barCountText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    barCountTextZero: {
      color: theme.colors.textMuted,
      opacity: 0.7,
      fontSize: 10,
    },
    barCountTextSelected: {
      color: theme.colors.primary,
      fontWeight: '900',
    },
    barCountTextPeak: {
      color: isDark ? '#FBBF24' : '#D97706',
      fontWeight: '900',
    },
    barCanvas: {
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    barPill: {
      width: 14,
      backgroundColor: isDark ? '#3A4050' : '#CBD5E1',
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
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
      width: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    barPillPeak: {
      backgroundColor: isDark ? '#D97706' : '#B45309',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    barPillHovered: {
      backgroundColor: isDark ? '#4B5563' : '#94A3B8',
    },
    baselineSegment: {
      width: '100%',
      height: 1.5,
      backgroundColor: isDark ? '#2E3342' : '#E2E8F0',
      marginVertical: 4,
    },
    baselineSegmentActive: {
      backgroundColor: theme.colors.primary,
      height: 2,
    },
    yearLabelText: {
      fontSize: 10,
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
    explanationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 2,
    },
    explanationText: {
      fontSize: 11,
      color: theme.colors.textMuted,
      flex: 1,
      lineHeight: 15,
    },
    detailPanel: {
      backgroundColor: isDark ? '#1C202B' : '#F8FAFC',
      borderColor: isDark ? '#2C3140' : '#E2E8F0',
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      gap: 12,
    },
    detailHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    detailYearInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    calendarIconBubble: {
      width: 26,
      height: 26,
      borderRadius: 7,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailYearTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    detailCountPill: {
      backgroundColor: isDark ? '#262C3A' : '#EDE9FE',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    detailCountPillZero: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
    },
    detailCountPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#C4B5FD' : '#6D28D9',
    },
    detailCountPillTextZero: {
      color: theme.colors.textMuted,
    },
    yoyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    yoyTagIncrease: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#DCFCE7',
    },
    yoyTagDecrease: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
    },
    yoyTagNeutral: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
    },
    yoyTagBaseline: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
    },
    yoyTagText: {
      fontSize: 10,
      fontWeight: '700',
    },
    yoyTagTextIncrease: {
      color: isDark ? '#34D399' : '#059669',
    },
    yoyTagTextDecrease: {
      color: isDark ? '#F87171' : '#DC2626',
    },
    yoyTagTextNeutral: {
      color: theme.colors.textMuted,
    },
    yoyTagTextBaseline: {
      color: theme.colors.textMuted,
    },
    previewSection: {
      gap: 10,
    },
    questionsList: {
      gap: 8,
    },
    previewSectionHeading: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    questionCard: {
      backgroundColor: isDark ? '#232733' : '#FFFFFF',
      borderColor: isDark ? '#313746' : '#E2E8F0',
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      gap: 6,
    },
    questionMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    qIndexBadge: {
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    qIndexText: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    difficultyBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    diffEasy: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#DCFCE7',
    },
    diffMedium: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
    },
    diffHard: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
    },
    difficultyText: {
      fontSize: 9,
      fontWeight: '700',
    },
    diffTextEasy: {
      color: isDark ? '#34D399' : '#059669',
    },
    diffTextMedium: {
      color: isDark ? '#FBBF24' : '#D97706',
    },
    diffTextHard: {
      color: isDark ? '#F87171' : '#DC2626',
    },
    qOfficialBadge: {
      fontSize: 9,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    questionSnippet: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.textPrimary,
      fontWeight: '500',
    },
    topicNoteBox: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
      padding: 10,
      borderRadius: 8,
    },
    topicNoteText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    zeroNoteBox: {
      backgroundColor: isDark ? '#232733' : '#F1F5F9',
      padding: 10,
      borderRadius: 8,
    },
    zeroNoteText: {
      fontSize: 11,
      color: theme.colors.textMuted,
      lineHeight: 16,
    },
    practiceActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      gap: 8,
      marginTop: 2,
    },
    practiceActionBtnMuted: {
      backgroundColor: isDark ? '#262A36' : '#F1F5F9',
      borderColor: isDark ? '#313746' : '#CBD5E1',
      borderWidth: 1,
    },
    practiceActionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    practiceActionBtnTextMuted: {
      color: theme.colors.textPrimary,
    },
    insightsCard: {
      backgroundColor: isDark ? '#1C2029' : '#F8FAFC',
      borderColor: isDark ? '#282C38' : '#E2E8F0',
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      gap: 8,
    },
    insightsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    insightsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    insightsList: {
      gap: 5,
    },
    insightBulletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    insightBulletDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.primary,
    },
    insightBulletText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      lineHeight: 16,
      flex: 1,
    },
    emptyStateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      paddingHorizontal: 16,
      gap: 8,
    },
    emptyStateTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 11,
      color: theme.colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 16,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.darkButton,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 6,
      marginTop: 4,
    },
    retryBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    skeletonCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    skeletonBar: {
      backgroundColor: isDark ? '#262A36' : '#E2E8F0',
      borderRadius: 4,
    },
  });
}
