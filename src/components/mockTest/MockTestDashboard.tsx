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
  Platform,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Clock,
  History,
  BookOpen,
  BookOpenCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  ArrowRight,
  SlidersHorizontal,
  Search,
  X,
  Sun,
  Moon,
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

export type MainTestType = 'pyq' | 'subject' | 'full_mock';

interface MockTestDashboardProps {
  onStartTest: (testId: string) => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

const PREF_STORAGE_KEY = '@upsc_mock_test_v2_pref';

export function MockTestDashboard({
  onStartTest,
  onToggleTheme,
  isDark = true,
}: MockTestDashboardProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Active top-level mode: PYQ, Subject-wise, or Full Mock
  const [activeTestType, setActiveTestType] = useState<MainTestType>('pyq');

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [completedTestsCount, setCompletedTestsCount] = useState(0);

  // Filters data loaded from database
  const [filtersData, setFiltersData] = useState<AvailableFiltersData>({
    years: [2026, 2025, 2024],
    subjects: [],
    topicsBySubject: {},
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Configuration state
  const [paperType, setPaperType] = useState<PaperType>('GS1');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>(''); // For subject mode
  const [subjectSearchQuery, setSubjectSearchQuery] = useState(''); // Fast subject search bar
  const [selectedTopic, setSelectedTopic] = useState<string>(''); // For topic drill-down
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>('practice');
  const [orderMode, setOrderMode] = useState<QuestionOrderMode>('random');

  // Full mock test specific presets
  const [fullMockPreset, setFullMockPreset] = useState<'pool' | number>('pool');

  // Progressive disclosure accordions
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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

      // In subject mode, if currently selected subject is not in the list, pick the top subject
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
    setShowMoreFilters(false);
    setSelectedTopic('');
    setSubjectSearchQuery('');

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
      // PYQ mode
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
    setSubjectSearchQuery('');
    if (activeTestType === 'full_mock') {
      const fullCount = pType === 'CSAT' ? 80 : 100;
      setQuestionCount(fullCount);
      savePreferences(activeTestType, pType, fullCount, testMode);
    } else {
      savePreferences(activeTestType, pType, questionCount, testMode);
    }
  };

  // Filter subjects by search query
  const filteredSubjects = useMemo(() => {
    if (!subjectSearchQuery.trim()) {
      return filtersData.subjects;
    }
    const q = subjectSearchQuery.toLowerCase().trim();
    return filtersData.subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [filtersData.subjects, subjectSearchQuery]);

  // Dynamic topics for selected subject
  const availableTopics = useMemo(() => {
    if (!selectedSubject) return [];
    return filtersData.topicsBySubject[selectedSubject] || [];
  }, [selectedSubject, filtersData.topicsBySubject]);

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
      // PYQ mode
      if (selectedYear !== 'all') {
        years = [selectedYear];
      }
      if (selectedSubject) {
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

  // 3. Debounced question count query
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

  // Question count presets: 10, 25, 50, 100, Custom
  const countPresets = useMemo(() => {
    if (activeTestType === 'full_mock') {
      return paperType === 'CSAT' ? [80] : [100];
    }
    return [10, 25, 50, 100];
  }, [activeTestType, paperType]);

  const handleSelectCountPreset = (preset: number) => {
    setIsCustomCount(false);
    setCustomCountInput('');
    setQuestionCount(preset);
    savePreferences(activeTestType, paperType, preset, testMode);
  };

  const handleCustomCountSubmit = (text: string) => {
    setCustomCountInput(text);
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setQuestionCount(parsed);
      savePreferences(activeTestType, paperType, parsed, testMode);
    }
  };

  // Dynamic summary sentence
  const dynamicSummary = useMemo(() => {
    const qCountStr =
      activeTestType === 'full_mock'
        ? `${paperType === 'CSAT' ? 80 : 100} questions`
        : `${Math.min(questionCount, matchingCount || questionCount)} questions`;

    let subjectStr = '';
    if (activeTestType === 'subject' && selectedSubject) {
      subjectStr = selectedTopic ? `${selectedSubject} (${selectedTopic})` : selectedSubject;
    } else if (selectedSubject) {
      subjectStr = selectedSubject;
    } else {
      subjectStr = paperType === 'CSAT' ? 'CSAT Paper II' : 'GS Paper I';
    }

    let yearStr = '';
    if (activeTestType === 'full_mock') {
      yearStr = fullMockPreset === 'pool' ? 'Comprehensive Pool' : `Official ${fullMockPreset}`;
    } else {
      yearStr = selectedYear === 'all' ? 'All available years' : `Year ${selectedYear}`;
    }

    const modeStr = testMode === 'full' ? 'Timed Exam' : 'Practice Mode';

    return `${qCountStr} · ${subjectStr} · ${yearStr} · ${modeStr}`;
  }, [
    activeTestType,
    paperType,
    selectedSubject,
    selectedTopic,
    selectedYear,
    fullMockPreset,
    questionCount,
    matchingCount,
    testMode,
  ]);

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

  const isCountExceeded = questionCount > matchingCount && matchingCount > 0;
  const isStartDisabled = matchingCount === 0 || isGenerating || loadingFilters;

  return (
    <View style={[styles.screenWrapper, { backgroundColor: theme.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* 1. Header with integrated Theme Toggle & History Button (No overlapping!) */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>
              Mock Tests
            </Text>
            <Text style={[styles.mainSubtitle, { color: theme.textSecondary }]}>
              Practice PYQs. Improve your accuracy.
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            {onToggleTheme && (
              <Pressable
                onPress={onToggleTheme}
                accessibilityLabel="Toggle Theme"
                style={[
                  styles.themeToggleBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(251, 191, 36, 0.12)'
                      : 'rgba(255, 85, 0, 0.08)',
                    borderColor: isDark
                      ? 'rgba(251, 191, 36, 0.28)'
                      : 'rgba(255, 85, 0, 0.2)',
                  },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                ]}>
                {isDark ? (
                  <Sun size={16} color="#FBBF24" strokeWidth={2.2} />
                ) : (
                  <Moon size={16} color="#FF5500" strokeWidth={2.2} />
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowHistoryModal(true)}
              hitSlop={8}
              accessibilityLabel="View Test History"
              style={[
                styles.historyButton,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}>
              <History size={14} color={theme.textPrimary} />
              <Text style={[styles.historyButtonText, { color: theme.textPrimary }]}>
                History
              </Text>
              {completedTestsCount > 0 && (
                <View
                  style={[
                    styles.historyCountPill,
                    { backgroundColor: theme.activeBg },
                  ]}>
                  <Text
                    style={[
                      styles.historyCountText,
                      { color: theme.textSecondary },
                    ]}>
                    {completedTestsCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* 2. Main Test Mode Selector (Three clearly distinguishable options) */}
        <View
          style={[
            styles.modeSegmentContainer,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}>
          {(
            [
              {
                id: 'pyq' as MainTestType,
                title: 'PYQs',
                desc: 'Past papers',
                icon: BookOpen,
              },
              {
                id: 'subject' as MainTestType,
                title: 'Subject-wise',
                desc: 'Targeted drills',
                icon: Layers,
              },
              {
                id: 'full_mock' as MainTestType,
                title: 'Full Mock',
                desc: 'Full exam',
                icon: Clock,
              },
            ] as const
          ).map((item) => {
            const isSelected = activeTestType === item.id;
            const IconComponent = item.icon;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleTestTypeChange(item.id)}
                style={[
                  styles.modeTab,
                  isSelected && {
                    backgroundColor: theme.buttonPrimaryBg,
                  },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                ]}>
                <View style={styles.modeTabHeader}>
                  <IconComponent
                    size={14}
                    color={
                      isSelected ? theme.buttonPrimaryText : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.modeTabTitle,
                      {
                        color: isSelected
                          ? theme.buttonPrimaryText
                          : theme.textPrimary,
                      },
                    ]}>
                    {item.title}
                  </Text>
                </View>
                {isDesktop && (
                  <Text
                    style={[
                      styles.modeTabDesc,
                      {
                        color: isSelected
                          ? isDark
                            ? '#1E293B'
                            : '#F1F5F9'
                          : theme.textMuted,
                      },
                    ]}
                    numberOfLines={1}>
                    {item.desc}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 3. Paper Switcher (GS Paper I vs CSAT) */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            EXAMINATION PAPER
          </Text>
          <View
            style={[
              styles.paperSwitchRow,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}>
            <Pressable
              onPress={() => handlePaperTypeChange('GS1')}
              style={[
                styles.paperSwitchBtn,
                paperType === 'GS1' && {
                  backgroundColor: theme.buttonPrimaryBg,
                },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}>
              <Text
                style={[
                  styles.paperSwitchText,
                  {
                    color:
                      paperType === 'GS1'
                        ? theme.buttonPrimaryText
                        : theme.textSecondary,
                  },
                ]}>
                GS Paper I
              </Text>
              <Text
                style={[
                  styles.paperSwitchBadge,
                  {
                    color:
                      paperType === 'GS1'
                        ? isDark
                          ? '#334155'
                          : '#E2E8F0'
                        : theme.textMuted,
                  },
                ]}>
                +2.0 / -0.66
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handlePaperTypeChange('CSAT')}
              style={[
                styles.paperSwitchBtn,
                paperType === 'CSAT' && {
                  backgroundColor: theme.buttonPrimaryBg,
                },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}>
              <Text
                style={[
                  styles.paperSwitchText,
                  {
                    color:
                      paperType === 'CSAT'
                        ? theme.buttonPrimaryText
                        : theme.textSecondary,
                  },
                ]}>
                CSAT Paper II
              </Text>
              <Text
                style={[
                  styles.paperSwitchBadge,
                  {
                    color:
                      paperType === 'CSAT'
                        ? isDark
                          ? '#334155'
                          : '#E2E8F0'
                        : theme.textMuted,
                  },
                ]}>
                +2.5 / -0.83
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. MODE-SPECIFIC CONFIGURATION */}

        {/* --- MODE A: PYQ MODE --- */}
        {activeTestType === 'pyq' && (
          <View style={styles.configCardWrapper}>
            {/* Year Selection */}
            <View style={styles.configSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                EXAMINATION YEAR
              </Text>
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => setSelectedYear('all')}
                  style={[
                    styles.chip,
                    selectedYear === 'all' && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                    {
                      backgroundColor:
                        selectedYear === 'all'
                          ? theme.buttonPrimaryBg
                          : theme.cardBg,
                      borderColor: theme.cardBorder,
                    },
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedYear === 'all'
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                      },
                    ]}>
                    All Years{filtersData.years.length > 0 ? ` (${filtersData.years[filtersData.years.length - 1]}–${filtersData.years[0]})` : ''}
                  </Text>
                </Pressable>

                {filtersData.years.map((yr) => {
                  const isYrSelected = selectedYear === yr;
                  return (
                    <Pressable
                      key={yr}
                      onPress={() => setSelectedYear(yr)}
                      style={[
                        styles.chip,
                        isYrSelected && {
                          backgroundColor: theme.buttonPrimaryBg,
                          borderColor: theme.buttonPrimaryBg,
                        },
                        {
                          backgroundColor: isYrSelected
                            ? theme.buttonPrimaryBg
                            : theme.cardBg,
                          borderColor: theme.cardBorder,
                        },
                        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isYrSelected
                              ? theme.buttonPrimaryText
                              : theme.textPrimary,
                          },
                        ]}>
                        {yr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Test Format: Practice (BookOpenCheck) vs Timed (Clock) - Replaced AI Sparkles */}
            <View style={styles.configSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                TEST FORMAT
              </Text>
              <View style={styles.formatToggleRow}>
                {/* Practice Mode Card */}
                <Pressable
                  onPress={() => setTestMode('practice')}
                  style={[
                    styles.formatOption,
                    testMode === 'practice' && {
                      backgroundColor: theme.activeBg,
                      borderColor: theme.cardBorderActive,
                    },
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    },
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                  ]}>
                  <View style={styles.formatTopRow}>
                    <View
                      style={[
                        styles.formatIconBox,
                        {
                          backgroundColor:
                            testMode === 'practice'
                              ? isDark
                                ? '#1E293B'
                                : '#DBEAFE'
                              : isDark
                              ? '#1C2237'
                              : '#F1F5F9',
                        },
                      ]}>
                      <BookOpenCheck
                        size={16}
                        color={
                          testMode === 'practice'
                            ? theme.textPrimary
                            : theme.textSecondary
                        }
                      />
                    </View>
                    {testMode === 'practice' && (
                      <View
                        style={[
                          styles.radioCheckBadge,
                          { backgroundColor: theme.buttonPrimaryBg },
                        ]}>
                        <Check size={11} color={theme.buttonPrimaryText} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.formatOptionTitle,
                      { color: theme.textPrimary },
                    ]}>
                    Practice Mode
                  </Text>
                  <Text
                    style={[
                      styles.formatOptionDesc,
                      { color: theme.textSecondary },
                    ]}>
                    Instant solution & explanation after each answer
                  </Text>
                </Pressable>

                {/* Timed Mode Card */}
                <Pressable
                  onPress={() => setTestMode('full')}
                  style={[
                    styles.formatOption,
                    testMode === 'full' && {
                      backgroundColor: theme.activeBg,
                      borderColor: theme.cardBorderActive,
                    },
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    },
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                  ]}>
                  <View style={styles.formatTopRow}>
                    <View
                      style={[
                        styles.formatIconBox,
                        {
                          backgroundColor:
                            testMode === 'full'
                              ? isDark
                                ? '#1E293B'
                                : '#DBEAFE'
                              : isDark
                              ? '#1C2237'
                              : '#F1F5F9',
                        },
                      ]}>
                      <Clock
                        size={16}
                        color={
                          testMode === 'full'
                            ? theme.textPrimary
                            : theme.textSecondary
                        }
                      />
                    </View>
                    {testMode === 'full' && (
                      <View
                        style={[
                          styles.radioCheckBadge,
                          { backgroundColor: theme.buttonPrimaryBg },
                        ]}>
                        <Check size={11} color={theme.buttonPrimaryText} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.formatOptionTitle,
                      { color: theme.textPrimary },
                    ]}>
                    Timed Mode
                  </Text>
                  <Text
                    style={[
                      styles.formatOptionDesc,
                      { color: theme.textSecondary },
                    ]}>
                    Standard timer with UPSC negative marking
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Progressive Disclosure: Optional Subject/Topic Filter */}
            <View
              style={[
                styles.accordionCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              ]}>
              <Pressable
                onPress={() => setShowMoreFilters(!showMoreFilters)}
                style={styles.accordionHeader}
                accessibilityRole="button"
                accessibilityLabel="Toggle optional subject filters">
                <View style={styles.accordionHeaderLeft}>
                  <SlidersHorizontal size={14} color={theme.textSecondary} />
                  <Text
                    style={[
                      styles.accordionTitle,
                      { color: theme.textSecondary },
                    ]}>
                    {selectedSubject
                      ? `Filter: ${selectedSubject}`
                      : 'Subject & Topic Filters (Optional)'}
                  </Text>
                </View>
                {showMoreFilters ? (
                  <ChevronUp size={15} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={15} color={theme.textSecondary} />
                )}
              </Pressable>

              {showMoreFilters && (
                <View
                  style={[
                    styles.accordionBody,
                    { borderTopColor: theme.divider },
                  ]}>
                  <Text
                    style={[
                      styles.subFilterLabel,
                      { color: theme.textSecondary },
                    ]}>
                    Filter by Subject:
                  </Text>
                  <View style={styles.chipsRow}>
                    <Pressable
                      onPress={() => {
                        setSelectedSubject('');
                        setSelectedTopic('');
                      }}
                      style={[
                        styles.miniChip,
                        !selectedSubject && {
                          backgroundColor: theme.buttonPrimaryBg,
                        },
                        {
                          backgroundColor: !selectedSubject
                            ? theme.buttonPrimaryBg
                            : theme.activeBg,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.miniChipText,
                          {
                            color: !selectedSubject
                              ? theme.buttonPrimaryText
                              : theme.textSecondary,
                          },
                        ]}>
                        All Subjects
                      </Text>
                    </Pressable>
                    {filtersData.subjects.slice(0, 10).map((sub) => {
                      const isSubSelected = selectedSubject === sub.name;
                      return (
                        <Pressable
                          key={sub.name}
                          onPress={() => {
                            setSelectedSubject(
                              isSubSelected ? '' : sub.name
                            );
                            setSelectedTopic('');
                          }}
                          style={[
                            styles.miniChip,
                            isSubSelected && {
                              backgroundColor: theme.buttonPrimaryBg,
                            },
                            {
                              backgroundColor: isSubSelected
                                ? theme.buttonPrimaryBg
                                : theme.activeBg,
                              borderColor: theme.cardBorder,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.miniChipText,
                              {
                                color: isSubSelected
                                  ? theme.buttonPrimaryText
                                  : theme.textPrimary,
                              },
                            ]}>
                            {sub.name} ({sub.count})
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- MODE B: SUBJECT-WISE PRACTICE WITH SEARCH BAR --- */}
        {activeTestType === 'subject' && (
          <View style={styles.configCardWrapper}>
            {/* Subject Selector & Search Bar */}
            <View style={styles.configSection}>
              <View style={styles.subjectHeaderRow}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  SELECT SUBJECT
                </Text>
                <Text style={[styles.subjectCountBadge, { color: theme.textMuted }]}>
                  {filteredSubjects.length} of {filtersData.subjects.length} subjects
                </Text>
              </View>

              {/* SEARCH BAR */}
              <View
                style={[
                  styles.searchBarBox,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Search size={16} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder={`Search ${paperType === 'CSAT' ? 'CSAT' : 'GS'} subjects (e.g. Polity, Economy)...`}
                  placeholderTextColor={theme.textMuted}
                  value={subjectSearchQuery}
                  onChangeText={setSubjectSearchQuery}
                  autoCorrect={false}
                />
                {subjectSearchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSubjectSearchQuery('')}
                    hitSlop={8}
                    style={styles.searchClearBtn}>
                    <X size={14} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>

              {loadingFilters ? (
                <ActivityIndicator size="small" color={theme.textPrimary} style={{ marginVertical: 20 }} />
              ) : filteredSubjects.length === 0 ? (
                <View
                  style={[
                    styles.noSubjectMatchBox,
                    { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                  ]}>
                  <Text style={[styles.noSubjectMatchText, { color: theme.textSecondary }]}>
                    No subjects match &ldquo;{subjectSearchQuery}&rdquo;
                  </Text>
                  <Pressable
                    onPress={() => setSubjectSearchQuery('')}
                    style={[styles.clearFilterLink, { backgroundColor: theme.activeBg }]}>
                    <Text style={[styles.clearFilterLinkText, { color: theme.textPrimary }]}>
                      Clear Search
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.subjectGrid}>
                  {filteredSubjects.map((sub) => {
                    const isSelected = selectedSubject === sub.name;
                    return (
                      <Pressable
                        key={sub.name}
                        onPress={() => {
                          setSelectedSubject(sub.name);
                          setSelectedTopic('');
                        }}
                        style={[
                          styles.subjectTile,
                          isSelected && {
                            borderColor: theme.cardBorderActive,
                            backgroundColor: theme.activeBg,
                          },
                          {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.cardBorder,
                          },
                          Platform.OS === 'web' &&
                            ({ cursor: 'pointer' } as object),
                        ]}>
                        <View style={styles.subjectTileLeft}>
                          <Text
                            style={[
                              styles.subjectTileTitle,
                              { color: theme.textPrimary },
                            ]}
                            numberOfLines={1}>
                            {sub.name}
                          </Text>
                          <Text
                            style={[
                              styles.subjectTileCount,
                              { color: theme.textSecondary },
                            ]}>
                            {sub.count} Questions Available
                          </Text>
                        </View>
                        {isSelected && (
                          <View
                            style={[
                              styles.subjectSelectedCheck,
                              { backgroundColor: theme.buttonPrimaryBg },
                            ]}>
                            <Check size={12} color={theme.buttonPrimaryText} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Topic Filter (Dynamically filtered by selected subject) */}
            {availableTopics.length > 0 && (
              <View style={styles.configSection}>
                <Text
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  TOPIC (OPTIONAL)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalChipsRow}>
                  <Pressable
                    onPress={() => setSelectedTopic('')}
                    style={[
                      styles.chip,
                      !selectedTopic && {
                        backgroundColor: theme.buttonPrimaryBg,
                        borderColor: theme.buttonPrimaryBg,
                      },
                      {
                        backgroundColor: !selectedTopic
                          ? theme.buttonPrimaryBg
                          : theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: !selectedTopic
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                        },
                      ]}>
                      All Topics
                    </Text>
                  </Pressable>

                  {availableTopics.map((top) => {
                    const isTopSelected = selectedTopic === top;
                    return (
                      <Pressable
                        key={top}
                        onPress={() =>
                          setSelectedTopic(isTopSelected ? '' : top)
                        }
                        style={[
                          styles.chip,
                          isTopSelected && {
                            backgroundColor: theme.buttonPrimaryBg,
                            borderColor: theme.buttonPrimaryBg,
                          },
                          {
                            backgroundColor: isTopSelected
                              ? theme.buttonPrimaryBg
                              : theme.cardBg,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isTopSelected
                                ? theme.buttonPrimaryText
                                : theme.textPrimary,
                            },
                          ]}>
                          {top}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Optional Year Filter under Progressive Disclosure */}
            <View
              style={[
                styles.accordionCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              ]}>
              <Pressable
                onPress={() => setShowMoreFilters(!showMoreFilters)}
                style={styles.accordionHeader}>
                <View style={styles.accordionHeaderLeft}>
                  <SlidersHorizontal size={14} color={theme.textSecondary} />
                  <Text
                    style={[
                      styles.accordionTitle,
                      { color: theme.textSecondary },
                    ]}>
                    {selectedYear !== 'all'
                      ? `Year Filter: ${selectedYear}`
                      : 'Year Filter (Optional)'}
                  </Text>
                </View>
                {showMoreFilters ? (
                  <ChevronUp size={15} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={15} color={theme.textSecondary} />
                )}
              </Pressable>

              {showMoreFilters && (
                <View
                  style={[
                    styles.accordionBody,
                    { borderTopColor: theme.divider },
                  ]}>
                  <View style={styles.chipsRow}>
                    <Pressable
                      onPress={() => setSelectedYear('all')}
                      style={[
                        styles.miniChip,
                        selectedYear === 'all' && {
                          backgroundColor: theme.buttonPrimaryBg,
                        },
                        {
                          backgroundColor:
                            selectedYear === 'all'
                              ? theme.buttonPrimaryBg
                              : theme.activeBg,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.miniChipText,
                          {
                            color:
                              selectedYear === 'all'
                                ? theme.buttonPrimaryText
                                : theme.textSecondary,
                          },
                        ]}>
                        All Years
                      </Text>
                    </Pressable>
                    {filtersData.years.map((yr) => {
                      const isYrSelected = selectedYear === yr;
                      return (
                        <Pressable
                          key={yr}
                          onPress={() => setSelectedYear(yr)}
                          style={[
                            styles.miniChip,
                            isYrSelected && {
                              backgroundColor: theme.buttonPrimaryBg,
                            },
                            {
                              backgroundColor: isYrSelected
                                ? theme.buttonPrimaryBg
                                : theme.activeBg,
                              borderColor: theme.cardBorder,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.miniChipText,
                              {
                                color: isYrSelected
                                  ? theme.buttonPrimaryText
                                  : theme.textPrimary,
                              },
                            ]}>
                            {yr}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- MODE C: FULL MOCK TEST --- */}
        {activeTestType === 'full_mock' && (
          <View style={styles.configCardWrapper}>
            {/* Examination Paper Presets */}
            <View style={styles.configSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                OFFICIAL FULL-PAPER PRESET
              </Text>
              <View style={styles.fullPaperPresetsRow}>
                {[
                  {
                    id: 'pool' as const,
                    title: 'Comprehensive Mock',
                    desc: `${
                      paperType === 'CSAT' ? '80' : '100'
                    } questions sampled across all available years (${filtersData.years[filtersData.years.length - 1] || 2016}–${filtersData.years[0] || 2026})`,
                  },
                  ...filtersData.years.map((yr) => ({
                    id: yr,
                    title: `Official ${yr} Paper`,
                    desc: `Complete ${
                      paperType === 'CSAT' ? '80' : '100'
                    } Qs Prelims Examination`,
                  })),
                ].map((preset) => {
                  const isPresetActive = fullMockPreset === preset.id;
                  return (
                    <Pressable
                      key={String(preset.id)}
                      onPress={() => setFullMockPreset(preset.id)}
                      style={[
                        styles.fullPaperCard,
                        isPresetActive && {
                          borderColor: theme.cardBorderActive,
                          backgroundColor: theme.activeBg,
                        },
                        {
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        },
                        Platform.OS === 'web' &&
                          ({ cursor: 'pointer' } as object),
                      ]}>
                      <View style={styles.fullPaperHeader}>
                        <Text
                          style={[
                            styles.fullPaperTitle,
                            { color: theme.textPrimary },
                          ]}>
                          {preset.title}
                        </Text>
                        <View
                          style={[
                            styles.presetBadge,
                            { backgroundColor: theme.cardBg },
                          ]}>
                          <Text
                            style={[
                              styles.presetBadgeText,
                              { color: theme.textSecondary },
                            ]}>
                            {paperType === 'CSAT' ? '80 Qs · 120m' : '100 Qs · 120m'}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.fullPaperDesc,
                          { color: theme.textSecondary },
                        ]}>
                        {preset.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Official Marking Rules Callout */}
            <View
              style={[
                styles.officialRulesBox,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              ]}>
              <View style={styles.rulesRow}>
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleLabel, { color: theme.textMuted }]}>
                    QUESTIONS
                  </Text>
                  <Text style={[styles.ruleVal, { color: theme.textPrimary }]}>
                    {paperType === 'CSAT' ? '80' : '100'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ruleDivider,
                    { backgroundColor: theme.cardBorder },
                  ]}
                />
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleLabel, { color: theme.textMuted }]}>
                    TIME LIMIT
                  </Text>
                  <Text style={[styles.ruleVal, { color: theme.textPrimary }]}>
                    120 Mins
                  </Text>
                </View>
                <View
                  style={[
                    styles.ruleDivider,
                    { backgroundColor: theme.cardBorder },
                  ]}
                />
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleLabel, { color: theme.textMuted }]}>
                    TOTAL MARKS
                  </Text>
                  <Text style={[styles.ruleVal, { color: theme.textPrimary }]}>
                    200.0
                  </Text>
                </View>
                <View
                  style={[
                    styles.ruleDivider,
                    { backgroundColor: theme.cardBorder },
                  ]}
                />
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleLabel, { color: theme.textMuted }]}>
                    NEGATIVE
                  </Text>
                  <Text style={[styles.ruleVal, { color: '#EF4444' }]}>
                    {paperType === 'CSAT' ? '-0.83' : '-0.66'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Question Order & Mode Options */}
            <View style={styles.configSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                QUESTION ORDER
              </Text>
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => setOrderMode('exam_order')}
                  style={[
                    styles.chip,
                    orderMode === 'exam_order' && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                    {
                      backgroundColor:
                        orderMode === 'exam_order'
                          ? theme.buttonPrimaryBg
                          : theme.cardBg,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          orderMode === 'exam_order'
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                      },
                    ]}>
                    Official Exam Order (1 to {paperType === 'CSAT' ? 80 : 100})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setOrderMode('random')}
                  style={[
                    styles.chip,
                    orderMode === 'random' && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                    {
                      backgroundColor:
                        orderMode === 'random'
                          ? theme.buttonPrimaryBg
                          : theme.cardBg,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          orderMode === 'random'
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                      },
                    ]}>
                    Shuffled Order
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* 5. Number of Questions (Only for PYQ & Subject-wise modes) */}
        {activeTestType !== 'full_mock' && (
          <View style={styles.configSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              NUMBER OF QUESTIONS
            </Text>
            <View style={styles.chipsRow}>
              {countPresets.map((preset) => {
                const isSelected = !isCustomCount && questionCount === preset;
                const isSupported = matchingCount >= preset || matchingCount === 0;

                return (
                  <Pressable
                    key={preset}
                    onPress={() => handleSelectCountPreset(preset)}
                    disabled={!isSupported}
                    style={[
                      styles.countChip,
                      isSelected && {
                        backgroundColor: theme.buttonPrimaryBg,
                        borderColor: theme.buttonPrimaryBg,
                      },
                      !isSupported && {
                        opacity: 0.35,
                      },
                      {
                        backgroundColor: isSelected
                          ? theme.buttonPrimaryBg
                          : theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                      Platform.OS === 'web' &&
                        isSupported &&
                        ({ cursor: 'pointer' } as object),
                    ]}>
                    <Text
                      style={[
                        styles.countChipText,
                        {
                          color: isSelected
                            ? theme.buttonPrimaryText
                            : theme.textPrimary,
                        },
                      ]}>
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setIsCustomCount(true)}
                style={[
                  styles.countChip,
                  isCustomCount && {
                    backgroundColor: theme.buttonPrimaryBg,
                    borderColor: theme.buttonPrimaryBg,
                  },
                  {
                    backgroundColor: isCustomCount
                      ? theme.buttonPrimaryBg
                      : theme.cardBg,
                    borderColor: theme.cardBorder,
                  },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                ]}>
                <Text
                  style={[
                    styles.countChipText,
                    {
                      color: isCustomCount
                        ? theme.buttonPrimaryText
                        : theme.textPrimary,
                    },
                  ]}>
                  Custom
                </Text>
              </Pressable>
            </View>

            {/* Custom Count Input */}
            {isCustomCount && (
              <View
                style={[
                  styles.customCountBox,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}>
                <Text
                  style={[
                    styles.customCountLabel,
                    { color: theme.textSecondary },
                  ]}>
                  Enter question count (1 to {matchingCount || 100}):
                </Text>
                <TextInput
                  style={[
                    styles.customCountInput,
                    { color: theme.textPrimary, borderColor: theme.cardBorder },
                  ]}
                  keyboardType="numeric"
                  placeholder="e.g. 15"
                  placeholderTextColor={theme.textMuted}
                  value={customCountInput}
                  onChangeText={handleCustomCountSubmit}
                />
              </View>
            )}
          </View>
        )}

        {/* 6. Live Availability & Validation Feedback */}
        <View style={styles.availabilityRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  matchingCount > 0 ? '#10B981' : isCounting ? '#F59E0B' : '#EF4444',
              },
            ]}
          />
          <Text
            style={[styles.availabilityText, { color: theme.textSecondary }]}>
            {isCounting
              ? 'Checking real question bank availability...'
              : matchingCount > 0
              ? `${matchingCount} questions match this configuration`
              : 'No questions match these filters'}
          </Text>
        </View>

        {isCountExceeded && (
          <View
            style={[
              styles.warningCallout,
              {
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              },
            ]}>
            <AlertCircle size={14} color="#F59E0B" />
            <Text style={[styles.warningText, { color: '#F59E0B' }]}>
              Requested {questionCount} questions, but only {matchingCount} are
              available.
            </Text>
            <Pressable
              onPress={() => {
                setQuestionCount(matchingCount);
                setIsCustomCount(false);
              }}
              hitSlop={6}
              style={styles.adjustBtn}>
              <Text style={styles.adjustBtnText}>Adjust to {matchingCount}</Text>
            </Pressable>
          </View>
        )}

        {/* 7. Bottom Action Area (Prominent primary button with dynamic summary) */}
        <View
          style={[
            styles.actionArea,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}>
          <Text
            style={[styles.summarySentence, { color: theme.textSecondary }]}
            numberOfLines={2}>
            {dynamicSummary}
          </Text>

          <Pressable
            onPress={handleStartTest}
            disabled={isStartDisabled}
            accessibilityRole="button"
            accessibilityLabel="Start Test"
            style={[
              styles.primaryStartBtn,
              {
                backgroundColor: isStartDisabled
                  ? theme.divider
                  : theme.buttonPrimaryBg,
              },
              Platform.OS === 'web' &&
                !isStartDisabled &&
                ({ cursor: 'pointer' } as object),
            ]}>
            {isGenerating ? (
              <ActivityIndicator
                size="small"
                color={theme.buttonPrimaryText}
              />
            ) : (
              <View style={styles.primaryBtnContent}>
                <Text
                  style={[
                    styles.primaryBtnText,
                    {
                      color: isStartDisabled
                        ? theme.textMuted
                        : theme.buttonPrimaryText,
                    },
                  ]}>
                  Start Test
                </Text>
                <ArrowRight
                  size={16}
                  color={
                    isStartDisabled
                      ? theme.textMuted
                      : theme.buttonPrimaryText
                  }
                />
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 56,
  },
  desktopContainer: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  mainSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
  },
  historyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  historyCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeTabTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  modeTabDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  configSection: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paperSwitchRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  paperSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 7,
  },
  paperSwitchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  paperSwitchBadge: {
    fontSize: 10,
    fontWeight: '600',
  },
  configCardWrapper: {
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formatToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  formatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formatIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  formatOptionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  accordionCard: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  accordionBody: {
    borderTopWidth: 1,
    padding: 12,
  },
  subFilterLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  miniChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectCountBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  noSubjectMatchBox: {
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  noSubjectMatchText: {
    fontSize: 13,
    textAlign: 'center',
  },
  clearFilterLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearFilterLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectGrid: {
    gap: 8,
  },
  subjectTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  subjectTileLeft: {
    flex: 1,
  },
  subjectTileTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subjectTileCount: {
    fontSize: 11,
  },
  subjectSelectedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  fullPaperPresetsRow: {
    gap: 10,
  },
  fullPaperCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  fullPaperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fullPaperTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  presetBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fullPaperDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  officialRulesBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  ruleItem: {
    alignItems: 'center',
  },
  ruleLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ruleVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  ruleDivider: {
    width: 1,
    height: 22,
  },
  countChip: {
    minWidth: 54,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  customCountBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customCountLabel: {
    fontSize: 12,
    flex: 1,
  },
  customCountInput: {
    width: 70,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  warningCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  adjustBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  adjustBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  actionArea: {
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  summarySentence: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  primaryStartBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
