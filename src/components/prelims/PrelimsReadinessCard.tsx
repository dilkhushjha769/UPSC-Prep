import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { PrelimsTheme } from '@/constants/prelimsTheme';

interface PrelimsReadinessCardProps {
  onTrendInsightsPress?: () => void;
}

export function PrelimsReadinessCard({ onTrendInsightsPress }: PrelimsReadinessCardProps) {
  // SVG ring dimensions
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Let's create an open arc (e.g. 75% arc like the calorie meter in image 2)
  const progressPercent = 68; // 68% mastered
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * progressPercent) / 100;

  return (
    <View style={styles.card}>
      {/* Header with Title and Trend analysis action */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.headerCaption}>Prelims Readiness Index</Text>
          <Text style={styles.headerTitle}>10-Year Syllabus Mastery</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.infoPill, pressed && styles.pressed]}
          onPress={onTrendInsightsPress}
        >
          <Ionicons name="analytics-outline" size={14} color="#7C3AED" />
          <Text style={styles.infoPillText}>Decade Trend</Text>
        </Pressable>
      </View>

      {/* Circular Progress Gauge */}
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <LinearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#8C65F7" />
              <Stop offset="100%" stopColor="#6D28D9" />
            </LinearGradient>
          </Defs>
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F0EAFB"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(135 ${size / 2} ${size / 2})`}
          />
          {/* Active Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#purpleGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(135 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center Text inside gauge */}
        <View style={styles.gaugeCenter}>
          <Text style={styles.gaugeBigNumber}>142 / 210</Text>
          <Text style={styles.gaugeSublabel}>Concepts Mastered</Text>
          <View style={styles.readinessBadge}>
            <Text style={styles.readinessBadgeText}>68% Ready</Text>
          </View>
        </View>
      </View>

      {/* 3 Macro Pills (Matching the exact Protein, Carbs, Fat pills in the reference image!) */}
      <View style={styles.macroPillsRow}>
        {/* Polity Pill */}
        <View style={[styles.macroPill, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
          <View style={styles.macroPillHeader}>
            <View style={[styles.miniDot, { backgroundColor: '#EA580C' }]} />
            <Text style={styles.macroPillValue}>78%</Text>
          </View>
          <Text style={styles.macroPillLabel}>Polity</Text>
          <Text style={styles.macroPillSub}>34/43 Qs</Text>
        </View>

        {/* Economy Pill */}
        <View style={[styles.macroPill, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
          <View style={styles.macroPillHeader}>
            <View style={[styles.miniDot, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.macroPillValue}>72%</Text>
          </View>
          <Text style={styles.macroPillLabel}>Economy</Text>
          <Text style={styles.macroPillSub}>28/40 Qs</Text>
        </View>

        {/* History Pill */}
        <View style={[styles.macroPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <View style={styles.macroPillHeader}>
            <View style={[styles.miniDot, { backgroundColor: '#059669' }]} />
            <Text style={styles.macroPillValue}>65%</Text>
          </View>
          <Text style={styles.macroPillLabel}>History</Text>
          <Text style={styles.macroPillSub}>22/35 Qs</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: PrelimsTheme.radius.card,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PrelimsTheme.colors.borderCard,
    ...PrelimsTheme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: PrelimsTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    position: 'relative',
    marginVertical: 4,
  },
  svg: {
    position: 'absolute',
  },
  gaugeCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeBigNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  gaugeSublabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PrelimsTheme.colors.textSecondary,
    marginTop: 2,
  },
  readinessBadge: {
    marginTop: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  readinessBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  macroPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  macroPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroPillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
  },
  macroPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PrelimsTheme.colors.textSecondary,
  },
  macroPillSub: {
    fontSize: 10,
    color: PrelimsTheme.colors.textMuted,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
