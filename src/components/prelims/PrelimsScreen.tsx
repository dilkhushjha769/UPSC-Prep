import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  PRELIMS_SUBJECTS,
  PRELIMS_GS1_SUBJECTS,
  PRELIMS_CSAT_SUBJECTS,
  getChapterQuestions,
  getAllQuestionsForSubject,
} from '@/data/prelimsData';
import { Subject, Chapter, PYQQuestion, QuizConfig } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';
import { MaxContentWidth, BottomTabInset, Spacing } from '@/constants/theme';

import { PrelimsHeader } from '@/components/prelims/PrelimsHeader';
import { QuizGeneratorCard } from '@/components/prelims/QuizGeneratorCard';
import { SubjectCard } from '@/components/prelims/SubjectCard';
import { SubjectChaptersView } from '@/components/prelims/SubjectChaptersView';
import { ChapterDetailView } from '@/components/prelims/ChapterDetailView';
import { PracticeModal } from '@/components/prelims/PracticeModal';
import { QuizModal } from '@/components/prelims/QuizModal';
import { QuizGeneratorModal } from '@/components/prelims/QuizGeneratorModal';

export function PrelimsScreen({ onBack }: { onBack?: () => void } = {}) {
  // Navigation states:
  // selectedSubject: null = Subjects List; Subject = viewing that subject
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // selectedChapterForDetail: null = Subject Chapters List; Chapter = Full-screen Chapter Detail
  const [selectedChapterForDetail, setSelectedChapterForDetail] = useState<Chapter | null>(null);
  const [selectedChapterSerial, setSelectedChapterSerial] = useState<number | undefined>(undefined);

  // Paper filter tab: 'all' | 'gs1' | 'gs2'
  const [selectedPaperTab, setSelectedPaperTab] = useState<'all' | 'gs1' | 'gs2'>('all');

  // Practice modal state
  const [practiceModalVisible, setPracticeModalVisible] = useState(false);
  const [practiceChapter, setPracticeChapter] = useState<Chapter | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PYQQuestion[]>([]);

  // Quiz modal state
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizTitle, setQuizTitle] = useState('UPSC Prelims Mock');
  const [quizQuestions, setQuizQuestions] = useState<PYQQuestion[]>([]);
  const [quizDuration, setQuizDuration] = useState(15);

  // Generator modal state
  const [generatorModalVisible, setGeneratorModalVisible] = useState(false);

  // Chapter Click Handler: opens chapter detail in full screen
  const handleOpenChapterDetail = (chapter: Chapter, serialNumber: number) => {
    setSelectedChapterForDetail(chapter);
    setSelectedChapterSerial(serialNumber);
  };

  // Chapter Action Handlers
  const handlePracticeChapter = (chapter: Chapter) => {
    const qs = getChapterQuestions(chapter);
    setPracticeChapter(chapter);
    setPracticeQuestions(qs);
    setPracticeModalVisible(true);
  };

  const handleQuizChapter = (chapter: Chapter, count?: number, duration?: number) => {
    const allQs = getChapterQuestions(chapter);
    const chosenCount = count ? Math.min(count, allQs.length) : allQs.length;
    const finalQs = allQs.slice(0, chosenCount);
    const chosenDuration = duration || Math.max(5, Math.round(finalQs.length * 1.5));

    setQuizTitle(`${chapter.title} (${finalQs.length} Qs)`);
    setQuizQuestions(finalQs);
    setQuizDuration(chosenDuration);
    setQuizModalVisible(true);
  };

  // Quick subject quiz from chapterwise page
  const handleGenerateSubjectQuiz = (subject: Subject) => {
    const qs = getAllQuestionsForSubject(subject.id).slice(0, 15);
    setQuizTitle(`${subject.shortTitle} Mock Test`);
    setQuizQuestions(qs);
    setQuizDuration(20);
    setQuizModalVisible(true);
  };

  // Launch Generated Quiz
  const handleLaunchGeneratedQuiz = (config: QuizConfig) => {
    let sourcePool: PYQQuestion[] = [];
    if (config.subjectId) {
      sourcePool = getAllQuestionsForSubject(config.subjectId);
    } else {
      sourcePool = PRELIMS_SUBJECTS.flatMap((s) => getAllQuestionsForSubject(s.id));
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {selectedSubject === null ? (
            /* VIEW 1: Main Prelims Page with Vertical Subject List */
            <>
              {/* Clean Header */}
              <PrelimsHeader onBack={onBack} />

              {/* Simple "Generate Quiz" Card at top */}
              <QuizGeneratorCard onOpenGenerator={() => setGeneratorModalVisible(true)} />

              {/* Subject Paper Filter Pills */}
              <View style={styles.filterTabsContainer}>
                <Pressable
                  style={[
                    styles.filterTab,
                    selectedPaperTab === 'all' && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedPaperTab('all')}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedPaperTab === 'all' && styles.filterTabTextActive,
                    ]}
                  >
                    All ({PRELIMS_SUBJECTS.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterTab,
                    selectedPaperTab === 'gs1' && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedPaperTab('gs1')}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedPaperTab === 'gs1' && styles.filterTabTextActive,
                    ]}
                  >
                    GS1 ({PRELIMS_GS1_SUBJECTS.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterTab,
                    selectedPaperTab === 'gs2' && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedPaperTab('gs2')}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedPaperTab === 'gs2' && styles.filterTabTextActive,
                    ]}
                  >
                    GS-2 (CSAT) ({PRELIMS_CSAT_SUBJECTS.length})
                  </Text>
                </Pressable>
              </View>

              {/* Vertical List of Subjects organized under GS1 and GS-2 (CSAT) */}
              <View style={styles.subjectsList}>
                {/* 1. GS1 Section */}
                {(selectedPaperTab === 'all' || selectedPaperTab === 'gs1') && (
                  <View style={styles.paperSection}>
                    <View style={styles.paperHeader}>
                      <View style={styles.paperTitleRow}>
                        <View style={styles.paperBadge}>
                          <Text style={styles.paperBadgeText}>PAPER I</Text>
                        </View>
                        <Text style={styles.paperTitle}>GS1</Text>
                        <Text style={styles.paperDivider}>·</Text>
                        <Text style={styles.paperSubtitle}>General Studies</Text>
                      </View>
                      <Text style={styles.paperMetaText}>
                        {PRELIMS_GS1_SUBJECTS.length} Subjects · 100 Questions
                      </Text>
                    </View>

                    {PRELIMS_GS1_SUBJECTS.map((subject, index) => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        serialNumber={index + 1}
                        onPress={(sub) => {
                          setSelectedSubject(sub);
                          setSelectedChapterForDetail(null);
                        }}
                      />
                    ))}
                  </View>
                )}

                {/* 2. GS-2 (CSAT) Section */}
                {(selectedPaperTab === 'all' || selectedPaperTab === 'gs2') && (
                  <View
                    style={[
                      styles.paperSection,
                      selectedPaperTab === 'all' && styles.paperSectionSpacing,
                    ]}
                  >
                    <View style={styles.paperHeader}>
                      <View style={styles.paperTitleRow}>
                        <View style={styles.paperBadge}>
                          <Text style={styles.paperBadgeText}>PAPER II</Text>
                        </View>
                        <Text style={styles.paperTitle}>GS-2 (CSAT)</Text>
                        <Text style={styles.paperDivider}>·</Text>
                        <Text style={styles.paperSubtitle}>Aptitude Test</Text>
                      </View>
                      <Text style={styles.paperMetaText}>
                        {PRELIMS_CSAT_SUBJECTS.length} Subjects · 80 Questions · Qualifying (33%)
                      </Text>
                    </View>

                    {PRELIMS_CSAT_SUBJECTS.map((subject, index) => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        serialNumber={index + 1}
                        onPress={(sub) => {
                          setSelectedSubject(sub);
                          setSelectedChapterForDetail(null);
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : selectedChapterForDetail === null ? (
            /* VIEW 2: Dedicated Chapterwise List Page for Selected Subject */
            <SubjectChaptersView
              subject={selectedSubject}
              serialNumber={
                (selectedSubject.paper === 'GS2'
                  ? PRELIMS_CSAT_SUBJECTS.findIndex((s) => s.id === selectedSubject.id)
                  : PRELIMS_GS1_SUBJECTS.findIndex((s) => s.id === selectedSubject.id)) + 1
              }
              onBack={() => setSelectedSubject(null)}
              onSelectChapter={handleOpenChapterDetail}
              onGenerateSubjectQuiz={handleGenerateSubjectQuiz}
            />
          ) : (
            /* VIEW 3: FULL SCREEN Dedicated Chapter Detail Page */
            <ChapterDetailView
              chapter={selectedChapterForDetail}
              subject={selectedSubject}
              serialNumber={selectedChapterSerial}
              onBack={() => setSelectedChapterForDetail(null)}
              onStartPractice={handlePracticeChapter}
              onStartQuiz={handleQuizChapter}
            />
          )}

          <View style={{ height: BottomTabInset + Spacing.four }} />
        </View>
      </ScrollView>

      {/* Interactive Practice & Quiz Modals */}
      <PracticeModal
        visible={practiceModalVisible}
        chapter={practiceChapter}
        questions={practiceQuestions}
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
        subjects={PRELIMS_SUBJECTS}
        onClose={() => setGeneratorModalVisible(false)}
        onGenerateQuiz={handleLaunchGeneratedQuiz}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PrelimsTheme.colors.bgCanvas,
  },
  scrollView: {
    flex: 1,
    backgroundColor: PrelimsTheme.colors.bgCanvas,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  filterTabActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subjectsList: {
    paddingTop: 0,
  },
  paperSection: {
    marginBottom: 6,
  },
  paperSectionSpacing: {
    marginTop: 18,
  },
  paperHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  paperTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paperBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    includeFontPadding: false,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  paperDivider: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A1A1AA',
    includeFontPadding: false,
  },
  paperSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
    includeFontPadding: false,
  },
  paperMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 2,
    includeFontPadding: false,
  },
});

