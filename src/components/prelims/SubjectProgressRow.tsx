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
  isDark = true,
  onPress,
}: SubjectProgressRowProps) {
  const colors = {
    cardBg: isDark ? '#25272D' : '#FFFFFF',
    cardBorder: isDark ? '#35373F' : '#E8E9F1',
    serialBg: isDark ? '#2A2C33' : '#F8F9FE',
    serialBorder: isDark ? '#35373F' : '#E8E9F1',
    serialText: isDark ? '#A7ABB5' : '#71727A',
    textPrimary: isDark ? '#F5F5F7' : '#1F2024',
    textSecondary: isDark ? '#A7ABB5' : '#71727A',
    progressTrack: isDark ? '#343740' : '#E8E9F1',
    divider: isDark ? '#30323A' : '#E8E9F1',
    chevron: isDark ? '#71727A' : '#9CA3AF',
    pressedBg: isDark ? '#2B2D35' : '#F1F3F9',
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
  const { icon: IconComponent, color, bg } = useMemo(() => {
    switch (subject.id) {
      // GS1 Subjects
      case 'history_culture':
        return { icon: Landmark, color: '#E06A62', bg: '#E06A62' };
      case 'geography':
        return { icon: Globe, color: '#2F80ED', bg: '#2F80ED' };
      case 'polity_governance':
        return { icon: Scale, color: '#9B51E0', bg: '#9B51E0' };
      case 'economy':
        return { icon: ChartNoAxesCombined, color: '#F2994A', bg: '#F2994A' };
      case 'environment_ecology':
        return { icon: Leaf, color: '#35C98A', bg: '#35C98A' };
      case 'science_tech':
      case 'science_technology':
        return { icon: FlaskConical, color: '#2D9CDB', bg: '#2D9CDB' };
      case 'current_affairs_misc':
        return { icon: Newspaper, color: '#8257E6', bg: '#8257E6' };

      // CSAT Subjects
      case 'csat_reading_comprehension':
      case 'csat_reading_comp':
        return { icon: BookOpen, color: '#2F80ED', bg: '#2F80ED' };
      case 'csat_reasoning':
      case 'csat_logical_reasoning':
        return { icon: Scale, color: '#9B51E0', bg: '#9B51E0' };
      case 'csat_quant_numeracy':
      case 'csat_quantitative_aptitude':
        return { icon: ChartNoAxesCombined, color: '#F2994A', bg: '#F2994A' };
      case 'csat_data_interpretation':
        return { icon: Layers, color: '#35C98A', bg: '#35C98A' };

      default:
        return { icon: BookOpen, color: '#2F80ED', bg: '#2F80ED' };
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

          <View style={[styles.iconTile, { backgroundColor: bg }]}>
            <IconComponent size={20} color="#FFFFFF" strokeWidth={2.2} />
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
      <View style={[styles.iconTile, { backgroundColor: bg }]}>
        <IconComponent size={20} color="#FFFFFF" strokeWidth={2.2} />
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
    backgroundColor: '#25272D',
    borderWidth: 1,
    borderColor: '#35373F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 16,
  },
  cardRowMobile: {
    backgroundColor: '#25272D',
    borderWidth: 1,
    borderColor: '#35373F',
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
    borderTopColor: '#30323A',
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
    backgroundColor: '#2A2C33',
    borderWidth: 1,
    borderColor: '#35373F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7ABB5',
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
    color: '#F5F5F7',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subjectSubtitle: {
    fontSize: 12,
    color: '#A7ABB5',
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
    backgroundColor: '#343740',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5F5F7',
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
    color: '#F5F5F7',
    letterSpacing: -0.2,
  },
  solvedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A7ABB5',
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
    color: '#F5F5F7',
  },
  solvedTotal: {
    color: '#A7ABB5',
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
    backgroundColor: '#2B2D35',
  },
});

