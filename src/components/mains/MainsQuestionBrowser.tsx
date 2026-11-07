import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Dice5,
  Layers,
  Search,
  Tag,
} from 'lucide-react-native';
import {
  MainsPaperId,
  MainsPracticeMode,
  MainsQuestionRecord,
  MainsSubmissionRecord,
} from '@/types/mains';
import {
  getMainsPaperSummaries,
  getPaperTaxonomy,
  getQuestionsByPaper,
  getQuestionsBySection,
  getQuestionsByTopic,
  getQuestionsByYear,
  getRandomMainsQuestion,
} from '@/data/mainsQuestionRepository';

interface MainsQuestionBrowserProps {
  initialPaperId?: MainsPaperId;
  initialMode?: MainsPracticeMode;
  onSelectQuestion: (question: MainsQuestionRecord) => void;
  onBack: () => void;
  userSubmissions: MainsSubmissionRecord[];
  isDark: boolean;
}

export function MainsQuestionBrowser({
  initialPaperId = 'GS4',
  initialMode = 'paper',
  onSelectQuestion,
  onBack,
  userSubmissions,
  isDark,
}: MainsQuestionBrowserProps) {
  const [selectedPaperId, setSelectedPaperId] = useState<MainsPaperId>(initialPaperId);
  const [activeMode, setActiveMode] = useState<MainsPracticeMode>(initialMode);

  // Filters
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<'ALL' | 'SECTION A' | 'SECTION B' | 'theories' | 'case_studies'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');

  const papers = useMemo(() => getMainsPaperSummaries(), []);
  const currentPaper = papers.find((p) => p.paper_id === selectedPaperId) || papers[0];

  // Subject areas and topics for current paper
  const taxonomy = useMemo(() => getPaperTaxonomy(selectedPaperId), [selectedPaperId]);

  // Map of question attempts
  const attemptsMap = useMemo(() => {
    const map = new Map<string, { count: number; bestScore?: number; maxMarks?: number }>();
    for (const sub of userSubmissions) {
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
  }, [userSubmissions]);

  // Compute filtered questions list
  const filteredQuestions = useMemo(() => {
    let list: MainsQuestionRecord[] = [];

    if (activeMode === 'topic') {
      const area = selectedSubjectArea === 'ALL' ? undefined : selectedSubjectArea;
      const top = selectedTopic === 'ALL' ? undefined : selectedTopic;
      list = getQuestionsByTopic(selectedPaperId, area, top);
    } else if (activeMode === 'section') {
      if (selectedSection === 'ALL') {
        list = getQuestionsByPaper(selectedPaperId);
      } else {
        list = getQuestionsBySection(selectedPaperId, selectedSection);
      }
    } else if (activeMode === 'year') {
      list = getQuestionsByYear(selectedYear, selectedPaperId);
    } else {
      // 'paper' default mode
      list = getQuestionsByPaper(selectedPaperId);
    }

    // Apply search query filter if typed
    if (searchQuery.trim().length > 0) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter(
        (q) =>
          q.question_number.toLowerCase().includes(qLower) ||
          q.text_english.toLowerCase().includes(qLower) ||
          (q.title && q.title.toLowerCase().includes(qLower)) ||
          q.topic.toLowerCase().includes(qLower) ||
          q.subject_area.toLowerCase().includes(qLower)
      );
    }

    return list;
  }, [
    activeMode,
    selectedPaperId,
    selectedSubjectArea,
    selectedTopic,
    selectedSection,
    selectedYear,
    searchQuery,
  ]);

  // Random question trigger
  const handleRandomQuestion = () => {
    const q = getRandomMainsQuestion({
      paperId: selectedPaperId,
      isCaseStudy: selectedSection === 'case_studies' ? true : selectedSection === 'theories' ? false : undefined,
    });
    if (q) {
      onSelectQuestion(q);
    }
  };

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const cardBg = isDark ? '#141C28' : '#FFFFFF';
  const cardBorder = isDark ? '#253244' : '#EAE5DC';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#9DA8B9' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={18} color={textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>{currentPaper.title}</Text>
            <Text style={[styles.headerSub, { color: textSecondary }]}>
              {currentPaper.paper_code} • {filteredQuestions.length} Questions
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRandomQuestion}
          style={[styles.randomBtn, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)' }]}>
          <Dice5 size={16} color={accent} />
          <Text style={[styles.randomBtnText, { color: accent }]}>Random Question</Text>
        </TouchableOpacity>
      </View>

      {/* Practice Mode Selector Pills */}
      <View style={[styles.modeBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeScroll}>
          {[
            { id: 'paper' as MainsPracticeMode, label: 'Mode B: Paper-wise', icon: BookOpen },
            { id: 'topic' as MainsPracticeMode, label: 'Mode A: Topic-wise', icon: Tag },
            { id: 'section' as MainsPracticeMode, label: 'Mode C: Section-wise', icon: Layers },
            { id: 'year' as MainsPracticeMode, label: 'Mode D: Year-wise', icon: Calendar },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.8}
                onPress={() => setActiveMode(m.id)}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: isActive ? accent : isDark ? '#1E293B' : '#F1F5F9',
                  },
                ]}>
                <Icon size={14} color={isActive ? '#FFFFFF' : textSecondary} />
                <Text style={[styles.modePillText, { color: isActive ? '#FFFFFF' : textPrimary }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Secondary Filter Drilldowns */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        {/* Paper Selector Dropdown / Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paperPillsScroll}>
          {papers.map((p) => {
            const isSelected = p.paper_id === selectedPaperId;
            return (
              <TouchableOpacity
                key={p.paper_id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedPaperId(p.paper_id);
                  setSelectedSubjectArea('ALL');
                  setSelectedTopic('ALL');
                }}
                style={[
                  styles.paperPill,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(245, 130, 53, 0.15)'
                        : 'rgba(245, 130, 53, 0.1)'
                      : 'transparent',
                    borderColor: isSelected ? accent : cardBorder,
                  },
                ]}>
                <Text
                  style={[
                    styles.paperPillText,
                    {
                      color: isSelected ? accent : textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {p.paper_id} ({p.total_questions})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Mode A: Topic Drilldowns */}
        {activeMode === 'topic' && taxonomy.subjectAreas.length > 0 && (
          <View style={styles.topicDrilldownRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drilldownScroll}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSubjectArea('ALL');
                  setSelectedTopic('ALL');
                }}
                style={[
                  styles.drillPill,
                  {
                    backgroundColor: selectedSubjectArea === 'ALL' ? (isDark ? '#253244' : '#E2E8F0') : 'transparent',
                    borderColor: cardBorder,
                  },
                ]}>
                <Text style={[styles.drillPillText, { color: textPrimary }]}>All Areas</Text>
              </TouchableOpacity>

              {taxonomy.subjectAreas.map((sa) => (
                <TouchableOpacity
                  key={sa.name}
                  onPress={() => {
                    setSelectedSubjectArea(sa.name);
                    setSelectedTopic('ALL');
                  }}
                  style={[
                    styles.drillPill,
                    {
                      backgroundColor: selectedSubjectArea === sa.name ? (isDark ? '#253244' : '#E2E8F0') : 'transparent',
                      borderColor: cardBorder,
                    },
                  ]}>
                  <Text style={[styles.drillPillText, { color: textPrimary }]}>
                    {sa.name} ({sa.questionCount})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mode C: Section Drilldowns */}
        {activeMode === 'section' && (
          <View style={styles.topicDrilldownRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drilldownScroll}>
              {[
                { id: 'ALL', label: 'All Questions' },
                { id: 'theories', label: 'Section A: Theoretical Questions' },
                { id: 'case_studies', label: 'Section B: Case Studies' },
              ].map((sec) => (
                <TouchableOpacity
                  key={sec.id}
                  onPress={() => setSelectedSection(sec.id as any)}
                  style={[
                    styles.drillPill,
                    {
                      backgroundColor: selectedSection === sec.id ? (isDark ? '#253244' : '#E2E8F0') : 'transparent',
                      borderColor: cardBorder,
                    },
                  ]}>
                  <Text style={[styles.drillPillText, { color: textPrimary }]}>{sec.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mode D: Year Drilldown */}
        {activeMode === 'year' && (
          <View style={styles.topicDrilldownRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drilldownScroll}>
              {[2026, 2025, 2024, 2023].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => setSelectedYear(yr)}
                  style={[
                    styles.drillPill,
                    {
                      backgroundColor: selectedYear === yr ? (isDark ? '#253244' : '#E2E8F0') : 'transparent',
                      borderColor: cardBorder,
                    },
                  ]}>
                  <Text style={[styles.drillPillText, { color: textPrimary }]}>{yr} PYQs</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Search size={15} color={textMuted} />
          <TextInput
            placeholder="Search questions by keyword, topic, or question number..."
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearSearchText, { color: textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Questions List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {filteredQuestions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <BookOpen size={32} color={textMuted} />
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No questions found</Text>
              <Text style={[styles.emptySub, { color: textSecondary }]}>
                Try selecting a different filter or paper.
              </Text>
            </View>
          ) : (
            filteredQuestions.map((q) => {
              const attempt = attemptsMap.get(q.id);
              const hasAttempted = Boolean(attempt && attempt.count > 0);

              return (
                <TouchableOpacity
                  key={q.id}
                  activeOpacity={0.8}
                  onPress={() => onSelectQuestion(q)}
                  style={[styles.questionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  {/* Top Meta Row */}
                  <View style={styles.qCardTopRow}>
                    <View style={styles.qCardTopLeft}>
                      <View style={[styles.qNumBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.qNumBadgeText, { color: accent }]}>Q.{q.question_number}</Text>
                      </View>
                      <View style={[styles.marksBadge, { borderColor: cardBorder }]}>
                        <Text style={[styles.marksBadgeText, { color: textSecondary }]}>
                          {q.marks} Marks • {q.word_limit}w
                        </Text>
                      </View>
                      {q.is_case_study && (
                        <View style={[styles.caseBadge, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF' }]}>
                          <Text style={[styles.caseBadgeText, { color: '#8B5CF6' }]}>Case Study</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.qCardTopRight}>
                      {hasAttempted ? (
                        <View style={styles.attemptedBadge}>
                          <CheckCircle2 size={13} color="#10B981" />
                          <Text style={styles.attemptedText}>
                            {attempt!.count}x {attempt!.bestScore !== undefined ? `• ${attempt!.bestScore}/${attempt!.maxMarks}` : ''}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.unattemptedBadge, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                          <Text style={[styles.unattemptedText, { color: textMuted }]}>Unattempted</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Question Content / Title */}
                  <View style={styles.qCardBody}>
                    {q.title && (
                      <Text style={[styles.qCardTitle, { color: textPrimary }]}>{q.title}</Text>
                    )}
                    <Text style={[styles.qCardText, { color: textPrimary }]} numberOfLines={3}>
                      {q.text_english}
                    </Text>
                  </View>

                  {/* Bottom Tags Row */}
                  <View style={styles.qCardBottomRow}>
                    <View style={styles.tagsLeft}>
                      <View style={[styles.tagPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.tagPillText, { color: textSecondary }]}>{q.subject_area}</Text>
                      </View>
                      <View style={[styles.tagPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.tagPillText, { color: textSecondary }]} numberOfLines={1}>
                          {q.topic}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionPromptRow}>
                      <Text style={[styles.actionPromptText, { color: accent }]}>Attempt</Text>
                      <ChevronRight size={15} color={accent} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  randomBtnText: { fontSize: 12, fontWeight: '700' },
  modeBar: { borderBottomWidth: 1, paddingVertical: 10 },
  modeScroll: { paddingHorizontal: 16, gap: 8 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modePillText: { fontSize: 12, fontWeight: '600' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  paperPillsScroll: { gap: 8 },
  paperPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  paperPillText: { fontSize: 12 },
  topicDrilldownRow: { marginTop: 2 },
  drilldownScroll: { gap: 8 },
  drillPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  drillPillText: { fontSize: 12, fontWeight: '500' },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(150,150,150,0.08)',
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  clearSearchText: { fontSize: 11, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 60 },
  listContainer: { maxWidth: 900, alignSelf: 'center', width: '100%', gap: 12 },
  emptyCard: {
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13 },
  questionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  qCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qNumBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  qNumBadgeText: { fontSize: 12, fontWeight: '800' },
  marksBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  marksBadgeText: { fontSize: 11, fontWeight: '600' },
  caseBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  caseBadgeText: { fontSize: 11, fontWeight: '700' },
  qCardTopRight: {},
  attemptedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attemptedText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  unattemptedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  unattemptedText: { fontSize: 11 },
  qCardBody: { gap: 4 },
  qCardTitle: { fontSize: 14, fontWeight: '700' },
  qCardText: { fontSize: 13, lineHeight: 21 },
  qCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  tagsLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, maxWidth: 220 },
  tagPillText: { fontSize: 11 },
  actionPromptRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 10 },
  actionPromptText: { fontSize: 12, fontWeight: '700' },
});

