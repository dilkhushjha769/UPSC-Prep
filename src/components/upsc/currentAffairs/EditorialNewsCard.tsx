import { useAppTheme } from '@/context/ThemeContext';
import { verifyNewsImageRelevance } from '@/utils/imageVerification';
import { Image } from 'expo-image';
import { Bookmark } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  imageUrl?: string | null;
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
  isDark: propIsDark,
}: EditorialNewsCardProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
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
        bg: isDark ? 'rgba(67, 56, 202, 0.22)' : '#E9EDF9',
        text: isDark ? '#F2C9A3' : '#3D5A99',
        border: isDark ? 'rgba(67, 56, 202, 0.4)' : '#CBD3EB',
      };
    }
    if (c.includes('economy')) {
      return {
        bg: isDark ? 'rgba(6, 95, 70, 0.22)' : '#E3F1E8',
        text: isDark ? '#3FA573' : '#1D5C3D',
        border: isDark ? 'rgba(6, 95, 70, 0.4)' : '#E3F1E8',
      };
    }
    if (c.includes('environment')) {
      return {
        bg: isDark ? 'rgba(146, 64, 14, 0.22)' : '#FFF7ED',
        text: isDark ? '#FF9500' : '#9A3412',
        border: isDark ? 'rgba(146, 64, 14, 0.4)' : '#F2D2A8',
      };
    }
    if (c.includes('science') || c.includes('tech')) {
      return {
        bg: isDark ? 'rgba(107, 33, 168, 0.22)' : '#E9EDF9',
        text: isDark ? '#CBD3EB' : '#3D5A99',
        border: isDark ? 'rgba(107, 33, 168, 0.4)' : '#CBD3EB',
      };
    }
    if (c.includes('international')) {
      return {
        bg: isDark ? 'rgba(3, 105, 161, 0.22)' : '#E9EDF9',
        text: isDark ? '#3FA573' : '#34508F',
        border: isDark ? 'rgba(3, 105, 161, 0.4)' : '#F2C9A3',
      };
    }
    return {
      bg: isDark ? '#1C2433' : '#F0EDE6',
      text: isDark ? '#DDD6CA' : '#333D52',
      border: isDark ? '#333D52' : '#EAE5DC',
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

  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const verification = useMemo(() => {
    const candidate = item.imageUrl || item.imageMetadata?.imageUrl || null;
    return verifyNewsImageRelevance({
      headline: title,
      summary: whyItMattersText,
      imageUrl: candidate,
      caption: item.imageMetadata?.caption,
      credit: item.imageMetadata?.credit,
      source: cleanSource,
      category: categoryLabel,
    });
  }, [title, whyItMattersText, item.imageUrl, item.imageMetadata, cleanSource, categoryLabel]);

  const verifiedImageUrl =
    !imageLoadFailed && verification.status === 'VERIFIED' ? verification.verifiedImageUrl : null;

  const hasVisualLearning = Boolean(item.visualLearningAssets && item.visualLearningAssets.length > 0);

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

        <View style={styles.metaRightGroup}>
          {hasVisualLearning && (
            <View style={[styles.visualTagPill, isDark && styles.visualTagPillDark]}>
              <Text style={styles.visualTagText}>Visuals</Text>
            </View>
          )}
          <Text style={[styles.metaInfoText, isDark && styles.metaInfoTextDark]}>
            {cleanSource} · {readTime}
          </Text>
        </View>
      </View>

      {/* Authentic Editorial Photograph Banner */}
      {Boolean(verifiedImageUrl) && (
        <Pressable
          onPress={() => onReadSummary(item)}
          style={[styles.imageCardWrapper, isDark && styles.imageCardWrapperDark]}
          accessibilityRole="button"
          accessibilityLabel={`Open full article: ${title}`}
        >
          <Image
            source={{ uri: verifiedImageUrl! }}
            style={styles.articleImage}
            contentFit="cover"
            transition={200}
            onError={() => setImageLoadFailed(true)}
          />
          <View style={[styles.imageOverlaySourceBadge, isDark && styles.imageOverlaySourceBadgeDark]}>
            <Text style={styles.imageOverlaySourceText}>
              {verification.sourceCredibility === 'official_gov' ? 'Verified Official' : cleanSource}
            </Text>
          </View>
        </Pressable>
      )}

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
              isBookmarked && (isDark ? styles.bookmarkBtnActiveDark : styles.bookmarkBtnActive),
              pressed && styles.btnPressed,
            ]}
            onPress={() => onToggleBookmark(item.id)}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark for revision'}
            hitSlop={6}
          >
            <Bookmark
              size={17}
              color={isBookmarked ? '#FF9500' : isDark ? '#8892A6' : '#4A5568'}
              fill={isBookmarked ? '#FF9500' : 'none'}
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
  imageCardWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    position: 'relative',
    backgroundColor: '#F0EDE6',
  },
  imageCardWrapperDark: {
    borderColor: '#253244',
    backgroundColor: '#1B2534',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlaySourceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 20, 30, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  imageOverlaySourceBadgeDark: {
    backgroundColor: 'rgba(11, 16, 24, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  imageOverlaySourceText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5DC',
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
    backgroundColor: '#151A25',
    borderColor: '#333D52',
  },
  metaRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visualTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  visualTagPillDark: {
    backgroundColor: 'rgba(245, 130, 53, 0.15)',
  },
  visualTagText: {
    color: '#FF9500',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
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
    color: '#5F6B80',
    fontWeight: '500',
  },
  metaInfoTextDark: {
    color: '#8892A6',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C2433',
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
    color: '#FAF9F6',
  },
  whyItMattersContainer: {
    marginBottom: 16,
  },
  whyItMattersBody: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#4A5568',
  },
  whyItMattersBodyDark: {
    color: '#DDD6CA',
  },
  whyItMattersLead: {
    fontWeight: '700',
    color: '#1C2433',
  },
  whyItMattersLeadDark: {
    color: '#F0EDE6',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE6',
  },
  usefulForText: {
    fontSize: 13.5,
    color: '#5F6B80',
    fontWeight: '400',
  },
  usefulForTextDark: {
    color: '#8892A6',
  },
  usefulForHighlight: {
    color: '#1C2433',
    fontWeight: '600',
  },
  usefulForHighlightDark: {
    color: '#EAE5DC',
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
    borderColor: '#EAE5DC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtnDark: {
    backgroundColor: '#1B2534',
    borderColor: '#253244',
  },
  bookmarkBtnActive: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF7ED',
  },
  bookmarkBtnActiveDark: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(245, 130, 53, 0.16)',
  },
  readSummaryBtn: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readSummaryBtnDark: {
    backgroundColor: '#FF9500',
  },
  readSummaryBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  readSummaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  btnPressed: {
    opacity: 0.8,
  },
});

