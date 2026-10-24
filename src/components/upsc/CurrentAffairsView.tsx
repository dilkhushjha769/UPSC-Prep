import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Play,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface CurrentAffairsViewProps {
  isDark: boolean;
}

interface ArticleDigest {
  id: string;
  paper: 'GS 2' | 'GS 3' | 'Prelims Pointer';
  category: string;
  headline: string;
  source: string;
  summary: string;
  keyPoints: string[];
  mainsRelevance: string;
}

const DAILY_ARTICLES: ArticleDigest[] = [
  {
    id: 'ca_1',
    paper: 'GS 2',
    category: 'Polity & Governance',
    headline: 'Electoral Reforms & Role of Election Commission of India in Ensuring Free & Fair Polls',
    source: 'The Hindu • Lead Editorial',
    summary: 'Analysis of recent constitutional debates on appointment procedures for Election Commissioners and institutional autonomy under Article 324.',
    keyPoints: [
      'Supreme Court verdict in Anoop Baranwal v. Union of India and subsequent legislation.',
      'Comparison of selection panel composition with global constitutional standards.',
      'Model Code of Conduct enforcement and emerging challenges from digital campaign finance.',
    ],
    mainsRelevance: 'GS Paper 2: Appointment to various Constitutional posts, powers, functions and responsibilities of various Constitutional Bodies.',
  },
  {
    id: 'ca_2',
    paper: 'GS 3',
    category: 'Economy & Monetary Policy',
    headline: 'RBI Monetary Policy Committee: Inflation Targeting in a Fragmented Global Economy',
    source: 'The Indian Express • Explained Page',
    summary: 'Evaluation of the 4% +/- 2% flexible inflation targeting framework amid supply-side food shocks, crude price volatility, and currency pressures.',
    keyPoints: [
      'Food inflation dynamics versus core inflation divergence.',
      'Transmission of policy repo rate through bank lending channels.',
      'External sector resilience, CAD management, and foreign exchange reserve adequacy.',
    ],
    mainsRelevance: 'GS Paper 3: Indian Economy and issues relating to planning, mobilization of resources, growth, development and employment.',
  },
  {
    id: 'ca_3',
    paper: 'GS 3',
    category: 'Environment & Climate',
    headline: 'COP29 Finance Framework & Loss and Damage Fund Operationalization',
    source: 'Down To Earth • Policy Brief',
    summary: 'Global climate negotiations on the New Collective Quantified Goal (NCQG) on climate finance and accountability of developed nations.',
    keyPoints: [
      'Common But Differentiated Responsibilities and Respective Capabilities (CBDR-RC).',
      'India’s clean energy transition target (500 GW non-fossil by 2030) and finance gap.',
      'Mechanisms for direct adaptation grant dispersal to vulnerable global south states.',
    ],
    mainsRelevance: 'GS Paper 3: Conservation, environmental pollution and degradation, environmental impact assessment.',
  },
  {
    id: 'ca_4',
    paper: 'Prelims Pointer',
    category: 'Science & Security',
    headline: 'Deep Ocean Mission: Samudrayaan & Submersible MATSYA 6000 Sea Trials',
    source: 'Press Information Bureau (PIB)',
    summary: 'India’s indigenously developed human submersible capable of diving to 6,000 meters depth for deep-sea polymetallic nodule exploration.',
    keyPoints: [
      'Ministry of Earth Sciences flagship Deep Ocean Mission initiative.',
      'Polymetallic nodules (Nickel, Cobalt, Copper, Manganese) in Central Indian Ocean Basin.',
      'Strategic importance of International Seabed Authority (ISA) exploration rights.',
    ],
    mainsRelevance: 'GS Paper 3: Science and Technology- developments and their applications and effects in everyday life.',
  },
];

export function CurrentAffairsView({ isDark }: CurrentAffairsViewProps) {
  const { metrics, recordArticleRead, startFocusTimer } = useStudy();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());

  const handleMarkRead = async (id: string) => {
    setReadArticles((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    await recordArticleRead();
  };

  const filteredArticles = DAILY_ARTICLES.filter((article) => {
    if (selectedTag === 'All') return true;
    return article.paper === selectedTag;
  });

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: isDesktop ? 60 : 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            DAILY UPSC DOSSIER
          </Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Current Affairs & Editorials
          </Text>
          <Text style={[styles.desc, { color: theme.textSecondary }]}>
            High-yield editorial breakdowns curated specifically for UPSC Prelims & Mains answer writing.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => startFocusTimer('Current Affairs', 'Daily Editorial & Current Affairs Analysis', 60)}
          style={[styles.startFocusBtn, { backgroundColor: isDark ? '#FFFFFF' : '#09090B' }]}>
          <Play size={13} color={isDark ? '#09090B' : '#FFFFFF'} fill={isDark ? '#09090B' : '#FFFFFF'} />
          <Text style={[styles.startFocusText, { color: isDark ? '#09090B' : '#FFFFFF' }]}>
            Focus on CA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Cards Row */}
      <View style={styles.metricRow}>
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            ARTICLES REVIEWED TODAY
          </Text>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {metrics.caArticlesReviewed}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            Target: 4 editorials / day
          </Text>
        </View>

        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            CA TIME LOGGED
          </Text>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {Math.floor(metrics.caCompletedMinutes / 60)}h {metrics.caCompletedMinutes % 60}m
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            Target: {Math.floor(metrics.caTargetMinutes / 60)}h {metrics.caTargetMinutes % 60}m
          </Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['All', 'GS 2', 'GS 3', 'Prelims Pointer'] as const).map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <TouchableOpacity
              key={tag}
              activeOpacity={0.7}
              onPress={() => setSelectedTag(tag)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? isDark ? '#FFFFFF' : '#09090B'
                    : isDark ? '#151822' : '#F8FAFC',
                  borderColor: isSelected
                    ? isDark ? '#FFFFFF' : '#09090B'
                    : isDark ? '#242B3B' : '#E2E8F0',
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected
                      ? isDark ? '#09090B' : '#FFFFFF'
                      : theme.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Articles List */}
      <View style={styles.articleList}>
        {filteredArticles.map((article) => {
          const isRead = readArticles.has(article.id);
          return (
            <View
              key={article.id}
              style={[
                styles.articleCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <View style={styles.articleHeader}>
                <View style={styles.paperBadgeRow}>
                  <View
                    style={[
                      styles.paperBadge,
                      {
                        backgroundColor: isDark ? '#222838' : '#E2E8F0',
                      },
                    ]}>
                    <Text style={[styles.paperBadgeText, { color: theme.textPrimary }]}>
                      {article.paper}
                    </Text>
                  </View>
                  <Text style={[styles.categoryText, { color: theme.textMuted }]}>
                    {article.category}
                  </Text>
                </View>

                <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
                  {article.source}
                </Text>
              </View>

              <Text style={[styles.headlineText, { color: theme.textPrimary }]}>
                {article.headline}
              </Text>

              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                {article.summary}
              </Text>

              {/* Key Exam Takeaways */}
              <View
                style={[
                  styles.keyPointsBox,
                  {
                    backgroundColor: isDark ? '#141722' : '#F8FAFC',
                    borderColor: isDark ? '#242B3B' : '#E2E8F0',
                  },
                ]}>
                <Text style={[styles.keyPointsTitle, { color: theme.textPrimary }]}>
                  Key Syllabus Pointers:
                </Text>
                {article.keyPoints.map((pt, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: theme.textPrimary }]} />
                    <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                      {pt}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Mains Relevance */}
              <Text style={[styles.mainsRelevanceText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: '700', color: theme.textSecondary }}>Syllabus: </Text>
                {article.mainsRelevance}
              </Text>

              {/* Action */}
              <View style={styles.articleFooter}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleMarkRead(article.id)}
                  style={[
                    styles.markReadBtn,
                    {
                      backgroundColor: isRead
                        ? isDark ? '#1F2937' : '#E5E7EB'
                        : isDark ? '#1C202B' : '#F4F4F5',
                      borderColor: isDark ? '#2E3547' : '#E2E8F0',
                    },
                  ]}>
                  <CheckCircle2
                    size={14}
                    color={isRead ? (isDark ? '#34D399' : '#059669') : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.markReadText,
                      {
                        color: isRead
                          ? isDark ? '#34D399' : '#059669'
                          : theme.textPrimary,
                        fontWeight: isRead ? '700' : '600',
                      },
                    ]}>
                    {isRead ? 'Marked as Read (+30m logged)' : 'Mark as Read & Log 30m'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  desc: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 620,
    lineHeight: 18,
  },
  startFocusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  startFocusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricSub: {
    fontSize: 11,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  articleList: {
    gap: 16,
  },
  articleCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  paperBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paperBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paperBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headlineText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  keyPointsBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  keyPointsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  mainsRelevanceText: {
    fontSize: 11,
    lineHeight: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 2,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  markReadText: {
    fontSize: 11,
  },
});
