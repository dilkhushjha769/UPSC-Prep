import React, { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  CircleCheck,
  FlaskConical,
  Globe,
  Landmark,
  Layers,
  Leaf,
  Newspaper,
  Scale,
} from 'lucide-react-native';
import { Subject } from '@/types/prelims';
import { usePrelimsTheme } from '@/constants/prelimsTheme';

interface SubjectProgressRowProps {
  subject: Subject;
  serialNumber: number;
  solvedCount: number;
  totalQuestions: number;
  isDark?: boolean;
  onPress: (subject: Subject) => void;
}

export function SubjectProgressRow({
  subject,
  serialNumber,
  solvedCount,
  totalQuestions,
  isDark: propIsDark,
  onPress,
}: SubjectProgressRowProps) {
  const prelimsTheme = usePrelimsTheme();
  const isDark = propIsDark !== undefined ? propIsDark : prelimsTheme.isDark;
  const colors = {
    cardBg: isDark ? '#141C28' : '#FFFFFF',
    cardBorder: isDark ? '#253244' : '#EAE5DC',
    serialBg: isDark ? '#141C28' : '#FAF9F6',
    serialBorder: isDark ? '#253244' : '#EAE5DC',
    serialText: isDark ? '#9DA8B9' : '#7A8499',
    textPrimary: isDark ? '#F0F4F8' : '#1C2433',
    textSecondary: isDark ? '#9DA8B9' : '#7A8499',
    progressTrack: isDark ? '#253244' : '#EAE5DC',
    divider: isDark ? '#253244' : '#EAE5DC',
    chevron: isDark ? '#6E7A8E' : '#8892A6',
    pressedBg: isDark ? '#1B2534' : '#E9EDF9',
  };
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const isMobile = containerWidth > 0 ? containerWidth < 680 : windowWidth < 768;

  const formattedSerial = String(serialNumber).padStart(2, '0');
  const count = totalQuestions > 0 ? totalQuestions : subject.totalQuestions10Yrs;
  const percentage = count > 0 ? Math.min(100, Math.round((solvedCount / count) * 100)) : 0;

  // Resolve Subject-Specific Icon and Color Configuration
  const { icon: IconComponent, color } = useMemo(() => {
    switch (subject.id) {
      // GS1 Subjects
      case 'history_culture':
        return { icon: Landmark, color: '#E0675B', bg: '#E0675B' };
      case 'geography':
        return { icon: Globe, color: '#FF9500', bg: '#FF9500' };
      case 'polity_governance':
        return { icon: Scale, color: '#5B6B99', bg: '#5B6B99' };
      case 'economy':
        return { icon: ChartNoAxesCombined, color: '#FF9500', bg: '#FF9500' };
      case 'environment_ecology':
        return { icon: Leaf, color: '#3FA573', bg: '#3FA573' };
      case 'science_tech':
      case 'science_technology':
        return { icon: FlaskConical, color: '#3D5A99', bg: '#3D5A99' };
      case 'current_affairs_misc':
        return { icon: Newspaper, color: '#7C93D1', bg: '#7C93D1' };

      // CSAT Subjects
      case 'csat_reading_comprehension':
      case 'csat_reading_comp':
        return { icon: BookOpen, color: '#FF9500', bg: '#FF9500' };
      case 'csat_reasoning':
      case 'csat_logical_reasoning':
        return { icon: Scale, color: '#5B6B99', bg: '#5B6B99' };
      case 'csat_quant_numeracy':
      case 'csat_quantitative_aptitude':
        return { icon: ChartNoAxesCombined, color: '#FF9500', bg: '#FF9500' };
      case 'csat_data_interpretation':
        return { icon: Layers, color: '#3FA573', bg: '#3FA573' };

      default:
        return { icon: BookOpen, color: '#FF9500', bg: '#FF9500' };
    }
  }, [subject.id]);

  if (isMobile) {
    return (
      <Pressable
        onLayout={handleLayout}
        style={({ pressed }) => [
          styles.cardRowMobile,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          pressed && { backgroundColor: colors.pressedBg, opacity: 0.9 },
          Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
        ]}
        onPress={() => onPress(subject)}
        accessibilityRole="button"
        accessibilityLabel={`${subject.title}, ${percentage}% completed, ${solvedCount} of ${count} questions solved`}
      >
        {/* Mobile Top Row: Serial + Icon + Title & Chapters + Chevron */}
        <View style={styles.mobileTopRow}>
          <View style={[styles.serialBox, { backgroundColor: colors.serialBg, borderColor: colors.serialBorder }]}>
            <Text style={[styles.serialText, { color: colors.serialText }]}>{formattedSerial}</Text>
          </View>

          <View style={[styles.iconTile, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE', borderColor: isDark ? '#253244' : '#EAE5DC', borderWidth: 1 }]}>
            <IconComponent size={20} color={isDark ? '#FF9500' : '#EA8300'} strokeWidth={2.2} />
          </View>

          <View style={styles.mobileTitleBlock}>
            <Text style={[styles.subjectTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {subject.title}
            </Text>
            <Text style={[styles.subjectSubtitle, { color: colors.textSecondary }]}>
              {subject.chapters.length} Chapters • {count.toLocaleString()} Questions
            </Text>
          </View>

          <View style={styles.chevronBox}>
            <ChevronRight size={18} color={colors.chevron} strokeWidth={2} />
          </View>
        </View>

        {/* Mobile Bottom Row: Progress Bar + Percentage & Solved Count */}
        <View style={[styles.mobileBottomRow, { borderTopColor: colors.divider }]}>
          {/* Progress Bar & Percentage */}
          <View style={styles.mobileProgressGroup}>
            <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentage}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.percentText, { color: colors.textPrimary }]}>{percentage}%</Text>
          </View>

          {/* Solved Status */}
          <View style={styles.solvedGroup}>
            <CircleCheck size={16} color={color} strokeWidth={2.4} />
            <Text style={styles.solvedTextInline}>
              <Text style={[styles.solvedCount, { color: colors.textPrimary }]}>{solvedCount}</Text>
              <Text style={[styles.solvedTotal, { color: colors.textSecondary }]}> / {count} Solved</Text>
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Desktop / Tablet Row Layout
  return (
    <Pressable
      onLayout={handleLayout}
      style={({ pressed }) => [
        styles.cardRow,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        pressed && { backgroundColor: colors.pressedBg, opacity: 0.9 },
        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
      ]}
      onPress={() => onPress(subject)}
      accessibilityRole="button"
      accessibilityLabel={`${subject.title}, ${percentage}% completed, ${solvedCount} of ${count} questions solved`}
    >
      {/* 1. Monochromatic Serial Number Box */}
      <View style={[styles.serialBox, { backgroundColor: colors.serialBg, borderColor: colors.serialBorder }]}>
        <Text style={[styles.serialText, { color: colors.serialText }]}>{formattedSerial}</Text>
      </View>

      {/* 2. Colored Subject Icon Tile */}
      <View style={[styles.iconTile, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE', borderColor: isDark ? '#253244' : '#EAE5DC', borderWidth: 1 }]}>
        <IconComponent size={20} color={isDark ? '#FF9500' : '#EA8300'} strokeWidth={2.2} />
      </View>

      {/* 3. Subject Name & Chapters Count */}
      <View style={styles.subjectInfoBlock}>
        <Text style={[styles.subjectTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {subject.title}
        </Text>
        <Text style={[styles.subjectSubtitle, { color: colors.textSecondary }]}>
          {subject.chapters.length} Chapters • {count.toLocaleString()} Questions
        </Text>
      </View>

      {/* 4. Horizontal Progress Bar & Percentage */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.percentText, { color: colors.textPrimary }]}>{percentage}%</Text>
      </View>

      {/* 5. Solved Questions Status Metric */}
      <View style={styles.solvedBadge}>
        <CircleCheck size={18} color={color} strokeWidth={2.4} />
        <View style={styles.solvedTextStack}>
          <Text style={[styles.solvedRatio, { color: colors.textPrimary }]}>
            {solvedCount} / {count}
          </Text>
          <Text style={[styles.solvedLabel, { color: colors.textSecondary }]}>Solved</Text>
        </View>
      </View>

      {/* 6. Right Navigation Chevron */}
      <View style={styles.chevronBox}>
        <ChevronRight size={18} color={colors.chevron} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 16,
  },
  cardRowMobile: {
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileTitleBlock: {
    flex: 1,
  },
  mobileBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1B2534',
    gap: 12,
  },
  mobileProgressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  serialBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9DA8B9',
    letterSpacing: -0.2,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfoBlock: {
    flex: 2,
    minWidth: 180,
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0F4F8',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subjectSubtitle: {
    fontSize: 12,
    color: '#9DA8B9',
    fontWeight: '500',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1.6,
    minWidth: 160,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1B2534',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F4F8',
    minWidth: 36,
    textAlign: 'right',
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 110,
  },
  solvedTextStack: {},
  solvedRatio: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F4F8',
    letterSpacing: -0.2,
  },
  solvedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9DA8B9',
  },
  solvedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solvedTextInline: {
    fontSize: 12,
  },
  solvedCount: {
    fontWeight: '700',
    color: '#F0F4F8',
  },
  solvedTotal: {
    color: '#9DA8B9',
    fontWeight: '500',
  },
  chevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: '#1B2534',
  },
});

