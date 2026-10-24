import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lightbulb,
  ListFilter,
  Eye,
  HelpCircle,
  Filter,
  X,
} from '@/components/common/LucideIcons';
import { PYQQuestion, Chapter } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';

type QuestionStatusFilter = 'all' | 'solved' | 'incorrect' | 'unsolved' | 'unattempted';
type YearFilter = 'all' | number;
type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';

interface PracticeModalProps {
  visible: boolean;
  chapter: Chapter | null;
  questions: PYQQuestion[];
  onClose: () => void;
}

export function PracticeModal({
  visible,
  chapter,
  questions,
  onClose,
}: PracticeModalProps) {
  // viewMode: 'list' shows all questions in a vertical list
  // 'attempt' opens the selected question to attempt with options
  const [viewMode, setViewMode] = useState<'list' | 'attempt'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  // Filter States
  const [statusFilter, setStatusFilter] = useState<QuestionStatusFilter>('all');
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');

  // Track viewed questions:
  // - unattempted: user has NOT opened/seen yet (!seenIndices[idx] && selectedAnswers[idx] === undefined)
  // - unsolved: user HAS opened/seen, but did not choose any option (seenIndices[idx] && selectedAnswers[idx] === undefined)
  // - solved: user attempted and picked correct option
  // - incorrect: user attempted and picked incorrect option
  const [seenIndices, setSeenIndices] = useState<Record<number, boolean>>({});

  // Dropdown Picker Modals
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showDiffPicker, setShowDiffPicker] = useState(false);

  // Derived unique years from available questions
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(questions.map((q) => q.year).filter(Boolean)));
    return years.sort((a, b) => b - a);
  }, [questions]);

  const availableDifficulties = ['all', 'Easy', 'Medium', 'Hard'] as const;

  if (!visible || !chapter || questions.length === 0) return null;

  const currentQ = questions[currentIndex] || questions[0];
  const selectedOpt = selectedAnswers[currentIndex];
  const hasAnswered = selectedOpt !== undefined;

  const answeredCount = Object.keys(selectedAnswers).length;

  // Compute status indices
  const solvedIndices = new Set(
    questions
      .map((q, idx) => (selectedAnswers[idx] === q.correctAnswer ? idx : -1))
      .filter((idx) => idx !== -1)
  );

  const incorrectIndices = new Set(
    questions
      .map((q, idx) =>
        selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== q.correctAnswer
          ? idx
          : -1
      )
      .filter((idx) => idx !== -1)
  );

  const unsolvedIndices = new Set(
    questions
      .map((_, idx) => (seenIndices[idx] && selectedAnswers[idx] === undefined ? idx : -1))
      .filter((idx) => idx !== -1)
  );

  const unattemptedIndices = new Set(
    questions
      .map((_, idx) => (!seenIndices[idx] && selectedAnswers[idx] === undefined ? idx : -1))
      .filter((idx) => idx !== -1)
  );

  const solvedCount = solvedIndices.size;
  const incorrectCount = incorrectIndices.size;
  const unsolvedCount = unsolvedIndices.size;
  const unattemptedCount = unattemptedIndices.size;

  // Filtered list with original indices preserved
  const filteredQuestions = questions
    .map((q, originalIndex) => ({ q, originalIndex }))
    .filter(({ q, originalIndex }) => {
      // 1. Status Filter
      if (statusFilter === 'solved' && !solvedIndices.has(originalIndex)) return false;
      if (statusFilter === 'incorrect' && !incorrectIndices.has(originalIndex)) return false;
      if (statusFilter === 'unsolved' && !unsolvedIndices.has(originalIndex)) return false;
      if (statusFilter === 'unattempted' && !unattemptedIndices.has(originalIndex)) return false;

      // 2. Year Filter
      if (selectedYear !== 'all' && q.year !== selectedYear) return false;

      // 3. Difficulty Filter
      if (
        selectedDifficulty !== 'all' &&
        q.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()
      ) {
        return false;
      }

      return true;
    });

  const isFilteringActive =
    statusFilter !== 'all' || selectedYear !== 'all' || selectedDifficulty !== 'all';

  // Current position in filtered list for previous/next navigation
  const currentFilteredPos = filteredQuestions.findIndex(
    (item) => item.originalIndex === currentIndex
  );

  const hasPrev = !isFilteringActive
    ? currentIndex > 0
    : currentFilteredPos > 0;

  const hasNext = !isFilteringActive
    ? currentIndex < questions.length - 1
    : currentFilteredPos >= 0 && currentFilteredPos < filteredQuestions.length - 1;

  const handleSelectOption = (key: string) => {
    if (hasAnswered) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  };

  const handleToggleBookmark = () => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleNext = () => {
    if (!isFilteringActive) {
      if (currentIndex < questions.length - 1) {
        const nextIdx = currentIndex + 1;
        setSeenIndices((prev) => ({ ...prev, [nextIdx]: true }));
        setCurrentIndex(nextIdx);
      }
    } else {
      if (currentFilteredPos >= 0 && currentFilteredPos < filteredQuestions.length - 1) {
        const nextOrigIdx = filteredQuestions[currentFilteredPos + 1].originalIndex;
        setSeenIndices((prev) => ({ ...prev, [nextOrigIdx]: true }));
        setCurrentIndex(nextOrigIdx);
      }
    }
  };

  const handlePrev = () => {
    if (!isFilteringActive) {
      if (currentIndex > 0) {
        const prevIdx = currentIndex - 1;
        setSeenIndices((prev) => ({ ...prev, [prevIdx]: true }));
        setCurrentIndex(prevIdx);
      }
    } else {
      if (currentFilteredPos > 0) {
        const prevOrigIdx = filteredQuestions[currentFilteredPos - 1].originalIndex;
        setSeenIndices((prev) => ({ ...prev, [prevOrigIdx]: true }));
        setCurrentIndex(prevOrigIdx);
      }
    }
  };

  const handleOpenQuestion = (originalIdx: number) => {
    setSeenIndices((prev) => ({ ...prev, [originalIdx]: true }));
    setCurrentIndex(originalIdx);
    setViewMode('attempt');
  };

  const isBookmarked = !!bookmarkedIds[currentQ.id];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.fullScreenSafeArea}>
        {viewMode === 'list' ? (
          /* ========================================================= */
          /* MODE 1: ALL QUESTIONS LIST VIEW (WITH FILTER BAR)         */
          /* ========================================================= */
          <View style={styles.viewContainer}>
            {/* Backdrop to dismiss anchored popovers when tapping outside */}
            {(showYearPicker || showDiffPicker) && (
              <Pressable
                style={styles.popoverBackdrop}
                onPress={() => {
                  setShowYearPicker(false);
                  setShowDiffPicker(false);
                }}
              />
            )}

            {/* Top Navigation Bar */}
            <View style={styles.topNavBar}>
              <Pressable
                style={({ pressed }) => [styles.backBtnPill, pressed && styles.pressed]}
                onPress={onClose}
              >
                <ArrowLeft size={16} color="#000000" strokeWidth={2.2} />
                <Text style={styles.backBtnText}>Exit Practice</Text>
              </Pressable>

              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>
                  {answeredCount}/{questions.length} Solved
                </Text>
              </View>
            </View>

            {/* List Header Block */}
            <View style={styles.listHeaderBlock}>
              <Text style={styles.listTitle}>{chapter.title}</Text>
              <Text style={styles.listSubtitle}>
                Previous Years Questions · Filter by status, year, or difficulty
              </Text>
            </View>

            {/* STATUS FILTER BAR (With Year & Difficulty Dropdowns in the same line) */}
            <View style={styles.filterBarContainer}>
              <View style={styles.filterBarRow}>
                {/* Status Pills ScrollView on Left */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterPillsRow}
                  style={styles.statusScroll}
                >
                  <Pressable
                    style={[
                      styles.filterPill,
                      statusFilter === 'all' && styles.filterPillActive,
                    ]}
                    onPress={() => setStatusFilter('all')}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        statusFilter === 'all' && styles.filterPillTextActive,
                      ]}
                    >
                      All ({questions.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.filterPill,
                      statusFilter === 'solved' && styles.filterPillActive,
                    ]}
                    onPress={() => setStatusFilter('solved')}
                  >
                    <CheckCircle2
                      size={13}
                      color={statusFilter === 'solved' ? '#FFFFFF' : '#000000'}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        statusFilter === 'solved' && styles.filterPillTextActive,
                      ]}
                    >
                      Solved ({solvedCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.filterPill,
                      statusFilter === 'incorrect' && styles.filterPillActive,
                    ]}
                    onPress={() => setStatusFilter('incorrect')}
                  >
                    <XCircle
                      size={13}
                      color={statusFilter === 'incorrect' ? '#FFFFFF' : '#71717A'}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        statusFilter === 'incorrect' && styles.filterPillTextActive,
                      ]}
                    >
                      Incorrect ({incorrectCount})
                    </Text>
                  </Pressable>

                  {/* Unsolved: Seen by user, but not attempted yet */}
                  <Pressable
                    style={[
                      styles.filterPill,
                      statusFilter === 'unsolved' && styles.filterPillActive,
                    ]}
                    onPress={() => setStatusFilter('unsolved')}
                  >
                    <HelpCircle
                      size={13}
                      color={statusFilter === 'unsolved' ? '#FFFFFF' : '#000000'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        statusFilter === 'unsolved' && styles.filterPillTextActive,
                      ]}
                    >
                      Unsolved ({unsolvedCount})
                    </Text>
                  </Pressable>

                  {/* Unattempted: Fresh questions never opened yet */}
                  <Pressable
                    style={[
                      styles.filterPill,
                      statusFilter === 'unattempted' && styles.filterPillActive,
                    ]}
                    onPress={() => setStatusFilter('unattempted')}
                  >
                    <Eye
                      size={13}
                      color={statusFilter === 'unattempted' ? '#FFFFFF' : '#71717A'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        statusFilter === 'unattempted' && styles.filterPillTextActive,
                      ]}
                    >
                      Unattempted ({unattemptedCount})
                    </Text>
                  </Pressable>
                </ScrollView>

                {/* Right side in the same line: Year & Difficulty Dropdowns (Anchored near buttons) */}
                <View style={styles.rightDropdownsGroup}>
                  {/* YEAR DROPDOWN (Anchored) */}
                  <View style={styles.dropdownAnchorContainer}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.dropdownTriggerBtn,
                        (selectedYear !== 'all' || showYearPicker) &&
                          styles.dropdownTriggerBtnActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        setShowDiffPicker(false);
                        setShowYearPicker((v) => !v);
                      }}
                    >
                      <Calendar
                        size={12}
                        color={
                          selectedYear !== 'all' || showYearPicker ? '#FFFFFF' : '#000000'
                        }
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          (selectedYear !== 'all' || showYearPicker) &&
                            styles.dropdownTriggerTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {selectedYear === 'all' ? 'Year' : `${selectedYear}`}
                      </Text>
                      <ChevronDown
                        size={11}
                        color={
                          selectedYear !== 'all' || showYearPicker ? '#FFFFFF' : '#71717A'
                        }
                        strokeWidth={2.2}
                      />
                    </Pressable>

                    {/* Floating Year Popover Menu in Calendar Format */}
                    {showYearPicker && (
                      <View style={styles.calendarDropdownPopover}>
                        {/* Calendar Header */}
                        <View style={styles.calendarHeaderRow}>
                          <View style={styles.calendarHeaderTitleRow}>
                            <Calendar size={13} color="#000000" strokeWidth={2.2} />
                            <Text style={styles.calendarHeaderTitle}>Year Calendar</Text>
                          </View>
                          {selectedYear !== 'all' && (
                            <Pressable
                              style={({ pressed }) => [pressed && styles.pressed]}
                              onPress={() => {
                                setSelectedYear('all');
                                setShowYearPicker(false);
                              }}
                            >
                              <Text style={styles.calendarResetText}>Reset</Text>
                            </Pressable>
                          )}
                        </View>

                        {/* All Years Selector Pill */}
                        <Pressable
                          style={({ pressed }) => [
                            styles.calendarAllYearsBtn,
                            selectedYear === 'all' && styles.calendarAllYearsBtnActive,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => {
                            setSelectedYear('all');
                            setShowYearPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.calendarAllYearsText,
                              selectedYear === 'all' && styles.calendarAllYearsTextActive,
                            ]}
                          >
                            All Examination Years
                          </Text>
                          <Text
                            style={[
                              styles.calendarAllYearsSub,
                              selectedYear === 'all' && styles.calendarAllYearsSubActive,
                            ]}
                          >
                            {questions.length} Qs
                          </Text>
                        </Pressable>

                        {/* Calendar Year Tiles Grid (3 Columns) */}
                        <ScrollView
                          style={styles.calendarScroll}
                          contentContainerStyle={styles.calendarGrid}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          {availableYears.map((yr) => {
                            const count = questions.filter((q) => q.year === yr).length;
                            const isSelected = selectedYear === yr;
                            return (
                              <Pressable
                                key={yr}
                                style={({ pressed }) => [
                                  styles.calendarYearTile,
                                  isSelected && styles.calendarYearTileActive,
                                  pressed && styles.pressed,
                                ]}
                                onPress={() => {
                                  setSelectedYear(yr);
                                  setShowYearPicker(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.calendarYearTileYear,
                                    isSelected && styles.calendarYearTileYearActive,
                                  ]}
                                >
                                  {yr}
                                </Text>
                                <Text
                                  style={[
                                    styles.calendarYearTileCount,
                                    isSelected && styles.calendarYearTileCountActive,
                                  ]}
                                >
                                  {count} Qs
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* DIFFICULTY LEVEL DROPDOWN (Anchored) */}
                  <View style={styles.dropdownAnchorContainer}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.dropdownTriggerBtn,
                        (selectedDifficulty !== 'all' || showDiffPicker) &&
                          styles.dropdownTriggerBtnActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        setShowYearPicker(false);
                        setShowDiffPicker((v) => !v);
                      }}
                    >
                      <Filter
                        size={11}
                        color={
                          selectedDifficulty !== 'all' || showDiffPicker
                            ? '#FFFFFF'
                            : '#000000'
                        }
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          (selectedDifficulty !== 'all' || showDiffPicker) &&
                            styles.dropdownTriggerTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {selectedDifficulty === 'all' ? 'Level' : selectedDifficulty}
                      </Text>
                      <ChevronDown
                        size={11}
                        color={
                          selectedDifficulty !== 'all' || showDiffPicker
                            ? '#FFFFFF'
                            : '#71717A'
                        }
                        strokeWidth={2.2}
                      />
                    </Pressable>

                    {/* Popover Menu Near Difficulty Button */}
                    {showDiffPicker && (
                      <View style={styles.diffDropdownPopover}>
                        <View style={styles.popoverHeaderRow}>
                          <Text style={styles.popoverHeaderTitle}>Difficulty</Text>
                          {selectedDifficulty !== 'all' && (
                            <Pressable
                              onPress={() => {
                                setSelectedDifficulty('all');
                                setShowDiffPicker(false);
                              }}
                            >
                              <Text style={styles.popoverResetText}>Reset</Text>
                            </Pressable>
                          )}
                        </View>

                        <View style={styles.popoverScrollContent}>
                          {availableDifficulties.map((diff) => {
                            const isSelected = selectedDifficulty === diff;
                            const count =
                              diff === 'all'
                                ? questions.length
                                : questions.filter(
                                    (q) =>
                                      q.difficulty.toLowerCase() === diff.toLowerCase()
                                  ).length;

                            return (
                              <Pressable
                                key={diff}
                                style={[
                                  styles.popoverItem,
                                  isSelected && styles.popoverItemActive,
                                ]}
                                onPress={() => {
                                  setSelectedDifficulty(diff);
                                  setShowDiffPicker(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.popoverItemLabel,
                                    isSelected && styles.popoverItemLabelActive,
                                  ]}
                                >
                                  {diff === 'all' ? 'All Levels' : diff}
                                </Text>
                                <View
                                  style={[
                                    styles.popoverBadge,
                                    isSelected && styles.popoverBadgeActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.popoverBadgeText,
                                      isSelected && styles.popoverBadgeTextActive,
                                    ]}
                                  >
                                    {count}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Active Filters row */}
              {isFilteringActive && (
                <View style={styles.activeFiltersRow}>
                  <Text style={styles.activeFiltersLabel}>Filters:</Text>
                  {statusFilter !== 'all' && (
                    <Pressable
                      style={styles.activeFilterChip}
                      onPress={() => setStatusFilter('all')}
                    >
                      <Text style={styles.activeFilterChipText}>
                        {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      </Text>
                      <X size={10} color="#000000" strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {selectedYear !== 'all' && (
                    <Pressable
                      style={styles.activeFilterChip}
                      onPress={() => setSelectedYear('all')}
                    >
                      <Text style={styles.activeFilterChipText}>Year: {selectedYear}</Text>
                      <X size={10} color="#000000" strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {selectedDifficulty !== 'all' && (
                    <Pressable
                      style={styles.activeFilterChip}
                      onPress={() => setSelectedDifficulty('all')}
                    >
                      <Text style={styles.activeFilterChipText}>
                        Level: {selectedDifficulty}
                      </Text>
                      <X size={10} color="#000000" strokeWidth={2.5} />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.resetAllChip}
                    onPress={() => {
                      setStatusFilter('all');
                      setSelectedYear('all');
                      setSelectedDifficulty('all');
                    }}
                  >
                    <Text style={styles.resetAllChipText}>Clear All</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Questions List or Empty Filter State */}
            {filteredQuestions.length === 0 ? (
              <View style={styles.emptyFilterCard}>
                <View style={styles.emptyFilterIconBadge}>
                  {statusFilter === 'incorrect' ? (
                    <CheckCircle2 size={24} color="#000000" strokeWidth={2} />
                  ) : statusFilter === 'solved' ? (
                    <Lightbulb size={24} color="#000000" strokeWidth={2} />
                  ) : statusFilter === 'unsolved' ? (
                    <HelpCircle size={24} color="#000000" strokeWidth={2} />
                  ) : statusFilter === 'unattempted' ? (
                    <Eye size={24} color="#000000" strokeWidth={2} />
                  ) : (
                    <Filter size={24} color="#000000" strokeWidth={2} />
                  )}
                </View>
                <Text style={styles.emptyFilterTitle}>
                  {statusFilter === 'incorrect'
                    ? 'No Incorrect Questions'
                    : statusFilter === 'solved'
                    ? 'No Solved Questions Yet'
                    : statusFilter === 'unsolved'
                    ? 'No Unsolved Questions'
                    : statusFilter === 'unattempted'
                    ? 'No Unattempted Questions'
                    : 'No Matching Questions'}
                </Text>
                <Text style={styles.emptyFilterSubtitle}>
                  {statusFilter === 'incorrect'
                    ? "Great accuracy! You haven't made any mistakes under this selection."
                    : statusFilter === 'solved'
                    ? 'Select questions to start practicing and see your solved answers here.'
                    : statusFilter === 'unsolved'
                    ? 'You have not skipped any viewed questions without answering.'
                    : statusFilter === 'unattempted'
                    ? 'You have opened and viewed all questions under this selection!'
                    : 'No questions match the active status, year, and difficulty filters.'}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.resetFilterBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setStatusFilter('all');
                    setSelectedYear('all');
                    setSelectedDifficulty('all');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>
                    Reset All Filters ({questions.length} Questions)
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredQuestions.map(({ q, originalIndex }) => {
                  const userPick = selectedAnswers[originalIndex];
                  const isAttempted = userPick !== undefined;
                  const isCorrect = userPick === q.correctAnswer;
                  const isSeen = !!seenIndices[originalIndex];

                  return (
                    <Pressable
                      key={q.id || originalIndex}
                      style={({ pressed }) => [
                        styles.questionCardItem,
                        isAttempted && styles.questionCardAttempted,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleOpenQuestion(originalIndex)}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardBadgesLeft}>
                          <View style={styles.qNumBadge}>
                            <Text style={styles.qNumBadgeText}>Q{originalIndex + 1}</Text>
                          </View>
                          <View style={styles.yearTag}>
                            <Calendar size={12} color="#000000" strokeWidth={2} />
                            <Text style={styles.yearTagText}>{q.year}</Text>
                          </View>
                          <View style={styles.diffTag}>
                            <Text style={styles.diffTagText}>{q.difficulty}</Text>
                          </View>
                        </View>

                        {/* Status indicator */}
                        <View style={styles.statusCol}>
                          {isAttempted ? (
                            isCorrect ? (
                              <View style={styles.statusCorrectPill}>
                                <CheckCircle2 size={12} color="#000000" strokeWidth={2.2} />
                                <Text style={styles.statusCorrectText}>Solved</Text>
                              </View>
                            ) : (
                              <View style={styles.statusWrongPill}>
                                <XCircle size={12} color="#71717A" strokeWidth={2.2} />
                                <Text style={styles.statusWrongText}>Incorrect</Text>
                              </View>
                            )
                          ) : isSeen ? (
                            <View style={styles.statusUnsolvedPill}>
                              <HelpCircle size={12} color="#000000" strokeWidth={2} />
                              <Text style={styles.statusUnsolvedText}>Unsolved</Text>
                            </View>
                          ) : (
                            <View style={styles.statusUnattemptedPill}>
                              <Text style={styles.statusUnattemptedText}>Unattempted</Text>
                            </View>
                          )}
                          <ChevronRight size={16} color="#71717A" strokeWidth={2} />
                        </View>
                      </View>

                      {/* Question Snippet */}
                      <Text style={styles.questionSnippet} numberOfLines={3}>
                        {q.questionText}
                      </Text>

                      {/* Topic tag if available */}
                      {q.tags && q.tags[0] ? (
                        <View style={styles.snippetFooter}>
                          <Text style={styles.topicSnippetText}>#{q.tags[0]}</Text>
                          <Text style={styles.optionsCountSnippet}>
                            {q.options.length} Options
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        ) : (
          /* ========================================================= */
          /* MODE 2: SINGLE QUESTION ATTEMPT VIEW (WITH BACK & NEXT)   */
          /* ========================================================= */
          <View style={styles.viewContainer}>
            {/* Top Bar for Attempt View */}
            <View style={styles.topNavBar}>
              <Pressable
                style={({ pressed }) => [styles.backBtnPill, pressed && styles.pressed]}
                onPress={() => setViewMode('list')}
              >
                <ArrowLeft size={16} color="#000000" strokeWidth={2.2} />
                <Text style={styles.backBtnText}>Questions List</Text>
              </Pressable>

              <View style={styles.qCounterPill}>
                <Text style={styles.qCounterText}>
                  Q{currentIndex + 1}
                </Text>
                <Text style={styles.qCounterFilterSub}>
                  {isFilteringActive && currentFilteredPos >= 0
                    ? `(${currentFilteredPos + 1} of ${filteredQuestions.length})`
                    : `of ${questions.length}`}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.bookmarkIconBtn, pressed && styles.pressed]}
                onPress={handleToggleBookmark}
              >
                <Bookmark
                  size={18}
                  color="#000000"
                  fill={isBookmarked ? '#000000' : 'none'}
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            {/* Question & Options Scroll Body */}
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Year & Difficulty Meta Tags */}
              <View style={styles.metaTagsRow}>
                <View style={styles.yearBadgeLarge}>
                  <Calendar size={13} color="#000000" strokeWidth={2} />
                  <Text style={styles.yearBadgeLargeText}>UPSC Prelims {currentQ.year}</Text>
                </View>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyBadgeText}>{currentQ.difficulty}</Text>
                </View>
                {currentQ.tags && currentQ.tags[0] ? (
                  <View style={styles.topicBadge}>
                    <Text style={styles.topicBadgeText}>{currentQ.tags[0]}</Text>
                  </View>
                ) : null}
              </View>

              {/* Full Question Text */}
              <View style={styles.fullQuestionCard}>
                <Text style={styles.fullQuestionText}>{currentQ.questionText}</Text>
              </View>

              {/* Options Section */}
              <View style={styles.optionsSection}>
                <Text style={styles.optionsSectionHeading}>Select Your Answer:</Text>
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOpt === opt.key;
                  const isCorrect = opt.key === currentQ.correctAnswer;

                  let optCardStyle = styles.optionItemDefault;
                  let keyBoxStyle = styles.keyBoxDefault;
                  let keyTextStyle = styles.keyTextDefault;

                  if (hasAnswered) {
                    if (isCorrect) {
                      optCardStyle = styles.optionItemCorrect;
                      keyBoxStyle = styles.keyBoxCorrect;
                      keyTextStyle = styles.keyTextCorrect;
                    } else if (isSelected && !isCorrect) {
                      optCardStyle = styles.optionItemIncorrect;
                      keyBoxStyle = styles.keyBoxIncorrect;
                      keyTextStyle = styles.keyTextIncorrect;
                    }
                  } else if (isSelected) {
                    optCardStyle = styles.optionItemSelected;
                    keyBoxStyle = styles.keyBoxSelected;
                    keyTextStyle = styles.keyTextSelected;
                  }

                  return (
                    <Pressable
                      key={opt.key}
                      style={({ pressed }) => [
                        styles.optionItemBase,
                        optCardStyle,
                        !hasAnswered && pressed && styles.pressed,
                      ]}
                      onPress={() => handleSelectOption(opt.key)}
                      disabled={hasAnswered}
                    >
                      <View style={[styles.keyBoxBase, keyBoxStyle]}>
                        <Text style={[styles.keyTextBase, keyTextStyle]}>{opt.key}</Text>
                      </View>
                      <Text style={styles.optionContentText}>{opt.text}</Text>
                      {hasAnswered && isCorrect && (
                        <CheckCircle2 size={18} color="#000000" strokeWidth={2.2} />
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <XCircle size={18} color="#71717A" strokeWidth={2.2} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Instant Solution Breakdown (Revealed after attempting) */}
              {hasAnswered && (
                <View style={styles.solutionContainer}>
                  <View style={styles.solutionHeader}>
                    <View style={styles.solutionBadge}>
                      <ShieldCheck size={14} color="#000000" strokeWidth={2.2} />
                      <Text style={styles.solutionBadgeText}>Official UPSC Key</Text>
                    </View>
                    <Text style={styles.officialKeyText}>
                      Correct Answer: ({currentQ.correctAnswer})
                    </Text>
                  </View>

                  {/* Core Concept */}
                  {currentQ.explanation?.coreConcept ? (
                    <View style={styles.solutionBlock}>
                      <View style={styles.solutionBlockTitleRow}>
                        <Lightbulb size={14} color="#000000" strokeWidth={2.2} />
                        <Text style={styles.solutionBlockTitle}>Core Concept</Text>
                      </View>
                      <Text style={styles.solutionBlockText}>
                        {currentQ.explanation.coreConcept}
                      </Text>
                    </View>
                  ) : null}

                  {/* Detailed Explanation */}
                  {currentQ.explanation?.detailedAnalysis ? (
                    <View style={styles.solutionBlock}>
                      <Text style={styles.solutionBlockTitle}>Detailed Explanation</Text>
                      {currentQ.explanation.detailedAnalysis.map((line, lIdx) => (
                        <Text key={lIdx} style={styles.solutionBlockText}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {/* Elimination Trick */}
                  {currentQ.explanation?.eliminationTechnique ? (
                    <View style={styles.eliminationBlock}>
                      <Text style={styles.eliminationTitle}>
                        Examiner Elimination Strategy:
                      </Text>
                      <Text style={styles.eliminationText}>
                        {currentQ.explanation.eliminationTechnique}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Bottom Navigation Bar (Previous & Next Options) */}
            <View style={styles.bottomNavDock}>
              <Pressable
                style={({ pressed }) => [
                  styles.navBtnPrev,
                  !hasPrev && styles.navBtnDisabled,
                  hasPrev && pressed && styles.pressed,
                ]}
                onPress={handlePrev}
                disabled={!hasPrev}
              >
                <ArrowLeft
                  size={16}
                  color={!hasPrev ? '#A1A1AA' : '#000000'}
                  strokeWidth={2.2}
                />
                <Text
                  style={[styles.navBtnPrevText, !hasPrev && styles.navBtnDisabledText]}
                >
                  Previous
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navBtnListToggle, pressed && styles.pressed]}
                onPress={() => setViewMode('list')}
              >
                <ListFilter size={15} color="#000000" strokeWidth={2.2} />
                <Text style={styles.navBtnListToggleText}>
                  {!isFilteringActive
                    ? 'All Questions'
                    : `Filtered (${filteredQuestions.length})`}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.navBtnNext,
                  !hasNext && styles.navBtnDisabledDark,
                  hasNext && pressed && styles.pressed,
                ]}
                onPress={handleNext}
                disabled={!hasNext}
              >
                <Text
                  style={[
                    styles.navBtnNextText,
                    !hasNext && styles.navBtnDisabledDarkText,
                  ]}
                >
                  {!hasNext ? 'End' : 'Next'}
                </Text>
                <ArrowRight
                  size={16}
                  color={!hasNext ? '#71717A' : '#FFFFFF'}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenSafeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  viewContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  backBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  progressPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  qCounterPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qCounterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.2,
  },
  qCounterFilterSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'capitalize',
  },
  bookmarkIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeaderBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  listTitle: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      default: 'System',
    }),
    fontSize: 20,
    fontWeight: '800',
    color: '#09090B',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  filterBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E4E4E7',
    zIndex: 100,
    elevation: 10,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusScroll: {
    flex: 1,
  },
  filterPillsRow: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  filterPillActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  rightDropdownsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E4E4E7',
  },
  dropdownTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  dropdownTriggerBtnActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dropdownTriggerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#18181B',
  },
  dropdownTriggerTextActive: {
    color: '#FFFFFF',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  activeFiltersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090B',
  },
  resetAllChip: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  resetAllChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
  },
  emptyFilterCard: {
    margin: 20,
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    ...PrelimsTheme.shadows.card,
  },
  emptyFilterIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyFilterTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#09090B',
    marginBottom: 6,
  },
  emptyFilterSubtitle: {
    fontSize: 12.5,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
  },
  questionCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    ...PrelimsTheme.shadows.card,
  },
  questionCardAttempted: {
    borderColor: '#D4D4D8',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardBadgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qNumBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qNumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  yearTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  yearTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  diffTag: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'capitalize',
  },
  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCorrectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  statusCorrectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  statusWrongPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  statusWrongText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
  },
  statusUnattemptedPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUnattemptedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
  },
  questionSnippet: {
    fontSize: 13.5,
    color: '#18181B',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  snippetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  topicSnippetText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
  },
  optionsCountSnippet: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  scrollBody: {
    flex: 1,
  },
  scrollBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metaTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  yearBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  yearBadgeLargeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  difficultyBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525B',
    textTransform: 'capitalize',
  },
  topicBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  fullQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 18,
    ...PrelimsTheme.shadows.card,
  },
  fullQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090B',
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  optionsSection: {
    marginBottom: 20,
    gap: 10,
  },
  optionsSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  optionItemBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  optionItemDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E4E7',
  },
  optionItemSelected: {
    backgroundColor: '#F4F4F5',
    borderColor: '#000000',
  },
  optionItemCorrect: {
    backgroundColor: '#F4F4F5',
    borderColor: '#000000',
  },
  optionItemIncorrect: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A1A1AA',
  },
  keyBoxBase: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBoxDefault: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  keyBoxSelected: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  keyBoxCorrect: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  keyBoxIncorrect: {
    backgroundColor: '#71717A',
    borderWidth: 1,
    borderColor: '#71717A',
  },
  keyTextBase: {
    fontSize: 12,
    fontWeight: '800',
  },
  keyTextDefault: {
    color: '#000000',
  },
  keyTextSelected: {
    color: '#FFFFFF',
  },
  keyTextCorrect: {
    color: '#FFFFFF',
  },
  keyTextIncorrect: {
    color: '#FFFFFF',
  },
  optionContentText: {
    fontSize: 14,
    color: '#18181B',
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
  solutionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderLeftWidth: 3.5,
    borderLeftColor: '#000000',
    gap: 14,
    marginBottom: 20,
    ...PrelimsTheme.shadows.card,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  solutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solutionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  officialKeyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  solutionBlock: {
    gap: 4,
  },
  solutionBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solutionBlockTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#09090B',
    letterSpacing: -0.1,
  },
  solutionBlockText: {
    fontSize: 13,
    color: '#3F3F46',
    lineHeight: 20,
    fontWeight: '400',
  },
  eliminationBlock: {
    backgroundColor: '#F4F4F5',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  eliminationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  eliminationText: {
    fontSize: 12.5,
    color: '#27272A',
    lineHeight: 18.5,
  },
  bottomNavDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...PrelimsTheme.shadows.card,
  },
  navBtnPrev: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  navBtnPrevText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  navBtnListToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  navBtnListToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  navBtnNext: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  navBtnNextText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navBtnDisabled: {
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
  },
  navBtnDisabledText: {
    color: '#A1A1AA',
  },
  navBtnDisabledDark: {
    backgroundColor: '#52525B',
    borderColor: '#52525B',
  },
  navBtnDisabledDarkText: {
    color: '#A1A1AA',
  },
  statusUnsolvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#000000',
  },
  statusUnsolvedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  popoverBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownAnchorContainer: {
    position: 'relative',
    zIndex: 100,
  },
  calendarDropdownPopover: {
    position: 'absolute',
    top: 36,
    right: -60,
    width: 248,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 20,
    zIndex: 200,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  calendarHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#09090B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
  },
  calendarAllYearsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 8,
  },
  calendarAllYearsBtnActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  calendarAllYearsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181B',
  },
  calendarAllYearsTextActive: {
    color: '#FFFFFF',
  },
  calendarAllYearsSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#71717A',
  },
  calendarAllYearsSubActive: {
    color: '#D4D4D8',
  },
  calendarScroll: {
    maxHeight: 210,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 2,
  },
  calendarYearTile: {
    width: '31.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  calendarYearTileActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  calendarYearTileYear: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  calendarYearTileYearActive: {
    color: '#FFFFFF',
  },
  calendarYearTileCount: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 2,
  },
  calendarYearTileCountActive: {
    color: '#D4D4D8',
  },
  diffDropdownPopover: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 200,
  },
  popoverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  popoverHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popoverResetText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
  },
  popoverScroll: {
    maxHeight: 220,
  },
  popoverScrollContent: {
    gap: 4,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  popoverItemActive: {
    backgroundColor: '#000000',
  },
  popoverItemLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#18181B',
  },
  popoverItemLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  popoverBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  popoverBadgeActive: {
    backgroundColor: '#27272A',
  },
  popoverBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
  },
  popoverBadgeTextActive: {
    color: '#E4E4E7',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
