import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Moon,
  RotateCcw,
  Search,
  Sun,
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
  getPaperTaxonomy,
} from '@/data/mainsQuestionRepository';
import { MainsService } from '@/services/mainsService';
import { MainsQuestionDetailModal } from './MainsQuestionDetailModal';
import { MainsAnswerWorkspaceModal } from './MainsAnswerWorkspaceModal';
import { MainsEvaluationReportModal } from './MainsEvaluationReportModal';
import { MainsCommunityView } from './community/MainsCommunityView';

interface MainsDashboardProps {
  isDark: boolean;
  onToggleTheme?: () => void;
  onBackToHome?: () => void;
}

export function MainsDashboard({ isDark, onToggleTheme }: MainsDashboardProps) {
  // Mode: Practice vs Community
  const [mainsMode, setMainsMode] = useState<'practice' | 'community'>('practice');

  // Navigation & Filter state
  const [selectedPaperId, setSelectedPaperId] = useState<MainsPaperId>('GS4');
  const [searchQuery, setSearchQuery] = useState('');

  // Rich Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CASE_STUDIES' | 'THEORY'>('ALL');
  const [marksFilter, setMarksFilter] = useState<'ALL' | 10 | 15 | 20>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'attempted' | 'unattempted'>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modals state
  const [selectedQuestion, setSelectedQuestion] = useState<MainsQuestionRecord | null>(null);
  const [isQuestionDetailOpen, setIsQuestionDetailOpen] = useState(false);

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

  // Taxonomy for current paper
  const taxonomy = useMemo(() => {
    return getPaperTaxonomy(selectedPaperId);
  }, [selectedPaperId]);

  // Questions for currently selected paper & all combined filters
  const questionsForPaper = useMemo(() => {
    let list = getQuestionsByPaper(selectedPaperId);

    // Type filter
    if (typeFilter === 'CASE_STUDIES') {
      list = list.filter((q) => q.is_case_study);
    } else if (typeFilter === 'THEORY') {
      list = list.filter((q) => !q.is_case_study);
    }

    // Marks filter
    if (marksFilter !== 'ALL') {
      list = list.filter((q) => q.marks === marksFilter);
    }

    // Attempt status filter
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
    }

    // Topic filter
    if (topicFilter !== 'ALL') {
      list = list.filter((q) => q.subject_area === topicFilter || q.topic === topicFilter);
    }

    // Search query filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.question_number.toLowerCase().includes(q) ||
          item.text_english.toLowerCase().includes(q) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          item.topic.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedPaperId, typeFilter, marksFilter, statusFilter, topicFilter, searchQuery, attemptsMap]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'ALL') count++;
    if (marksFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (topicFilter !== 'ALL') count++;
    return count;
  }, [typeFilter, marksFilter, statusFilter, topicFilter]);

  const handleClearAllFilters = () => {
    setTypeFilter('ALL');
    setMarksFilter('ALL');
    setStatusFilter('ALL');
    setTopicFilter('ALL');
    setSearchQuery('');
  };

  // Actions
  const handleOpenQuestion = (q: MainsQuestionRecord) => {
    setSelectedQuestion(q);
    setIsQuestionDetailOpen(true);
  };

  const handleStartWriting = (q: MainsQuestionRecord) => {
    setIsQuestionDetailOpen(false);
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
    setSelectedQuestion({
      id: sub.question_id,
      paper_id: sub.paper_id,
      paper_title: sub.paper_id,
      paper_code: `${sub.paper_id}-2026`,
      year: 2026,
      exam: 'Civil Services (Main) Examination',
      section_name: 'Section A',
      section_code: 'SECTION A',
      question_number: sub.question_number,
      text_english: sub.question_title,
      marks: sub.max_marks,
      word_limit: 150,
      subject_area: 'General Studies',
      topic: 'Practice',
      is_case_study: sub.question_number.includes('7') || sub.question_number.includes('8') || sub.max_marks >= 20,
    });
    setIsReportOpen(true);
  };

  const currentPaperSummary = availablePapers.find((p) => p.paper_id === selectedPaperId) || availablePapers[0];

  // Design Tokens
  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  if (mainsMode === 'community') {
    return (
      <MainsCommunityView
        isDark={isDark}
        onBackToPractice={() => setMainsMode('practice')}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* 1. App Header with Mains Practice & Community Switch */}
      <View style={[styles.headerBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Mains Answer Writing</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Official UPSC PYQs • Strict Rubric AI Evaluation
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMainsMode('community')}
            style={[styles.communityNavBtn, { backgroundColor: `${accent}15`, borderColor: accent }]}>
            <Users size={13} color={accent} />
            <Text style={[styles.communityNavBtnText, { color: accent }]}>Mains Community</Text>
          </TouchableOpacity>

          {onToggleTheme && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[styles.themeBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
              {isDark ? <Sun size={15} color="#FF9500" /> : <Moon size={15} color="#FF9500" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={accent} />}>
        <View style={styles.contentWrap}>
          {/* 2. Glanceable Metrics Strip */}
          <View style={[styles.metricsStrip, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.metricCell}>
              <Text style={[styles.metricNumber, { color: textPrimary }]}>
                {stats?.total_questions_available || 87}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Available</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: borderSubtle }]} />

            <View style={styles.metricCell}>
              <Text style={[styles.metricNumber, { color: '#10B981' }]}>
                {stats?.total_attempted || 0}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Attempted</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: borderSubtle }]} />

            <View style={styles.metricCell}>
              <Text style={[styles.metricNumber, { color: accent }]}>
                {stats && stats.average_evaluated_marks_pct > 0 ? `${stats.average_evaluated_marks_pct}%` : '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Avg Score</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: borderSubtle }]} />

            <View style={styles.metricCell}>
              <Text style={[styles.metricNumber, { color: '#3B82F6' }]}>
                {stats?.total_pending || 0}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Pending</Text>
            </View>
          </View>

          {/* 3. Paper Switcher (Figma Segmented Pills) */}
          <View style={styles.segmentedSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.segmentedScroll}>
              {availablePapers.map((p) => {
                const isSelected = p.paper_id === selectedPaperId;
                const shortLabel =
                  p.paper_id === 'ESSAY'
                    ? 'Essay'
                    : p.paper_id === 'GS4'
                    ? 'GS IV (Ethics)'
                    : p.paper_id === 'GS1'
                    ? 'GS I'
                    : p.paper_id === 'GS2'
                    ? 'GS II'
                    : 'GS III';

                return (
                  <TouchableOpacity
                    key={p.paper_id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedPaperId(p.paper_id);
                      setTypeFilter('ALL');
                      setMarksFilter('ALL');
                      setStatusFilter('ALL');
                      setTopicFilter('ALL');
                    }}
                    style={[
                      styles.segmentedPill,
                      {
                        backgroundColor: isSelected ? accent : surface,
                        borderColor: isSelected ? accent : border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.segmentedPillText,
                        {
                          color: isSelected ? '#FFFFFF' : textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {shortLabel}
                    </Text>
                    <View
                      style={[
                        styles.pillCountBadge,
                        {
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : surfaceSubtle,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.pillCountText,
                          { color: isSelected ? '#FFFFFF' : textMuted },
                        ]}>
                        {p.total_questions}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 4. Search & Filter Bar with Filter Modal Trigger */}
          <View style={styles.filterControlRow}>
            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: surface, borderColor: border }]}>
              <Search size={15} color={textMuted} />
              <TextInput
                placeholder="Search by topic, keyword, or question number..."
                placeholderTextColor={textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={14} color={textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsFilterModalOpen(true)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: activeFiltersCount > 0 ? (isDark ? 'rgba(245, 130, 53, 0.16)' : '#FFF3EB') : surface,
                  borderColor: activeFiltersCount > 0 ? accent : border,
                },
              ]}>
              <Filter size={15} color={activeFiltersCount > 0 ? accent : textPrimary} />
              <Text
                style={[
                  styles.filterBtnText,
                  {
                    color: activeFiltersCount > 0 ? accent : textPrimary,
                    fontWeight: activeFiltersCount > 0 ? '700' : '600',
                  },
                ]}>
                Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Active Filter Pills Strip (Dismissable) */}
          {(activeFiltersCount > 0 || searchQuery.length > 0) && (
            <View style={styles.activePillsStrip}>
              {typeFilter !== 'ALL' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setTypeFilter('ALL')}
                  style={[styles.activePillTag, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Text style={[styles.activePillTagText, { color: textPrimary }]}>
                    {typeFilter === 'CASE_STUDIES' ? 'Case Studies' : 'Theory'}
                  </Text>
                  <X size={12} color={textMuted} />
                </TouchableOpacity>
              )}

              {marksFilter !== 'ALL' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMarksFilter('ALL')}
                  style={[styles.activePillTag, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Text style={[styles.activePillTagText, { color: textPrimary }]}>
                    {marksFilter} Marks
                  </Text>
                  <X size={12} color={textMuted} />
                </TouchableOpacity>
              )}

              {statusFilter !== 'ALL' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setStatusFilter('ALL')}
                  style={[styles.activePillTag, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Text style={[styles.activePillTagText, { color: textPrimary }]}>
                    {statusFilter === 'attempted' ? 'Attempted' : 'Unattempted'}
                  </Text>
                  <X size={12} color={textMuted} />
                </TouchableOpacity>
              )}

              {topicFilter !== 'ALL' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setTopicFilter('ALL')}
                  style={[styles.activePillTag, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Text style={[styles.activePillTagText, { color: textPrimary }]} numberOfLines={1}>
                    {topicFilter}
                  </Text>
                  <X size={12} color={textMuted} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClearAllFilters}
                style={styles.clearAllBtn}>
                <RotateCcw size={11} color={accent} />
                <Text style={[styles.clearAllBtnText, { color: accent }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Paper Header Details */}
          <View style={styles.feedHeaderRow}>
            <View>
              <Text style={[styles.feedTitle, { color: textPrimary }]}>
                {currentPaperSummary.title}
              </Text>
              <Text style={[styles.feedSub, { color: textSecondary }]}>
                {questionsForPaper.length} questions matching criteria
              </Text>
            </View>
          </View>

          {/* 5. Questions Feed */}
          <View style={styles.questionsFeed}>
            {questionsForPaper.length === 0 ? (
              <View style={[styles.emptyStateCard, { backgroundColor: surface, borderColor: border }]}>
                <FileText size={28} color={textMuted} />
                <Text style={[styles.emptyStateTitle, { color: textPrimary }]}>No questions found</Text>
                <Text style={[styles.emptyStateSub, { color: textSecondary }]}>
                  Try resetting the filter or clearing the search query.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleClearAllFilters}
                  style={[styles.clearSearchBtn, { borderColor: border }]}>
                  <Text style={[styles.clearSearchBtnText, { color: accent }]}>Reset All Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              questionsForPaper.map((q) => {
                const attempt = attemptsMap.get(q.id);
                const hasAttempted = Boolean(attempt && attempt.count > 0);

                return (
                  <TouchableOpacity
                    key={q.id}
                    activeOpacity={0.85}
                    onPress={() => handleOpenQuestion(q)}
                    style={[styles.questionCard, { backgroundColor: surface, borderColor: border }]}>
                    {/* Card Top: Badges */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.qNumberPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                          <Text style={[styles.qNumberText, { color: accent }]}>Q.{q.question_number}</Text>
                        </View>
                        <Text style={[styles.specText, { color: textSecondary }]}>
                          {q.marks} Marks • {q.word_limit} words
                        </Text>
                        {q.is_case_study && (
                          <View style={[styles.caseStudyBadge, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : '#F3E8FF' }]}>
                            <Text style={styles.caseStudyBadgeText}>Case Study</Text>
                          </View>
                        )}
                      </View>

                      {hasAttempted && (
                        <View style={[styles.scorePill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                          <CheckCircle2 size={12} color="#10B981" />
                          <Text style={styles.scorePillText}>
                            Score: {attempt!.bestScore}/{attempt!.maxMarks}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Question Body */}
                    <View style={styles.cardBody}>
                      {q.title && (
                        <Text style={[styles.cardTitle, { color: textPrimary }]}>{q.title}</Text>
                      )}
                      <Text style={[styles.cardPrompt, { color: isDark ? '#CBD5E1' : '#334155' }]} numberOfLines={2}>
                        {q.text_english}
                      </Text>
                    </View>

                    {/* Card Footer */}
                    <View style={[styles.cardFooter, { borderTopColor: borderSubtle }]}>
                      <Text style={[styles.topicTag, { color: textMuted }]} numberOfLines={1}>
                        {q.topic}
                      </Text>
                      <View style={styles.writeButtonRow}>
                        <Text style={[styles.writeButtonText, { color: accent }]}>
                          {hasAttempted ? 'Review / Re-attempt' : 'Write Answer'}
                        </Text>
                        <ChevronRight size={14} color={accent} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* 6. Recent Submissions Section */}
          {submissions.length > 0 && (
            <View style={[styles.historyCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.historyHeader}>
                <View style={styles.historyHeaderLeft}>
                  <Clock size={16} color={accent} />
                  <Text style={[styles.historyTitle, { color: textPrimary }]}>
                    Recent Submissions
                  </Text>
                </View>
                <Text style={[styles.historyCountText, { color: textSecondary }]}>
                  {submissions.length} attempted
                </Text>
              </View>

              <View style={styles.historyList}>
                {submissions.slice(0, 3).map((sub) => {
                  const marks = sub.marks_awarded;
                  const marksPct = marks !== undefined ? (marks / sub.max_marks) * 100 : 0;
                  const marksColor = marksPct >= 55 ? '#10B981' : marksPct >= 45 ? '#F59E0B' : '#EF4444';

                  return (
                    <TouchableOpacity
                      key={sub.id}
                      activeOpacity={0.75}
                      onPress={() => handleViewReport(sub)}
                      style={[styles.historyRow, { borderBottomColor: borderSubtle }]}>
                      <View style={styles.historyRowLeft}>
                        <View style={styles.historyRowTags}>
                          <Text style={[styles.historyPaperTag, { color: accent }]}>{sub.paper_id}</Text>
                          <Text style={[styles.historyQNum, { color: textSecondary }]}>Q.{sub.question_number}</Text>
                          <Text style={[styles.historyMode, { color: textMuted }]}>
                            • {sub.submission_mode === 'handwritten' ? 'Handwritten' : `${sub.word_count}w`}
                          </Text>
                        </View>
                        <Text style={[styles.historyPromptTitle, { color: textPrimary }]} numberOfLines={1}>
                          {sub.question_title}
                        </Text>
                      </View>

                      <View style={styles.historyRowRight}>
                        {marks !== undefined ? (
                          <View style={styles.historyScoreBox}>
                            <Text style={[styles.historyScoreNum, { color: marksColor }]}>{marks}</Text>
                            <Text style={[styles.historyScoreMax, { color: textMuted }]}>/{sub.max_marks}</Text>
                          </View>
                        ) : (
                          <Text style={[styles.historyEvaluating, { color: accent }]}>Evaluating...</Text>
                        )}
                        <ChevronRight size={14} color={textMuted} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 7. Comprehensive Filter Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalCard, { backgroundColor: surface, borderColor: border }]}>
            {/* Modal Header */}
            <View style={[styles.filterModalHeader, { borderBottomColor: borderSubtle }]}>
              <View style={styles.filterModalHeaderLeft}>
                <Filter size={18} color={accent} />
                <Text style={[styles.filterModalTitle, { color: textPrimary }]}>Filter Questions</Text>
              </View>
              <View style={styles.filterModalHeaderRight}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClearAllFilters}
                  style={styles.resetModalBtn}>
                  <Text style={[styles.resetModalBtnText, { color: accent }]}>Reset All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsFilterModalOpen(false)}
                  style={[styles.closeModalBtn, { backgroundColor: surfaceSubtle }]}>
                  <X size={16} color={textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
              {/* Filter 1: Question Type (Theory vs Case Studies) */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterGroupLabel, { color: textSecondary }]}>Question Type</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'ALL', label: 'All Types' },
                    { id: 'THEORY', label: 'Theory (Sec A)' },
                    { id: 'CASE_STUDIES', label: 'Case Studies (Sec B)' },
                  ].map((opt) => {
                    const isSelected = typeFilter === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.8}
                        onPress={() => setTypeFilter(opt.id as any)}
                        style={[
                          styles.filterOptionPill,
                          {
                            backgroundColor: isSelected ? accent : surfaceSubtle,
                            borderColor: isSelected ? accent : border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.filterOptionPillText,
                            { color: isSelected ? '#FFFFFF' : textPrimary, fontWeight: isSelected ? '700' : '500' },
                          ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 2: Marks */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterGroupLabel, { color: textSecondary }]}>Marks Allocation</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'ALL', label: 'All Marks' },
                    { id: 10, label: '10 Marks (150w)' },
                    { id: 15, label: '15 Marks (250w)' },
                    { id: 20, label: '20 Marks (Case Study)' },
                  ].map((opt) => {
                    const isSelected = marksFilter === opt.id;
                    return (
                      <TouchableOpacity
                        key={String(opt.id)}
                        activeOpacity={0.8}
                        onPress={() => setMarksFilter(opt.id as any)}
                        style={[
                          styles.filterOptionPill,
                          {
                            backgroundColor: isSelected ? accent : surfaceSubtle,
                            borderColor: isSelected ? accent : border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.filterOptionPillText,
                            { color: isSelected ? '#FFFFFF' : textPrimary, fontWeight: isSelected ? '700' : '500' },
                          ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 3: Attempt Status */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterGroupLabel, { color: textSecondary }]}>Attempt Status</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'ALL', label: 'All Questions' },
                    { id: 'attempted', label: 'Attempted' },
                    { id: 'unattempted', label: 'Unattempted' },
                  ].map((opt) => {
                    const isSelected = statusFilter === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.8}
                        onPress={() => setStatusFilter(opt.id as any)}
                        style={[
                          styles.filterOptionPill,
                          {
                            backgroundColor: isSelected ? accent : surfaceSubtle,
                            borderColor: isSelected ? accent : border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.filterOptionPillText,
                            { color: isSelected ? '#FFFFFF' : textPrimary, fontWeight: isSelected ? '700' : '500' },
                          ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 4: Subject Area / Topic */}
              {taxonomy.subjectAreas.length > 0 && (
                <View style={styles.filterGroup}>
                  <Text style={[styles.filterGroupLabel, { color: textSecondary }]}>
                    Subject Area / Module ({taxonomy.subjectAreas.length})
                  </Text>
                  <View style={styles.filterOptionsGrid}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setTopicFilter('ALL')}
                      style={[
                        styles.filterOptionPill,
                        {
                          backgroundColor: topicFilter === 'ALL' ? accent : surfaceSubtle,
                          borderColor: topicFilter === 'ALL' ? accent : border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.filterOptionPillText,
                          { color: topicFilter === 'ALL' ? '#FFFFFF' : textPrimary, fontWeight: topicFilter === 'ALL' ? '700' : '500' },
                        ]}>
                        All Modules
                      </Text>
                    </TouchableOpacity>

                    {taxonomy.subjectAreas.map((sa) => {
                      const isSelected = topicFilter === sa.name;
                      return (
                        <TouchableOpacity
                          key={sa.name}
                          activeOpacity={0.8}
                          onPress={() => setTopicFilter(sa.name)}
                          style={[
                            styles.filterOptionPill,
                            {
                              backgroundColor: isSelected ? accent : surfaceSubtle,
                              borderColor: isSelected ? accent : border,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.filterOptionPillText,
                              { color: isSelected ? '#FFFFFF' : textPrimary, fontWeight: isSelected ? '700' : '500' },
                            ]}>
                            {sa.name} ({sa.questionCount})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer CTA */}
            <View style={[styles.filterModalFooter, { borderTopColor: borderSubtle }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.applyFilterBtn, { backgroundColor: accent }]}>
                <Text style={styles.applyFilterBtnText}>
                  Show {questionsForPaper.length} Question{questionsForPaper.length === 1 ? '' : 's'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <MainsQuestionDetailModal
        visible={isQuestionDetailOpen}
        onClose={() => setIsQuestionDetailOpen(false)}
        question={selectedQuestion}
        onStartWriting={handleStartWriting}
        onViewEvaluation={handleViewReport}
        isDark={isDark}
      />

      <MainsAnswerWorkspaceModal
        visible={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        question={activeWritingQuestion}
        onSubmissionComplete={handleSubmissionComplete}
        isDark={isDark}
      />

      <MainsEvaluationReportModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        submission={activeReportSubmission}
        question={selectedQuestion}
        evaluation={activeReportEvaluation}
        onReattempt={() => {
          setIsReportOpen(false);
          if (selectedQuestion) {
            handleStartWriting(selectedQuestion);
          }
        }}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  communityNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Scroll body & container
  scrollBody: { padding: 16, paddingBottom: 64 },
  contentWrap: { maxWidth: 860, alignSelf: 'center', width: '100%', gap: 16 },

  // Metrics strip
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricNumber: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  metricLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  metricDivider: { width: 1, height: 26 },

  // Segmented Paper Tabs
  segmentedSection: { paddingVertical: 2 },
  segmentedScroll: { gap: 8, paddingRight: 8 },
  segmentedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  segmentedPillText: { fontSize: 13 },
  pillCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pillCountText: { fontSize: 10, fontWeight: '700' },

  // Search & Filter row
  filterControlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: 12 },

  // Active Pills Strip
  activePillsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -4,
  },
  activePillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  activePillTagText: { fontSize: 11, fontWeight: '600', maxWidth: 150 },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearAllBtnText: { fontSize: 11, fontWeight: '700' },

  // Feed header
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  feedTitle: { fontSize: 15, fontWeight: '700' },
  feedSub: { fontSize: 12 },

  // Questions Feed & Cards
  questionsFeed: { gap: 12 },
  emptyStateCard: {
    padding: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyStateTitle: { fontSize: 15, fontWeight: '700' },
  emptyStateSub: { fontSize: 12, textAlign: 'center', maxWidth: 280 },
  clearSearchBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearSearchBtnText: { fontSize: 12, fontWeight: '600' },

  // Question Card
  questionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qNumberPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  qNumberText: { fontSize: 11, fontWeight: '800' },
  specText: { fontSize: 11, fontWeight: '600' },
  caseStudyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  caseStudyBadgeText: { color: '#8B5CF6', fontSize: 10, fontWeight: '700' },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scorePillText: { color: '#10B981', fontSize: 11, fontWeight: '700' },

  // Card Body
  cardBody: { gap: 3 },
  cardTitle: { fontSize: 13, fontWeight: '700' },
  cardPrompt: { fontSize: 13.5, lineHeight: 21 },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  topicTag: { fontSize: 11, flex: 1, marginRight: 12 },
  writeButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  writeButtonText: { fontSize: 12, fontWeight: '700' },

  // History Card
  historyCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTitle: { fontSize: 14, fontWeight: '700' },
  historyCountText: { fontSize: 11 },
  historyList: { gap: 8 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  historyRowLeft: { flex: 1, marginRight: 12, gap: 2 },
  historyRowTags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyPaperTag: { fontSize: 11, fontWeight: '800' },
  historyQNum: { fontSize: 11, fontWeight: '600' },
  historyMode: { fontSize: 11 },
  historyPromptTitle: { fontSize: 12, fontWeight: '500' },
  historyRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyScoreBox: { flexDirection: 'row', alignItems: 'baseline' },
  historyScoreNum: { fontSize: 13, fontWeight: '800' },
  historyScoreMax: { fontSize: 11 },
  historyEvaluating: { fontSize: 11, fontWeight: '600' },

  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterModalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterModalTitle: { fontSize: 17, fontWeight: '800' },
  filterModalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resetModalBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  resetModalBtnText: { fontSize: 13, fontWeight: '700' },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalBody: { padding: 20 },
  filterGroup: { marginBottom: 20 },
  filterGroupLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOptionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterOptionPillText: { fontSize: 12 },
  filterModalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyFilterBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
