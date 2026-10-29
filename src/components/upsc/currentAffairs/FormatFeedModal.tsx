import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import {
  X,
  ChevronRight,
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
  ShieldCheck,
} from 'lucide-react-native';
import { FormatCategory, CuratedArticle, NEWS_AGENCIES } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';
import { fetchLiveDailyNewsArticles } from '@/services/newsFeedService';

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

  const [userAgencyFilter, setUserAgencyFilter] = useState<string | null>(null);
  const activeAgencyFilter = userAgencyFilter ?? (selectedAgencyId || 'all');
  const [liveArticles, setLiveArticles] = useState<CuratedArticle[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh button handler
  const handleManualRefresh = useCallback(async () => {
    if (!formatCategory || formatCategory.id !== 'daily-news') return;
    setIsRefreshing(true);
    try {
      const items = await fetchLiveDailyNewsArticles('all');
      if (items && items.length > 0) {
        setLiveArticles(items);
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  }, [formatCategory]);

  // Initial fetch on modal open without synchronous setState in effect
  useEffect(() => {
    if (!visible || formatCategory?.id !== 'daily-news') return;

    let isMounted = true;
    void fetchLiveDailyNewsArticles('all').then((items) => {
      if (isMounted && items && items.length > 0) {
        setLiveArticles(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [visible, formatCategory]);

  // Combined articles list: live articles prepended to base articles
  const allArticles = useMemo(() => {
    if (!formatCategory) return [];
    if (formatCategory.id !== 'daily-news' || liveArticles.length === 0) {
      return formatCategory.articles;
    }

    // Merge and de-duplicate by title prefix
    const seen = new Set<string>();
    const merged: CuratedArticle[] = [];

    for (const art of [...liveArticles, ...formatCategory.articles]) {
      const key = art.title.toLowerCase().slice(0, 32);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(art);
      }
    }
    return merged;
  }, [formatCategory, liveArticles]);

  // Filtered articles according to activeAgencyFilter
  const filteredArticles = useMemo(() => {
    if (!allArticles.length) return [];
    if (activeAgencyFilter === 'all') return allArticles;

    const agency = NEWS_AGENCIES.find((a) => a.id === activeAgencyFilter);
    if (!agency?.matchKeyword) return allArticles;

    const kw = agency.matchKeyword.toLowerCase();
    const matched = allArticles.filter((item) =>
      item.source.toLowerCase().includes(kw)
    );
    return matched.length > 0 ? matched : allArticles;
  }, [allArticles, activeAgencyFilter]);

  if (!visible || !formatCategory) return null;

  const renderIcon = () => {
    const iconProps = { size: 20, color: theme.textPrimary, strokeWidth: 1.8 };
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

  const heroArticle = filteredArticles[0];
  const listArticles = filteredArticles.slice(1);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* 1. Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconCircle}>
              {renderIcon()}
            </View>
            <View style={styles.headerTextGroup}>
              <View style={styles.headerTitleLine}>
                <Text style={styles.headerTitle}>{formatCategory.title}</Text>
                <View style={styles.liveVerifiedBadge}>
                  <ShieldCheck size={11} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2.5} />
                  <Text style={styles.liveVerifiedText}>Verified Agencies</Text>
                </View>
              </View>
              <Text style={styles.headerSub} numberOfLines={1}>
                {formatCategory.subtitle}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            {formatCategory.id === 'daily-news' && (
              <Pressable
                style={({ pressed }) => [
                  styles.refreshBtn,
                  isRefreshing && styles.refreshBtnSpinning,
                  pressed && styles.pressed,
                ]}
                onPress={handleManualRefresh}
                hitSlop={6}
                accessibilityLabel="Refresh authentic feeds"
              >
                <RotateCw size={15} color={theme.textPrimary} strokeWidth={2} />
              </Pressable>
            )}

            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={6} accessibilityLabel="Close modal">
              <X size={17} color={theme.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        {/* 2. Agency Filter Bar (Figma Prototyping Kit Design) */}
        <View style={styles.agencyFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agencyPillScroll}
          >
            {NEWS_AGENCIES.map((agency) => {
              const isSelected = activeAgencyFilter === agency.id;
              // Count articles for this agency
              const count =
                agency.id === 'all'
                  ? allArticles.length
                  : allArticles.filter((a) =>
                      a.source.toLowerCase().includes((agency.matchKeyword || '').toLowerCase())
                    ).length;

              return (
                <Pressable
                  key={agency.id}
                  style={({ pressed }) => [
                    styles.agencyChip,
                    isSelected && styles.agencyChipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setUserAgencyFilter(agency.id)}
                >
                  <Text
                    style={[
                      styles.agencyChipText,
                      isSelected && styles.agencyChipTextActive,
                    ]}
                  >
                    {agency.shortName}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.agencyCountBadge,
                        isSelected && styles.agencyCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.agencyCountText,
                          isSelected && styles.agencyCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Articles Feed */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* A. Featured Hero Article (Top Breaking News from Authentic Agency) */}
          {heroArticle && (
            <Pressable
              style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
              onPress={() => onSelectArticle(heroArticle)}
            >
              {heroArticle.imageUrl ? (
                <View style={styles.heroImageWrapper}>
                  <Image
                    source={{ uri: heroArticle.imageUrl }}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={180}
                    priority="high"
                  />
                  <View style={styles.heroOverlayBadgeRow}>
                    <View style={styles.heroAgencyTag}>
                      <View style={styles.agencyDot} />
                      <Text style={styles.heroAgencyText} numberOfLines={1}>
                        {heroArticle.source}
                      </Text>
                    </View>
                    <View style={styles.heroPaperTag}>
                      <Text style={styles.heroPaperText}>{heroArticle.paper}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <View style={styles.heroBody}>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroCategory}>{heroArticle.category}</Text>
                  <Text style={styles.heroDate}>{heroArticle.date}</Text>
                </View>

                <Text style={styles.heroTitle}>{heroArticle.title}</Text>

                <Text style={styles.heroSummary} numberOfLines={3}>
                  {heroArticle.summary}
                </Text>

                <View style={styles.heroFooter}>
                  <View style={styles.heroTakeawaysPill}>
                    <Text style={styles.heroTakeawaysText}>
                      {heroArticle.keyPoints.length} UPSC Takeaways
                    </Text>
                  </View>

                  <View style={styles.heroActionGroup}>
                    <Pressable
                      style={styles.iconActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(heroArticle.id);
                      }}
                      hitSlop={6}
                    >
                      <Bookmark
                        size={16}
                        color={
                          savedItemIds.includes(heroArticle.id)
                            ? (isDark ? '#FFFFFF' : '#0F172A')
                            : theme.textMuted
                        }
                        fill={
                          savedItemIds.includes(heroArticle.id)
                            ? (isDark ? '#FFFFFF' : '#0F172A')
                            : 'none'
                        }
                        strokeWidth={2}
                      />
                    </Pressable>

                    <View style={styles.readAnalysisBtn}>
                      <Text style={styles.readAnalysisText}>Read Analysis</Text>
                      <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          )}

          {/* Section Divider */}
          {listArticles.length > 0 && (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderText}>Earlier Today & Regional Despatches</Text>
              <Text style={styles.sectionHeaderCount}>{listArticles.length} Stories</Text>
            </View>
          )}

          {/* B. List Articles with Authentic Agency Thumbnails */}
          {listArticles.map((item) => {
            const bookmarked = savedItemIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.listArticleCard, pressed && styles.pressed]}
                onPress={() => onSelectArticle(item)}
              >
                <View style={styles.listCardContentRow}>
                  <View style={styles.listTextCol}>
                    <View style={styles.listMetaRow}>
                      <View style={styles.sourceAttributionPill}>
                        <Text style={styles.sourceAttributionText} numberOfLines={1}>
                          {item.source}
                        </Text>
                      </View>
                      <Text style={styles.listPaperBadge}>{item.paper}</Text>
                    </View>

                    <Text style={styles.listArticleTitle} numberOfLines={3}>
                      {item.title}
                    </Text>

                    <Text style={styles.listCategoryTag}>#{item.category}</Text>

                    <View style={styles.listFooterRow}>
                      <Text style={styles.listTakeawaysText}>
                        {item.keyPoints.length} Key Points
                      </Text>
                      <View style={styles.readMoreInline}>
                        <Text style={styles.readMoreInlineText}>Read</Text>
                        <ChevronRight size={13} color={theme.textPrimary} strokeWidth={2.2} />
                      </View>
                    </View>
                  </View>

                  {item.imageUrl ? (
                    <View style={styles.listThumbnailWrapper}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.listThumbnail}
                        contentFit="cover"
                        transition={150}
                      />
                      <Pressable
                        style={styles.thumbnailBookmarkBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(item.id);
                        }}
                        hitSlop={6}
                      >
                        <Bookmark
                          size={13}
                          color={bookmarked ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)'}
                          fill={bookmarked ? '#FFFFFF' : 'none'}
                          strokeWidth={2}
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.standaloneBookmarkBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item.id);
                      }}
                      hitSlop={6}
                    >
                      <Bookmark
                        size={16}
                        color={bookmarked ? (isDark ? '#FFFFFF' : '#0F172A') : theme.textMuted}
                        fill={bookmarked ? (isDark ? '#FFFFFF' : '#0F172A') : 'none'}
                        strokeWidth={2}
                      />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
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
      backgroundColor: isDark ? '#121417' : '#F8FAFC',
    },

    /* 1. Top Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#262930' : '#E2E8F0',
      backgroundColor: isDark ? '#17191D' : '#FFFFFF',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      marginRight: 12,
    },
    headerIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? '#262930' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerTextGroup: {
      flex: 1,
    },
    headerTitleLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    headerTitle: {
      fontSize: 16.5,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    liveVerifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(5, 150, 105, 0.1)',
    },
    liveVerifiedText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#059669',
      letterSpacing: 0.1,
    },
    headerSub: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    refreshBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: isDark ? '#262930' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#353942' : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    refreshBtnSpinning: {
      opacity: 0.6,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: isDark ? '#262930' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#353942' : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* 2. Agency Filter Bar */
    agencyFilterContainer: {
      backgroundColor: isDark ? '#17191D' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#262930' : '#E2E8F0',
      paddingVertical: 8,
    },
    agencyPillScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: isDesktop ? 24 : 16,
    },
    agencyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? '#202227' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#2E323A' : '#E2E8F0',
    },
    agencyChipActive: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      borderColor: isDark ? '#FFFFFF' : '#0F172A',
    },
    agencyChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    agencyChipTextActive: {
      color: isDark ? '#000000' : '#FFFFFF',
    },
    agencyCountBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: isDark ? '#2E323A' : '#E2E8F0',
    },
    agencyCountBadgeActive: {
      backgroundColor: isDark ? '#E2E8F0' : '#334155',
    },
    agencyCountText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textMuted,
    },
    agencyCountTextActive: {
      color: isDark ? '#0F172A' : '#FFFFFF',
    },

    /* 3. Feed List */
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 16,
      paddingBottom: 64,
      maxWidth: 960,
      width: '100%',
      alignSelf: 'center',
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.995 }],
    },

    /* Hero Featured Article Card */
    heroCard: {
      backgroundColor: isDark ? '#17191D' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#262930' : '#E2E8F0',
      overflow: 'hidden',
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 8,
    },
    heroImageWrapper: {
      width: '100%',
      height: isDesktop ? 230 : 185,
      position: 'relative',
      backgroundColor: isDark ? '#121417' : '#EDF2F7',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlayBadgeRow: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroAgencyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      maxWidth: '70%',
    },
    agencyDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#38BDF8',
    },
    heroAgencyText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.1,
    },
    heroPaperTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(0, 111, 253, 0.92)',
    },
    heroPaperText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    heroBody: {
      padding: 16,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    heroCategory: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDark ? '#60A5FA' : '#2563EB',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroDate: {
      fontSize: 12,
      color: theme.textMuted,
    },
    heroTitle: {
      fontSize: 17.5,
      fontWeight: '700',
      lineHeight: 24,
      color: theme.textPrimary,
      letterSpacing: -0.25,
      marginBottom: 8,
    },
    heroSummary: {
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.textSecondary,
      marginBottom: 14,
    },
    heroFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#262930' : '#F1F5F9',
    },
    heroTakeawaysPill: {
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 5,
      backgroundColor: isDark ? '#202227' : '#F1F5F9',
    },
    heroTakeawaysText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
    },
    heroActionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconActionBtn: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: isDark ? '#202227' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    readAnalysisBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 7,
      backgroundColor: theme.buttonPrimaryBg,
    },
    readAnalysisText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    /* Section Subheading */
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    sectionHeaderText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
      letterSpacing: -0.1,
    },
    sectionHeaderCount: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textMuted,
    },

    /* Standard List News Cards */
    listArticleCard: {
      backgroundColor: isDark ? '#17191D' : '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#262930' : '#E2E8F0',
      marginBottom: 10,
    },
    listCardContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    listTextCol: {
      flex: 1,
      justifyContent: 'center',
    },
    listMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 5,
    },
    sourceAttributionPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? '#202227' : '#F1F5F9',
      maxWidth: '75%',
    },
    sourceAttributionText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textMuted,
    },
    listPaperBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#60A5FA' : '#2563EB',
    },
    listArticleTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      lineHeight: 20,
      color: theme.textPrimary,
      letterSpacing: -0.15,
      marginBottom: 4,
    },
    listCategoryTag: {
      fontSize: 11,
      fontWeight: '500',
      color: isDark ? '#94A3B8' : '#64748B',
      marginBottom: 6,
    },
    listFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    listTakeawaysText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    readMoreInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    readMoreInlineText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    listThumbnailWrapper: {
      width: 86,
      height: 86,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: isDark ? '#202227' : '#E2E8F0',
      flexShrink: 0,
    },
    listThumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbnailBookmarkBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    standaloneBookmarkBtn: {
      padding: 6,
      alignSelf: 'center',
    },
  });
