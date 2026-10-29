import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Check,
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  Bookmark,
  Newspaper,
  BookOpen,
  Layers,
  Scale,
  Landmark,
  MessagesSquare,
  Globe,
  Leaf,
  RotateCw,
} from 'lucide-react-native';
import {
  FormatCategory,
  CuratedArticle,
  NEWS_AGENCIES,
  DAILY_EVENTS_DATA,
  getDailyEventsSummary,
  getTodayDateKey,
} from '@/data/currentAffairsData';
import {
  classifyIntoSimplifiedTaxonomy,
  DAILY_NEWS_FEED_FILTERS,
  DailyNewsFeedFilterId,
  EES_SUBJECT_GROUPS,
  getMainCategoryById,
  SUBJECT_MAIN_CATEGORIES,
  SubjectGroupName,
} from '@/constants/currentAffairsCategories';
import { BW_THEME } from '@/constants/bwTheme';
import { PALETTE } from '@/constants/colors';
import { fetchLiveDailyNewsArticles, mapDailyEventToCuratedArticle } from '@/services/newsFeedService';
import { CalendarDropdown } from './CalendarDropdown';

interface FormatFeedModalProps {
  visible: boolean;
  onClose: () => void;
  formatCategory: FormatCategory | null;
  onSelectArticle: (article: CuratedArticle) => void;
  isDark: boolean;
  savedItemIds: string[];
  onToggleBookmark: (id: string) => void;
  selectedAgencyId?: string;
}

export function FormatFeedModal({
  visible,
  onClose,
  formatCategory,
  onSelectArticle,
  isDark,
  savedItemIds,
  onToggleBookmark,
  selectedAgencyId = 'all',
}: FormatFeedModalProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  // Default calendar date to current date ('Today, 29 Oct') in Asia/Kolkata
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayDateKey);
  const [showAllDates, setShowAllDates] = useState<boolean>(true);

  // Simplified Taxonomy Filters
  // 1. For Daily News: 5 Feed Filters (All News, Today's News, Most Important, Prelims Relevant, Mains Relevant)
  const [dailyFeedFilter, setDailyFeedFilter] = useState<DailyNewsFeedFilterId>('all');
  // 2. For Daily News: Main Category filter ('all' | one of the 5 subject categories)
  const [selectedMainCatFilter, setSelectedMainCatFilter] = useState<string>('all');
  // 3. For Economy, Environment & Science: Subject Group filter ('All' | 'Economy' | 'Environment & Ecology' | 'Science & Technology')
  const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<string>('All');
  // 4. For all categories: Subcategory filter ('All' | one of the 3-4 broad subcategories)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');

  const [userAgencyFilter, setUserAgencyFilter] = useState<string | null>(null);
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState<boolean>(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false);
  const [calendarPos, setCalendarPos] = useState<{ top: number; left?: number; right?: number }>({
    top: 76,
    right: 24,
  });
  const dateBtnRef = useRef<React.ElementRef<typeof View>>(null);

  const activeAgencyFilter = userAgencyFilter ?? (selectedAgencyId || 'all');
  const activeAgency = useMemo(
    () => NEWS_AGENCIES.find((a) => a.id === activeAgencyFilter) || NEWS_AGENCIES[0],
    [activeAgencyFilter]
  );
  const [liveArticles, setLiveArticles] = useState<CuratedArticle[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset filters cleanly whenever a new category is opened
  const [prevCategoryId, setPrevCategoryId] = useState<string | undefined>(formatCategory?.id);
  if (prevCategoryId !== formatCategory?.id) {
    setPrevCategoryId(formatCategory?.id);
    setSelectedDateKey(getTodayDateKey());
    setShowAllDates(true);
    setDailyFeedFilter('all');
    setSelectedMainCatFilter('all');
    setSelectedSubjectGroup('All');
    setSelectedSubcategory('All');
  }

  const isDailyNews = formatCategory?.id === 'daily-news';
  const isEESCategory = formatCategory?.id === 'economy-environment-science';
  const isEditorialsCategory = formatCategory?.id === 'editorials-explainers';

  const handleOpenCalendar = () => {
    if (calendarModalOpen) {
      setCalendarModalOpen(false);
      return;
    }
    if (dateBtnRef.current) {
      dateBtnRef.current.measureInWindow((x: number, y: number, btnW: number, btnH: number) => {
        const top = Math.max(70, y + btnH + 8);
        const left = Math.max(12, Math.min(x, width - 336));
        setCalendarPos({ top, left });
        setCalendarModalOpen(true);
      });
    } else {
      setCalendarModalOpen(true);
    }
  };

  // Ensure every article has normalized simplified taxonomy metadata
  const ensureNormalizedArticle = useCallback((art: CuratedArticle): CuratedArticle => {
    if (art.mainCategoryId && art.subjectGroup && art.subcategory) {
      return art;
    }
    const classified = classifyIntoSimplifiedTaxonomy({
      headline: art.title,
      summary: art.summary,
      existingMainCategoryId: art.mainCategoryId || art.uiModuleId,
      existingPrimaryCategory: art.primaryCategory,
      existingSubjectGroup: art.subjectGroup,
      existingSubcategory: art.subcategory || art.category,
      sourceName: art.source,
      editorialAuthor: art.editorialAuthor,
    });
    return {
      ...art,
      mainCategoryId: classified.mainCategoryId,
      subjectGroup: classified.subjectGroup,
      subcategory: classified.subcategory,
      category: classified.subcategory,
      isMostImportant: art.isMostImportant ?? classified.isMostImportant,
      isPrelimsRelevant: art.isPrelimsRelevant ?? classified.isPrelimsRelevant,
      isMainsRelevant: art.isMainsRelevant ?? classified.isMainsRelevant,
      editorialAuthor: art.editorialAuthor || classified.editorialAuthor,
      aiExplanationDisclaimer: art.aiExplanationDisclaimer || classified.aiExplanationDisclaimer,
    };
  }, []);

  // Convert past curated DAILY_EVENTS_DATA into CuratedArticle items
  const historicalArchiveArticles = useMemo(() => {
    const items: CuratedArticle[] = [];
    for (const day of DAILY_EVENTS_DATA) {
      for (const ev of day.events) {
        items.push(
          ensureNormalizedArticle(
            mapDailyEventToCuratedArticle({
              ...ev,
              dateKey: ev.dateKey || day.dateKey,
            })
          )
        );
      }
    }
    return items;
  }, [ensureNormalizedArticle]);

  // Derive dateKey ('YYYY-MM-DD') from any CuratedArticle
  const resolveArticleDateKey = useCallback(
    (art: CuratedArticle): string => {
      if (art.publishedDateIst) return art.publishedDateIst.slice(0, 10);
      if (art.dateKey) return art.dateKey;
      if (art.publishedAt) {
        const d = new Date(art.publishedAt);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')}`;
        }
      }
      if (art.date) {
        if (art.date.toLowerCase().includes('today')) return todayDateKey;
        const parsed = new Date(art.date);
        if (!isNaN(parsed.getTime())) {
          return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(
            parsed.getDate()
          ).padStart(2, '0')}`;
        }
      }
      return todayDateKey;
    },
    [todayDateKey]
  );

  // Format label for active date filter button (always shows current date by default)
  const activeDateFilterLabel = useMemo(() => {
    const summary = getDailyEventsSummary(selectedDateKey);
    return summary.label;
  }, [selectedDateKey]);

  // Manual refresh button handler
  const handleManualRefresh = useCallback(async () => {
    if (!formatCategory) return;
    setIsRefreshing(true);
    try {
      const items = await fetchLiveDailyNewsArticles('all', formatCategory.id);
      if (items && items.length > 0) {
        setLiveArticles(items.map(ensureNormalizedArticle));
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  }, [formatCategory, ensureNormalizedArticle]);

  // Initial fetch on modal open for the selected category module
  useEffect(() => {
    if (!visible || !formatCategory) return;

    let isMounted = true;
    void fetchLiveDailyNewsArticles('all', formatCategory.id).then((items) => {
      if (isMounted && items && items.length > 0) {
        setLiveArticles(items.map(ensureNormalizedArticle));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [visible, formatCategory, ensureNormalizedArticle]);

  // Combined articles list: live database articles + historical archive + category base articles
  const allArticles = useMemo(() => {
    if (!formatCategory) return [];

    const matchesCategory = (art: CuratedArticle): boolean => {
      if (formatCategory.id === 'daily-news') return true;
      return art.mainCategoryId === formatCategory.id || art.uiModuleId === formatCategory.id;
    };

    const relevantArchive = historicalArchiveArticles.filter(matchesCategory);

    // If a specific past date is selected that isn't in DAILY_EVENTS_DATA, include its generated archive stories
    let dynamicDateArchive: CuratedArticle[] = [];
    if (!DAILY_EVENTS_DATA.some((d) => d.dateKey === selectedDateKey)) {
      const genDay = getDailyEventsSummary(selectedDateKey);
      dynamicDateArchive = genDay.events
        .map((ev) =>
          ensureNormalizedArticle(
            mapDailyEventToCuratedArticle({
              ...ev,
              dateKey: selectedDateKey,
            })
          )
        )
        .filter(matchesCategory);
    }

    const normalizedStatic = formatCategory.articles.map(ensureNormalizedArticle).filter(matchesCategory);

    const seen = new Set<string>();
    const merged: CuratedArticle[] = [];

    for (const art of [
      ...liveArticles.filter(matchesCategory),
      ...relevantArchive,
      ...dynamicDateArchive,
      ...normalizedStatic,
    ]) {
      const key = art.title.trim().toLowerCase().slice(0, 42);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(art);
      }
    }
    return merged;
  }, [formatCategory, liveArticles, historicalArchiveArticles, selectedDateKey, ensureNormalizedArticle]);

  // Compute available Subcategories based on the active Main Category / Subject Group
  const availableSubcategories = useMemo(() => {
    if (!formatCategory) return [];
    if (isDailyNews) {
      if (selectedMainCatFilter === 'all') {
        return [];
      }
      const mainDef = getMainCategoryById(selectedMainCatFilter);
      return mainDef ? mainDef.subcategories : [];
    }
    if (isEESCategory) {
      if (selectedSubjectGroup === 'All') {
        return [];
      }
      const groupDef = EES_SUBJECT_GROUPS.find((g) => g.title === selectedSubjectGroup);
      return groupDef ? [...groupDef.subcategories] : [];
    }
    const mainDef = getMainCategoryById(formatCategory.id);
    return mainDef ? mainDef.subcategories : [];
  }, [formatCategory, isDailyNews, isEESCategory, selectedMainCatFilter, selectedSubjectGroup]);

  // Filtered articles according to Feed Filter, Date, Main Category, Subject Group, Subcategory, and Source
  const { filteredArticles, isShowingDateFallback } = useMemo(() => {
    if (!allArticles.length) return { filteredArticles: [], isShowingDateFallback: false };

    let list = allArticles;
    let usedDateFallback = false;

    // 1. Daily News 5 Feed Filters (All News, Today's News, Most Important, Prelims Relevant, Mains Relevant)
    if (isDailyNews) {
      if (dailyFeedFilter === 'today') {
        const todayMatches = list.filter((item) => resolveArticleDateKey(item) === selectedDateKey);
        if (todayMatches.length > 0) {
          list = todayMatches;
        } else {
          usedDateFallback = true;
        }
      } else if (dailyFeedFilter === 'important') {
        const impMatches = list.filter((item) => Boolean(item.isMostImportant));
        if (impMatches.length > 0) list = impMatches;
      } else if (dailyFeedFilter === 'prelims') {
        const prelimsMatches = list.filter((item) => item.isPrelimsRelevant !== false);
        if (prelimsMatches.length > 0) list = prelimsMatches;
      } else if (dailyFeedFilter === 'mains') {
        const mainsMatches = list.filter((item) => item.isMainsRelevant !== false);
        if (mainsMatches.length > 0) list = mainsMatches;
      }
    }

    // 2. Date Filter (when user explicitly picked a date on the calendar)
    if (!showAllDates && dailyFeedFilter !== 'today') {
      const dateMatched = list.filter((item) => resolveArticleDateKey(item) === selectedDateKey);
      if (dateMatched.length > 0) {
        list = dateMatched;
      } else {
        usedDateFallback = true;
      }
    }

    // 3. Main Category Filter (inside Daily News)
    if (isDailyNews && selectedMainCatFilter !== 'all') {
      list = list.filter((item) => item.mainCategoryId === selectedMainCatFilter);
    }

    // 4. Subject Group Filter (inside Economy, Environment & Science)
    if (isEESCategory && selectedSubjectGroup !== 'All') {
      list = list.filter((item) => item.subjectGroup === selectedSubjectGroup);
    }

    // 5. Subcategory Filter
    if (selectedSubcategory !== 'All') {
      list = list.filter((item) => item.subcategory === selectedSubcategory);
    }

    // 6. Source (Agency) Filter
    if (activeAgencyFilter !== 'all') {
      const agency = NEWS_AGENCIES.find((a) => a.id === activeAgencyFilter);
      if (agency?.matchKeyword) {
        const kw = agency.matchKeyword.toLowerCase();
        const matched = list.filter(
          (item) => item.agencyId === activeAgencyFilter || item.source.toLowerCase().includes(kw)
        );
        if (matched.length > 0) {
          list = matched;
        }
      }
    }

    return { filteredArticles: list, isShowingDateFallback: usedDateFallback };
  }, [
    allArticles,
    isDailyNews,
    dailyFeedFilter,
    showAllDates,
    selectedDateKey,
    selectedMainCatFilter,
    isEESCategory,
    selectedSubjectGroup,
    selectedSubcategory,
    activeAgencyFilter,
    resolveArticleDateKey,
  ]);

  if (!visible || !formatCategory) return null;

  const renderCategoryIcon = () => {
    const iconColor = isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary;
    const iconProps = { size: 18, color: iconColor, strokeWidth: 2 };
    switch (formatCategory.iconName) {
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

  const renderEditorialRow = (item: CuratedArticle) => {
    const bookmarked = savedItemIds.includes(item.id);
    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [styles.editorialRow, pressed && styles.rowPressed]}
        onPress={() => onSelectArticle(item)}
      >
        <View style={styles.editorialRowLeft}>
          {/* Top Meta Line */}
          <View style={styles.articleMetaLine}>
            <Text style={styles.sourceLabelText} numberOfLines={1}>
              {item.source}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.dateLabelText}>{item.date}</Text>
            <View style={styles.gsBadgePill}>
              <Text style={styles.gsBadgePillText}>{item.paper}</Text>
            </View>
            {item.isMostImportant && (
              <View style={styles.importantBadgePill}>
                <Text style={styles.importantBadgeText}>Most Important</Text>
              </View>
            )}
          </View>

          {/* Editorial Author vs AI Explainer Badge when in Editorials & Explainers */}
          {(isEditorialsCategory || item.mainCategoryId === 'editorials-explainers') &&
            item.editorialAuthor && (
              <View style={styles.editorialAttributionRow}>
                <Text style={styles.editorialAuthorBadgeText}>
                  Editorial by {item.editorialAuthor} • AI UPSC Synthesis Included
                </Text>
              </View>
            )}

          {/* Headline */}
          <Text style={styles.rowHeadlineText} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Concise 2-Line Excerpt */}
          <Text style={styles.rowExcerptText} numberOfLines={2}>
            {item.summary}
          </Text>

          {/* Bottom Row: Subject Group + Subcategory Tag + Bookmark + Read Link */}
          <View style={styles.articleFooterLine}>
            <View style={styles.taxonomyTagRow}>
              {isDailyNews && item.subjectGroup && (
                <View style={styles.subjectGroupBadge}>
                  <Text style={styles.subjectGroupBadgeText}>{item.subjectGroup}</Text>
                </View>
              )}
              <Text style={styles.topicTagText} numberOfLines={1}>
                {item.subcategory || item.category}
              </Text>
            </View>

            <View style={styles.articleActionsRight}>
              <Pressable
                style={styles.bookmarkIconBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(item.id);
                }}
                hitSlop={8}
                accessibilityLabel="Bookmark story"
              >
                <Bookmark
                  size={14.5}
                  color={bookmarked ? PALETTE.highlight.primary : theme.textMuted}
                  fill={bookmarked ? PALETTE.highlight.primary : 'none'}
                  strokeWidth={2}
                />
              </Pressable>

              <View style={styles.readFullLink}>
                <Text style={styles.readFullLinkText}>Read</Text>
                <ChevronRight
                  size={13}
                  color={isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary}
                  strokeWidth={2.3}
                />
              </View>
            </View>
          </View>
        </View>

        {item.imageUrl ? (
          <View style={styles.rowThumbnailBox}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.rowThumbnailImage}
              contentFit="cover"
              transition={140}
            />
          </View>
        ) : null}
      </Pressable>
    );
  };

  // For Economy, Environment & Science when viewing 'All', keep the 3 subject groups visually distinct!
  const showGroupedEESLayout = isEESCategory && selectedSubjectGroup === 'All';

  const leadArticle = !showGroupedEESLayout ? filteredArticles[0] : undefined;
  const feedArticles = !showGroupedEESLayout ? filteredArticles.slice(1) : filteredArticles;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* ================================================================ */}
        {/* 1. FIGMA TOP NAVIGATION & FILTER BAR                             */}
        {/* ================================================================ */}
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            {/* Left: Back Button + Category Icon & Title */}
            <View style={styles.titleSection}>
              <Pressable
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back to Current Affairs"
              >
                <ArrowLeft size={18} color={theme.textPrimary} strokeWidth={2.2} />
              </Pressable>

              <View style={styles.titleTextGroup}>
                <View style={styles.titleRow}>
                  {renderCategoryIcon()}
                  <Text style={styles.pageTitle} numberOfLines={1}>
                    {formatCategory.title}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right: Current Date Calendar Picker + Source Filter Dropdown + Refresh */}
            <View style={styles.controlsRow}>
              {/* Current Date Calendar Picker Button */}
              <View ref={dateBtnRef} collapsable={false}>
                <Pressable
                  style={({ pressed, hovered }: any) => [
                    styles.controlPillBtn,
                    (!showAllDates || calendarModalOpen) && styles.controlPillBtnActive,
                    hovered && styles.controlPillBtnHover,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleOpenCalendar}
                  accessibilityRole="button"
                  accessibilityLabel={`Select date. Currently ${activeDateFilterLabel}`}
                >
                  <Calendar
                    size={13.5}
                    color={isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.controlPillText} numberOfLines={1}>
                    {activeDateFilterLabel}
                  </Text>
                  <ChevronDown
                    size={13}
                    color={calendarModalOpen ? PALETTE.highlight.primary : theme.textMuted}
                    strokeWidth={2.2}
                  />
                </Pressable>
              </View>

              {/* Toggle All 20 Days vs Selected Date */}
              {!showAllDates && (
                <Pressable
                  style={[styles.controlPillBtn, styles.clearDateBtn]}
                  onPress={() => {
                    setShowAllDates(true);
                    if (dailyFeedFilter === 'today') setDailyFeedFilter('all');
                  }}
                >
                  <Text style={styles.clearDateBtnText}>All 20 Days</Text>
                </Pressable>
              )}

              {/* Source (Agency) Filter Dropdown Button */}
              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.controlPillBtn,
                  agencyDropdownOpen && styles.controlPillBtnActive,
                  hovered && styles.controlPillBtnHover,
                  pressed && styles.pressed,
                ]}
                onPress={() => setAgencyDropdownOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by source: ${activeAgency.name}`}
              >
                <Filter
                  size={13}
                  color={isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary}
                  strokeWidth={2.2}
                />
                <Text style={styles.controlPillText} numberOfLines={1}>
                  {activeAgency.shortName === 'All' ? 'All Sources' : activeAgency.shortName}
                </Text>
                <ChevronDown
                  size={13}
                  color={agencyDropdownOpen ? PALETTE.highlight.primary : theme.textMuted}
                  strokeWidth={2.2}
                />
              </Pressable>

              {/* Subtle Sync / Refresh Icon Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconCircleBtn,
                  isRefreshing && styles.refreshSpinning,
                  pressed && styles.pressed,
                ]}
                onPress={handleManualRefresh}
                hitSlop={6}
                accessibilityLabel="Refresh feed"
              >
                <RotateCw size={14.5} color={theme.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* ============================================================== */}
          {/* A. DAILY NEWS: 5 FEED FILTERS + MAIN CATEGORY FILTER           */}
          {/* ============================================================== */}
          {isDailyNews && (
            <>
              <View style={styles.subFilterBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.paperPillsScroll}
                >
                  {DAILY_NEWS_FEED_FILTERS.map((f) => {
                    const active = dailyFeedFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        style={[styles.paperFilterChip, active && styles.paperFilterChipActive]}
                        onPress={() => {
                          setDailyFeedFilter(f.id);
                          if (f.id === 'today') {
                            setShowAllDates(false);
                          } else if (f.id === 'all') {
                            setShowAllDates(true);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.paperFilterChipText,
                            active && styles.paperFilterChipTextActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {isDesktop && (
                  <Text style={styles.storyTotalCountText}>
                    {filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'}
                  </Text>
                )}
              </View>

              {/* Main Category Filter Row inside Daily News */}
              <View style={styles.secondaryFilterBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.paperPillsScroll}
                >
                  <Pressable
                    style={[
                      styles.subcatFilterChip,
                      selectedMainCatFilter === 'all' && styles.subcatFilterChipActive,
                    ]}
                    onPress={() => {
                      setSelectedMainCatFilter('all');
                      setSelectedSubcategory('All');
                    }}
                  >
                    <Text
                      style={[
                        styles.subcatFilterChipText,
                        selectedMainCatFilter === 'all' && styles.subcatFilterChipTextActive,
                      ]}
                    >
                      All 5 Subject Categories
                    </Text>
                  </Pressable>

                  {SUBJECT_MAIN_CATEGORIES.map((cat) => {
                    const active = selectedMainCatFilter === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        style={[styles.subcatFilterChip, active && styles.subcatFilterChipActive]}
                        onPress={() => {
                          setSelectedMainCatFilter(cat.id);
                          setSelectedSubcategory('All');
                        }}
                      >
                        <Text
                          style={[
                            styles.subcatFilterChipText,
                            active && styles.subcatFilterChipTextActive,
                          ]}
                        >
                          {cat.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}

          {/* ============================================================== */}
          {/* B. ECONOMY, ENVIRONMENT & SCIENCE: 3 DISTINCT SUBJECT GROUPS   */}
          {/* ============================================================== */}
          {isEESCategory && (
            <View style={styles.subFilterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.paperPillsScroll}
              >
                <Pressable
                  style={[
                    styles.paperFilterChip,
                    selectedSubjectGroup === 'All' && styles.paperFilterChipActive,
                  ]}
                  onPress={() => {
                    setSelectedSubjectGroup('All');
                    setSelectedSubcategory('All');
                  }}
                >
                  <Text
                    style={[
                      styles.paperFilterChipText,
                      selectedSubjectGroup === 'All' && styles.paperFilterChipTextActive,
                    ]}
                  >
                    All 3 Subject Groups (Distinct)
                  </Text>
                </Pressable>

                {EES_SUBJECT_GROUPS.map((grp) => {
                  const active = selectedSubjectGroup === grp.title;
                  return (
                    <Pressable
                      key={grp.id}
                      style={[styles.paperFilterChip, active && styles.paperFilterChipActive]}
                      onPress={() => {
                        setSelectedSubjectGroup(grp.title);
                        setSelectedSubcategory('All');
                      }}
                    >
                      <Text
                        style={[
                          styles.paperFilterChipText,
                          active && styles.paperFilterChipTextActive,
                        ]}
                      >
                        {grp.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {isDesktop && (
                <Text style={styles.storyTotalCountText}>
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'}
                </Text>
              )}
            </View>
          )}

          {/* ============================================================== */}
          {/* C. SUBCATEGORY FILTER BAR (3–4 Broad Subcategories per Group)  */}
          {/* ============================================================== */}
          {availableSubcategories.length > 0 && (
            <View style={isDailyNews || isEESCategory ? styles.secondaryFilterBar : styles.subFilterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.paperPillsScroll}
              >
                <Pressable
                  style={[
                    styles.paperFilterChip,
                    selectedSubcategory === 'All' && styles.paperFilterChipActive,
                  ]}
                  onPress={() => setSelectedSubcategory('All')}
                >
                  <Text
                    style={[
                      styles.paperFilterChipText,
                      selectedSubcategory === 'All' && styles.paperFilterChipTextActive,
                    ]}
                  >
                    All Subcategories
                  </Text>
                </Pressable>

                {availableSubcategories.map((sub) => {
                  const active = selectedSubcategory === sub;
                  return (
                    <Pressable
                      key={sub}
                      style={[styles.paperFilterChip, active && styles.paperFilterChipActive]}
                      onPress={() => setSelectedSubcategory(sub)}
                    >
                      <Text
                        style={[
                          styles.paperFilterChipText,
                          active && styles.paperFilterChipTextActive,
                        ]}
                      >
                        {sub}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {isDesktop && !isDailyNews && !isEESCategory && (
                <Text style={styles.storyTotalCountText}>
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ================================================================ */}
        {/* 2. SOURCE (AGENCY) DROPDOWN MENU OVERLAY                         */}
        {/* ================================================================ */}
        {agencyDropdownOpen && (
          <View style={styles.dropdownOverlayWrapper}>
            <Pressable
              style={styles.dropdownBackdrop}
              onPress={() => setAgencyDropdownOpen(false)}
            />
            <View style={styles.agencyDropdownCard}>
              <Text style={styles.agencyDropdownHeading}>Filter by Source</Text>
              {NEWS_AGENCIES.map((agency) => {
                const isSelected = activeAgencyFilter === agency.id;
                const count =
                  agency.id === 'all'
                    ? allArticles.length
                    : allArticles.filter(
                        (a) =>
                          a.agencyId === agency.id ||
                          a.source.toLowerCase().includes((agency.matchKeyword || '').toLowerCase())
                      ).length;

                return (
                  <Pressable
                    key={agency.id}
                    style={({ pressed }) => [
                      styles.agencyMenuItem,
                      isSelected && styles.agencyMenuItemActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      setUserAgencyFilter(agency.id);
                      setAgencyDropdownOpen(false);
                    }}
                  >
                    <View style={styles.agencyMenuItemLeft}>
                      <Text
                        style={[
                          styles.agencyMenuItemText,
                          isSelected && styles.agencyMenuItemTextActive,
                        ]}
                      >
                        {agency.name}
                      </Text>
                      {count > 0 && <Text style={styles.agencyMenuCountText}>{count}</Text>}
                    </View>
                    {isSelected && (
                      <Check
                        size={14}
                        color={isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary}
                        strokeWidth={2.5}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ================================================================ */}
        {/* 3. CLEAN EDITORIAL NEWS FEED                                     */}
        {/* ================================================================ */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.feedCenterContainer}>
            {/* Editorial vs AI Explainer Transparency Banner inside Editorials & Explainers */}
            {isEditorialsCategory && (
              <View style={styles.editorialNoticeBanner}>
                <Text style={styles.editorialNoticeTitle}>
                  Editorial Attribution & AI Explainer Policy
                </Text>
                <Text style={styles.editorialNoticeText}>
                  Original editorial opinions are attributed to their respective authors and publishers with direct source links. Concise takeaways and syllabus mappings are AI-structured educational explanations—complete copyrighted articles are never reproduced.
                </Text>
              </View>
            )}

            {/* Subtle Date Context Notice if showing archive fallback */}
            {isShowingDateFallback && !showAllDates && (
              <View style={styles.dateContextBanner}>
                <Text style={styles.dateContextText}>
                  Showing latest verified stories in {formatCategory.title}
                </Text>
                <Pressable onPress={() => setShowAllDates(true)}>
                  <Text style={styles.dateContextAction}>Show all 20 days</Text>
                </Pressable>
              </View>
            )}

            {/* ============================================================ */}
            {/* DISTINCT 3-GROUP SECTIONS FOR ECONOMY, ENVIRONMENT & SCIENCE */}
            {/* ============================================================ */}
            {showGroupedEESLayout ? (
              EES_SUBJECT_GROUPS.map((group) => {
                const groupArticles = filteredArticles.filter(
                  (a) => a.subjectGroup === (group.title as SubjectGroupName)
                );
                if (groupArticles.length === 0) return null;

                return (
                  <View key={group.id} style={styles.eesDistinctGroupSection}>
                    <View
                      style={[
                        styles.eesGroupHeaderBar,
                        { borderLeftColor: group.accentColor },
                      ]}
                    >
                      <View style={styles.eesGroupHeaderTop}>
                        <Text style={styles.eesGroupTitleText}>{group.title}</Text>
                        <Pressable
                          style={styles.eesFilterGroupBtn}
                          onPress={() => setSelectedSubjectGroup(group.title)}
                        >
                          <Text style={styles.eesFilterGroupBtnText}>
                            Filter {group.shortTitle} ({groupArticles.length})
                          </Text>
                          <ChevronRight
                            size={13}
                            color={isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary}
                          />
                        </Pressable>
                      </View>
                      <Text style={styles.eesSubcategoryListHint} numberOfLines={2}>
                        Subcategories: {group.subcategories.join(' • ')}
                      </Text>
                    </View>

                    {groupArticles.map(renderEditorialRow)}
                  </View>
                );
              })
            ) : (
              <>
                {/* A. LEAD EDITORIAL STORY */}
                {leadArticle && (
                  <Pressable
                    style={({ pressed }) => [styles.leadStoryCard, pressed && styles.rowPressed]}
                    onPress={() => onSelectArticle(leadArticle)}
                  >
                    <View style={styles.leadStoryGrid}>
                      <View style={styles.leadStoryTextCol}>
                        {/* Meta Line: Source • Date • GS Paper */}
                        <View style={styles.articleMetaLine}>
                          <Text style={styles.sourceLabelText} numberOfLines={1}>
                            {leadArticle.source}
                          </Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.dateLabelText}>{leadArticle.date}</Text>
                          <View style={styles.gsBadgePill}>
                            <Text style={styles.gsBadgePillText}>{leadArticle.paper}</Text>
                          </View>
                          {leadArticle.isMostImportant && (
                            <View style={styles.importantBadgePill}>
                              <Text style={styles.importantBadgeText}>Most Important</Text>
                            </View>
                          )}
                        </View>

                        {(isEditorialsCategory ||
                          leadArticle.mainCategoryId === 'editorials-explainers') &&
                          leadArticle.editorialAuthor && (
                            <View style={styles.editorialAttributionRow}>
                              <Text style={styles.editorialAuthorBadgeText}>
                                Editorial by {leadArticle.editorialAuthor} • AI UPSC Synthesis Included
                              </Text>
                            </View>
                          )}

                        {/* Lead Headline */}
                        <Text style={styles.leadHeadlineText}>{leadArticle.title}</Text>

                        {/* Concise 2-3 Line Summary */}
                        <Text style={styles.leadSummaryText} numberOfLines={3}>
                          {leadArticle.summary}
                        </Text>

                        {/* Footer Action Line */}
                        <View style={styles.articleFooterLine}>
                          <View style={styles.taxonomyTagRow}>
                            {isDailyNews && leadArticle.subjectGroup && (
                              <View style={styles.subjectGroupBadge}>
                                <Text style={styles.subjectGroupBadgeText}>
                                  {leadArticle.subjectGroup}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.topicTagText} numberOfLines={1}>
                              {leadArticle.subcategory || leadArticle.category}
                            </Text>
                          </View>

                          <View style={styles.articleActionsRight}>
                            <Pressable
                              style={styles.bookmarkIconBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(leadArticle.id);
                              }}
                              hitSlop={8}
                              accessibilityLabel="Bookmark story"
                            >
                              <Bookmark
                                size={15}
                                color={
                                  savedItemIds.includes(leadArticle.id)
                                    ? PALETTE.highlight.primary
                                    : theme.textMuted
                                }
                                fill={
                                  savedItemIds.includes(leadArticle.id)
                                    ? PALETTE.highlight.primary
                                    : 'none'
                                }
                                strokeWidth={2}
                              />
                            </Pressable>

                            <View style={styles.readFullLink}>
                              <Text style={styles.readFullLinkText}>Full Analysis</Text>
                              <ChevronRight
                                size={14}
                                color={
                                  isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary
                                }
                                strokeWidth={2.4}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      {leadArticle.imageUrl ? (
                        <View style={styles.leadImageContainer}>
                          <Image
                            source={{ uri: leadArticle.imageUrl }}
                            style={styles.leadImage}
                            contentFit="cover"
                            transition={160}
                          />
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                )}

                {/* B. STREAMLINED EDITORIAL ROWS */}
                {feedArticles.map(renderEditorialRow)}
              </>
            )}
          </View>
        </ScrollView>

        {/* Figma Calendar Dropdown for Date Filtering (Defaults to Today, 29 Oct) */}
        <CalendarDropdown
          visible={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          selectedDateKey={selectedDateKey}
          onSelectDate={(newDateKey) => {
            setSelectedDateKey(newDateKey);
            setShowAllDates(false);
            setCalendarModalOpen(false);
          }}
          topOffset={calendarPos.top}
          leftOffset={calendarPos.left}
          rightOffset={calendarPos.right}
          isDark={isDark}
        />
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (
  theme: typeof BW_THEME.dark,
  isDark: boolean,
  isDesktop: boolean
) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    /* 1. Top Navigation & Filter Bar */
    topBar: {
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2F3036' : '#E8E9F1',
      paddingTop: isDesktop ? 14 : 10,
    },
    topBarInner: {
      maxWidth: 940,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    },
    titleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 1,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleTextGroup: {
      flexShrink: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pageTitle: {
      fontSize: isDesktop ? 20 : 17.5,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    controlPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 7.5,
      borderRadius: 10,
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    controlPillBtnActive: {
      borderColor: PALETTE.highlight.primary,
      backgroundColor: isDark ? '#383A42' : '#F8F9FE',
    },
    controlPillBtnHover: {
      borderColor: isDark ? '#494A50' : '#D4D6DD',
    },
    controlPillText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.textPrimary,
      letterSpacing: -0.1,
    },
    clearDateBtn: {
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.14)' : PALETTE.highlight.tint20,
      borderColor: isDark ? 'rgba(111, 186, 255, 0.3)' : PALETTE.highlight.tint40,
    },
    clearDateBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
    },
    iconCircleBtn: {
      width: 35,
      height: 35,
      borderRadius: 10,
      backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    refreshSpinning: {
      opacity: 0.5,
    },

    /* Sub-Bars for Feed Filters, Subject Groups & Subcategories */
    subFilterBar: {
      maxWidth: 940,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 9,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#26272C' : '#F0F1F5',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    secondaryFilterBar: {
      maxWidth: 940,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#26272C' : '#F0F1F5',
      flexDirection: 'row',
      alignItems: 'center',
    },
    paperPillsScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    paperFilterChip: {
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    paperFilterChipActive: {
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.15)' : PALETTE.highlight.tint20,
      borderColor: isDark ? 'rgba(111, 186, 255, 0.3)' : PALETTE.highlight.tint40,
    },
    paperFilterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
    paperFilterChipTextActive: {
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
      fontWeight: '700',
    },
    subcatFilterChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: isDark ? '#26272C' : '#F2F4F8',
      borderWidth: 1,
      borderColor: isDark ? '#34363E' : '#E5E7EB',
    },
    subcatFilterChipActive: {
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.18)' : PALETTE.highlight.tint20,
      borderColor: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
    },
    subcatFilterChipText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    subcatFilterChipTextActive: {
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
      fontWeight: '700',
    },
    storyTotalCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },

    /* 2. Source Dropdown Menu */
    dropdownOverlayWrapper: {
      position: 'absolute',
      top: 62,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 60,
    },
    dropdownBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    agencyDropdownCard: {
      position: 'absolute',
      top: 4,
      right: isDesktop ? 32 : 16,
      width: 224,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 6,
      backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? PALETTE.neutral.dark.textMuted : '#E8E9F1',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 16,
      elevation: 10,
    },
    agencyDropdownHeading: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    agencyMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 9,
    },
    agencyMenuItemActive: {
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.14)' : PALETTE.highlight.tint20,
    },
    agencyMenuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    agencyMenuItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    agencyMenuItemTextActive: {
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
      fontWeight: '700',
    },
    agencyMenuCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
    },

    /* 3. Feed Scroll Area */
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 64,
    },
    feedCenterContainer: {
      maxWidth: 940,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? 24 : 16,
    },
    editorialNoticeBanner: {
      marginTop: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: isDark ? '#26272C' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      gap: 4,
    },
    editorialNoticeTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    editorialNoticeText: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
    },
    dateContextBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginTop: 12,
      borderRadius: 8,
      backgroundColor: isDark ? '#26272C' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    dateContextText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    dateContextAction: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
    },

    /* Visually Distinct EES Subject Group Sections */
    eesDistinctGroupSection: {
      marginTop: 18,
      marginBottom: 8,
    },
    eesGroupHeaderBar: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: isDark ? '#26272C' : '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      borderLeftWidth: 4,
      gap: 4,
    },
    eesGroupHeaderTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eesGroupTitleText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    eesFilterGroupBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    eesFilterGroupBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
    },
    eesSubcategoryListHint: {
      fontSize: 11.5,
      color: theme.textMuted,
      lineHeight: 16,
    },

    /* A. Lead Story Editorial Layout */
    leadStoryCard: {
      paddingVertical: isDesktop ? 22 : 18,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2F3036' : '#E8E9F1',
      ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
    },
    leadStoryGrid: {
      flexDirection: isDesktop ? 'row' : 'column-reverse',
      alignItems: isDesktop ? 'center' : 'stretch',
      gap: isDesktop ? 24 : 14,
    },
    leadStoryTextCol: {
      flex: 1,
      gap: 8,
    },
    leadImageContainer: {
      width: isDesktop ? 280 : '100%',
      height: isDesktop ? 176 : 190,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? '#26272C' : '#E8E9F1',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      flexShrink: 0,
    },
    leadImage: {
      width: '100%',
      height: '100%',
    },
    articleMetaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    sourceLabelText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#C5C6CC' : '#494A50',
      maxWidth: isDesktop ? 320 : 200,
    },
    metaDot: {
      fontSize: 12,
      color: theme.textMuted,
    },
    dateLabelText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textMuted,
    },
    gsBadgePill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.16)' : PALETTE.highlight.tint20,
      marginLeft: 2,
    },
    gsBadgePillText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
    },
    importantBadgePill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.18)' : '#FEF3C7',
    },
    importantBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#FBBF24' : '#B45309',
    },
    editorialAttributionRow: {
      paddingVertical: 2,
    },
    editorialAuthorBadgeText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDark ? '#F43F5E' : '#BE123C',
    },
    leadHeadlineText: {
      fontSize: isDesktop ? 20 : 18,
      fontWeight: '700',
      lineHeight: isDesktop ? 28 : 25,
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    leadSummaryText: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.textSecondary,
    },

    /* B. Streamlined Editorial List Rows */
    editorialRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: isDesktop ? 20 : 14,
      paddingVertical: isDesktop ? 18 : 15,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2F3036' : '#E8E9F1',
      ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
    },
    editorialRowLeft: {
      flex: 1,
      gap: 6,
    },
    rowHeadlineText: {
      fontSize: isDesktop ? 16 : 15,
      fontWeight: '700',
      lineHeight: isDesktop ? 23 : 21,
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    rowExcerptText: {
      fontSize: 13.5,
      lineHeight: 19.5,
      color: theme.textSecondary,
    },
    rowThumbnailBox: {
      width: isDesktop ? 124 : 92,
      height: isDesktop ? 88 : 76,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: isDark ? '#26272C' : '#E8E9F1',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      flexShrink: 0,
      marginTop: 2,
    },
    rowThumbnailImage: {
      width: '100%',
      height: '100%',
    },

    /* Shared Footer Action Bar inside each story */
    articleFooterLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      gap: 10,
    },
    taxonomyTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    subjectGroupBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? '#2F3036' : '#EEF2F6',
    },
    subjectGroupBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    topicTagText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textMuted,
      flexShrink: 1,
    },
    articleActionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    bookmarkIconBtn: {
      padding: 2,
    },
    readFullLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    readFullLinkText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? PALETTE.highlight.tint60 : PALETTE.highlight.primary,
    },
    pressed: {
      opacity: 0.78,
    },
    rowPressed: {
      opacity: 0.75,
    },
  });
