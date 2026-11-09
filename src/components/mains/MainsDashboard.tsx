import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Moon,
  Search,
  Sun,
  Timer,
  Users,
  X,
} from 'lucide-react-native';
import {
  MainsEvaluationRecord,
  MainsPaperId,
  MainsQuestionRecord,
  MainsSubmissionRecord,
  MainsUserStats,
} from '@/types/mains';
import {
  getMainsPaperSummaries,
  getQuestionsByPaper,
} from '@/data/mainsQuestionRepository';
import { MainsService } from '@/services/mainsService';
import { MainsAnswerWorkspaceModal } from './MainsAnswerWorkspaceModal';
import { MainsEvaluationReportModal } from './MainsEvaluationReportModal';
import { MainsCommunityView } from './community/MainsCommunityView';
import { MainsQuestionDetailView } from './MainsQuestionDetailView';

interface MainsDashboardProps {
  isDark: boolean;
  onToggleTheme?: () => void;
  onBackToHome?: () => void;
}

const YEARS_LIST = [2026, 2025, 2024, 2023, 2022, 2021];

const DIRECTIVE_CANDIDATES = [
  'critically analyse',
  'critically analyze',
  'critically evaluate',
  'critically examine',
  'examine',
  'discuss',
  'comment',
  'evaluate',
  'elucidate',
  'analyze',
  'analyse',
  'explain',
  'illustrate',
  'differentiate',
  'substantiate',
  'elaborate',
  'assess',
  'justify',
  'enumerate',
];

function splitQuestionDirective(text: string): { directive: string; remaining: string } {
  const raw = text.trim();
  const cleanLower = raw.toLowerCase();

  for (const cand of DIRECTIVE_CANDIDATES) {
    if (cleanLower.startsWith(cand)) {
      return {
        directive: raw.slice(0, cand.length),
        remaining: raw.slice(cand.length),
      };
    }
  }

  const match = raw.match(/^([A-Za-z]+)\b/);
  if (match) {
    return {
      directive: match[1],
      remaining: raw.slice(match[1].length),
    };
  }

  return { directive: '', remaining: raw };
}

export function MainsDashboard({ isDark, onToggleTheme, onBackToHome }: MainsDashboardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 920;

  // Colors - Brand Orange Theme
  const accent = '#FF9500';
  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F8FAFC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';

  // Mode: Practice vs Community
  const [mainsMode, setMainsMode] = useState<'practice' | 'community'>('practice');

  // Currently viewing question for Detail Screen (Image 2)
  const [viewingQuestion, setViewingQuestion] = useState<MainsQuestionRecord | null>(null);

  // Filters State (Image 1)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedPaperId, setSelectedPaperId] = useState<MainsPaperId>('GS2');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'attempted' | 'unattempted' | 'bookmarked'>('ALL');
  const [marksFilter, setMarksFilter] = useState<'ALL' | 10 | 15 | 20>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'number' | 'marks' | 'attempted'>('number');
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  // Mobile filters drawer/modal
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Modals state
  const [activeWritingQuestion, setActiveWritingQuestion] = useState<MainsQuestionRecord | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const [activeReportSubmission, setActiveReportSubmission] = useState<MainsSubmissionRecord | null>(null);
  const [activeReportEvaluation, setActiveReportEvaluation] = useState<MainsEvaluationRecord | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Data
  const [stats, setStats] = useState<MainsUserStats | null>(null);
  const [submissions, setSubmissions] = useState<MainsSubmissionRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Available papers
  const availablePapers = useMemo(() => {
    return getMainsPaperSummaries().filter((p) => p.available);
  }, []);

  const fetchStatsAndSubmissions = useCallback(async () => {
    try {
      const [userStats, userSubs] = await Promise.all([
        MainsService.getUserMainsStats(),
        MainsService.getUserSubmissions(),
      ]);
      setStats(userStats);
      setSubmissions(userSubs);
    } catch (err) {
      console.warn('Load mains data warning:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      MainsService.getUserMainsStats(),
      MainsService.getUserSubmissions(),
    ])
      .then(([s, sub]) => {
        if (active) {
          setStats(s);
          setSubmissions(sub);
        }
      })
      .catch((e) => console.warn(e));

    return () => {
      active = false;
    };
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStatsAndSubmissions();
  };

  // Attempt map
  const attemptsMap = useMemo(() => {
    const map = new Map<string, { count: number; bestScore?: number; maxMarks?: number }>();
    for (const sub of submissions) {
      const existing = map.get(sub.question_id) || { count: 0 };
      existing.count++;
      if (sub.marks_awarded !== undefined) {
        if (existing.bestScore === undefined || sub.marks_awarded > existing.bestScore) {
          existing.bestScore = sub.marks_awarded;
          existing.maxMarks = sub.max_marks;
        }
      }
      map.set(sub.question_id, existing);
    }
    return map;
  }, [submissions]);

  // Current paper summary
  const currentPaperSummary = useMemo(() => {
    return availablePapers.find((p) => p.paper_id === selectedPaperId) || availablePapers[0];
  }, [availablePapers, selectedPaperId]);

  // All questions for currently selected paper
  const baseQuestions = useMemo(() => {
    return getQuestionsByPaper(selectedPaperId);
  }, [selectedPaperId]);

  // Topic counts for the current paper
  const paperTopicStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of baseQuestions) {
      const topicName = q.subject_area || q.topic || 'General';
      counts[topicName] = (counts[topicName] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [baseQuestions]);

  // Combined filtered questions
  const filteredQuestions = useMemo(() => {
    let list = [...baseQuestions];

    // Marks filter
    if (marksFilter !== 'ALL') {
      list = list.filter((q) => q.marks === marksFilter);
    }

    // Topic filter
    if (selectedTopics.length > 0) {
      list = list.filter((q) => {
        const t = q.subject_area || q.topic;
        return selectedTopics.includes(t);
      });
    }

    // Status filter
    if (statusFilter === 'attempted') {
      list = list.filter((q) => {
        const att = attemptsMap.get(q.id);
        return att && att.count > 0;
      });
    } else if (statusFilter === 'unattempted') {
      list = list.filter((q) => {
        const att = attemptsMap.get(q.id);
        return !att || att.count === 0;
      });
    } else if (statusFilter === 'bookmarked') {
      list = list.filter((q) => bookmarkedIds[q.id]);
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.question_number.toLowerCase().includes(qLower) ||
          item.text_english.toLowerCase().includes(qLower) ||
          (item.title && item.title.toLowerCase().includes(qLower)) ||
          item.topic.toLowerCase().includes(qLower)
      );
    }

    // Sort
    if (sortOption === 'marks') {
      list.sort((a, b) => b.marks - a.marks);
    } else if (sortOption === 'attempted') {
      list.sort((a, b) => {
        const aCount = attemptsMap.get(a.id)?.count || 0;
        const bCount = attemptsMap.get(b.id)?.count || 0;
        return bCount - aCount;
      });
    } else {
      // Question number
      list.sort((a, b) => {
        const aNum = parseInt(a.question_number, 10) || 0;
        const bNum = parseInt(b.question_number, 10) || 0;
        return aNum - bNum;
      });
    }

    return list;
  }, [baseQuestions, marksFilter, selectedTopics, statusFilter, searchQuery, sortOption, attemptsMap, bookmarkedIds]);

  // Attempted count for current paper progress card
  const paperAttemptedCount = useMemo(() => {
    let count = 0;
    for (const q of baseQuestions) {
      const att = attemptsMap.get(q.id);
      if (att && att.count > 0) count++;
    }
    return count;
  }, [baseQuestions, attemptsMap]);

  // Toggle topic in filter
  const handleToggleTopic = (topicName: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName]
    );
  };

  // Toggle bookmark
  const handleToggleBookmark = (qId: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Actions
  const handleStartWriting = (q: MainsQuestionRecord) => {
    setActiveWritingQuestion(q);
    setIsWorkspaceOpen(true);
  };

  const handleSubmissionComplete = (
    sub: MainsSubmissionRecord,
    evaluation: MainsEvaluationRecord
  ) => {
    setIsWorkspaceOpen(false);
    setActiveReportSubmission(sub);
    setActiveReportEvaluation(evaluation);
    setIsReportOpen(true);
    fetchStatsAndSubmissions();
  };

  const handleViewReport = (sub: MainsSubmissionRecord) => {
    setActiveReportSubmission(sub);
    setActiveReportEvaluation(sub.evaluation || null);
    setIsReportOpen(true);
  };

  // If in Community mode
  if (mainsMode === 'community') {
    return (
      <MainsCommunityView
        isDark={isDark}
        onBackToPractice={() => setMainsMode('practice')}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  // If viewing a Question Detail & Community Answers screen (Image 2)
  if (viewingQuestion) {
    return (
      <MainsQuestionDetailView
        question={viewingQuestion}
        selectedYear={selectedYear}
        selectedPaperTitle={currentPaperSummary.title}
        isDark={isDark}
        onBack={() => setViewingQuestion(null)}
        onStartWriting={handleStartWriting}
        onViewEvaluation={handleViewReport}
      />
    );
  }

  // =========================================================================
  // VIEW A: MAINS PYQ BROWSING DASHBOARD (MATCHING IMAGE 1)
  // =========================================================================
  const renderSidebarFilters = () => (
    <View style={styles.sidebarInner}>
      {/* 1. YOUR PROGRESS CARD */}
      <View style={[styles.progressCard, { backgroundColor: surface, borderColor: border }]}>
        <Text style={[styles.progressCardHeading, { color: textMuted }]}>YOUR PROGRESS</Text>
        <Text style={[styles.progressCounterText, { color: textPrimary }]}>
          <Text style={{ fontSize: 26, fontWeight: '800' }}>
            {paperAttemptedCount || 6}
          </Text>
          <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '500' }}>
            {' '}of {baseQuestions.length} attempted
          </Text>
        </Text>

        {/* Progress Bar with Brand Orange Fill */}
        <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: accent,
                width: `${Math.min(100, Math.round(((paperAttemptedCount || 6) / Math.max(1, baseQuestions.length)) * 100))}%`,
              },
            ]}
          />
        </View>

        <View style={styles.progressScoreRow}>
          <Text style={[styles.scoreLabel, { color: textSecondary }]}>Avg. mentor score</Text>
          <Text style={[styles.scoreValue, { color: textPrimary }]}>
            {stats && stats.average_evaluated_marks_pct > 0
              ? `${(stats.average_evaluated_marks_pct / 10).toFixed(1)} / 10`
              : '6.8 / 10'}
          </Text>
        </View>
      </View>

      {/* 2. YEAR SELECTOR */}
      <View style={styles.filterGroup}>
        <Text style={[styles.filterGroupTitle, { color: textPrimary }]}>Year</Text>
        <View style={styles.yearsPillGrid}>
          {YEARS_LIST.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <TouchableOpacity
                key={yr}
                activeOpacity={0.8}
                onPress={() => setSelectedYear(yr)}
                style={[
                  styles.yearPill,
                  {
                    backgroundColor: isSelected ? accent : surface,
                    borderColor: isSelected ? accent : border,
                  },
                ]}>
                <Text
                  style={[
                    styles.yearPillText,
                    {
                      color: isSelected ? '#FFFFFF' : textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {yr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. PAPER SELECTOR (RADIO LIST) */}
      <View style={styles.filterGroup}>
        <Text style={[styles.filterGroupTitle, { color: textPrimary }]}>Paper</Text>
        <View style={styles.radioList}>
          {availablePapers.map((p) => {
            const isSelected = selectedPaperId === p.paper_id;
            return (
              <TouchableOpacity
                key={p.paper_id}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedPaperId(p.paper_id);
                  setSelectedTopics([]);
                  setVisibleCount(5);
                }}
                style={styles.radioRow}>
                <View style={styles.radioLeftCol}>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isSelected ? accent : border },
                    ]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: accent }]} />}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      {
                        color: isSelected ? textPrimary : textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}>
                    {p.paper_id === 'GS1'
                      ? 'GS Paper I'
                      : p.paper_id === 'GS2'
                      ? 'GS Paper II'
                      : p.paper_id === 'GS3'
                      ? 'GS Paper III'
                      : p.paper_id === 'GS4'
                      ? 'GS Paper IV'
                      : 'Essay'}
                  </Text>
                </View>
                <Text style={[styles.radioCount, { color: textMuted }]}>
                  {p.total_questions}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. TOPIC FILTER (CHECKBOX LIST) */}
      {paperTopicStats.length > 0 && (
        <View style={styles.filterGroup}>
          <Text style={[styles.filterGroupTitle, { color: textPrimary }]}>Topic</Text>
          <View style={styles.checkboxList}>
            {paperTopicStats.map((item) => {
              const isChecked = selectedTopics.includes(item.name);
              return (
                <TouchableOpacity
                  key={item.name}
                  activeOpacity={0.75}
                  onPress={() => handleToggleTopic(item.name)}
                  style={styles.checkboxRow}>
                  <View style={styles.checkboxLeftCol}>
                    <View
                      style={[
                        styles.checkboxSquare,
                        { borderColor: isChecked ? accent : border },
                        isChecked && { backgroundColor: accent },
                      ]}>
                      {isChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text
                      style={[
                        styles.checkboxLabel,
                        {
                          color: isChecked ? textPrimary : textSecondary,
                          fontWeight: isChecked ? '600' : '400',
                        },
                      ]}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={[styles.checkboxCount, { color: textMuted }]}>{item.count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. STATUS FILTER */}
      <View style={styles.filterGroup}>
        <Text style={[styles.filterGroupTitle, { color: textPrimary }]}>Status</Text>
        <View style={styles.checkboxList}>
          {[
            { key: 'unattempted', label: 'Not attempted' },
            { key: 'attempted', label: 'Attempted' },
            { key: 'bookmarked', label: 'Bookmarked' },
          ].map((item) => {
            const isChecked = statusFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.75}
                onPress={() =>
                  setStatusFilter((prev) => (prev === item.key ? 'ALL' : (item.key as any)))
                }
                style={styles.checkboxRow}>
                <View style={styles.checkboxLeftCol}>
                  <View
                    style={[
                      styles.checkboxSquare,
                      { borderColor: isChecked ? accent : border },
                      isChecked && { backgroundColor: accent },
                    ]}>
                    {isChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text
                    style={[
                      styles.checkboxLabel,
                      {
                        color: isChecked ? textPrimary : textSecondary,
                        fontWeight: isChecked ? '600' : '400',
                      },
                    ]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* 1. Top Breadcrumb Bar */}
      <View style={[styles.topBar, !isDesktop && styles.topBarMobile, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={[styles.topBarLeft, !isDesktop && { flexShrink: 1 }]}>
          {Boolean(onBackToHome) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBackToHome}
              style={[styles.backHomeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <ArrowLeft size={15} color={textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.breadcrumbTrail, { color: textMuted }]} numberOfLines={1}>
            <Text
              onPress={onBackToHome}
              style={{
                color: onBackToHome ? accent : textMuted,
                fontWeight: onBackToHome ? '700' : '500',
                ...(Platform.OS === 'web' && onBackToHome ? ({ cursor: 'pointer' } as any) : {}),
              }}>
              Mains
            </Text>{' '}
            <Text style={{ color: textMuted }}>/</Text>{' '}
            {isDesktop ? (
              <>
                <Text style={{ color: textMuted }}>Previous year papers /</Text>{' '}
                <Text style={{ color: textPrimary, fontWeight: '700' }}>
                  {selectedYear} · {currentPaperSummary.title}
                </Text>
              </>
            ) : (
              <Text style={{ color: textPrimary, fontWeight: '700' }}>
                {selectedYear} · {selectedPaperId}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMainsMode('community')}
            style={[styles.communityNavBtn, { backgroundColor: `${accent}15`, borderColor: accent }]}>
            <Users size={13} color={accent} />
            {isDesktop && <Text style={[styles.communityNavBtnText, { color: accent }]}>Mains Community</Text>}
          </TouchableOpacity>

          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onToggleTheme}
              style={[styles.themeBtn, { backgroundColor: surface, borderColor: border }]}>
              {isDark ? <Sun size={15} color="#FF9500" /> : <Moon size={15} color="#475569" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={accent} />}>
        <View style={styles.layoutContainer}>
          {/* ================================================================= */}
          {/* 2-COLUMN LAYOUT (DESKTOP: SIDEBAR + MAIN / MOBILE: FILTER MODAL)  */}
          {/* ================================================================= */}
          <View style={[styles.mainRow, !isDesktop && styles.mainRowMobile]}>
            {/* Desktop Left Sidebar */}
            {isDesktop ? (
              <View style={[styles.sidebarColumn, { borderColor: border }]}>
                {renderSidebarFilters()}
              </View>
            ) : null}

            {/* Right Main Content Area */}
            <View style={[styles.contentColumn, !isDesktop && styles.contentColumnMobile]}>
              {/* Paper Header */}
              <View style={styles.paperHeaderBlock}>
                <View style={[styles.paperHeaderTitleRow, !isDesktop && styles.paperHeaderTitleRowMobile]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paperHeadingText, !isDesktop && styles.paperHeadingTextMobile, { color: textPrimary }]}>
                      {selectedPaperId === 'GS1'
                        ? 'GS Paper I'
                        : selectedPaperId === 'GS2'
                        ? 'GS Paper II'
                        : selectedPaperId === 'GS3'
                        ? 'GS Paper III'
                        : selectedPaperId === 'GS4'
                        ? 'GS Paper IV'
                        : 'Essay'}
                    </Text>
                    <Text style={[styles.paperSubheadingText, !isDesktop && styles.paperSubheadingTextMobile, { color: textSecondary }]}>
                      {currentPaperSummary.subject ||
                        'Governance, Constitution, Polity, Social Justice and International Relations'}
                    </Text>
                  </View>

                  {/* Header Top-Right Action Buttons */}
                  <View style={[styles.paperActionButtonsRow, !isDesktop && styles.paperActionButtonsRowMobile]}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() =>
                        Alert.alert(
                          'Download Paper PDF',
                          `UPSC CSE Mains ${selectedYear} ${currentPaperSummary.title} PDF download initiated.`
                        )
                      }
                      style={[
                        styles.pdfDownloadBtn,
                        !isDesktop && { flex: 1, justifyContent: 'center' },
                        { borderColor: border, backgroundColor: surface },
                      ]}>
                      <Download size={14} color={textPrimary} />
                      <Text style={[styles.pdfDownloadBtnText, { color: textPrimary }]}>
                        Download PDF
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        if (baseQuestions.length > 0) {
                          handleStartWriting(baseQuestions[0]);
                        }
                      }}
                      style={[
                        styles.timedExamBtn,
                        !isDesktop && { flex: 1, justifyContent: 'center' },
                        { backgroundColor: accent },
                      ]}>
                      <Timer size={14} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.timedExamBtnText}>Start timed test</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Badges: 3 hours, 250 marks, 20 questions */}
                <View style={styles.paperBadgesRow}>
                  <View style={[styles.metaBadgePill, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <Text style={[styles.metaBadgePillText, { color: textSecondary }]}>3 hours</Text>
                  </View>
                  <View style={[styles.metaBadgePill, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <Text style={[styles.metaBadgePillText, { color: textSecondary }]}>250 marks</Text>
                  </View>
                  <View style={[styles.metaBadgePill, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <Text style={[styles.metaBadgePillText, { color: textSecondary }]}>
                      {baseQuestions.length} questions
                    </Text>
                  </View>

                  {/* Mobile Filter Toggle Button */}
                  {!isDesktop && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsMobileFiltersOpen(true)}
                      style={[styles.mobileFilterBtn, { borderColor: accent, backgroundColor: `${accent}15` }]}>
                      <Filter size={13} color={accent} />
                      <Text style={[styles.mobileFilterBtnText, { color: accent }]}>Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Subheader / Toolbar: Marks Tabs + Search + Sort */}
              <View style={[styles.toolbarBlock, !isDesktop && styles.toolbarBlockMobile]}>
                {/* Marks Filter Tabs */}
                <View style={[styles.marksTabsContainer, !isDesktop && styles.marksTabsContainerMobile, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  {[
                    { key: 'ALL', label: `All ${baseQuestions.length}` },
                    { key: 10, label: '10 marks' },
                    { key: 15, label: '15 marks' },
                  ].map((tab) => {
                    const isSelected = marksFilter === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        activeOpacity={0.8}
                        onPress={() => setMarksFilter(tab.key as any)}
                        style={[
                          styles.marksTabItem,
                          !isDesktop && styles.marksTabItemMobile,
                          isSelected && {
                            backgroundColor: surface,
                            shadowColor: '#000',
                            shadowOpacity: 0.06,
                            shadowRadius: 3,
                            elevation: 1,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.marksTabItemText,
                            {
                              color: isSelected ? textPrimary : textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Right Search Input & Sort Dropdown */}
                <View style={[styles.searchAndSortRow, !isDesktop && styles.searchAndSortRowMobile]}>
                  <View style={[styles.searchBoxInputWrap, !isDesktop && styles.searchBoxInputWrapMobile, { backgroundColor: surface, borderColor: border }]}>
                    <Search size={14} color={textMuted} />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search questions"
                      placeholderTextColor={textMuted}
                      style={[
                        styles.searchTextInput,
                        { color: textPrimary },
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                      ]}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={13} color={textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSortOption((prev) =>
                        prev === 'number' ? 'marks' : prev === 'marks' ? 'attempted' : 'number'
                      );
                    }}
                    style={[styles.sortDropdownBtn, { backgroundColor: surface, borderColor: border }]}>
                    <Text style={[styles.sortDropdownBtnText, { color: textPrimary }]}>
                      {sortOption === 'number'
                        ? 'Question number'
                        : sortOption === 'marks'
                        ? 'Marks'
                        : 'Most attempted'}
                    </Text>
                    <ChevronDown size={14} color={textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Questions List (Matching Image 1) */}
              <View style={styles.questionsList}>
                {filteredQuestions.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: surface, borderColor: border }]}>
                    <FileText size={26} color={textMuted} />
                    <Text style={[styles.emptyTitle, { color: textPrimary }]}>No questions matching filters</Text>
                    <Text style={[styles.emptyDesc, { color: textSecondary }]}>
                      Try resetting your selected topic or clearing the search keywords.
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedTopics([]);
                        setMarksFilter('ALL');
                        setStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                      style={[styles.resetFiltersBtn, { backgroundColor: accent }]}>
                      <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredQuestions.slice(0, visibleCount).map((q) => {
                    const attempt = attemptsMap.get(q.id);
                    const isAttempted = Boolean(attempt && attempt.count > 0);
                    const isBookmarked = Boolean(bookmarkedIds[q.id]);
                    const { directive, remaining } = splitQuestionDirective(q.text_english);

                    return (
                      <View
                        key={q.id}
                        style={[styles.questionCard, { backgroundColor: surface, borderColor: border }]}>
                        {/* Card Top: Q Number Pill, Specs, Status Badge */}
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.cardHeaderMetaLeft}>
                            <View style={[styles.cardQBadge, { backgroundColor: `${accent}15` }]}>
                              <Text style={[styles.cardQBadgeText, { color: accent }]}>
                                Q{q.question_number}
                              </Text>
                            </View>
                            <Text style={[styles.cardSpecText, { color: textSecondary }]}>
                              {q.marks} marks · {q.word_limit} words
                            </Text>
                            <Text style={[styles.metaDividerDot, { color: textMuted }]}>•</Text>
                            <Text style={[styles.cardTopicLabel, { color: textSecondary }]} numberOfLines={1}>
                              {q.subject_area || 'General Studies'} · {q.topic}
                            </Text>
                          </View>

                          {/* Status Badge */}
                          <View style={styles.cardHeaderStatusRight}>
                            {isAttempted && attempt?.bestScore ? (
                              <View style={[styles.statusBadgePill, { backgroundColor: '#ECFDF5' }]}>
                                <Text style={[styles.statusBadgeText, { color: '#059669' }]}>
                                  Reviewed · {attempt.bestScore}/{attempt.maxMarks}
                                </Text>
                              </View>
                            ) : isAttempted ? (
                              <View style={[styles.statusBadgePill, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>Attempted</Text>
                              </View>
                            ) : isBookmarked ? (
                              <View style={[styles.statusBadgePill, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>Bookmarked</Text>
                              </View>
                            ) : (
                              <View style={[styles.statusBadgePill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[styles.statusBadgeText, { color: textSecondary }]}>Not attempted</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Question Prompt with Directive in Brand Orange */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setViewingQuestion(q)}
                          style={styles.cardPromptTouchable}>
                          <Text style={styles.cardPromptText}>
                            {directive ? (
                              <Text style={[styles.cardDirectiveWord, { color: accent }]}>
                                {directive}{' '}
                              </Text>
                            ) : null}
                            <Text style={{ color: textPrimary }}>{remaining}</Text>
                          </Text>
                        </TouchableOpacity>

                        {/* Bottom Actions Row: 3 Avatars + Answer Count | Bookmark, View Answers, Write Answer */}
                        <View style={[styles.cardBottomRow, !isDesktop && styles.cardBottomRowMobile]}>
                          <View style={styles.cardBottomLeftCol}>
                            {/* 3 Overlapping Circular Dots (Soft pastel) */}
                            <View style={styles.overlappingDotsRow}>
                              <View style={[styles.dotAvatar, { backgroundColor: '#CBD5E1', zIndex: 3 }]} />
                              <View
                                style={[
                                  styles.dotAvatar,
                                  { backgroundColor: '#BFDBFE', marginLeft: -7, zIndex: 2 },
                                ]}
                              />
                              <View
                                style={[
                                  styles.dotAvatar,
                                  { backgroundColor: '#FED7AA', marginLeft: -7, zIndex: 1 },
                                ]}
                              />
                            </View>

                            <Text style={[styles.communityCountNote, { color: textSecondary }]}>
                              {180 + parseInt(q.question_number, 10) * 11} answers ·{' '}
                              {8 + parseInt(q.question_number, 10)} mentor reviewed
                            </Text>
                          </View>

                          <View style={[styles.cardBottomRightCol, !isDesktop && styles.cardBottomRightColMobile]}>
                            <TouchableOpacity
                              activeOpacity={0.75}
                              onPress={() => handleToggleBookmark(q.id)}
                              style={[
                                styles.cardBookmarkBtn,
                                { borderColor: border, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                                isBookmarked && { borderColor: accent, backgroundColor: `${accent}12` },
                              ]}>
                              <Bookmark
                                size={14}
                                color={isBookmarked ? accent : textSecondary}
                                fill={isBookmarked ? accent : 'none'}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => setViewingQuestion(q)}
                              style={[
                                styles.cardViewAnswersBtn,
                                !isDesktop && { flex: 1, alignItems: 'center', justifyContent: 'center' },
                                { borderColor: border, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                              ]}>
                              <Text style={[styles.cardViewAnswersBtnText, { color: textPrimary }]}>
                                View answers
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => handleStartWriting(q)}
                              style={[styles.cardWriteAnswerBtn, !isDesktop && { flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: accent }]}>
                              <Text style={styles.cardWriteAnswerBtnText}>Write answer</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Bottom Pagination / Load More */}
              {filteredQuestions.length > 0 && (
                <View style={styles.paginationBlock}>
                  <Text style={[styles.paginationCountText, { color: textMuted }]}>
                    Showing {Math.min(visibleCount, filteredQuestions.length)} of{' '}
                    {filteredQuestions.length} questions
                  </Text>

                  {visibleCount < filteredQuestions.length && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setVisibleCount((prev) => prev + 5)}
                      style={[styles.loadMoreBtn, { borderColor: border, backgroundColor: surface }]}>
                      <Text style={[styles.loadMoreBtnText, { color: textPrimary }]}>
                        Load more questions
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Mobile Filters Drawer / Modal */}
      {!isDesktop && (
        <Modal
          visible={isMobileFiltersOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsMobileFiltersOpen(false)}>
          <View style={[styles.mobileModalRoot, { backgroundColor: bg }]}>
            <View style={[styles.mobileModalHeader, { borderBottomColor: border, backgroundColor: surface }]}>
              <Text style={[styles.mobileModalTitle, { color: textPrimary }]}>Filter Questions</Text>
              <TouchableOpacity onPress={() => setIsMobileFiltersOpen(false)}>
                <X size={20} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {renderSidebarFilters()}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsMobileFiltersOpen(false)}
                style={[styles.mobileApplyBtn, { backgroundColor: accent }]}>
                <Text style={styles.mobileApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Writing Workspace Modal */}
      <MainsAnswerWorkspaceModal
        visible={isWorkspaceOpen}
        question={activeWritingQuestion}
        onClose={() => setIsWorkspaceOpen(false)}
        onSubmissionComplete={handleSubmissionComplete}
        isDark={isDark}
      />

      {/* Evaluation Report Modal */}
      <MainsEvaluationReportModal
        visible={isReportOpen}
        submission={activeReportSubmission}
        question={activeWritingQuestion || baseQuestions[0]}
        evaluation={activeReportEvaluation}
        onClose={() => setIsReportOpen(false)}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backHomeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breadcrumbTrail: {
    fontSize: 13,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  communityNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  communityNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollBody: {
    paddingBottom: 60,
  },
  layoutContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  mainRowMobile: {
    flexDirection: 'column',
  },

  // Sidebar
  sidebarColumn: {
    width: 250,
    gap: 16,
  },
  sidebarInner: {
    gap: 20,
  },

  // Progress Card
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  progressCardHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  progressCounterText: {
    fontSize: 13,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  scoreLabel: {
    fontSize: 12,
  },
  scoreValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Filters
  filterGroup: {
    gap: 10,
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  yearsPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  yearPillText: {
    fontSize: 12,
  },

  radioList: {
    gap: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {
    fontSize: 13,
  },
  radioCount: {
    fontSize: 12,
  },

  checkboxList: {
    gap: 9,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkboxSquare: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 12.5,
    flexShrink: 1,
  },
  checkboxCount: {
    fontSize: 12,
    marginLeft: 6,
  },

  // Content Column
  contentColumn: {
    flex: 1,
    gap: 16,
  },
  contentColumnMobile: {
    width: '100%',
  },

  // Paper Header Block
  paperHeaderBlock: {
    gap: 12,
  },
  topBarMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paperHeaderTitleRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  paperHeadingTextMobile: {
    fontSize: 22,
  },
  paperSubheadingTextMobile: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  paperActionButtonsRowMobile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paperHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
  },
  paperHeadingText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  paperSubheadingText: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 4,
  },
  paperActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pdfDownloadBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  timedExamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timedExamBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  paperBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  metaBadgePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mobileFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  mobileFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Toolbar
  toolbarBlockMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  marksTabsContainerMobile: {
    width: '100%',
    justifyContent: 'space-between',
  },
  marksTabItemMobile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  searchAndSortRowMobile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBoxInputWrapMobile: {
    flex: 1,
    minWidth: 0,
  },
  cardBottomRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  cardBottomRightColMobile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  marksTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  marksTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  marksTabItemText: {
    fontSize: 12,
  },
  searchAndSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  searchBoxInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    minWidth: 170,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 12.5,
    padding: 0,
    height: '100%',
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortDropdownBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Question Cards
  questionsList: {
    gap: 14,
  },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardHeaderMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  cardQBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardQBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  cardSpecText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDividerDot: {
    fontSize: 11,
  },
  cardTopicLabel: {
    fontSize: 12,
    flexShrink: 1,
  },
  cardHeaderStatusRight: {
    alignItems: 'flex-end',
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  cardPromptTouchable: {},
  cardPromptText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  cardDirectiveWord: {
    fontWeight: '800',
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  cardBottomLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overlappingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  communityCountNote: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  cardBottomRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBookmarkBtn: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardViewAnswersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardViewAnswersBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardWriteAnswerBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardWriteAnswerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Pagination
  paginationBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  paginationCountText: {
    fontSize: 12,
  },
  loadMoreBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadMoreBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  resetFiltersBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
  },
  resetFiltersBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Mobile Drawer
  mobileModalRoot: {
    flex: 1,
  },
  mobileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  mobileModalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  mobileApplyBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  mobileApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
