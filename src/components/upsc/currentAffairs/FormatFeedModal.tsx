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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Calendar,
  RotateCw,
} from 'lucide-react-native';
import {
  FormatCategory,
  CuratedArticle,
  DAILY_EVENTS_DATA,
  getTodayDateKey,
} from '@/data/currentAffairsData';
import {
  classifyIntoSimplifiedTaxonomy,
  DailyNewsFeedFilterId,
  SIMPLIFIED_SUBCATEGORIES_MAP,
} from '@/constants/currentAffairsCategories';
import { fetchLiveDailyNewsArticles, mapDailyEventToCuratedArticle } from '@/services/newsFeedService';
import { CalendarDropdown } from './CalendarDropdown';
import { EditorialNewsCard, EditorialNewsItem } from './EditorialNewsCard';
import { EditorialSidebarWidgets } from './EditorialSidebarWidgets';
import { CAQuizModal } from './CAQuizModal';

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

// Category Tabs matching the Figma design
const CATEGORY_TABS = [
  { id: 'all', label: 'All', categoryId: 'all' },
  { id: 'polity', label: 'Polity', categoryId: 'polity-governance' },
  { id: 'economy', label: 'Economy', categoryId: 'economy-environment-science' },
  { id: 'international', label: 'International Relations', categoryId: 'international-affairs' },
  { id: 'environment', label: 'Environment', categoryId: 'economy-environment-science' },
  { id: 'science', label: 'Science & Tech', categoryId: 'economy-environment-science' },
  { id: 'reports', label: 'Reports & Schemes', categoryId: 'reports-schemes-data' },
  { id: 'editorials', label: 'Editorials', categoryId: 'editorials-explainers' },
  { id: 'daily-news', label: 'Daily News', categoryId: 'daily-news' },
];

export function FormatFeedModal({
  visible,
  onClose,
  formatCategory,
  onSelectArticle,
  isDark,
  savedItemIds,
  onToggleBookmark,
}: FormatFeedModalProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Active Category Tab: initialized based on clicked formatCategory
  const [prevFormatCatId, setPrevFormatCatId] = useState<string | undefined>(formatCategory?.id);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(() => {
    if (!formatCategory) return 'all';
    if (formatCategory.id === 'polity-governance') return 'polity';
    if (formatCategory.id === 'economy-environment-science') return 'economy';
    if (formatCategory.id === 'international-affairs') return 'international';
    if (formatCategory.id === 'reports-schemes-data') return 'reports';
    if (formatCategory.id === 'editorials-explainers') return 'editorials';
    if (formatCategory.id === 'daily-news') return 'daily-news';
    return 'all';
  });

  // Sync tab when formatCategory prop changes without effect
  if (formatCategory && formatCategory.id !== prevFormatCatId) {
    setPrevFormatCatId(formatCategory.id);
    if (formatCategory.id === 'polity-governance') setActiveCategoryTab('polity');
    else if (formatCategory.id === 'economy-environment-science') setActiveCategoryTab('economy');
    else if (formatCategory.id === 'international-affairs') setActiveCategoryTab('international');
    else if (formatCategory.id === 'reports-schemes-data') setActiveCategoryTab('reports');
    else if (formatCategory.id === 'editorials-explainers') setActiveCategoryTab('editorials');
    else if (formatCategory.id === 'daily-news') setActiveCategoryTab('daily-news');
    else setActiveCategoryTab('all');
  }

  // Selected date key (defaults to today 2026-10-29 in Asia/Kolkata)
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayDateKey);

  // Prelims vs Mains Focus Filter
  const [focusFilter, setFocusFilter] = useState<'prelims' | 'mains' | 'all'>('prelims');

  // Subcategory and Feed Filters
  const [dailyFeedFilter] = useState<DailyNewsFeedFilterId>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');

  // Calendar modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false);
  const [calendarPos, setCalendarPos] = useState<{ top: number; left?: number; right?: number }>({
    top: 140,
    left: 20,
  });
  const dateBtnRef = useRef<React.ElementRef<typeof View>>(null);

  // Quiz Modal State
  const [quizModalOpen, setQuizModalOpen] = useState<boolean>(false);

  // Read articles tracking for "Today's progress" widget
  const [readArticleIds, setReadArticleIds] = useState<string[]>([
    'ca_29_standing_committees',
    'ca_29_monetary_policy',
    'ca_29_ramsar_wetlands',
  ]);

  useEffect(() => {
    void (async () => {
      try {
        const read = await AsyncStorage.getItem('@upsc_ca_read_article_ids');
        if (read) {
          const parsed = JSON.parse(read);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReadArticleIds(parsed);
          }
        }
      } catch {
        // Fallback
      }
    })();
  }, []);

  const markArticleRead = useCallback((id: string) => {
    setReadArticleIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      void AsyncStorage.setItem('@upsc_ca_read_article_ids', JSON.stringify(next));
      return next;
    });
  }, []);

  const [liveArticles, setLiveArticles] = useState<CuratedArticle[]>([]);

  // 7-day strip computed ending at selectedDateKey
  const sevenDayStrip = useMemo(() => {
    const days: { dateKey: string; dayName: string; dayNum: string }[] = [];
    const [y, m, d] = (selectedDateKey || '2026-10-29').split('-').map(Number);
    const anchor = new Date(y, m - 1, d);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(anchor);
      dt.setDate(anchor.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
      days.push({
        dateKey: key,
        dayName: dayNames[dt.getDay()],
        dayNum: String(dt.getDate()),
      });
    }
    return days;
  }, [selectedDateKey]);

  // Formatted curated subtitle
  const curatedSubtitle = useMemo(() => {
    try {
      const [y, m, d] = selectedDateKey.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const dayName = dayNames[date.getDay()];
      const monthName = monthNames[date.getMonth()];
      return `Curated for UPSC · ${dayName}, ${d} ${monthName} ${y}`;
    } catch {
      return 'Curated for UPSC · Thursday, 29 October 2026';
    }
  }, [selectedDateKey]);

  // Normalize article helper
  const ensureNormalizedArticle = useCallback((art: CuratedArticle): CuratedArticle => {
    if (art.mainCategoryId && art.subjectGroup && art.subcategory) {
      return art;
    }
    const classification = classifyIntoSimplifiedTaxonomy({
      headline: art.title,
      summary: art.summary,
      sourceCategoryHint: art.category,
      sourceName: art.source,
      existingMainCategoryId: art.mainCategoryId,
      existingSubcategory: art.subcategory,
    });
    return {
      ...art,
      mainCategoryId: classification.mainCategoryId,
      subjectGroup: classification.subjectGroup,
      subcategory: classification.subcategory,
      isMostImportant: art.isMostImportant ?? classification.isMostImportant,
      isPrelimsRelevant: art.isPrelimsRelevant ?? classification.isPrelimsRelevant,
      isMainsRelevant: art.isMainsRelevant ?? classification.isMainsRelevant,
      editorialAuthor: art.editorialAuthor || classification.editorialAuthor,
    };
  }, []);

  // Fetch live articles for current module
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    const catId = formatCategory?.id || 'daily-news';
    void fetchLiveDailyNewsArticles('all', catId).then((items) => {
      if (isMounted && items && items.length > 0) {
        setLiveArticles(items.map(ensureNormalizedArticle));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [visible, formatCategory, ensureNormalizedArticle]);

  // Refresh handler
  const handleManualRefresh = useCallback(async () => {
    try {
      const catId = formatCategory?.id || 'daily-news';
      const items = await fetchLiveDailyNewsArticles('all', catId);
      if (items && items.length > 0) {
        setLiveArticles(items.map(ensureNormalizedArticle));
      }
    } catch {
      // Fallback
    }
  }, [formatCategory, ensureNormalizedArticle]);

  // Historical archive articles
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

  // Combined pool of articles
  const allArticles = useMemo(() => {
    const baseCategoryArticles = formatCategory?.articles.map(ensureNormalizedArticle) || [];
    const seen = new Set<string>();
    const merged: CuratedArticle[] = [];

    for (const art of [
      ...liveArticles,
      ...historicalArchiveArticles,
      ...baseCategoryArticles,
    ]) {
      const key = art.title.trim().toLowerCase().slice(0, 36);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(art);
      }
    }
    return merged;
  }, [formatCategory, liveArticles, historicalArchiveArticles, ensureNormalizedArticle]);

  // Filtered articles list based on activeCategoryTab, date, Prelims/Mains, and subcategory
  const filteredArticles = useMemo(() => {
    let list = [...allArticles];

    // 1. Date filter: match selected date (if available in dateKey/date/publishedDateIst)
    const dateMatched = list.filter((art) => {
      if (art.dateKey) return art.dateKey === selectedDateKey;
      if (art.publishedDateIst) return art.publishedDateIst.slice(0, 10) === selectedDateKey;
      return true;
    });
    if (dateMatched.length >= 3) {
      list = dateMatched;
    }

    // 2. Prelims vs Mains Focus Filter
    if (focusFilter === 'prelims') {
      list = list.filter((a) => a.isPrelimsRelevant !== false);
    } else if (focusFilter === 'mains') {
      list = list.filter((a) => a.isMainsRelevant !== false);
    }

    // 3. Category Tab Filter
    if (activeCategoryTab !== 'all' && activeCategoryTab !== 'daily-news') {
      const cat = activeCategoryTab.toLowerCase();
      list = list.filter((item) => {
        const itemCat = (item.category || '').toLowerCase();
        const mainCat = (item.mainCategoryId || '').toLowerCase();
        const subGroup = (item.subjectGroup || '').toLowerCase();

        if (cat === 'polity') {
          return itemCat.includes('polity') || mainCat.includes('polity') || subGroup.includes('polity');
        }
        if (cat === 'economy') {
          return itemCat.includes('economy') || subGroup === 'economy';
        }
        if (cat === 'international') {
          return (
            itemCat.includes('international') ||
            itemCat.includes('relations') ||
            mainCat.includes('international')
          );
        }
        if (cat === 'environment') {
          return itemCat.includes('environment') || subGroup.includes('environment');
        }
        if (cat === 'science') {
          return itemCat.includes('sci') || itemCat.includes('tech') || subGroup.includes('science');
        }
        if (cat === 'reports') {
          return itemCat.includes('report') || itemCat.includes('scheme') || mainCat.includes('reports');
        }
        if (cat === 'editorials') {
          return itemCat.includes('editorial') || mainCat.includes('editorials');
        }
        return true;
      });
    }

    // 4. Subcategory Filter
    if (selectedSubcategory !== 'All') {
      list = list.filter(
        (a) => a.subcategory && a.subcategory.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    // 5. Daily news feed filter
    if (activeCategoryTab === 'daily-news') {
      if (dailyFeedFilter === 'important') {
        list = list.filter((a) => a.isMostImportant);
      } else if (dailyFeedFilter === 'prelims') {
        list = list.filter((a) => a.isPrelimsRelevant);
      } else if (dailyFeedFilter === 'mains') {
        list = list.filter((a) => a.isMainsRelevant);
      }
    }

    // Fallback if empty
    if (list.length === 0 && allArticles.length > 0) {
      return allArticles.slice(0, 8);
    }

    return list;
  }, [
    allArticles,
    selectedDateKey,
    focusFilter,
    activeCategoryTab,
    selectedSubcategory,
    dailyFeedFilter,
  ]);

  // Subcategories for active category
  const currentSubcategories = useMemo(() => {
    if (activeCategoryTab === 'all' || activeCategoryTab === 'daily-news') return [];
    if (activeCategoryTab === 'polity') {
      return SIMPLIFIED_SUBCATEGORIES_MAP['polity-governance'] || [];
    }
    if (activeCategoryTab === 'economy') {
      return (
        SIMPLIFIED_SUBCATEGORIES_MAP['economy-environment-science']?.filter((s: string) =>
          [
            'Banking, Finance and Monetary Policy',
            'Growth, Budget, Taxation and Economic Indicators',
            'Agriculture, Industry, Infrastructure and Employment',
            'Trade, Investment and Economic Reports',
          ].includes(s)
        ) || []
      );
    }
    if (activeCategoryTab === 'international') {
      return SIMPLIFIED_SUBCATEGORIES_MAP['international-affairs'] || [];
    }
    if (activeCategoryTab === 'environment') {
      return (
        SIMPLIFIED_SUBCATEGORIES_MAP['economy-environment-science']?.filter((s: string) =>
          [
            'Climate Change, Pollution and Environmental Policies',
            'Biodiversity, Wildlife and Conservation',
            'Renewable Energy and Sustainable Development',
            'Environmental Reports, Agreements and Disasters',
          ].includes(s)
        ) || []
      );
    }
    if (activeCategoryTab === 'science') {
      return (
        SIMPLIFIED_SUBCATEGORIES_MAP['economy-environment-science']?.filter((s: string) =>
          [
            'Space, Defence and Nuclear Technology',
            'AI, Digital Technology and Emerging Technologies',
            'Biotechnology, Health Research and Scientific Discoveries',
            'Science Policy, Research Missions and Innovation',
          ].includes(s)
        ) || []
      );
    }
    if (activeCategoryTab === 'reports') {
      return SIMPLIFIED_SUBCATEGORIES_MAP['reports-schemes-data'] || [];
    }
    if (activeCategoryTab === 'editorials') {
      return SIMPLIFIED_SUBCATEGORIES_MAP['editorials-explainers'] || [];
    }
    return [];
  }, [activeCategoryTab]);

  // Count read articles
  const readCount = useMemo(() => {
    return filteredArticles.filter((art) => readArticleIds.includes(art.id)).length;
  }, [filteredArticles, readArticleIds]);

  const totalCount = useMemo(() => {
    return Math.max(8, filteredArticles.length);
  }, [filteredArticles.length]);

  // Saved items for "Saved for revision" widget
  const savedRevisionItems = useMemo(() => {
    const list: { id: string; title: string; data: any }[] = [];
    const seen = new Set<string>();

    for (const art of allArticles) {
      if (savedItemIds.includes(art.id)) {
        const shortTitle = (art.title || '').split('—')[0].split('&')[0].trim();
        if (!seen.has(shortTitle)) {
          seen.add(shortTitle);
          list.push({ id: art.id, title: shortTitle, data: art });
        }
      }
    }

    // Default sample entries from Figma image
    if (list.length === 0) {
      list.push(
        {
          id: 'ca_29_standing_committees',
          title: 'Standing committees',
          data: {
            id: 'ca_29_standing_committees',
            title: 'How parliamentary standing committees scrutinise legislation',
            category: 'Polity',
            paper: 'GS-II',
            source: 'The Hindu',
            whyItMatters: 'Committees shape the quality of lawmaking. Revise their composition, powers and limits, and how referral of Bills works in practice.',
            summary: 'Parliamentary Standing Committees examine bills, budgets, and policies in detail, ensuring bipartisan scrutiny away from public rhetoric.',
          },
        },
        {
          id: 'ca_29_ramsar_wetlands',
          title: 'Ramsar Convention',
          data: {
            id: 'ca_29_ramsar_wetlands',
            title: 'Wetland conservation and the Ramsar Convention',
            category: 'Environment',
            paper: 'GS-III',
            source: 'Press Information Bureau (PIB)',
            whyItMatters: 'Revise the Ramsar criteria, the wise-use principle and the domestic legal framework that protects wetlands.',
            summary: 'India currently has 85 Ramsar sites under the Ramsar Convention on Wetlands of International Importance, crucial for ecology and flood mitigation.',
          },
        }
      );
    }

    return list;
  }, [allArticles, savedItemIds]);

  const handleReadSummary = useCallback(
    (item: EditorialNewsItem) => {
      markArticleRead(item.id);
      onSelectArticle(item as unknown as CuratedArticle);
    },
    [markArticleRead, onSelectArticle]
  );

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

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <ScrollView
          style={[styles.container, isDark && styles.containerDark]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContainer}>
            {/* ======================================================== */}
            {/* 1. TOP HEADER: Back + Title + Subtitle + Toggle          */}
            {/* ======================================================== */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerTitleRow}>
                  <Pressable
                    style={({ pressed }: any) => [
                      styles.backBtn,
                      isDark && styles.backBtnDark,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Back to Current Affairs Overview"
                    hitSlop={8}
                  >
                    <ArrowLeft size={18} color={isDark ? '#F9FAFB' : '#111827'} strokeWidth={2.2} />
                  </Pressable>

                  <Text style={[styles.heading, isDark && styles.headingDark]}>
                    Current Affairs
                  </Text>
                </View>

                <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                  {curatedSubtitle}
                </Text>
              </View>

              <View style={styles.headerRight}>
                {/* Segmented [ Prelims | Mains ] Toggle Pill */}
                <View style={[styles.segmentedToggle, isDark && styles.segmentedToggleDark]}>
                  <Pressable
                    style={[
                      styles.toggleBtn,
                      focusFilter === 'prelims' && styles.toggleBtnActive,
                      focusFilter === 'prelims' && isDark && styles.toggleBtnActiveDark,
                    ]}
                    onPress={() => setFocusFilter(focusFilter === 'prelims' ? 'all' : 'prelims')}
                    accessibilityRole="button"
                    accessibilityLabel="Filter by Prelims"
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        focusFilter === 'prelims' && styles.toggleBtnTextActive,
                        focusFilter !== 'prelims' && isDark && styles.toggleBtnTextInactiveDark,
                      ]}
                    >
                      Prelims
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.toggleBtn,
                      focusFilter === 'mains' && styles.toggleBtnActive,
                      focusFilter === 'mains' && isDark && styles.toggleBtnActiveDark,
                    ]}
                    onPress={() => setFocusFilter(focusFilter === 'mains' ? 'all' : 'mains')}
                    accessibilityRole="button"
                    accessibilityLabel="Filter by Mains"
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        focusFilter === 'mains' && styles.toggleBtnTextActive,
                        focusFilter !== 'mains' && isDark && styles.toggleBtnTextInactiveDark,
                      ]}
                    >
                      Mains
                    </Text>
                  </Pressable>
                </View>

                {/* Refresh Icon */}
                <Pressable
                  style={({ pressed }: any) => [
                    styles.iconBtn,
                    isDark && styles.iconBtnDark,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleManualRefresh}
                  accessibilityLabel="Refresh Feed"
                  hitSlop={6}
                >
                  <RotateCw
                    size={16}
                    color={isDark ? '#9CA3AF' : '#4B5563'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </View>

            {/* ======================================================== */}
            {/* 2. DATE SELECTOR STRIP (7-Day Row from Figma)             */}
            {/* ======================================================== */}
            <View style={styles.dateStripWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateStripContent}
              >
                {sevenDayStrip.map((item) => {
                  const isSelected = item.dateKey === selectedDateKey;
                  return (
                    <Pressable
                      key={item.dateKey}
                      style={({ pressed }: any) => [
                        styles.dateCard,
                        isDark && styles.dateCardDark,
                        isSelected && styles.dateCardSelected,
                        isSelected && isDark && styles.dateCardSelectedDark,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => setSelectedDateKey(item.dateKey)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select date ${item.dayName} ${item.dayNum}`}
                    >
                      <Text
                        style={[
                          styles.dateCardDay,
                          isDark && styles.dateCardDayDark,
                          isSelected && styles.dateCardDaySelected,
                        ]}
                      >
                        {item.dayName}
                      </Text>
                      <Text
                        style={[
                          styles.dateCardNum,
                          isDark && styles.dateCardNumDark,
                          isSelected && styles.dateCardNumSelected,
                        ]}
                      >
                        {item.dayNum}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Calendar button for full 20 calendar days */}
                <View ref={dateBtnRef} collapsable={false}>
                  <Pressable
                    style={({ pressed }: any) => [
                      styles.moreDatesBtn,
                      isDark && styles.moreDatesBtnDark,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleOpenCalendar}
                    accessibilityRole="button"
                    accessibilityLabel="More dates calendar"
                  >
                    <Calendar size={18} color={isDark ? '#9CA3AF' : '#4B5563'} strokeWidth={2} />
                  </Pressable>
                </View>
              </ScrollView>
            </View>

            {/* ======================================================== */}
            {/* 3. CATEGORY FILTER PILLS ROW (Terracotta Active Pill)     */}
            {/* ======================================================== */}
            <View style={styles.categoryPillsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPillsContent}
              >
                {CATEGORY_TABS.map((tab) => {
                  const isSelected = activeCategoryTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      style={({ pressed }: any) => [
                        styles.categoryPill,
                        isDark && styles.categoryPillDark,
                        isSelected && styles.categoryPillSelected,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => {
                        setActiveCategoryTab(tab.id);
                        setSelectedSubcategory('All');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${tab.label}`}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          isDark && styles.categoryPillTextDark,
                          isSelected && styles.categoryPillTextSelected,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Subcategories Row if active category has subcategories */}
            {currentSubcategories.length > 0 && (
              <View style={styles.subcategoriesWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subcategoriesContent}
                >
                  <Pressable
                    style={[
                      styles.subcatChip,
                      isDark && styles.subcatChipDark,
                      selectedSubcategory === 'All' && styles.subcatChipSelected,
                    ]}
                    onPress={() => setSelectedSubcategory('All')}
                  >
                    <Text
                      style={[
                        styles.subcatChipText,
                        isDark && styles.subcatChipTextDark,
                        selectedSubcategory === 'All' && styles.subcatChipTextSelected,
                      ]}
                    >
                      All Subcategories
                    </Text>
                  </Pressable>
                  {currentSubcategories.map((subcat: string) => {
                    const isSelected = selectedSubcategory === subcat;
                    return (
                      <Pressable
                        key={subcat}
                        style={[
                          styles.subcatChip,
                          isDark && styles.subcatChipDark,
                          isSelected && styles.subcatChipSelected,
                        ]}
                        onPress={() => setSelectedSubcategory(isSelected ? 'All' : subcat)}
                      >
                        <Text
                          style={[
                            styles.subcatChipText,
                            isDark && styles.subcatChipTextDark,
                            isSelected && styles.subcatChipTextSelected,
                          ]}
                        >
                          {subcat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ======================================================== */}
            {/* 4. MAIN CONTENT GRID (2 Columns Desktop, Stacked Mobile)  */}
            {/* ======================================================== */}
            <View style={isDesktop ? styles.desktopGrid : styles.mobileGrid}>
              {/* Left Column: News Cards Feed */}
              <View style={isDesktop ? styles.feedColumn : styles.mobileFeedColumn}>
                {filteredArticles.length === 0 ? (
                  <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
                    <Text style={[styles.emptyCardTitle, isDark && styles.emptyCardTitleDark]}>
                      No articles found
                    </Text>
                    <Text style={[styles.emptyCardSubtitle, isDark && styles.emptyCardSubtitleDark]}>
                      Try selecting a different date or subcategory to explore UPSC materials.
                    </Text>
                  </View>
                ) : (
                  filteredArticles.map((item) => (
                    <EditorialNewsCard
                      key={item.id}
                      item={item as any}
                      isBookmarked={savedItemIds.includes(item.id)}
                      onToggleBookmark={onToggleBookmark}
                      onReadSummary={handleReadSummary}
                      isDark={isDark}
                    />
                  ))
                )}
              </View>

              {/* Right Column: Sidebar Widgets */}
              <View style={isDesktop ? styles.sidebarColumn : styles.mobileSidebarColumn}>
                <EditorialSidebarWidgets
                  readCount={readCount}
                  totalCount={totalCount}
                  savedItems={savedRevisionItems}
                  onStartQuiz={() => setQuizModalOpen(true)}
                  onSelectSavedItem={(item) => onSelectArticle(item.data as CuratedArticle)}
                  isDark={isDark}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Calendar Dropdown Modal */}
        <CalendarDropdown
          visible={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          selectedDateKey={selectedDateKey}
          onSelectDate={(newDateKey) => {
            setSelectedDateKey(newDateKey);
            setCalendarModalOpen(false);
          }}
          topOffset={calendarPos.top}
          leftOffset={calendarPos.left}
          isDark={isDark}
        />

        {/* Daily Quiz Modal */}
        <CAQuizModal
          visible={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          isDark={isDark}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBFBF9',
  },
  safeAreaDark: {
    backgroundColor: '#0D1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#FBFBF9',
  },
  containerDark: {
    backgroundColor: '#0D1117',
  },
  contentContainer: {
    paddingBottom: 60,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    minWidth: 260,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, "Times New Roman", serif',
      default: 'serif',
    }),
    letterSpacing: -0.4,
  },
  headingDark: {
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 48,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    padding: 3,
  },
  segmentedToggleDark: {
    backgroundColor: '#21262D',
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#17202A',
  },
  toggleBtnActiveDark: {
    backgroundColor: '#30363D',
  },
  toggleBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  toggleBtnTextInactiveDark: {
    color: '#9CA3AF',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  dateStripWrapper: {
    marginBottom: 20,
  },
  dateStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dateCard: {
    width: 52,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  dateCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  dateCardSelected: {
    backgroundColor: '#17202A',
    borderColor: '#17202A',
  },
  dateCardSelectedDark: {
    backgroundColor: '#30363D',
    borderColor: '#30363D',
  },
  dateCardDay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  dateCardDayDark: {
    color: '#9CA3AF',
  },
  dateCardDaySelected: {
    color: '#9CA3AF',
  },
  dateCardNum: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  dateCardNumDark: {
    color: '#F9FAFB',
  },
  dateCardNumSelected: {
    color: '#FFFFFF',
  },
  moreDatesBtn: {
    width: 44,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreDatesBtnDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  categoryPillsWrapper: {
    marginBottom: 16,
  },
  categoryPillsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  categoryPillSelected: {
    backgroundColor: '#A84319',
    borderColor: '#A84319',
  },
  categoryPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#374151',
  },
  categoryPillTextDark: {
    color: '#D1D5DB',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subcategoriesWrapper: {
    marginBottom: 18,
  },
  subcategoriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subcatChip: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subcatChipDark: {
    backgroundColor: '#21262D',
    borderColor: '#30363D',
  },
  subcatChipSelected: {
    backgroundColor: '#17202A',
    borderColor: '#17202A',
  },
  subcatChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  subcatChipTextDark: {
    color: '#9CA3AF',
  },
  subcatChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    marginTop: 8,
  },
  mobileGrid: {
    flexDirection: 'column',
    gap: 24,
    marginTop: 8,
  },
  feedColumn: {
    flex: 1,
    minWidth: 0,
  },
  mobileFeedColumn: {
    width: '100%',
  },
  sidebarColumn: {
    width: 320,
    flexShrink: 0,
  },
  mobileSidebarColumn: {
    width: '100%',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  emptyCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyCardTitleDark: {
    color: '#F9FAFB',
  },
  emptyCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  emptyCardSubtitleDark: {
    color: '#9CA3AF',
  },
});
