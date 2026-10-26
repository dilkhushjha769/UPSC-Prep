import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {
  Clock,
  Play,
  Layers,
  Award,
  Calendar,
  Sparkles,
  Filter,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Zap,
} from 'lucide-react-native';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
} from '@/components/common/LucideIcons';
import { BW_THEME } from '@/constants/bwTheme';
import { MockTestService } from '@/services/mockTestService';
import {
  AvailableFiltersData,
  MockTestFilterConfig,
  MockTestRecord,
  MockTestSummaryStats,
  PaperType,
  QuestionOrderMode,
  TestMode,
} from '@/types/mockTest';

interface MockTestDashboardProps {
  onStartTest: (testId: string) => void;
  isDark?: boolean;
}

export function MockTestDashboard({ onStartTest, isDark = true }: MockTestDashboardProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  // Real stats & filters
  const [summaryStats, setSummaryStats] = useState<MockTestSummaryStats>({
    availableQuestions: 540,
    completedTests: 0,
    averageScore: 0,
    averageAccuracy: 0,
  });
  const [filtersData, setFiltersData] = useState<AvailableFiltersData>({
    years: [2026, 2025, 2024],
    subjects: [],
    topicsBySubject: {},
  });
  const [recentTests, setRecentTests] = useState<MockTestRecord[]>([]);

  // User configuration state
  const [paperType, setPaperType] = useState<PaperType>('GS1');
  const [selectedYears, setSelectedYears] = useState<number[]>([]); // empty = All Years
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]); // empty = All Subjects
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]); // empty = All Topics
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [testMode, setTestMode] = useState<TestMode>('full');
  const [orderMode, setOrderMode] = useState<QuestionOrderMode>('random');
  const [marksPerCorrect, setMarksPerCorrect] = useState<number>(2.0);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.67);

  // UI interaction states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');

  // Live matching question count
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [isCounting, setIsCounting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Initial Load: stats, filters, recent tests
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [stats, filters, tests] = await Promise.all([
          MockTestService.getSummaryStats(),
          MockTestService.getAvailableFilters(paperType),
          MockTestService.getRecentMockTests(6),
        ]);
        if (!mounted) return;
        setSummaryStats(stats);
        setFiltersData(filters);
        setRecentTests(tests);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [paperType]);

  // Handle Paper Type Switch (defaults marking scheme)
  const handlePaperTypeChange = (pType: PaperType) => {
    setPaperType(pType);
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setSubjectSearch('');
    setTopicSearch('');
    if (pType === 'CSAT') {
      setMarksPerCorrect(2.5);
      setNegativeMarks(0.83);
    } else {
      setMarksPerCorrect(2.0);
      setNegativeMarks(0.67);
    }
  };

  // 2. Compute dynamic topics based on selected subjects
  const availableTopics = useMemo(() => {
    if (selectedSubjects.length === 0) {
      const allTops = new Set<string>();
      Object.values(filtersData.topicsBySubject).forEach((topList) => {
        topList.forEach((t) => allTops.add(t));
      });
      return Array.from(allTops).sort();
    }

    const tops = new Set<string>();
    selectedSubjects.forEach((sub) => {
      const list = filtersData.topicsBySubject[sub] || [];
      list.forEach((t) => tops.add(t));
    });
    return Array.from(tops).sort();
  }, [selectedSubjects, filtersData.topicsBySubject]);

  // 3. Subject partitioning: Top 6 core subjects vs remaining
  const { topCoreSubjects, activeNonCoreSubjects, modalFilteredSubjects } = useMemo(() => {
    const all = filtersData.subjects;
    const top6 = all.slice(0, 6);
    const nonCoreSelected = selectedSubjects.filter(
      (subName) => !top6.some((c) => c.name === subName)
    );

    let modalList = all;
    if (subjectSearch.trim()) {
      const q = subjectSearch.trim().toLowerCase();
      modalList = all.filter((s) => s.name.toLowerCase().includes(q));
    }

    return {
      topCoreSubjects: top6,
      activeNonCoreSubjects: nonCoreSelected,
      modalFilteredSubjects: modalList,
    };
  }, [filtersData.subjects, selectedSubjects, subjectSearch]);

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return availableTopics.slice(0, 20);
    const q = topicSearch.trim().toLowerCase();
    return availableTopics.filter((t) => t.toLowerCase().includes(q));
  }, [availableTopics, topicSearch]);

  // 4. Debounced live question count query
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      if (!active) return;
      setIsCounting(true);
      const count = await MockTestService.getMatchingQuestionCount({
        paperType,
        selectedYears,
        selectedSubjects,
        selectedTopics,
        questionCount,
        testMode,
        orderMode,
        marksPerCorrect,
        negativeMarks,
      });

      if (active) {
        setMatchingCount(count);
        setIsCounting(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paperType, selectedYears, selectedSubjects, selectedTopics, questionCount, testMode, orderMode, marksPerCorrect, negativeMarks]);

  // Helpers
  const toggleYear = (yr: number) => {
    setSelectedYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
    setSelectedTopics([]);
  };

  const toggleTopic = (top: string) => {
    setSelectedTopics((prev) =>
      prev.includes(top) ? prev.filter((t) => t !== top) : [...prev, top]
    );
  };

  const handleCountPreset = (preset: number) => {
    setQuestionCount(preset);
    setCustomCountInput('');
  };

  const handleCustomCountChange = (text: string) => {
    setCustomCountInput(text);
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setQuestionCount(parsed);
    }
  };

  // 1-Tap Quick Start Handler
  const handleQuickStart = async (presetType: 'full_mock' | 'daily_drill') => {
    const isFull = presetType === 'full_mock';
    const effectiveQCount = isFull ? (paperType === 'CSAT' ? 80 : 100) : 25;
    const effectiveMode: TestMode = isFull ? 'full' : 'practice';

    setIsGenerating(true);
    const result = await MockTestService.generateMockTest({
      paperType,
      selectedYears: [],
      selectedSubjects: [],
      selectedTopics: [],
      questionCount: effectiveQCount,
      testMode: effectiveMode,
      orderMode: 'random',
      marksPerCorrect: paperType === 'CSAT' ? 2.5 : 2.0,
      negativeMarks: paperType === 'CSAT' ? 0.83 : 0.67,
    });
    setIsGenerating(false);

    if (result.testId) {
      onStartTest(result.testId);
    } else {
      Alert.alert('Generation Error', result.error || 'Failed to generate test. Please try again.');
    }
  };

  // Custom Test Start Handler
  const handleStartTest = async () => {
    if (matchingCount === 0) {
      Alert.alert(
        'No Questions Available',
        'No questions match your currently selected filters. Please broaden your year, subject, or topic selection.'
      );
      return;
    }

    const effectiveCount = Math.min(questionCount, matchingCount);

    const config: MockTestFilterConfig = {
      paperType,
      selectedYears,
      selectedSubjects,
      selectedTopics,
      questionCount: effectiveCount,
      testMode,
      orderMode,
      marksPerCorrect,
      negativeMarks,
    };

    setIsGenerating(true);
    const result = await MockTestService.generateMockTest(config);
    setIsGenerating(false);

    if (result.testId) {
      onStartTest(result.testId);
    } else {
      Alert.alert('Generation Error', result.error || 'Failed to generate test. Please try again.');
    }
  };

  const isCountExceeded = questionCount > matchingCount && matchingCount > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {/* 1. Header & Paper Switcher */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>UPSC Mock Tests</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Prelims PYQ Practice & Simulations
          </Text>
        </View>

        {/* Paper Segmented Control */}
        <View style={[styles.paperTypePill, { backgroundColor: theme.activeBg, borderColor: theme.cardBorder }]}>
          <Pressable
            onPress={() => handlePaperTypeChange('GS1')}
            style={[
              styles.paperBtn,
              paperType === 'GS1' && { backgroundColor: theme.buttonPrimaryBg },
            ]}>
            <Text
              style={[
                styles.paperBtnText,
                { color: paperType === 'GS1' ? theme.buttonPrimaryText : theme.textSecondary },
              ]}>
              GS Paper-I
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handlePaperTypeChange('CSAT')}
            style={[
              styles.paperBtn,
              paperType === 'CSAT' && { backgroundColor: theme.buttonPrimaryBg },
            ]}>
            <Text
              style={[
                styles.paperBtnText,
                { color: paperType === 'CSAT' ? theme.buttonPrimaryText : theme.textSecondary },
              ]}>
              CSAT Paper-II
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Compact Stats Bar */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricChip, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <BookOpen size={14} color={theme.textPrimary} />
          <Text style={[styles.metricChipText, { color: theme.textPrimary }]}>
            {summaryStats.availableQuestions} PYQs Available
          </Text>
        </View>
        <View style={[styles.metricChip, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <CheckCircle2 size={14} color="#10B981" />
          <Text style={[styles.metricChipText, { color: theme.textPrimary }]}>
            {summaryStats.completedTests} Tests Completed
          </Text>
        </View>
        {summaryStats.completedTests > 0 && (
          <View style={[styles.metricChip, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Award size={14} color="#F59E0B" />
            <Text style={[styles.metricChipText, { color: theme.textPrimary }]}>
              {summaryStats.averageAccuracy}% Accuracy
            </Text>
          </View>
        )}
      </View>

      {/* 3. Quick Start 1-Tap Presets (Zero Clutter) */}
      <View style={styles.quickStartSection}>
        <Text style={[styles.sectionTitleLabel, { color: theme.textSecondary }]}>QUICK START PRESETS</Text>
        <View style={styles.quickCardsRow}>
          {/* Full Mock Exam Card */}
          <Pressable
            onPress={() => handleQuickStart('full_mock')}
            disabled={isGenerating}
            style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.quickCardHeader}>
              <View style={[styles.quickIconCircle, { backgroundColor: isDark ? '#1C263D' : '#EEF4FD' }]}>
                <Clock size={16} color={theme.textPrimary} />
              </View>
              <View style={styles.quickBadge}>
                <Text style={styles.quickBadgeText}>{paperType === 'CSAT' ? '80 Qs' : '100 Qs'}</Text>
              </View>
            </View>
            <Text style={[styles.quickCardTitle, { color: theme.textPrimary }]}>Full Exam Simulation</Text>
            <Text style={[styles.quickCardDesc, { color: theme.textSecondary }]}>
              120 mins timed test with standard UPSC negative marking.
            </Text>
            <View style={styles.quickActionRow}>
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>Start Mock Exam</Text>
              <ChevronRight size={14} color={theme.textPrimary} />
            </View>
          </Pressable>

          {/* Rapid 25 Drill Card */}
          <Pressable
            onPress={() => handleQuickStart('daily_drill')}
            disabled={isGenerating}
            style={[styles.quickCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.quickCardHeader}>
              <View style={[styles.quickIconCircle, { backgroundColor: isDark ? '#2D2014' : '#FEF3C7' }]}>
                <Zap size={16} color="#F59E0B" />
              </View>
              <View style={[styles.quickBadge, { backgroundColor: isDark ? '#2D2014' : '#FEF3C7' }]}>
                <Text style={[styles.quickBadgeText, { color: '#F59E0B' }]}>25 Qs</Text>
              </View>
            </View>
            <Text style={[styles.quickCardTitle, { color: theme.textPrimary }]}>Speed Practice Drill</Text>
            <Text style={[styles.quickCardDesc, { color: theme.textSecondary }]}>
              Untimed self-paced drill with instant answer explanations.
            </Text>
            <View style={styles.quickActionRow}>
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>Start Speed Drill</Text>
              <ChevronRight size={14} color={theme.textPrimary} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* 4. Custom Test Builder Card (Clean, Structured Form) */}
      <View style={[styles.builderCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.builderHeader}>
          <View style={styles.builderTitleLeft}>
            <Filter size={16} color={theme.textPrimary} />
            <Text style={[styles.builderTitle, { color: theme.textPrimary }]}>Custom Test Builder</Text>
          </View>
          {selectedSubjects.length > 0 && (
            <Pressable
              onPress={() => {
                setSelectedSubjects([]);
                setSelectedTopics([]);
              }}
              hitSlop={8}>
              <Text style={[styles.clearLinkText, { color: theme.textMuted }]}>Reset to All</Text>
            </Pressable>
          )}
        </View>

        {/* Step A: Subject Focus (Clean Primary Row + Modal Trigger) */}
        <View style={styles.builderSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={[styles.builderSectionLabel, { color: theme.textSecondary }]}>
              SUBJECT FOCUS
            </Text>
            <Text style={[styles.sectionSelectedSummary, { color: theme.textMuted }]}>
              {selectedSubjects.length === 0
                ? `All ${filtersData.subjects.length} Subjects`
                : `${selectedSubjects.length} Selected`}
            </Text>
          </View>

          <View style={styles.subjectChipsRow}>
            {/* All Subjects Chip */}
            <Pressable
              onPress={() => {
                setSelectedSubjects([]);
                setSelectedTopics([]);
              }}
              style={[
                styles.chipBtn,
                selectedSubjects.length === 0 && {
                  backgroundColor: theme.buttonPrimaryBg,
                  borderColor: theme.buttonPrimaryBg,
                },
                {
                  borderColor: theme.cardBorder,
                  backgroundColor: selectedSubjects.length === 0 ? theme.buttonPrimaryBg : theme.activeBg,
                },
              ]}>
              <Text
                style={[
                  styles.chipBtnText,
                  { color: selectedSubjects.length === 0 ? theme.buttonPrimaryText : theme.textSecondary },
                ]}>
                All Subjects
              </Text>
            </Pressable>

            {/* Core Top Subjects */}
            {topCoreSubjects.map((sub) => {
              const isSelected = selectedSubjects.includes(sub.name);
              return (
                <Pressable
                  key={sub.name}
                  onPress={() => toggleSubject(sub.name)}
                  style={[
                    styles.chipBtn,
                    isSelected && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                    {
                      borderColor: theme.cardBorder,
                      backgroundColor: isSelected ? theme.buttonPrimaryBg : theme.activeBg,
                    },
                  ]}>
                  {isSelected && <Check size={12} color={theme.buttonPrimaryText} style={{ marginRight: -2 }} />}
                  <Text
                    style={[
                      styles.chipBtnText,
                      { color: isSelected ? theme.buttonPrimaryText : theme.textSecondary },
                    ]}>
                    {sub.name}
                  </Text>
                </Pressable>
              );
            })}

            {/* Pinned Selected Non-Core Subjects */}
            {activeNonCoreSubjects.map((subName) => (
              <Pressable
                key={subName}
                onPress={() => toggleSubject(subName)}
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: theme.buttonPrimaryBg,
                    borderColor: theme.buttonPrimaryBg,
                  },
                ]}>
                <Text style={[styles.chipBtnText, { color: theme.buttonPrimaryText }]}>{subName}</Text>
                <X size={12} color={theme.buttonPrimaryText} style={{ marginLeft: 2 }} />
              </Pressable>
            ))}

            {/* Browse All Subjects Modal Button */}
            {filtersData.subjects.length > 6 && (
              <Pressable
                onPress={() => setShowSubjectModal(true)}
                style={[styles.chipBtnMore, { borderColor: theme.cardBorder, backgroundColor: theme.activeBg }]}>
                <SlidersHorizontal size={12} color={theme.textSecondary} />
                <Text style={[styles.chipBtnMoreText, { color: theme.textSecondary }]}>
                  + Browse All ({filtersData.subjects.length})
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Step B: Question Count & Mode */}
        <View style={styles.builderSection}>
          <Text style={[styles.builderSectionLabel, { color: theme.textSecondary }]}>
            NUMBER OF QUESTIONS
          </Text>
          <View style={styles.countSegmentRow}>
            {[10, 25, 50, 100].map((preset) => (
              <Pressable
                key={preset}
                onPress={() => handleCountPreset(preset)}
                style={[
                  styles.countSegmentBtn,
                  questionCount === preset &&
                    !customCountInput && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                  { borderColor: theme.cardBorder, backgroundColor: questionCount === preset && !customCountInput ? theme.buttonPrimaryBg : theme.activeBg },
                ]}>
                <Text
                  style={[
                    styles.countSegmentText,
                    {
                      color:
                        questionCount === preset && !customCountInput
                          ? theme.buttonPrimaryText
                          : theme.textSecondary,
                    },
                  ]}>
                  {preset} Qs
                </Text>
              </Pressable>
            ))}

            <View style={[styles.customCountBox, { borderColor: theme.cardBorder, backgroundColor: theme.activeBg }]}>
              <TextInput
                style={[styles.customCountField, { color: theme.textPrimary }]}
                placeholder="Custom"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={customCountInput}
                onChangeText={handleCustomCountChange}
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* Step C: Test Mode Selection */}
        <View style={styles.builderSection}>
          <Text style={[styles.builderSectionLabel, { color: theme.textSecondary }]}>
            TEST MODE
          </Text>
          <View style={styles.modeCardsRow}>
            <Pressable
              onPress={() => setTestMode('full')}
              style={[
                styles.modeOptionCard,
                testMode === 'full' && { borderColor: theme.buttonPrimaryBg, backgroundColor: theme.activeBg },
                { borderColor: theme.cardBorder },
              ]}>
              <View style={styles.modeOptionHeader}>
                <Clock size={15} color={testMode === 'full' ? theme.textPrimary : theme.textMuted} />
                <Text style={[styles.modeOptionTitle, { color: theme.textPrimary }]}>Timed Mock Test</Text>
              </View>
              <Text style={[styles.modeOptionDesc, { color: theme.textSecondary }]}>
                Timer enabled with standard negative marking. Submit at end.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTestMode('practice')}
              style={[
                styles.modeOptionCard,
                testMode === 'practice' && { borderColor: theme.buttonPrimaryBg, backgroundColor: theme.activeBg },
                { borderColor: theme.cardBorder },
              ]}>
              <View style={styles.modeOptionHeader}>
                <Sparkles size={15} color={testMode === 'practice' ? theme.textPrimary : theme.textMuted} />
                <Text style={[styles.modeOptionTitle, { color: theme.textPrimary }]}>Practice Mode</Text>
              </View>
              <Text style={[styles.modeOptionDesc, { color: theme.textSecondary }]}>
                Untimed. Instant solution & explanation after each question.
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Step D: Advanced Customization (Tucked away neatly in an Accordion) */}
        <View style={[styles.advancedCard, { borderColor: theme.cardBorder, backgroundColor: theme.activeBg }]}>
          <Pressable
            onPress={() => setShowAdvanced(!showAdvanced)}
            style={styles.advancedHeader}>
            <View style={styles.advancedHeaderLeft}>
              <SlidersHorizontal size={14} color={theme.textSecondary} />
              <Text style={[styles.advancedHeaderText, { color: theme.textSecondary }]}>
                Advanced Filters (Years, Topics, Order, Marking)
              </Text>
            </View>
            {showAdvanced ? (
              <ChevronUp size={15} color={theme.textSecondary} />
            ) : (
              <ChevronDown size={15} color={theme.textSecondary} />
            )}
          </Pressable>

          {showAdvanced && (
            <View style={styles.advancedBody}>
              {/* Year Filter */}
              <View style={styles.advancedRow}>
                <View style={styles.subRowHeader}>
                  <Calendar size={13} color={theme.textSecondary} />
                  <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>Examination Year</Text>
                </View>
                <View style={styles.subRowPills}>
                  <Pressable
                    onPress={() => setSelectedYears([])}
                    style={[
                      styles.advPill,
                      selectedYears.length === 0 && { backgroundColor: theme.buttonPrimaryBg },
                      { borderColor: theme.cardBorder, backgroundColor: selectedYears.length === 0 ? theme.buttonPrimaryBg : theme.cardBg },
                    ]}>
                    <Text
                      style={[
                        styles.advPillText,
                        { color: selectedYears.length === 0 ? theme.buttonPrimaryText : theme.textSecondary },
                      ]}>
                      All Years
                    </Text>
                  </Pressable>
                  {filtersData.years.map((yr) => {
                    const isSelected = selectedYears.includes(yr);
                    return (
                      <Pressable
                        key={yr}
                        onPress={() => toggleYear(yr)}
                        style={[
                          styles.advPill,
                          isSelected && { backgroundColor: theme.buttonPrimaryBg },
                          { borderColor: theme.cardBorder, backgroundColor: isSelected ? theme.buttonPrimaryBg : theme.cardBg },
                        ]}>
                        <Text
                          style={[
                            styles.advPillText,
                            { color: isSelected ? theme.buttonPrimaryText : theme.textSecondary },
                          ]}>
                          {yr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Question Order */}
              <View style={styles.advancedRow}>
                <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>Question Order</Text>
                <View style={styles.subRowPills}>
                  {(
                    [
                      { id: 'random' as QuestionOrderMode, label: 'Randomized' },
                      { id: 'exam_order' as QuestionOrderMode, label: 'Exam Order' },
                      { id: 'unattempted' as QuestionOrderMode, label: 'Unattempted' },
                    ] as const
                  ).map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setOrderMode(item.id)}
                      style={[
                        styles.advPill,
                        orderMode === item.id && { backgroundColor: theme.buttonPrimaryBg },
                        { borderColor: theme.cardBorder, backgroundColor: orderMode === item.id ? theme.buttonPrimaryBg : theme.cardBg },
                      ]}>
                      <Text
                        style={[
                          styles.advPillText,
                          { color: orderMode === item.id ? theme.buttonPrimaryText : theme.textSecondary },
                        ]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Topic Drill-Down */}
              {availableTopics.length > 0 && (
                <View style={styles.advancedRow}>
                  <View style={styles.subRowHeader}>
                    <Layers size={13} color={theme.textSecondary} />
                    <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>
                      Topic Filter ({availableTopics.length} available)
                    </Text>
                  </View>
                  <View style={[styles.modalSearchBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginBottom: 8 }]}>
                    <Search size={13} color={theme.textMuted} />
                    <TextInput
                      style={[styles.modalSearchInput, { color: theme.textPrimary }]}
                      placeholder="Search specific topics (e.g. Biodiversity, Inflation)..."
                      placeholderTextColor={theme.textMuted}
                      value={topicSearch}
                      onChangeText={setTopicSearch}
                    />
                    {topicSearch.length > 0 && (
                      <Pressable onPress={() => setTopicSearch('')} hitSlop={6}>
                        <X size={13} color={theme.textMuted} />
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.subRowPills}>
                    <Pressable
                      onPress={() => setSelectedTopics([])}
                      style={[
                        styles.advPill,
                        selectedTopics.length === 0 && { backgroundColor: theme.buttonPrimaryBg },
                        { borderColor: theme.cardBorder, backgroundColor: selectedTopics.length === 0 ? theme.buttonPrimaryBg : theme.cardBg },
                      ]}>
                      <Text
                        style={[
                          styles.advPillText,
                          { color: selectedTopics.length === 0 ? theme.buttonPrimaryText : theme.textSecondary },
                        ]}>
                        All Topics
                      </Text>
                    </Pressable>
                    {filteredTopics.map((top) => {
                      const isSelected = selectedTopics.includes(top);
                      return (
                        <Pressable
                          key={top}
                          onPress={() => toggleTopic(top)}
                          style={[
                            styles.advPill,
                            isSelected && { backgroundColor: theme.buttonPrimaryBg },
                            { borderColor: theme.cardBorder, backgroundColor: isSelected ? theme.buttonPrimaryBg : theme.cardBg },
                          ]}>
                          <Text
                            style={[
                              styles.advPillText,
                              { color: isSelected ? theme.buttonPrimaryText : theme.textSecondary },
                            ]}
                            numberOfLines={1}>
                            {top}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Marking Scheme */}
              <View style={styles.advancedRow}>
                <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>Marking Scheme</Text>
                <View style={styles.marksRow}>
                  <View style={styles.markItem}>
                    <Text style={[styles.markItemLabel, { color: theme.textMuted }]}>Correct (+)</Text>
                    <View style={[styles.markItemInputWrapper, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                      <TextInput
                        style={[styles.markItemInput, { color: theme.textPrimary }]}
                        keyboardType="numeric"
                        value={String(marksPerCorrect)}
                        onChangeText={(v) => setMarksPerCorrect(parseFloat(v) || 0)}
                      />
                    </View>
                  </View>
                  <View style={styles.markItem}>
                    <Text style={[styles.markItemLabel, { color: theme.textMuted }]}>Negative (-)</Text>
                    <View style={[styles.markItemInputWrapper, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                      <TextInput
                        style={[styles.markItemInput, { color: theme.textPrimary }]}
                        keyboardType="numeric"
                        value={String(negativeMarks)}
                        onChangeText={(v) => setNegativeMarks(parseFloat(v) || 0)}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Match Count Indicator & Primary CTA */}
        <View style={styles.ctaContainer}>
          <View style={styles.matchStatusRow}>
            <View
              style={[
                styles.matchDot,
                { backgroundColor: matchingCount > 0 ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text style={[styles.matchStatusText, { color: theme.textSecondary }]}>
              {isCounting
                ? 'Updating available questions...'
                : matchingCount > 0
                ? `${matchingCount} questions match your filters`
                : 'No questions match these filters'}
            </Text>
            {isCountExceeded && (
              <Text style={styles.matchWarningText}>
                (Will create with max {matchingCount} Qs)
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleStartTest}
            disabled={matchingCount === 0 || isGenerating}
            style={[
              styles.startCustomBtn,
              {
                backgroundColor: matchingCount === 0 ? theme.cardBorder : theme.buttonPrimaryBg,
              },
            ]}>
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <>
                <Play size={16} color={theme.buttonPrimaryText} />
                <Text style={[styles.startCustomBtnText, { color: theme.buttonPrimaryText }]}>
                  Start Custom Test ({Math.min(questionCount, matchingCount)} Questions)
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* 5. Recent Mock Tests Section */}
      <View style={styles.recentSection}>
        <Text style={[styles.sectionTitleLabel, { color: theme.textSecondary }]}>RECENT MOCK TESTS</Text>

        {recentTests.length === 0 ? (
          <View style={[styles.emptyRecentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyRecentTitle, { color: theme.textPrimary }]}>No Mock Tests Attempted Yet</Text>
            <Text style={[styles.emptyRecentDesc, { color: theme.textSecondary }]}>
              Pick a quick preset above or build a custom test to practice UPSC PYQs.
            </Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentTests.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => onStartTest(t.id)}
                style={[styles.recentItemCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <View style={styles.recentLeft}>
                  <Text style={[styles.recentItemTitle, { color: theme.textPrimary }]}>{t.test_title}</Text>
                  <Text style={[styles.recentItemMeta, { color: theme.textMuted }]}>
                    {new Date(t.created_at).toLocaleDateString()} • {t.question_count} Qs • {t.test_mode}
                  </Text>
                </View>

                <View style={styles.recentRight}>
                  {t.status === 'submitted' ? (
                    <View style={styles.recentScoreBadge}>
                      <Text style={[styles.recentScoreText, { color: '#10B981' }]}>
                        {t.score} / {t.total_marks}
                      </Text>
                      <Text style={[styles.recentAccText, { color: theme.textSecondary }]}>{t.accuracy}% acc</Text>
                    </View>
                  ) : (
                    <View style={[styles.inProgressPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Text style={styles.inProgressText}>Resume</Text>
                    </View>
                  )}
                  <ChevronRight size={18} color={theme.textMuted} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* 6. Clean Subject Picker Modal (Isolates all 47 subjects from main view) */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSubjectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Subjects</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {selectedSubjects.length === 0
                    ? `All ${filtersData.subjects.length} subjects included`
                    : `${selectedSubjects.length} of ${filtersData.subjects.length} selected`}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowSubjectModal(false)}
                hitSlop={8}
                style={[styles.modalCloseBtn, { backgroundColor: theme.activeBg }]}>
                <X size={18} color={theme.textPrimary} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={[styles.modalSearchBar, { backgroundColor: theme.activeBg, borderColor: theme.cardBorder }]}>
              <Search size={15} color={theme.textMuted} />
              <TextInput
                style={[styles.modalSearchInput, { color: theme.textPrimary }]}
                placeholder={`Search ${filtersData.subjects.length} subjects (e.g. Polity, Defence, Trade)...`}
                placeholderTextColor={theme.textMuted}
                value={subjectSearch}
                onChangeText={setSubjectSearch}
              />
              {subjectSearch.length > 0 && (
                <Pressable onPress={() => setSubjectSearch('')} hitSlop={6}>
                  <X size={14} color={theme.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Action Bar: Select All / Clear All */}
            <View style={styles.modalQuickActionsRow}>
              <Pressable
                onPress={() => setSelectedSubjects([])}
                style={[styles.modalActionPill, { backgroundColor: theme.activeBg }]}>
                <Text style={[styles.modalActionPillText, { color: theme.textSecondary }]}>Include All</Text>
              </Pressable>
              {selectedSubjects.length > 0 && (
                <Pressable
                  onPress={() => setSelectedSubjects([])}
                  style={[styles.modalActionPill, { backgroundColor: theme.activeBg }]}>
                  <Text style={[styles.modalActionPillText, { color: theme.textMuted }]}>Clear Selection</Text>
                </Pressable>
              )}
            </View>

            {/* Subject Items List */}
            <ScrollView style={styles.modalSubjectList} showsVerticalScrollIndicator>
              {modalFilteredSubjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.name);
                return (
                  <Pressable
                    key={sub.name}
                    onPress={() => toggleSubject(sub.name)}
                    style={[
                      styles.modalSubjectRow,
                      { borderColor: theme.cardBorder },
                      isSelected && { backgroundColor: theme.activeBg },
                    ]}>
                    <View style={styles.modalSubjectLeft}>
                      <View
                        style={[
                          styles.modalCheckbox,
                          { borderColor: isSelected ? theme.buttonPrimaryBg : theme.cardBorder },
                          isSelected && { backgroundColor: theme.buttonPrimaryBg },
                        ]}>
                        {isSelected && <Check size={12} color={theme.buttonPrimaryText} />}
                      </View>
                      <Text style={[styles.modalSubjectName, { color: theme.textPrimary }]}>
                        {sub.name}
                      </Text>
                    </View>
                    <View style={[styles.modalCountPill, { backgroundColor: theme.cardBg }]}>
                      <Text style={[styles.modalCountText, { color: theme.textMuted }]}>
                        {sub.count} Qs
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Bottom Apply CTA */}
            <Pressable
              onPress={() => setShowSubjectModal(false)}
              style={[styles.modalApplyBtn, { backgroundColor: theme.buttonPrimaryBg }]}>
              <Text style={[styles.modalApplyBtnText, { color: theme.buttonPrimaryText }]}>
                Done ({selectedSubjects.length === 0 ? 'All' : selectedSubjects.length} Selected)
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  // Top Header
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  paperTypePill: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  paperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paperBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Compact Stats
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Quick Presets
  quickStartSection: {
    marginBottom: 22,
  },
  sectionTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Custom Builder Card
  builderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  builderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  builderTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  builderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  builderSection: {
    marginBottom: 18,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  builderSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionSelectedSummary: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Subject Chips
  subjectChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  chipBtnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipBtnMoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Count Segment
  countSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  countSegmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  countSegmentText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  customCountBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 38,
    minWidth: 76,
    justifyContent: 'center',
  },
  customCountField: {
    fontSize: 12.5,
    fontWeight: '600',
    padding: 0,
  },
  // Mode Cards
  modeCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  modeOptionCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
  },
  modeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeOptionDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  // Advanced Accordion
  advancedCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  advancedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advancedHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  advancedBody: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    gap: 14,
  },
  advancedRow: {
    gap: 6,
  },
  subRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subRowLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subRowPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  advPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  advPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  marksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  markItem: {
    flex: 1,
    maxWidth: 130,
  },
  markItemLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    marginBottom: 4,
  },
  markItemInputWrapper: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markItemInput: {
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  // CTA
  ctaContainer: {
    marginTop: 6,
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  matchDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  matchStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchWarningText: {
    fontSize: 11.5,
    color: '#F59E0B',
    fontWeight: '600',
  },
  startCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
  },
  startCustomBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Recent Section
  recentSection: {
    marginBottom: 20,
  },
  emptyRecentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  emptyRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyRecentDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  recentList: {
    gap: 8,
  },
  recentItemCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLeft: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  recentItemMeta: {
    fontSize: 11.5,
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentScoreBadge: {
    alignItems: 'flex-end',
  },
  recentScoreText: {
    fontSize: 13,
    fontWeight: '800',
  },
  recentAccText: {
    fontSize: 10.5,
  },
  inProgressPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  inProgressText: {
    color: '#F59E0B',
    fontSize: 10.5,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 32,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    padding: 0,
  },
  modalQuickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalActionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modalActionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalSubjectList: {
    maxHeight: 340,
    marginBottom: 14,
  },
  modalSubjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalSubjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubjectName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  modalCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalApplyBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
