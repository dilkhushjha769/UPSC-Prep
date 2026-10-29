import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ListFilter,
  RotateCcw,
  Timer,
  X,
} from '@/components/common/LucideIcons';
import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';
import {
  CANONICAL_ALL_SUBJECTS,
  CANONICAL_CSAT_SUBJECTS,
  CANONICAL_GS1_SUBJECTS,
  getAvailableYearsForFilter,
  queryQuestionBank,
} from '@/data/questionBankRepository';
import { Chapter, DifficultyLevel, PYQQuestion } from '@/types/prelims';

interface TopicQuestionBankBrowserProps {
  initialPaper?: 'ALL' | 'GS1' | 'GS2';
  initialSubjectId?: string | 'all';
  initialTopicId?: string | 'all';
  onStartPracticeSet: (title: string, questions: PYQQuestion[], initialIndex?: number) => void;
  onStartQuizSet: (title: string, questions: PYQQuestion[]) => void;
}

const PAGE_SIZE = 20;

export function TopicQuestionBankBrowser({
  initialPaper = 'GS1',
  initialSubjectId = 'all',
  initialTopicId = 'all',
  onStartPracticeSet,
  onStartQuizSet,
}: TopicQuestionBankBrowserProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedPaper, setSelectedPaper] = useState<'ALL' | 'GS1' | 'GS2'>(initialPaper);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>(initialSubjectId);
  const [selectedTopicId, setSelectedTopicId] = useState<string | 'all'>(initialTopicId);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [onlyNeedsReview, setOnlyNeedsReview] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Available subjects based on selected paper
  const availableSubjects = useMemo(() => {
    if (selectedPaper === 'GS1') return CANONICAL_GS1_SUBJECTS;
    if (selectedPaper === 'GS2') return CANONICAL_CSAT_SUBJECTS;
    return CANONICAL_ALL_SUBJECTS;
  }, [selectedPaper]);

  const activeSubject = useMemo(
    () => availableSubjects.find((s) => s.id === selectedSubjectId) || null,
    [availableSubjects, selectedSubjectId]
  );

  // Available topics based on selected subject (or all topics in paper)
  const availableTopics = useMemo<Chapter[]>(() => {
    if (activeSubject) return activeSubject.chapters;
    return availableSubjects.flatMap((s) => s.chapters);
  }, [activeSubject, availableSubjects]);

  const activeTopic = useMemo(
    () => availableTopics.find((t) => t.id === selectedTopicId) || null,
    [availableTopics, selectedTopicId]
  );

  // Available subtopics when a topic is selected
  const availableSubtopics = useMemo(() => {
    if (!activeTopic || !activeTopic.subtopics) return [];
    return activeTopic.subtopics;
  }, [activeTopic]);

  const availableYears = useMemo(
    () => getAvailableYearsForFilter(selectedPaper),
    [selectedPaper]
  );

  // Filtered questions from repository
  const matchingQuestions = useMemo(
    () =>
      queryQuestionBank({
        paper: selectedPaper,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        subtopicId: selectedSubtopicId,
        year: selectedYear,
        difficulty: selectedDifficulty,
        onlyNeedsReview,
        searchQuery,
      }),
    [
      selectedPaper,
      selectedSubjectId,
      selectedTopicId,
      selectedSubtopicId,
      selectedYear,
      selectedDifficulty,
      onlyNeedsReview,
      searchQuery,
    ]
  );

  const visibleQuestions = useMemo(
    () => matchingQuestions.slice(0, visibleCount),
    [matchingQuestions, visibleCount]
  );

  const hasActiveFilters =
    selectedSubjectId !== 'all' ||
    selectedTopicId !== 'all' ||
    selectedSubtopicId !== 'all' ||
    selectedYear !== 'all' ||
    selectedDifficulty !== 'all' ||
    onlyNeedsReview ||
    searchQuery.trim().length > 0;

  const handleSelectPaper = (paper: 'ALL' | 'GS1' | 'GS2') => {
    setSelectedPaper(paper);
    setSelectedSubjectId('all');
    setSelectedTopicId('all');
    setSelectedSubtopicId('all');
    setVisibleCount(PAGE_SIZE);
  };

  const handleSelectSubject = (subjectId: string | 'all') => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId('all');
    setSelectedSubtopicId('all');
    setVisibleCount(PAGE_SIZE);
  };

  const handleSelectTopic = (topicId: string | 'all') => {
    setSelectedTopicId(topicId);
    setSelectedSubtopicId('all');
    setVisibleCount(PAGE_SIZE);
  };

  const handleResetFilters = () => {
    setSelectedSubjectId('all');
    setSelectedTopicId('all');
    setSelectedSubtopicId('all');
    setSelectedYear('all');
    setSelectedDifficulty('all');
    setOnlyNeedsReview(false);
    setSearchQuery('');
    setVisibleCount(PAGE_SIZE);
  };

  // Build dynamic context title for Practice/Quiz launches
  const currentScopeTitle = useMemo(() => {
    const parts: string[] = [];
    if (activeTopic) {
      parts.push(activeTopic.title);
    } else if (activeSubject) {
      parts.push(activeSubject.title);
    } else if (selectedPaper === 'GS1') {
      parts.push('GS Paper I');
    } else if (selectedPaper === 'GS2') {
      parts.push('GS Paper II (CSAT)');
    } else {
      parts.push('UPSC Prelims Question Bank');
    }
    if (selectedYear !== 'all') {
      parts.push(String(selectedYear));
    }
    return parts.join(' · ');
  }, [activeTopic, activeSubject, selectedPaper, selectedYear]);

  const activeSubtopicName = useMemo(() => {
    if (selectedSubtopicId === 'all') return null;
    return availableSubtopics.find((st) => st.id === selectedSubtopicId)?.name || null;
  }, [availableSubtopics, selectedSubtopicId]);

  return (
    <View style={styles.container}>
      {/* 1. HIERARCHICAL BREADCRUMB BAR */}
      <View style={styles.breadcrumbBar}>
        <Pressable onPress={() => handleSelectPaper(selectedPaper)}>
          <Text style={styles.breadcrumbSegment}>
            {selectedPaper === 'GS1'
              ? 'GS Paper I'
              : selectedPaper === 'GS2'
                ? 'GS Paper II (CSAT)'
                : 'All Papers'}
          </Text>
        </Pressable>

        {activeSubject && (
          <>
            <ChevronRight size={13} color={theme.colors.textMuted} strokeWidth={2} />
            <Pressable onPress={() => handleSelectSubject(activeSubject.id)}>
              <Text
                style={[
                  styles.breadcrumbSegment,
                  !activeTopic && styles.breadcrumbSegmentActive,
                ]}
              >
                {activeSubject.title}
              </Text>
            </Pressable>
          </>
        )}

        {activeTopic && (
          <>
            <ChevronRight size={13} color={theme.colors.textMuted} strokeWidth={2} />
            <Pressable onPress={() => handleSelectTopic(activeTopic.id)}>
              <Text
                style={[
                  styles.breadcrumbSegment,
                  !activeSubtopicName && styles.breadcrumbSegmentActive,
                ]}
              >
                {activeTopic.title}
              </Text>
            </Pressable>
          </>
        )}

        {activeSubtopicName && (
          <>
            <ChevronRight size={13} color={theme.colors.textMuted} strokeWidth={2} />
            <Text style={[styles.breadcrumbSegment, styles.breadcrumbSegmentActive]}>
              {activeSubtopicName}
            </Text>
          </>
        )}
      </View>

      {/* 2. SEARCH INPUT */}
      <View style={styles.searchBox}>
        <ListFilter size={16} color={theme.colors.textMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(txt) => {
            setSearchQuery(txt);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search by question text, topic, article, or keyword..."
          placeholderTextColor={theme.colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => {
              setSearchQuery('');
              setVisibleCount(PAGE_SIZE);
            }}
            style={styles.clearSearchBtn}
          >
            <X size={15} color={theme.colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>

      {/* 3. PAPER FILTER ROW */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>1. PAPER</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {(
            [
              { key: 'GS1', label: 'GS Paper I (1,100)' },
              { key: 'GS2', label: 'GS Paper II · CSAT (720)' },
              { key: 'ALL', label: 'All Papers (1,820)' },
            ] as const
          ).map((item) => {
            const isSelected = selectedPaper === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => handleSelectPaper(item.key)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. SUBJECT FILTER ROW */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>2. SUBJECT</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          <Pressable
            style={[styles.pill, selectedSubjectId === 'all' && styles.pillActive]}
            onPress={() => handleSelectSubject('all')}
          >
            <Text
              style={[
                styles.pillText,
                selectedSubjectId === 'all' && styles.pillTextActive,
              ]}
            >
              All Subjects ({availableSubjects.reduce((acc, s) => acc + s.totalQuestions10Yrs, 0)})
            </Text>
          </Pressable>

          {availableSubjects.map((subj) => {
            const isSelected = selectedSubjectId === subj.id;
            return (
              <Pressable
                key={subj.id}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => handleSelectSubject(subj.id)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {subj.title} ({subj.totalQuestions10Yrs})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. TOPIC FILTER ROW */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>
          3. TOPIC {activeSubject ? `(${activeSubject.shortTitle})` : ''}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          <Pressable
            style={[styles.pill, selectedTopicId === 'all' && styles.pillActive]}
            onPress={() => handleSelectTopic('all')}
          >
            <Text
              style={[
                styles.pillText,
                selectedTopicId === 'all' && styles.pillTextActive,
              ]}
            >
              All Topics ({availableTopics.reduce((acc, t) => acc + t.totalQuestions10Yrs, 0)})
            </Text>
          </Pressable>

          {availableTopics.map((top) => {
            const isSelected = selectedTopicId === top.id;
            return (
              <Pressable
                key={top.id}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => handleSelectTopic(top.id)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {top.title} ({top.totalQuestions10Yrs})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 6. SUBTOPIC FILTER ROW (VISIBLE WHEN A TOPIC IS SELECTED) */}
      {activeTopic && availableSubtopics.length > 0 && (
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>4. SUBTOPIC ({activeTopic.title})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            <Pressable
              style={[styles.pill, selectedSubtopicId === 'all' && styles.pillActive]}
              onPress={() => {
                setSelectedSubtopicId('all');
                setVisibleCount(PAGE_SIZE);
              }}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedSubtopicId === 'all' && styles.pillTextActive,
                ]}
              >
                All Subtopics ({activeTopic.totalQuestions10Yrs})
              </Text>
            </Pressable>

            {availableSubtopics.map((st) => {
              const isSelected = selectedSubtopicId === st.id;
              return (
                <Pressable
                  key={st.id}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => {
                    setSelectedSubtopicId(st.id);
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                    {st.name} ({st.count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 7. YEAR, DIFFICULTY & REVIEW QUEUE FILTERS */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>YEAR & DIFFICULTY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          <Pressable
            style={[styles.pill, selectedYear === 'all' && styles.pillActive]}
            onPress={() => {
              setSelectedYear('all');
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <Text style={[styles.pillText, selectedYear === 'all' && styles.pillTextActive]}>
              All Years
            </Text>
          </Pressable>

          {availableYears.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <Pressable
                key={yr}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => {
                  setSelectedYear(yr);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {yr}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.verticalDivider} />

          {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <Pressable
                key={diff}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => {
                  setSelectedDifficulty(diff);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {diff === 'all' ? 'All Difficulty' : diff}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.verticalDivider} />

          <Pressable
            style={[styles.pill, onlyNeedsReview && styles.pillActive]}
            onPress={() => {
              setOnlyNeedsReview(!onlyNeedsReview);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <AlertTriangle
              size={12}
              color={onlyNeedsReview ? theme.colors.darkButtonText : '#D97706'}
              strokeWidth={2.2}
            />
            <Text style={[styles.pillText, onlyNeedsReview && styles.pillTextActive]}>
              Review / Cross-Tagged
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* 8. RESULTS SUMMARY & PRACTICE ACTION BAR */}
      <View style={styles.actionBar}>
        <View style={styles.actionCountCol}>
          <Text style={styles.matchingCountText}>
            {matchingQuestions.length} Matching {matchingQuestions.length === 1 ? 'Question' : 'Questions'}
          </Text>
          {hasActiveFilters && (
            <Pressable style={styles.clearFiltersLink} onPress={handleResetFilters}>
              <RotateCcw size={12} color="#006FFD" strokeWidth={2.2} />
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </Pressable>
          )}
        </View>

        {matchingQuestions.length > 0 && (
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.practiceSetBtn, pressed && styles.pressed]}
              onPress={() => onStartPracticeSet(currentScopeTitle, matchingQuestions, 0)}
            >
              <BookOpen size={14} color={theme.colors.textPrimary} strokeWidth={2.2} />
              <Text style={styles.practiceSetBtnText}>
                Practice ({matchingQuestions.length})
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.quizSetBtn, pressed && styles.pressed]}
              onPress={() =>
                onStartQuizSet(
                  `${currentScopeTitle} (${Math.min(25, matchingQuestions.length)} Qs)`,
                  matchingQuestions.slice(0, 25)
                )
              }
            >
              <Timer size={14} color={theme.colors.darkButtonText} strokeWidth={2.2} />
              <Text style={styles.quizSetBtnText}>Take Quiz</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 9. QUESTIONS LIST OR CLEAN EMPTY STATE */}
      {matchingQuestions.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Text style={styles.emptyStateTitle}>No questions match the selected filters</Text>
          <Text style={styles.emptyStateSubtitle}>
            Try clearing the year, difficulty, or search keyword to broaden your topic selection.
          </Text>
          <Pressable style={styles.emptyResetBtn} onPress={handleResetFilters}>
            <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.questionsList}>
          {visibleQuestions.map((q, idx) => (
            <Pressable
              key={q.id}
              style={({ pressed }) => [
                styles.questionRow,
                pressed && styles.questionRowPressed,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}
              onPress={() => onStartPracticeSet(currentScopeTitle, matchingQuestions, idx)}
            >
              <View style={styles.questionMetaRow}>
                <View style={styles.metaLeftRow}>
                  <Text style={styles.yearBadgeText}>
                    UPSC {q.year} · {q.paper === 'GS2' ? 'CSAT' : 'GS-I'}
                  </Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.topicBreadcrumbText} numberOfLines={1}>
                    {q.subjectName} → {q.chapterName}
                  </Text>
                </View>

                <View style={styles.metaRightRow}>
                  {q.verificationNote ? (
                    <View style={styles.reviewFlagPill}>
                      <Text style={styles.reviewFlagText}>Key Note</Text>
                    </View>
                  ) : null}
                  <Text style={styles.difficultyText}>{q.difficulty}</Text>
                </View>
              </View>

              {q.subtopicName && q.subtopicName !== q.chapterName && (
                <Text style={styles.subtopicLabel} numberOfLines={1}>
                  Subtopic: {q.subtopicName}
                </Text>
              )}

              <Text style={styles.questionPreviewText} numberOfLines={3}>
                {q.questionText.replace(/^Passage:\s*/i, '')}
              </Text>
            </Pressable>
          ))}

          {visibleCount < matchingQuestions.length && (
            <Pressable
              style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.pressed]}
              onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              <Text style={styles.loadMoreBtnText}>
                Load More Questions (Showing {visibleQuestions.length} of {matchingQuestions.length})
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 24,
    },
    breadcrumbBar: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.bgSurfaceMuted,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    breadcrumbSegment: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    breadcrumbSegmentActive: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgSurface,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 42,
      gap: 8,
      marginBottom: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textPrimary,
      paddingVertical: 0,
    },
    clearSearchBtn: {
      padding: 4,
    },
    filterGroup: {
      marginBottom: 12,
    },
    filterGroupLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.7,
      marginBottom: 6,
    },
    pillsScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: 12,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.bgSurface,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    pillActive: {
      backgroundColor: theme.colors.darkButton,
      borderColor: theme.colors.darkButton,
    },
    pillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    pillTextActive: {
      color: theme.colors.darkButtonText,
      fontWeight: '700',
    },
    verticalDivider: {
      width: 1,
      height: 18,
      backgroundColor: theme.colors.borderSubtle,
      marginHorizontal: 4,
    },
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderSubtle,
      marginBottom: 12,
    },
    actionCountCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    matchingCountText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    clearFiltersLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    clearFiltersText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#006FFD',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    practiceSetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.bgSurface,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
    },
    practiceSetBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    quizSetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.darkButton,
    },
    quizSetBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    questionsList: {
      gap: 8,
    },
    questionRow: {
      backgroundColor: theme.colors.bgSurface,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      borderRadius: 10,
      padding: 14,
    },
    questionRowPressed: {
      opacity: 0.8,
    },
    questionMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 5,
      gap: 8,
    },
    metaLeftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    yearBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#006FFD',
    },
    metaDot: {
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    topicBreadcrumbText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      flex: 1,
    },
    metaRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reviewFlagPill: {
      backgroundColor: 'rgba(217, 119, 6, 0.14)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    reviewFlagText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#D97706',
    },
    difficultyText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    subtopicLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    questionPreviewText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    loadMoreBtn: {
      marginTop: 8,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.bgSurface,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      alignItems: 'center',
    },
    loadMoreBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    emptyStateBox: {
      paddingVertical: 40,
      paddingHorizontal: 20,
      alignItems: 'center',
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    emptyStateTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    emptyStateSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    emptyResetBtn: {
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    emptyResetBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    pressed: {
      opacity: 0.78,
    },
  });

