import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Filter,
  HelpCircle,
  Lightbulb,
  ListFilter,
  ShieldCheck,
  X,
  XCircle,
} from '@/components/common/LucideIcons';
import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';
import { Chapter, PYQQuestion } from '@/types/prelims';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

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
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
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
                      color={statusFilter === 'solved' ? theme.colors.darkButtonText : theme.colors.textPrimary}
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
                      color={statusFilter === 'unsolved' ? theme.colors.darkButtonText : theme.colors.textPrimary}
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
                          selectedYear !== 'all' || showYearPicker ? theme.colors.darkButtonText : theme.colors.textPrimary
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
                            <Calendar size={13} color={theme.colors.textPrimary} strokeWidth={2.2} />
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
                      <X size={10} color={theme.colors.textPrimary} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {selectedYear !== 'all' && (
                    <Pressable
                      style={styles.activeFilterChip}
                      onPress={() => setSelectedYear('all')}
                    >
                      <Text style={styles.activeFilterChipText}>Year: {selectedYear}</Text>
                      <X size={10} color={theme.colors.textPrimary} strokeWidth={2.5} />
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
                      <X size={10} color={theme.colors.textPrimary} strokeWidth={2.5} />
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
                    <CheckCircle2 size={24} color={theme.colors.textPrimary} strokeWidth={2} />
                  ) : statusFilter === 'solved' ? (
                    <Lightbulb size={24} color={theme.colors.textPrimary} strokeWidth={2} />
                  ) : statusFilter === 'unsolved' ? (
                    <HelpCircle size={24} color={theme.colors.textPrimary} strokeWidth={2} />
                  ) : statusFilter === 'unattempted' ? (
                    <Eye size={24} color={theme.colors.textPrimary} strokeWidth={2} />
                  ) : (
                    <Filter size={24} color={theme.colors.textPrimary} strokeWidth={2} />
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
                            <Calendar size={12} color={theme.colors.textPrimary} strokeWidth={2} />
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
                                <CheckCircle2 size={12} color={theme.colors.textPrimary} strokeWidth={2.2} />
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
                              <HelpCircle size={12} color={theme.colors.textPrimary} strokeWidth={2} />
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
                  <Calendar size={13} color={theme.colors.textPrimary} strokeWidth={2} />
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
                        <CheckCircle2 size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
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
                      <ShieldCheck size={14} color={theme.colors.textPrimary} strokeWidth={2.2} />
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
                        <Lightbulb size={14} color={theme.colors.textPrimary} strokeWidth={2.2} />
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
                  color={!hasPrev ? '#A1A1AA' : theme.colors.textPrimary}
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
                <ListFilter size={15} color={theme.colors.textPrimary} strokeWidth={2.2} />
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

const getStyles = (theme: PrelimsThemeType) => StyleSheet.create({
  fullScreenSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.bgCanvas,
  },
  viewContainer: {
    flex: 1,
    backgroundColor: theme.colors.bgCanvas,
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.bgCanvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderCard,
  },
  backBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  progressPill: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  qCounterPill: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qCounterText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  qCounterFilterSub: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  bookmarkIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeaderBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.bgCanvas,
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
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterBarContainer: {
    backgroundColor: theme.colors.bgCanvas,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderCard,
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
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: theme.colors.darkButtonText,
  },
  rightDropdownsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.borderSubtle,
  },
  dropdownTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  dropdownTriggerBtnActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  dropdownTriggerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  dropdownTriggerTextActive: {
    color: theme.colors.darkButtonText,
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
    borderTopColor: theme.colors.borderSubtle,
  },
  activeFiltersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  resetAllChip: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  resetAllChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
  },
  emptyFilterCard: {
    margin: 20,
    padding: 30,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  emptyFilterIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.bgSurfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyFilterTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptyFilterSubtitle: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: theme.colors.darkButton,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
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
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    ...theme.shadows.card,
  },
  questionCardAttempted: {
    borderColor: theme.colors.borderSubtle,
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
    backgroundColor: theme.colors.darkButton,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qNumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.darkButtonText,
  },
  yearTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  yearTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  diffTag: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  statusCorrectText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statusWrongPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  statusWrongText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  statusUnattemptedPill: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUnattemptedText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  questionSnippet: {
    fontSize: 13.5,
    color: theme.colors.textPrimary,
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
    borderTopColor: theme.colors.borderSubtle,
  },
  topicSnippetText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  optionsCountSnippet: {
    fontSize: 11,
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.bgSurface,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  yearBadgeLargeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  difficultyBadge: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  topicBadge: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  fullQuestionCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    marginBottom: 18,
    ...theme.shadows.card,
  },
  fullQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
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
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.borderCard,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderColor: '#F8FAFC',
  },
  optionItemCorrect: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderColor: '#F8FAFC',
  },
  optionItemIncorrect: {
    backgroundColor: theme.colors.bgSurface,
    borderColor: '#64748B',
  },
  keyBoxBase: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBoxDefault: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  keyBoxSelected: {
    backgroundColor: theme.colors.darkButton,
    borderWidth: 1,
    borderColor: theme.colors.darkButton,
  },
  keyBoxCorrect: {
    backgroundColor: theme.colors.darkButton,
    borderWidth: 1,
    borderColor: theme.colors.darkButton,
  },
  keyBoxIncorrect: {
    backgroundColor: '#64748B',
    borderWidth: 1,
    borderColor: '#64748B',
  },
  keyTextBase: {
    fontSize: 12,
    fontWeight: '800',
  },
  keyTextDefault: {
    color: theme.colors.textPrimary,
  },
  keyTextSelected: {
    color: theme.colors.darkButtonText,
  },
  keyTextCorrect: {
    color: theme.colors.darkButtonText,
  },
  keyTextIncorrect: {
    color: '#FFFFFF',
  },
  optionContentText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
  solutionContainer: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    borderLeftWidth: 3.5,
    borderLeftColor: '#F8FAFC',
    gap: 14,
    marginBottom: 20,
    ...theme.shadows.card,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  solutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solutionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  officialKeyText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
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
    color: theme.colors.textPrimary,
    letterSpacing: -0.1,
  },
  solutionBlockText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  eliminationBlock: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  eliminationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  eliminationText: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    lineHeight: 18.5,
  },
  bottomNavDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderCard,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...theme.shadows.card,
  },
  navBtnPrev: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderCard,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  navBtnPrevText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  navBtnListToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  navBtnListToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  navBtnNext: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkButton,
    borderWidth: 1.5,
    borderColor: theme.colors.darkButton,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  navBtnNextText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
  },
  navBtnDisabled: {
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgSurfaceMuted,
  },
  navBtnDisabledText: {
    color: theme.colors.textMuted,
  },
  navBtnDisabledDark: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderColor: theme.colors.borderSubtle,
  },
  navBtnDisabledDarkText: {
    color: theme.colors.textMuted,
  },
  statusUnsolvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bgSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#F8FAFC',
  },
  statusUnsolvedText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  popoverBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F8FAFC',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
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
    borderBottomColor: theme.colors.borderSubtle,
  },
  calendarHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
  },
  calendarAllYearsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: 8,
  },
  calendarAllYearsBtnActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  calendarAllYearsText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  calendarAllYearsTextActive: {
    color: theme.colors.darkButtonText,
  },
  calendarAllYearsSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  calendarAllYearsSubActive: {
    color: '#475569',
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
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  calendarYearTileActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  calendarYearTileYear: {
    fontSize: 13.5,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  calendarYearTileYearActive: {
    color: theme.colors.darkButtonText,
  },
  calendarYearTileCount: {
    fontSize: 9.5,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  calendarYearTileCountActive: {
    color: '#475569',
  },
  diffDropdownPopover: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 155,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F8FAFC',
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
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
    borderBottomColor: theme.colors.borderSubtle,
  },
  popoverHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popoverResetText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
    backgroundColor: theme.colors.darkButton,
  },
  popoverItemLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  popoverItemLabelActive: {
    color: theme.colors.darkButtonText,
    fontWeight: '700',
  },
  popoverBadge: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  popoverBadgeActive: {
    backgroundColor: theme.colors.bgSurface,
  },
  popoverBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  popoverBadgeTextActive: {
    color: theme.colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
