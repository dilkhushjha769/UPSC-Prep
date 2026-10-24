import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookMarked,
  Edit3,
  Newspaper,
  PenTool,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { UPSC_THEME } from '@/constants/themeColors';
import { ArcGauge } from './CircularGauge';

interface StudyMetricCardProps {
  isDark: boolean;
}

export function StudyMetricCard({ isDark }: StudyMetricCardProps) {
  const { metrics, config, setIsConfigModalOpen } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  // Format hours helper
  const toHours = (mins: number) => (mins / 60).toFixed(1);

  // 1. GS Prep calculations
  const gsHoursDone = toHours(metrics.gsCompletedMinutes);
  const gsTargetHours = toHours(config.gsTargetMinutes);
  const gsProgressRatio = Math.min(
    1,
    metrics.gsCompletedMinutes / Math.max(1, config.gsTargetMinutes)
  );
  const gsPercent = Math.round(gsProgressRatio * 100);

  // 2. Current Affairs calculations
  const caHoursDone = toHours(metrics.caCompletedMinutes);
  const caTargetHours = toHours(config.caTargetMinutes);
  const caProgressRatio = Math.min(
    1,
    metrics.caCompletedMinutes / Math.max(1, config.caTargetMinutes)
  );
  const caPercent = Math.round(caProgressRatio * 100);

  // 3. MCQs & Answer Writing calculations
  const accuracy =
    metrics.mcqsAttempted > 0
      ? Math.round((metrics.mcqsCorrect / metrics.mcqsAttempted) * 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Preparation Breakdown
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Daily progress across core examination pillars
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsConfigModalOpen(true)}
          style={[
            styles.configureTargetsBtn,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorderSubtle,
            },
          ]}>
          <Edit3 size={13} color={colors.primary} />
          <Text style={[styles.configureTargetsText, { color: colors.primary }]}>
            Targets
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3 Metric Cards Grid (inspired by Protein / Carbs / Fat pills in reference) */}
      <View style={styles.cardsRow}>
        {/* CARD 1: GS Preparation */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? '#1C192E' : '#F9F8FE',
              borderColor: isDark ? '#2D284C' : '#EDE8FE',
            },
          ]}>
          <View style={styles.cardTop}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isDark ? '#2A234E' : '#EDE9FE' },
              ]}>
              <BookMarked size={16} color={colors.primary} />
            </View>
            <Text style={[styles.cardTag, { color: colors.primary }]}>
              {gsPercent}%
            </Text>
          </View>

          <View style={styles.cardCenter}>
            <Text style={[styles.metricMainNumber, { color: colors.textPrimary }]}>
              {gsHoursDone}h
            </Text>
            <Text style={[styles.metricTargetSub, { color: colors.textMuted }]}>
              of {gsTargetHours}h target
            </Text>
          </View>

          <View style={styles.gaugeRow}>
            <ArcGauge
              size={58}
              strokeWidth={5}
              progress={gsProgressRatio}
              trackColor={isDark ? '#2B2648' : '#E2DCF8'}
              fillColor={colors.primary}>
              <Text style={[styles.miniGaugeText, { color: colors.primary }]}>
                GS
              </Text>
            </ArcGauge>
          </View>

          <Text style={[styles.metricDetail, { color: colors.textSecondary }]}>
            {metrics.gsTopicsCount} topics revised
          </Text>
        </View>

        {/* CARD 2: Current Affairs */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? '#161D2E' : '#F7F9FF',
              borderColor: isDark ? '#23304C' : '#E1E9FE',
            },
          ]}>
          <View style={styles.cardTop}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isDark ? '#1E2C4A' : '#E0E7FF' },
              ]}>
              <Newspaper size={16} color="#4F46E5" />
            </View>
            <Text style={[styles.cardTag, { color: '#4F46E5' }]}>
              {caPercent}%
            </Text>
          </View>

          <View style={styles.cardCenter}>
            <Text style={[styles.metricMainNumber, { color: colors.textPrimary }]}>
              {caHoursDone}h
            </Text>
            <Text style={[styles.metricTargetSub, { color: colors.textMuted }]}>
              of {caTargetHours}h target
            </Text>
          </View>

          <View style={styles.gaugeRow}>
            <ArcGauge
              size={58}
              strokeWidth={5}
              progress={caProgressRatio}
              trackColor={isDark ? '#222F4D' : '#DCE5FD'}
              fillColor="#4F46E5">
              <Text style={[styles.miniGaugeText, { color: '#4F46E5' }]}>
                CA
              </Text>
            </ArcGauge>
          </View>

          <Text style={[styles.metricDetail, { color: colors.textSecondary }]}>
            {metrics.caArticlesReviewed} articles noted
          </Text>
        </View>

        {/* CARD 3: Answer Writing & MCQs */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? '#142322' : '#F4FBF8',
              borderColor: isDark ? '#1D3B38' : '#D1F4E6',
            },
          ]}>
          <View style={styles.cardTop}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isDark ? '#1B3835' : '#D1FAE5' },
              ]}>
              <PenTool size={16} color={colors.accentEmerald} />
            </View>
            <Text style={[styles.cardTag, { color: colors.accentEmerald }]}>
              {accuracy}%
            </Text>
          </View>

          <View style={styles.cardCenter}>
            <Text style={[styles.metricMainNumber, { color: colors.textPrimary }]}>
              {metrics.mcqsAttempted}
            </Text>
            <Text style={[styles.metricTargetSub, { color: colors.textMuted }]}>
              MCQs attempted
            </Text>
          </View>

          <View style={styles.gaugeRow}>
            <ArcGauge
              size={58}
              strokeWidth={5}
              progress={accuracy / 100}
              trackColor={isDark ? '#1D3633' : '#D2F2E5'}
              fillColor={colors.accentEmerald}>
              <Text style={[styles.miniGaugeText, { color: colors.accentEmerald }]}>
                MCQ
              </Text>
            </ArcGauge>
          </View>

          <Text style={[styles.metricDetail, { color: colors.textSecondary }]}>
            {metrics.mainsAnswersWritten} mains answers
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  configureTargetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  configureTargetsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardCenter: {
    alignItems: 'center',
    marginBottom: 6,
  },
  metricMainNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricTargetSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  gaugeRow: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGaugeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricDetail: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
