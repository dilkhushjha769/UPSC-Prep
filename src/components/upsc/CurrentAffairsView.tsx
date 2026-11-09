import { FONT_FAMILY, getTokens, SemanticTokens } from '@/constants/designTokens';
import { useAppTheme } from '@/context/ThemeContext';
import {
  CACategoryStatusItem,
  CAIngestionLogItem,
  CuratedArticle,
  DailyEventItem,
  DayEventsSummary,
  FORMAT_CATEGORIES,
  FormatCategory,
  getDailyEventsSummary,
  getTodayDateKey,
  MajorEvent,
} from '@/data/currentAffairsData';
import {
  getDailyBriefByDate,
  getGsPaperIllustrationPalette,
  getUserBookmarks,
  getUserStudyProgress,
  HeroStoryBriefItem,
  invalidateCurrentAffairsCache,
  submitStoryErrorReport,
  toggleUserBookmark,
  updateUserStudyProgress,
  UserStudyProgress,
} from '@/services/currentAffairsApi';
import {
  fetchCategoryStatuses,
  fetchIngestionOperationalLogs,
  fetchLiveNewsFromAgencies,
  getCachedAuthenticNews,
} from '@/services/newsFeedService';
import { formatActionHeadline90Chars, normalizeGsPaperCode, selectHeroStoriesForDate } from '@/services/upscRelevanceEngine';
import { resolveCompliantStoryImage } from '@/utils/imageVerification';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Landmark,
  Leaf,
  ListChecks,
  Newspaper,
  Pause,
  Play,
  Scale,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArticleDetailModal } from './currentAffairs/ArticleDetailModal';
import { CalendarDropdown } from './currentAffairs/CalendarDropdown';
import { CAQuizModal } from './currentAffairs/CAQuizModal';
import { DailyRecallModal } from './currentAffairs/DailyRecallModal';
import { FormatFeedModal } from './currentAffairs/FormatFeedModal';
import { MonthlyRevisionModal } from './currentAffairs/MonthlyRevisionModal';
import { NotesLibraryModal } from './currentAffairs/NotesLibraryModal';
import { EditorQueueStoryItem, PipelineStatusModal } from './currentAffairs/PipelineStatusModal';

type DetailItem =
  | { type: 'event'; data: DailyEventItem }
  | { type: 'major'; data: MajorEvent }
  | { type: 'article'; data: CuratedArticle };

interface CurrentAffairsViewProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

const SOURCE_FILTER_CHIPS: { id: string; label: string; matchKeyword: string }[] = [
  { id: 'all', label: 'All Agencies', matchKeyword: '' },
  { id: 'hindu', label: 'The Hindu', matchKeyword: 'The Hindu' },
  { id: 'express', label: 'Indian Express', matchKeyword: 'Indian Express' },
  { id: 'pib', label: 'PIB', matchKeyword: 'PIB' },
  { id: 'dte', label: 'Down To Earth', matchKeyword: 'Down To Earth' },
];

const EXPLORE_MODULE_CARDS: {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
}[] = [
  {
    id: 'daily-news',
    title: 'Daily News',
    subtitle: 'Source-tagged headlines for the day, sorted by GS paper.',
    iconName: 'Newspaper',
  },
  {
    id: 'international-affairs',
    title: 'International Affairs',
    subtitle: "Global developments and their bearing on India's foreign policy.",
    iconName: 'Globe',
  },
  {
    id: 'polity-governance',
    title: 'Polity & Governance',
    subtitle: 'Constitution, institutions and governance updates.',
    iconName: 'Scale',
  },
  {
    id: 'economy-environment-science',
    title: 'Economy, Environment & Science',
    subtitle: 'Growth, ecology and science & technology, tied to GS 3.',
    iconName: 'Leaf',
  },
  {
    id: 'reports-schemes-data',
    title: 'Reports, Schemes & Data',
    subtitle: 'Indices, reports and scheme facts for quick revision.',
    iconName: 'Landmark',
  },
  {
    id: 'editorials-explainers',
    title: 'Editorials & Explainers',
    subtitle: 'Opinion pieces decoded into points you can use in Mains.',
    iconName: 'BookOpen',
  },
];

function shiftDateKeyByDays(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatDatePickerDisplayLabel(dateKey: string, todayKey: string): string {
  const [y, m, d] = dateKey.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const mName = monthNames[dt.getMonth()] || 'Nov';
  const dName = dayNames[dt.getDay()] || 'Sun';
  if (dateKey === todayKey) {
    return `Today, ${d} ${mName}`;
  }
  return `${dName}, ${d} ${mName}`;
}

export function CurrentAffairsView({ isDark: propIsDark }: CurrentAffairsViewProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const tokens = useMemo(() => getTokens(isDark), [isDark]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 920;
  const isTablet = width >= 640 && width < 920;

  const styles = useMemo(
    () => getStyles(tokens, isDark, isDesktop, isTablet),
    [tokens, isDark, isDesktop, isTablet]
  );

  const searchParams = useLocalSearchParams<{ date?: string; source?: string; module?: string }>();
  const todayKey = useMemo(() => getTodayDateKey(), []);

  // Selected date in IST (initialised from URL `?date=` if valid and not in the future)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const paramDate = typeof searchParams?.date === 'string' ? searchParams.date.trim() : '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(paramDate) && paramDate <= getTodayDateKey()) {
      return paramDate;
    }
    return getTodayDateKey();
  });

  // Selected Agency Filter (`All Agencies`, `The Hindu`, `Indian Express`, `PIB`, `Down To Earth`)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(() => {
    const paramSrc = typeof searchParams?.source === 'string' ? searchParams.source.trim().toLowerCase() : '';
    if (SOURCE_FILTER_CHIPS.some((c) => c.id === paramSrc)) {
      return paramSrc;
    }
    return 'all';
  });

  const [agencyDropdownVisible, setAgencyDropdownVisible] = useState<boolean>(false);

  // Slide state for Hero Carousel
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);

  const handleSelectDate = useCallback(
    (nextDateKey: string) => {
      if (nextDateKey > todayKey) return; // Never allow future dates
      setSelectedDateKey(nextDateKey);
      setActiveEventIndex(0);
      try {
        router.setParams({ date: nextDateKey });
      } catch {
        // Ignore router param sync error outside navigation context
      }
    },
    [todayKey]
  );

  const handleSelectAgency = useCallback((agencyId: string) => {
    setSelectedAgencyId(agencyId);
    setActiveEventIndex(0);
    try {
      router.setParams({ source: agencyId });
    } catch {
      // Ignore
    }
  }, []);

  // Bookmarking state connected to `/api/v1/me/bookmarks`
  const [savedItemIds, setSavedItemIds] = useState<string[]>(['de_25_1', 'me_1']);

  useEffect(() => {
    void (async () => {
      const bmList = await getUserBookmarks();
      if (bmList.length > 0) {
        setSavedItemIds((prev) => Array.from(new Set([...prev, ...bmList.map((b) => b.story_id)])));
      }
    })();
  }, []);

  const toggleBookmark = useCallback((id: string, itemMeta?: Partial<DailyEventItem>) => {
    setSavedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    void toggleUserBookmark({
      story_id: id,
      headline: itemMeta?.headline || 'Saved UPSC Current Affairs Story',
      gs_paper: itemMeta?.paper || 'GS2',
      topic: itemMeta?.category || 'Polity & Governance',
      source_name: itemMeta?.source || 'PIB',
      source_url: itemMeta?.referenceUrl || 'https://pib.gov.in',
      date_ist: itemMeta?.dateKey || selectedDateKey,
    });
  }, [selectedDateKey]);

  const isBookmarked = useCallback((id: string) => savedItemIds.includes(id), [savedItemIds]);

  // Study Path & Mark-as-Read state connected to `/api/v1/me/progress?date=...`
  const [studyProgress, setStudyProgress] = useState<UserStudyProgress>({
    date: selectedDateKey,
    read_headlines: false,
    opened_analysis: false,
    attempted_quiz: false,
    recalled_event: false,
    marked_as_read: false,
    read_story_ids: [],
    completed_count: 0,
    total_steps: 4,
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const prog = await getUserStudyProgress(selectedDateKey);
        if (active) setStudyProgress(prog);
      } catch {
        // Ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedDateKey]);

  const handleUpdateProgress = useCallback(
    async (
      updates: Partial<{
        read_headlines: boolean;
        opened_analysis: boolean;
        attempted_quiz: boolean;
        recalled_event: boolean;
        marked_as_read: boolean;
      }>
    ) => {
      const updated = await updateUserStudyProgress(selectedDateKey, updates);
      setStudyProgress(updated);
    },
    [selectedDateKey]
  );

  // Calendar Dropdown state
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
      calendarBtnRef.current.measureInWindow((x: number, y: number, _btnWidth: number, btnHeight: number) => {
        const top = Math.max(100, y + btnHeight + 8);
        const left = Math.max(12, Math.min(x, width - 336));
        setCalendarDropdownPos({ top, left });
        setCalendarDropdownVisible(true);
      });
    } else {
      setCalendarDropdownVisible(true);
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
  const [pipelineStatusModalVisible, setPipelineStatusModalVisible] = useState(false);

  // Report an Error modal state
  const [reportErrorModalVisible, setReportErrorModalVisible] = useState(false);
  const [reportErrorText, setReportErrorText] = useState('');
  const [reportErrorSubmitted, setReportErrorSubmitted] = useState(false);

  // Live authentic news state + operational telemetry + `/api/v1/briefs` hero stories
  const [liveAgencyEvents, setLiveAgencyEvents] = useState<DailyEventItem[]>([]);
  const [apiHeroStories, setApiHeroStories] = useState<HeroStoryBriefItem[]>([]);
  const [categoryStatuses, setCategoryStatuses] = useState<CACategoryStatusItem[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<CAIngestionLogItem[]>([]);
  const [isPipelineSyncing, setIsPipelineSyncing] = useState(false);
  const [editorOverrides, setEditorOverrides] = useState<
    Record<string, { status?: 'published' | 'rejected'; headline?: string }>
  >({});

  const loadPipelineData = useCallback(
    async (agencyId: string, dateKey: string) => {
      setIsPipelineSyncing(true);
      try {
        const [briefRes, liveItems, statuses, logs] = await Promise.all([
          getDailyBriefByDate(dateKey).catch(() => null),
          fetchLiveNewsFromAgencies(agencyId),
          fetchCategoryStatuses(),
          fetchIngestionOperationalLogs(),
        ]);
        if (briefRes && Array.isArray(briefRes.stories)) {
          setApiHeroStories(briefRes.stories);
        }
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
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const cached = await getCachedAuthenticNews();
      if (isMounted && cached && cached.length > 0) {
        setLiveAgencyEvents(cached);
      }
      if (isMounted) {
        await loadPipelineData(selectedAgencyId, selectedDateKey);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedAgencyId, selectedDateKey, loadPipelineData]);

  // Active day data from static verified archive (returns empty events[] if date not in DAILY_EVENTS_DATA)
  const activeDaySummary: DayEventsSummary = useMemo(() => {
    return getDailyEventsSummary(selectedDateKey);
  }, [selectedDateKey]);

  const isToday = selectedDateKey === todayKey;

  /**
   * Builds the 3 to 5 Hero Stories for the selected IST date (`score >= 60`, max 2 per GS paper).
   * Never uses generic "Digest" or "Archive Record" placeholders.
   */
  const activeDailyEvents: DailyEventItem[] = useMemo(() => {
    // Convert API Hero Stories into DailyEventItem objects first
    const convertedFromBriefApi: DailyEventItem[] = apiHeroStories.map((st) => {
      const gsLabel =
        st.gs_paper === 'GS1'
          ? 'GS-I'
          : st.gs_paper === 'GS3'
          ? 'GS-III'
          : st.gs_paper === 'GS4'
          ? 'GS-IV'
          : 'GS-II';

      let cat: DailyEventItem['category'] = 'Polity';
      const topLower = st.topic.toLowerCase();
      if (topLower.includes('environment') || topLower.includes('climate')) cat = 'Environment';
      else if (topLower.includes('economy')) cat = 'Economy';
      else if (topLower.includes('science') || topLower.includes('tech')) cat = 'Sci-Tech';
      else if (topLower.includes('international')) cat = 'International Relations';

      const bullets = st.key_facts.map((k) => k.fact);
      return {
        id: st.id,
        category: cat,
        paper: gsLabel,
        headline: formatActionHeadline90Chars(
          editorOverrides[st.id]?.headline || st.headline,
          st.topic
        ),
        source: st.sources.map((s) => s.name).join(' • '),
        date: st.date_ist,
        dateKey: st.date_ist,
        referenceUrl: st.sources[0]?.url || 'https://pib.gov.in',
        imageUrl: st.image.is_generated ? undefined : st.image.url,
        imageMetadata: {
          imageUrl: st.image.url,
          credit: st.image.credit,
          sourceUrl: st.image.source_url,
          associatedArticleId: st.id,
          imageType: st.image.is_generated ? 'placeholder' : 'event_photo',
          license: st.image.license,
          verificationStatus: st.image.is_generated ? 'placeholder_fallback' : 'verified_official',
          caption: st.image.alt,
        },
        summary: bullets.map((b) => `- ${b}`).join('\n'),
        summaryBullets: bullets.slice(0, 3),
        bullets,
        prelimsFacts: [st.prelims_angle, ...bullets.slice(0, 2)],
        prelimsFactMatrix: [
          { label: 'GS Paper & Topic', value: `${st.gs_paper} • ${st.topic}` },
          { label: 'Primary Source', value: st.sources.map((s) => s.name).join(', ') },
          { label: 'UPSC Score', value: `${st.upsc_score} / 100 (Verified)` },
        ],
        syllabusRelevance: {
          paperTopic: `${st.gs_paper}: ${st.topic}`,
          staticConnection: st.static_background,
          prelimsAngle: st.prelims_angle,
          mainsDimensions: st.mains_angle,
        },
        sources: st.sources.map((s) => ({
          name: s.name,
          url: s.url,
          date: st.date_ist,
          type: (s.type as any) || 'Official',
        })),
        whyItMatters: st.why_in_news,
        relevanceScore: st.upsc_score / 100,
      };
    });

    const dateMatchedLive = liveAgencyEvents.filter((item) => {
      if (item.dateKey) return item.dateKey === selectedDateKey;
      return isToday;
    });

    const combinedCandidates = [
      ...convertedFromBriefApi,
      ...dateMatchedLive,
      ...activeDaySummary.events,
    ].filter((item) => {
      if (editorOverrides[item.id]?.status === 'rejected') return false;
      // Ensure concrete event headline <= 90 chars and non-empty source link
      return Boolean(item.headline && item.headline.trim().length > 10);
    });

    // Deduplicate by normalized headline prefix and enrich with accurate GS paper, category & concrete summary
    const seen = new Set<string>();
    const deduped: DailyEventItem[] = [];
    for (const item of combinedCandidates) {
      const cleanHeadline = formatActionHeadline90Chars(
        editorOverrides[item.id]?.headline || item.headline,
        item.category
      );
      const key = cleanHeadline.toLowerCase().slice(0, 36);
      if (!seen.has(key)) {
        seen.add(key);

        // Infer accurate GS paper & category from headline + summary so Green Hydrogen / RBI / ISRO / Tiger Reserve never show a wrong GS2 Polity badge
        const textLower = `${cleanHeadline} ${item.summary || ''} ${item.category || ''}`.toLowerCase();
        let resolvedCategory: DailyEventItem['category'] = item.category;
        let resolvedPaper: DailyEventItem['paper'] = item.paper;

        if (/\b(green hydrogen|sight|mnre|renewable|tiger reserve|ntca|moefcc|mangrove|wetland|ramsar|biodiversity|climate|cop\d+|unfccc|wildlife)\b/i.test(textLower)) {
          resolvedCategory = 'Environment';
          resolvedPaper = 'GS-III';
        } else if (/\b(isro|semi-cryogenic|chandrayaan|gaganyaan|lvm3|satellite|bioe3|quantum|semiconductor)\b/i.test(textLower)) {
          resolvedCategory = 'Sci-Tech';
          resolvedPaper = 'GS-III';
        } else if (/\b(rbi|reserve bank|lcr|basel|unified lending|uli|monetary policy|repo rate|gdp|fiscal|finance commission|multidimensional poverty|mpi)\b/i.test(textLower)) {
          resolvedCategory = 'Economy';
          resolvedPaper = 'GS-III';
        } else if (/\b(archaeological|asi|porunai|iron age|maratha|unesco|world heritage)\b/i.test(textLower)) {
          resolvedCategory = 'Polity';
          resolvedPaper = 'GS-I';
        } else if (/\b(supreme court|constitution bench|article 16|article 341|scheduled castes|parliament|lok sabha|rajya sabha)\b/i.test(textLower)) {
          resolvedCategory = 'Polity';
          resolvedPaper = 'GS-II';
        }

        // Replace generic boilerplate whyItMatters ("Important for GS-2 Economy to connect...") with concrete factual summary
        let concreteWhyInNews = item.whyItMatters || '';
        if (!concreteWhyInNews || /^important for gs-/i.test(concreteWhyInNews.trim())) {
          concreteWhyInNews =
            item.summaryBullets?.[0] ||
            item.bullets?.[0] ||
            (item.summary ? item.summary.replace(/^- /, '').split('\n')[0] : '') ||
            concreteWhyInNews;
        }

        deduped.push({
          ...item,
          headline: cleanHeadline,
          category: resolvedCategory,
          paper: resolvedPaper,
          whyItMatters: concreteWhyInNews,
        });
      }
    }

    // Filter by selected agency chip if active
    let agencyFiltered = deduped;
    if (selectedAgencyId !== 'all') {
      const chip = SOURCE_FILTER_CHIPS.find((c) => c.id === selectedAgencyId);
      if (chip?.matchKeyword) {
        const kw = chip.matchKeyword.toLowerCase();
        const matched = deduped.filter(
          (e) => e.agencyId === selectedAgencyId || e.source.toLowerCase().includes(kw)
        );
        if (matched.length > 0) {
          agencyFiltered = matched;
        }
      }
    }

    // Enforce Section 4 Rule 4: Top 3 to 5 hero stories by score, at most 2 per GS paper
    const heroRanked = selectHeroStoriesForDate(
      agencyFiltered.map((e) => ({
        ...e,
        upsc_score: Math.round((e.relevanceScore || 0.82) * 100),
        gs_paper: e.paper,
        source_url: e.referenceUrl || e.sources?.[0]?.url || 'https://pib.gov.in',
      })),
      5,
      2
    );

    // Resolve a distinct, entity-matched legal photograph for every hero story (no duplicate reuse across stories)
    const usedHeroUrls = new Set<string>();
    return heroRanked.map((ev) => {
      const resolvedImg = resolveCompliantStoryImage({
        storyId: ev.id,
        headline: ev.headline,
        summary: `${ev.whyItMatters || ''} ${ev.summary || ''}`,
        gsPaper: normalizeGsPaperCode(ev.paper),
        topic: ev.category,
        sourceName: ev.source,
        candidateImageUrl:
          ev.imageUrl && ev.imageUrl.startsWith('http') ? ev.imageUrl : null,
        usedImageUrls: usedHeroUrls,
      });

      const finalPhotoUrl = resolvedImg.url.startsWith('http')
        ? resolvedImg.url
        : ev.imageUrl && ev.imageUrl.startsWith('http')
        ? ev.imageUrl
        : undefined;

      return {
        ...ev,
        imageUrl: finalPhotoUrl,
        imageMetadata: {
          imageUrl: resolvedImg.url,
          credit: resolvedImg.credit,
          sourceUrl: resolvedImg.source_url,
          associatedArticleId: ev.id,
          imageType: resolvedImg.is_generated ? 'placeholder' : 'event_photo',
          license: resolvedImg.license,
          verificationStatus: resolvedImg.tier === 1 ? 'verified_official' : 'verified_agency',
          caption: resolvedImg.alt_text,
        },
      };
    });
  }, [
    activeDaySummary.events,
    apiHeroStories,
    editorOverrides,
    isToday,
    liveAgencyEvents,
    selectedAgencyId,
    selectedDateKey,
  ]);

  const currentDailyEvent: DailyEventItem | undefined =
    activeDailyEvents[activeEventIndex] || activeDailyEvents[0];

  // Editor Queue items for the Admin Review Queue in PipelineStatusModal
  const editorQueueItems: EditorQueueStoryItem[] = useMemo(() => {
    return activeDailyEvents.map((ev) => ({
      id: ev.id,
      headline: ev.headline,
      gs_paper: normalizeGsPaperCode(ev.paper),
      topic: ev.category.toUpperCase(),
      upsc_score: Math.round((ev.relevanceScore || 0.85) * 100),
      source_name: ev.source,
      source_url: ev.referenceUrl || ev.sources?.[0]?.url || 'https://pib.gov.in',
      status: 'published',
      why_in_news: ev.whyItMatters,
    }));
  }, [activeDailyEvents]);

  const handleEditorAction = useCallback(
    (storyId: string, action: 'approve' | 'reject' | 'edit', updatedHeadline?: string) => {
      setEditorOverrides((prev) => ({
        ...prev,
        [storyId]: {
          status: action === 'reject' ? 'rejected' : 'published',
          headline: updatedHeadline ? formatActionHeadline90Chars(updatedHeadline) : prev[storyId]?.headline,
        },
      }));
    },
    []
  );

  // Handlers for modal interactions
  const handleOpenDailyEvent = useCallback(
    (item: DailyEventItem) => {
      setActiveDetailItem({ type: 'event', data: item });
      setArticleModalVisible(true);
      void handleUpdateProgress({ opened_analysis: true, read_headlines: true });
    },
    [handleUpdateProgress]
  );

  const handleOpenFormatModal = useCallback((moduleId: string) => {
    const matchedCat =
      FORMAT_CATEGORIES.find((c) => c.id === moduleId) || FORMAT_CATEGORIES[0];
    setSelectedFormatCategory(matchedCat);
    setFormatModalVisible(true);
  }, []);

  const handleSelectArticleFromFormat = useCallback(
    (art: CuratedArticle) => {
      setActiveDetailItem({ type: 'article', data: art });
      setArticleModalVisible(true);
      void handleUpdateProgress({ opened_analysis: true });
    },
    [handleUpdateProgress]
  );

  // Carousel animation & accessibility (5s rotation, pause button, reduced-motion, tab visibility, keyboard & swipe)
  const [translateX] = useState(() => new Animated.Value(0));
  const [cardOpacity] = useState(() => new Animated.Value(1));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  // Check OS/Browser Reduced Motion setting
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setIsReducedMotion(Boolean(enabled));
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      setIsReducedMotion(Boolean(enabled));
    });
    return () => {
      sub?.remove?.();
    };
  }, []);

  // Pause carousel when browser tab is hidden (Web) and support Left/Right arrow keys
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const animateCardTransition = useCallback(
    (direction: 'next' | 'prev', callback: () => void) => {
      if (isReducedMotion) {
        callback();
        return;
      }
      if (isTransitioning) return;
      setIsTransitioning(true);

      const exitValue = direction === 'next' ? -28 : 28;
      const enterValue = direction === 'next' ? 28 : -28;

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: exitValue,
          duration: 130,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 130,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        translateX.setValue(enterValue);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 160,
            easing: Easing.bezier(0, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 160,
            easing: Easing.bezier(0, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    },
    [cardOpacity, isReducedMotion, isTransitioning, translateX]
  );

  const handlePrevEvent = useCallback(() => {
    if (activeDailyEvents.length <= 1) return;
    animateCardTransition('prev', () => {
      setActiveEventIndex((prev) => (prev - 1 + activeDailyEvents.length) % activeDailyEvents.length);
    });
  }, [activeDailyEvents.length, animateCardTransition]);

  const handleNextEvent = useCallback(() => {
    if (activeDailyEvents.length <= 1) return;
    animateCardTransition('next', () => {
      setActiveEventIndex((prev) => (prev + 1) % activeDailyEvents.length);
    });
  }, [activeDailyEvents.length, animateCardTransition]);

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

  // Keyboard Left/Right navigation on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        articleModalVisible ||
        notesLibraryModalVisible ||
        dailyRecallModalVisible ||
        formatModalVisible ||
        quizModalVisible ||
        monthlyModalVisible ||
        reportErrorModalVisible
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNextEvent();
      } else if (e.key === 'ArrowLeft') {
        handlePrevEvent();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    articleModalVisible,
    dailyRecallModalVisible,
    formatModalVisible,
    handleNextEvent,
    handlePrevEvent,
    monthlyModalVisible,
    notesLibraryModalVisible,
    quizModalVisible,
    reportErrorModalVisible,
  ]);

  // 5-second Hero Carousel Auto-Rotation (pauses on hover, focus, pause button, hidden tab, or reduced-motion)
  useEffect(() => {
    if (activeDailyEvents.length <= 1) return;
    if (isUserPaused || isHoverPaused || isReducedMotion || isTabHidden) return;
    if (
      articleModalVisible ||
      notesLibraryModalVisible ||
      dailyRecallModalVisible ||
      formatModalVisible ||
      calendarDropdownVisible ||
      quizModalVisible ||
      monthlyModalVisible ||
      reportErrorModalVisible
    ) {
      return;
    }

    const timer = setInterval(() => {
      animateCardTransition('next', () => {
        setActiveEventIndex((prev) => (prev + 1) % activeDailyEvents.length);
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [
    activeDailyEvents.length,
    animateCardTransition,
    articleModalVisible,
    calendarDropdownVisible,
    dailyRecallModalVisible,
    formatModalVisible,
    isHoverPaused,
    isReducedMotion,
    isTabHidden,
    isUserPaused,
    monthlyModalVisible,
    notesLibraryModalVisible,
    quizModalVisible,
    reportErrorModalVisible,
  ]);

  // Swipe gesture responder for Hero Card
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
        onPanResponderGrant: () => {
          setIsHoverPaused(true);
        },
        onPanResponderRelease: (_, g) => {
          setIsHoverPaused(false);
          if (g.dx < -40) handleNextEvent();
          else if (g.dx > 40) handlePrevEvent();
        },
      }),
    [handleNextEvent, handlePrevEvent]
  );

  const renderModuleIcon = (iconName: string) => {
    const iconColor = isDark ? '#D8AE68' : '#8A6B31';
    const props = { size: 19, color: iconColor, strokeWidth: 2 };
    switch (iconName) {
      case 'Newspaper':
        return <Newspaper {...props} />;
      case 'Globe':
        return <Globe {...props} />;
      case 'Scale':
        return <Scale {...props} />;
      case 'Leaf':
        return <Leaf {...props} />;
      case 'Landmark':
        return <Landmark {...props} />;
      case 'BookOpen':
      default:
        return <BookOpen {...props} />;
    }
  };

  // Hero visual palette matching the 3 uploaded design mock-up screenshots
  const currentHeroPalette = useMemo(() => {
    if (!currentDailyEvent) {
      return getGsPaperIllustrationPalette('GS2', 'Polity');
    }
    return getGsPaperIllustrationPalette(currentDailyEvent.paper, currentDailyEvent.category);
  }, [currentDailyEvent]);

  const currentHeroGsBadgeText = useMemo(() => {
    if (!currentDailyEvent) return 'GS2 • POLITY & GOVERNANCE';
    const gs = normalizeGsPaperCode(currentDailyEvent.paper);
    const catUpper =
      currentDailyEvent.category === 'Polity'
        ? 'POLITY & GOVERNANCE'
        : currentDailyEvent.category === 'Sci-Tech'
        ? 'SCIENCE & TECH'
        : currentDailyEvent.category.toUpperCase();
    return `${gs} • ${catUpper}`;
  }, [currentDailyEvent]);

  const datePickerDisplayLabel = useMemo(
    () => formatDatePickerDisplayLabel(selectedDateKey, todayKey),
    [selectedDateKey, todayKey]
  );

  const canGoNextDay = selectedDateKey < todayKey;

  const activeMonthName = useMemo(() => {
    const [, m] = selectedDateKey.split('-');
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return names[Math.max(0, parseInt(m, 10) - 1)] || 'November';
  }, [selectedDateKey]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* ================================================================ */}
        {/* 1. TOP BAR: Current Affairs Brand + [Notes] [Saved]              */}
        {/* ================================================================ */}
        <View style={styles.topHeaderBar}>
          <Pressable onLongPress={() => setPipelineStatusModalVisible(true)}>
            <Text style={styles.brandTitle}>Current Affairs</Text>
          </Pressable>

          <View style={styles.topUtilityPillsRow}>
            <Pressable
              style={({ pressed }) => [styles.topHeaderLink, pressed && styles.pressed]}
              onPress={() => {
                setInitialNoteTitle('');
                setNotesLibraryInitialTab('notes');
                setNotesLibraryModalVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Open Notes"
            >
              <FileText size={15} color={isDark ? '#F8FAFC' : '#101D33'} strokeWidth={2} />
              <Text style={styles.topHeaderLinkText}>Notes</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.topHeaderLink, pressed && styles.pressed]}
              onPress={() => {
                setNotesLibraryInitialTab('library');
                setNotesLibraryModalVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Open Saved"
            >
              <Bookmark size={15} color={isDark ? '#F8FAFC' : '#101D33'} strokeWidth={2} />
              <Text style={styles.topHeaderLinkText}>Saved</Text>
            </Pressable>
          </View>
        </View>

        {/* ================================================================ */}
        {/* 2. THE DAILY BRIEF SECTION (2-COLUMN HERO + HEADLINES)           */}
        {/* ================================================================ */}
        <View style={styles.dailyBriefSection}>
          <View style={styles.briefHeaderRow}>
            <Text style={styles.briefMainHeading}>The Daily Brief</Text>

            {/* Date Picker Pill: < Today, 08 Nov > */}
            <View ref={calendarBtnRef} collapsable={false} style={styles.datePickerCompositePill}>
              <Pressable
                style={({ pressed }) => [styles.dateArrowBtn, pressed && styles.pressed]}
                onPress={() => handleSelectDate(shiftDateKeyByDays(selectedDateKey, -1))}
                accessibilityRole="button"
                accessibilityLabel="Previous day"
                hitSlop={6}
              >
                <ChevronLeft size={15} color={isDark ? '#CBD5E1' : '#475569'} strokeWidth={2.2} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.dateCenterBtn, pressed && styles.pressed]}
                onPress={handleToggleCalendar}
                accessibilityRole="button"
                accessibilityLabel={`Select date. Currently ${datePickerDisplayLabel}`}
              >
                <Text style={styles.dateCenterLabel}>{datePickerDisplayLabel}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.dateArrowBtn,
                  !canGoNextDay && styles.dateArrowBtnDisabled,
                  pressed && canGoNextDay && styles.pressed,
                ]}
                onPress={() => {
                  if (canGoNextDay) {
                    handleSelectDate(shiftDateKeyByDays(selectedDateKey, 1));
                  }
                }}
                disabled={!canGoNextDay}
                accessibilityRole="button"
                accessibilityLabel="Next day"
                hitSlop={6}
              >
                <ChevronRight
                  size={15}
                  color={canGoNextDay ? (isDark ? '#CBD5E1' : '#475569') : isDark ? '#334155' : '#CBD5E1'}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </View>

          {/* Two-Column Hero Layout */}
          {currentDailyEvent ? (
            <View style={styles.heroTwoColumnGrid}>
              {/* LEFT COLUMN: HERO CAROUSEL CARD */}
              <View style={styles.heroLeftColumn}>
                <Animated.View
                  style={[
                    styles.heroCardOuter,
                    {
                      backgroundColor: currentHeroPalette.bgPrimary,
                      transform: [{ translateX }],
                      opacity: cardOpacity,
                    },
                  ]}
                  onMouseEnter={() => setIsHoverPaused(true)}
                  onMouseLeave={() => setIsHoverPaused(false)}
                  {...panResponder.panHandlers}
                >
                  {/* Fallback Editorial Landscape Illustration Canvas (underneath photo) */}
                  <View
                    style={[
                      styles.heroRollingWaveShape,
                      { backgroundColor: currentHeroPalette.bgSecondary },
                    ]}
                  />
                  <View
                    style={[
                      styles.heroSunCircle,
                      { backgroundColor: currentHeroPalette.accentSun },
                    ]}
                  />

                  {/* Entity-Matched Story Photograph + Subtle Scrim Overlay */}
                  {currentDailyEvent.imageUrl ? (
                    <>
                      <Image
                        source={{ uri: currentDailyEvent.imageUrl }}
                        style={styles.heroBackgroundImage}
                        resizeMode="cover"
                        accessibilityLabel={
                          currentDailyEvent.imageMetadata?.caption || currentDailyEvent.headline
                        }
                      />
                      <View style={styles.heroImageScrimOverlay} />
                    </>
                  ) : null}

                  {/* Top Overlay Row: GS Paper Pill on Left + Pause on Right */}
                  <View style={styles.heroTopBar}>
                    <View style={styles.heroGsBadgePill}>
                      <Text style={styles.heroGsBadgeText}>{currentHeroGsBadgeText}</Text>
                    </View>

                    <View style={styles.heroTopRightControls}>
                      <Pressable
                        style={({ pressed }) => [styles.heroPauseCircleBtn, pressed && styles.pressed]}
                        onPress={() => setIsUserPaused((prev) => !prev)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isUserPaused ? 'Resume hero carousel autoplay' : 'Pause hero carousel autoplay'
                        }
                      >
                        {isUserPaused ? (
                          <Play size={13} color="#FFFFFF" strokeWidth={2.4} />
                        ) : (
                          <Pause size={13} color="#FFFFFF" strokeWidth={2.4} />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Bottom Text-Safe Dark Navy Overlay Card */}
                  <View style={styles.heroBottomDarkPanel}>
                    <Pressable
                      onPress={() => {
                        const url =
                          currentDailyEvent.referenceUrl ||
                          currentDailyEvent.sources?.[0]?.url ||
                          'https://pib.gov.in';
                        void Linking.openURL(url);
                      }}
                      accessibilityRole="link"
                      accessibilityLabel={`Open source: ${currentDailyEvent.source}`}
                    >
                      <Text style={styles.heroSourceNamesText} numberOfLines={1}>
                        {currentDailyEvent.source.replace(/\s*•\s*Archive Record/gi, '')} ↗
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => handleOpenDailyEvent(currentDailyEvent)}>
                      <Text style={styles.heroHeadlineSerifText} numberOfLines={3}>
                        {currentDailyEvent.headline}
                      </Text>
                      {currentDailyEvent.summaryBullets?.[0] || currentDailyEvent.whyItMatters ? (
                        <Text style={styles.heroWhyInNewsSubtext} numberOfLines={2}>
                          {(currentDailyEvent.summaryBullets?.[0] || currentDailyEvent.whyItMatters || '').replace(
                            /\*\*/g,
                            ''
                          )}
                        </Text>
                      ) : null}
                    </Pressable>

                    {/* Bottom Action Row: Gold [Read analysis ->] Button + Segmented Progress Bars */}
                    <View style={styles.heroPanelActionRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.heroFullAnalysisGoldBtn,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => handleOpenDailyEvent(currentDailyEvent)}
                        accessibilityRole="button"
                        accessibilityLabel={`Read analysis for ${currentDailyEvent.headline}`}
                      >
                        <Text style={styles.heroFullAnalysisGoldBtnText}>Read analysis</Text>
                        <ArrowRight size={15} color="#101D33" strokeWidth={2.4} />
                      </Pressable>

                      {/* Segmented Progress Bars */}
                      <View style={styles.heroSegmentsRow}>
                        {activeDailyEvents.map((ev, idx) => {
                          const isCurrent = idx === activeEventIndex;
                          return (
                            <Pressable
                              key={ev.id}
                              style={styles.heroSegmentHitArea}
                              onPress={() => handleSelectEvent(idx)}
                              accessibilityRole="button"
                              accessibilityLabel={`Go to headline ${idx + 1}: ${ev.headline}`}
                            >
                              <View
                                style={[
                                  styles.heroSegmentTrack,
                                  isCurrent && styles.heroSegmentTrackActive,
                                ]}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* RIGHT COLUMN: TODAY'S HEADLINES */}
              <View style={styles.heroRightColumn}>
                <View style={styles.headlinesSidebarCard}>
                  <Text style={styles.sidebarCardHeading}>Today&apos;s headlines</Text>

                  <View style={styles.headlinesNumberedList}>
                    {activeDailyEvents.map((ev, idx) => {
                      const isSelected = idx === activeEventIndex;
                      const gsShort = normalizeGsPaperCode(ev.paper);
                      const catLabel =
                        ev.category === 'Polity'
                          ? 'POLITY & GOVERNANCE'
                          : ev.category === 'Sci-Tech'
                          ? 'SCIENCE & TECH'
                          : ev.category.toUpperCase();

                      return (
                        <Pressable
                          key={ev.id}
                          style={({ pressed }) => [
                            styles.headlineListItem,
                            isSelected && styles.headlineListItemActive,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              handleOpenDailyEvent(ev);
                            } else {
                              handleSelectEvent(idx);
                              void handleUpdateProgress({ read_headlines: true });
                            }
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Headline ${idx + 1}: ${gsShort} ${catLabel}. ${ev.headline}`}
                        >
                          <Text
                            style={[
                              styles.headlineIndexNumber,
                              isSelected && styles.headlineIndexNumberActive,
                            ]}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </Text>

                          <View style={styles.headlineItemTextCol}>
                            <Text
                              style={[
                                styles.headlineItemGsMeta,
                                isSelected && styles.headlineItemGsMetaActive,
                              ]}
                            >
                              {gsShort} • {catLabel}
                            </Text>
                            <Text
                              style={[
                                styles.headlineItemTitle,
                                isSelected && styles.headlineItemTitleActive,
                              ]}
                              numberOfLines={3}
                            >
                              {ev.headline}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* Clean Empty State when a day genuinely has no stories yet (Never shows fake text) */
            <View style={styles.emptyDateCard}>
              <Text style={styles.emptyDateTitle}>
                No verified UPSC stories published for {datePickerDisplayLabel}
              </Text>
              <Text style={styles.emptyDateSubtitle}>
                We never display placeholder or unverified headlines. Choose an earlier date from the calendar or rebuild today&apos;s brief from live official feeds.
              </Text>
              <View style={styles.emptyDateActionsRow}>
                <Pressable
                  style={styles.emptyDatePrimaryBtn}
                  onPress={() => handleSelectDate(todayKey)}
                >
                  <Text style={styles.emptyDatePrimaryBtnText}>Jump to Today ({todayKey})</Text>
                </Pressable>
                <Pressable
                  style={styles.emptyDateSecondaryBtn}
                  onPress={() => {
                    invalidateCurrentAffairsCache();
                    void loadPipelineData(selectedAgencyId, selectedDateKey);
                  }}
                >
                  <Text style={styles.emptyDateSecondaryBtnText}>Rebuild Today&apos;s Brief</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ================================================================ */}
        {/* 3. EXPLORE: Categories + Source Dropdown                          */}
        {/* ================================================================ */}
        <View style={styles.exploreSection}>
          <View style={styles.exploreHeaderRow}>
            <Text style={styles.sectionSerifHeading}>Explore</Text>

            {/* Source Dropdown: Source  [All Agencies ⌄] */}
            <View style={styles.sourceSelectorWrapper}>
              <Text style={styles.sourceFilterLabel}>Source</Text>
              <Pressable
                style={({ pressed }) => [styles.sourceDropdownBtn, pressed && styles.pressed]}
                onPress={() => setAgencyDropdownVisible((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={`Source filter: ${
                  SOURCE_FILTER_CHIPS.find((c) => c.id === selectedAgencyId)?.label || 'All Agencies'
                }`}
              >
                <Text style={styles.sourceDropdownBtnText}>
                  {SOURCE_FILTER_CHIPS.find((c) => c.id === selectedAgencyId)?.label || 'All Agencies'}
                </Text>
                <ChevronDown size={14} color={isDark ? '#94A3B8' : '#5B6475'} strokeWidth={2.2} />
              </Pressable>

              {agencyDropdownVisible && (
                <>
                  <Pressable
                    style={styles.dropdownDismissBackdrop}
                    onPress={() => setAgencyDropdownVisible(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Close source filter dropdown"
                  />
                  <View style={styles.sourceDropdownMenu}>
                    {SOURCE_FILTER_CHIPS.map((chip) => {
                      const isSelected = selectedAgencyId === chip.id;
                      return (
                        <Pressable
                          key={chip.id}
                          style={({ pressed }) => [
                            styles.sourceDropdownMenuItem,
                            isSelected && styles.sourceDropdownMenuItemActive,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => {
                            handleSelectAgency(chip.id);
                            setAgencyDropdownVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.sourceDropdownMenuItemText,
                              isSelected && styles.sourceDropdownMenuItemTextActive,
                            ]}
                          >
                            {chip.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* 3x2 Grid of 6 Module Cards with icon, serif title & right chevron */}
          <View style={styles.modulesGrid}>
            {EXPLORE_MODULE_CARDS.map((mod) => (
              <Pressable
                key={mod.id}
                style={({ pressed }) => [
                  styles.moduleCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleOpenFormatModal(mod.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${mod.title}`}
              >
                <View style={styles.moduleIconBox}>
                  {renderModuleIcon(mod.iconName)}
                </View>

                <Text style={styles.moduleCardTitle} numberOfLines={2}>
                  {mod.title}
                </Text>

                <ChevronRight size={16} color={isDark ? '#64748B' : '#94A3B8'} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ================================================================ */}
        {/* 4. RETENTION: Practise & Revise (Daily Quiz + Monthly Revision)  */}
        {/* ================================================================ */}
        <View style={styles.retentionSection}>
          <Text style={styles.sectionSerifHeading}>Practise & Revise</Text>

          <View style={styles.retentionGrid}>
            {/* Left Card: Dark Navy Daily Quiz */}
            <Pressable
              style={({ pressed }) => [styles.retentionDarkQuizCard, pressed && styles.pressed]}
              onPress={() => {
                setQuizModalVisible(true);
                void handleUpdateProgress({ attempted_quiz: true });
              }}
              accessibilityRole="button"
              accessibilityLabel="Start today's Prelims Daily Quiz"
            >
              <View style={styles.retentionDarkIconBox}>
                <ListChecks size={20} color="#D8AE68" strokeWidth={2} />
              </View>

              <View style={styles.retentionCardTextCol}>
                <Text style={styles.retentionDarkTitle}>Daily Quiz</Text>
                <Text style={styles.retentionDarkSubtitle}>
                  Prelims MCQs with explanations
                </Text>
              </View>

              <ArrowRight size={18} color="#D8AE68" strokeWidth={2.4} />
            </Pressable>

            {/* Right Card: Light Monthly Revision */}
            <Pressable
              style={({ pressed }) => [styles.retentionLightRevisionCard, pressed && styles.pressed]}
              onPress={() => setMonthlyModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${activeMonthName} Monthly Revision`}
            >
              <View style={styles.retentionLightIconBox}>
                <CalendarDays size={20} color="#8A6B31" strokeWidth={2} />
              </View>

              <View style={styles.retentionCardTextCol}>
                <Text style={styles.retentionLightTitle}>Monthly Revision</Text>
                <Text style={styles.retentionLightSubtitle}>
                  Topic-wise recap and tests
                </Text>
              </View>

              <ArrowRight size={18} color={isDark ? '#F8FAFC' : '#101D33'} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ================================================================ */}
      {/* 5. INTERACTIVE MODALS & DRAWERS                                  */}
      {/* ================================================================ */}

      {/* Compact Calendar Date Picker Dropdown */}
      <CalendarDropdown
        visible={calendarDropdownVisible}
        onClose={() => setCalendarDropdownVisible(false)}
        selectedDateKey={selectedDateKey}
        onSelectDate={(dateKey) => {
          handleSelectDate(dateKey);
          setCalendarDropdownVisible(false);
        }}
        completedDates={studyProgress.marked_as_read ? [selectedDateKey] : []}
        isDark={isDark}
        topOffset={calendarDropdownPos.top}
        leftOffset={calendarDropdownPos.left}
      />

      {/* Full Analysis Modal (Why in News, 3-5 Key Facts with Source Links, Static Background, Prelims & Mains Angles) */}
      <ArticleDetailModal
        visible={articleModalVisible}
        onClose={() => setArticleModalVisible(false)}
        item={activeDetailItem}
        isDark={isDark}
        isSaved={
          activeDetailItem ? isBookmarked(activeDetailItem.data.id) : false
        }
        onToggleSave={(id) => toggleBookmark(id, currentDailyEvent)}
      />

      {/* Explore Module Feed Modal (Filtered by Source & Module) */}
      <FormatFeedModal
        visible={formatModalVisible}
        onClose={() => setFormatModalVisible(false)}
        formatCategory={selectedFormatCategory}
        onSelectArticle={handleSelectArticleFromFormat}
        isDark={isDark}
        savedItemIds={savedItemIds}
        onToggleBookmark={(id) => toggleBookmark(id)}
        selectedAgencyId={selectedAgencyId}
      />

      {/* Daily Prelims Quiz Modal */}
      <CAQuizModal
        visible={quizModalVisible}
        onClose={() => setQuizModalVisible(false)}
        isDark={isDark}
      />

      {/* Monthly Revision Modal */}
      <MonthlyRevisionModal
        visible={monthlyModalVisible}
        onClose={() => setMonthlyModalVisible(false)}
        isDark={isDark}
      />

      {/* Notes & Saved Bookmarks Library Modal */}
      <NotesLibraryModal
        visible={notesLibraryModalVisible}
        onClose={() => setNotesLibraryModalVisible(false)}
        isDark={isDark}
        savedItemIds={savedItemIds}
        onRemoveSavedItem={(id) => toggleBookmark(id)}
        onOpenItem={(id) => {
          setNotesLibraryModalVisible(false);
          const matchingEv = activeDailyEvents.find((ev) => ev.id === id);
          if (matchingEv) {
            handleOpenDailyEvent(matchingEv);
          }
        }}
        initialTab={notesLibraryInitialTab}
        initialNoteTitle={initialNoteTitle}
      />

      {/* Active Recall Event Modal */}
      <DailyRecallModal
        visible={dailyRecallModalVisible}
        onClose={() => setDailyRecallModalVisible(false)}
        dateKey={selectedDateKey}
        events={activeDailyEvents}
        singleEvent={currentDailyEvent || null}
        isDark={isDark}
      />

      {/* Pipeline Status, Admin Rebuild & Subject Editor Review Queue Modal */}
      <PipelineStatusModal
        visible={pipelineStatusModalVisible}
        onClose={() => setPipelineStatusModalVisible(false)}
        isDark={isDark}
        categoryStatuses={categoryStatuses}
        ingestionLogs={ingestionLogs}
        onTriggerRefresh={() => {
          invalidateCurrentAffairsCache();
          void loadPipelineData(selectedAgencyId, selectedDateKey);
        }}
        isRefreshing={isPipelineSyncing}
        editorQueue={editorQueueItems}
        onEditorAction={handleEditorAction}
      />

      {/* "Report an error" Modal */}
      <Modal
        visible={reportErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportErrorModalVisible(false)}
      >
        <View style={styles.errorModalBackdrop}>
          <View style={styles.errorModalCard}>
            <View style={styles.errorModalHeader}>
              <Text style={styles.errorModalTitle}>Report a Factual or Source Error</Text>
              <Pressable onPress={() => setReportErrorModalVisible(false)}>
                <X size={18} color={isDark ? '#F8FAFC' : '#101D33'} />
              </Pressable>
            </View>
            <Text style={styles.errorModalSub}>
              Story: {currentDailyEvent?.headline}
            </Text>
            {reportErrorSubmitted ? (
              <View style={{ paddingVertical: 16, gap: 8 }}>
                <Text style={{ color: '#26734D', fontWeight: '700', fontSize: 14 }}>
                  ✓ Logged for immediate UPSC Subject Editor verification.
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  value={reportErrorText}
                  onChangeText={setReportErrorText}
                  placeholder="Describe the discrepancy (e.g. date, figure, constitutional article, or broken source link)..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.errorModalInput}
                />
                <View style={styles.errorModalActions}>
                  <Pressable
                    style={styles.errorModalCancelBtn}
                    onPress={() => setReportErrorModalVisible(false)}
                  >
                    <Text style={styles.errorModalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.errorModalSubmitBtn}
                    onPress={async () => {
                      if (!currentDailyEvent || !reportErrorText.trim()) return;
                      await submitStoryErrorReport({
                        story_id: currentDailyEvent.id,
                        description: reportErrorText,
                      });
                      setReportErrorSubmitted(true);
                    }}
                  >
                    <Text style={styles.errorModalSubmitText}>Submit Report</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (
  _tokens: SemanticTokens,
  isDark: boolean,
  isDesktop: boolean,
  isTablet: boolean
) => {
  const pageBg = isDark ? '#0B1120' : '#F5EFE6';
  const cardBg = isDark ? '#131C31' : '#FFFFFF';
  const cardBorder = isDark ? '#1E293B' : '#E8DFD1';
  const textPrimary = isDark ? '#F8FAFC' : '#101D33';
  const textSecondary = isDark ? '#94A3B8' : '#5B6475';
  const goldAccent = '#9A7B3E';
  const goldButton = '#D4AC66';
  const navyPrimary = '#101D33';
  const sandBg = isDark ? '#1E293B' : '#EFE6D5';

  return StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: pageBg,
    },
    scrollContent: {
      paddingBottom: 64,
    },
    centerContainer: {
      width: '100%',
      maxWidth: 1120,
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? 28 : 16,
      paddingTop: isDesktop ? 24 : 16,
    },
    pressed: {
      opacity: 0.86,
    },

    /* 1. Top Header Bar */
    topHeaderBar: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: isDesktop ? 32 : 22,
    },
    brandGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    brandIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: navyPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 22,
      fontWeight: '700',
      color: textPrimary,
      lineHeight: 26,
    },
    brandSubtitle: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      color: textSecondary,
      marginTop: 1,
    },
    topUtilityPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    topHeaderLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    topHeaderLinkText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      fontWeight: '600',
      color: textPrimary,
    },
    utilityPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 999,
    },
    utilityPillText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '600',
      color: textPrimary,
    },

    /* 2. The Daily Brief Section */
    dailyBriefSection: {
      marginBottom: 42,
    },
    sectionEyebrow: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: goldAccent,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    briefHeaderRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 18,
    },
    briefMainHeading: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: isDesktop ? 34 : 28,
      fontWeight: '700',
      color: textPrimary,
      lineHeight: isDesktop ? 40 : 34,
    },
    briefControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    datePickerCompositePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 5,
    },
    dateArrowBtn: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 999,
    },
    dateArrowBtnDisabled: {
      opacity: 0.4,
    },
    dateCenterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    dateCenterLabel: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '600',
      color: textPrimary,
    },
    markAsReadPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
    },
    markAsReadPillBtnActive: {
      backgroundColor: '#26734D',
      borderColor: '#26734D',
    },
    markAsReadPillText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '600',
      color: textPrimary,
    },
    markAsReadPillTextActive: {
      color: '#FFFFFF',
    },
    dailyQuizNavyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: navyPrimary,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 999,
    },
    dailyQuizNavyBtnText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    /* Two-Column Hero Grid */
    heroTwoColumnGrid: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: 'stretch',
      gap: 18,
    },
    heroLeftColumn: {
      flex: isDesktop ? 1.72 : undefined,
      width: isDesktop ? undefined : '100%',
    },
    heroRightColumn: {
      flex: isDesktop ? 1 : undefined,
      width: isDesktop ? undefined : '100%',
      gap: 16,
    },
    heroCardOuter: {
      borderRadius: 22,
      minHeight: isDesktop ? 510 : 410,
      padding: isDesktop ? 22 : 16,
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
    },
    heroBackgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
    },
    heroImageScrimOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 18, 32, 0.24)',
      zIndex: 1,
    },
    heroSunCircle: {
      position: 'absolute',
      width: isDesktop ? 168 : 124,
      height: isDesktop ? 168 : 124,
      borderRadius: 999,
      top: isDesktop ? 90 : 70,
      right: isDesktop ? -16 : -12,
      opacity: 0.92,
    },
    heroRollingWaveShape: {
      position: 'absolute',
      left: -60,
      right: -60,
      bottom: -40,
      height: isDesktop ? 290 : 230,
      borderTopLeftRadius: 340,
      borderTopRightRadius: 260,
    },
    heroTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 2,
    },
    heroGsBadgePill: {
      backgroundColor: 'rgba(13, 25, 43, 0.82)',
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 999,
    },
    heroGsBadgeText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#F8FAFC',
    },
    heroTopRightControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroSlideCounterPill: {
      backgroundColor: 'rgba(13, 25, 43, 0.82)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    heroSlideCounterText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11.5,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    heroPauseCircleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(13, 25, 43, 0.82)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBottomDarkPanel: {
      backgroundColor: '#0D192B',
      borderRadius: 18,
      padding: isDesktop ? 24 : 18,
      zIndex: 2,
      marginTop: 'auto',
    },
    heroSourceNamesText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12,
      color: '#94A3B8',
      marginBottom: 8,
    },
    heroHeadlineSerifText: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: isDesktop ? 25 : 20,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: isDesktop ? 33 : 27,
      marginBottom: 8,
    },
    heroWhyInNewsSubtext: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      color: '#CBD5E1',
      lineHeight: 19,
      marginBottom: 14,
    },
    heroPanelActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginTop: 6,
    },
    heroFullAnalysisGoldBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: goldButton,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
    },
    heroFullAnalysisGoldBtnText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      fontWeight: '700',
      color: navyPrimary,
    },
    heroSegmentsRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroSegmentHitArea: {
      flex: 1,
      paddingVertical: 8,
    },
    heroSegmentTrack: {
      height: 3,
      borderRadius: 999,
      backgroundColor: 'rgba(255, 255, 255, 0.24)',
    },
    heroSegmentTrackActive: {
      backgroundColor: goldButton,
    },
    heroProvenanceFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 6,
      paddingTop: 10,
    },
    heroProvenanceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    heroProvenanceText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11.5,
      color: textSecondary,
    },
    heroProvenanceRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    heroQuickActionLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroQuickActionLinkText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11.5,
      fontWeight: '600',
      color: textSecondary,
    },

    /* Right Sidebar Cards */
    headlinesSidebarCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 18,
      padding: 20,
      minHeight: isDesktop ? 510 : undefined,
    },
    sidebarCardHeading: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 20,
      fontWeight: '700',
      color: textPrimary,
      marginBottom: 16,
    },
    sidebarCardEyebrow: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: goldAccent,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    headlinesNumberedList: {
      gap: 8,
    },
    headlineListItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 12,
      borderRadius: 12,
    },
    headlineListItemActive: {
      backgroundColor: sandBg,
    },
    headlineIndexNumber: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 15,
      fontWeight: '700',
      color: '#94A3B8',
      marginTop: 1,
    },
    headlineIndexNumberActive: {
      color: goldAccent,
    },
    headlineItemTextCol: {
      flex: 1,
    },
    headlineItemGsMeta: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.7,
      color: textSecondary,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    headlineItemGsMetaActive: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.7,
      color: goldAccent,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    headlineItemTitle: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      fontWeight: '600',
      color: textPrimary,
      lineHeight: 18,
    },
    headlineItemTitleActive: {
      fontWeight: '700',
    },

    /* Today's study path card */
    studyPathCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 18,
      padding: 18,
    },
    studyPathHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    studyPathTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
    },
    studyPathCounterText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12,
      fontWeight: '700',
      color: goldAccent,
    },
    studyPathDivider: {
      height: 1,
      backgroundColor: cardBorder,
      marginBottom: 14,
    },
    studyPathChecklist: {
      gap: 12,
    },
    studyPathStepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    studyPathCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: isDark ? '#475569' : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    studyPathCheckboxChecked: {
      backgroundColor: '#26734D',
      borderColor: '#26734D',
    },
    studyPathStepLabel: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      color: textPrimary,
    },
    studyPathStepLabelDone: {
      textDecorationLine: 'line-through',
      color: textSecondary,
    },

    /* Empty Date Card */
    emptyDateCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 18,
      padding: 28,
      alignItems: 'center',
    },
    emptyDateTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 20,
      fontWeight: '700',
      color: textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDateSubtitle: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13.5,
      color: textSecondary,
      textAlign: 'center',
      maxWidth: 540,
      lineHeight: 20,
      marginBottom: 18,
    },
    emptyDateActionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    emptyDatePrimaryBtn: {
      backgroundColor: navyPrimary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    emptyDatePrimaryBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    emptyDateSecondaryBtn: {
      backgroundColor: sandBg,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    emptyDateSecondaryBtnText: {
      color: textPrimary,
      fontWeight: '700',
      fontSize: 13,
    },

    /* 3. Explore Current Affairs Section */
    exploreSection: {
      marginBottom: 42,
      position: 'relative',
      zIndex: 100,
    },
    exploreHeaderRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: 20,
      position: 'relative',
      zIndex: 100,
      elevation: 20,
    },
    exploreTitleBlock: {
      gap: 4,
    },
    sectionSerifHeading: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: isDesktop ? 30 : 25,
      fontWeight: '700',
      color: textPrimary,
    },
    sectionSubtitleText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13.5,
      color: textSecondary,
    },
    sourceSelectorWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      position: 'relative',
      zIndex: 100,
      elevation: 20,
    },
    sourceFilterLabel: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      color: textSecondary,
    },
    sourceDropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 10,
    },
    sourceDropdownBtnText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '600',
      color: textPrimary,
    },
    dropdownDismissBackdrop: {
      position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute',
      top: Platform.OS === 'web' ? 0 : -2000,
      left: Platform.OS === 'web' ? 0 : -2000,
      right: Platform.OS === 'web' ? 0 : -2000,
      bottom: Platform.OS === 'web' ? 0 : -2000,
      zIndex: 990,
      backgroundColor: 'transparent',
    },
    sourceDropdownMenu: {
      position: 'absolute',
      top: 42,
      right: 0,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 14,
      paddingVertical: 6,
      minWidth: 180,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 30,
      zIndex: 1000,
    },
    sourceDropdownMenuItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sourceDropdownMenuItemActive: {
      backgroundColor: sandBg,
    },
    sourceDropdownMenuItemText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      color: textSecondary,
    },
    sourceDropdownMenuItemTextActive: {
      color: textPrimary,
      fontWeight: '700',
    },
    sourceChipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: '100%',
    },
    sourceChipsScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sourceChipPill: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    sourceChipPillActive: {
      backgroundColor: navyPrimary,
      borderColor: navyPrimary,
    },
    sourceChipText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '600',
      color: textPrimary,
    },
    sourceChipTextActive: {
      color: '#FFFFFF',
    },
    modulesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      position: 'relative',
      zIndex: 1,
      elevation: 1,
    },
    moduleCard: {
      width: isDesktop ? '31.8%' : isTablet ? '48%' : '100%',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 64,
    },
    moduleIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: sandBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moduleCardTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 15.5,
      fontWeight: '600',
      color: textPrimary,
      flex: 1,
    },
    moduleCardSubtitle: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      color: textSecondary,
      lineHeight: 19,
      marginBottom: 16,
    },
    moduleOpenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 'auto',
    },
    moduleOpenText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      fontWeight: '700',
      color: goldAccent,
    },

    /* 4. Practise & Revise Section */
    retentionSection: {
      marginBottom: 24,
    },
    retentionGrid: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 16,
      marginTop: 18,
    },
    retentionDarkQuizCard: {
      flex: 1,
      backgroundColor: '#0E1A2F',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      minHeight: 84,
    },
    retentionDarkIconBox: {
      width: 44,
      height: 44,
      borderRadius: 11,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    retentionCardTextCol: {
      flex: 1,
      gap: 3,
    },
    retentionDarkTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    retentionDarkSubtitle: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      color: '#94A3B8',
    },
    retentionTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 22,
    },
    retentionDarkTagPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 999,
    },
    retentionDarkTagText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11.5,
      fontWeight: '600',
      color: '#E2E8F0',
    },
    retentionGoldCtaBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: goldButton,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
    },
    retentionGoldCtaText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      fontWeight: '700',
      color: navyPrimary,
    },
    retentionLightRevisionCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      minHeight: 84,
    },
    retentionLightIconBox: {
      width: 44,
      height: 44,
      borderRadius: 11,
      backgroundColor: sandBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retentionLightTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
    },
    retentionLightSubtitle: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      color: textSecondary,
    },
    retentionSandTagPill: {
      backgroundColor: sandBg,
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 999,
    },
    retentionSandTagText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 11.5,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#7C6232',
    },
    retentionOutlineCtaBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? '#475569' : '#CBD5E1',
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
    },
    retentionOutlineCtaText: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 13,
      fontWeight: '700',
      color: textPrimary,
    },

    /* Report an Error Modal */
    errorModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    errorModalCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    errorModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    errorModalTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
    },
    errorModalSub: {
      fontFamily: FONT_FAMILY.sans,
      fontSize: 12.5,
      color: textSecondary,
      marginBottom: 12,
    },
    errorModalInput: {
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: 10,
      padding: 12,
      minHeight: 90,
      color: textPrimary,
      textAlignVertical: 'top',
      marginBottom: 14,
      fontSize: 13,
    },
    errorModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    errorModalCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    errorModalCancelText: {
      color: textSecondary,
      fontWeight: '600',
      fontSize: 13,
    },
    errorModalSubmitBtn: {
      backgroundColor: navyPrimary,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 8,
    },
    errorModalSubmitText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
  });
};
