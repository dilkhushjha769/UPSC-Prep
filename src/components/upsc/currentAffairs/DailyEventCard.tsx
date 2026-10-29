import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  RotateCcw,
  Check,
  BookOpen,
} from 'lucide-react-native';
import { DailyEventItem } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';
import { generateEventRecallQuestions } from '@/services/eventRecallService';
import {
  parseExecutiveBrief,
  renderExecutiveBriefText,
} from '@/services/executiveBriefService';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'International Relations': 'https://images.indianexpress.com/2026/10/US-4-14.jpg',
  'Polity': 'https://images.indianexpress.com/2026/10/Cabinet-Secretary.jpg',
  'Economy': 'https://images.indianexpress.com/2026/10/Jio-IPO-4.jpg',
  'Sci-Tech': 'https://images.indianexpress.com/2026/10/Amodeithropic.jpg',
  'Environment': 'https://images.indianexpress.com/2026/10/28CheetahKunoDeath.jpg',
  'Security': 'https://images.indianexpress.com/2026/10/lac-china-india.jpg',
};

interface DailyEventCardProps {
  event: DailyEventItem;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
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

  // Active Recall Drawer Tab State: 'recall' | null (starts closed)
  const [activeSectionTab, setActiveSectionTab] = useState<'recall' | null>(null);

  const toggleSectionTab = (tab: 'recall') => {
    setActiveSectionTab((prev) => (prev === tab ? null : tab));
  };

  // Active Recall Questions & User Responses
  const recallQuestions = useMemo(() => generateEventRecallQuestions(event), [event]);
  const [recallAnswers, setRecallAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  // Track if current event's image failed so we fallback cleanly to category image
  const [failedEventId, setFailedEventId] = useState<string | null>(null);
  const imageLoadFailed = failedEventId === event.id;

  // Robust image resolver: checks event imageUrl, decodes URI, and falls back to category image
  const activeImageUrl = useMemo(() => {
    if (imageLoadFailed) {
      return DEFAULT_CATEGORY_IMAGES[event.category] || DEFAULT_CATEGORY_IMAGES['Polity'];
    }
    const raw = event.imageUrl || DEFAULT_CATEGORY_IMAGES[event.category] || DEFAULT_CATEGORY_IMAGES['Polity'];
    try {
      return decodeURI(raw);
    } catch {
      return raw;
    }
  }, [event.imageUrl, event.category, imageLoadFailed]);

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

  // Ensure subject / category is in natural Title Case rather than all caps
  const formattedCategory = useMemo(() => {
    if (!event.category) return '';
    const cat = event.category.trim();
    if (cat === cat.toUpperCase() && cat.length > 3) {
      return cat
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return cat;
  }, [event.category]);

  // Split executive brief into 3 clean, concise bullet points with keyword bolding
  const briefBullets = useMemo(() => {
    return parseExecutiveBrief(event.summary, event.summaryBullets);
  }, [event.summary, event.summaryBullets]);

  return (
    <View style={styles.card}>
      {/* ======================================================== */}
      {/* A. EVENT IDENTIFICATION                                   */}
      {/* ======================================================== */}
      <View style={styles.identificationRow}>
        <View style={styles.idMetaGroup}>
          <Text style={styles.subjectCategoryText}>
            {normalizedPaper ? `${normalizedPaper} · ${formattedCategory}` : formattedCategory}
          </Text>
          <Text style={styles.dotSeparator}>·</Text>
          <Text style={styles.sourceDateText}>{event.source}</Text>
        </View>

        {/* Top Right: Event Recall Button (replaces bookmark & top note) */}
        <View style={styles.idActionsGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recall the Event (5 Questions)"
            style={({ pressed }: any) => [
              styles.topEventRecallBtn,
              activeSectionTab === 'recall' && styles.topEventRecallBtnActive,
              pressed && styles.sectionTabBtnPressed,
            ]}
            onPress={() => toggleSectionTab('recall')}
            hitSlop={4}
          >
            <RotateCcw
              size={12}
              color={
                activeSectionTab === 'recall'
                  ? '#FFFFFF'
                  : theme.buttonSecondaryText
              }
              strokeWidth={2}
            />
            <Text
              style={[
                styles.topEventRecallText,
                activeSectionTab === 'recall' && styles.topEventRecallTextActive,
              ]}
              numberOfLines={1}
            >
              Recall Event
            </Text>
            <View
              style={[
                styles.topEventRecallBadge,
                activeSectionTab === 'recall' && styles.topEventRecallBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.topEventRecallBadgeText,
                  activeSectionTab === 'recall' && styles.topEventRecallBadgeTextActive,
                ]}
              >
                5 Qs
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* B. HEADLINE AND OVERVIEW WITH ACCENT BACKGROUND           */}
      {/* ======================================================== */}
      <Text style={styles.headline}>{event.headline}</Text>

      {briefBullets.length > 0 ? (
        <View style={styles.summaryOverviewCard}>
          <View style={styles.summaryOverviewHeader}>
            <Compass size={12} color={isDark ? '#9CA3AF' : '#243B5E'} strokeWidth={2.2} />
            <Text style={styles.summaryOverviewTag}>EXECUTIVE BRIEF</Text>
          </View>

          <View style={styles.summaryContentRow}>
            {!isDesktop && activeImageUrl ? (
              <View style={styles.summaryImageWrapper}>
                <Image
                  source={{ uri: activeImageUrl }}
                  style={styles.summarySnippetImage}
                  contentFit="cover"
                  transition={120}
                  cachePolicy="memory-disk"
                  priority="high"
                  onError={() => {
                    setFailedEventId(event.id);
                  }}
                  accessibilityLabel={event.headline}
                />
              </View>
            ) : null}

            <View style={styles.summarySentenceBlock}>
              {briefBullets.map((bullet, bIdx) => (
                <View key={bIdx} style={styles.summarySentenceItem}>
                  <View style={styles.summarySentenceDot} />
                  <View style={styles.summaryTextWrapper}>
                    {renderExecutiveBriefText(
                      bullet,
                      styles.summaryOverviewText,
                      styles.summaryBoldText
                    )}
                  </View>
                </View>
              ))}
            </View>

            {isDesktop && activeImageUrl ? (
              <View style={styles.summaryImageWrapper}>
                <Image
                  source={{ uri: activeImageUrl }}
                  style={styles.summarySnippetImage}
                  contentFit="cover"
                  transition={120}
                  cachePolicy="memory-disk"
                  priority="high"
                  onError={() => {
                    setFailedEventId(event.id);
                  }}
                  accessibilityLabel={event.headline}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ======================================================== */}
      {/* ACTIVE RECALL QUESTIONS DRAWER (TRIGGERED FROM TOP RIGHT) */}
      {/* ======================================================== */}
      {activeSectionTab === 'recall' && (
        <View style={styles.recallSection}>
          <View style={styles.recallHeaderCard}>
            <View style={styles.recallHeaderLeft}>
              <View style={styles.recallHeaderBadge}>
                <RotateCcw size={12} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.recallHeaderBadgeText}>Active Recall Practice</Text>
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
      {/* C. BOTTOM BAR: FULL ANALYSIS (LEFT) & NAV (SAME LINE)    */}
      {/* ======================================================== */}
      <View style={styles.cardBottomBar}>
        {/* Left Side: Full Analysis Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Full Analysis"
          style={({ pressed, hovered }: any) => [
            styles.fullAnalysisBtn,
            hovered && styles.fullAnalysisBtnHover,
            pressed && styles.fullAnalysisBtnPressed,
          ]}
          onPress={() => onOpenDetail(event)}
        >
          <BookOpen
            size={13}
            color={theme.buttonSecondaryText}
            strokeWidth={2}
          />
          <Text style={styles.fullAnalysisBtnText}>Full Analysis</Text>
          <ChevronRight
            size={13}
            color={theme.buttonSecondaryText}
            strokeWidth={2}
          />
        </Pressable>

        {/* Right Side: Prev / Next & Slide Dots in the Same Line */}
        {typeof totalEvents === 'number' && totalEvents > 1 && (
          <View style={styles.bottomNavGroup}>
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

      {/* Middle Side Arrow: Previous Event (Left) */}
      {typeof totalEvents === 'number' && totalEvents > 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous event"
          style={({ pressed, hovered }: any) => [
            styles.sideNavArrowBtn,
            styles.sideNavArrowBtnLeft,
            !hasPrevEvent && styles.sideNavArrowBtnDisabled,
            hovered && styles.sideNavArrowBtnHover,
            pressed && styles.sideNavArrowBtnPressed,
          ]}
          onPress={onPrevEvent}
          disabled={!hasPrevEvent}
          hitSlop={8}
        >
          <ChevronLeft
            size={18}
            color={!hasPrevEvent ? (isDark ? '#475569' : '#CBD5E1') : (isDark ? '#F1F5F9' : '#1E293B')}
            strokeWidth={2.4}
          />
        </Pressable>
      )}

      {/* Middle Side Arrow: Next Event (Right) */}
      {typeof totalEvents === 'number' && totalEvents > 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next event"
          style={({ pressed, hovered }: any) => [
            styles.sideNavArrowBtn,
            styles.sideNavArrowBtnRight,
            !hasNextEvent && styles.sideNavArrowBtnDisabled,
            hovered && styles.sideNavArrowBtnHover,
            pressed && styles.sideNavArrowBtnPressed,
          ]}
          onPress={onNextEvent}
          disabled={!hasNextEvent}
          hitSlop={8}
        >
          <ChevronRight
            size={18}
            color={!hasNextEvent ? (isDark ? '#475569' : '#CBD5E1') : (isDark ? '#F1F5F9' : '#1E293B')}
            strokeWidth={2.4}
          />
        </Pressable>
      )}
    </View>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#17191D' : '#F0F6FC',
      borderRadius: 14,
      paddingVertical: isDesktop ? 20 : 13,
      paddingHorizontal: isDesktop ? 28 : 16,
      borderWidth: 1,
      borderColor: isDark ? '#262930' : '#DCE7F3',
      marginBottom: 0,
      position: 'relative',
      minHeight: isDesktop ? 390 : 540,
      justifyContent: 'space-between',
    },

    /* Section Action Buttons Block (Desktop 4-in-a-row, Mobile 2x2 grid) */
    cardButtonBlock: {
      gap: 8,
      marginBottom: 16,
    },
    cardBtnRowDesktop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardBtnGridMobile: {
      gap: 8,
    },
    cardBtnRowMobile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionGridBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isDesktop ? 6 : 4.5,
      paddingVertical: isDesktop ? 8 : 7.5,
      paddingHorizontal: isDesktop ? 10 : 6,
      borderRadius: 7,
      backgroundColor: isDark ? '#101B2B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1E2F46' : '#E2E8F0',
    },
    prominentRecallBtnHover: {
      opacity: 0.9,
    },
    eventRecallActionBtn: {
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.08)' : '#F0FDFA',
      borderColor: isDark ? 'rgba(45, 212, 191, 0.35)' : '#99F6E4',
    },
    eventRecallActionBtnActive: {
      backgroundColor: isDark ? '#0D9488' : '#0F766E',
      borderColor: isDark ? '#5EEAD4' : '#115E59',
    },
    eventRecallActionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#CCFBF1' : '#0F766E',
      letterSpacing: -0.1,
    },
    eventRecallActionBtnTextActive: {
      color: '#FFFFFF',
    },
    eventRecallActionBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.2)' : '#CCFBF1',
    },
    eventRecallActionBadgeActive: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.3)',
    },
    eventRecallActionBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#2DD4BF' : '#0D9488',
    },
    eventRecallActionBadgeTextActive: {
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
    sectionTabBtnActiveNotes: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
      borderColor: isDark ? '#F59E0B' : '#D97706',
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
    sectionTabBtnTextActiveNotes: {
      color: isDark ? '#FCD34D' : '#B45309',
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
    tabCountBadgeActiveNotes: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
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
    tabCountBadgeTextActiveNotes: {
      color: isDark ? '#FCD34D' : '#B45309',
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
    topEventRecallBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5.5,
      paddingVertical: 5,
      paddingHorizontal: isDesktop ? 10 : 8,
      borderRadius: 7,
      backgroundColor: theme.buttonSecondaryBg,
      borderWidth: 1,
      borderColor: theme.buttonSecondaryBorder,
    },
    topEventRecallBtnActive: {
      backgroundColor: theme.buttonPrimaryBg,
      borderColor: theme.buttonPrimaryBg,
    },
    topEventRecallText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.buttonSecondaryText,
      letterSpacing: -0.1,
    },
    topEventRecallTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    topEventRecallBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(111, 186, 255, 0.18)' : 'rgba(0, 111, 253, 0.12)',
    },
    topEventRecallBadgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    topEventRecallBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: theme.buttonSecondaryText,
    },
    topEventRecallBadgeTextActive: {
      color: '#FFFFFF',
    },
    subjectCategoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
      letterSpacing: 0.1,
    },
    dotSeparator: {
      fontSize: 12,
      color: isDark ? '#64748B' : theme.textMuted,
    },
    sourceDateText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : theme.textMuted,
    },

    /* Notes Section Styles */
    notesSection: {
      marginBottom: 16,
      borderRadius: 10,
      backgroundColor: isDark ? '#0D1522' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1C2B3F' : '#E2E8F0',
      padding: 14,
      gap: 12,
    },
    notesHeaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    notesHeaderLeft: {
      flex: 1,
      gap: 3,
    },
    notesTagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 5,
      backgroundColor: isDark ? '#D97706' : '#D97706',
    },
    notesTagBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    notesSubheading: {
      fontSize: 11.5,
      color: isDark ? '#94A3B8' : '#64748B',
      lineHeight: 16,
    },
    openFullNotesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BFDBFE',
    },
    openFullNotesBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#1D4ED8',
    },
    noteInputCard: {
      borderRadius: 8,
      backgroundColor: isDark ? '#131F30' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#23354E' : '#E2E8F0',
      padding: 10,
      gap: 8,
    },
    noteTextInput: {
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#F1F5F9' : '#0F172A',
      minHeight: 56,
      textAlignVertical: 'top',
    },
    noteInputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E2F46' : '#F1F5F9',
      paddingTop: 8,
    },
    noteCharHint: {
      fontSize: 11,
      color: isDark ? '#64748B' : '#94A3B8',
    },
    saveNoteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: isDark ? '#0284C7' : '#0284C7',
    },
    saveNoteBtnDisabled: {
      opacity: 0.45,
    },
    saveNoteBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    savedNotesList: {
      gap: 8,
    },
    savedNoteCard: {
      borderRadius: 8,
      backgroundColor: isDark ? '#142033' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#22354F' : '#E2E8F0',
      borderLeftWidth: 3.5,
      borderLeftColor: isDark ? '#F59E0B' : '#D97706',
      padding: 10,
      gap: 5,
    },
    savedNoteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    savedNoteDate: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    savedNoteContent: {
      fontSize: 12.5,
      lineHeight: 18,
      color: isDark ? '#E2E8F0' : '#1E293B',
    },
    notesEmptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 6,
    },
    notesEmptyText: {
      fontSize: 11.5,
      color: isDark ? '#64748B' : '#94A3B8',
      textAlign: 'center',
      maxWidth: 280,
    },

    /* B. Headline & Overview */
    headline: {
      fontSize: isDesktop ? 19 : 17.5,
      fontWeight: '700',
      lineHeight: isDesktop ? 26.5 : 24.5,
      color: isDark ? '#F8FAFC' : theme.textPrimary,
      letterSpacing: -0.2,
      maxWidth: isDesktop ? 780 : '96%',
      marginBottom: 10,
      minHeight: isDesktop ? 54 : 48,
    },
    summaryOverviewCard: {
      backgroundColor: isDark ? '#303030' : '#FFFFFF',
      borderRadius: 9,
      borderWidth: 1,
      borderColor: isDark ? '#424242' : '#DFE6F0',
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
      flex: 1,
      minHeight: isDesktop ? 180 : 350,
      justifyContent: 'space-between',
    },
    summaryOverviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    summaryOverviewTag: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#E5E7EB' : '#243B5E',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    summaryContentRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'flex-start' : 'stretch',
      gap: isDesktop ? 16 : 10,
      flex: 1,
    },
    summarySentenceBlock: {
      flex: 1,
      width: '100%',
      gap: 10,
    },
    summaryImageWrapper: {
      width: isDesktop ? 200 : '100%',
      height: isDesktop ? 136 : 150,
      borderRadius: isDesktop ? 10 : 8,
      overflow: 'hidden',
      backgroundColor: isDark ? '#141619' : '#EDF2F7',
      borderWidth: 1,
      borderColor: isDark ? '#2A2E35' : '#DFE6F0',
      flexShrink: 0,
      marginTop: isDesktop ? 2 : 0,
      marginBottom: isDesktop ? 0 : 8,
    },
    summarySnippetImage: {
      width: '100%',
      height: '100%',
    },
    summarySentenceItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },
    summarySentenceDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? '#9CA3AF' : '#718198',
      marginTop: 9,
      flexShrink: 0,
    },
    summaryTextWrapper: {
      flex: 1,
    },
    summaryOverviewText: {
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '400',
      color: isDark ? '#E5E7EB' : '#25344A',
      letterSpacing: 0.05,
    },
    summaryBoldText: {
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#182232',
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
    recallHeaderBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#0F766E' : '#0D9488',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    recallHeaderBadgeText: {
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

    /* Bottom Bar: Full Analysis (Left) & Nav (Right on Same Line) */
    cardBottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 12,
      marginTop: 'auto',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#262930' : '#E2E8F0',
    },
    fullAnalysisBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 7,
      backgroundColor: theme.buttonSecondaryBg,
      borderWidth: 1,
      borderColor: theme.buttonSecondaryBorder,
    },
    fullAnalysisBtnHover: {
      backgroundColor: isDark ? '#2D3F59' : '#DBEAFE',
      borderColor: isDark ? '#466D9F' : '#93C5FD',
    },
    fullAnalysisBtnPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.85,
    },
    fullAnalysisBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.buttonSecondaryText,
      letterSpacing: 0.2,
    },
    bottomNavGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    geminiNavBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
      backgroundColor: isDark ? '#202227' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2E323A' : '#E2E8F0',
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
      backgroundColor: isDark ? '#353942' : '#CBD5E1',
    },
    geminiNavDotActive: {
      width: 14,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.buttonPrimaryBg,
    },

    /* Middle Side Navigation Arrow Buttons */
    sideNavArrowBtn: {
      position: 'absolute',
      top: '50%',
      marginTop: -18,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#202227' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2E323A' : '#D1D5DB',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 20,
    },
    sideNavArrowBtnLeft: {
      left: isDesktop ? 6 : 4,
    },
    sideNavArrowBtnRight: {
      right: isDesktop ? 6 : 4,
    },
    sideNavArrowBtnHover: {
      backgroundColor: isDark ? '#282B32' : '#F8FAFC',
      borderColor: isDark ? '#404550' : '#9CA3AF',
      transform: [{ scale: 1.06 }],
    },
    sideNavArrowBtnPressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.85,
    },
    sideNavArrowBtnDisabled: {
      opacity: 0.28,
      borderColor: isDark ? '#1E293B' : '#E5E7EB',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.6)',
    },
  });
