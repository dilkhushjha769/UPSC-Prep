import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  Bookmark,
  FileText,
  RotateCcw,
} from 'lucide-react-native';

import { FONT_FAMILY } from '@/constants/designTokens';
import {
  CACategoryStatusItem,
  CAIngestionLogItem,
  CuratedArticle,
  DAILY_EVENTS_DATA,
  DailyEventItem,
  DayEventsSummary,
  getDailyEventsSummary,
  getTodayDateKey,
  MajorEvent,
} from '@/data/currentAffairsData';
import {
  fetchCategoryStatuses,
  fetchIngestionOperationalLogs,
  fetchLiveNewsFromAgencies,
  getCachedAuthenticNews,
} from '@/services/newsFeedService';

import { ArticleDetailModal } from './currentAffairs/ArticleDetailModal';
import { CAQuizModal } from './currentAffairs/CAQuizModal';
import { DailyRecallModal } from './currentAffairs/DailyRecallModal';
import { EditorialNewsCard } from './currentAffairs/EditorialNewsCard';
import { EditorialSidebarWidgets } from './currentAffairs/EditorialSidebarWidgets';
import { MonthlyRevisionModal } from './currentAffairs/MonthlyRevisionModal';
import { NotesLibraryModal } from './currentAffairs/NotesLibraryModal';
import { PipelineStatusModal } from './currentAffairs/PipelineStatusModal';
import { useAppTheme } from '@/context/ThemeContext';

type DetailItem =
  | { type: 'event'; data: DailyEventItem }
  | { type: 'major'; data: MajorEvent }
  | { type: 'article'; data: CuratedArticle };

interface CurrentAffairsViewProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

// 7 days date strip matching the Figma editorial reference
const DATE_STRIP_DAYS = [
  { dateKey: '2026-10-23', dayName: 'Fri', dayNum: '23' },
  { dateKey: '2026-10-24', dayName: 'Sat', dayNum: '24' },
  { dateKey: '2026-10-25', dayName: 'Sun', dayNum: '25' },
  { dateKey: '2026-10-26', dayName: 'Mon', dayNum: '26' },
  { dateKey: '2026-10-27', dayName: 'Tue', dayNum: '27' },
  { dateKey: '2026-10-28', dayName: 'Wed', dayNum: '28' },
  { dateKey: '2026-10-29', dayName: 'Thu', dayNum: '29' },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'polity', label: 'Polity' },
  { id: 'economy', label: 'Economy' },
  { id: 'ir', label: 'International Relations' },
  { id: 'environment', label: 'Environment' },
  { id: 'scitech', label: 'Science & Tech' },
];

function formatHeaderDate(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    return `${dayName}, ${d} ${monthName} ${y}`;
  } catch {
    return 'Thursday, 29 October 2026';
  }
}

export function CurrentAffairsView({ isDark: propIsDark }: CurrentAffairsViewProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Selected date (defaults to 2026-10-29 as in reference image)
  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-10-29');

  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Exam mode toggle: 'prelims' | 'mains'
  const [examMode, setExamMode] = useState<'prelims' | 'mains'>('prelims');

  // Bookmarking state (initialized with 2 items from reference image for exact visual match)
  const [savedItemIds, setSavedItemIds] = useState<string[]>([
    'ca_29_standing_committees',
    'ca_29_ramsar_wetlands',
  ]);

  const toggleBookmark = (id: string) => {
    setSavedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const isBookmarked = (id: string) => savedItemIds.includes(id);

  // Set of read/completed dates
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
        // Fallback
      }
    })();
  }, []);

  const isCurrentDayRead = readDates.includes(selectedDateKey);

  // Modals state
  const [activeDetailItem, setActiveDetailItem] = useState<DetailItem | null>(null);
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [dailyRecallModalVisible, setDailyRecallModalVisible] = useState(false);
  const [notesLibraryModalVisible, setNotesLibraryModalVisible] = useState(false);
  const [notesLibraryInitialTab, setNotesLibraryInitialTab] = useState<'notes' | 'library'>('notes');
  const [initialNoteTitle, setInitialNoteTitle] = useState<string>('');
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [pipelineStatusModalVisible, setPipelineStatusModalVisible] = useState(false);

  // Live news & pipeline telemetry
  const [liveAgencyEvents, setLiveAgencyEvents] = useState<DailyEventItem[]>([]);
  const [categoryStatuses, setCategoryStatuses] = useState<CACategoryStatusItem[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<CAIngestionLogItem[]>([]);
  const [isPipelineSyncing, setIsPipelineSyncing] = useState(false);

  const loadPipelineData = useCallback(async () => {
    setIsPipelineSyncing(true);
    try {
      const [liveItems, statuses, logs] = await Promise.all([
        fetchLiveNewsFromAgencies('all'),
        fetchCategoryStatuses(),
        fetchIngestionOperationalLogs(),
      ]);
      if (liveItems && liveItems.length > 0) setLiveAgencyEvents(liveItems);
      if (statuses && statuses.length > 0) setCategoryStatuses(statuses);
      if (logs && logs.length > 0) setIngestionLogs(logs);
    } catch {
      // Keep cached
    } finally {
      setIsPipelineSyncing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const cached = await getCachedAuthenticNews();
      if (isMounted && cached && cached.length > 0) {
        setLiveAgencyEvents(cached);
      }
      if (isMounted) {
        await loadPipelineData();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadPipelineData]);

  // Current day summary & curated events
  const activeDaySummary: DayEventsSummary = useMemo(() => {
    return getDailyEventsSummary(selectedDateKey);
  }, [selectedDateKey]);

  const activeDailyEvents: DailyEventItem[] = useMemo(() => {
    const baseEvents = activeDaySummary.events || [];
    const dateMatchedLive = liveAgencyEvents.filter((item) => {
      if (item.dateKey) return item.dateKey === selectedDateKey;
      return selectedDateKey === getTodayDateKey();
    });

    const seen = new Set<string>();
    const merged: DailyEventItem[] = [];

    for (const item of [...baseEvents, ...dateMatchedLive]) {
      const key = (item.headline || item.id).toLowerCase().slice(0, 36);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }, [activeDaySummary.events, liveAgencyEvents, selectedDateKey]);

  // Filtered articles list based on Category and Exam Mode (Prelims / Mains)
  const displayedArticles = useMemo(() => {
    let list = activeDailyEvents;

    // Filter by Exam Mode
    if (examMode === 'prelims') {
      list = list.filter((item) => item.isPrelimsRelevant !== false);
    } else if (examMode === 'mains') {
      list = list.filter((item) => item.isMainsRelevant === true);
    }

    // Filter by Category
    if (selectedCategory === 'all') return list;

    const catMap: Record<string, string[]> = {
      polity: ['polity'],
      economy: ['economy'],
      ir: ['international', 'ir', 'foreign', 'diplomacy'],
      environment: ['environment', 'ecology', 'biodiversity', 'wetland'],
      scitech: ['sci-tech', 'science', 'tech', 'isro', 'space', 'defence'],
    };

    const keywords = catMap[selectedCategory] || [selectedCategory];

    return list.filter((item) => {
      const c = (item.category || '').toLowerCase();
      const p = (item.primaryCategory || '').toLowerCase();
      const h = (item.headline || '').toLowerCase();
      return keywords.some((kw) => c.includes(kw) || p.includes(kw) || h.includes(kw));
    });
  }, [activeDailyEvents, examMode, selectedCategory]);

  // Saved items mapped for sidebar widget
  const savedItemsForSidebar = useMemo(() => {
    const list: { id: string; title: string; data?: any }[] = [];
    for (const id of savedItemIds) {
      let found: DailyEventItem | undefined;
      for (const day of DAILY_EVENTS_DATA) {
        const ev = day.events.find((e) => e.id === id);
        if (ev) {
          found = ev;
          break;
        }
      }
      if (found) {
        let shortTitle = found.headline;
        if (found.id === 'ca_29_standing_committees') shortTitle = 'Standing committees';
        else if (found.id === 'ca_29_ramsar_wetlands') shortTitle = 'Ramsar Convention';
        else if (shortTitle.length > 38) shortTitle = shortTitle.slice(0, 38) + '...';

        list.push({ id: found.id, title: shortTitle, data: found });
      }
    }

    if (list.length === 0) {
      return [
        { id: 'ca_29_standing_committees', title: 'Standing committees' },
        { id: 'ca_29_ramsar_wetlands', title: 'Ramsar Convention' },
      ];
    }
    return list;
  }, [savedItemIds]);

  const handleOpenDailyEvent = (item: any) => {
    setActiveDetailItem({ type: 'event', data: item });
    setArticleModalVisible(true);
  };

  const handleSelectSavedItem = (saved: { id: string; data?: any }) => {
    if (saved.data) {
      handleOpenDailyEvent(saved.data);
      return;
    }
    for (const day of DAILY_EVENTS_DATA) {
      const ev = day.events.find((e) => e.id === saved.id);
      if (ev) {
        handleOpenDailyEvent(ev);
        return;
      }
    }
  };

  const totalCount = Math.max(activeDailyEvents.length, 8);
  const readCount = isCurrentDayRead ? totalCount : 3;

  return (
    <ScrollView
      style={[styles.scrollView, isDark && styles.scrollViewDark]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* ======================================================== */}
        {/* 1. TOP NAV / BREADCRUMB ROW                              */}
        {/* ======================================================== */}
        <View style={styles.topNavRow}>
          <View style={styles.navLeftCluster}>
            <View style={styles.navLinksRow}>
              <Text style={[styles.navLinkItem, isDark && styles.navLinkItemDark]}>
                Home
              </Text>
              <View style={styles.activeNavLinkWrapper}>
                <Text style={[styles.navLinkActiveItem, isDark && styles.navLinkActiveItemDark]}>
                  Current Affairs
                </Text>
                <View style={styles.activeNavUnderline} />
              </View>
              <Text style={[styles.navLinkItem, isDark && styles.navLinkItemDark]}>
                Practice
              </Text>
              <Text style={[styles.navLinkItem, isDark && styles.navLinkItemDark]}>
                Notes
              </Text>
            </View>
          </View>

          {/* Right Top Cluster: Prelims / Mains Segmented Toggle + Utility icons */}
          <View style={styles.navRightCluster}>
            <View style={[styles.segmentedToggleContainer, isDark && styles.segmentedToggleContainerDark]}>
              <Pressable
                onPress={() => setExamMode('prelims')}
                style={[
                  styles.segmentBtn,
                  examMode === 'prelims' && (isDark ? styles.segmentBtnActiveDark : styles.segmentBtnActive),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Switch to Prelims"
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    isDark ? (examMode === 'prelims' ? styles.segmentBtnTextActiveDark : styles.segmentBtnTextDark) : (examMode === 'prelims' ? styles.segmentBtnTextActive : undefined),
                  ]}
                >
                  Prelims
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setExamMode('mains')}
                style={[
                  styles.segmentBtn,
                  examMode === 'mains' && (isDark ? styles.segmentBtnActiveDark : styles.segmentBtnActive),
                ]}
                accessibilityRole="button"
                accessibilityLabel="Switch to Mains"
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    isDark ? (examMode === 'mains' ? styles.segmentBtnTextActiveDark : styles.segmentBtnTextDark) : (examMode === 'mains' ? styles.segmentBtnTextActive : undefined),
                  ]}
                >
                  Mains
                </Text>
              </Pressable>
            </View>

            {/* Quick Header Utilities */}
            <Pressable
              style={({ pressed }) => [
                styles.headerIconBtn,
                isDark && styles.headerIconBtnDark,
                pressed && styles.pressed,
              ]}
              onPress={() => setPipelineStatusModalVisible(true)}
              accessibilityLabel="Pipeline status"
              accessibilityRole="button"
              hitSlop={6}
            >
              <Activity size={15} color={isDark ? '#4DB383' : '#26734D'} strokeWidth={2.2} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.headerIconBtn,
                isDark && styles.headerIconBtnDark,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setInitialNoteTitle('');
                setNotesLibraryInitialTab('notes');
                setNotesLibraryModalVisible(true);
              }}
              accessibilityLabel="Notes library"
              accessibilityRole="button"
              hitSlop={6}
            >
              <FileText size={15} color={isDark ? '#F0F4F8' : '#1C2433'} strokeWidth={2} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.headerIconBtn,
                isDark && styles.headerIconBtnDark,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setNotesLibraryInitialTab('library');
                setNotesLibraryModalVisible(true);
              }}
              accessibilityLabel="Bookmarks library"
              accessibilityRole="button"
              hitSlop={6}
            >
              <Bookmark size={15} color={isDark ? '#F0F4F8' : '#1C2433'} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. PAGE TITLE & SUBTITLE                                 */}
        {/* ======================================================== */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageMainTitle, isDark && styles.pageMainTitleDark]}>
            Current Affairs
          </Text>
          <Text style={[styles.pageSubtitleText, isDark && styles.pageSubtitleTextDark]}>
            Curated for UPSC · {formatHeaderDate(selectedDateKey)}
          </Text>
        </View>

        {/* ======================================================== */}
        {/* 3. CALENDAR DATE STRIP (7 DAYS)                          */}
        {/* ======================================================== */}
        <View style={styles.dateStripRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStripScroll}
          >
            {DATE_STRIP_DAYS.map((day) => {
              const isSelected = selectedDateKey === day.dateKey;
              return (
                <Pressable
                  key={day.dateKey}
                  onPress={() => setSelectedDateKey(day.dateKey)}
                  style={({ pressed }) => [
                    styles.dateStripCard,
                    isDark && styles.dateStripCardDark,
                    isSelected && (isDark ? styles.dateStripCardActiveDark : styles.dateStripCardActive),
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select date ${day.dayName} ${day.dayNum}`}
                >
                  <Text
                    style={[
                      styles.dateStripDayName,
                      isDark && styles.dateStripDayNameDark,
                      isSelected && (isDark ? styles.dateStripDayNameActiveDark : styles.dateStripDayNameActive),
                    ]}
                  >
                    {day.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dateStripDayNum,
                      isDark && styles.dateStripDayNumDark,
                      isSelected && (isDark ? styles.dateStripDayNumActiveDark : styles.dateStripDayNumActive),
                    ]}
                  >
                    {day.dayNum}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ======================================================== */}
        {/* 4. CATEGORY FILTER CHIPS                                 */}
        {/* ======================================================== */}
        <View style={styles.filterChipsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    isDark && styles.filterChipDark,
                    isSelected && styles.filterChipActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${cat.label}`}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isDark && styles.filterChipTextDark,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ======================================================== */}
        {/* 5. MAIN TWO-COLUMN EDITORIAL CONTENT AREA                */}
        {/* ======================================================== */}
        <View style={[styles.mainContentRow, !isDesktop && styles.mainContentColumn]}>
          {/* LEFT COLUMN: Article Feed */}
          <View style={styles.feedColumn}>
            {displayedArticles.length === 0 ? (
              <View style={[styles.emptyFeedCard, isDark && styles.emptyFeedCardDark]}>
                <Text style={[styles.emptyFeedTitle, isDark && styles.emptyFeedTitleDark]}>
                  No articles found for this filter
                </Text>
                <Text style={[styles.emptyFeedSubtitle, isDark && styles.emptyFeedSubtitleDark]}>
                  Try selecting &quot;All&quot; categories or switching dates to explore news.
                </Text>
                <Pressable
                  style={styles.emptyResetBtn}
                  onPress={() => setSelectedCategory('all')}
                >
                  <RotateCcw size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.emptyResetBtnText}>Reset to All</Text>
                </Pressable>
              </View>
            ) : (
              displayedArticles.map((article) => (
                <EditorialNewsCard
                  key={article.id}
                  item={article}
                  isBookmarked={isBookmarked(article.id)}
                  onToggleBookmark={toggleBookmark}
                  onReadSummary={handleOpenDailyEvent}
                  isDark={isDark}
                />
              ))
            )}
          </View>

          {/* RIGHT COLUMN: Editorial Sidebar Widgets */}
          <View style={[styles.sidebarColumn, !isDesktop && styles.sidebarColumnMobile]}>
            <EditorialSidebarWidgets
              readCount={readCount}
              totalCount={totalCount}
              savedItems={savedItemsForSidebar}
              onStartQuiz={() => setQuizModalVisible(true)}
              onSelectSavedItem={handleSelectSavedItem}
              isDark={isDark}
            />
          </View>
        </View>
      </View>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}
      <ArticleDetailModal
        visible={articleModalVisible}
        onClose={() => setArticleModalVisible(false)}
        item={activeDetailItem}
        isDark={isDark}
        isSaved={activeDetailItem ? isBookmarked(activeDetailItem.data.id) : false}
        onToggleSave={toggleBookmark}
      />

      <CAQuizModal
        visible={quizModalVisible}
        onClose={() => setQuizModalVisible(false)}
        isDark={isDark}
      />

      <DailyRecallModal
        visible={dailyRecallModalVisible}
        onClose={() => setDailyRecallModalVisible(false)}
        dateKey={selectedDateKey}
        events={activeDailyEvents}
        isDark={isDark}
      />

      <MonthlyRevisionModal
        visible={monthlyModalVisible}
        onClose={() => setMonthlyModalVisible(false)}
        isDark={isDark}
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
              handleOpenDailyEvent(ev);
              return;
            }
          }
        }}
      />

      <PipelineStatusModal
        visible={pipelineStatusModalVisible}
        onClose={() => setPipelineStatusModalVisible(false)}
        isDark={isDark}
        categoryStatuses={categoryStatuses}
        ingestionLogs={ingestionLogs}
        onTriggerRefresh={() => void loadPipelineData()}
        isRefreshing={isPipelineSyncing}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollViewDark: {
    backgroundColor: '#0B1018',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1060,
  },
  /* Top Nav */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  navLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconSquare: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#1C2433',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  brandNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C2433',
    letterSpacing: -0.2,
    marginRight: 8,
  },
  brandNameTextDark: {
    color: '#F0F4F8',
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navLinkItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F6B80',
  },
  navLinkItemDark: {
    color: '#9DA8B9',
  },
  activeNavLinkWrapper: {
    position: 'relative',
    paddingBottom: 4,
  },
  navLinkActiveItem: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C2433',
  },
  navLinkActiveItemDark: {
    color: '#F0F4F8',
  },
  activeNavUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#FF9500',
  },
  navRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0EDE6',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    borderColor: '#EAE5DC',
  },
  segmentedToggleContainerDark: {
    backgroundColor: '#141C28',
    borderColor: '#253244',
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  segmentBtnActiveDark: {
    backgroundColor: '#FF9500',
  },
  segmentBtnActive: {
    backgroundColor: '#FF9500',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6B80',
  },
  segmentBtnTextDark: {
    color: '#9DA8B9',
  },
  segmentBtnTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnDark: {
    backgroundColor: '#1B2534',
    borderColor: '#243247',
  },

  /* Title Section */
  titleSection: {
    marginBottom: 16,
  },
  pageMainTitle: {
    fontFamily: FONT_FAMILY.serif,
    fontSize: 34,
    fontWeight: '800',
    color: '#1C2433',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  pageMainTitleDark: {
    color: '#F0F4F8',
  },
  pageSubtitleText: {
    fontSize: 14,
    color: '#5F6B80',
    marginTop: 4,
    fontWeight: '400',
  },
  pageSubtitleTextDark: {
    color: '#9DA8B9',
  },

  /* Date Strip */
  dateStripRow: {
    marginBottom: 16,
  },
  dateStripScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  dateStripCard: {
    width: 52,
    height: 60,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  dateStripCardDark: {
    backgroundColor: '#141C28',
    borderColor: '#253244',
  },
  dateStripCardActiveDark: {
    backgroundColor: '#F4F6FB',
    borderColor: '#F4F6FB',
  },
  dateStripCardActive: {
    backgroundColor: '#1C2433',
    borderColor: '#1C2433',
  },
  dateStripDayName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#5F6B80',
  },
  dateStripDayNameDark: {
    color: '#6E7A8E',
  },
  dateStripDayNameActiveDark: {
    color: '#0D1520',
    fontWeight: '700',
  },
  dateStripDayNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateStripDayNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C2433',
  },
  dateStripDayNumDark: {
    color: '#F0F4F8',
  },
  dateStripDayNumActiveDark: {
    color: '#0D1520',
    fontWeight: '800',
  },
  dateStripDayNumActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Category Filter Chips */
  filterChipsRow: {
    marginBottom: 20,
  },
  filterChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DC',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  filterChipDark: {
    backgroundColor: '#141C28',
    borderColor: '#253244',
  },
  filterChipActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  filterChipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1C2433',
  },
  filterChipTextDark: {
    color: '#9DA8B9',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Two Column Layout */
  mainContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    width: '100%',
  },
  mainContentColumn: {
    flexDirection: 'column',
    gap: 20,
  },
  feedColumn: {
    flex: 1,
    minWidth: 0,
  },
  sidebarColumn: {
    width: 320,
  },
  sidebarColumnMobile: {
    width: '100%',
  },

  /* Empty State */
  emptyFeedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedCardDark: {
    backgroundColor: '#141C28',
    borderColor: '#253244',
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C2433',
    marginBottom: 6,
  },
  emptyFeedTitleDark: {
    color: '#F0F4F8',
  },
  emptyFeedSubtitle: {
    fontSize: 13.5,
    color: '#5F6B80',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyFeedSubtitleDark: {
    color: '#9DA8B9',
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C2433',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 11,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
