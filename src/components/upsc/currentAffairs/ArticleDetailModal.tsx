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
  Bookmark,
  BookOpen,
} from '@/components/common/LucideIcons';
import { DailyEventItem, CuratedArticle, MajorEvent } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';

type DetailItem =
  | { type: 'event'; data: DailyEventItem }
  | { type: 'major'; data: MajorEvent }
  | { type: 'article'; data: CuratedArticle };

interface ArticleDetailModalProps {
  visible: boolean;
  item: DetailItem | null;
  onClose: () => void;
  isDark: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export function ArticleDetailModal({
  visible,
  item,
  onClose,
  isDark,
  isSaved = false,
  onToggleSave,
}: ArticleDetailModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  if (!visible || !item) return null;

  const title =
    item.type === 'event'
      ? item.data.headline
      : item.type === 'major'
      ? item.data.title
      : item.data.title;

  const source = item.data.source;
  const date = item.data.date;
  const category = item.data.category;
  const paper =
    item.type === 'event' || item.type === 'article'
      ? item.data.paper
      : item.data.paper;

  const bullets =
    item.type === 'event'
      ? item.data.bullets
      : item.type === 'major'
      ? item.data.keyTakeaways
      : item.data.keyPoints;

  const summary = item.data.summary;

  const itemId = item.data.id;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Exam Reference Details
          </Text>

          <Pressable
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
            onPress={() => onToggleSave && onToggleSave(itemId)}
          >
            <Bookmark
              size={15}
              color={isSaved ? (isDark ? '#000000' : '#FFFFFF') : theme.textPrimary}
              strokeWidth={2}
            />
            <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextActive]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Metadata Row */}
          <View style={styles.badgeRow}>
            <View style={styles.paperBadge}>
              <Text style={styles.paperBadgeText}>{paper}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category}</Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Source Attribution */}
          <View style={styles.sourceBox}>
            <BookOpen size={13} color={theme.textMuted} strokeWidth={2} />
            <Text style={styles.sourceText}>Authenticated Reference: {source}</Text>
          </View>

          {/* Summary (if present) */}
          {Boolean(summary) && (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionLabel}>Executive Summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}

          {/* Key Facts in Bullets */}
          <View style={styles.bulletsSection}>
            <Text style={styles.sectionLabel}>Key Facts & Exam Points</Text>
            <View style={styles.bulletsList}>
              {bullets.map((b, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prelims Facts (if event) */}
          {item.type === 'event' && item.data.prelimsFacts.length > 0 && (
            <View style={styles.prelimsBox}>
              <Text style={styles.prelimsTitle}>High-Yield Prelims Pointers:</Text>
              {item.data.prelimsFacts.map((pf, idx) => (
                <View key={idx} style={styles.subBulletRow}>
                  <Text style={styles.subBulletMarker}>•</Text>
                  <Text style={styles.prelimsFactText}>{pf}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Mains Relevance */}
          {item.type === 'event' && Boolean(item.data.mainsRelevance) && (
            <View style={styles.mainsBox}>
              <Text style={styles.mainsTitle}>Mains Syllabus Mapping:</Text>
              <Text style={styles.mainsText}>{item.data.mainsRelevance}</Text>
            </View>
          )}

          {/* Analytical Angle / Mains Question (if article) */}
          {item.type === 'article' && Boolean(item.data.analyticalAngle) && (
            <View style={styles.mainsBox}>
              <Text style={styles.mainsTitle}>Analytical Perspective:</Text>
              <Text style={styles.mainsText}>{item.data.analyticalAngle}</Text>

              {Boolean(item.data.mainsQuestion) && (
                <View style={styles.mainsQBox}>
                  <Text style={styles.mainsQTitle}>Practice Mains Question:</Text>
                  <Text style={styles.mainsQText}>{item.data.mainsQuestion}</Text>
                </View>
              )}
            </View>
          )}
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
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 7,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    saveBtnActive: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      borderColor: isDark ? '#FFFFFF' : '#0F172A',
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    saveBtnTextActive: {
      color: isDark ? '#000000' : '#FFFFFF',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
      gap: 16,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    paperBadge: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    paperBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: isDark ? '#000000' : '#FFFFFF',
      letterSpacing: 0.3,
    },
    categoryBadge: {
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    dateText: {
      fontSize: 11.5,
      color: theme.textMuted,
      fontWeight: '500',
      marginLeft: 'auto',
    },
    titleText: {
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 28,
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    sourceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    sourceText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    summaryContainer: {
      gap: 6,
    },
    sectionLabel: {
      fontSize: 11.5,
      fontWeight: '800',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    summaryText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textPrimary,
    },
    bulletsSection: {
      gap: 10,
    },
    bulletsList: {
      gap: 10,
    },
    bulletItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.textPrimary,
      marginTop: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 21,
      color: theme.textSecondary,
    },
    prelimsBox: {
      backgroundColor: theme.surfaceMuted,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 8,
    },
    prelimsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    subBulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    subBulletMarker: {
      fontSize: 14,
      lineHeight: 18,
      color: theme.textPrimary,
    },
    prelimsFactText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
    },
    mainsBox: {
      backgroundColor: theme.cardBg,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 8,
    },
    mainsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    mainsText: {
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.textSecondary,
    },
    mainsQBox: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      gap: 4,
    },
    mainsQTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
    },
    mainsQText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textPrimary,
      fontStyle: 'italic',
    },
  });
