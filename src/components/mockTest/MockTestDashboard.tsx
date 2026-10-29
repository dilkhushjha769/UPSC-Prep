import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  History,
  Check,
  ChevronDown,
  X,
  Sun,
  Moon,
  Clock,
  BookOpen,
  FileText,
  Layers,
  Calculator,
  Play,
  BarChart2,
  Shield,
  ListChecks,
  Info,
  Lightbulb,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
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

export type MainTestType = 'full_mock' | 'subject' | 'pyq';

interface MockTestDashboardProps {
  onStartTest: (testId: string) => void;
  onToggleTheme?: () => void;
  onBack?: () => void;
  isDark?: boolean;
}

const PREF_STORAGE_KEY = '@upsc_mock_test_v2_pref';

export function MockTestDashboard({
  onStartTest,
  onToggleTheme,
  onBack,
  isDark = true,
}: MockTestDashboardProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isWide = width >= 940;

  // Active top-level mode: PYQ, Subject-wise, or Full Mock (default to 'pyq' matching mockup)
  const [activeTestType, setActiveTestType] = useState<MainTestType>('pyq');

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [completedTestsCount, setCompletedTestsCount] = useState(0);

  // Subject & Topic picker modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // Filters data loaded from database
  const [filtersData, setFiltersData] = useState<AvailableFiltersData>({
    years: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014],
    subjects: [],
    topicsBySubject: {},
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Configuration state
  const [paperType, setPaperType] = useState<PaperType>('CSAT');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('Reading Comprehension');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>('full'); // Timed mode in mockup
  const [orderMode, setOrderMode] = useState<QuestionOrderMode>('exam_order');

  // Full mock test specific presets
  const [fullMockPreset, setFullMockPreset] = useState<'pool' | number>('pool');

  // Live count state
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [isCounting, setIsCounting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Load preferences and initial data
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [savedPref, stats] = await Promise.all([
          AsyncStorage.getItem(PREF_STORAGE_KEY),
          MockTestService.getSummaryStats(),
        ]);

        if (!mounted) return;
        setCompletedTestsCount(stats.completedTests);

        if (savedPref) {
          try {
            const parsed = JSON.parse(savedPref);
            if (parsed.testType) setActiveTestType(parsed.testType);
            if (parsed.paperType) setPaperType(parsed.paperType);
            if (parsed.questionCount) setQuestionCount(parsed.questionCount);
            if (parsed.testMode) setTestMode(parsed.testMode);
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load initial preferences:', err);
      }
    }

    initialize();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch available filters whenever paper type changes
  useEffect(() => {
    let mounted = true;

    MockTestService.getAvailableFilters(paperType).then((data) => {
      if (!mounted) return;
      setFiltersData(data);
      setLoadingFilters(false);

      if (data.subjects.length > 0) {
        setSelectedSubject((prev) => {
          if (prev && data.subjects.some((s) => s.name === prev)) {
            return prev;
          }
          return data.subjects[0].name;
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [paperType]);

  // Save preferences when primary choices change
  const savePreferences = useCallback(
    async (newType: MainTestType, newPaper: PaperType, newCount: number, newMode: TestMode) => {
      try {
        await AsyncStorage.setItem(
          PREF_STORAGE_KEY,
          JSON.stringify({
            testType: newType,
            paperType: newPaper,
            questionCount: newCount,
            testMode: newMode,
          })
        );
      } catch {}
    },
    []
  );

  // Handle Main Test Type change
  const handleTestTypeChange = (type: MainTestType) => {
    setActiveTestType(type);
    setSelectedTopic('');

    if (type === 'full_mock') {
      const fullCount = paperType === 'CSAT' ? 80 : 100;
      setQuestionCount(fullCount);
      setTestMode('full');
      setOrderMode('exam_order');
      savePreferences(type, paperType, fullCount, 'full');
    } else if (type === 'subject') {
      const defaultSubCount = 25;
      setQuestionCount(defaultSubCount);
      setIsCustomCount(false);
      savePreferences(type, paperType, defaultSubCount, testMode);
    } else {
      const defaultPyqCount = 25;
      setQuestionCount(defaultPyqCount);
      setIsCustomCount(false);
      savePreferences(type, paperType, defaultPyqCount, testMode);
    }
  };

  // Handle Paper Type change
  const handlePaperTypeChange = (pType: PaperType) => {
    setPaperType(pType);
    setSelectedTopic('');
    if (activeTestType === 'full_mock') {
      const fullCount = pType === 'CSAT' ? 80 : 100;
      setQuestionCount(fullCount);
      savePreferences(activeTestType, pType, fullCount, testMode);
    } else {
      savePreferences(activeTestType, pType, questionCount, testMode);
    }
  };

  // Construct effective filter query based on active test type
  const currentFilterConfig: MockTestFilterConfig = useMemo(() => {
    let years: number[] = [];
    let subjects: string[] = [];
    let topics: string[] = [];
    let effectiveCount = questionCount;
    let effectiveOrder = orderMode;
    let effectiveMode = testMode;

    const marksCorrect = paperType === 'CSAT' ? 2.5 : 2.0;
    const marksNegative = paperType === 'CSAT' ? 0.8333 : 0.6667;

    if (activeTestType === 'full_mock') {
      effectiveCount = paperType === 'CSAT' ? 80 : 100;
      if (fullMockPreset !== 'pool') {
        years = [fullMockPreset];
      }
    } else if (activeTestType === 'subject') {
      if (selectedSubject) {
        subjects = [selectedSubject];
      }
      if (selectedTopic) {
        topics = [selectedTopic];
      }
      if (selectedYear !== 'all') {
        years = [selectedYear];
      }
    } else {
      if (selectedYear !== 'all') {
        years = [selectedYear];
      }
      if (selectedSubject && selectedSubject !== 'All Subjects') {
        subjects = [selectedSubject];
      }
      if (selectedTopic) {
        topics = [selectedTopic];
      }
    }

    return {
      paperType,
      selectedYears: years,
      selectedSubjects: subjects,
      selectedTopics: topics,
      questionCount: effectiveCount,
      testMode: effectiveMode,
      orderMode: effectiveOrder,
      marksPerCorrect: marksCorrect,
      negativeMarks: marksNegative,
      timeLimitMinutes:
        effectiveMode === 'full'
          ? paperType === 'CSAT'
            ? 120
            : 120
          : undefined,
    };
  }, [
    activeTestType,
    paperType,
    selectedYear,
    selectedSubject,
    selectedTopic,
    questionCount,
    testMode,
    orderMode,
    fullMockPreset,
  ]);

  // Debounced question count query
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
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentFilterConfig]);

  // Primary Action: Start Test
  const handleStartTest = async () => {
    if (matchingCount === 0) {
      Alert.alert(
        'Insufficient Questions',
        'No questions match this selection. Please pick a different subject or broaden the year filter.'
      );
      return;
    }

    const effectiveCount = Math.min(questionCount, matchingCount);
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

  const isStartDisabled = matchingCount === 0 || isGenerating || loadingFilters;

  // Summary computed numbers
  const displayQuestionCount = useMemo(() => {
    if (activeTestType === 'full_mock') {
      return paperType === 'CSAT' ? 80 : 100;
    }
    return matchingCount > 0 ? matchingCount : questionCount;
  }, [activeTestType, paperType, matchingCount, questionCount]);

  const durationLabel = useMemo(() => {
    if (testMode === 'full') {
      return '2 hours';
    }
    return 'Self-paced';
  }, [testMode]);

  const negativeMarksLabel = useMemo(() => {
    return paperType === 'CSAT' ? '0.83 marks' : '0.66 marks';
  }, [paperType]);

  const totalMarksLabel = useMemo(() => {
    return '200';
  }, []);

  const aboutDescription = useMemo(() => {
    if (activeTestType === 'full_mock') {
      return 'Full Mocks simulate the actual UPSC exam with 120 minutes countdown, negative marking, and complete paper coverage.';
    }
    if (activeTestType === 'subject') {
      return 'Subject-wise tests allow you to strengthen core syllabus areas with targeted practice and instant analysis.';
    }
    return 'Previous Year Questions help you understand the actual exam pattern, frequently asked topics and difficulty level.';
  }, [activeTestType]);

  return (
    <View style={[styles.screenWrapper, { backgroundColor: isDark ? '#121316' : '#F4F5FA' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isWide && styles.wideContainer]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onBack && (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                    borderColor: isDark ? '#2E323D' : '#E4E6EE',
                  },
                ]}>
                <ArrowLeft size={18} color={theme.textPrimary} strokeWidth={2.4} />
              </Pressable>
            )}
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Mock Tests</Text>
              <Text style={[styles.pageSubtitle, { color: isDark ? '#8F92A1' : '#6E7182' }]}>
                Practice with previous year questions and experience the real exam environment.
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {onToggleTheme && (
              <Pressable
                onPress={onToggleTheme}
                accessibilityRole="button"
                accessibilityLabel="Toggle Theme"
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                    borderColor: isDark ? '#2E323D' : '#E4E6EE',
                  },
                ]}>
                {isDark ? (
                  <Sun size={17} color={theme.textPrimary} strokeWidth={2} />
                ) : (
                  <Moon size={17} color={theme.textPrimary} strokeWidth={2} />
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowHistoryModal(true)}
              accessibilityRole="button"
              accessibilityLabel="View Test History"
              style={[
                styles.historyButton,
                {
                  backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                  borderColor: isDark ? '#2E323D' : '#E4E6EE',
                },
              ]}>
              <History size={16} color={theme.textPrimary} strokeWidth={2} />
              <Text style={[styles.historyButtonText, { color: theme.textPrimary }]}>History</Text>
              {completedTestsCount > 0 && (
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>{completedTestsCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Responsive Content Body: Split into Left Config Column & Right Summary Column */}
        <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>
          {/* LEFT COLUMN: Configuration Steps */}
          <View style={[styles.leftColumn, isWide && styles.leftColumnWide]}>
            {/* Top Main Test Type Card (Full Mock | Subject-wise | PYQs) */}
            <View
              style={[
                styles.typeSegmentCard,
                {
                  backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                  borderColor: isDark ? '#2E323D' : '#E4E6EE',
                },
              ]}>
              {/* Full Mock Tab */}
              <Pressable
                onPress={() => handleTestTypeChange('full_mock')}
                style={[
                  styles.typeTab,
                  activeTestType === 'full_mock' && styles.typeTabActive,
                ]}>
                <View
                  style={[
                    styles.typeTabIconBox,
                    {
                      backgroundColor:
                        activeTestType === 'full_mock'
                          ? 'rgba(255, 255, 255, 0.22)'
                          : isDark
                          ? '#292C35'
                          : '#F0F2F7',
                    },
                  ]}>
                  <FileText
                    size={18}
                    color={activeTestType === 'full_mock' ? '#FFFFFF' : theme.textPrimary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.typeTabTextCol}>
                  <Text
                    style={[
                      styles.typeTabTitle,
                      { color: activeTestType === 'full_mock' ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    Full Mock
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.typeTabSubtitle,
                      {
                        color:
                          activeTestType === 'full_mock'
                            ? 'rgba(255, 255, 255, 0.85)'
                            : isDark
                            ? '#8F92A1'
                            : '#6E7182',
                      },
                    ]}>
                    Complete exam simulation
                  </Text>
                </View>
              </Pressable>

              {/* Subject-wise Tab */}
              <Pressable
                onPress={() => handleTestTypeChange('subject')}
                style={[
                  styles.typeTab,
                  activeTestType === 'subject' && styles.typeTabActive,
                ]}>
                <View
                  style={[
                    styles.typeTabIconBox,
                    {
                      backgroundColor:
                        activeTestType === 'subject'
                          ? 'rgba(255, 255, 255, 0.22)'
                          : isDark
                          ? '#292C35'
                          : '#F0F2F7',
                    },
                  ]}>
                  <Layers
                    size={18}
                    color={activeTestType === 'subject' ? '#FFFFFF' : theme.textPrimary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.typeTabTextCol}>
                  <Text
                    style={[
                      styles.typeTabTitle,
                      { color: activeTestType === 'subject' ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    Subject-wise
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.typeTabSubtitle,
                      {
                        color:
                          activeTestType === 'subject'
                            ? 'rgba(255, 255, 255, 0.85)'
                            : isDark
                            ? '#8F92A1'
                            : '#6E7182',
                      },
                    ]}>
                    Focus on specific subjects
                  </Text>
                </View>
              </Pressable>

              {/* PYQs Tab */}
              <Pressable
                onPress={() => handleTestTypeChange('pyq')}
                style={[
                  styles.typeTab,
                  activeTestType === 'pyq' && styles.typeTabActive,
                ]}>
                <View
                  style={[
                    styles.typeTabIconBox,
                    {
                      backgroundColor:
                        activeTestType === 'pyq'
                          ? 'rgba(255, 255, 255, 0.22)'
                          : isDark
                          ? '#292C35'
                          : '#F0F2F7',
                    },
                  ]}>
                  <FileText
                    size={18}
                    color={activeTestType === 'pyq' ? '#FFFFFF' : theme.textPrimary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.typeTabTextCol}>
                  <Text
                    style={[
                      styles.typeTabTitle,
                      { color: activeTestType === 'pyq' ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    PYQs
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.typeTabSubtitle,
                      {
                        color:
                          activeTestType === 'pyq'
                            ? 'rgba(255, 255, 255, 0.85)'
                            : isDark
                            ? '#8F92A1'
                            : '#6E7182',
                      },
                    ]}>
                    Previous year questions
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* STEP 1: Select Paper */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepHeaderTextCol}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Select Paper
                  </Text>
                  <Text style={[styles.stepSubtitle, { color: isDark ? '#8F92A1' : '#6E7182' }]}>
                    Choose the question paper.
                  </Text>
                </View>
              </View>

              <View style={styles.paperCardsRow}>
                {/* GS Paper I Card */}
                <Pressable
                  onPress={() => handlePaperTypeChange('GS1')}
                  style={[
                    styles.paperOptionCard,
                    {
                      backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                      borderColor:
                        paperType === 'GS1' ? '#006FFD' : isDark ? '#2E323D' : '#E4E6EE',
                    },
                    paperType === 'GS1' && styles.optionCardSelected,
                  ]}>
                  <View
                    style={[
                      styles.paperIconBox,
                      {
                        backgroundColor:
                          paperType === 'GS1' ? '#006FFD' : isDark ? '#292C35' : '#F0F2F7',
                      },
                    ]}>
                    <FileText
                      size={20}
                      color={paperType === 'GS1' ? '#FFFFFF' : theme.textPrimary}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.paperTextCol}>
                    <Text style={[styles.paperTitle, { color: theme.textPrimary }]}>
                      GS Paper I
                    </Text>
                    <Text
                      style={[
                        styles.paperSubtitle,
                        { color: isDark ? '#8F92A1' : '#6E7182' },
                      ]}>
                      General Studies
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          paperType === 'GS1' ? '#006FFD' : isDark ? '#4A4F5E' : '#C4C7D4',
                      },
                      paperType === 'GS1' && styles.radioCircleActive,
                    ]}>
                    {paperType === 'GS1' && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>

                {/* CSAT Paper II Card */}
                <Pressable
                  onPress={() => handlePaperTypeChange('CSAT')}
                  style={[
                    styles.paperOptionCard,
                    {
                      backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                      borderColor:
                        paperType === 'CSAT' ? '#006FFD' : isDark ? '#2E323D' : '#E4E6EE',
                    },
                    paperType === 'CSAT' && styles.optionCardSelected,
                  ]}>
                  <View
                    style={[
                      styles.paperIconBox,
                      {
                        backgroundColor:
                          paperType === 'CSAT' ? '#006FFD' : isDark ? '#292C35' : '#F0F2F7',
                      },
                    ]}>
                    <Calculator
                      size={20}
                      color={paperType === 'CSAT' ? '#FFFFFF' : theme.textPrimary}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.paperTextCol}>
                    <Text style={[styles.paperTitle, { color: theme.textPrimary }]}>
                      CSAT Paper II
                    </Text>
                    <Text
                      style={[
                        styles.paperSubtitle,
                        { color: isDark ? '#8F92A1' : '#6E7182' },
                      ]}>
                      Aptitude & English
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          paperType === 'CSAT' ? '#006FFD' : isDark ? '#4A4F5E' : '#C4C7D4',
                      },
                      paperType === 'CSAT' && styles.radioCircleActive,
                    ]}>
                    {paperType === 'CSAT' && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>
              </View>
            </View>

            {/* STEP 2: Select Year */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepHeaderTextCol}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Select Year
                  </Text>
                  <Text style={[styles.stepSubtitle, { color: isDark ? '#8F92A1' : '#6E7182' }]}>
                    Pick a year to practice.
                  </Text>
                </View>
              </View>

              {/* Year Chips Grid */}
              <View style={styles.yearGrid}>
                {/* All Years Pill */}
                <Pressable
                  onPress={() => setSelectedYear('all')}
                  style={[
                    styles.yearChip,
                    selectedYear === 'all'
                      ? styles.yearChipActive
                      : {
                          backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                          borderColor: isDark ? '#2E323D' : '#E4E6EE',
                        },
                  ]}>
                  <Text
                    style={[
                      styles.yearChipText,
                      selectedYear === 'all'
                        ? styles.yearChipTextActive
                        : { color: theme.textPrimary },
                    ]}>
                    All Years
                  </Text>
                </Pressable>

                {filtersData.years.map((year) => {
                  const isSelected = selectedYear === year;
                  return (
                    <Pressable
                      key={year}
                      onPress={() => setSelectedYear(year)}
                      style={[
                        styles.yearChip,
                        isSelected
                          ? styles.yearChipActive
                          : {
                              backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                              borderColor: isDark ? '#2E323D' : '#E4E6EE',
                            },
                      ]}>
                      <Text
                        style={[
                          styles.yearChipText,
                          isSelected
                            ? styles.yearChipTextActive
                            : { color: theme.textPrimary },
                        ]}>
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* STEP 3: Select Subject (Optional) */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepHeaderTextCol}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Select Subject (Optional)
                  </Text>
                  <Text style={[styles.stepSubtitle, { color: isDark ? '#8F92A1' : '#6E7182' }]}>
                    Filter by subject to focus on a specific area.
                  </Text>
                </View>
              </View>

              {/* Subject Dropdown Card */}
              <Pressable
                onPress={() => setShowSubjectModal(true)}
                style={[
                  styles.subjectDropdownCard,
                  {
                    backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                    borderColor: isDark ? '#2E323D' : '#E4E6EE',
                  },
                ]}>
                <View style={styles.subjectDropdownLeft}>
                  <BookOpen size={18} color={theme.textPrimary} strokeWidth={2} />
                  <Text
                    numberOfLines={1}
                    style={[styles.subjectDropdownText, { color: theme.textPrimary }]}>
                    {selectedSubject
                      ? selectedTopic
                        ? `${selectedSubject} · ${selectedTopic}`
                        : selectedSubject
                      : 'All Subjects Included'}
                  </Text>
                </View>
                <ChevronDown size={18} color={isDark ? '#8F92A1' : '#6E7182'} strokeWidth={2} />
              </Pressable>
            </View>

            {/* STEP 4: Select Mode */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepHeaderTextCol}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Select Mode
                  </Text>
                  <Text style={[styles.stepSubtitle, { color: isDark ? '#8F92A1' : '#6E7182' }]}>
                    Choose how you want to attempt the questions.
                  </Text>
                </View>
              </View>

              <View style={styles.paperCardsRow}>
                {/* Practice Mode */}
                <Pressable
                  onPress={() => {
                    setTestMode('practice');
                    savePreferences(activeTestType, paperType, questionCount, 'practice');
                  }}
                  style={[
                    styles.paperOptionCard,
                    {
                      backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                      borderColor:
                        testMode === 'practice' ? '#006FFD' : isDark ? '#2E323D' : '#E4E6EE',
                    },
                    testMode === 'practice' && styles.optionCardSelected,
                  ]}>
                  <View
                    style={[
                      styles.paperIconBox,
                      {
                        backgroundColor:
                          testMode === 'practice'
                            ? '#006FFD'
                            : isDark
                            ? '#292C35'
                            : '#F0F2F7',
                      },
                    ]}>
                    <BookOpen
                      size={20}
                      color={testMode === 'practice' ? '#FFFFFF' : theme.textPrimary}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.paperTextCol}>
                    <Text style={[styles.paperTitle, { color: theme.textPrimary }]}>
                      Practice Mode
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.paperSubtitle,
                        { color: isDark ? '#8F92A1' : '#6E7182' },
                      ]}>
                      See answers as you go and learn instantly.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          testMode === 'practice'
                            ? '#006FFD'
                            : isDark
                            ? '#4A4F5E'
                            : '#C4C7D4',
                      },
                      testMode === 'practice' && styles.radioCircleActive,
                    ]}>
                    {testMode === 'practice' && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>

                {/* Timed Mode */}
                <Pressable
                  onPress={() => {
                    setTestMode('full');
                    savePreferences(activeTestType, paperType, questionCount, 'full');
                  }}
                  style={[
                    styles.paperOptionCard,
                    {
                      backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                      borderColor:
                        testMode === 'full' ? '#006FFD' : isDark ? '#2E323D' : '#E4E6EE',
                    },
                    testMode === 'full' && styles.optionCardSelected,
                  ]}>
                  <View
                    style={[
                      styles.paperIconBox,
                      {
                        backgroundColor:
                          testMode === 'full' ? '#006FFD' : isDark ? '#292C35' : '#F0F2F7',
                      },
                    ]}>
                    <Clock
                      size={20}
                      color={testMode === 'full' ? '#FFFFFF' : theme.textPrimary}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.paperTextCol}>
                    <Text style={[styles.paperTitle, { color: theme.textPrimary }]}>
                      Timed Mode
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.paperSubtitle,
                        { color: isDark ? '#8F92A1' : '#6E7182' },
                      ]}>
                      Exam-style countdown for a real experience.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          testMode === 'full' ? '#006FFD' : isDark ? '#4A4F5E' : '#C4C7D4',
                      },
                      testMode === 'full' && styles.radioCircleActive,
                    ]}>
                    {testMode === 'full' && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Primary Action Button: Start Test */}
            <Pressable
              onPress={handleStartTest}
              disabled={isStartDisabled}
              accessibilityRole="button"
              accessibilityLabel="Start Test"
              style={({ pressed }) => [
                styles.startTestBigButton,
                {
                  backgroundColor: isStartDisabled ? (isDark ? '#2A2D36' : '#D0D4E0') : '#006FFD',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              {isGenerating ? (
                <View style={styles.btnContentRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.startTestBigButtonText}>Preparing Test...</Text>
                </View>
              ) : (
                <View style={styles.btnContentRow}>
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.startTestBigButtonText}>Start Test</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* RIGHT COLUMN: Test Summary, About, & Quick Tips (As shown in mockup) */}
          <View style={[styles.rightColumn, isWide && styles.rightColumnWide]}>
            {/* Top Stylized UPSC Exam Document Illustration */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.docGraphicContainer}>
                {/* Abstract blue leaves / background shapes */}
                <View style={styles.docLeafLeft} />
                <View style={styles.docLeafRight} />

                {/* Document Card */}
                <View style={styles.docCard}>
                  <View style={styles.docBadgeRow}>
                    <Text style={styles.docBadgeText}>UPSC</Text>
                  </View>
                  <View style={styles.docLinesGroup}>
                    <View style={[styles.docLine, { width: '85%' }]} />
                    <View style={[styles.docLine, { width: '65%' }]} />
                    <View style={[styles.docLine, { width: '45%' }]} />
                  </View>
                  <View style={styles.docChartRow}>
                    <View style={[styles.docChartBar, { height: 12 }]} />
                    <View style={[styles.docChartBar, { height: 18 }]} />
                    <View style={[styles.docChartBar, { height: 24 }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Test Summary Card */}
            <View
              style={[
                styles.sidebarCard,
                {
                  backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                  borderColor: isDark ? '#2E323D' : '#E4E6EE',
                },
              ]}>
              <View style={styles.sidebarCardHeader}>
                <View style={styles.sidebarHeaderIconBox}>
                  <BarChart2 size={16} color="#006FFD" strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sidebarCardTitle, { color: theme.textPrimary }]}>
                    Test Summary
                  </Text>
                  <Text style={[styles.sidebarCardSubtitle, { color: isDark ? '#8F92A1' : '#6E7182' }]}>
                    Based on your selection
                  </Text>
                </View>
              </View>

              {/* Stats Rows */}
              <View style={styles.summaryStatsList}>
                {/* Questions */}
                <View style={styles.summaryStatRow}>
                  <View style={styles.summaryStatLeft}>
                    <FileText size={16} color={isDark ? '#8F92A1' : '#6E7182'} strokeWidth={2} />
                    <Text style={[styles.summaryStatLabel, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                      Questions
                    </Text>
                  </View>
                  <Text style={[styles.summaryStatValue, { color: theme.textPrimary }]}>
                    {displayQuestionCount}
                  </Text>
                </View>

                {/* Duration */}
                <View style={styles.summaryStatRow}>
                  <View style={styles.summaryStatLeft}>
                    <Layers size={16} color={isDark ? '#8F92A1' : '#6E7182'} strokeWidth={2} />
                    <Text style={[styles.summaryStatLabel, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                      Duration
                    </Text>
                  </View>
                  <Text style={[styles.summaryStatValue, { color: theme.textPrimary }]}>
                    {durationLabel}
                  </Text>
                </View>

                {/* Negative Marking */}
                <View style={styles.summaryStatRow}>
                  <View style={styles.summaryStatLeft}>
                    <Shield size={16} color={isDark ? '#8F92A1' : '#6E7182'} strokeWidth={2} />
                    <Text style={[styles.summaryStatLabel, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                      Negative Marking
                    </Text>
                  </View>
                  <Text style={[styles.summaryStatValue, { color: theme.textPrimary }]}>
                    {negativeMarksLabel}
                  </Text>
                </View>

                {/* Total Marks */}
                <View style={styles.summaryStatRow}>
                  <View style={styles.summaryStatLeft}>
                    <ListChecks size={16} color={isDark ? '#8F92A1' : '#6E7182'} strokeWidth={2} />
                    <Text style={[styles.summaryStatLabel, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                      Total Marks
                    </Text>
                  </View>
                  <Text style={[styles.summaryStatValue, { color: theme.textPrimary }]}>
                    {totalMarksLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* About Card */}
            <View
              style={[
                styles.aboutCard,
                {
                  backgroundColor: isDark ? '#152136' : '#EAF2FF',
                  borderColor: isDark ? '#23385C' : '#B4DBFF',
                },
              ]}>
              <View style={styles.aboutHeaderRow}>
                <View style={styles.aboutIconCircle}>
                  <Info size={14} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text style={[styles.aboutTitle, { color: isDark ? '#FFFFFF' : '#006FFD' }]}>
                  {activeTestType === 'full_mock'
                    ? 'About Full Mock'
                    : activeTestType === 'subject'
                    ? 'About Subject-wise'
                    : 'About PYQs'}
                </Text>
              </View>
              <Text
                style={[
                  styles.aboutDescription,
                  { color: isDark ? '#B4CBED' : '#2D4B75' },
                ]}>
                {aboutDescription}
              </Text>
            </View>

            {/* Quick Tips Card */}
            <View
              style={[
                styles.sidebarCard,
                {
                  backgroundColor: isDark ? '#1D1F25' : '#FFFFFF',
                  borderColor: isDark ? '#2E323D' : '#E4E6EE',
                },
              ]}>
              <View style={styles.quickTipsHeader}>
                <Lightbulb size={18} color="#EAB308" strokeWidth={2.4} />
                <Text style={[styles.quickTipsTitle, { color: theme.textPrimary }]}>
                  Quick Tips
                </Text>
              </View>

              <View style={styles.quickTipsList}>
                <View style={styles.quickTipRow}>
                  <View style={styles.greenCheckCircle}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.quickTipText, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                    Attempt in a quiet environment
                  </Text>
                </View>

                <View style={styles.quickTipRow}>
                  <View style={styles.greenCheckCircle}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.quickTipText, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                    Manage time effectively
                  </Text>
                </View>

                <View style={styles.quickTipRow}>
                  <View style={styles.greenCheckCircle}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.quickTipText, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                    Analyze detailed solutions
                  </Text>
                </View>

                <View style={styles.quickTipRow}>
                  <View style={styles.greenCheckCircle}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.quickTipText, { color: isDark ? '#C4C7D4' : '#494A50' }]}>
                    Track your progress over time
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <SubjectTopicPickerModal
        visible={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        subjects={filtersData.subjects}
        topicsBySubject={filtersData.topicsBySubject}
        selectedSubject={selectedSubject}
        selectedTopic={selectedTopic}
        onSelect={(subject, topic) => {
          setSelectedSubject(subject);
          setSelectedTopic(topic);
        }}
        paperType={paperType}
        isDark={isDark}
      />

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
    paddingBottom: 30,
  },
  wideContainer: {
    maxWidth: 1140,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 28,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  historyButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyBadge: {
    backgroundColor: '#006FFD',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Responsive Main Layout */
  mainLayout: {
    flexDirection: 'column',
    gap: 24,
  },
  mainLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
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
    gap: 16,
  },
  rightColumnWide: {
    flex: 1,
    maxWidth: 360,
  },

  /* Top Main Test Type Card */
  typeSegmentCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  typeTabActive: {
    backgroundColor: '#006FFD',
  },
  typeTabIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTabTextCol: {
    flex: 1,
  },
  typeTabTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  typeTabSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
  },

  /* Step Section */
  stepSection: {
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#006FFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepHeaderTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  stepSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },

  /* Step 1 & 4 Cards Row */
  paperCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paperOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(0, 111, 253, 0.10)',
    borderColor: '#006FFD',
  },
  paperIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperTextCol: {
    flex: 1,
  },
  paperTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  paperSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#006FFD',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006FFD',
  },

  /* Step 2: Year Grid */
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearChipActive: {
    backgroundColor: '#B4DBFF',
    borderColor: '#006FFD',
  },
  yearChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  yearChipTextActive: {
    color: '#004CB3',
    fontWeight: '800',
  },

  /* Step 3: Subject Dropdown Card */
  subjectDropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  subjectDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subjectDropdownText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },

  /* Big Start Test Button */
  startTestBigButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#006FFD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  startTestBigButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Right Sidebar Components */
  illustrationWrapper: {
    alignItems: 'flex-end',
    paddingRight: 10,
    marginBottom: -8,
  },
  docGraphicContainer: {
    width: 140,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  docLeafLeft: {
    position: 'absolute',
    left: 8,
    top: 14,
    width: 44,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    transform: [{ rotate: '-32deg' }],
    opacity: 0.8,
  },
  docLeafRight: {
    position: 'absolute',
    right: 8,
    top: 12,
    width: 44,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    transform: [{ rotate: '32deg' }],
    opacity: 0.85,
  },
  docCard: {
    width: 86,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  docBadgeRow: {
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  docBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  docLinesGroup: {
    gap: 4,
  },
  docLine: {
    height: 3,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  docChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 3,
    paddingTop: 4,
  },
  docChartBar: {
    width: 6,
    backgroundColor: '#006FFD',
    borderRadius: 2,
  },

  sidebarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sidebarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 111, 253, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarCardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  summaryStatsList: {
    gap: 12,
  },
  summaryStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryStatLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  summaryStatValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  aboutCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#006FFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  aboutDescription: {
    fontSize: 11.5,
    lineHeight: 17,
  },

  quickTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickTipsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickTipsList: {
    gap: 10,
  },
  quickTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greenCheckCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTipText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
