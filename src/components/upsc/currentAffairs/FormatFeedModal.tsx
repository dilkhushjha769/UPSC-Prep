import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
} from '@/components/common/LucideIcons';
import { FormatCategory, CuratedArticle, NEWS_AGENCIES } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';

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
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const filteredArticles = useMemo(() => {
    if (!formatCategory) return [];
    if (!selectedAgencyId || selectedAgencyId === 'all') return formatCategory.articles;
    const agency = NEWS_AGENCIES.find((a) => a.id === selectedAgencyId);
    if (!agency?.matchKeyword) return formatCategory.articles;
    const matched = formatCategory.articles.filter((item) =>
      item.source.toLowerCase().includes(agency.matchKeyword!.toLowerCase())
    );
    return matched.length > 0 ? matched : formatCategory.articles;
  }, [formatCategory, selectedAgencyId]);

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
      default:
        return <BookOpen {...iconProps} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {renderIcon()}
            <View>
              <Text style={styles.headerTitle}>{formatCategory.title}</Text>
              <Text style={styles.headerSub}>{formatCategory.subtitle}</Text>
            </View>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Articles List */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {filteredArticles.map((item) => {
            const bookmarked = savedItemIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.articleCard, pressed && styles.pressed]}
                onPress={() => onSelectArticle(item)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.paperBadge}>{item.paper}</Text>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                  </View>
                  <Pressable
                    style={styles.bookmarkBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(item.id);
                    }}
                  >
                    <Bookmark
                      size={15}
                      color={bookmarked ? (isDark ? '#FFFFFF' : '#0F172A') : theme.textMuted}
                      fill={bookmarked ? (isDark ? '#FFFFFF' : '#0F172A') : 'none'}
                      strokeWidth={1.8}
                    />
                  </Pressable>
                </View>

                <Text style={styles.articleTitle}>{item.title}</Text>
                <Text style={styles.articleSource}>{item.source} · {item.date}</Text>

                <Text style={styles.articleSummary} numberOfLines={3}>
                  {item.summary}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.keyPointsCount}>
                    {item.keyPoints.length} Key UPSC Takeaways
                  </Text>
                  <View style={styles.readMoreRow}>
                    <Text style={styles.readMoreText}>Read Analysis</Text>
                    <ChevronRight size={14} color={theme.textPrimary} strokeWidth={2} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    headerSub: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 48,
    },
    articleCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 16,
    },
    pressed: {
      opacity: 0.88,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    paperBadge: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#0F172A',
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    categoryBadge: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    bookmarkBtn: {
      padding: 4,
    },
    articleTitle: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 23,
      color: theme.textPrimary,
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    articleSource: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 10,
    },
    articleSummary: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginBottom: 14,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
    },
    keyPointsCount: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textMuted,
    },
    readMoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readMoreText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
  });
