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
  BookOpen,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { DailyEventItem } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';
import { PALETTE } from '@/constants/colors';
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
  onOpenEventRecall?: (event: DailyEventItem) => void;
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
  onOpenEventRecall,
  hasPrevEvent,
  hasNextEvent,
  eventIndex,
  totalEvents,
}: DailyEventCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

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

        {/* Top Right: Event Recall Button (Opens Dedicated Recall Quiz Page) */}
        <View style={styles.idActionsGroup}>
          <Button
            variant="secondary"
            size="sm"
            title="Recall Event"
            isDark={isDark}
            leftIcon={
              <RotateCcw
                size={12}
                color={isDark ? '#E8A25E' : '#B9570A'}
                strokeWidth={2.2}
              />
            }
            onPress={() => {
              if (onOpenEventRecall) {
                onOpenEventRecall(event);
              } else {
                onOpenDailyRecall?.();
              }
            }}
          />
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
            <Compass size={12} color={isDark ? '#8892A6' : '#333D52'} strokeWidth={2.2} />
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
      {/* C. BOTTOM BAR: FULL ANALYSIS (LEFT) & NAV (SAME LINE)    */}
      {/* ======================================================== */}
      <View style={styles.cardBottomBar}>
        {/* Left Side: Full Analysis Button (Standard App Primary Button) */}
        <Button
          variant="primary"
          size="sm"
          title="Full Analysis"
          isDark={isDark}
          leftIcon={<BookOpen size={13} color="#FFFFFF" strokeWidth={2.2} />}
          rightIcon={<ChevronRight size={13} color="#FFFFFF" strokeWidth={2.2} />}
          onPress={() => onOpenDetail(event)}
        />

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
                size={13}
                color={!hasPrevEvent ? (isDark ? '#333D52' : '#C9CFDB') : (isDark ? '#FFFFFF' : '#1C2433')}
                strokeWidth={2.2}
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
                size={13}
                color={!hasNextEvent ? (isDark ? '#333D52' : '#C9CFDB') : (isDark ? '#FFFFFF' : '#1C2433')}
                strokeWidth={2.2}
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
            color={!hasPrevEvent ? (isDark ? '#4A5568' : '#DDD6CA') : (isDark ? '#F0EDE6' : '#1C2433')}
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
            color={!hasNextEvent ? (isDark ? '#4A5568' : '#DDD6CA') : (isDark ? '#F0EDE6' : '#1C2433')}
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
      backgroundColor: isDark ? '#1E2535' : '#E9EDF9',
      borderRadius: 14,
      paddingVertical: isDesktop ? 20 : 13,
      paddingHorizontal: isDesktop ? 28 : 16,
      borderWidth: 1,
      borderColor: isDark ? '#1E2535' : '#CBD3EB',
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
      backgroundColor: isDark ? '#1E2535' : '#FAF9F6',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#EAE5DC',
    },
    prominentRecallBtnHover: {
      opacity: 0.9,
    },
    eventRecallActionBtn: {
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.08)' : '#E3F1E8',
      borderColor: isDark ? 'rgba(45, 212, 191, 0.35)' : '#3FA573',
    },
    eventRecallActionBtnActive: {
      backgroundColor: isDark ? '#26734D' : '#26734D',
      borderColor: isDark ? '#3FA573' : '#1D5C3D',
    },
    eventRecallActionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#E3F1E8' : '#26734D',
      letterSpacing: -0.1,
    },
    eventRecallActionBtnTextActive: {
      color: '#FFFFFF',
    },
    eventRecallActionBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.2)' : '#E3F1E8',
    },
    eventRecallActionBadgeActive: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.3)',
    },
    eventRecallActionBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#26734D' : '#26734D',
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
      backgroundColor: isDark ? '#1E2535' : '#FAF9F6',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#EAE5DC',
    },
    sectionTabBtnHover: {
      backgroundColor: isDark ? '#1E2535' : '#F0EDE6',
      borderColor: isDark ? '#333D52' : '#DDD6CA',
    },
    sectionTabBtnPressed: {
      opacity: 0.85,
    },
    sectionTabBtnActiveTakeaways: {
      backgroundColor: isDark ? '#1E2535' : '#E9EDF9',
      borderColor: isDark ? '#D9822B' : '#3D5A99',
    },
    sectionTabBtnActiveRecall: {
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
      borderColor: isDark ? '#3FA573' : '#26734D',
    },
    sectionTabBtnActiveMatrix: {
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
      borderColor: isDark ? '#3FA573' : '#26734D',
    },
    sectionTabBtnActiveNotes: {
      backgroundColor: isDark ? 'rgba(166, 90, 10, 0.12)' : '#FCEBDD',
      borderColor: isDark ? '#A65A0A' : '#A65A0A',
    },
    sectionTabBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#F0EDE6' : '#3F4A5E',
    },
    sectionTabBtnTextActiveTakeaways: {
      color: isDark ? '#D9822B' : '#974606',
      fontWeight: '700',
    },
    sectionTabBtnTextActiveRecall: {
      color: isDark ? '#3FA573' : '#26734D',
      fontWeight: '700',
    },
    sectionTabBtnTextActiveMatrix: {
      color: isDark ? '#3FA573' : '#26734D',
      fontWeight: '700',
    },
    sectionTabBtnTextActiveNotes: {
      color: isDark ? '#D9822B' : '#A65A0A',
      fontWeight: '700',
    },
    tabCountBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? '#1E2535' : '#EAE5DC',
    },
    tabCountBadgeActiveTakeaways: {
      backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : '#FCEBDD',
    },
    tabCountBadgeActiveRecall: {
      backgroundColor: isDark ? 'rgba(94, 234, 212, 0.2)' : '#E3F1E8',
    },
    tabCountBadgeActiveMatrix: {
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.2)' : '#E3F1E8',
    },
    tabCountBadgeActiveNotes: {
      backgroundColor: isDark ? 'rgba(166, 90, 10, 0.25)' : '#F2D2A8',
    },
    tabCountBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#7A8499' : '#5F6B80',
    },
    tabCountBadgeTextActiveTakeaways: {
      color: isDark ? '#D9822B' : '#974606',
    },
    tabCountBadgeTextActiveRecall: {
      color: isDark ? '#3FA573' : '#26734D',
    },
    tabCountBadgeTextActiveMatrix: {
      color: isDark ? '#3FA573' : '#26734D',
    },
    tabCountBadgeTextActiveNotes: {
      color: isDark ? '#D9822B' : '#A65A0A',
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
      backgroundColor: isDark ? 'rgba(111, 186, 255, 0.18)' : 'rgba(185, 87, 10, 0.12)',
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
      color: isDark ? '#7A8499' : '#5F6B80',
      letterSpacing: 0.1,
    },
    dotSeparator: {
      fontSize: 12,
      color: isDark ? '#5F6B80' : theme.textMuted,
    },
    sourceDateText: {
      fontSize: 12,
      color: isDark ? '#7A8499' : theme.textMuted,
    },

    /* Notes Section Styles */
    notesSection: {
      marginBottom: 16,
      borderRadius: 10,
      backgroundColor: isDark ? '#151A25' : '#FAF9F6',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#EAE5DC',
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
      backgroundColor: isDark ? '#A65A0A' : '#A65A0A',
    },
    notesTagBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    notesSubheading: {
      fontSize: 11.5,
      color: isDark ? '#7A8499' : '#5F6B80',
      lineHeight: 16,
    },
    openFullNotesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E9EDF9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#CBD3EB',
    },
    openFullNotesBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#3FA573' : '#974606',
    },
    noteInputCard: {
      borderRadius: 8,
      backgroundColor: isDark ? '#1E2535' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#EAE5DC',
      padding: 10,
      gap: 8,
    },
    noteTextInput: {
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#F0EDE6' : '#1C2433',
      minHeight: 56,
      textAlignVertical: 'top',
    },
    noteInputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#262E40' : '#F0EDE6',
      paddingTop: 8,
    },
    noteCharHint: {
      fontSize: 11,
      color: isDark ? '#5F6B80' : '#7A8499',
    },
    saveNoteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: isDark ? '#3D5A99' : '#3D5A99',
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
      backgroundColor: isDark ? '#1E2535' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#EAE5DC',
      borderLeftWidth: 3.5,
      borderLeftColor: isDark ? '#A65A0A' : '#A65A0A',
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
      color: isDark ? '#7A8499' : '#5F6B80',
    },
    savedNoteContent: {
      fontSize: 12.5,
      lineHeight: 18,
      color: isDark ? '#EAE5DC' : '#1C2433',
    },
    notesEmptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 6,
    },
    notesEmptyText: {
      fontSize: 11.5,
      color: isDark ? '#5F6B80' : '#7A8499',
      textAlign: 'center',
      maxWidth: 280,
    },

    /* B. Headline & Overview */
    headline: {
      fontSize: isDesktop ? 19 : 17.5,
      fontWeight: '700',
      lineHeight: isDesktop ? 26.5 : 24.5,
      color: isDark ? '#FAF9F6' : theme.textPrimary,
      letterSpacing: -0.2,
      maxWidth: isDesktop ? 780 : '96%',
      marginBottom: 10,
      minHeight: isDesktop ? 54 : 48,
    },
    summaryOverviewCard: {
      backgroundColor: isDark ? '#262E40' : '#FFFFFF',
      borderRadius: 9,
      borderWidth: 1,
      borderColor: isDark ? '#333D52' : '#CBD3EB',
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
      color: isDark ? '#EAE5DC' : '#333D52',
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
      backgroundColor: isDark ? '#151A25' : '#E9EDF9',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#CBD3EB',
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
      backgroundColor: isDark ? '#8892A6' : '#3D5A99',
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
      color: isDark ? '#EAE5DC' : '#262E40',
      letterSpacing: 0.05,
    },
    summaryBoldText: {
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1E2535',
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
      color: isDark ? '#7A8499' : '#34508F',
    },
    takeawayCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? '#1E2535' : '#E9EDF9',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#F2C9A3',
    },
    takeawayCountText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#F2C9A3' : '#3D5A99',
    },
    takeawaysList: {
      gap: 10,
      backgroundColor: isDark ? '#1E2535' : '#E9EDF9',
      borderRadius: 9,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#D9822B' : '#3D5A99',
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : '#E9EDF9',
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
      backgroundColor: isDark ? '#B9570A' : '#3D5A99',
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
      color: isDark ? '#EAE5DC' : '#1C2433',
    },

    /* D & E. Collapsible Blocks */
    collapsibleBlock: {
      borderRadius: 10,
      backgroundColor: isDark ? '#151A25' : '#FAF9F6',
      borderWidth: 1,
      borderColor: isDark ? '#262E40' : '#EAE5DC',
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
      color: isDark ? '#FAF9F6' : theme.textPrimary,
    },
    factCounterBadge: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#3FA573' : '#26734D',
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? '#26734D' : 'transparent',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    syllabusPaperTag: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#CBD3EB' : '#3D4A66',
      backgroundColor: isDark ? '#333D52' : '#E9EDF9',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? '#333D52' : 'transparent',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    collapsibleContent: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#262E40' : '#EAE5DC',
    },

    /* D. Matrix Table */
    matrixTable: {
      gap: 8,
    },
    matrixCardItem: {
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
      borderRadius: 9,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#16382A' : '#BFDECB',
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#3FA573' : '#26734D',
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
      backgroundColor: isDark ? '#3FA573' : '#26734D',
    },
    matrixLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: isDark ? '#3FA573' : '#26734D',
      letterSpacing: 0.3,
    },
    matrixValue: {
      fontSize: 13.5,
      lineHeight: 19,
      color: isDark ? '#E3F1E8' : '#16382A',
    },
    matrixListFallback: {
      gap: 6,
    },
    matrixFallbackItem: {
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#7A8499' : theme.textSecondary,
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
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
      borderWidth: 1,
      borderColor: isDark ? '#1D4A38' : '#E3F1E8',
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
      backgroundColor: isDark ? '#26734D' : '#26734D',
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
      color: isDark ? '#3FA573' : '#26734D',
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
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
      borderWidth: 1,
      borderColor: isDark ? '#1D4A38' : '#3FA573',
    },
    recallScoreText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#3FA573' : '#26734D',
    },
    recallResetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? '#16382A' : '#F0EDE6',
      borderWidth: 1,
      borderColor: isDark ? '#1D4A38' : '#EAE5DC',
    },
    recallResetBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#3FA573' : '#5F6B80',
    },
    recallQuestionsList: {
      gap: 12,
    },
    recallQuestionCard: {
      borderRadius: 10,
      padding: 12,
      backgroundColor: isDark ? '#16382A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#1D4A38' : '#EAE5DC',
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
      backgroundColor: isDark ? '#16382A' : '#E3F1E8',
    },
    recallQBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: isDark ? '#3FA573' : '#26734D',
    },
    recallTopicTag: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#3FA573' : '#5F6B80',
      flex: 1,
    },
    recallQuestionPrompt: {
      fontSize: 13.5,
      fontWeight: '600',
      lineHeight: 20,
      color: isDark ? '#E3F1E8' : '#1C2433',
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
      backgroundColor: isDark ? '#16382A' : '#FAF9F6',
      borderWidth: 1,
      borderColor: isDark ? '#1D4A38' : '#EAE5DC',
    },
    recallOptionBtnHover: {
      backgroundColor: isDark ? '#16382A' : '#F0EDE6',
      borderColor: isDark ? '#1D5C3D' : '#DDD6CA',
    },
    recallOptionBtnCorrect: {
      backgroundColor: isDark ? 'rgba(38, 115, 77, 0.15)' : '#E3F1E8',
      borderColor: isDark ? '#26734D' : '#26734D',
    },
    recallOptionBtnWrong: {
      backgroundColor: isDark ? 'rgba(180, 35, 24, 0.15)' : '#FBE4E1',
      borderColor: isDark ? '#B42318' : '#B42318',
    },
    recallOptionKeyBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#16382A' : '#EAE5DC',
    },
    recallOptionKeyBadgeCorrect: {
      backgroundColor: isDark ? '#26734D' : '#26734D',
    },
    recallOptionKeyBadgeWrong: {
      backgroundColor: isDark ? '#B42318' : '#B42318',
    },
    recallOptionKeyText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#3FA573' : '#4A5568',
    },
    recallOptionKeyTextHighlight: {
      color: '#FFFFFF',
    },
    recallOptionText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      color: isDark ? '#E3F1E8' : '#3F4A5E',
    },
    recallOptionTextCorrect: {
      color: isDark ? '#BFDECB' : '#1D5C3D',
      fontWeight: '600',
    },
    recallOptionTextWrong: {
      color: isDark ? '#F3C4BF' : '#6E1F18',
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
      backgroundColor: isDark ? 'rgba(38, 115, 77, 0.08)' : '#E3F1E8',
      borderLeftColor: isDark ? '#26734D' : '#26734D',
      borderColor: isDark ? '#16382A' : '#BFDECB',
    },
    recallFeedbackWrong: {
      backgroundColor: isDark ? 'rgba(180, 35, 24, 0.08)' : '#FBE4E1',
      borderLeftColor: isDark ? '#B42318' : '#B42318',
      borderColor: isDark ? '#6E1F18' : '#F3C4BF',
    },
    recallFeedbackHeading: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    recallFeedbackHeadingCorrect: {
      color: isDark ? '#3FA573' : '#26734D',
    },
    recallFeedbackHeadingWrong: {
      color: isDark ? '#E0675B' : '#B42318',
    },
    recallExplanationText: {
      fontSize: 12,
      lineHeight: 17.5,
      color: isDark ? '#EAE5DC' : '#1C2433',
    },
    recallSyllabusBox: {
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1D4A38' : 'rgba(0, 0, 0, 0.06)',
      gap: 2,
    },
    recallSyllabusTag: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#3FA573' : '#26734D',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    recallSyllabusText: {
      fontSize: 11.5,
      lineHeight: 16.5,
      color: isDark ? '#3FA573' : '#1D5C3D',
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
      borderTopColor: isDark ? '#1E2535' : '#EAE5DC',
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
      backgroundColor: isDark ? '#333D52' : '#FCEBDD',
      borderColor: isDark ? '#3D5A99' : '#F2C9A3',
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
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#333D52' : '#EAE5DC',
    },
    geminiNavBtnDisabled: {
      opacity: 0.35,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    geminiNavBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1C2433',
    },
    geminiNavBtnTextDisabled: {
      color: isDark ? '#333D52' : '#C9CFDB',
    },
    geminiNavDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 4,
    },
    geminiNavDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? '#333D52' : '#DDD6CA',
    },
    geminiNavDotActive: {
      width: 14,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: PALETTE.highlight.primary,
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
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#333D52' : '#EAE5DC',
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
      backgroundColor: isDark ? '#262E40' : '#FAF9F6',
      borderColor: isDark ? '#333D52' : '#8892A6',
      transform: [{ scale: 1.06 }],
    },
    sideNavArrowBtnPressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.85,
    },
    sideNavArrowBtnDisabled: {
      opacity: 0.28,
      borderColor: isDark ? '#1C2433' : '#EAE5DC',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.6)',
    },
  });
