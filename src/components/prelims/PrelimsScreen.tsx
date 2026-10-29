import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search } from 'lucide-react-native';

import {
  PrelimsThemeProvider,
} from '@/constants/prelimsTheme';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import {
  ALL_CLASSIFIED_PYQS,
  CANONICAL_CSAT_SUBJECTS,
  CANONICAL_GS1_SUBJECTS,
} from '@/data/questionBankRepository';
import { Chapter, PYQQuestion, QuizConfig, Subject } from '@/types/prelims';
import { QuestionAttemptItem, QuestionHistoryService } from '@/services/questionHistoryService';

import { ChapterDetailView } from '@/components/prelims/ChapterDetailView';
import { PracticeModal } from '@/components/prelims/PracticeModal';
import { PrelimsHeader } from '@/components/prelims/PrelimsHeader';
import { PrelimsOverviewCard } from '@/components/prelims/PrelimsOverviewCard';
import { QuizGeneratorModal } from '@/components/prelims/QuizGeneratorModal';
import { QuizModal } from '@/components/prelims/QuizModal';
import { SubjectChaptersView } from '@/components/prelims/SubjectChaptersView';
import { SubjectProgressRow } from '@/components/prelims/SubjectProgressRow';
import {
  YearRangePickerModal,
  YearRangeSelection,
} from '@/components/prelims/YearRangePickerModal';

export function PrelimsScreen({
  isDark = true,
  onBack,
  onToggleTheme,
}: {
  isDark?: boolean;
  onBack?: () => void;
  onToggleTheme?: () => void;
}) {
  return (
    <PrelimsThemeProvider isDark={isDark}>
      <PrelimsScreenContent
        isDark={isDark}
        onBack={onBack}
        onToggleTheme={onToggleTheme}
      />
    </PrelimsThemeProvider>
  );
}

function PrelimsScreenContent({
  isDark = true,
  onBack,
  onToggleTheme,
}: {
  isDark?: boolean;
  onBack?: () => void;
  onToggleTheme?: () => void;
} = {}) {
  // Navigation states
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapterForDetail, setSelectedChapterForDetail] = useState<Chapter | null>(null);
  const [selectedChapterSerial, setSelectedChapterSerial] = useState<number | undefined>(undefined);

  // Paper filter tab: 'gs1' | 'gs2'
  const [selectedPaperTab, setSelectedPaperTab] = useState<'gs1' | 'gs2'>('gs1');

  // Year filter selection
  const [selectedYearRange, setSelectedYearRange] = useState<YearRangeSelection>('all');
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Practice modal state
  const [practiceModalVisible, setPracticeModalVisible] = useState(false);
  const [practiceChapter, setPracticeChapter] = useState<Chapter | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PYQQuestion[]>([]);
  const [practiceInitialYear, setPracticeInitialYear] = useState<number | 'all'>('all');
  const [practiceInitialIndex, setPracticeInitialIndex] = useState<number | undefined>(undefined);

  // Quiz modal state
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizTitle, setQuizTitle] = useState('UPSC Prelims Mock');
  const [quizQuestions, setQuizQuestions] = useState<PYQQuestion[]>([]);
  const [quizDuration, setQuizDuration] = useState(15);

  // Generator modal state
  const [generatorModalVisible, setGeneratorModalVisible] = useState(false);

  // User attempt records
  const [rawAttempts, setRawAttempts] = useState<QuestionAttemptItem[]>([]);

  useEffect(() => {
    let active = true;
    QuestionHistoryService.fetchAllRawAttempts()
      .then((list) => {
        if (active) {
          setRawAttempts(list);
        }
      })
      .catch((err) => {
        console.warn('Could not load question attempts in PrelimsScreen:', err);
      });
    return () => {
      active = false;
    };
  }, [practiceModalVisible, quizModalVisible]);

  // Map user attempts to canonical subjects
  const solvedStatsBySubjectId = useMemo(() => {
    const map: Record<string, { solvedCount: number; solvedQIds: Set<string> }> = {};

    rawAttempts.forEach((att) => {
      if (!att.selectedAnswer) return;

      let matchedSubjectId: string | undefined;
      const pyq = ALL_CLASSIFIED_PYQS.find((q) => q.id === att.questionId);
      if (pyq) {
        matchedSubjectId = pyq.subjectId;
      } else if (att.subject) {
        const sLower = att.subject.toLowerCase();
        if (sLower.includes('history') || sLower.includes('culture')) matchedSubjectId = 'history_culture';
        else if (sLower.includes('geograph')) matchedSubjectId = 'geography';
        else if (sLower.includes('polit') || sLower.includes('constitut')) matchedSubjectId = 'polity_governance';
        else if (sLower.includes('econom') || sLower.includes('bank') || sLower.includes('budget')) matchedSubjectId = 'economy';
        else if (sLower.includes('environ') || sLower.includes('ecolog')) matchedSubjectId = 'environment_ecology';
        else if (sLower.includes('scien') || sLower.includes('tech')) matchedSubjectId = 'science_tech';
        else if (sLower.includes('current') || sLower.includes('affair')) matchedSubjectId = 'current_affairs_misc';
        else if (sLower.includes('comprehension') || sLower.includes('reading')) matchedSubjectId = 'csat_reading_comprehension';
        else if (sLower.includes('reasoning') || sLower.includes('logic')) matchedSubjectId = 'csat_reasoning';
        else if (sLower.includes('quant') || sLower.includes('math') || sLower.includes('numer')) matchedSubjectId = 'csat_quant_numeracy';
        else if (sLower.includes('data') || sLower.includes('interpret') || sLower.includes('chart')) matchedSubjectId = 'csat_data_interpretation';
      }

      if (matchedSubjectId) {
        if (!map[matchedSubjectId]) {
          map[matchedSubjectId] = { solvedCount: 0, solvedQIds: new Set() };
        }
        if (!map[matchedSubjectId].solvedQIds.has(att.questionId)) {
          map[matchedSubjectId].solvedQIds.add(att.questionId);
          map[matchedSubjectId].solvedCount++;
        }
      }
    });

    return map;
  }, [rawAttempts]);

  // Map user attempts to individual chapters/topics
  const solvedStatsByChapterId = useMemo(() => {
    const map: Record<string, number> = {};
    const solvedQIds = new Set<string>();

    rawAttempts.forEach((att) => {
      if (att.selectedAnswer && att.questionId) {
        solvedQIds.add(att.questionId);
      }
    });

    ALL_CLASSIFIED_PYQS.forEach((q) => {
      if (solvedQIds.has(q.id) && q.chapterId) {
        map[q.chapterId] = (map[q.chapterId] || 0) + 1;
      }
    });

    return map;
  }, [rawAttempts]);

  // Current Paper subjects
  const currentSubjects = useMemo(() => {
    return selectedPaperTab === 'gs1' ? CANONICAL_GS1_SUBJECTS : CANONICAL_CSAT_SUBJECTS;
  }, [selectedPaperTab]);

  // Filter subject total questions by year
  const getSubjectQuestionsCount = useCallback(
    (subject: Subject) => {
      if (selectedYearRange === 'all') {
        return subject.totalQuestions10Yrs;
      }
      if (typeof selectedYearRange === 'number') {
        return subject.chapters.reduce(
          (sum, ch) => sum + ch.pyqs.filter((q) => q.year === selectedYearRange).length,
          0
        );
      }
      if (selectedYearRange === 'recent5') {
        return subject.chapters.reduce(
          (sum, ch) => sum + ch.pyqs.filter((q) => q.year >= 2022).length,
          0
        );
      }
      if (selectedYearRange === 'earlier5') {
        return subject.chapters.reduce(
          (sum, ch) => sum + ch.pyqs.filter((q) => q.year <= 2021).length,
          0
        );
      }
      return subject.totalQuestions10Yrs;
    },
    [selectedYearRange]
  );

  // Overall paper calculations
  const totalVerifiedQuestions = useMemo(() => {
    return currentSubjects.reduce((sum, s) => sum + getSubjectQuestionsCount(s), 0);
  }, [currentSubjects, getSubjectQuestionsCount]);

  const totalSolvedQuestions = useMemo(() => {
    return currentSubjects.reduce((sum, s) => {
      const stat = solvedStatsBySubjectId[s.id];
      return sum + (stat ? stat.solvedCount : 0);
    }, 0);
  }, [currentSubjects, solvedStatsBySubjectId]);

  // Filter subjects by search query
  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentSubjects;

    return currentSubjects.filter((sub) => {
      const matchSubject = sub.title.toLowerCase().includes(q) || sub.shortTitle.toLowerCase().includes(q);
      const matchChapter = sub.chapters.some((ch) => ch.title.toLowerCase().includes(q));
      return matchSubject || matchChapter;
    });
  }, [currentSubjects, searchQuery]);

  // Year Button Label
  const yearRangeLabel = useMemo(() => {
    if (selectedYearRange === 'all') {
      return selectedPaperTab === 'gs2' ? '2018 – 2026' : '2014 – 2024';
    }
    if (selectedYearRange === 'recent5') return '2022 – 2026';
    if (selectedYearRange === 'earlier5') {
      return selectedPaperTab === 'gs2' ? '2018 – 2021' : '2016 – 2021';
    }
    return `${selectedYearRange}`;
  }, [selectedYearRange, selectedPaperTab]);

  // Handlers
  const handleOpenChapterDetail = (chapter: Chapter, serialNumber: number) => {
    setSelectedChapterForDetail(chapter);
    setSelectedChapterSerial(serialNumber);
  };

  const handlePracticeChapter = (chapter: Chapter, initialYear?: number) => {
    const qs = chapter.pyqs && chapter.pyqs.length > 0 ? chapter.pyqs : [];
    setPracticeChapter(chapter);
    setPracticeQuestions(qs);
    setPracticeInitialYear(initialYear || 'all');
    setPracticeInitialIndex(undefined);
    setPracticeModalVisible(true);
  };

  const handlePracticeSubtopic = (
    chapter: Chapter,
    subtopicTitle: string,
    questions: PYQQuestion[]
  ) => {
    setPracticeChapter({
      ...chapter,
      title: `${chapter.title} · ${subtopicTitle}`,
      totalQuestions10Yrs: questions.length,
      pyqs: questions,
    });
    setPracticeQuestions(questions);
    setPracticeInitialYear('all');
    setPracticeInitialIndex(undefined);
    setPracticeModalVisible(true);
  };

  const handleQuizChapter = (chapter: Chapter, count?: number, duration?: number) => {
    const allQs = chapter.pyqs && chapter.pyqs.length > 0 ? chapter.pyqs : [];
    const chosenCount = count ? Math.min(count, allQs.length) : allQs.length;
    const finalQs = allQs.slice(0, chosenCount);
    const chosenDuration = duration || Math.max(5, Math.round(finalQs.length * 1.5));

    setQuizTitle(`${chapter.title} (${finalQs.length} Qs)`);
    setQuizQuestions(finalQs);
    setQuizDuration(chosenDuration);
    setQuizModalVisible(true);
  };

  const handleGenerateSubjectQuiz = (subject: Subject) => {
    const qs = subject.chapters.flatMap((c) => c.pyqs).slice(0, 15);
    setQuizTitle(`${subject.shortTitle} Mock Test`);
    setQuizQuestions(qs);
    setQuizDuration(20);
    setQuizModalVisible(true);
  };

  const handleLaunchGeneratedQuiz = (config: QuizConfig) => {
    let sourcePool: PYQQuestion[] = [];
    if (config.subjectId) {
      const matched = currentSubjects.find((s) => s.id === config.subjectId);
      sourcePool = matched ? matched.chapters.flatMap((c) => c.pyqs) : [];
    } else {
      sourcePool = currentSubjects.flatMap((s) => s.chapters.flatMap((c) => c.pyqs));
    }

    if (config.yearRange === 'recent5') {
      const filtered = sourcePool.filter((q) => q.year >= 2020);
      if (filtered.length >= config.questionCount) {
        sourcePool = filtered;
      }
    }

    const shuffled = [...sourcePool].sort(() => 0.5 - Math.random());
    const finalQs = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));

    setQuizTitle(config.title);
    setQuizQuestions(finalQs);
    setQuizDuration(config.durationMinutes);
    setQuizModalVisible(true);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: isDark ? '#1F2024' : '#F8F9FE' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: isDark ? '#1F2024' : '#F8F9FE' }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {selectedSubject === null ? (
            /* ========================================================= */
            /* VIEW 1: Main Prelims Preparation Page (Reference Image)   */
            /* ========================================================= */
            <>
              {/* Header with Back button, Title, Subtitle, Year button, and Search */}
              <PrelimsHeader
                isDark={isDark}
                onBack={onBack}
                onToggleTheme={onToggleTheme}
                yearRangeLabel={yearRangeLabel}
                onOpenYearPicker={() => setYearPickerVisible(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />

              {/* Accessible Paper Selection Tabs: Paper 1 - GS-1 vs Paper 2 - CSAT */}
              <View style={styles.paperTabsContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.paperTabBtn,
                    {
                      backgroundColor:
                        selectedPaperTab === 'gs1' ? '#0D6EFD' : isDark ? '#26282E' : '#FFFFFF',
                      borderColor:
                        selectedPaperTab === 'gs1' ? '#0D6EFD' : isDark ? '#35373F' : '#E8E9F1',
                    },
                    pressed && styles.tabPressed,
                  ]}
                  onPress={() => setSelectedPaperTab('gs1')}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedPaperTab === 'gs1' }}
                >
                  <Text
                    style={[
                      styles.paperTabText,
                      { color: selectedPaperTab === 'gs1' ? '#FFFFFF' : isDark ? '#A7ABB5' : '#71727A' },
                      selectedPaperTab === 'gs1' && styles.paperTabTextActive,
                    ]}
                  >
                    Paper 1 - GS-1
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.paperTabBtn,
                    {
                      backgroundColor:
                        selectedPaperTab === 'gs2' ? '#0D6EFD' : isDark ? '#26282E' : '#FFFFFF',
                      borderColor:
                        selectedPaperTab === 'gs2' ? '#0D6EFD' : isDark ? '#35373F' : '#E8E9F1',
                    },
                    pressed && styles.tabPressed,
                  ]}
                  onPress={() => setSelectedPaperTab('gs2')}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedPaperTab === 'gs2' }}
                >
                  <Text
                    style={[
                      styles.paperTabText,
                      { color: selectedPaperTab === 'gs2' ? '#FFFFFF' : isDark ? '#A7ABB5' : '#71727A' },
                      selectedPaperTab === 'gs2' && styles.paperTabTextActive,
                    ]}
                  >
                    Paper 2 - CSAT
                  </Text>
                </Pressable>
              </View>

              {/* Compact Overview Card with File Icon, Total Questions, Solved & Circular Gauge */}
              <PrelimsOverviewCard
                isDark={isDark}
                paperTitle={
                  selectedPaperTab === 'gs2'
                    ? 'General Studies - Paper 2 (CSAT)'
                    : 'General Studies - Paper 1'
                }
                subjectsCount={currentSubjects.length}
                totalQuestions={totalVerifiedQuestions}
                solvedQuestions={totalSolvedQuestions}
              />

              {/* Section Header: Subject-wise Progress */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#F5F5F7' : '#1F2024' }]}>
                  Subject-wise Progress
                </Text>
                <Text style={[styles.sectionHeaderCount, { color: isDark ? '#A7ABB5' : '#71727A' }]}>
                  {filteredSubjects.length} Subjects • {totalVerifiedQuestions.toLocaleString()} Qs
                </Text>
              </View>

              {/* Subject Rows List */}
              {filteredSubjects.length === 0 ? (
                <View
                  style={[
                    styles.emptyStateCard,
                    {
                      backgroundColor: isDark ? '#25272D' : '#FFFFFF',
                      borderColor: isDark ? '#35373F' : '#E8E9F1',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIconBadge,
                      {
                        backgroundColor: isDark ? '#202227' : '#F8F9FE',
                        borderColor: isDark ? '#35373F' : '#E8E9F1',
                      },
                    ]}
                  >
                    <Search size={22} color={isDark ? '#A7ABB5' : '#71727A'} strokeWidth={2} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: isDark ? '#F5F5F7' : '#1F2024' }]}>
                    No matching topics found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: isDark ? '#A7ABB5' : '#71727A' }]}>
                    No subjects or chapters match &ldquo;{searchQuery}&rdquo;. Try another keyword like
                    &ldquo;Polity&rdquo;, &ldquo;Monetary&rdquo;, or &ldquo;Climate&rdquo;.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.clearSearchBtn,
                      {
                        backgroundColor: isDark ? '#26282E' : '#F8F9FE',
                        borderColor: isDark ? '#35373F' : '#E8E9F1',
                      },
                      pressed && styles.tabPressed,
                    ]}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={[styles.clearSearchText, { color: isDark ? '#F5F5F7' : '#1F2024' }]}>
                      Clear Search
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.subjectsList}>
                  {filteredSubjects.map((subject, index) => {
                    const subStat = solvedStatsBySubjectId[subject.id];
                    const subSolved = subStat ? subStat.solvedCount : 0;
                    const subTotal = getSubjectQuestionsCount(subject);

                    return (
                      <SubjectProgressRow
                        key={subject.id}
                        subject={subject}
                        serialNumber={index + 1}
                        solvedCount={subSolved}
                        totalQuestions={subTotal}
                        isDark={isDark}
                        onPress={(sub) => {
                          setSelectedSubject(sub);
                          setSelectedChapterForDetail(null);
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </>
          ) : selectedChapterForDetail === null ? (
            /* ========================================================= */
            /* VIEW 2: Dedicated Chapterwise List Page for Selected Subject */
            /* ========================================================= */
            <SubjectChaptersView
              subject={selectedSubject}
              serialNumber={
                (selectedSubject.paper === 'GS2'
                  ? CANONICAL_CSAT_SUBJECTS.findIndex((s) => s.id === selectedSubject.id)
                  : CANONICAL_GS1_SUBJECTS.findIndex((s) => s.id === selectedSubject.id)) + 1
              }
              isDark={isDark}
              onToggleTheme={onToggleTheme}
              solvedCount={solvedStatsBySubjectId[selectedSubject.id]?.solvedCount || 0}
              solvedStatsByChapterId={solvedStatsByChapterId}
              onBack={() => setSelectedSubject(null)}
              onSelectChapter={handleOpenChapterDetail}
              onGenerateSubjectQuiz={handleGenerateSubjectQuiz}
            />
          ) : (
            /* ========================================================= */
            /* VIEW 3: Dedicated Chapter Detail Page                     */
            /* ========================================================= */
            <ChapterDetailView
              chapter={selectedChapterForDetail}
              subject={selectedSubject}
              serialNumber={selectedChapterSerial}
              onBack={() => setSelectedChapterForDetail(null)}
              onStartPractice={handlePracticeChapter}
              onStartSubtopicPractice={handlePracticeSubtopic}
              onStartQuiz={handleQuizChapter}
            />
          )}

          <View style={{ height: BottomTabInset + 20 }} />
        </View>
      </ScrollView>

      {/* Year Range Selector Modal */}
      <YearRangePickerModal
        visible={yearPickerVisible}
        selectedRange={selectedYearRange}
        paper={selectedPaperTab}
        isDark={isDark}
        onSelect={(selection) => setSelectedYearRange(selection)}
        onClose={() => setYearPickerVisible(false)}
      />

      {/* Interactive Practice & Quiz Modals */}
      <PracticeModal
        visible={practiceModalVisible}
        chapter={practiceChapter}
        questions={practiceQuestions}
        initialYearFilter={practiceInitialYear}
        initialQuestionIndex={practiceInitialIndex}
        onClose={() => setPracticeModalVisible(false)}
      />

      <QuizModal
        visible={quizModalVisible}
        title={quizTitle}
        questions={quizQuestions}
        durationMinutes={quizDuration}
        onClose={() => setQuizModalVisible(false)}
      />

      <QuizGeneratorModal
        visible={generatorModalVisible}
        subjects={currentSubjects}
        onClose={() => setGeneratorModalVisible(false)}
        onGenerateQuiz={handleLaunchGeneratedQuiz}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: 0,
  },
  paperTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  paperTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#26282E',
    borderWidth: 1,
    borderColor: '#35373F',
  },
  paperTabBtnActive: {
    backgroundColor: '#0D6EFD', // Primary action blue
    borderColor: '#0D6EFD',
  },
  paperTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A7ABB5',
    letterSpacing: -0.1,
  },
  paperTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabPressed: {
    opacity: 0.85,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F7',
    letterSpacing: -0.2,
  },
  sectionHeaderCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A7ABB5',
  },
  subjectsList: {
    paddingHorizontal: 20,
  },
  emptyStateCard: {
    marginHorizontal: 20,
    backgroundColor: '#25272D',
    borderWidth: 1,
    borderColor: '#35373F',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#202227',
    borderWidth: 1,
    borderColor: '#35373F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#A7ABB5',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 380,
    marginBottom: 16,
  },
  clearSearchBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#26282E',
    borderWidth: 1,
    borderColor: '#35373F',
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5F5F7',
  },
});
