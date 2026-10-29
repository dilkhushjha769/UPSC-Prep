import { Button } from '@/components/ui/Button';
import { BW_THEME } from '@/constants/bwTheme';
import { PALETTE } from '@/constants/colors';
import {
  CACategoryStatusItem,
  CAIngestionLogItem,
  CuratedArticle,
  DAILY_EVENTS_DATA,
  DailyEventItem,
  DayEventsSummary,
  FORMAT_CATEGORIES,
  FormatCategory,
  getDailyEventsSummary,
  getTodayDateKey,
  MajorEvent,
  NEWS_AGENCIES,
  RECENT_MAJOR_EVENTS,
} from '@/data/currentAffairsData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  Bookmark,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
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
  Modal,
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
import { PipelineStatusModal } from './currentAffairs/PipelineStatusModal';
import {
  fetchCategoryStatuses,
  fetchIngestionOperationalLogs,
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

  // Selected date for Daily Events (defaults to dynamic today)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => getTodayDateKey());

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
        const left = Math.max(12, Math.min(x, width - 336));
        setCalendarDropdownPos({ top, left });
        setCalendarDropdownVisible(true);
      });
    } else {
      setCalendarDropdownVisible(true);
    }
  };

  // Selected News Agency Filter for Explore Current Affairs (Dropdown Menu)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');
  const [agencyDropdownVisible, setAgencyDropdownVisible] = useState<boolean>(false);
  const [agencyDropdownPos, setAgencyDropdownPos] = useState<{ top: number; left: number }>({
    top: 320,
    left: 16,
  });
  const agencyBtnRef = useRef<React.ElementRef<typeof View>>(null);

  const selectedAgency = useMemo(
    () => NEWS_AGENCIES.find((a) => a.id === selectedAgencyId) || NEWS_AGENCIES[0],
    [selectedAgencyId]
  );

  const handleToggleAgencyDropdown = () => {
    if (agencyDropdownVisible) {
      setAgencyDropdownVisible(false);
      return;
    }

    if (agencyBtnRef.current) {
      agencyBtnRef.current.measureInWindow((x: number, y: number, btnWidth: number, btnHeight: number) => {
        const menuWidth = 220;
        const top = Math.max(80, y + btnHeight + 6);
        const left = Math.max(12, Math.min(x + btnWidth - menuWidth, width - menuWidth - 12));
        setAgencyDropdownPos({ top, left });
        setAgencyDropdownVisible(true);
      });
    } else {
      setAgencyDropdownVisible(true);
    }
  };

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
  const [recallTargetEvent, setRecallTargetEvent] = useState<DailyEventItem | null>(null);
  const [pipelineStatusModalVisible, setPipelineStatusModalVisible] = useState(false);

  // Live authentic news state + operational telemetry from Supabase / verified snapshot
  const [liveAgencyEvents, setLiveAgencyEvents] = useState<DailyEventItem[]>([]);
  const [categoryStatuses, setCategoryStatuses] = useState<CACategoryStatusItem[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<CAIngestionLogItem[]>([]);
  const [isPipelineSyncing, setIsPipelineSyncing] = useState(false);

  const loadPipelineData = useCallback(async (agencyId: string) => {
    setIsPipelineSyncing(true);
    try {
      const [liveItems, statuses, logs] = await Promise.all([
        fetchLiveNewsFromAgencies(agencyId),
        fetchCategoryStatuses(),
        fetchIngestionOperationalLogs(),
      ]);
      if (liveItems && liveItems.length > 0) {
        setLiveAgencyEvents(liveItems);
      }
      if (statuses && statuses.length > 0) {
        setCategoryStatuses(statuses);
      }
      if (logs && logs.length > 0) {
        setIngestionLogs(logs);
      }
    } catch {
      // Fallback to cached/pre-seeded items
    } finally {
      setIsPipelineSyncing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      // 1. Load cached authentic news immediately for instant display
      const cached = await getCachedAuthenticNews();
      if (isMounted && cached && cached.length > 0) {
        setLiveAgencyEvents(cached);
      }

      // 2. Fetch fresh verified news + category status + operational logs
      if (isMounted) {
        await loadPipelineData(selectedAgencyId);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedAgencyId, loadPipelineData]);


  // Active day data retrieved from data or dynamic fallback
  const activeDaySummary: DayEventsSummary = useMemo(() => {
    return getDailyEventsSummary(selectedDateKey);
  }, [selectedDateKey]);

  const isToday = selectedDateKey === getTodayDateKey() || selectedDateKey === DAILY_EVENTS_DATA[0].dateKey;

  /**
   * The Daily Brief strictly curates 3 to 7 most important must-know UPSC news items for the selected day.
   * All remaining news items are available in Explore Current Affairs -> Daily News & Category Feeds.
   */
  const activeDailyEvents: DailyEventItem[] = useMemo(() => {
    const baseEvents = activeDaySummary.events;

    // Match live events belonging to the selected date (or today)
    const dateMatchedLive = liveAgencyEvents.filter((item) => {
      if (item.dateKey) return item.dateKey === selectedDateKey;
      return isToday;
    });

    // Prioritize high-relevance UPSC stories (Official PIB/RBI/SC releases, UPSC Essentials, and stories with verified images)
    const rankedLive = [...dateMatchedLive].sort((a, b) => {
      const scoreA =
        (a.relevanceScore || 0.8) +
        (a.sourceTier === 'official' ? 0.25 : 0) +
        (a.imageUrl ? 0.15 : 0);
      const scoreB =
        (b.relevanceScore || 0.8) +
        (b.sourceTier === 'official' ? 0.25 : 0) +
        (b.imageUrl ? 0.15 : 0);
      return scoreB - scoreA;
    });

    let pool: DailyEventItem[] = [...baseEvents];

    if (rankedLive.length > 0) {
      const seen = new Set<string>();
      const merged: DailyEventItem[] = [];
      // Place curated must-know base events first, then top-ranked live stories up to 7 items
      for (const item of [...baseEvents, ...rankedLive]) {
        const key = item.headline.toLowerCase().slice(0, 32);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
      pool = merged;
    }

    // Filter by selected agency if chosen
    if (selectedAgencyId !== 'all') {
      const agency = NEWS_AGENCIES.find((a) => a.id === selectedAgencyId);
      if (agency?.matchKeyword) {
        const kw = agency.matchKeyword.toLowerCase();
        const matched = pool.filter(
          (e) => e.agencyId === selectedAgencyId || e.source.toLowerCase().includes(kw)
        );
        if (matched.length >= 3) {
          return matched.slice(0, 7);
        }
        // Ensure at least 3 items in The Daily Brief by supplementing from the day's top events
        const supplemented = [...matched];
        for (const item of pool) {
          if (supplemented.length >= 3) break;
          if (!supplemented.some((s) => s.id === item.id)) {
            supplemented.push(item);
          }
        }
        return supplemented.slice(0, 7);
      }
    }

    // Enforce 3 to 7 most important UPSC events per day in The Daily Brief
    return pool.slice(0, 7);
  }, [activeDaySummary.events, isToday, liveAgencyEvents, selectedAgencyId, selectedDateKey]);

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

  // Prefetch event images into memory/disk cache so transitions and rendering are instant
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

    if (eventUrls.length > 0) {
      Image.prefetch(eventUrls);
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
    const iconColor = isDark ? '#6FBAFF' : '#006FFD';
    const iconProps = { size: 22, color: iconColor, strokeWidth: 2 };
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

            {/* Symbols only: Pipeline Health, Notes, and My Library */}
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }: any) => [
                  styles.headerIconBtn,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setPipelineStatusModalVisible(true)}
                accessibilityLabel="Pipeline Operational Status"
                accessibilityRole="button"
                hitSlop={6}
              >
                <Activity
                  size={16}
                  color={isDark ? '#4ADE80' : '#059669'}
                  strokeWidth={2}
                />
              </Pressable>

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
                      calendarDropdownVisible && styles.calendarDatePillBtnOpen,
                      hovered && styles.calendarDatePillBtnHover,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={handleToggleCalendar}
                    accessibilityLabel={`Select date. Currently showing ${activeDaySummary.label}`}
                    accessibilityRole="button"
                  >
                    <Calendar size={14} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.2} />
                    <Text style={styles.calendarDatePillText}>
                      {activeDaySummary.label}
                    </Text>
                    <ChevronDown
                      size={13}
                      color={calendarDropdownVisible ? '#006FFD' : (isDark ? '#8F9098' : '#71727A')}
                      strokeWidth={2.2}
                    />
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
                    color={isCurrentDayRead ? '#FFFFFF' : (isDark ? '#8F9098' : '#71727A')}
                    strokeWidth={2.8}
                  />
                </Pressable>
              </View>

              {/* Right Corner: Standard App Primary Button for Daily Quiz */}
              <Button
                variant="primary"
                size="sm"
                title="Daily Quiz"
                isDark={isDark}
                leftIcon={<ListChecks size={14} color="#FFFFFF" strokeWidth={2.2} />}
                onPress={() => {
                  setRecallTargetEvent(null);
                  setDailyRecallModalVisible(true);
                }}
              />
            </View>
          ) : (
            /* Mobile Layout: 2-Tier Clean Hierarchy */
            <View style={styles.mobileSummaryHeader}>
              {/* Row 1: The Daily Brief Title on Left + Daily Quiz Button on Right */}
              <View style={styles.mobileSummaryTopRow}>
                <Text style={styles.summaryContainerHeading}>The Daily Brief</Text>

                <Button
                  variant="primary"
                  size="sm"
                  title="Daily Quiz"
                  isDark={isDark}
                  leftIcon={<ListChecks size={13} color="#FFFFFF" strokeWidth={2.2} />}
                  onPress={() => {
                    setRecallTargetEvent(null);
                    setDailyRecallModalVisible(true);
                  }}
                />
              </View>

              {/* Row 2: Date Selector on Left + Read Status on Right */}
              <View style={styles.mobileSummarySubRow}>
                {/* Calendar Button with Today's / Active Date */}
                <View ref={calendarBtnRef} collapsable={false}>
                  <Pressable
                    style={({ pressed }: any) => [
                      styles.calendarDatePillBtn,
                      calendarDropdownVisible && styles.calendarDatePillBtnOpen,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={handleToggleCalendar}
                    accessibilityLabel={`Select date. Currently showing ${activeDaySummary.label}`}
                    accessibilityRole="button"
                  >
                    <Calendar size={14} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.2} />
                    <Text style={styles.calendarDatePillText}>
                      {activeDaySummary.label}
                    </Text>
                    <ChevronDown
                      size={13}
                      color={calendarDropdownVisible ? '#006FFD' : (isDark ? '#8F9098' : '#71727A')}
                      strokeWidth={2.2}
                    />
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
                    color={isCurrentDayRead ? '#FFFFFF' : (isDark ? '#8F9098' : '#71727A')}
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
                  onOpenDailyRecall={() => {
                    setRecallTargetEvent(null);
                    setDailyRecallModalVisible(true);
                  }}
                  onOpenEventRecall={(item) => {
                    setRecallTargetEvent(item);
                    setDailyRecallModalVisible(true);
                  }}
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

            {/* News Agency Dropdown Menu Button at Right Side */}
            <View ref={agencyBtnRef} collapsable={false}>
              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.agencyDropdownBtn,
                  agencyDropdownVisible && styles.agencyDropdownBtnOpen,
                  hovered && styles.agencyDropdownBtnHover,
                  pressed && styles.cardPressed,
                ]}
                onPress={handleToggleAgencyDropdown}
                accessibilityRole="button"
                accessibilityLabel={`Filter by agency. Currently selected: ${selectedAgency.name}`}
              >
                <Filter size={13} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.2} />
                <Text style={styles.agencyDropdownBtnText} numberOfLines={1}>
                  {selectedAgency.name}
                </Text>
                <ChevronDown
                  size={13}
                  color={agencyDropdownVisible ? '#006FFD' : (isDark ? '#8F9098' : '#71727A')}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.formatGrid}>
            {FORMAT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.formatCard,
                  styles.formatCardDivider,
                  pressed && styles.formatCardPressed,
                ]}
                onPress={() => handleOpenFormatModal(cat)}
              >
                {renderFormatIcon(cat.iconName)}
                <View style={styles.formatTextContent}>
                  <Text style={styles.formatCardTitle}>{cat.title}</Text>
                </View>
                <ChevronRight size={16} color={theme.textMuted} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 5. PRACTISE & REVISE                                     */}
        {/* ======================================================== */}
        <View style={styles.practiseSection}>
          <Text style={styles.sectionHeading}>Practise & Revise</Text>

          <View style={styles.reviseGrid}>
            <Pressable
              style={({ pressed }) => [styles.reviseCard, pressed && styles.cardPressed]}
              onPress={() => setQuizModalVisible(true)}
            >
              <View style={styles.reviseIconBox}>
                <ListChecks size={20} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
              </View>
              <Text style={styles.reviseCardTitle}>Daily Quiz</Text>
              <Text style={styles.reviseCardSubtitle}>Prelims MCQs with explanations.</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.reviseCard, pressed && styles.cardPressed]}
              onPress={() => setMonthlyModalVisible(true)}
            >
              <View style={styles.reviseIconBox}>
                <CalendarDays size={20} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
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
        onClose={() => {
          setDailyRecallModalVisible(false);
          setRecallTargetEvent(null);
        }}
        dateKey={selectedDateKey}
        events={activeDailyEvents}
        singleEvent={recallTargetEvent}
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

      <PipelineStatusModal
        visible={pipelineStatusModalVisible}
        onClose={() => setPipelineStatusModalVisible(false)}
        isDark={isDark}
        categoryStatuses={categoryStatuses}
        ingestionLogs={ingestionLogs}
        onTriggerRefresh={() => void loadPipelineData(selectedAgencyId)}
        isRefreshing={isPipelineSyncing}
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

      {/* Agency Filter Dropdown Menu */}
      {agencyDropdownVisible && (
        <Modal
          visible={agencyDropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAgencyDropdownVisible(false)}
        >
          <View style={styles.dropdownOverlay}>
            <Pressable
              style={styles.dropdownBackdrop}
              onPress={() => setAgencyDropdownVisible(false)}
            />
            <View
              style={[
                styles.agencyDropdownMenu,
                {
                  top: agencyDropdownPos.top,
                  left: agencyDropdownPos.left,
                },
              ]}
            >
              <Text style={styles.agencyDropdownHeader}>Filter by News Agency</Text>
              {NEWS_AGENCIES.map((agency) => {
                const isSelected = selectedAgencyId === agency.id;
                return (
                  <Pressable
                    key={agency.id}
                    style={({ pressed }) => [
                      styles.agencyDropdownItem,
                      isSelected && styles.agencyDropdownItemActive,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      setSelectedAgencyId(agency.id);
                      setActiveEventIndex(0);
                      setAgencyDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.agencyDropdownItemText,
                        isSelected && styles.agencyDropdownItemTextActive,
                      ]}
                    >
                      {agency.name}
                    </Text>
                    {isSelected && (
                      <Check
                        size={14}
                        color={isDark ? '#6FBAFF' : '#006FFD'}
                        strokeWidth={2.5}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      )}
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
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#F0F1F5',
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
      justifyContent: 'space-between',
      gap: 10,
    },

    /* Calendar Button with Today's Date (Matches WeeklyCalendar button style) */
    calendarDatePillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    calendarDatePillBtnOpen: {
      borderColor: PALETTE.highlight.primary,
      backgroundColor: isDark ? '#383A42' : '#F8F9FE',
    },
    calendarDatePillBtnHover: {
      backgroundColor: isDark ? '#383A42' : '#F8F9FE',
      borderColor: isDark ? '#494A50' : '#D4D6DD',
    },
    calendarDatePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2024',
      letterSpacing: -0.1,
    },

    /* Day Read Status Tick Mark Button (Matches app control button style) */
    dayReadTickBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    dayReadTickBtnActive: {
      backgroundColor: '#3AC0A0',
      borderColor: '#3AC0A0',
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
      marginBottom: 32,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
    },
    practiseSection: {
      marginBottom: 36,
      paddingTop: 4,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
      flexWrap: 'wrap',
    },
    sectionTitleBlock: {
      flexShrink: 1,
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
    agencyDropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    agencyDropdownBtnOpen: {
      borderColor: PALETTE.highlight.primary,
      backgroundColor: isDark ? '#383A42' : '#F8F9FE',
    },
    agencyDropdownBtnHover: {
      backgroundColor: isDark ? '#383A42' : '#F8F9FE',
      borderColor: isDark ? '#494A50' : '#D4D6DD',
    },
    agencyDropdownBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2024',
      letterSpacing: -0.1,
    },
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    dropdownBackdrop: {
      ...StyleSheet.absoluteFill,
    },
    agencyDropdownMenu: {
      position: 'absolute',
      width: 220,
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 6,
      backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? PALETTE.neutral.dark.textMuted : '#E8E9F1',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    agencyDropdownHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#8F9098' : '#71727A',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    agencyDropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 10,
    },
    agencyDropdownItemActive: {
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.14)' : '#EAF2FF',
    },
    agencyDropdownItemText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2024',
    },
    agencyDropdownItemTextActive: {
      color: isDark ? '#6FBAFF' : '#006FFD',
      fontWeight: '700',
    },
    formatGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    formatCard: {
      width: isDesktop ? '48.2%' : '100%',
      backgroundColor: 'transparent',
      paddingVertical: 15,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    formatCardDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    formatCardPressed: {
      opacity: 0.7,
    },
    cardPressed: {
      opacity: 0.88,
    },
    formatTextContent: {
      flex: 1,
      justifyContent: 'center',
    },
    formatCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    categoryLiveStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
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
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.12)' : '#EAF2FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 111, 253, 0.25)' : '#B4DBFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
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
