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
import { Image } from 'expo-image';
import {
  X,
  Bookmark,
  BookOpen,
  ListChecks,
  ShieldCheck,
  Compass,
} from 'lucide-react-native';
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
  const imageUrl = item.type === 'event' ? item.data.imageUrl : (item.data as any).imageUrl;

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

          {/* Authentic Editorial Photo if available */}
          {Boolean(imageUrl) && (
            <View style={styles.heroImageWrapper}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                transition={180}
              />
              <Text style={styles.imageSourceCaption}>Photo Courtesy: {source}</Text>
            </View>
          )}

          {/* Summary (if present) */}
          {Boolean(summary) && (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionLabel}>Executive Summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}

          {/* Key Takeaways Section */}
          <View style={styles.bulletsSection}>
            <View style={styles.sectionHeaderRow}>
              <ListChecks size={15} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2} />
              <Text style={styles.sectionLabel}>Key Takeaways</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{bullets.length}</Text>
              </View>
            </View>
            <View style={styles.bulletsList}>
              {bullets.map((b, idx) => (
                <View key={idx} style={styles.takeawayCard}>
                  <View style={styles.takeawayIndexBadge}>
                    <Text style={styles.takeawayIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prelims Facts & High-Yield Matrix (if event) */}
          {item.type === 'event' && (
            <View style={styles.prelimsBox}>
              <View style={styles.sectionHeaderRow}>
                <ShieldCheck size={15} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2} />
                <Text style={styles.prelimsTitle}>High-Yield Prelims Facts & Matrix</Text>
              </View>

              {/* Fact Matrix Grid if available */}
              {item.data.prelimsFactMatrix && item.data.prelimsFactMatrix.length > 0 && (
                <View style={styles.matrixGrid}>
                  {item.data.prelimsFactMatrix.map((matrixItem, mIdx) => (
                    <View key={mIdx} style={styles.matrixItemCard}>
                      <Text style={styles.matrixItemLabel}>{matrixItem.label}</Text>
                      <Text style={styles.matrixItemValue}>{matrixItem.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Bullet Pointers */}
              {item.data.prelimsFacts && item.data.prelimsFacts.length > 0 && (
                <View style={styles.prelimsBulletsList}>
                  {item.data.prelimsFacts.map((pf, idx) => (
                    <View key={idx} style={styles.subBulletRow}>
                      <View style={styles.prelimsDot} />
                      <Text style={styles.prelimsFactText}>{pf}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Syllabus Relevance */}
          {item.type === 'event' && item.data.syllabusRelevance && (
            <View style={styles.syllabusBox}>
              <View style={styles.sectionHeaderRow}>
                <Compass size={14} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2} />
                <Text style={styles.syllabusTitle}>UPSC Syllabus Integration</Text>
              </View>
              <View style={styles.syllabusItem}>
                <Text style={styles.syllabusItemLabel}>Static Linkage:</Text>
                <Text style={styles.syllabusItemValue}>{item.data.syllabusRelevance.staticConnection}</Text>
              </View>
              <View style={styles.syllabusItem}>
                <Text style={styles.syllabusItemLabel}>Prelims Angle:</Text>
                <Text style={styles.syllabusItemValue}>{item.data.syllabusRelevance.prelimsAngle}</Text>
              </View>
              <View style={styles.syllabusItem}>
                <Text style={styles.syllabusItemLabel}>Mains Dimension:</Text>
                <Text style={styles.syllabusItemValue}>{item.data.syllabusRelevance.mainsDimensions}</Text>
              </View>
            </View>
          )}

          {/* Mains Relevance */}
          {item.type === 'event' && Boolean(item.data.mainsRelevance) && !item.data.syllabusRelevance && (
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
    heroImageWrapper: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? '#17191D' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#262930' : '#E2E8F0',
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    imageSourceCaption: {
      position: 'absolute',
      bottom: 6,
      right: 8,
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
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
      gap: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    countBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#EFF6FF',
    },
    countBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#93C5FD' : '#2563EB',
    },
    bulletsList: {
      gap: 10,
    },
    takeawayCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.surfaceMuted,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    takeawayIndexBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    takeawayIndexText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    bulletText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      color: theme.textPrimary,
    },
    prelimsBox: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#F0FDF4',
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#BBF7D0',
      gap: 12,
    },
    prelimsTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : '#15803D',
      letterSpacing: 0.2,
    },
    matrixGrid: {
      gap: 8,
    },
    matrixItemCard: {
      backgroundColor: theme.cardBg,
      padding: 10,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 3,
    },
    matrixItemLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#94A3B8' : '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    matrixItemValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
      lineHeight: 18,
    },
    prelimsBulletsList: {
      gap: 7,
    },
    subBulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    prelimsDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#4ADE80' : '#15803D',
      marginTop: 7,
    },
    prelimsFactText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
    },
    syllabusBox: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : '#F0F9FF',
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#BAE6FD',
      gap: 10,
    },
    syllabusTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: isDark ? '#38BDF8' : '#0369A1',
      letterSpacing: 0.2,
    },
    syllabusItem: {
      gap: 2,
    },
    syllabusItemLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    syllabusItemValue: {
      fontSize: 12.5,
      color: theme.textPrimary,
      lineHeight: 18,
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
