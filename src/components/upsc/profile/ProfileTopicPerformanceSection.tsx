import React, { useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
  Target,
  X,
  Zap,
} from 'lucide-react-native';
import { TopicPerformanceStat } from '@/services/userPracticeAnalyticsService';
import { GLOBAL_PRIMARY_BLUE } from '@/constants/colors';

export interface ProfileTopicPerformanceSectionProps {
  isDark?: boolean;
  topicPerformanceList: TopicPerformanceStat[];
  weakTopicsList: TopicPerformanceStat[];
  onSelectTopic: (topic: string) => void;
}

type FilterMode = 'ALL' | 'WEAK' | 'MASTERED' | 'UNATTEMPTED';

export function ProfileTopicPerformanceSection({
  isDark = false,
  topicPerformanceList = [],
  weakTopicsList = [],
  onSelectTopic,
}: ProfileTopicPerformanceSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);

  // Palette & Tokens
  const cardBg = isDark ? '#141C28' : '#FFFFFF';
  const innerCardBg = isDark ? '#1B2433' : '#F9F8F5';
  const cardBorder = isDark ? '#253244' : '#EAE5DC';
  const textPrimary = isDark ? '#F0F4F8' : '#1C2433';
  const textSecondary = isDark ? '#9DA8B9' : '#5B6475';
  const textMuted = isDark ? '#64748B' : '#8A94A6';
  const pillBg = isDark ? '#1E293B' : '#F0EDE6';
  const primaryBlue = GLOBAL_PRIMARY_BLUE;
  const accentAmber = '#FF9500';
  const emeraldGreen = '#10B981';
  const alertRed = '#EF4444';

  // Overall aggregate stats
  const overallStats = useMemo(() => {
    let totalQuestionsInBank = 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let masteredCount = 0;

    for (const t of topicPerformanceList) {
      totalQuestionsInBank += t.totalQuestions || 0;
      totalAttempted += t.attemptedCount || 0;
      totalCorrect += t.correctCount || 0;
      if (t.attemptedCount >= 5 && t.accuracyPct >= 75) {
        masteredCount += 1;
      }
    }

    const overallAccuracy =
      totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const coveragePct =
      totalQuestionsInBank > 0
        ? Math.round((totalAttempted / totalQuestionsInBank) * 100)
        : 0;

    return {
      totalQuestionsInBank,
      totalAttempted,
      totalCorrect,
      masteredCount,
      overallAccuracy,
      coveragePct,
    };
  }, [topicPerformanceList]);

  // Filtered topics based on search & filter tabs
  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return topicPerformanceList.filter((item) => {
      // 1. Search Query filter
      if (q) {
        const matchName = item.topic.toLowerCase().includes(q);
        const matchSub = (item.subject || '').toLowerCase().includes(q);
        if (!matchName && !matchSub) return false;
      }

      // 2. Segment filter
      if (filterMode === 'WEAK') {
        return item.isWeakTopic || (item.attemptedCount > 0 && item.accuracyPct < 60);
      }
      if (filterMode === 'MASTERED') {
        return item.attemptedCount >= 3 && item.accuracyPct >= 75;
      }
      if (filterMode === 'UNATTEMPTED') {
        return item.attemptedCount === 0;
      }
      return true;
    });
  }, [topicPerformanceList, searchQuery, filterMode]);

  // Topics to display (top 6 by default, or all if expanded or searching)
  const displayTopics = useMemo(() => {
    if (isExpanded || searchQuery.trim().length > 0 || filterMode !== 'ALL') {
      return filteredTopics;
    }
    return filteredTopics.slice(0, 6);
  }, [filteredTopics, isExpanded, searchQuery, filterMode]);

  return (
    <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* 1. SECTION HEADER */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.15)' : '#FFF3EB' },
              ]}
            >
              <Target size={17} color={accentAmber} strokeWidth={2.4} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Topic Mastery & Accuracy
              </Text>
              <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                Concept-level accuracy, coverage & high-yield revision
              </Text>
            </View>
          </View>

          <View style={[styles.topicsTrackedBadge, { backgroundColor: pillBg, borderColor: cardBorder }]}>
            <Text style={[styles.topicsTrackedText, { color: textPrimary }]}>
              {topicPerformanceList.length} Topics
            </Text>
          </View>
        </View>

        {/* 2. OVERALL AGGREGATE SUMMARY STRIP */}
        <View style={[styles.aggregateStrip, { backgroundColor: innerCardBg, borderColor: cardBorder }]}>
          <View style={styles.aggItem}>
            <Text style={[styles.aggValue, { color: emeraldGreen }]}>
              {overallStats.overallAccuracy}%
            </Text>
            <Text style={[styles.aggLabel, { color: textSecondary }]}>Avg Accuracy</Text>
          </View>
          <View style={[styles.aggDivider, { backgroundColor: cardBorder }]} />
          <View style={styles.aggItem}>
            <Text style={[styles.aggValue, { color: primaryBlue }]}>
              {overallStats.totalAttempted} / {overallStats.totalQuestionsInBank}
            </Text>
            <Text style={[styles.aggLabel, { color: textSecondary }]}>
              PYQs Covered ({overallStats.coveragePct}%)
            </Text>
          </View>
          <View style={[styles.aggDivider, { backgroundColor: cardBorder }]} />
          <View style={styles.aggItem}>
            <Text style={[styles.aggValue, { color: weakTopicsList.length > 0 ? alertRed : textMuted }]}>
              {weakTopicsList.length}
            </Text>
            <Text style={[styles.aggLabel, { color: textSecondary }]}>Weak Areas</Text>
          </View>
        </View>
      </View>

      {/* 3. PRIORITY WEAK-AREA ALERT CARD (If any weak topics exist) */}
      {weakTopicsList.length > 0 && (
        <View
          style={[
            styles.weakAreaAlertBox,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
            },
          ]}
        >
          <View style={styles.weakAreaHeader}>
            <AlertTriangle size={15} color={alertRed} strokeWidth={2.4} />
            <Text style={[styles.weakAreaAlertTitle, { color: alertRed }]}>
              PRIORITY REVISION TARGETS (&lt;60% ACCURACY)
            </Text>
          </View>
          <Text style={[styles.weakAreaDesc, { color: textSecondary }]}>
            Tap any topic to launch instant targeted MCQ &amp; Mains drills:
          </Text>

          <View style={styles.weakChipsWrap}>
            {weakTopicsList.slice(0, 5).map((wt) => (
              <TouchableOpacity
                key={`weak_${wt.topic}`}
                activeOpacity={0.75}
                onPress={() => onSelectTopic(wt.topic)}
                style={[
                  styles.weakChipBtn,
                  {
                    backgroundColor: cardBg,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
                  },
                ]}
              >
                <Zap size={11} color={alertRed} strokeWidth={2.4} />
                <Text style={[styles.weakChipText, { color: textPrimary }]}>{wt.topic}</Text>
                <View style={[styles.weakChipBadge, { backgroundColor: isDark ? '#2A181A' : '#FEE2E2' }]}>
                  <Text style={[styles.weakChipAccuracy, { color: alertRed }]}>
                    {wt.attemptedCount > 0 ? `${wt.accuracyPct}%` : 'New'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 4. SEARCH & FILTER BAR */}
      <View style={styles.searchAndFilterWrap}>
        <View style={[styles.searchBox, { backgroundColor: innerCardBg, borderColor: cardBorder }]}>
          <Search size={14} color={textMuted} strokeWidth={2.2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search topic or subject (e.g. Fundamental Rights, Inflation)..."
            placeholderTextColor={textMuted}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterPillsRow}>
          {[
            { id: 'ALL', label: `All (${topicPerformanceList.length})` },
            { id: 'WEAK', label: `Needs Revision (${weakTopicsList.length})` },
            { id: 'MASTERED', label: `Mastered (${overallStats.masteredCount})` },
            {
              id: 'UNATTEMPTED',
              label: `Unattempted (${topicPerformanceList.filter((t) => t.attemptedCount === 0).length})`,
            },
          ].map((pill) => {
            const isSelected = filterMode === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                activeOpacity={0.75}
                onPress={() => setFilterMode(pill.id as FilterMode)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? textPrimary : pillBg,
                    borderColor: isSelected ? textPrimary : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? (isDark ? '#0B1018' : '#FFFFFF') : textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. TOPIC CARDS LIST */}
      <View style={styles.cardsList}>
        {displayTopics.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: cardBorder }]}>
            <BookOpen size={24} color={textMuted} strokeWidth={1.8} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No topics match your filter</Text>
            <Text style={[styles.emptySub, { color: textSecondary }]}>
              Try clearing your search query or switching filters.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSearchQuery('');
                setFilterMode('ALL');
              }}
              style={[styles.resetFilterBtn, { borderColor: cardBorder }]}
            >
              <Text style={[styles.resetFilterBtnText, { color: primaryBlue }]}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayTopics.map((item) => {
            const isAttempted = item.attemptedCount > 0;
            const accuracy = item.accuracyPct || 0;
            const isHighAccuracy = accuracy >= 75;
            const isMediumAccuracy = accuracy >= 55 && accuracy < 75;

            // Accuracy color badge
            let badgeBg = isDark ? '#1F2937' : '#F3F4F6';
            let badgeTextColor = textSecondary;
            let badgeLabel = 'Unattempted';

            if (isAttempted) {
              if (isHighAccuracy) {
                badgeBg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7';
                badgeTextColor = emeraldGreen;
                badgeLabel = `${accuracy}% Mastered`;
              } else if (isMediumAccuracy) {
                badgeBg = isDark ? 'rgba(255, 149, 0, 0.16)' : '#FEF3C7';
                badgeTextColor = '#D97706';
                badgeLabel = `${accuracy}% Moderate`;
              } else {
                badgeBg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2';
                badgeTextColor = alertRed;
                badgeLabel = `${accuracy}% Needs Work`;
              }
            }

            const coveragePct = Math.min(
              100,
              Math.round((item.attemptedCount / (item.totalQuestions || 1)) * 100)
            );

            return (
              <TouchableOpacity
                key={item.topic}
                activeOpacity={0.85}
                onPress={() => onSelectTopic(item.topic)}
                style={[
                  styles.topicCard,
                  {
                    backgroundColor: innerCardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                {/* Top Row: Subject Tag + Prelims/Mains Meta + Accuracy Pill */}
                <View style={styles.topicCardTopRow}>
                  <View style={styles.subjectTagWrap}>
                    <View style={[styles.subjectMiniBadge, { backgroundColor: pillBg, borderColor: cardBorder }]}>
                      <Text style={[styles.subjectMiniBadgeText, { color: textSecondary }]}>
                        {item.subject || 'General Studies'}
                      </Text>
                    </View>
                    <Text style={[styles.qCountsMeta, { color: textMuted }]}>
                      {item.prelimsTotal} Pre · {item.mainsTotal} Mains
                    </Text>
                  </View>

                  <View style={[styles.accuracyBadge, { backgroundColor: badgeBg }]}>
                    {isAttempted && isHighAccuracy && (
                      <CheckCircle2 size={12} color={badgeTextColor} strokeWidth={2.4} />
                    )}
                    {isAttempted && !isHighAccuracy && accuracy < 55 && (
                      <AlertTriangle size={12} color={badgeTextColor} strokeWidth={2.4} />
                    )}
                    <Text style={[styles.accuracyBadgeText, { color: badgeTextColor }]}>
                      {badgeLabel}
                    </Text>
                  </View>
                </View>

                {/* Middle Row: Topic Title & Action Arrow */}
                <View style={styles.topicTitleRow}>
                  <Text style={[styles.topicTitleText, { color: textPrimary }]} numberOfLines={1}>
                    {item.topic}
                  </Text>
                  <View style={styles.practiceCta}>
                    <Text style={[styles.practiceCtaText, { color: primaryBlue }]}>Practice</Text>
                    <ArrowRight size={12} color={primaryBlue} strokeWidth={2.2} />
                  </View>
                </View>

                {/* Progress Bar (Coverage of questions in bank) */}
                <View style={styles.progressBarWrapper}>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? '#243042' : '#E5E7EB' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${coveragePct}%`,
                          backgroundColor: isHighAccuracy ? emeraldGreen : isMediumAccuracy ? accentAmber : alertRed,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: textMuted }]}>
                    {item.attemptedCount} / {item.totalQuestions} Solved ({coveragePct}%)
                  </Text>
                </View>

                {/* Bottom Row: Breakdown Counters */}
                <View style={styles.countersRow}>
                  <View style={styles.counterItem}>
                    <Text style={[styles.counterLabel, { color: textMuted }]}>Correct:</Text>
                    <Text style={[styles.counterValue, { color: emeraldGreen }]}>
                      {item.correctCount}
                    </Text>
                  </View>
                  <View style={styles.counterItem}>
                    <Text style={[styles.counterLabel, { color: textMuted }]}>Incorrect:</Text>
                    <Text style={[styles.counterValue, { color: alertRed }]}>
                      {item.incorrectCount}
                    </Text>
                  </View>
                  <View style={styles.counterItem}>
                    <Text style={[styles.counterLabel, { color: textMuted }]}>Remaining:</Text>
                    <Text style={[styles.counterValue, { color: textSecondary }]}>
                      {item.remainingCount}
                    </Text>
                  </View>
                  {item.avgTimeSeconds > 0 && (
                    <View style={[styles.counterItem, { marginLeft: 'auto' }]}>
                      <Clock size={11} color={textMuted} />
                      <Text style={[styles.counterValue, { color: textMuted, fontWeight: '500' }]}>
                        {Math.round(item.avgTimeSeconds)}s / Q
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* 6. EXPAND / COLLAPSE BUTTON */}
      {filteredTopics.length > 6 && searchQuery.trim().length === 0 && filterMode === 'ALL' && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsExpanded((prev) => !prev)}
          style={[styles.expandToggleBtn, { borderColor: cardBorder, backgroundColor: innerCardBg }]}
        >
          <Text style={[styles.expandToggleBtnText, { color: textPrimary }]}>
            {isExpanded
              ? 'Show Top Topics Only'
              : `View All ${filteredTopics.length} Topics (${filteredTopics.length - 6} more)`}
          </Text>
          {isExpanded ? (
            <ChevronUp size={15} color={textPrimary} strokeWidth={2.2} />
          ) : (
            <ChevronDown size={15} color={textPrimary} strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      } as object,
    }),
  },

  // 1. Header
  headerBlock: {
    gap: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  topicsTrackedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  topicsTrackedText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // 2. Aggregate Strip
  aggregateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  aggItem: {
    alignItems: 'center',
    flex: 1,
  },
  aggValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  aggLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  aggDivider: {
    width: 1,
    height: 24,
  },

  // 3. Priority Weak Area Box
  weakAreaAlertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  weakAreaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weakAreaAlertTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weakAreaDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  weakChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  weakChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  weakChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weakChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  weakChipAccuracy: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  // 4. Search & Filter
  searchAndFilterWrap: {
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
    }),
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
  },

  // 5. Cards List
  cardsList: {
    gap: 10,
  },
  topicCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  topicCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subjectMiniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  subjectMiniBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  qCountsMeta: {
    fontSize: 11,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accuracyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topicTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  topicTitleText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  practiceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  practiceCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress Bar
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Counters Row
  countersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterLabel: {
    fontSize: 11,
  },
  counterValue: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Empty Box
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  resetFilterBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Expand Button
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  expandToggleBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

