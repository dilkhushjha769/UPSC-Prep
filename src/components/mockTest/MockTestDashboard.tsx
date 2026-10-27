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
  History,
  Check,
  ChevronRight,
  ArrowRight,
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
import { SubjectTopicPickerModal } from './SubjectTopicPickerModal';

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

  // Subject & Topic picker modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);

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
  const [selectedTopic, setSelectedTopic] = useState<string>(''); // For topic drill-down
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>('practice');
  const [orderMode, setOrderMode] = useState<QuestionOrderMode>('random');

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
    setSelectedSubject('');
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
              Mock Tests
            </Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Practice PYQs. Improve your accuracy.
            </Text>
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
                    backgroundColor: isDark ? '#1a1e26' : '#f1f3f5',
                    borderColor: isDark ? '#2a313d' : '#e5e7eb',
                  },
                ]}>
                {isDark ? (
                  <Sun size={15} color="#fbbf24" strokeWidth={2} />
                ) : (
                  <Moon size={15} color="#4b5563" strokeWidth={2} />
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
                  backgroundColor: isDark ? '#1a1e26' : '#f1f3f5',
                  borderColor: isDark ? '#2a313d' : '#e5e7eb',
                },
              ]}>
              <History size={14} color={theme.textPrimary} strokeWidth={2} />
              <Text style={[styles.historyButtonText, { color: theme.textPrimary }]}>
                History
              </Text>
              {completedTestsCount > 0 && (
                <View
                  style={[
                    styles.historyBadge,
                    { backgroundColor: isDark ? '#2a313d' : '#e5e7eb' },
                  ]}>
                  <Text
                    style={[styles.historyBadgeText, { color: theme.textPrimary }]}>
                    {completedTestsCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* 1. Test Type Segmented Control */}
        <View
          style={[
            styles.segmentContainer,
            { backgroundColor: isDark ? '#14171e' : '#f3f4f6' },
          ]}>
          {(['pyq', 'subject', 'full_mock'] as MainTestType[]).map((type) => {
            const isActive = activeTestType === type;
            const label =
              type === 'pyq'
                ? 'PYQs'
                : type === 'subject'
                ? 'Subject-wise'
                : 'Full Mock';

            return (
              <Pressable
                key={type}
                onPress={() => handleTestTypeChange(type)}
                style={[
                  styles.segmentTab,
                  isActive && [
                    styles.segmentTabActive,
                    {
                      backgroundColor: isDark ? '#222834' : '#ffffff',
                      borderColor: isDark ? '#323b4c' : '#e5e7eb',
                    },
                  ],
                ]}>
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: isActive ? theme.textPrimary : theme.textSecondary,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 2. Examination Paper Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            EXAMINATION PAPER
          </Text>
          <View style={styles.paperRow}>
            {(['GS1', 'CSAT'] as PaperType[]).map((paper) => {
              const isSelected = paperType === paper;
              const title = paper === 'GS1' ? 'GS Paper I' : 'CSAT Paper II';
              const subtitle =
                paper === 'GS1'
                  ? 'General Studies · 100 Qs'
                  : 'Aptitude & English · 80 Qs';
              const marks =
                paper === 'GS1' ? '+2.0 / -0.66' : '+2.5 / -0.83';

              return (
                <Pressable
                  key={paper}
                  onPress={() => handlePaperTypeChange(paper)}
                  style={[
                    styles.paperCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1c222c'
                          : '#f9fafb'
                        : isDark
                        ? '#14171e'
                        : '#ffffff',
                      borderColor: isSelected
                        ? isDark
                          ? '#4b5563'
                          : '#111827'
                        : isDark
                        ? '#222834'
                        : '#e5e7eb',
                    },
                  ]}>
                  <View style={styles.paperCardHeader}>
                    <Text
                      style={[
                        styles.paperCardTitle,
                        {
                          color: isSelected
                            ? theme.textPrimary
                            : theme.textSecondary,
                        },
                      ]}>
                      {title}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.checkIndicator,
                          {
                            backgroundColor: isDark ? '#ffffff' : '#111827',
                          },
                        ]}>
                        <Check
                          size={11}
                          color={isDark ? '#111827' : '#ffffff'}
                          strokeWidth={2.5}
                        />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.paperCardSub, { color: theme.textSecondary }]}>
                    {subtitle}
                  </Text>
                  <Text
                    style={[styles.paperCardMarks, { color: theme.textSecondary }]}>
                    {marks}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Conditional Configuration: PYQs */}
        {activeTestType === 'pyq' && (
          <>
            {/* Examination Year */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  EXAMINATION YEAR
                </Text>
                {selectedYear !== 'all' && (
                  <Pressable
                    onPress={() => setSelectedYear('all')}
                    hitSlop={8}>
                    <Text
                      style={[
                        styles.sectionActionText,
                        { color: theme.textSecondary },
                      ]}>
                      Reset to all
                    </Text>
                  </Pressable>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsScroll}>
                <Pressable
                  onPress={() => setSelectedYear('all')}
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        selectedYear === 'all'
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#181c24'
                          : '#f3f4f6',
                      borderColor:
                        selectedYear === 'all'
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#2a313d'
                          : '#e5e7eb',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color:
                          selectedYear === 'all'
                            ? isDark
                              ? '#111827'
                              : '#ffffff'
                            : theme.textPrimary,
                        fontWeight: selectedYear === 'all' ? '600' : '400',
                      },
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
                        styles.pill,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#f3f4f6'
                              : '#111827'
                            : isDark
                            ? '#181c24'
                            : '#f3f4f6',
                          borderColor: isSelected
                            ? isDark
                              ? '#f3f4f6'
                              : '#111827'
                            : isDark
                            ? '#2a313d'
                            : '#e5e7eb',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isSelected
                              ? isDark
                                ? '#111827'
                                : '#ffffff'
                              : theme.textPrimary,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}>
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Subject Filter (Optional) */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                SUBJECT FILTER (OPTIONAL)
              </Text>
              <Pressable
                onPress={() => setShowSubjectModal(true)}
                style={[
                  styles.filterRow,
                  {
                    backgroundColor: isDark ? '#14171e' : '#ffffff',
                    borderColor: isDark ? '#222834' : '#e5e7eb',
                  },
                ]}>
                <View style={styles.filterRowTextGroup}>
                  <Text
                    style={[
                      styles.filterRowTitle,
                      {
                        color: selectedSubject
                          ? theme.textPrimary
                          : theme.textSecondary,
                        fontWeight: selectedSubject ? '600' : '400',
                      },
                    ]}>
                    {selectedSubject
                      ? selectedTopic
                        ? `${selectedSubject} · ${selectedTopic}`
                        : selectedSubject
                      : 'All subjects included'}
                  </Text>
                  <Text
                    style={[
                      styles.filterRowSub,
                      { color: theme.textSecondary },
                    ]}>
                    {selectedSubject
                      ? 'Filtered by subject & topic'
                      : 'Tap to filter questions by subject'}
                  </Text>
                </View>

                <View style={styles.filterRowActions}>
                  {selectedSubject ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedSubject('');
                        setSelectedTopic('');
                      }}
                      hitSlop={8}
                      style={[
                        styles.clearFilterBtn,
                        { backgroundColor: isDark ? '#222834' : '#e5e7eb' },
                      ]}>
                      <X size={12} color={theme.textPrimary} />
                    </Pressable>
                  ) : null}
                  <ChevronRight size={16} color={theme.textSecondary} />
                </View>
              </Pressable>
            </View>
          </>
        )}

        {/* 3. Conditional Configuration: Subject-wise */}
        {activeTestType === 'subject' && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              SUBJECT & TOPIC
            </Text>
            <Pressable
              onPress={() => setShowSubjectModal(true)}
              style={[
                styles.filterRow,
                {
                  backgroundColor: isDark ? '#14171e' : '#ffffff',
                  borderColor: selectedSubject
                    ? isDark
                      ? '#4b5563'
                      : '#111827'
                    : isDark
                    ? '#222834'
                    : '#e5e7eb',
                },
              ]}>
              <View style={styles.filterRowTextGroup}>
                <Text
                  style={[
                    styles.filterRowTitle,
                    {
                      color: selectedSubject
                        ? theme.textPrimary
                        : theme.textSecondary,
                      fontWeight: selectedSubject ? '600' : '400',
                    },
                  ]}>
                  {selectedSubject || 'Select a subject'}
                </Text>
                <Text
                  style={[
                    styles.filterRowSub,
                    { color: theme.textSecondary },
                  ]}>
                  {selectedTopic
                    ? `Topic: ${selectedTopic}`
                    : selectedSubject
                    ? 'All topics included in this subject'
                    : 'Tap to select a syllabus subject'}
                </Text>
              </View>

              <ChevronRight size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* 3. Conditional Configuration: Full Mock */}
        {activeTestType === 'full_mock' && (
          <>
            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                MOCK PAPER PRESET
              </Text>
              <View style={styles.presetGrid}>
                <Pressable
                  onPress={() => setFullMockPreset('pool')}
                  style={[
                    styles.presetTile,
                    {
                      backgroundColor:
                        fullMockPreset === 'pool'
                          ? isDark
                            ? '#1c222c'
                            : '#f9fafb'
                          : isDark
                          ? '#14171e'
                          : '#ffffff',
                      borderColor:
                        fullMockPreset === 'pool'
                          ? isDark
                            ? '#4b5563'
                            : '#111827'
                          : isDark
                          ? '#222834'
                          : '#e5e7eb',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.presetTileTitle,
                      {
                        color:
                          fullMockPreset === 'pool'
                            ? theme.textPrimary
                            : theme.textSecondary,
                        fontWeight:
                          fullMockPreset === 'pool' ? '600' : '500',
                      },
                    ]}>
                    Comprehensive Question Pool
                  </Text>
                  <Text
                    style={[
                      styles.presetTileSub,
                      { color: theme.textSecondary },
                    ]}>
                    Balanced distribution across all years
                  </Text>
                </Pressable>

                {filtersData.years.slice(0, 3).map((yr) => {
                  const isSelected = fullMockPreset === yr;
                  return (
                    <Pressable
                      key={yr}
                      onPress={() => setFullMockPreset(yr)}
                      style={[
                        styles.presetTile,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#1c222c'
                              : '#f9fafb'
                            : isDark
                            ? '#14171e'
                            : '#ffffff',
                          borderColor: isSelected
                            ? isDark
                              ? '#4b5563'
                              : '#111827'
                            : isDark
                            ? '#222834'
                            : '#e5e7eb',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.presetTileTitle,
                          {
                            color: isSelected
                              ? theme.textPrimary
                              : theme.textSecondary,
                            fontWeight: isSelected ? '600' : '500',
                          },
                        ]}>
                        Official {yr} Paper
                      </Text>
                      <Text
                        style={[
                          styles.presetTileSub,
                          { color: theme.textSecondary },
                        ]}>
                        Actual exam question set
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Exam specifications notice */}
            <View
              style={[
                styles.specNotice,
                {
                  backgroundColor: isDark ? '#14171e' : '#f9fafb',
                  borderColor: isDark ? '#222834' : '#e5e7eb',
                },
              ]}>
              <Text
                style={[styles.specNoticeText, { color: theme.textSecondary }]}>
                {paperType === 'GS1'
                  ? '100 Questions · 120 Minutes · 200 Marks (+2.0 / -0.66)'
                  : '80 Questions · 120 Minutes · 200 Marks (+2.5 / -0.83)'}
              </Text>
            </View>

            {/* Question Order */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                QUESTION ORDER
              </Text>
              <View style={styles.orderRow}>
                <Pressable
                  onPress={() => setOrderMode('exam_order')}
                  style={[
                    styles.orderOption,
                    {
                      backgroundColor:
                        orderMode === 'exam_order'
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#14171e'
                          : '#ffffff',
                      borderColor:
                        orderMode === 'exam_order'
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#222834'
                          : '#e5e7eb',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.orderOptionText,
                      {
                        color:
                          orderMode === 'exam_order'
                            ? isDark
                              ? '#111827'
                              : '#ffffff'
                            : theme.textPrimary,
                        fontWeight: orderMode === 'exam_order' ? '600' : '400',
                      },
                    ]}>
                    Official Exam Order
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setOrderMode('random')}
                  style={[
                    styles.orderOption,
                    {
                      backgroundColor:
                        orderMode === 'random'
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#14171e'
                          : '#ffffff',
                      borderColor:
                        orderMode === 'random'
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#222834'
                          : '#e5e7eb',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.orderOptionText,
                      {
                        color:
                          orderMode === 'random'
                            ? isDark
                              ? '#111827'
                              : '#ffffff'
                            : theme.textPrimary,
                        fontWeight: orderMode === 'random' ? '600' : '400',
                      },
                    ]}>
                    Shuffled Order
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* 4. Test Format (for PYQ & Subject-wise) */}
        {activeTestType !== 'full_mock' && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              TEST FORMAT
            </Text>
            <View style={styles.formatGroup}>
              {/* Practice Mode */}
              <Pressable
                onPress={() => {
                  setTestMode('practice');
                  savePreferences(activeTestType, paperType, questionCount, 'practice');
                }}
                style={[
                  styles.formatRow,
                  {
                    backgroundColor:
                      testMode === 'practice'
                        ? isDark
                          ? '#1c222c'
                          : '#f9fafb'
                        : isDark
                        ? '#14171e'
                        : '#ffffff',
                    borderColor:
                      testMode === 'practice'
                        ? isDark
                          ? '#4b5563'
                          : '#111827'
                        : isDark
                        ? '#222834'
                        : '#e5e7eb',
                  },
                ]}>
                <View
                  style={[
                    styles.radioIndicator,
                    {
                      borderColor:
                        testMode === 'practice'
                          ? isDark
                            ? '#ffffff'
                            : '#111827'
                          : isDark
                          ? '#4b5563'
                          : '#d1d5db',
                    },
                  ]}>
                  {testMode === 'practice' && (
                    <View
                      style={[
                        styles.radioDot,
                        {
                          backgroundColor: isDark ? '#ffffff' : '#111827',
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.formatTextGroup}>
                  <Text
                    style={[
                      styles.formatTitle,
                      {
                        color:
                          testMode === 'practice'
                            ? theme.textPrimary
                            : theme.textSecondary,
                        fontWeight:
                          testMode === 'practice' ? '600' : '500',
                      },
                    ]}>
                    Practice Mode
                  </Text>
                  <Text
                    style={[
                      styles.formatSub,
                      { color: theme.textSecondary },
                    ]}>
                    View answers and explanations while learning.
                  </Text>
                </View>
              </Pressable>

              {/* Timed Mode */}
              <Pressable
                onPress={() => {
                  setTestMode('full');
                  savePreferences(activeTestType, paperType, questionCount, 'full');
                }}
                style={[
                  styles.formatRow,
                  {
                    backgroundColor:
                      testMode === 'full'
                        ? isDark
                          ? '#1c222c'
                          : '#f9fafb'
                        : isDark
                        ? '#14171e'
                        : '#ffffff',
                    borderColor:
                      testMode === 'full'
                        ? isDark
                          ? '#4b5563'
                          : '#111827'
                        : isDark
                        ? '#222834'
                        : '#e5e7eb',
                  },
                ]}>
                <View
                  style={[
                    styles.radioIndicator,
                    {
                      borderColor:
                        testMode === 'full'
                          ? isDark
                            ? '#ffffff'
                            : '#111827'
                          : isDark
                          ? '#4b5563'
                          : '#d1d5db',
                    },
                  ]}>
                  {testMode === 'full' && (
                    <View
                      style={[
                        styles.radioDot,
                        {
                          backgroundColor: isDark ? '#ffffff' : '#111827',
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.formatTextGroup}>
                  <Text
                    style={[
                      styles.formatTitle,
                      {
                        color:
                          testMode === 'full'
                            ? theme.textPrimary
                            : theme.textSecondary,
                        fontWeight: testMode === 'full' ? '600' : '500',
                      },
                    ]}>
                    Timed Mode
                  </Text>
                  <Text
                    style={[
                      styles.formatSub,
                      { color: theme.textSecondary },
                    ]}>
                    Simulate exam conditions with a countdown.
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* 5. Number of Questions (for PYQ & Subject-wise) */}
        {activeTestType !== 'full_mock' && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              NUMBER OF QUESTIONS
            </Text>
            <View style={styles.countRow}>
              {countPresets.map((preset) => {
                const isSelected = !isCustomCount && questionCount === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => handleSelectCountPreset(preset)}
                    style={[
                      styles.countPill,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#181c24'
                          : '#f3f4f6',
                        borderColor: isSelected
                          ? isDark
                            ? '#f3f4f6'
                            : '#111827'
                          : isDark
                          ? '#2a313d'
                          : '#e5e7eb',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.countPillText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#111827'
                              : '#ffffff'
                            : theme.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
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
                  styles.countPill,
                  {
                    backgroundColor: isCustomCount
                      ? isDark
                        ? '#f3f4f6'
                        : '#111827'
                      : isDark
                      ? '#181c24'
                      : '#f3f4f6',
                    borderColor: isCustomCount
                      ? isDark
                        ? '#f3f4f6'
                        : '#111827'
                      : isDark
                      ? '#2a313d'
                      : '#e5e7eb',
                  },
                ]}>
                <Text
                  style={[
                    styles.countPillText,
                    {
                      color: isCustomCount
                        ? isDark
                          ? '#111827'
                          : '#ffffff'
                        : theme.textPrimary,
                      fontWeight: isCustomCount ? '600' : '400',
                    },
                  ]}>
                  Custom
                </Text>
              </Pressable>
            </View>

            {isCustomCount && (
              <View style={styles.customInputRow}>
                <TextInput
                  value={customCountInput}
                  onChangeText={handleCustomCountSubmit}
                  placeholder={`Enter 1 - ${matchingCount || 100}`}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: isDark ? '#14171e' : '#ffffff',
                      color: theme.textPrimary,
                      borderColor: isDark ? '#2a313d' : '#e5e7eb',
                    },
                  ]}
                />
              </View>
            )}

            {isCountExceeded && (
              <Text
                style={[
                  styles.countWarningText,
                  { color: isDark ? '#fbbf24' : '#b45309' },
                ]}>
                Only {matchingCount} questions are available. All {matchingCount} will be included.
              </Text>
            )}
          </View>
        )}

        {/* 6. Start Test Area (In-flow at bottom, clean & uncluttered) */}
        <View
          style={[
            styles.startArea,
            {
              borderTopColor: isDark ? '#1f242d' : '#f1f3f5',
            },
          ]}>
          {/* Availability and Dynamic Summary */}
          <View style={styles.startSummaryRow}>
            <View style={styles.availabilityBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      isCounting || loadingFilters
                        ? '#eab308'
                        : matchingCount > 0
                        ? '#22c55e'
                        : '#ef4444',
                  },
                ]}
              />
              <Text
                style={[
                  styles.availabilityText,
                  { color: theme.textSecondary },
                ]}>
                {isCounting || loadingFilters
                  ? 'Checking availability...'
                  : `${matchingCount.toLocaleString()} questions available`}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[styles.summaryText, { color: theme.textSecondary }]}>
              {dynamicSummary}
            </Text>
          </View>

          {/* Zero matching questions explanation */}
          {matchingCount === 0 && !loadingFilters && !isCounting && (
            <Text
              style={[
                styles.zeroMatchingText,
                { color: isDark ? '#f87171' : '#dc2626' },
              ]}>
              No questions found for this selection. Try broadening your filter or selecting All Years.
            </Text>
          )}

          {/* Primary Action Button */}
          <Pressable
            onPress={handleStartTest}
            disabled={isStartDisabled}
            accessibilityRole="button"
            accessibilityLabel="Start Test"
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: isStartDisabled
                  ? isDark
                    ? '#1f242d'
                    : '#e5e7eb'
                  : isDark
                  ? '#f3f4f6'
                  : '#111827',
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            {isGenerating ? (
              <View style={styles.btnContent}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#111827' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: isDark ? '#111827' : '#ffffff',
                    },
                  ]}>
                  Preparing Test...
                </Text>
              </View>
            ) : (
              <View style={styles.btnContent}>
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: isStartDisabled
                        ? theme.textSecondary
                        : isDark
                        ? '#111827'
                        : '#ffffff',
                    },
                  ]}>
                  Start Test
                </Text>
                <ArrowRight
                  size={16}
                  color={
                    isStartDisabled
                      ? theme.textSecondary
                      : isDark
                      ? '#111827'
                      : '#ffffff'
                  }
                />
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Modals outside ScrollView */}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  desktopContainer: {
    maxWidth: 580,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  historyButtonText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  historyBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Test Type Segment */
  segmentContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    marginBottom: 22,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  segmentLabel: {
    fontSize: 13,
    letterSpacing: -0.2,
  },

  /* Sections */
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionActionText: {
    fontSize: 11.5,
    fontWeight: '500',
  },

  /* Examination Paper Cards */
  paperRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paperCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  paperCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  paperCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  paperCardSub: {
    fontSize: 12,
    marginBottom: 4,
  },
  paperCardMarks: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  checkIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Horizontal Pills (Years, Presets) */
  pillsScroll: {
    flexDirection: 'row',
    gap: 7,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12.5,
    letterSpacing: -0.1,
  },

  /* Subject & Topic Filter Row */
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterRowTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  filterRowTitle: {
    fontSize: 13.5,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  filterRowSub: {
    fontSize: 11.5,
  },
  filterRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearFilterBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Full Mock Presets & Notice */
  presetGrid: {
    gap: 8,
  },
  presetTile: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
  },
  presetTileTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  presetTileSub: {
    fontSize: 11.5,
  },
  specNotice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  specNoticeText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  orderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  orderOption: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  orderOptionText: {
    fontSize: 12.5,
  },

  /* Test Format (Practice vs Timed) */
  formatGroup: {
    gap: 8,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  radioIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  formatTextGroup: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 13.5,
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  formatSub: {
    fontSize: 11.5,
  },

  /* Number of Questions */
  countRow: {
    flexDirection: 'row',
    gap: 7,
  },
  countPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: 13,
  },
  customInputRow: {
    marginTop: 8,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
  },
  countWarningText: {
    fontSize: 11.5,
    marginTop: 6,
  },

  /* Start Test Area (In-flow at bottom) */
  startArea: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
    gap: 10,
  },
  startSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 8,
    textAlign: 'right',
  },
  zeroMatchingText: {
    fontSize: 12,
    textAlign: 'center',
  },
  primaryButton: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
