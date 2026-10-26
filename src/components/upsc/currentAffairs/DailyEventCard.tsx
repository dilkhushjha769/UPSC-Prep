import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Check,
  BookOpen,
} from '@/components/common/LucideIcons';
import { DailyEventItem } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';
import { generateEventRecallQuestions } from '@/services/eventRecallService';

interface DailyEventCardProps {
  event: DailyEventItem;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onOpenDetail: (event: DailyEventItem) => void;
  onAddNote: (event: DailyEventItem) => void;
  onPractiseQuestion?: (event: DailyEventItem) => void;
  isDark: boolean;
  onPrevEvent?: () => void;
  onNextEvent?: () => void;
  onSelectEvent?: (index: number) => void;
  onOpenDailyRecall?: () => void;
  hasPrevEvent?: boolean;
  hasNextEvent?: boolean;
  eventIndex?: number;
  totalEvents?: number;
}

export function DailyEventCard({
  event,
  isBookmarked,
  onToggleBookmark,
  onOpenDetail,
  onAddNote,
  onPractiseQuestion,
  isDark,
  onPrevEvent,
  onNextEvent,
  onSelectEvent,
  onOpenDailyRecall,
  hasPrevEvent,
  hasNextEvent,
  eventIndex,
  totalEvents,
}: DailyEventCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  // Horizontal Section Switcher Tab State: 'takeaways' | 'matrix' | 'recall' | null (starts closed)
  const [activeSectionTab, setActiveSectionTab] = useState<'takeaways' | 'matrix' | 'recall' | null>(null);

  const toggleSectionTab = (tab: 'takeaways' | 'matrix' | 'recall') => {
    setActiveSectionTab((prev) => (prev === tab ? null : tab));
  };

  // Active Recall Questions & User Responses (Gemini AI generated)
  const recallQuestions = useMemo(() => generateEventRecallQuestions(event), [event]);
  const [recallAnswers, setRecallAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  const correctCount = useMemo(() => {
    return recallQuestions.reduce((acc, q) => {
      return recallAnswers[q.id] === q.correctAnswer ? acc + 1 : acc;
    }, 0);
  }, [recallQuestions, recallAnswers]);

  // Normalize paper format (e.g. GS-II -> GS2, GS-III -> GS3)
  const normalizedPaper = useMemo(() => {
    if (!event.paper) return '';
    return event.paper
      .replace('GS-IV', 'GS4')
      .replace('GS-III', 'GS3')
      .replace('GS-II', 'GS2')
      .replace('GS-I', 'GS1');
  }, [event.paper]);

  return (
    <View style={styles.card}>
      {/* ======================================================== */}
      {/* A. EVENT IDENTIFICATION                                   */}
      {/* ======================================================== */}
      <View style={styles.identificationRow}>
        <View style={styles.idMetaGroup}>
          <View style={styles.paperBadge}>
            <Text style={styles.paperBadgeText}>
              {normalizedPaper ? `${normalizedPaper} · ${event.category}` : event.category}
            </Text>
          </View>
          <Text style={styles.dotSeparator}>·</Text>
          <Text style={styles.sourceDateText}>{event.source} · {event.date}</Text>
        </View>

        {/* Small Add Note Button and Bookmark Option at Top */}
        <View style={styles.idActionsGroup}>
          <Pressable
            style={({ pressed }: any) => [
              styles.topSmallNoteBtn,
              pressed && styles.sectionTabBtnPressed,
            ]}
            onPress={() => onAddNote(event)}
            accessibilityLabel="Add note for this event"
            hitSlop={4}
          >
            <FileText size={11} color={isDark ? '#94A3B8' : '#475569'} strokeWidth={1.8} />
            <Text style={styles.topSmallNoteBtnText}>Add Note</Text>
          </Pressable>

          <Pressable
            style={({ pressed }: any) => [
              styles.bookmarkAction,
              pressed && styles.sectionTabBtnPressed,
            ]}
            onPress={() => onToggleBookmark(event.id)}
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark this event'}
            hitSlop={6}
          >
            <Bookmark
              size={15}
              color={isBookmarked ? (isDark ? '#38BDF8' : '#0F172A') : (isDark ? '#64748B' : theme.textMuted)}
              fill={isBookmarked ? (isDark ? '#38BDF8' : '#0F172A') : 'none'}
              strokeWidth={1.8}
            />
          </Pressable>
        </View>
      </View>

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* B. HEADLINE AND OVERVIEW WITH ACCENT BACKGROUND           */}
      {/* ======================================================== */}
      <Text style={styles.headline}>{event.headline}</Text>

      {event.summary ? (
        <View style={styles.summaryOverviewCard}>
          <View style={styles.summaryOverviewHeader}>
            <View style={styles.summaryOverviewBar} />
            <Text style={styles.summaryOverviewTag}>EXECUTIVE BRIEF</Text>
          </View>
          <Text style={styles.summaryOverview}>{event.summary}</Text>
        </View>
      ) : null}

      {/* ======================================================== */}
      {/* C. ACTION & ACTIVE RECALL BUTTONS (ROW 1 & ROW 2)        */}
      {/* ======================================================== */}
      <View style={styles.cardButtonBlock}>
        {/* ROW 1: Key Takeaways, Prelims Facts, Full Analysis */}
        <View style={styles.cardBtnRow1} accessibilityRole="tablist">
          {/* 1. Key Takeaways */}
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Key Takeaways"
            accessibilityState={{ selected: activeSectionTab === 'takeaways' }}
            style={({ pressed, hovered }: any) => [
              styles.row1Btn,
              hovered && !activeSectionTab && styles.sectionTabBtnHover,
              pressed && styles.sectionTabBtnPressed,
              activeSectionTab === 'takeaways' && styles.sectionTabBtnActiveTakeaways,
            ]}
            onPress={() => toggleSectionTab('takeaways')}
          >
            <ListChecks
              size={13}
              color={
                activeSectionTab === 'takeaways'
                  ? (isDark ? '#60A5FA' : '#1D4ED8')
                  : (isDark ? '#CBD5E1' : '#475569')
              }
              strokeWidth={1.8}
            />
            <Text
              style={[
                styles.sectionTabBtnText,
                activeSectionTab === 'takeaways' && styles.sectionTabBtnTextActiveTakeaways,
              ]}
              numberOfLines={1}
            >
              {isDesktop ? 'Key Takeaways' : 'Takeaways'}
            </Text>
            <View
              style={[
                styles.tabCountBadge,
                activeSectionTab === 'takeaways' && styles.tabCountBadgeActiveTakeaways,
              ]}
            >
              <Text
                style={[
                  styles.tabCountBadgeText,
                  activeSectionTab === 'takeaways' && styles.tabCountBadgeTextActiveTakeaways,
                ]}
              >
                {event.bullets.length}
              </Text>
            </View>
          </Pressable>

          {/* 2. Prelims Facts */}
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Prelims Facts"
            accessibilityState={{ selected: activeSectionTab === 'matrix' }}
            style={({ pressed, hovered }: any) => [
              styles.row1Btn,
              hovered && !activeSectionTab && styles.sectionTabBtnHover,
              pressed && styles.sectionTabBtnPressed,
              activeSectionTab === 'matrix' && styles.sectionTabBtnActiveMatrix,
            ]}
            onPress={() => toggleSectionTab('matrix')}
          >
            <ShieldCheck
              size={13}
              color={
                activeSectionTab === 'matrix'
                  ? (isDark ? '#4ADE80' : '#047857')
                  : (isDark ? '#CBD5E1' : '#475569')
              }
              strokeWidth={1.8}
            />
            <Text
              style={[
                styles.sectionTabBtnText,
                activeSectionTab === 'matrix' && styles.sectionTabBtnTextActiveMatrix,
              ]}
              numberOfLines={1}
            >
              {isDesktop ? 'Prelims Facts' : 'Facts'}
            </Text>
            <View
              style={[
                styles.tabCountBadge,
                activeSectionTab === 'matrix' && styles.tabCountBadgeActiveMatrix,
              ]}
            >
              <Text
                style={[
                  styles.tabCountBadgeText,
                  activeSectionTab === 'matrix' && styles.tabCountBadgeTextActiveMatrix,
                ]}
              >
                {event.prelimsFactMatrix ? event.prelimsFactMatrix.length : (event.prelimsFacts?.length || 0)}
              </Text>
            </View>
          </Pressable>

          {/* 3. Full Analysis */}
          <Pressable
            style={({ pressed, hovered }: any) => [
              styles.row1Btn,
              hovered && styles.sectionTabBtnHover,
              pressed && styles.sectionTabBtnPressed,
            ]}
            onPress={() => onOpenDetail(event)}
            accessibilityLabel="Open Full Analysis"
          >
            <BookOpen
              size={13}
              color={isDark ? '#CBD5E1' : '#475569'}
              strokeWidth={1.8}
            />
            <Text style={styles.sectionTabBtnText} numberOfLines={1}>
              {isDesktop ? 'Full Analysis' : 'Analysis'}
            </Text>
          </Pressable>
        </View>

        {/* ROW 2 (next line): Daily Recall & Recall the Event (More Visible!) */}
        <View style={styles.cardBtnRow2}>
          {/* Daily Recall */}
          <Pressable
            style={({ pressed, hovered }: any) => [
              styles.prominentRecallBtn,
              styles.dailyRecallProminentBtn,
              hovered && styles.prominentRecallBtnHover,
              pressed && styles.sectionTabBtnPressed,
            ]}
            onPress={onOpenDailyRecall}
            accessibilityLabel="Open Daily Active Recall (10 Questions)"
          >
            <Sparkles size={14} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.2} />
            <Text style={styles.dailyRecallProminentText} numberOfLines={1}>
              Daily Recall
            </Text>
            <View style={styles.dailyRecallProminentBadge}>
              <Text style={styles.dailyRecallProminentBadgeText}>10 Qs</Text>
            </View>
          </Pressable>

          {/* Recall the Event */}
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Recall the Event"
            accessibilityState={{ selected: activeSectionTab === 'recall' }}
            style={({ pressed, hovered }: any) => [
              styles.prominentRecallBtn,
              styles.eventRecallProminentBtn,
              activeSectionTab === 'recall' && styles.eventRecallProminentBtnActive,
              hovered && styles.prominentRecallBtnHover,
              pressed && styles.sectionTabBtnPressed,
            ]}
            onPress={() => toggleSectionTab('recall')}
          >
            <RotateCcw
              size={13.5}
              color={
                activeSectionTab === 'recall'
                  ? '#FFFFFF'
                  : (isDark ? '#2DD4BF' : '#0D9488')
              }
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.eventRecallProminentText,
                activeSectionTab === 'recall' && styles.eventRecallProminentTextActive,
              ]}
              numberOfLines={1}
            >
              Recall the Event
            </Text>
            <View
              style={[
                styles.eventRecallProminentBadge,
                activeSectionTab === 'recall' && styles.eventRecallProminentBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.eventRecallProminentBadgeText,
                  activeSectionTab === 'recall' && styles.eventRecallProminentBadgeTextActive,
                ]}
              >
                5 Qs
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* ======================================================== */}
      {/* D. ACTIVE SECTION CONTENT AREA                           */}
      {/* ======================================================== */}
      {activeSectionTab === 'takeaways' && (
        <View style={styles.takeawaysSection}>
          <View style={styles.takeawaysList}>
            {event.bullets.map((point, idx) => (
              <View key={idx} style={styles.takeawayItem}>
                <View style={styles.takeawayIndexBadge}>
                  <Text style={styles.takeawayIndexText}>{idx + 1}</Text>
                </View>
                <Text style={styles.takeawayText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeSectionTab === 'matrix' && (
        <View style={styles.tabContentSection}>
          {event.prelimsFactMatrix && event.prelimsFactMatrix.length > 0 ? (
            <View style={styles.matrixTable}>
              {event.prelimsFactMatrix.map((item, idx) => (
                <View key={idx} style={styles.matrixCardItem}>
                  <View style={styles.matrixLabelRow}>
                    <View style={styles.matrixDotIndicator} />
                    <Text style={styles.matrixLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.matrixValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.matrixListFallback}>
              {event.prelimsFacts?.map((fact, idx) => (
                <Text key={idx} style={styles.matrixFallbackItem}>
                  • {fact}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {activeSectionTab === 'recall' && (
        <View style={styles.recallSection}>
          <View style={styles.recallHeaderCard}>
            <View style={styles.recallHeaderLeft}>
              <View style={styles.recallAiBadge}>
                <Sparkles size={12} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.recallAiBadgeText}>Gemini AI Active Recall</Text>
              </View>
              <Text style={styles.recallSubheading}>
                5 questions to train active retrieval memory & test UPSC syllabus linkage
              </Text>
            </View>
            <View style={styles.recallHeaderRight}>
              <View style={styles.recallScorePill}>
                <Text style={styles.recallScoreText}>
                  {Object.keys(recallAnswers).length > 0
                    ? `${correctCount}/5 Recalled`
                    : '0/5 Answered'}
                </Text>
              </View>
              {Object.keys(recallAnswers).length > 0 && (
                <Pressable
                  style={styles.recallResetBtn}
                  onPress={() => setRecallAnswers({})}
                  accessibilityLabel="Reset answers"
                >
                  <RotateCcw size={11} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                  <Text style={styles.recallResetBtnText}>Reset</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.recallQuestionsList}>
            {recallQuestions.map((q) => {
              const selectedOption = recallAnswers[q.id];
              const isAnswered = selectedOption !== undefined;
              const isCorrect = selectedOption === q.correctAnswer;

              return (
                <View key={q.id} style={styles.recallQuestionCard}>
                  <View style={styles.recallQMetaRow}>
                    <View style={styles.recallQBadge}>
                      <Text style={styles.recallQBadgeText}>Q{q.questionNumber}</Text>
                    </View>
                    <Text style={styles.recallTopicTag} numberOfLines={1}>
                      {q.topicTag}
                    </Text>
                  </View>

                  <Text style={styles.recallQuestionPrompt}>{q.question}</Text>

                  <View style={styles.recallOptionsList}>
                    {q.options.map((opt) => {
                      const isSelected = selectedOption === opt.key;
                      const isTheCorrectKey = opt.key === q.correctAnswer;
                      const showCorrectStyle = isAnswered && isTheCorrectKey;
                      const showWrongStyle = isAnswered && isSelected && !isTheCorrectKey;

                      return (
                        <Pressable
                          key={opt.key}
                          accessibilityRole="button"
                          accessibilityLabel={`Option ${opt.key}: ${opt.text}`}
                          style={({ pressed, hovered }: any) => [
                            styles.recallOptionBtn,
                            hovered && !isAnswered && styles.recallOptionBtnHover,
                            pressed && !isAnswered && styles.sectionTabBtnPressed,
                            showCorrectStyle && styles.recallOptionBtnCorrect,
                            showWrongStyle && styles.recallOptionBtnWrong,
                          ]}
                          onPress={() => {
                            setRecallAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.key,
                            }));
                          }}
                        >
                          <View
                            style={[
                              styles.recallOptionKeyBadge,
                              showCorrectStyle && styles.recallOptionKeyBadgeCorrect,
                              showWrongStyle && styles.recallOptionKeyBadgeWrong,
                            ]}
                          >
                            {showCorrectStyle ? (
                              <Check size={11} color="#FFFFFF" strokeWidth={3} />
                            ) : (
                              <Text
                                style={[
                                  styles.recallOptionKeyText,
                                  (showCorrectStyle || showWrongStyle) && styles.recallOptionKeyTextHighlight,
                                ]}
                              >
                                {opt.key}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.recallOptionText,
                              showCorrectStyle && styles.recallOptionTextCorrect,
                              showWrongStyle && styles.recallOptionTextWrong,
                            ]}
                          >
                            {opt.text}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {isAnswered && (
                    <View
                      style={[
                        styles.recallFeedbackCard,
                        isCorrect ? styles.recallFeedbackCorrect : styles.recallFeedbackWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.recallFeedbackHeading,
                          isCorrect
                            ? styles.recallFeedbackHeadingCorrect
                            : styles.recallFeedbackHeadingWrong,
                        ]}
                      >
                        {isCorrect ? '✓ Correct Recall' : `✗ Correct Answer: Option ${q.correctAnswer}`}
                      </Text>
                      <Text style={styles.recallExplanationText}>{q.explanation}</Text>
                      <View style={styles.recallSyllabusBox}>
                        <Text style={styles.recallSyllabusTag}>📚 UPSC Syllabus Linkage:</Text>
                        <Text style={styles.recallSyllabusText}>{q.syllabusRelevance}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}


      {/* ======================================================== */}
      {/* H. GEMINI AI VERIFICATION & SLIDE NAV (AT THE BOTTOM)     */}
      {/* ======================================================== */}
      <View style={styles.geminiBottomFooter}>
        <View style={styles.geminiBottomLeft}>
          <ShieldCheck size={11.5} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2} />
          <Text style={styles.geminiBottomFooterText}>
            Verified by Gemini Ai({event.aiVerification?.sourcesCount || event.sources?.length || 3} sources)
          </Text>
        </View>

        {typeof totalEvents === 'number' && totalEvents > 1 && (
          <View style={styles.geminiBottomNav}>
            <Pressable
              style={[styles.geminiNavBtn, !hasPrevEvent && styles.geminiNavBtnDisabled]}
              onPress={onPrevEvent}
              disabled={!hasPrevEvent}
              hitSlop={6}
              accessibilityLabel="Previous event"
            >
              <ChevronLeft
                size={12}
                color={!hasPrevEvent ? (isDark ? '#475569' : '#CBD5E1') : (isDark ? '#E2E8F0' : '#1E293B')}
                strokeWidth={2}
              />
              <Text style={[styles.geminiNavBtnText, !hasPrevEvent && styles.geminiNavBtnTextDisabled]}>
                Prev
              </Text>
            </Pressable>

            {/* Slide dots indicator */}
            <View style={styles.geminiNavDots}>
              {Array.from({ length: totalEvents }).map((_, dotIdx) => (
                <Pressable
                  key={dotIdx}
                  onPress={() => onSelectEvent?.(dotIdx)}
                  hitSlop={6}
                  style={[
                    styles.geminiNavDot,
                    dotIdx === eventIndex && styles.geminiNavDotActive,
                  ]}
                  accessibilityLabel={`Go to event ${dotIdx + 1}`}
                />
              ))}
            </View>

            <Pressable
              style={[styles.geminiNavBtn, !hasNextEvent && styles.geminiNavBtnDisabled]}
              onPress={onNextEvent}
              disabled={!hasNextEvent}
              hitSlop={6}
              accessibilityLabel="Next event"
            >
              <Text style={[styles.geminiNavBtnText, !hasNextEvent && styles.geminiNavBtnTextDisabled]}>
                Next
              </Text>
              <ChevronRight
                size={12}
                color={!hasNextEvent ? (isDark ? '#475569' : '#CBD5E1') : (isDark ? '#E2E8F0' : '#1E293B')}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#070B14' : '#FFFFFF',
      borderRadius: 14,
      padding: isDesktop ? 20 : 13,
      borderWidth: 1,
      borderColor: isDark ? '#141E30' : '#E2E8F0',
      marginBottom: 0,
    },

    /* Section Switcher Block: Row 1 (Takeaways, Facts, Analysis) & Row 2 (Daily Recall, Event Recall) */
    cardButtonBlock: {
      gap: 9,
      marginBottom: 16,
    },
    cardBtnRow1: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isDesktop ? 10 : 6,
    },
    row1Btn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isDesktop ? 6 : 4,
      paddingVertical: isDesktop ? 8 : 7.5,
      paddingHorizontal: isDesktop ? 10 : 5,
      borderRadius: 7,
      backgroundColor: isDark ? '#101B2B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1E2F46' : '#E2E8F0',
    },
    cardBtnRow2: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isDesktop ? 10 : 8,
    },
    prominentRecallBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: isDesktop ? 12 : 8,
      borderRadius: 8,
      borderWidth: 1.5,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    prominentRecallBtnHover: {
      opacity: 0.9,
    },
    dailyRecallProminentBtn: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF',
      borderColor: isDark ? '#38BDF8' : '#0284C7',
      shadowColor: '#38BDF8',
    },
    dailyRecallProminentText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#E0F2FE' : '#0369A1',
      letterSpacing: -0.1,
    },
    dailyRecallProminentBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#DBEAFE',
    },
    dailyRecallProminentBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
    eventRecallProminentBtn: {
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.1)' : '#F0FDFA',
      borderColor: isDark ? '#2DD4BF' : '#0D9488',
      shadowColor: '#2DD4BF',
    },
    eventRecallProminentBtnActive: {
      backgroundColor: isDark ? '#0D9488' : '#0F766E',
      borderColor: isDark ? '#5EEAD4' : '#115E59',
    },
    eventRecallProminentText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#CCFBF1' : '#0F766E',
      letterSpacing: -0.1,
    },
    eventRecallProminentTextActive: {
      color: '#FFFFFF',
    },
    eventRecallProminentBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.25)' : '#CCFBF1',
    },
    eventRecallProminentBadgeActive: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.3)',
    },
    eventRecallProminentBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#2DD4BF' : '#0D9488',
    },
    eventRecallProminentBadgeTextActive: {
      color: '#FFFFFF',
    },
    sectionTabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isDesktop ? 6 : 5,
      paddingVertical: isDesktop ? 8 : 7.5,
      paddingHorizontal: isDesktop ? 13 : 8.5,
      borderRadius: 7,
      backgroundColor: isDark ? '#101B2B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1E2F46' : '#E2E8F0',
    },
    sectionTabBtnHover: {
      backgroundColor: isDark ? '#16253B' : '#F1F5F9',
      borderColor: isDark ? '#2B4263' : '#CBD5E1',
    },
    sectionTabBtnPressed: {
      opacity: 0.85,
    },
    sectionTabBtnActiveTakeaways: {
      backgroundColor: isDark ? '#17263A' : '#EFF6FF',
      borderColor: isDark ? '#60A5FA' : '#3B82F6',
    },
    sectionTabBtnActiveRecall: {
      backgroundColor: isDark ? '#103A3A' : '#F0FDFA',
      borderColor: isDark ? '#5EEAD4' : '#0D9488',
    },
    sectionTabBtnActiveMatrix: {
      backgroundColor: isDark ? '#142D25' : '#ECFDF5',
      borderColor: isDark ? '#4ADE80' : '#059669',
    },
    sectionTabBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#334155',
    },
    sectionTabBtnTextActiveTakeaways: {
      color: isDark ? '#60A5FA' : '#1D4ED8',
      fontWeight: '700',
    },
    sectionTabBtnTextActiveRecall: {
      color: isDark ? '#5EEAD4' : '#0F766E',
      fontWeight: '700',
    },
    sectionTabBtnTextActiveMatrix: {
      color: isDark ? '#4ADE80' : '#047857',
      fontWeight: '700',
    },
    tabCountBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? '#18283E' : '#E2E8F0',
    },
    tabCountBadgeActiveTakeaways: {
      backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : '#DBEAFE',
    },
    tabCountBadgeActiveRecall: {
      backgroundColor: isDark ? 'rgba(94, 234, 212, 0.2)' : '#CCFBF1',
    },
    tabCountBadgeActiveMatrix: {
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.2)' : '#D1FAE5',
    },
    tabCountBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    tabCountBadgeTextActiveTakeaways: {
      color: isDark ? '#60A5FA' : '#1D4ED8',
    },
    tabCountBadgeTextActiveRecall: {
      color: isDark ? '#5EEAD4' : '#0F766E',
    },
    tabCountBadgeTextActiveMatrix: {
      color: isDark ? '#4ADE80' : '#047857',
    },
    tabContentSection: {
      marginBottom: 16,
    },

    /* A. Event Identification */
    identificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 12,
    },
    idMetaGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      flex: 1,
      minWidth: 140,
    },
    idActionsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    topSmallNoteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3.5,
      paddingHorizontal: isDesktop ? 8 : 7,
      borderRadius: 6,
      backgroundColor: isDark ? '#101B2B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#1E2F46' : '#E2E8F0',
    },
    topSmallNoteBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#CBD5E1' : '#334155',
      letterSpacing: -0.1,
    },
    paperBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BFDBFE',
    },
    paperBadgeText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#1D4ED8',
      letterSpacing: 0.25,
    },
    dotSeparator: {
      fontSize: 12,
      color: isDark ? '#64748B' : theme.textMuted,
    },
    sourceDateText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : theme.textMuted,
    },
    bookmarkAction: {
      padding: 4,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* B. Headline & Overview */
    headline: {
      fontSize: 20.5,
      fontWeight: '700',
      lineHeight: 28,
      color: isDark ? '#F8FAFC' : theme.textPrimary,
      letterSpacing: -0.25,
      marginBottom: 10,
    },
    summaryOverviewCard: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.04)' : '#F0F7FF',
      borderRadius: 9,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#38BDF8' : '#2563EB',
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : '#E0EDFD',
      paddingHorizontal: 14,
      paddingVertical: 11,
      marginBottom: 16,
    },
    summaryOverviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    summaryOverviewBar: {
      width: 12,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: isDark ? '#38BDF8' : '#2563EB',
    },
    summaryOverviewTag: {
      fontSize: 10.5,
      fontWeight: '800',
      color: isDark ? '#38BDF8' : '#1D4ED8',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    summaryOverview: {
      fontSize: 14.5,
      lineHeight: 22.5,
      color: isDark ? '#E2E8F0' : '#1E293B',
    },

    /* C. Key Takeaways */
    takeawaysSection: {
      marginBottom: 16,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionLabel: {
      fontSize: 11.5,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: isDark ? '#94A3B8' : '#0369A1',
    },
    takeawayCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? '#162234' : '#E0F2FE',
      borderWidth: 1,
      borderColor: isDark ? '#263750' : '#BAE6FD',
    },
    takeawayCountText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#93C5FD' : '#0284C7',
    },
    takeawaysList: {
      gap: 10,
      backgroundColor: isDark ? '#17263A' : '#F0F9FF',
      borderRadius: 9,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#60A5FA' : '#0284C7',
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : '#E0F2FE',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    takeawayItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    takeawayIndexBadge: {
      width: 19,
      height: 19,
      borderRadius: 9.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
      backgroundColor: isDark ? '#2563EB' : '#0284C7',
    },
    takeawayIndexText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    takeawayText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: isDark ? '#E2E8F0' : '#0F172A',
    },

    /* D & E. Collapsible Blocks */
    collapsibleBlock: {
      borderRadius: 10,
      backgroundColor: isDark ? '#0F1522' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1E2D42' : '#E2E8F0',
      marginBottom: 12,
      overflow: 'hidden',
    },
    collapsibleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    collapsibleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    collapsibleTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#F8FAFC' : theme.textPrimary,
    },
    factCounterBadge: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#6EE7B7' : '#047857',
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? '#059669' : 'transparent',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    syllabusPaperTag: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#DDD6FE' : '#6D28D9',
      backgroundColor: isDark ? '#3B1A6E' : '#F5F3FF',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? '#581C87' : 'transparent',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    collapsibleContent: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E2D42' : '#E2E8F0',
    },

    /* D. Matrix Table */
    matrixTable: {
      gap: 8,
    },
    matrixCardItem: {
      backgroundColor: isDark ? '#142D25' : '#F0FDF4',
      borderRadius: 9,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1D4539' : '#BBF7D0',
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#4ADE80' : '#059669',
    },
    matrixLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
    },
    matrixDotIndicator: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? '#4ADE80' : '#059669',
    },
    matrixLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: isDark ? '#4ADE80' : '#047857',
      letterSpacing: 0.3,
    },
    matrixValue: {
      fontSize: 13.5,
      lineHeight: 19,
      color: isDark ? '#F0FDF4' : '#064E3B',
    },
    matrixListFallback: {
      gap: 6,
    },
    matrixFallbackItem: {
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#94A3B8' : theme.textSecondary,
    },

    /* E. Active Recall Section (Gemini AI) */
    recallSection: {
      marginBottom: 16,
      gap: 12,
    },
    recallHeaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDark ? '#103A3A' : '#F0FDFA',
      borderWidth: 1,
      borderColor: isDark ? '#195454' : '#CCFBF1',
      flexWrap: 'wrap',
      gap: 8,
    },
    recallHeaderLeft: {
      flex: 1,
      minWidth: 200,
      gap: 4,
    },
    recallAiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#0F766E' : '#0D9488',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    recallAiBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    recallSubheading: {
      fontSize: 12,
      color: isDark ? '#5EEAD4' : '#0F766E',
      lineHeight: 16,
    },
    recallHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    recallScorePill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? '#0B2929' : '#CCFBF1',
      borderWidth: 1,
      borderColor: isDark ? '#195454' : '#99F6E4',
    },
    recallScoreText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#5EEAD4' : '#0F766E',
    },
    recallResetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? '#154A4A' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#195454' : '#E2E8F0',
    },
    recallResetBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#5EEAD4' : '#64748B',
    },
    recallQuestionsList: {
      gap: 12,
    },
    recallQuestionCard: {
      borderRadius: 10,
      padding: 12,
      backgroundColor: isDark ? '#103A3A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#195454' : '#E2E8F0',
    },
    recallQMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    recallQBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? '#0A2626' : '#CCFBF1',
    },
    recallQBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: isDark ? '#5EEAD4' : '#0D9488',
    },
    recallTopicTag: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#5EEAD4' : '#64748B',
      flex: 1,
    },
    recallQuestionPrompt: {
      fontSize: 13.5,
      fontWeight: '600',
      lineHeight: 20,
      color: isDark ? '#F0FDFA' : '#0F172A',
      marginBottom: 10,
    },
    recallOptionsList: {
      gap: 6,
    },
    recallOptionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 7,
      backgroundColor: isDark ? '#0D3131' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#195454' : '#E2E8F0',
    },
    recallOptionBtnHover: {
      backgroundColor: isDark ? '#154A4A' : '#F1F5F9',
      borderColor: isDark ? '#237373' : '#CBD5E1',
    },
    recallOptionBtnCorrect: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      borderColor: isDark ? '#10B981' : '#059669',
    },
    recallOptionBtnWrong: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderColor: isDark ? '#EF4444' : '#DC2626',
    },
    recallOptionKeyBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#103A3A' : '#E2E8F0',
    },
    recallOptionKeyBadgeCorrect: {
      backgroundColor: isDark ? '#10B981' : '#059669',
    },
    recallOptionKeyBadgeWrong: {
      backgroundColor: isDark ? '#EF4444' : '#DC2626',
    },
    recallOptionKeyText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#5EEAD4' : '#475569',
    },
    recallOptionKeyTextHighlight: {
      color: '#FFFFFF',
    },
    recallOptionText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      color: isDark ? '#CCFBF1' : '#334155',
    },
    recallOptionTextCorrect: {
      color: isDark ? '#A7F3D0' : '#065F46',
      fontWeight: '600',
    },
    recallOptionTextWrong: {
      color: isDark ? '#FECACA' : '#991B1B',
    },
    recallFeedbackCard: {
      marginTop: 10,
      padding: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderWidth: 1,
      gap: 6,
    },
    recallFeedbackCorrect: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
      borderLeftColor: isDark ? '#10B981' : '#059669',
      borderColor: isDark ? '#064E3B' : '#BBF7D0',
    },
    recallFeedbackWrong: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
      borderLeftColor: isDark ? '#EF4444' : '#DC2626',
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
    },
    recallFeedbackHeading: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    recallFeedbackHeadingCorrect: {
      color: isDark ? '#34D399' : '#059669',
    },
    recallFeedbackHeadingWrong: {
      color: isDark ? '#F87171' : '#DC2626',
    },
    recallExplanationText: {
      fontSize: 12,
      lineHeight: 17.5,
      color: isDark ? '#E2E8F0' : '#1E293B',
    },
    recallSyllabusBox: {
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#195454' : 'rgba(0, 0, 0, 0.06)',
      gap: 2,
    },
    recallSyllabusTag: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#5EEAD4' : '#0F766E',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    recallSyllabusText: {
      fontSize: 11.5,
      lineHeight: 16.5,
      color: isDark ? '#99F6E4' : '#115E59',
      fontStyle: 'italic',
    },

    /* G. Gemini Bottom Footer & Nav */
    geminiBottomFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingTop: 10,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#F1F5F9',
    },
    geminiBottomLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
    },
    geminiBottomFooterText: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0369A1',
      letterSpacing: 0.1,
    },
    geminiBottomNav: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    geminiNavBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
      backgroundColor: isDark ? '#0F1A2A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1E2D44' : '#E2E8F0',
    },
    geminiNavBtnDisabled: {
      opacity: 0.35,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    geminiNavBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
    },
    geminiNavBtnTextDisabled: {
      color: isDark ? '#475569' : '#94A3B8',
    },
    geminiNavDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 2,
    },
    geminiNavDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? '#263750' : '#CBD5E1',
    },
    geminiNavDotActive: {
      width: 14,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? '#38BDF8' : '#0284C7',
    },
  });
