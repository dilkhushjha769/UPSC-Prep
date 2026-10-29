import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Bookmark } from 'lucide-react-native';

export interface EditorialNewsItem {
  id: string;
  headline?: string;
  title?: string;
  category?: string;
  primaryCategory?: string;
  paper?: string;
  source?: string;
  readTime?: string;
  summary?: string;
  whyItMatters?: string;
  summaryBullets?: string[];
  bullets?: string[];
  keyPoints?: string[];
  analyticalAngle?: string;
  isPrelimsRelevant?: boolean;
  isMainsRelevant?: boolean;
  date?: string;
  dateKey?: string;
  imageUrl?: string;
  [key: string]: any;
}

interface EditorialNewsCardProps {
  item: EditorialNewsItem;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onReadSummary: (item: EditorialNewsItem) => void;
  isDark?: boolean;
}

export function EditorialNewsCard({
  item,
  isBookmarked,
  onToggleBookmark,
  onReadSummary,
  isDark = false,
}: EditorialNewsCardProps) {
  // Normalize title
  const title = (item.headline || item.title || 'UPSC Current Affairs Update').trim();

  // Normalize paper (e.g. GS-II -> GS2, GS-III -> GS3, GS 2 -> GS2)
  const normalizedPaper = useMemo(() => {
    const raw = (item.paper || 'GS2').trim();
    return raw
      .replace('GS-IV', 'GS4')
      .replace('GS-III', 'GS3')
      .replace('GS-II', 'GS2')
      .replace('GS-I', 'GS1')
      .replace('GS 4', 'GS4')
      .replace('GS 3', 'GS3')
      .replace('GS 2', 'GS2')
      .replace('GS 1', 'GS1');
  }, [item.paper]);

  // Normalize category label
  const categoryLabel = useMemo(() => {
    const cat = item.category || item.primaryCategory || 'Current Affairs';
    if (cat.toLowerCase().includes('polity') || cat.toLowerCase().includes('governance')) return 'Polity';
    if (cat.toLowerCase().includes('economy') || cat.toLowerCase().includes('finance')) return 'Economy';
    if (cat.toLowerCase().includes('environment') || cat.toLowerCase().includes('ecology')) return 'Environment';
    if (cat.toLowerCase().includes('sci') || cat.toLowerCase().includes('tech')) return 'Science & Tech';
    if (cat.toLowerCase().includes('international') || cat.toLowerCase().includes('relations') || cat.toLowerCase().includes('geopolitics')) return 'International Relations';
    if (cat.toLowerCase().includes('report') || cat.toLowerCase().includes('scheme')) return 'Reports & Schemes';
    if (cat.toLowerCase().includes('editorial') || cat.toLowerCase().includes('explainer')) return 'Editorial';
    return cat;
  }, [item.category, item.primaryCategory]);

  // Category badge colors matching the Figma design
  const badgeColors = useMemo(() => {
    const c = categoryLabel.toLowerCase();
    if (c.includes('polity')) {
      return {
        bg: isDark ? 'rgba(67, 56, 202, 0.22)' : '#EEF2FF',
        text: isDark ? '#93C5FD' : '#4338CA',
        border: isDark ? 'rgba(67, 56, 202, 0.4)' : '#E0E7FF',
      };
    }
    if (c.includes('economy')) {
      return {
        bg: isDark ? 'rgba(6, 95, 70, 0.22)' : '#ECFDF5',
        text: isDark ? '#6EE7B7' : '#065F46',
        border: isDark ? 'rgba(6, 95, 70, 0.4)' : '#D1FAE5',
      };
    }
    if (c.includes('environment')) {
      return {
        bg: isDark ? 'rgba(146, 64, 14, 0.22)' : '#FEF3C7',
        text: isDark ? '#FCD34D' : '#92400E',
        border: isDark ? 'rgba(146, 64, 14, 0.4)' : '#FDE68A',
      };
    }
    if (c.includes('science') || c.includes('tech')) {
      return {
        bg: isDark ? 'rgba(107, 33, 168, 0.22)' : '#F3E8FF',
        text: isDark ? '#D8B4FE' : '#6B21A8',
        border: isDark ? 'rgba(107, 33, 168, 0.4)' : '#E9D5FF',
      };
    }
    if (c.includes('international')) {
      return {
        bg: isDark ? 'rgba(3, 105, 161, 0.22)' : '#E0F2FE',
        text: isDark ? '#7DD3FC' : '#0369A1',
        border: isDark ? 'rgba(3, 105, 161, 0.4)' : '#BAE6FD',
      };
    }
    return {
      bg: isDark ? '#1F2937' : '#F3F4F6',
      text: isDark ? '#D1D5DB' : '#374151',
      border: isDark ? '#374151' : '#E5E7EB',
    };
  }, [categoryLabel, isDark]);

  // Clean source name
  const cleanSource = useMemo(() => {
    const raw = item.source || 'PIB';
    if (raw.toLowerCase().includes('hindu')) return 'The Hindu';
    if (raw.toLowerCase().includes('express')) return 'Indian Express';
    if (raw.toLowerCase().includes('pib') || raw.toLowerCase().includes('information bureau')) return 'PIB';
    if (raw.toLowerCase().includes('rbi')) return 'RBI Bulletin';
    if (raw.toLowerCase().includes('mint')) return 'Livemint';
    if (raw.toLowerCase().includes('earth')) return 'Down To Earth';
    if (raw.toLowerCase().includes('reuters')) return 'Reuters';
    return raw.split('•')[0].split('-')[0].trim() || 'Official Release';
  }, [item.source]);

  // Read time calculation
  const readTime = useMemo(() => {
    if (item.readTime) return item.readTime;
    const wordCount = ((item.summary || '') + (item.headline || '') + (item.whyItMatters || '')).split(/\s+/).length;
    const minutes = Math.max(3, Math.min(6, Math.ceil(wordCount / 65)));
    return `${minutes} min read`;
  }, [item.readTime, item.summary, item.headline, item.whyItMatters]);

  // "Why it matters" clean extraction
  const whyItMattersText = useMemo(() => {
    if (item.whyItMatters && item.whyItMatters.trim().length > 10) {
      return item.whyItMatters.trim();
    }
    if (item.summaryBullets && item.summaryBullets.length > 0) {
      return item.summaryBullets[0].replace(/^[•\-\*]\s*/, '').trim();
    }
    if (item.summary) {
      const clean = item.summary
        .replace(/^[•\-\*]\s*/gm, '')
        .replace(/\*\*/g, '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (clean.length > 0) {
        return clean[0];
      }
    }
    if (item.analyticalAngle) {
      return item.analyticalAngle.trim();
    }
    return 'Critical policy implications, constitutional mandate, and high-frequency UPSC exam relevance.';
  }, [item.whyItMatters, item.summaryBullets, item.summary, item.analyticalAngle]);

  // Useful for label
  const usefulForLabel = useMemo(() => {
    const hasPrelims = item.isPrelimsRelevant ?? true;
    const hasMains = item.isMainsRelevant ?? true;
    if (hasPrelims && hasMains) return 'Prelims & Mains';
    if (hasMains) return 'Mains';
    return 'Prelims';
  }, [item.isPrelimsRelevant, item.isMainsRelevant]);

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {/* Top Meta Line: GS Badge + Source + Read Time */}
      <View style={styles.topMetaRow}>
        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: badgeColors.bg,
              borderColor: badgeColors.border,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeColors.text }]}>
            {normalizedPaper} · {categoryLabel}
          </Text>
        </View>

        <Text style={[styles.metaInfoText, isDark && styles.metaInfoTextDark]}>
          {cleanSource} · {readTime}
        </Text>
      </View>

      {/* Article Title in Elegant Serif Typography */}
      <Pressable onPress={() => onReadSummary(item)}>
        <Text style={[styles.titleText, isDark && styles.titleTextDark]}>
          {title}
        </Text>
      </Pressable>

      {/* "Why it matters:" Section */}
      <View style={styles.whyItMattersContainer}>
        <Text style={[styles.whyItMattersBody, isDark && styles.whyItMattersBodyDark]}>
          <Text style={[styles.whyItMattersLead, isDark && styles.whyItMattersLeadDark]}>
            {'Why it matters: '}
          </Text>
          {whyItMattersText}
        </Text>
      </View>

      {/* Card Footer: Useful for Tag + Bookmark + Read Summary */}
      <View style={styles.footerRow}>
        <Text style={[styles.usefulForText, isDark && styles.usefulForTextDark]}>
          {'Useful for '}
          <Text style={[styles.usefulForHighlight, isDark && styles.usefulForHighlightDark]}>
            {usefulForLabel}
          </Text>
        </Text>

        <View style={styles.actionsRow}>
          {/* Bookmark Button */}
          <Pressable
            style={({ pressed }: any) => [
              styles.bookmarkBtn,
              isDark && styles.bookmarkBtnDark,
              isBookmarked && styles.bookmarkBtnActive,
              pressed && styles.btnPressed,
            ]}
            onPress={() => onToggleBookmark(item.id)}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark for revision'}
            hitSlop={6}
          >
            <Bookmark
              size={17}
              color={isBookmarked ? '#A84319' : isDark ? '#9CA3AF' : '#4B5563'}
              fill={isBookmarked ? '#A84319' : 'none'}
              strokeWidth={2}
            />
          </Pressable>

          {/* Primary "Read summary" Button */}
          <Pressable
            style={({ pressed }: any) => [
              styles.readSummaryBtn,
              isDark && styles.readSummaryBtnDark,
              pressed && styles.readSummaryBtnPressed,
            ]}
            onPress={() => onReadSummary(item)}
            accessibilityRole="button"
            accessibilityLabel={`Read summary of ${title}`}
          >
            <Text style={styles.readSummaryBtnText}>Read summary</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  cardDark: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  metaInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaInfoTextDark: {
    color: '#9CA3AF',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 27,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, "Times New Roman", serif',
      default: 'serif',
    }),
    marginBottom: 12,
  },
  titleTextDark: {
    color: '#F9FAFB',
  },
  whyItMattersContainer: {
    marginBottom: 16,
  },
  whyItMattersBody: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#4B5563',
  },
  whyItMattersBodyDark: {
    color: '#D1D5DB',
  },
  whyItMattersLead: {
    fontWeight: '700',
    color: '#1F2937',
  },
  whyItMattersLeadDark: {
    color: '#F3F4F6',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  usefulForText: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '400',
  },
  usefulForTextDark: {
    color: '#9CA3AF',
  },
  usefulForHighlight: {
    color: '#1F2937',
    fontWeight: '600',
  },
  usefulForHighlightDark: {
    color: '#E5E7EB',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookmarkBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtnDark: {
    backgroundColor: '#21262D',
    borderColor: '#30363D',
  },
  bookmarkBtnActive: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  readSummaryBtn: {
    backgroundColor: '#17202A',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readSummaryBtnDark: {
    backgroundColor: '#F3F4F6',
  },
  readSummaryBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  readSummaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.8,
  },
});
