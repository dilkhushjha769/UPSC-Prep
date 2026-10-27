import { BW_THEME } from '@/constants/bwTheme';
import {
  CuratedArticle,
  DAILY_EVENTS_DATA,
  DailyEventItem,
  DayEventsSummary,
  FORMAT_CATEGORIES,
  FormatCategory,
  getDailyEventsSummary,
  MajorEvent,
  NEWS_AGENCIES,
  RECENT_MAJOR_EVENTS,
} from '@/data/currentAffairsData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bookmark,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Filter,
  Landmark,
  Layers,
  ListChecks,
  MessagesSquare,
  Newspaper,
  Scale,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ArticleDetailModal } from './currentAffairs/ArticleDetailModal';
import { CalendarDropdown } from './currentAffairs/CalendarDropdown';
import { CAQuizModal } from './currentAffairs/CAQuizModal';
import { DailyEventCard } from './currentAffairs/DailyEventCard';
import { DailyRecallModal } from './currentAffairs/DailyRecallModal';
import { FormatFeedModal } from './currentAffairs/FormatFeedModal';
import { MonthlyRevisionModal } from './currentAffairs/MonthlyRevisionModal';
import { NotesLibraryModal } from './currentAffairs/NotesLibraryModal';

type DetailItem =
  | { type: 'event'; data: DailyEventItem }
  | { type: 'major'; data: MajorEvent }
  | { type: 'article'; data: CuratedArticle };

interface CurrentAffairsViewProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function CurrentAffairsView({ isDark = true, onToggleTheme }: CurrentAffairsViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  // Bookmarking state
  const [savedItemIds, setSavedItemIds] = useState<string[]>(['de_25_1', 'me_1']);
  const toggleBookmark = (id: string) => {
    setSavedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const isBookmarked = (id: string) => savedItemIds.includes(id);

  // Selected date for Daily Events (defaults to today)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(DAILY_EVENTS_DATA[0].dateKey);

  // Slide state for Daily Event Summary inside container (one event at a time)
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);

  // Set of read/completed dates by the user
  const [readDates, setReadDates] = useState<string[]>(['2026-10-24']);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem('@upsc_ca_read_dates');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setReadDates(parsed);
          }
        }
      } catch {
        // Fallback to initial state
      }
    })();
  }, []);

  const handleToggleDayRead = () => {
    setReadDates((prev) => {
      const isRead = prev.includes(selectedDateKey);
      const next = isRead ? prev.filter((d) => d !== selectedDateKey) : [...prev, selectedDateKey];
      void AsyncStorage.setItem('@upsc_ca_read_dates', JSON.stringify(next));
      return next;
    });
  };

  const isCurrentDayRead = readDates.includes(selectedDateKey);

  // Compact Calendar Dropdown state
  const [calendarDropdownVisible, setCalendarDropdownVisible] = useState<boolean>(false);
  const [calendarDropdownPos, setCalendarDropdownPos] = useState<{ top: number; left?: number; right?: number }>({
    top: 210,
    left: 16,
  });
  const calendarBtnRef = useRef<React.ElementRef<typeof View>>(null);

  const handleToggleCalendar = () => {
    if (calendarDropdownVisible) {
      setCalendarDropdownVisible(false);
      return;
    }

    if (calendarBtnRef.current) {
      calendarBtnRef.current.measureInWindow((x: number, y: number, btnWidth: number, btnHeight: number) => {
        const top = Math.max(120, y + btnHeight + 8);
        const left = Math.max(12, Math.min(x, width - 296));
        setCalendarDropdownPos({ top, left });
        setCalendarDropdownVisible(true);
      });
    } else {
      setCalendarDropdownVisible(true);
    }
  };

  // Selected News Agency Filter for Explore Current Affairs
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');

  // Modals state
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [selectedFormatCategory, setSelectedFormatCategory] = useState<FormatCategory | null>(null);
  const [formatModalVisible, setFormatModalVisible] = useState(false);

  const [notesLibraryModalVisible, setNotesLibraryModalVisible] = useState(false);
  const [notesLibraryInitialTab, setNotesLibraryInitialTab] = useState<'notes' | 'library'>('notes');
  const [initialNoteTitle, setInitialNoteTitle] = useState<string>('');

  const [activeDetailItem, setActiveDetailItem] = useState<DetailItem | null>(null);
  const [articleModalVisible, setArticleModalVisible] = useState(false);

  const [dailyRecallModalVisible, setDailyRecallModalVisible] = useState(false);

  // Active day data retrieved from data or dynamic fallback
  const activeDaySummary: DayEventsSummary = useMemo(() => {
    return getDailyEventsSummary(selectedDateKey);
  }, [selectedDateKey]);

  const activeDailyEvents: DailyEventItem[] = activeDaySummary.events;

  // Safe active event item
  const currentDailyEvent: DailyEventItem | undefined =
    activeDailyEvents[activeEventIndex] || activeDailyEvents[0];

  // Handlers for modal interactions
  const handleOpenDailyEvent = (item: DailyEventItem) => {
    setActiveDetailItem({ type: 'event', data: item });
    setArticleModalVisible(true);
  };

  const handleAddNoteForEvent = (item: DailyEventItem) => {
    setInitialNoteTitle(item.headline);
    setNotesLibraryInitialTab('notes');
    setNotesLibraryModalVisible(true);
  };

  const handleOpenFormatModal = (cat: FormatCategory) => {
    setSelectedFormatCategory(cat);
    setFormatModalVisible(true);
  };

  const handleSelectArticleFromFormat = (art: CuratedArticle) => {
    setActiveDetailItem({ type: 'article', data: art });
    setArticleModalVisible(true);
  };

  // Card sliding animation values for mobile gestures & transitions
  const [translateX] = useState(() => new Animated.Value(0));
  const [cardOpacity] = useState(() => new Animated.Value(1));

  // Reset animations when date changes
  useEffect(() => {
    translateX.setValue(0);
    cardOpacity.setValue(1);
  }, [selectedDateKey, cardOpacity, translateX]);

  const animateCardTransition = useCallback(
    (direction: 'next' | 'prev', callback: () => void) => {
      const exitValue = direction === 'next' ? -220 : 220;
      const enterValue = direction === 'next' ? 180 : -180;

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: exitValue,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0.25,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        translateX.setValue(enterValue);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [cardOpacity, translateX]
  );

  const handlePrevEvent = useCallback(() => {
    if (activeEventIndex > 0) {
      animateCardTransition('prev', () => {
        setActiveEventIndex((prev) => Math.max(0, prev - 1));
      });
    }
  }, [activeEventIndex, animateCardTransition]);

  const handleNextEvent = useCallback(() => {
    if (activeEventIndex < activeDailyEvents.length - 1) {
      animateCardTransition('next', () => {
        setActiveEventIndex((prev) => Math.min(activeDailyEvents.length - 1, prev + 1));
      });
    }
  }, [activeDailyEvents.length, activeEventIndex, animateCardTransition]);

  const handleSelectEvent = useCallback(
    (index: number) => {
      if (index === activeEventIndex) return;
      const direction = index > activeEventIndex ? 'next' : 'prev';
      animateCardTransition(direction, () => {
        setActiveEventIndex(index);
      });
    },
    [activeEventIndex, animateCardTransition]
  );

  // Horizontal Slide/Swipe gesture responder for mobile & touch views
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 14 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3
          );
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 14 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3
          );
        },
        onPanResponderGrant: () => {
          translateX.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const isAtStart = activeEventIndex === 0 && gestureState.dx > 0;
          const isAtEnd = activeEventIndex >= activeDailyEvents.length - 1 && gestureState.dx < 0;
          if (isAtStart || isAtEnd) {
            translateX.setValue(gestureState.dx * 0.25);
          } else {
            translateX.setValue(gestureState.dx);
          }
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gestureState) => {
          const swipeThreshold = 45;
          const velocityThreshold = 0.25;

          // Swipe Left -> Next Event
          if (
            (gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold) &&
            activeEventIndex < activeDailyEvents.length - 1
          ) {
            handleNextEvent();
          }
          // Swipe Right -> Prev Event
          else if (
            (gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold) &&
            activeEventIndex > 0
          ) {
            handlePrevEvent();
          }
          // Snap back
          else {
            Animated.spring(translateX, {
              toValue: 0,
              friction: 7,
              tension: 50,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [activeDailyEvents.length, activeEventIndex, handleNextEvent, handlePrevEvent, translateX]
  );

  const renderFormatIcon = (iconName: string) => {
    const iconProps = { size: 20, color: theme.textPrimary, strokeWidth: 1.8 };
    switch (iconName) {
      case 'Newspaper':
        return <Newspaper {...iconProps} />;
      case 'BookOpen':
        return <BookOpen {...iconProps} />;
      case 'Layers':
        return <Layers {...iconProps} />;
      case 'Scale':
        return <Scale {...iconProps} />;
      case 'Landmark':
        return <Landmark {...iconProps} />;
      case 'MessagesSquare':
        return <MessagesSquare {...iconProps} />;
      default:
        return <BookOpen {...iconProps} />;
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Centred Content Container (Max-Width 980px on desktop) */}
      <View style={styles.centerContainer}>
        {/* ======================================================== */}
        {/* 1. TOP HEADER - Current Affairs                          */}
        {/* ======================================================== */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.pageHeading}>Current Affairs</Text>
            <Text style={styles.pageSubtitle}>
              Decode Today. Prepare for Tomorrow.
            </Text>
          </View>

          {/* Visually secondary header actions */}
          <View style={styles.headerActions}>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setInitialNoteTitle('');
                setNotesLibraryInitialTab('notes');
                setNotesLibraryModalVisible(true);
              }}
            >
              <FileText size={14} color={theme.textPrimary} strokeWidth={1.8} />
              <Text style={styles.secondaryBtnText}>Notes</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setNotesLibraryInitialTab('library');
                setNotesLibraryModalVisible(true);
              }}
            >
              <Bookmark size={14} color={theme.textPrimary} strokeWidth={1.8} />
              <Text style={styles.secondaryBtnText}>My Library</Text>
            </Pressable>
          </View>
        </View>

        {/* Divider Border between Current Affairs and Summary of Daily Events */}
        <View style={styles.headerDivider} />
        {/* ======================================================== */}
        {/* 2. THE DAILY BRIEF (RESPONSIVE SCREEN USAGE)             */}
        {/* ======================================================== */}
        <View style={styles.summarySection}>
          {isDesktop ? (
            /* Desktop Layout: Single unified horizontal row */
            <View style={styles.summaryDatesRow}>
              {/* Left Side: "The Daily Brief" Heading + Calendar Date Picker Button + Read Status */}
              <View style={styles.summaryTitleBlock}>
                <Text style={styles.summaryContainerHeading}>The Daily Brief</Text>

                {/* Calendar Button with Today's / Active Date */}
                <View ref={calendarBtnRef} collapsable={false}>
                  <Pressable
                    style={({ pressed, hovered }: any) => [
                      styles.calendarDatePillBtn,
                      hovered && styles.calendarDatePillBtnHover,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={handleToggleCalendar}
                    accessibilityLabel={`Select date. Currently showing ${activeDaySummary.label}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.calendarIconCircle}>
                      <Calendar size={14} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.calendarDatePillText}>
                      {activeDaySummary.label}
                    </Text>
                    <ChevronDown size={13} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                  </Pressable>
                </View>

                {/* Day Read Checkmark Toggle (Tick mark only) */}
                <Pressable
                  style={({ pressed }) => [
                    styles.dayReadTickBtn,
                    isCurrentDayRead && styles.dayReadTickBtnActive,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={handleToggleDayRead}
                  accessibilityLabel={isCurrentDayRead ? "Mark day as unread" : "Mark day as read"}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isCurrentDayRead }}
                  hitSlop={8}
                >
                  <Calendar size={16} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          )}

          {/* D. Adaptive Attractive Interior Event Card with Slide/Swipe Support */}
          {currentDailyEvent ? (
            <Animated.View
              style={[
                styles.eventCardLightWrapper,
                {
                  transform: [{ translateX }],
                  opacity: cardOpacity,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <DailyEventCard
                key={currentDailyEvent.id}
                event={currentDailyEvent}
                isBookmarked={isBookmarked(currentDailyEvent.id)}
                onToggleBookmark={toggleBookmark}
                onOpenDetail={handleOpenDailyEvent}
                onAddNote={handleAddNoteForEvent}
                isDark={isDark}
                onPrevEvent={handlePrevEvent}
                onNextEvent={handleNextEvent}
                onSelectEvent={handleSelectEvent}
                onOpenDailyRecall={() => setDailyRecallModalVisible(true)}
                hasPrevEvent={activeEventIndex > 0}
                hasNextEvent={activeEventIndex < activeDailyEvents.length - 1}
                eventIndex={activeEventIndex}
                totalEvents={activeDailyEvents.length}
              />
            </Animated.View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events available for this date.</Text>
            </View>
          )}
        </View>

        {/* ======================================================== */}
        {/* 4. EXPLORE BY FORMAT (SECONDARY PUBLICATION HUBS)        */}
        {/* ======================================================== */}
        <View style={styles.secondarySection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionHeading}>Explore Current Affairs</Text>
              <Text style={styles.sectionMetaHint}>Browse by format</Text>
            </View>

            {/* News Agency Filter at Right Side */}
            <View style={styles.agencyFilterWrapper}>
              <View style={styles.agencyLabelBlock}>
                <Filter size={12} color={theme.textMuted} strokeWidth={2} />
                <Text style={styles.agencyLabelText}>Agency:</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.agencyPillsList}
              >
                {NEWS_AGENCIES.map((agency) => {
                  const isSelected = selectedAgencyId === agency.id;
                  return (
                    <Pressable
                      key={agency.id}
                      style={[
                        styles.agencyFilterChip,
                        isSelected && styles.agencyFilterChipActive,
                      ]}
                      onPress={() => setSelectedAgencyId(agency.id)}
                    >
                      <Text
                        style={[
                          styles.agencyFilterChipText,
                          isSelected && styles.agencyFilterChipTextActive,
                        ]}
                      >
                        {agency.shortName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formatGrid}>
            {FORMAT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [styles.formatCard, pressed && styles.cardPressed]}
                onPress={() => handleOpenFormatModal(cat)}
              >
                <View style={styles.formatCardIconBox}>
                  {renderFormatIcon(cat.iconName)}
                </View>
                <Text style={styles.formatCardTitle}>{cat.title}</Text>
                <Text style={styles.formatCardSubtitle}>{cat.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 5. PRACTISE & REVISE                                     */}
        {/* ======================================================== */}
        <View style={styles.secondarySection}>
          <Text style={styles.sectionHeading}>Practise & Revise</Text>

          <View style={styles.reviseGrid}>
            <Pressable
              style={({ pressed }) => [styles.reviseCard, pressed && styles.cardPressed]}
              onPress={() => setQuizModalVisible(true)}
            >
              <View style={styles.reviseIconBox}>
                <ListChecks size={20} color={theme.textPrimary} strokeWidth={1.8} />
              </View>
              <Text style={styles.reviseCardTitle}>Daily Quiz</Text>
              <Text style={styles.reviseCardSubtitle}>Prelims MCQs with explanations.</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.reviseCard, pressed && styles.cardPressed]}
              onPress={() => setMonthlyModalVisible(true)}
            >
              <View style={styles.reviseIconBox}>
                <CalendarDays size={20} color={theme.textPrimary} strokeWidth={1.8} />
              </View>
              <Text style={styles.reviseCardTitle}>Monthly Revision</Text>
              <Text style={styles.reviseCardSubtitle}>Monthly compilation, topic-wise recap and tests.</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}
      <DailyRecallModal
        visible={dailyRecallModalVisible}
        onClose={() => setDailyRecallModalVisible(false)}
        dateKey={selectedDateKey}
        events={activeDailyEvents}
        isDark={isDark}
      />

      <CAQuizModal
        visible={quizModalVisible}
        onClose={() => setQuizModalVisible(false)}
        isDark={isDark}
      />

      <MonthlyRevisionModal
        visible={monthlyModalVisible}
        onClose={() => setMonthlyModalVisible(false)}
        isDark={isDark}
      />

      <FormatFeedModal
        visible={formatModalVisible}
        onClose={() => setFormatModalVisible(false)}
        formatCategory={selectedFormatCategory}
        onSelectArticle={handleSelectArticleFromFormat}
        isDark={isDark}
        savedItemIds={savedItemIds}
        onToggleBookmark={toggleBookmark}
        selectedAgencyId={selectedAgencyId}
      />

      <ArticleDetailModal
        visible={articleModalVisible}
        onClose={() => setArticleModalVisible(false)}
        item={activeDetailItem}
        isDark={isDark}
        isSaved={activeDetailItem ? isBookmarked(activeDetailItem.data.id) : false}
        onToggleSave={toggleBookmark}
      />

      <NotesLibraryModal
        visible={notesLibraryModalVisible}
        onClose={() => setNotesLibraryModalVisible(false)}
        isDark={isDark}
        initialTab={notesLibraryInitialTab}
        initialNoteTitle={initialNoteTitle}
        savedItemIds={savedItemIds}
        onRemoveSavedItem={toggleBookmark}
        onOpenItem={(id: string) => {
          for (const day of DAILY_EVENTS_DATA) {
            const ev = day.events.find((e) => e.id === id);
            if (ev) {
              setActiveDetailItem({ type: 'event', data: ev });
              setArticleModalVisible(true);
              return;
            }
          }
          const me = RECENT_MAJOR_EVENTS.find((m) => m.id === id);
          if (me) {
            setActiveDetailItem({ type: 'major', data: me });
            setArticleModalVisible(true);
            return;
          }
          for (const cat of FORMAT_CATEGORIES) {
            const art = cat.articles.find((a) => a.id === id);
            if (art) {
              setActiveDetailItem({ type: 'article', data: art });
              setArticleModalVisible(true);
              return;
            }
          }
        }}
      />

      <CalendarDropdown
        visible={calendarDropdownVisible}
        onClose={() => setCalendarDropdownVisible(false)}
        selectedDateKey={selectedDateKey}
        onSelectDate={(newDate) => {
          setSelectedDateKey(newDate);
          setActiveEventIndex(0);
        }}
        topOffset={calendarDropdownPos.top}
        leftOffset={calendarDropdownPos.left}
        rightOffset={calendarDropdownPos.right}
        isDark={isDark}
        completedDates={readDates}
      />
    </ScrollView>
  );
}

const getStyles = (
  theme: typeof BW_THEME.dark,
  isDark: boolean,
  isDesktop: boolean
) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 24 : 12,
      paddingTop: 28,
      paddingBottom: 72,
    },
    centerContainer: {
      maxWidth: 980,
      width: '100%',
      alignSelf: 'center',
    },

    /* 1. Header */
    header: {
      flexDirection: isDesktop ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isDesktop ? 'center' : 'flex-start',
      marginBottom: 24,
      gap: 14,
    },
    titleBlock: {
      flex: 1,
    },
    pageHeading: {
      fontSize: isDesktop ? 30 : 26,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textMuted,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    headerDivider: {
      height: 1,
      backgroundColor: isDark ? '#1F2E45' : '#E2E8F0',
      marginBottom: 20,
      marginTop: 2,
    },

    /* 2. Daily Events Summary Section (Unwrapped & Clean for full mobile width) */
    summarySection: {
      marginBottom: 32,
    },
    summarySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    summaryTitleBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    summaryContainerHeading: {
      fontSize: 19,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : theme.textPrimary,
      letterSpacing: -0.2,
    },
    summaryDateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 7,
      backgroundColor: isDark ? '#172554' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
    },
    summaryDateBadgeRead: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
    },
    summaryDateBadgeText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDark ? '#93C5FD' : '#1E3A8A',
    },
    summaryDateBadgeTextRead: {
      color: isDark ? '#6EE7B7' : '#047857',
    },
    readCheckCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.3,
      borderColor: isDark ? '#475569' : '#94A3B8',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    readCheckCircleActive: {
      backgroundColor: isDark ? '#059669' : '#10B981',
      borderColor: isDark ? '#059669' : '#10B981',
    },

    /* Header Row: The Daily Brief Heading on Left | Prominent Daily Quiz on Right (Desktop) */
    summaryDatesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
    },

    /* Mobile 2-Tier Header Layout (Uncluttered, Mobbin inspired) */
    mobileSummaryHeader: {
      marginBottom: 14,
      gap: 10,
    },
    mobileSummaryTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    mobileSummarySubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
      borderWidth: 1,
      borderRightWidth: 0,
      borderColor: isDark ? '#494A50' : '#D4D6DD',
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      overflow: 'hidden',
    },

    /* Calendar Button with Today's Date */
    calendarDatePillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingLeft: 7,
      paddingRight: 10,
      paddingVertical: 5.5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.28)' : '#BAE6FD',
    },
    calendarDatePillBtnHover: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE',
      borderColor: isDark ? '#38BDF8' : '#0284C7',
    },
    calendarIconCircle: {
      width: 22,
      height: 22,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: isDesktop ? 44 : 37,
      borderRightWidth: 1,
      borderRightColor: isDark ? '#494A50' : '#E8E9F1',
      position: 'relative',
    },
    threeDateItemFirst: {
      borderLeftWidth: 0,
    },
    threeDateItemActive: {
      backgroundColor: '#006FFD',
    },
    threeDateDayName: {
      fontSize: 9,
      fontWeight: '600',
      color: isDark ? '#8F9098' : '#71727A',
      marginBottom: 1,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    threeDateNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1.5,
    },
    threeDateNumber: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1F2024',
    },
    threeDateTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    threeDateCheckIcon: {
      marginLeft: 1,
    },
    threeDateActiveIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 4,
      right: 4,
      height: 2,
      borderRadius: 1,
      backgroundColor: '#6FBAFF',
    },
    attachedCalendarBtn: {
      width: 38,
      height: 38,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#494A50' : '#D4D6DD',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#141E2D' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#23334A' : '#E2E8F0',
    },
    dayReadTickBtnActive: {
      backgroundColor: isDark ? '#059669' : '#10B981',
      borderColor: isDark ? '#10B981' : '#059669',
    },

    /* Prominent Daily Quiz Button at Right Corner */
    prominentDailyQuizBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: isDesktop ? 14 : 11,
      paddingRight: isDesktop ? 12 : 9,
      paddingVertical: isDesktop ? 7.5 : 6.5,
      borderRadius: 9,
      backgroundColor: isDark ? '#0284C7' : '#0284C7',
      borderWidth: 1,
      borderColor: isDark ? '#38BDF8' : '#0369A1',
      shadowColor: '#0284C7',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    prominentDailyQuizBtnHover: {
      backgroundColor: isDark ? '#0369A1' : '#0369A1',
      borderColor: '#38BDF8',
      transform: [{ translateY: -1 }],
    },
    prominentDailyQuizBtnText: {
      fontSize: isDesktop ? 13 : 12,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    prominentDailyQuizBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    prominentDailyQuizBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },

    /* Adaptive Interior Event Card Wrapper */
    eventCardLightWrapper: {
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
      ...(!isDark
        ? {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }
        : {}),
    },
    emptyContainer: {
      padding: 30,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: theme.textMuted,
    },



    /* 4 & 5. Secondary Sections */
    secondarySection: {
      marginBottom: 36,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
    },
    sectionHeaderRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isDesktop ? 'center' : 'flex-start',
      marginBottom: 16,
      gap: 12,
    },
    sectionTitleBlock: {
      flexShrink: 0,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    sectionMetaHint: {
      fontSize: 12.5,
      color: theme.textMuted,
    },
    agencyFilterWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: isDesktop ? '60%' : '100%',
    },
    agencyLabelBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingRight: 2,
    },
    agencyLabelText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
    agencyPillsList: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    agencyFilterChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    agencyFilterChipActive: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      borderColor: isDark ? '#FFFFFF' : '#0F172A',
    },
    agencyFilterChipText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    agencyFilterChipTextActive: {
      color: isDark ? '#000000' : '#FFFFFF',
    },
    formatGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    formatCard: {
      width: isDesktop ? '48.8%' : '100%',
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    cardPressed: {
      opacity: 0.88,
    },
    formatCardIconBox: {
      marginBottom: 10,
    },
    formatCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    formatCardSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textMuted,
    },
    reviseGrid: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 12,
    },
    reviseCard: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    reviseIconBox: {
      marginBottom: 10,
    },
    reviseCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    reviseCardSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textMuted,
    },
  });
