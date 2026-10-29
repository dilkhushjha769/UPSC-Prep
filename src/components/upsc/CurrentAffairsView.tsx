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
  Globe,
  Landmark,
  Layers,
  Leaf,
  ListChecks,
  MessagesSquare,
  Newspaper,
  Scale,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { ArticleDetailModal } from './currentAffairs/ArticleDetailModal';
import { CalendarDropdown } from './currentAffairs/CalendarDropdown';
import { CAQuizModal } from './currentAffairs/CAQuizModal';
import { DailyEventCard } from './currentAffairs/DailyEventCard';
import { DailyRecallModal } from './currentAffairs/DailyRecallModal';
import { FormatFeedModal } from './currentAffairs/FormatFeedModal';
import { MonthlyRevisionModal } from './currentAffairs/MonthlyRevisionModal';
import { NotesLibraryModal } from './currentAffairs/NotesLibraryModal';
import {
  fetchLiveNewsFromAgencies,
  getCachedAuthenticNews,
} from '@/services/newsFeedService';

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

  // Live authentic news state fetched directly from Indian Express & The Hindu RSS
  const [liveAgencyEvents, setLiveAgencyEvents] = useState<DailyEventItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      // 1. Load cached authentic news immediately for instant display
      const cached = await getCachedAuthenticNews();
      if (isMounted && cached && cached.length > 0) {
        setLiveAgencyEvents(cached);
      }

      // 2. Fetch fresh live news from authentic agencies
      try {
        const liveItems = await fetchLiveNewsFromAgencies(selectedAgencyId);
        if (isMounted && liveItems && liveItems.length > 0) {
          setLiveAgencyEvents(liveItems);
        }
      } catch {
        // Fallback to pre-seeded authentic items
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedAgencyId]);


  // Active day data retrieved from data or dynamic fallback
  const activeDaySummary: DayEventsSummary = useMemo(() => {
    return getDailyEventsSummary(selectedDateKey);
  }, [selectedDateKey]);

  const isToday = selectedDateKey === DAILY_EVENTS_DATA[0].dateKey;

  const activeDailyEvents: DailyEventItem[] = useMemo(() => {
    const baseEvents = activeDaySummary.events;

    // Filter by selected agency if chosen
    if (selectedAgencyId !== 'all') {
      const agency = NEWS_AGENCIES.find((a) => a.id === selectedAgencyId);
      if (agency?.matchKeyword) {
        const kw = agency.matchKeyword.toLowerCase();
        const matchedBase = baseEvents.filter((e) => e.source.toLowerCase().includes(kw));
        const matchedLive = liveAgencyEvents.filter((e) => e.source.toLowerCase().includes(kw));
        const combined = [...matchedLive, ...matchedBase];
        return combined.length > 0 ? combined : baseEvents;
      }
    }

    if (isToday && liveAgencyEvents.length > 0) {
      // Merge live items with base events, de-duplicating by headline prefix
      const seen = new Set<string>();
      const merged: DailyEventItem[] = [];

      for (const item of [...liveAgencyEvents, ...baseEvents]) {
        const key = item.headline.toLowerCase().slice(0, 30);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
      return merged;
    }

    return baseEvents;
  }, [activeDaySummary.events, isToday, liveAgencyEvents, selectedAgencyId]);

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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Prefetch event images and category images into memory/disk cache so transitions and rendering are instant
  useEffect(() => {
    const eventUrls = activeDailyEvents
      .map((e) => {
        if (!e.imageUrl) return null;
        try {
          return decodeURI(e.imageUrl);
        } catch {
          return e.imageUrl;
        }
      })
      .filter((url): url is string => Boolean(url));

    const categoryUrls = FORMAT_CATEGORIES.map((c) => c.imageUrl).filter((url): url is string =>
      Boolean(url)
    );

    const allUrls = [...eventUrls, ...categoryUrls];
    if (allUrls.length > 0) {
      Image.prefetch(allUrls);
    }
  }, [activeDailyEvents]);

  // Reset animations when date changes
  useEffect(() => {
    translateX.setValue(0);
    cardOpacity.setValue(1);
  }, [selectedDateKey, cardOpacity, translateX]);

  const animateCardTransition = useCallback(
    (direction: 'next' | 'prev', callback: () => void) => {
      if (isTransitioning) return;
      setIsTransitioning(true);

      const exitValue = direction === 'next' ? -42 : 42;
      const enterValue = direction === 'next' ? 42 : -42;

      // Phase 1: Smoothly fade and glide out to complete invisibility (0 opacity)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: exitValue,
          duration: 140,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Swap event data while card is completely invisible
        callback();
        translateX.setValue(enterValue);

        // Phase 2: Smoothly glide and fade in to full visibility
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 180,
            easing: Easing.bezier(0, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 180,
            easing: Easing.bezier(0, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    },
    [cardOpacity, isTransitioning, translateX]
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

  // Auto-advance event card every 6.5s (pauses on hover or touch/press hold)
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);

  useEffect(() => {
    if (activeDailyEvents.length <= 1) return;
    if (isAutoPlayPaused) return;
    if (
      articleModalVisible ||
      notesLibraryModalVisible ||
      dailyRecallModalVisible ||
      formatModalVisible ||
      calendarDropdownVisible
    ) {
      return;
    }

    const timer = setInterval(() => {
      animateCardTransition('next', () => {
        setActiveEventIndex((prev) => (prev + 1) % activeDailyEvents.length);
      });
    }, 6500);

    return () => clearInterval(timer);
  }, [
    activeDailyEvents.length,
    isAutoPlayPaused,
    articleModalVisible,
    notesLibraryModalVisible,
    dailyRecallModalVisible,
    formatModalVisible,
    calendarDropdownVisible,
    animateCardTransition,
  ]);

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
          setIsAutoPlayPaused(true);
          cardOpacity.setValue(1);
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
          setIsAutoPlayPaused(false);
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
    [activeDailyEvents.length, activeEventIndex, cardOpacity, handleNextEvent, handlePrevEvent, translateX]
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
      case 'Globe':
        return <Globe {...iconProps} />;
      case 'Leaf':
        return <Leaf {...iconProps} />;
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
          <View style={styles.headerTopRow}>
            <Text style={styles.pageHeading}>Current Affairs</Text>

            {/* Symbols only: Notes and My Library, aligned with Current Affairs heading */}
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }: any) => [
                  styles.headerIconBtn,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => {
                  setInitialNoteTitle('');
                  setNotesLibraryInitialTab('notes');
                  setNotesLibraryModalVisible(true);
                }}
                accessibilityLabel="Notes"
                accessibilityRole="button"
                hitSlop={6}
              >
                <FileText size={16} color={theme.textPrimary} strokeWidth={1.9} />
              </Pressable>

              <Pressable
                style={({ pressed }: any) => [
                  styles.headerIconBtn,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => {
                  setNotesLibraryInitialTab('library');
                  setNotesLibraryModalVisible(true);
                }}
                accessibilityLabel="My Library"
                accessibilityRole="button"
                hitSlop={6}
              >
                <Bookmark size={16} color={theme.textPrimary} strokeWidth={1.9} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.pageSubtitle}>
            Decode Today. Prepare for Tomorrow.
          </Text>
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
                      <Calendar size={14} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
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
                  <Check
                    size={13}
                    color={isCurrentDayRead ? '#FFFFFF' : (isDark ? '#64748B' : '#94A3B8')}
                    strokeWidth={2.8}
                  />
                </Pressable>
              </View>

              {/* Right Corner: Prominent Daily Quiz Button (Main Button) */}
              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.prominentDailyQuizBtn,
                  hovered && styles.prominentDailyQuizBtnHover,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setDailyRecallModalVisible(true)}
                accessibilityLabel="Open Daily Quiz with 10 questions"
                accessibilityRole="button"
              >
                <ListChecks
                  size={14}
                  color="#FFFFFF"
                  strokeWidth={2.2}
                />
                <Text style={styles.prominentDailyQuizBtnText}>
                  Daily Quiz
                </Text>
                <View style={styles.prominentDailyQuizBadge}>
                  <Text style={styles.prominentDailyQuizBadgeText}>
                    10 Qs
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : (
            /* Mobile Layout: 2-Tier Clean Mobbin Hierarchy */
            <View style={styles.mobileSummaryHeader}>
              {/* Row 1: The Daily Brief Title on Left + Daily Quiz Button on Right */}
              <View style={styles.mobileSummaryTopRow}>
                <Text style={styles.summaryContainerHeading}>The Daily Brief</Text>

                <Pressable
                  style={({ pressed }: any) => [
                    styles.prominentDailyQuizBtn,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => setDailyRecallModalVisible(true)}
                  accessibilityLabel="Open Daily Quiz with 10 questions"
                  accessibilityRole="button"
                >
                  <ListChecks
                    size={13}
                    color="#FFFFFF"
                    strokeWidth={2.2}
                  />
                  <Text style={styles.prominentDailyQuizBtnText}>
                    Daily Quiz
                  </Text>
                  <View style={styles.prominentDailyQuizBadge}>
                    <Text style={styles.prominentDailyQuizBadgeText}>
                      10 Qs
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Row 2: Date Selector on Left + Read Status on Right */}
              <View style={styles.mobileSummarySubRow}>
                {/* Calendar Button with Today's / Active Date */}
                <View ref={calendarBtnRef} collapsable={false}>
                  <Pressable
                    style={({ pressed }: any) => [
                      styles.calendarDatePillBtn,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={handleToggleCalendar}
                    accessibilityLabel={`Select date. Currently showing ${activeDaySummary.label}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.calendarIconCircle}>
                      <Calendar size={13} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                    </View>
                    <Text style={styles.calendarDatePillText}>
                      {activeDaySummary.label}
                    </Text>
                    <ChevronDown size={12} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
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
                  <Check
                    size={13}
                    color={isCurrentDayRead ? '#FFFFFF' : (isDark ? '#64748B' : '#94A3B8')}
                    strokeWidth={2.8}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* D. Adaptive Attractive Interior Event Card with Slide/Swipe Support */}
          {currentDailyEvent ? (
            <View
              // Mouse hover hold on desktop:
              onMouseEnter={() => setIsAutoPlayPaused(true)}
              onMouseLeave={() => setIsAutoPlayPaused(false)}
              // Touch press and hold on mobile:
              onTouchStart={() => setIsAutoPlayPaused(true)}
              onTouchEnd={() => setIsAutoPlayPaused(false)}
              onTouchCancel={() => setIsAutoPlayPaused(false)}
              style={styles.eventCardOuterContainer}
            >
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
            </View>
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
              <Text style={styles.sectionMetaHint}>Browse by subject & comprehensive modules</Text>
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
                      onPress={() => {
                        setSelectedAgencyId(agency.id);
                        setActiveEventIndex(0);
                      }}
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
                {cat.imageUrl ? (
                  <Image
                    source={{ uri: cat.imageUrl }}
                    style={styles.formatThumbnailImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.formatCardIconBox}>
                    {renderFormatIcon(cat.iconName)}
                  </View>
                )}
                <View style={styles.formatTextContent}>
                  <Text style={styles.formatCardTitle}>{cat.title}</Text>
                  <Text style={styles.formatCardSubtitle}>{cat.subtitle}</Text>
                </View>
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
      marginBottom: 20,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 3,
    },
    pageHeading: {
      fontSize: isDesktop ? 30 : 25,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.4,
    },
    pageSubtitle: {
      fontSize: 13.5,
      lineHeight: 19,
      color: theme.textMuted,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIconBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
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
      backgroundColor: isDark ? '#202227' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2E323A' : '#E2E8F0',
    },
    calendarDatePillBtnHover: {
      backgroundColor: isDark ? '#282B32' : '#F8FAFC',
      borderColor: isDark ? '#3D424D' : '#CBD5E1',
    },
    calendarIconCircle: {
      width: 22,
      height: 22,
      borderRadius: 5,
      backgroundColor: isDark ? '#282B32' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarDatePillText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      letterSpacing: -0.15,
    },

    /* Day Read Status Tick Mark Button */
    dayReadTickBtn: {
      width: 32,
      height: 32,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#202227' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2E323A' : '#E2E8F0',
    },
    dayReadTickBtnActive: {
      backgroundColor: isDark ? '#059669' : '#10B981',
      borderColor: isDark ? '#059669' : '#10B981',
    },

    /* Prominent Daily Quiz Button (Primary Button aligned with Figma / BW_THEME design system) */
    prominentDailyQuizBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7.5,
      paddingLeft: isDesktop ? 13 : 11,
      paddingRight: isDesktop ? 11 : 9,
      paddingVertical: isDesktop ? 7.5 : 6.5,
      borderRadius: 8,
      backgroundColor: theme.buttonPrimaryBg,
      borderWidth: 1,
      borderColor: theme.buttonPrimaryBg,
      shadowColor: '#006FFD',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    prominentDailyQuizBtnHover: {
      backgroundColor: '#005CE6',
      borderColor: '#005CE6',
      transform: [{ translateY: -1 }],
    },
    prominentDailyQuizBtnText: {
      fontSize: isDesktop ? 13 : 12,
      fontWeight: '700',
      color: theme.buttonPrimaryText,
      letterSpacing: -0.15,
    },
    prominentDailyQuizBadge: {
      paddingHorizontal: 5.5,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    prominentDailyQuizBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.1,
    },

    /* Adaptive Interior Event Card Wrapper */
    eventCardOuterContainer: {
      width: '100%',
      position: 'relative',
      minHeight: isDesktop ? 390 : 540,
    },
    eventCardLightWrapper: {
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      minHeight: isDesktop ? 390 : 540,
      backgroundColor: isDark ? '#17191D' : 'transparent',
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
      padding: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    cardPressed: {
      opacity: 0.88,
    },
    formatThumbnailImage: {
      width: 58,
      height: 58,
      borderRadius: 10,
      backgroundColor: isDark ? '#262930' : '#E2E8F0',
      flexShrink: 0,
    },
    formatCardIconBox: {
      width: 58,
      height: 58,
      borderRadius: 10,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    formatTextContent: {
      flex: 1,
      justifyContent: 'center',
    },
    formatCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 3,
      letterSpacing: -0.2,
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
