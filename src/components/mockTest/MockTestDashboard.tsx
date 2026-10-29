import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrimaryToggle } from '@/components/common/PrimaryToggle';
import {
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  BookOpen,
  LayoutGrid,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { MockTestService } from '@/services/mockTestService';
import {
  AvailableFiltersData,
  MockTestFilterConfig,
  PaperType,
  QuestionOrderMode,
  TestMode,
} from '@/types/mockTest';
import { TestHistoryModal } from './TestHistoryModal';
import { SubjectTopicPickerModal } from './SubjectTopicPickerModal';

export type MockScope = 'full' | 'subject';

interface MockTestDashboardProps {
  onStartTest: (testId: string) => void;
  onToggleTheme?: () => void;
  onBack?: () => void;
  isDark?: boolean;
}

const PREF_STORAGE_KEY = '@upsc_mock_test_v3_pref';

export function MockTestDashboard({
  onStartTest,
  onToggleTheme,
  onBack,
  isDark = false,
}: MockTestDashboardProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [completedTestsCount, setCompletedTestsCount] = useState(0);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // Available filters from backend
  const [filtersData, setFiltersData] = useState<AvailableFiltersData>({
    years: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011],
    subjects: [],
    topicsBySubject: {},
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  // 1. Choose Paper: 'GS1' | 'CSAT'
  const [paperType, setPaperType] = useState<PaperType>('GS1');

  // 2. Select Years (multi-select, default to 2025, 2024, 2023 matching the design)
  const [selectedYears, setSelectedYears] = useState<number[]>([2025, 2024, 2023]);

  // 3. Pick Scope: 'full' (Full paper) | 'subject' (Subject-wise)
  const [scope, setScope] = useState<MockScope>('full');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // 4. Set Mode & Toggles
  const [testMode, setTestMode] = useState<TestMode>('full'); // 'full' = Timed exam, 'practice' = Practice
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState<boolean>(true);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [instantExplanations, setInstantExplanations] = useState<boolean>(false);

  // Matching questions count
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Theme-derived colors matching the exact visual style
  const colors = useMemo(() => {
    if (isDark) {
      return {
        bg: '#14161C',
        cardBg: '#1D2028',
        cardBorder: '#2E323D',
        textPrimary: '#FFFFFF',
        textSecondary: '#C5C6CC',
        textMuted: '#8F9098',
        primary: '#006FFD',
        primaryDeep: '#0052CC',
        primaryTint: 'rgba(0, 111, 253, 0.12)',
        primaryBorder: '#006FFD',
        buttonText: '#FFFFFF',
        chipBg: '#272A35',
        chipSelectedBg: '#006FFD',
        chipSelectedText: '#FFFFFF',
        metricBoxBg: '#242732',
        amberBadge: '#F59E0B',
        stepBadgeBg: '#262934',
        stepBadgeText: '#FFFFFF',
      };
    }
    return {
      bg: '#F8F9FD',
      cardBg: '#FFFFFF',
      cardBorder: '#E6E9F2',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      primary: '#203576',
      primaryDeep: '#172758',
      primaryTint: '#EEF2FF',
      primaryBorder: '#253D90',
      buttonText: '#FFFFFF',
      chipBg: '#F1F3F9',
      chipSelectedBg: '#203576',
      chipSelectedText: '#FFFFFF',
      metricBoxBg: '#F4F6FC',
      amberBadge: '#B45309',
      stepBadgeBg: '#0F172A',
      stepBadgeText: '#FFFFFF',
    };
  }, [isDark]);

  // Load initial stats & preferences
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [savedPref, stats] = await Promise.all([
          AsyncStorage.getItem(PREF_STORAGE_KEY),
          MockTestService.getSummaryStats(),
        ]);
        if (!mounted) return;
        setCompletedTestsCount(stats.completedTests);
        if (savedPref) {
          try {
            const p = JSON.parse(savedPref);
            if (p.paperType) setPaperType(p.paperType);
            if (p.selectedYears && Array.isArray(p.selectedYears) && p.selectedYears.length > 0) {
              setSelectedYears(p.selectedYears);
            }
            if (p.scope) setScope(p.scope);
            if (p.testMode) setTestMode(p.testMode);
            if (typeof p.negativeMarkingEnabled === 'boolean') {
              setNegativeMarkingEnabled(p.negativeMarkingEnabled);
            }
            if (typeof p.shuffleQuestions === 'boolean') {
              setShuffleQuestions(p.shuffleQuestions);
            }
          } catch {}
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch filter options when paper changes
  useEffect(() => {
    let mounted = true;
    MockTestService.getAvailableFilters(paperType).then((data) => {
      if (!mounted) return;
      if (data.years && data.years.length > 0) {
        setFiltersData(data);
      }
      setLoadingFilters(false);
      if (data.subjects.length > 0) {
        setSelectedSubject((prev) => {
          if (prev && data.subjects.some((s) => s.name === prev)) return prev;
          return data.subjects[0].name;
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [paperType]);

  // Save preferences
  const saveState = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        PREF_STORAGE_KEY,
        JSON.stringify({
          paperType,
          selectedYears,
          scope,
          testMode,
          negativeMarkingEnabled,
          shuffleQuestions,
        })
      );
    } catch {}
  }, [paperType, selectedYears, scope, testMode, negativeMarkingEnabled, shuffleQuestions]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // Toggle year selection
  const handleToggleYear = (year: number) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev; // Keep at least one year
        return prev.filter((y) => y !== year);
      }
      return [...prev, year].sort((a, b) => b - a);
    });
  };

  const handleSelectAllYears = () => {
    setSelectedYears([...filtersData.years].sort((a, b) => b - a));
  };

  const handleClearYears = () => {
    if (filtersData.years.length > 0) {
      setSelectedYears([filtersData.years[0]]);
    }
  };

  // Compute question count & duration
  const questionsPerPaper = paperType === 'CSAT' ? 80 : 100;
  const totalCalculatedQuestions = useMemo(() => {
    if (scope === 'subject') {
      return matchingCount > 0 ? matchingCount : 25;
    }
    return questionsPerPaper * (selectedYears.length || 1);
  }, [scope, questionsPerPaper, selectedYears.length, matchingCount]);

  const effectiveDurationMinutes = useMemo(() => {
    if (testMode === 'practice') return undefined;
    return 120 * (selectedYears.length || 1);
  }, [testMode, selectedYears.length]);

  const durationDisplayString = useMemo(() => {
    if (testMode === 'practice') return 'Self-paced';
    return '2h 00m';
  }, [testMode]);

  // Negative marks value
  const marksPerCorrect = paperType === 'CSAT' ? 2.5 : 2.0;
  const negativeMarksValue = useMemo(() => {
    if (!negativeMarkingEnabled) return 0;
    return paperType === 'CSAT' ? 0.8333 : 0.6667;
  }, [negativeMarkingEnabled, paperType]);

  // Negative marking display string
  const markingSummaryString = useMemo(() => {
    if (!negativeMarkingEnabled) {
      return paperType === 'CSAT' ? '+2.5 right, 0 wrong' : '+2 right, 0 wrong';
    }
    return paperType === 'CSAT' ? '+2.5 right, -0.83 wrong' : '+2 right, -0.66 wrong';
  }, [negativeMarkingEnabled, paperType]);

  // Filter configuration for querying database and launching test
  const currentFilterConfig: MockTestFilterConfig = useMemo(() => {
    const order: QuestionOrderMode = shuffleQuestions ? 'random' : 'exam_order';
    return {
      paperType,
      selectedYears: selectedYears,
      selectedSubjects: scope === 'subject' && selectedSubject ? [selectedSubject] : [],
      selectedTopics: scope === 'subject' && selectedTopic ? [selectedTopic] : [],
      questionCount: totalCalculatedQuestions,
      testMode,
      orderMode: order,
      marksPerCorrect,
      negativeMarks: negativeMarksValue,
      timeLimitMinutes: effectiveDurationMinutes,
    };
  }, [
    paperType,
    selectedYears,
    scope,
    selectedSubject,
    selectedTopic,
    totalCalculatedQuestions,
    testMode,
    shuffleQuestions,
    marksPerCorrect,
    negativeMarksValue,
    effectiveDurationMinutes,
  ]);

  // Query live matching questions
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      setIsCounting(true);
      try {
        const count = await MockTestService.getMatchingQuestionCount(currentFilterConfig);
        if (active) {
          setMatchingCount(count);
          setIsCounting(false);
        }
      } catch {
        if (active) setIsCounting(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentFilterConfig]);

  // Start Mock Test
  const handleStartTest = async () => {
    if (matchingCount === 0 && !loadingFilters) {
      Alert.alert(
        'Insufficient Questions',
        'No questions match this configuration. Please pick a different subject or include more years.'
      );
      return;
    }

    const effectiveCount = Math.min(totalCalculatedQuestions, matchingCount || totalCalculatedQuestions);
    const configToRun: MockTestFilterConfig = {
      ...currentFilterConfig,
      questionCount: effectiveCount,
    };

    setIsGenerating(true);
    try {
      const result = await MockTestService.generateMockTest(configToRun);
      setIsGenerating(false);

      if (result.testId) {
        onStartTest(result.testId);
      } else {
        Alert.alert('Unable to Create Test', result.error || 'Please try again.');
      }
    } catch (err: any) {
      setIsGenerating(false);
      Alert.alert('Error', err?.message || 'Something went wrong while launching the test.');
    }
  };

  const isStartDisabled = (matchingCount === 0 && !loadingFilters && !isCounting) || isGenerating;

  // Formatted years string for summary
  const yearsSummaryString = useMemo(() => {
    if (selectedYears.length === 0) return 'All available';
    if (selectedYears.length <= 4) return selectedYears.join(', ');
    return `${selectedYears.slice(0, 3).join(', ')} +${selectedYears.length - 3} more`;
  }, [selectedYears]);

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isWide && styles.wideContainer]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Top Navbar Row */}
        <View style={styles.topNavRow}>
          <View style={styles.topNavBrand}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backBtn}>
                <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            ) : (
              <LayoutGrid size={18} color={colors.textPrimary} strokeWidth={2.2} />
            )}
            <Text style={[styles.topBrandText, { color: colors.textPrimary }]}>
              Prelims Mock
            </Text>
          </View>

          <View style={styles.topNavActions}>
            {onToggleTheme && (
              <Pressable
                onPress={onToggleTheme}
                accessibilityRole="button"
                accessibilityLabel="Toggle dark mode"
                style={[
                  styles.themeTogglePill,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}>
                {isDark ? (
                  <Sun size={14} color={colors.textPrimary} strokeWidth={2} />
                ) : (
                  <Moon size={14} color={colors.textPrimary} strokeWidth={2} />
                )}
                <Text style={[styles.themeToggleText, { color: colors.textPrimary }]}>
                  {isDark ? 'Light mode' : 'Dark mode'}
                </Text>
              </Pressable>
            )}

            {completedTestsCount > 0 && (
              <Pressable
                onPress={() => setShowHistoryModal(true)}
                style={[
                  styles.historyPill,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}>
                <Text style={[styles.historyPillText, { color: colors.textPrimary }]}>
                  History
                </Text>
                <View style={[styles.historyCountBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.historyCountText}>{completedTestsCount}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Hero Title Section */}
        <View style={styles.heroSection}>
          <Text style={styles.eyebrowText}>
            CIVIL SERVICES PRELIMINARY EXAMINATION
          </Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Build your mock test
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            Pick a paper, choose previous year question sets, then decide how strict the sitting should be.
          </Text>
        </View>

        {/* Main 2-Column Responsive Layout */}
        <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>
          {/* LEFT COLUMN: 4 Step Cards */}
          <View style={[styles.leftColumn, isWide && styles.leftColumnWide]}>
            {/* CARD 1: Choose the paper */}
            <View
              style={[
                styles.stepCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.stepCardHeader}>
                <View style={[styles.stepNumberBadge, { backgroundColor: colors.stepBadgeBg }]}>
                  <Text style={[styles.stepNumberText, { color: colors.stepBadgeText }]}>1</Text>
                </View>
                <Text style={[styles.stepCardTitle, { color: colors.textPrimary }]}>
                  Choose the paper
                </Text>
              </View>

              <View style={styles.paperOptionsRow}>
                {/* Paper I: General Studies */}
                <Pressable
                  onPress={() => setPaperType('GS1')}
                  style={[
                    styles.paperOptionBox,
                    {
                      backgroundColor:
                        paperType === 'GS1' ? colors.primaryTint : 'transparent',
                      borderColor:
                        paperType === 'GS1' ? colors.primaryBorder : colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.paperOptionTopRow}>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor:
                            paperType === 'GS1' ? colors.primaryBorder : colors.cardBorder,
                        },
                      ]}>
                      {paperType === 'GS1' && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primaryBorder }]} />
                      )}
                    </View>
                    <Text style={[styles.paperLabelCode, { color: colors.textMuted }]}>
                      PAPER I
                    </Text>
                  </View>

                  <Text style={[styles.paperHeading, { color: colors.textPrimary }]}>
                    General Studies
                  </Text>
                  <Text style={[styles.paperMetaText, { color: colors.textMuted }]}>
                    100 questions  200 marks  2 hours
                  </Text>
                  <Text style={[styles.paperTagText, { color: colors.amberBadge }]}>
                    Decides the Prelims cut-off
                  </Text>
                </Pressable>

                {/* Paper II: CSAT */}
                <Pressable
                  onPress={() => setPaperType('CSAT')}
                  style={[
                    styles.paperOptionBox,
                    {
                      backgroundColor:
                        paperType === 'CSAT' ? colors.primaryTint : 'transparent',
                      borderColor:
                        paperType === 'CSAT' ? colors.primaryBorder : colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.paperOptionTopRow}>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor:
                            paperType === 'CSAT' ? colors.primaryBorder : colors.cardBorder,
                        },
                      ]}>
                      {paperType === 'CSAT' && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primaryBorder }]} />
                      )}
                    </View>
                    <Text style={[styles.paperLabelCode, { color: colors.textMuted }]}>
                      PAPER II
                    </Text>
                  </View>

                  <Text style={[styles.paperHeading, { color: colors.textPrimary }]}>
                    CSAT
                  </Text>
                  <Text style={[styles.paperMetaText, { color: colors.textMuted }]}>
                    80 questions  200 marks  2 hours
                  </Text>
                  <Text style={[styles.paperTagText, { color: colors.amberBadge }]}>
                    Qualifying only, 33% to clear
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* CARD 2: Select the years */}
            <View
              style={[
                styles.stepCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.stepCardHeaderBetween}>
                <View style={styles.stepCardHeaderLeft}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.stepBadgeBg }]}>
                    <Text style={[styles.stepNumberText, { color: colors.stepBadgeText }]}>2</Text>
                  </View>
                  <Text style={[styles.stepCardTitle, { color: colors.textPrimary }]}>
                    Select the years
                  </Text>
                </View>

                <View style={styles.yearsActionGroup}>
                  <Text style={[styles.yearsCountInfo, { color: colors.textMuted }]}>
                    {selectedYears.length} of {filtersData.years.length} selected
                  </Text>
                  <Pressable onPress={handleSelectAllYears} hitSlop={6}>
                    <Text style={[styles.yearsActionLink, { color: colors.textPrimary }]}>
                      Select all
                    </Text>
                  </Pressable>
                  <Pressable onPress={handleClearYears} hitSlop={6}>
                    <Text style={[styles.yearsActionLink, { color: colors.textMuted }]}>
                      Clear
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Year Pills Grid */}
              <View style={styles.yearsGrid}>
                {filtersData.years.map((year) => {
                  const isSelected = selectedYears.includes(year);
                  return (
                    <Pressable
                      key={year}
                      onPress={() => handleToggleYear(year)}
                      style={[
                        styles.yearBox,
                        {
                          backgroundColor: isSelected ? colors.chipSelectedBg : colors.chipBg,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.yearBoxText,
                          {
                            color: isSelected ? colors.chipSelectedText : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.stepCardFooterNote, { color: colors.textMuted }]}>
                Pick one year for a single sitting, or several to practise back to back.
              </Text>
            </View>

            {/* CARD 3: Pick the scope */}
            <View
              style={[
                styles.stepCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.stepCardHeader}>
                <View style={[styles.stepNumberBadge, { backgroundColor: colors.stepBadgeBg }]}>
                  <Text style={[styles.stepNumberText, { color: colors.stepBadgeText }]}>3</Text>
                </View>
                <Text style={[styles.stepCardTitle, { color: colors.textPrimary }]}>
                  Pick the scope
                </Text>
              </View>

              {/* Scope Segment Pill */}
              <View style={[styles.scopeSegmentPill, { backgroundColor: colors.chipBg }]}>
                <Pressable
                  onPress={() => setScope('full')}
                  style={[
                    styles.scopeSegmentOption,
                    scope === 'full' && [
                      styles.scopeSegmentOptionActive,
                      { backgroundColor: colors.chipSelectedBg },
                    ],
                  ]}>
                  <Text
                    style={[
                      styles.scopeSegmentText,
                      {
                        color: scope === 'full' ? colors.chipSelectedText : colors.textMuted,
                        fontWeight: scope === 'full' ? '700' : '500',
                      },
                    ]}>
                    Full paper
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setScope('subject')}
                  style={[
                    styles.scopeSegmentOption,
                    scope === 'subject' && [
                      styles.scopeSegmentOptionActive,
                      { backgroundColor: colors.chipSelectedBg },
                    ],
                  ]}>
                  <Text
                    style={[
                      styles.scopeSegmentText,
                      {
                        color: scope === 'subject' ? colors.chipSelectedText : colors.textMuted,
                        fontWeight: scope === 'subject' ? '700' : '500',
                      },
                    ]}>
                    Subject-wise
                  </Text>
                </Pressable>
              </View>

              {/* Subject Dropdown if Subject-wise scope is picked */}
              {scope === 'subject' && (
                <Pressable
                  onPress={() => setShowSubjectModal(true)}
                  style={[
                    styles.subjectPickerBar,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.subjectPickerTextGroup}>
                    <Text style={[styles.subjectPickerTitle, { color: colors.textPrimary }]}>
                      {selectedSubject
                        ? selectedTopic
                          ? `${selectedSubject} · ${selectedTopic}`
                          : selectedSubject
                        : 'Select Subject & Topic'}
                    </Text>
                    <Text style={[styles.subjectPickerSub, { color: colors.textMuted }]}>
                      Tap to filter by syllabus domain
                    </Text>
                  </View>
                  <ChevronDown size={18} color={colors.textMuted} />
                </Pressable>
              )}

              <Text style={[styles.stepCardFooterNote, { color: colors.textMuted }]}>
                {scope === 'full'
                  ? 'Every question from each selected paper, in its original order.'
                  : 'Questions strictly focused on your chosen subject and subtopics.'}
              </Text>
            </View>

            {/* CARD 4: Set the mode */}
            <View
              style={[
                styles.stepCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.stepCardHeader}>
                <View style={[styles.stepNumberBadge, { backgroundColor: colors.stepBadgeBg }]}>
                  <Text style={[styles.stepNumberText, { color: colors.stepBadgeText }]}>4</Text>
                </View>
                <Text style={[styles.stepCardTitle, { color: colors.textPrimary }]}>
                  Set the mode
                </Text>
              </View>

              {/* Mode Options: Timed exam vs Practice */}
              <View style={styles.paperOptionsRow}>
                {/* Timed Exam Box */}
                <Pressable
                  onPress={() => {
                    setTestMode('full');
                    setInstantExplanations(false);
                  }}
                  style={[
                    styles.modeOptionBox,
                    {
                      backgroundColor:
                        testMode === 'full' ? colors.primaryTint : 'transparent',
                      borderColor:
                        testMode === 'full' ? colors.primaryBorder : colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.modeOptionTopRow}>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor:
                            testMode === 'full' ? colors.primaryBorder : colors.cardBorder,
                        },
                      ]}>
                      {testMode === 'full' && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primaryBorder }]} />
                      )}
                    </View>
                    <Clock size={16} color={colors.textPrimary} strokeWidth={2.2} />
                    <Text style={[styles.modeHeading, { color: colors.textPrimary }]}>
                      Timed exam
                    </Text>
                  </View>
                  <Text style={[styles.modeDescription, { color: colors.textMuted }]}>
                    Exam conditions. A countdown runs, wrong answers can cost marks, and answers appear only at the end.
                  </Text>
                </Pressable>

                {/* Practice Mode Box */}
                <Pressable
                  onPress={() => {
                    setTestMode('practice');
                    setInstantExplanations(true);
                  }}
                  style={[
                    styles.modeOptionBox,
                    {
                      backgroundColor:
                        testMode === 'practice' ? colors.primaryTint : 'transparent',
                      borderColor:
                        testMode === 'practice' ? colors.primaryBorder : colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.modeOptionTopRow}>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor:
                            testMode === 'practice' ? colors.primaryBorder : colors.cardBorder,
                        },
                      ]}>
                      {testMode === 'practice' && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primaryBorder }]} />
                      )}
                    </View>
                    <BookOpen size={16} color={colors.textPrimary} strokeWidth={2.2} />
                    <Text style={[styles.modeHeading, { color: colors.textPrimary }]}>
                      Practice
                    </Text>
                  </View>
                  <Text style={[styles.modeDescription, { color: colors.textMuted }]}>
                    Learn as you go. No timer, and you can see the answer and reasoning after every question.
                  </Text>
                </Pressable>
              </View>

              {/* Toggles Group */}
              <View style={[styles.togglesGroup, { borderTopColor: colors.cardBorder }]}>
                {/* 1. Negative Marking */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                      Negative marking
                    </Text>
                    <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>
                      {paperType === 'CSAT'
                        ? 'Each wrong answer costs 0.83 marks (one third of 2.5).'
                        : 'Each wrong answer costs 0.66 marks (one third of 2).'}
                    </Text>
                  </View>
                  <PrimaryToggle
                    value={negativeMarkingEnabled}
                    onValueChange={setNegativeMarkingEnabled}
                    isDark={isDark}
                    activeTrackColor={colors.primary}
                  />
                </View>

                {/* 2. Shuffle Questions */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                      Shuffle questions
                    </Text>
                    <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>
                      Mix the order so you cannot lean on the original sequence.
                    </Text>
                  </View>
                  <PrimaryToggle
                    value={shuffleQuestions}
                    onValueChange={setShuffleQuestions}
                    isDark={isDark}
                    activeTrackColor={colors.primary}
                  />
                </View>

                {/* 3. Instant Explanations */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                      Instant explanations
                    </Text>
                    <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>
                      {testMode === 'full'
                        ? 'Off in timed mode. Review every answer after you submit.'
                        : 'Available immediately upon choosing an answer.'}
                    </Text>
                  </View>
                  <PrimaryToggle
                    disabled={testMode === 'full'}
                    value={instantExplanations}
                    onValueChange={setInstantExplanations}
                    isDark={isDark}
                    activeTrackColor={colors.primary}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN: "Your mock test" Summary Card */}
          <View style={[styles.rightColumn, isWide && styles.rightColumnWide]}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
              <Text style={[styles.summaryCardTitle, { color: colors.textPrimary }]}>
                Your mock test
              </Text>

              {/* Top 2 KPI Metric Boxes */}
              <View style={styles.metricBoxesRow}>
                {/* Questions Box */}
                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: colors.metricBoxBg },
                  ]}>
                  <Text style={[styles.metricBoxLabel, { color: colors.textMuted }]}>
                    QUESTIONS
                  </Text>
                  <Text style={[styles.metricBoxValue, { color: colors.textPrimary }]}>
                    {isCounting ? '…' : totalCalculatedQuestions}
                  </Text>
                  <Text style={[styles.metricBoxSub, { color: colors.textMuted }]}>
                    across {selectedYears.length} {selectedYears.length === 1 ? 'paper' : 'papers'}
                  </Text>
                </View>

                {/* Time Box */}
                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: colors.metricBoxBg },
                  ]}>
                  <Text style={[styles.metricBoxLabel, { color: colors.textMuted }]}>
                    TIME
                  </Text>
                  <Text style={[styles.metricBoxValue, { color: colors.textPrimary }]}>
                    {durationDisplayString}
                  </Text>
                  <Text style={[styles.metricBoxSub, { color: colors.textMuted }]}>
                    {testMode === 'full' ? 'per paper, one sitting each' : 'untimed session'}
                  </Text>
                </View>
              </View>

              {/* Breakdown Table Rows */}
              <View style={styles.breakdownList}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                    Paper
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {paperType === 'GS1' ? 'Paper I, General Studies' : 'Paper II, CSAT'}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                    Years
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {yearsSummaryString}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                    Scope
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {scope === 'full' ? 'Full paper' : selectedSubject || 'Subject-wise'}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                    Mode
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {testMode === 'full' ? 'Timed exam' : 'Practice'}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                    Marking
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {markingSummaryString}
                  </Text>
                </View>
              </View>

              {/* Start Mock Test Button */}
              <Pressable
                onPress={handleStartTest}
                disabled={isStartDisabled}
                accessibilityRole="button"
                accessibilityLabel="Start mock test"
                style={({ pressed }) => [
                  styles.startMockBtn,
                  {
                    backgroundColor: isStartDisabled
                      ? isDark
                        ? '#292C36'
                        : '#D1D5DB'
                      : colors.primary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                {isGenerating ? (
                  <View style={styles.btnContentRow}>
                    <ActivityIndicator size="small" color={colors.buttonText} />
                    <Text style={[styles.startMockBtnText, { color: colors.buttonText }]}>
                      Preparing test...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text style={[styles.startMockBtnText, { color: colors.buttonText }]}>
                      Start mock test
                    </Text>
                    <ArrowRight size={16} color={colors.buttonText} strokeWidth={2.4} />
                  </View>
                )}
              </Pressable>

              <Text style={[styles.summaryFooterNote, { color: colors.textMuted }]}>
                {testMode === 'full'
                  ? 'Each year runs as its own 2 hour sitting.'
                  : 'Practice questions with instant answer explanations.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Subject Modal */}
      <SubjectTopicPickerModal
        visible={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        subjects={filtersData.subjects}
        topicsBySubject={filtersData.topicsBySubject}
        selectedSubject={selectedSubject}
        selectedTopic={selectedTopic}
        onSelect={(subj, top) => {
          setSelectedSubject(subj);
          setSelectedTopic(top);
        }}
        paperType={paperType}
        isDark={isDark}
      />

      {/* History Modal */}
      <TestHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectTest={(testId) => {
          setShowHistoryModal(false);
          onStartTest(testId);
        }}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  wideContainer: {
    maxWidth: 1180,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },

  /* Top Navbar */
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  topNavBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBrandText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  topNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  historyPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  historyCountBadge: {
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  historyCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Hero Section */
  heroSection: {
    marginBottom: 24,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#6366F1',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 620,
  },

  /* Main Layout: Left Steps + Right Summary */
  mainLayout: {
    flexDirection: 'column',
    gap: 24,
  },
  mainLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
  },
  leftColumn: {
    flex: 1,
    gap: 20,
  },
  leftColumnWide: {
    flex: 1.7,
  },
  rightColumn: {
    flex: 1,
  },
  rightColumnWide: {
    flex: 1,
    maxWidth: 380,
  },

  /* Step Card Common */
  stepCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  stepCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepCardFooterNote: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -4,
  },

  /* Step 1: Paper Options */
  paperOptionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paperOptionBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
  },
  paperOptionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paperLabelCode: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  paperHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  paperMetaText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  paperTagText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  /* Step 2: Years Selection */
  yearsActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearsCountInfo: {
    fontSize: 12,
    fontWeight: '600',
  },
  yearsActionLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearBox: {
    width: 58,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBoxText: {
    fontSize: 13,
  },

  /* Step 3: Scope Selection */
  scopeSegmentPill: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    maxWidth: 300,
  },
  scopeSegmentOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  scopeSegmentOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  scopeSegmentText: {
    fontSize: 13.5,
  },
  subjectPickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  subjectPickerTextGroup: {
    flex: 1,
    gap: 2,
  },
  subjectPickerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectPickerSub: {
    fontSize: 11,
  },

  /* Step 4: Mode & Toggles */
  modeOptionBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  modeOptionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  modeDescription: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  togglesGroup: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 11.5,
  },

  /* Right Summary Card */
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricBoxesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  metricBoxLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricBoxValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricBoxSub: {
    fontSize: 11,
    fontWeight: '500',
  },

  breakdownList: {
    gap: 12,
    paddingVertical: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },

  startMockBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startMockBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  summaryFooterNote: {
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
  },
});
