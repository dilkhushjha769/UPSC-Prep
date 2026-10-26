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
} from 'react-native';
import { Clock, Play, Layers, Award, Calendar, Sparkles, Filter } from 'lucide-react-native';
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
      // Collect all topics across all subjects for this paper
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

  // 3. Debounced live question count query
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

  // Year toggle helper
  const toggleYear = (yr: number) => {
    setSelectedYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };

  // Subject toggle helper
  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) => {
      const next = prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub];
      return next;
    });
    // Reset topics that don't match remaining subjects
    setSelectedTopics([]);
  };

  // Topic toggle helper
  const toggleTopic = (top: string) => {
    setSelectedTopics((prev) =>
      prev.includes(top) ? prev.filter((t) => t !== top) : [...prev, top]
    );
  };

  // Question count helper
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

  // 4. Start Mock Test Handler
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
      {/* 1. Header Banner */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Create Your Mock Test</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Practice UPSC PYQs your way.</Text>
      </View>

      {/* 2. Real Summary Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.statIconBox, { backgroundColor: isDark ? '#1C263D' : '#EEF4FD' }]}>
            <BookOpen size={18} color={theme.textPrimary} />
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {summaryStats.availableQuestions}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Available PYQs</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.statIconBox, { backgroundColor: isDark ? '#1C263D' : '#EEF4FD' }]}>
            <CheckCircle2 size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {summaryStats.completedTests}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tests Completed</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.statIconBox, { backgroundColor: isDark ? '#1C263D' : '#EEF4FD' }]}>
            <Award size={18} color="#F59E0B" />
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {summaryStats.averageScore} M
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Average Score</Text>
          </View>
        </View>
      </View>

      {/* 3. Test Configuration Container */}
      <View style={[styles.configCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.configHeader}>
          <View style={styles.configHeaderLeft}>
            <Filter size={18} color={theme.textPrimary} />
            <Text style={[styles.configTitle, { color: theme.textPrimary }]}>Test Configuration</Text>
          </View>

          {/* Paper Type Selector */}
          <View style={[styles.paperTypeSegment, { backgroundColor: theme.activeBg, borderColor: theme.cardBorder }]}>
            <Pressable
              onPress={() => handlePaperTypeChange('GS1')}
              style={[
                styles.paperSegmentBtn,
                paperType === 'GS1' && { backgroundColor: theme.buttonPrimaryBg },
              ]}>
              <Text
                style={[
                  styles.paperSegmentText,
                  { color: paperType === 'GS1' ? theme.buttonPrimaryText : theme.textSecondary },
                ]}>
                GS Paper-I
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handlePaperTypeChange('CSAT')}
              style={[
                styles.paperSegmentBtn,
                paperType === 'CSAT' && { backgroundColor: theme.buttonPrimaryBg },
              ]}>
              <Text
                style={[
                  styles.paperSegmentText,
                  { color: paperType === 'CSAT' ? theme.buttonPrimaryText : theme.textSecondary },
                ]}>
                CSAT Paper-II
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Section A: Examination Year */}
        <View style={styles.configSection}>
          <View style={styles.sectionTitleRow}>
            <Calendar size={15} color={theme.textPrimary} />
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Examination Year</Text>
          </View>
          <View style={styles.pillRow}>
            <Pressable
              onPress={() => setSelectedYears([])}
              style={[
                styles.filterPill,
                selectedYears.length === 0 && {
                  backgroundColor: theme.buttonPrimaryBg,
                  borderColor: theme.buttonPrimaryBg,
                },
                { borderColor: theme.cardBorder },
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  { color: selectedYears.length === 0 ? theme.buttonPrimaryText : theme.textSecondary },
                ]}>
                All Available Years
              </Text>
            </Pressable>

            {filtersData.years.map((year) => {
              const isSelected = selectedYears.includes(year);
              return (
                <Pressable
                  key={year}
                  onPress={() => toggleYear(year)}
                  style={[
                    styles.filterPill,
                    isSelected && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                    { borderColor: theme.cardBorder },
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? theme.buttonPrimaryText : theme.textSecondary },
                    ]}>
                    {year}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section B: Subject */}
        <View style={styles.configSection}>
          <View style={styles.sectionTitleRow}>
            <BookOpen size={15} color={theme.textPrimary} />
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Subject (Multi-Select)</Text>
          </View>
          <View style={styles.pillRow}>
            <Pressable
              onPress={() => {
                setSelectedSubjects([]);
                setSelectedTopics([]);
              }}
              style={[
                styles.filterPill,
                selectedSubjects.length === 0 && {
                  backgroundColor: theme.buttonPrimaryBg,
                  borderColor: theme.buttonPrimaryBg,
                },
                { borderColor: theme.cardBorder },
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  { color: selectedSubjects.length === 0 ? theme.buttonPrimaryText : theme.textSecondary },
                ]}>
                All Subjects
              </Text>
            </Pressable>

            {filtersData.subjects.map((sub) => {
              const isSelected = selectedSubjects.includes(sub.name);
              return (
                <Pressable
                  key={sub.name}
                  onPress={() => toggleSubject(sub.name)}
                  style={[
                    styles.filterPill,
                    isSelected && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                    { borderColor: theme.cardBorder },
                  ]}>
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? theme.buttonPrimaryText : theme.textSecondary },
                    ]}>
                    {sub.name}
                  </Text>
                  <View style={[styles.subCountBadge, { backgroundColor: isSelected ? 'rgba(0,0,0,0.15)' : theme.activeBg }]}>
                    <Text style={[styles.subCountText, { color: isSelected ? theme.buttonPrimaryText : theme.textMuted }]}>
                      {sub.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section C: Topic */}
        {availableTopics.length > 0 && (
          <View style={styles.configSection}>
            <View style={styles.sectionTitleRow}>
              <Layers size={15} color={theme.textPrimary} />
              <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Topic Filter</Text>
            </View>
            <View style={styles.pillRow}>
              <Pressable
                onPress={() => setSelectedTopics([])}
                style={[
                  styles.filterPill,
                  selectedTopics.length === 0 && {
                    backgroundColor: theme.buttonPrimaryBg,
                    borderColor: theme.buttonPrimaryBg,
                  },
                  { borderColor: theme.cardBorder },
                ]}>
                <Text
                  style={[
                    styles.filterPillText,
                    { color: selectedTopics.length === 0 ? theme.buttonPrimaryText : theme.textSecondary },
                  ]}>
                  All Topics
                </Text>
              </Pressable>

              {availableTopics.slice(0, 16).map((top) => {
                const isSelected = selectedTopics.includes(top);
                return (
                  <Pressable
                    key={top}
                    onPress={() => toggleTopic(top)}
                    style={[
                      styles.filterPill,
                      isSelected && {
                        backgroundColor: theme.buttonPrimaryBg,
                        borderColor: theme.buttonPrimaryBg,
                      },
                      { borderColor: theme.cardBorder },
                    ]}>
                    <Text
                      style={[
                        styles.filterPillText,
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

        {/* Section D: Number of Questions */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Number of Questions</Text>
          <View style={styles.countRow}>
            {[10, 25, 50, 100].map((preset) => (
              <Pressable
                key={preset}
                onPress={() => handleCountPreset(preset)}
                style={[
                  styles.countBtn,
                  questionCount === preset &&
                    !customCountInput && {
                      backgroundColor: theme.buttonPrimaryBg,
                      borderColor: theme.buttonPrimaryBg,
                    },
                  { borderColor: theme.cardBorder },
                ]}>
                <Text
                  style={[
                    styles.countBtnText,
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

            <View style={[styles.customCountContainer, { borderColor: theme.cardBorder, backgroundColor: theme.activeBg }]}>
              <TextInput
                style={[styles.customInput, { color: theme.textPrimary }]}
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

        {/* Section E: Test Mode */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Test Mode</Text>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setTestMode('full')}
              style={[
                styles.modeCard,
                testMode === 'full' && { borderColor: theme.buttonPrimaryBg, backgroundColor: theme.activeBg },
                { borderColor: theme.cardBorder },
              ]}>
              <View style={styles.modeHeader}>
                <Clock size={16} color={testMode === 'full' ? theme.textPrimary : theme.textMuted} />
                <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>Full Mock Test</Text>
              </View>
              <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                Real UPSC simulation with countdown timer and negative marking.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTestMode('practice')}
              style={[
                styles.modeCard,
                testMode === 'practice' && { borderColor: theme.buttonPrimaryBg, backgroundColor: theme.activeBg },
                { borderColor: theme.cardBorder },
              ]}>
              <View style={styles.modeHeader}>
                <Sparkles size={16} color={testMode === 'practice' ? theme.textPrimary : theme.textMuted} />
                <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>Practice Test</Text>
              </View>
              <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                Self-paced learning. Instant explanation & answer review.
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Section F: Question Ordering */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Question Selection Order</Text>
          <View style={styles.orderRow}>
            {(
              [
                { id: 'random' as QuestionOrderMode, label: 'Randomized Selection' },
                { id: 'exam_order' as QuestionOrderMode, label: 'Original Examination Order' },
                { id: 'unattempted' as QuestionOrderMode, label: 'Unattempted Only' },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setOrderMode(item.id)}
                style={[
                  styles.orderOption,
                  orderMode === item.id && {
                    backgroundColor: theme.buttonPrimaryBg,
                    borderColor: theme.buttonPrimaryBg,
                  },
                  { borderColor: theme.cardBorder },
                ]}>
                <Text
                  style={[
                    styles.orderOptionText,
                    { color: orderMode === item.id ? theme.buttonPrimaryText : theme.textSecondary },
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Section G: Configurable Marking Scheme */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Marking Scheme</Text>
          <View style={styles.markingSchemeRow}>
            <View style={styles.markInputBox}>
              <Text style={[styles.markInputLabel, { color: theme.textSecondary }]}>Correct Mark (+)</Text>
              <View style={[styles.markInputWrapper, { borderColor: theme.cardBorder, backgroundColor: theme.activeBg }]}>
                <TextInput
                  style={[styles.markInput, { color: theme.textPrimary }]}
                  keyboardType="numeric"
                  value={String(marksPerCorrect)}
                  onChangeText={(val) => setMarksPerCorrect(parseFloat(val) || 0)}
                />
              </View>
            </View>

            <View style={styles.markInputBox}>
              <Text style={[styles.markInputLabel, { color: theme.textSecondary }]}>Negative Mark (-)</Text>
              <View style={[styles.markInputWrapper, { borderColor: theme.cardBorder, backgroundColor: theme.activeBg }]}>
                <TextInput
                  style={[styles.markInput, { color: theme.textPrimary }]}
                  keyboardType="numeric"
                  value={String(negativeMarks)}
                  onChangeText={(val) => setNegativeMarks(parseFloat(val) || 0)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Live Matching Count Banner */}
        <View
          style={[
            styles.matchingBanner,
            {
              backgroundColor: matchingCount > 0 ? (isDark ? '#111A2E' : '#FFF5EE') : isDark ? '#2D1515' : '#FEF2F2',
              borderColor: matchingCount > 0 ? (isDark ? '#1E293B' : '#FFD9BD') : '#EF4444',
            },
          ]}>
          <View style={styles.matchingTextRow}>
            <Text style={[styles.matchingCountNum, { color: matchingCount > 0 ? '#10B981' : '#EF4444' }]}>
              {isCounting ? 'Checking...' : `${matchingCount} Matching Questions Available`}
            </Text>
            {isCountExceeded && (
              <Text style={[styles.matchingWarning, { color: '#F59E0B' }]}>
                (Will create test with {matchingCount} available questions)
              </Text>
            )}
          </View>
        </View>

        {/* Primary CTA: Start Mock Test Button */}
        <Pressable
          onPress={handleStartTest}
          disabled={matchingCount === 0 || isGenerating}
          style={[
            styles.startTestBtn,
            {
              backgroundColor: matchingCount === 0 ? theme.cardBorder : theme.buttonPrimaryBg,
            },
          ]}>
          {isGenerating ? (
            <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
          ) : (
            <>
              <Play size={18} color={theme.buttonPrimaryText} />
              <Text style={[styles.startTestBtnText, { color: theme.buttonPrimaryText }]}>
                Start Mock Test ({Math.min(questionCount, matchingCount)} Questions)
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* 4. Recent Mock Tests Section */}
      <View style={styles.recentSection}>
        <Text style={[styles.recentSectionTitle, { color: theme.textPrimary }]}>Recent Mock Tests</Text>

        {recentTests.length === 0 ? (
          <View style={[styles.emptyRecentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyRecentTitle, { color: theme.textPrimary }]}>No Mock Tests Attempted Yet</Text>
            <Text style={[styles.emptyRecentDesc, { color: theme.textSecondary }]}>
              Configure your preferences above and launch your first customized UPSC PYQ test.
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  configCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  configHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  paperTypeSegment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  paperSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paperSegmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  configSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  subCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  countBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  countBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  customCountContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    minWidth: 80,
    height: 40,
    justifyContent: 'center',
  },
  customInput: {
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  modeCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  orderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  orderOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  orderOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  markingSchemeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  markInputBox: {
    flex: 1,
    maxWidth: 160,
  },
  markInputLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  markInputWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markInput: {
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
  },
  matchingBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  matchingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchingCountNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchingWarning: {
    fontSize: 12,
    fontWeight: '500',
  },
  startTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startTestBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  recentSection: {
    marginBottom: 20,
  },
  recentSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  emptyRecentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptyRecentTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyRecentDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  recentList: {
    gap: 10,
  },
  recentItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLeft: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  recentItemMeta: {
    fontSize: 12,
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentScoreBadge: {
    alignItems: 'flex-end',
  },
  recentScoreText: {
    fontSize: 14,
    fontWeight: '800',
  },
  recentAccText: {
    fontSize: 11,
  },
  inProgressPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inProgressText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
});
