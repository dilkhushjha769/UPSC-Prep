import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface ExamReadinessCardProps {
  isDark: boolean;
  onOpenPrelims?: () => void;
}

// =============================================================================
// REFINED VECTOR ILLUSTRATIONS (Pixel-Perfect, Faithful to Reference Images)
// =============================================================================

/** Prelims: Exam Question Paper with Target Reticle Check */
function PrelimsIllustration({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? '#FF8A3D' : '#1F1612';
  const paperFill = isDark ? '#E85A0C' : '#BAE6FD';
  const lineStroke = isDark ? '#FFFFFF' : '#1F1612';
  const targetBg = isDark ? '#1F1612' : '#FFFFFF';
  const targetBorder = isDark ? '#FF8A3D' : '#1F1612';
  const targetDot = isDark ? '#FF8A3D' : '#E85A0C';

  return (
    <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      {/* Paper Sheet */}
      <Rect
        x="6"
        y="4"
        width="22"
        height="28"
        rx="3.5"
        fill={paperFill}
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Question Lines */}
      <Line x1="11" y1="10" x2="19" y2="10" stroke={lineStroke} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="11" y1="15" x2="23" y2="15" stroke={lineStroke} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="11" y1="20" x2="20" y2="20" stroke={lineStroke} strokeWidth="1.6" strokeLinecap="round" />

      {/* Target check circle on sheet */}
      <Circle cx="24" cy="24" r="4.5" fill={targetBg} stroke={targetBorder} strokeWidth="1.6" />
      <Circle cx="24" cy="24" r="1.8" fill={targetDot} />
    </Svg>
  );
}

/** Mains: Checklist Clipboard with Angled Pen (Exact match to User Reference Image 1) */
function MainsIllustration({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? '#FFF8F2' : '#1F1612';
  const accent = isDark ? '#C084FC' : '#FF6A13';
  const penBody = isDark ? '#FF8A3D' : '#FFC9A3';

  return (
    <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      {/* Clipboard Main Body */}
      <Path
        d="M 14 5 C 14 7, 16 8, 18 8 C 20 8, 22 7, 22 5 H 25 A 3.5 3.5 0 0 1 28.5 8.5 V 17 M 7.5 28 V 8.5 A 3.5 3.5 0 0 1 11 5 H 14"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom border of clipboard */}
      <Path
        d="M 7.5 28 A 3.5 3.5 0 0 0 11 31.5 H 16"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Top Clip Tab */}
      <Path
        d="M 15 5 H 21"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Row 1: Checkmark & Line */}
      <Path
        d="M 11 14.5 L 13.5 17 L 17.5 12"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="20" y1="14.5" x2="25" y2="14.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />

      {/* Row 2: Checkmark & Line */}
      <Path
        d="M 11 21.5 L 13.5 24 L 17.5 19"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="20" y1="21.5" x2="23" y2="21.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />

      {/* Angled Pen at bottom right (Matches Image 1) */}
      <G transform="translate(25, 25) rotate(-45)">
        <Rect
          x="-3.5"
          y="-9"
          width="7"
          height="13"
          rx="3.5"
          fill={penBody}
          stroke={stroke}
          strokeWidth="1.8"
        />
        <Line x1="-3.5" y1="-2.5" x2="3.5" y2="-2.5" stroke={stroke} strokeWidth="1.6" />
        <Path
          d="M -2.5 4 L 0 9 L 2.5 4 Z"
          fill={isDark ? '#FFF8F2' : stroke}
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Mock Tests: Question Paper with Overlapping Stopwatch Timer (Exact match to User Reference Image 2) */
function MockTestIllustration({ isDark }: { isDark: boolean }) {
  const paperBg = isDark ? '#1F242F' : '#FBEFE5';
  const paperBorder = isDark ? '#333D4F' : '#D9C7B8';
  const foldBg = isDark ? '#2D3545' : '#D9C7B8';
  const headerFill = isDark ? '#374151' : '#D9C7B8';
  const textLineFill = isDark ? '#4B5563' : '#D9C7B8';
  const blueBox = isDark ? '#FF8A3D' : '#E85A0C';
  const amberBox = isDark ? '#FBBF24' : '#F59E0B';

  const clockBody = isDark ? '#F59E0B' : '#F6C15C';
  const clockBorder = isDark ? '#FBBF24' : '#D97706';
  const crownColor = isDark ? '#FBBF24' : '#B45309';
  const tickColor = isDark ? '#78350F' : '#D97706';
  const handColor = '#FFFFFF';

  return (
    <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      {/* Background Exam Paper Sheet */}
      <Path
        d="M 5 3 H 20 L 27 10 V 31 A 2.5 2.5 0 0 1 24.5 33.5 H 5 A 2.5 2.5 0 0 1 2.5 31 V 5.5 A 2.5 2.5 0 0 1 5 3 Z"
        fill={paperBg}
        stroke={paperBorder}
        strokeWidth="1"
      />
      {/* Fold corner */}
      <Path
        d="M 20 3 V 10 H 27 Z"
        fill={foldBg}
        stroke={paperBorder}
        strokeWidth="1"
      />

      {/* Header Bar */}
      <Rect x="5.5" y="5.5" width="12" height="3.5" rx="1" fill={headerFill} />

      {/* Row 1: Blue Square + Lines */}
      <Rect x="5.5" y="11.5" width="3.5" height="3.5" rx="0.8" fill={blueBox} />
      <Rect x="11" y="12" width="7" height="1.2" rx="0.6" fill={textLineFill} />
      <Rect x="11" y="14" width="5.5" height="1.2" rx="0.6" fill={textLineFill} />

      {/* Row 2: Amber Square + Lines */}
      <Rect x="5.5" y="16.5" width="3.5" height="3.5" rx="0.8" fill={amberBox} />
      <Rect x="11" y="17" width="7" height="1.2" rx="0.6" fill={textLineFill} />
      <Rect x="11" y="19" width="5" height="1.2" rx="0.6" fill={textLineFill} />

      {/* Row 3: Blue Square + Lines */}
      <Rect x="5.5" y="21.5" width="3.5" height="3.5" rx="0.8" fill={blueBox} />
      <Rect x="11" y="22" width="5" height="1.2" rx="0.6" fill={textLineFill} />

      {/* Row 4: Amber Square + Lines */}
      <Rect x="5.5" y="26.5" width="3.5" height="3.5" rx="0.8" fill={amberBox} />
      <Rect x="11" y="27" width="4.5" height="1.2" rx="0.6" fill={textLineFill} />

      {/* Overlapping Stopwatch Timer in Bottom Right */}
      <Path
        d="M 21.5 15.5 H 27.5 M 24.5 15.5 V 17.5"
        stroke={crownColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Golden Dial Body */}
      <Circle
        cx="24.5"
        cy="25.5"
        r="8.5"
        fill={clockBody}
        stroke={clockBorder}
        strokeWidth="1.3"
      />

      {/* 4 Dial Dots at 12, 3, 6, 9 */}
      <Circle cx="24.5" cy="19.5" r="0.7" fill={tickColor} />
      <Circle cx="30.5" cy="25.5" r="0.7" fill={tickColor} />
      <Circle cx="24.5" cy="31.5" r="0.7" fill={tickColor} />
      <Circle cx="18.5" cy="25.5" r="0.7" fill={tickColor} />

      {/* White Clock Hands: 12 and 7 o'clock */}
      <Line x1="24.5" y1="25.5" x2="24.5" y2="20.5" stroke={handColor} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="24.5" y1="25.5" x2="22" y2="28.5" stroke={handColor} strokeWidth="1.6" strokeLinecap="round" />
      <Circle cx="24.5" cy="25.5" r="1.1" fill={handColor} />
    </Svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExamReadinessCard({ isDark, onOpenPrelims }: ExamReadinessCardProps) {
  const { setIsMCQModalOpen, setIsMainsModalOpen } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 640;

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const examModules = [
    {
      id: 'prelims',
      title: 'Prelims',
      subtitle: 'Real Exam Pattern & MCQs',
      illustration: PrelimsIllustration,
      badgeBg: isDark ? 'rgba(0, 111, 253, 0.16)' : '#EAF2FF',
      badgeBorder: isDark ? '#385885' : '#B4DBFF',
      borderHover: '#006FFD',
      glow: 'rgba(0, 111, 253, 0.2)',
      onPress: () => (onOpenPrelims ? onOpenPrelims() : setIsMCQModalOpen(true)),
    },
    {
      id: 'mains',
      title: 'Mains',
      subtitle: 'Answer Writing & Models',
      illustration: MainsIllustration,
      badgeBg: isDark ? 'rgba(40, 151, 255, 0.14)' : '#EAF2FF',
      badgeBorder: isDark ? '#385885' : '#B4DBFF',
      borderHover: '#2897FF',
      glow: 'rgba(40, 151, 255, 0.18)',
      onPress: () => setIsMainsModalOpen(true),
    },
    {
      id: 'mock',
      title: 'Mock Tests',
      subtitle: 'Smart Performance Analysis',
      illustration: MockTestIllustration,
      badgeBg: isDark ? 'rgba(111, 186, 255, 0.14)' : '#EAF2FF',
      badgeBorder: isDark ? '#385885' : '#B4DBFF',
      borderHover: '#6FBAFF',
      glow: 'rgba(111, 186, 255, 0.18)',
      onPress: () => setIsMCQModalOpen(true),
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          UPSC Exam Modules
        </Text>
        <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
          Tap any module to begin practice
        </Text>
      </View>

      {/* Clean Aesthetic Grid (Balanced Rectangles, Unified Theme Card Surfaces) */}
      <View style={[styles.cardsGrid, !isDesktop && styles.cardsGridMobile]}>
        {examModules.map((item) => {
          const Illustration = item.illustration;
          const isHovered = hoveredId === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={item.onPress}
              {...(Platform.OS === 'web'
                ? {
                    onMouseEnter: () => setHoveredId(item.id),
                    onMouseLeave: () => setHoveredId(null),
                  }
                : {})}
              style={[
                styles.cardBase,
                isDesktop ? styles.cardDesktop : styles.cardMobile,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isHovered ? item.borderHover : theme.cardBorder,
                },
                Platform.OS === 'web' && ({
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                } as object),
                isHovered && Platform.OS === 'web' && ({
                  transform: [{ translateY: -3 }],
                  boxShadow: `0 8px 24px ${item.glow}`,
                } as object),
              ]}>
              {/* Refined Squircle Icon Badge */}
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: item.badgeBg,
                    borderColor: item.badgeBorder,
                  },
                ]}>
                <Illustration isDark={isDark} />
              </View>

              {/* Title & Subtitle */}
              <View style={[styles.textGroup, !isDesktop && styles.textGroupMobile]}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      fontSize: isDesktop ? 16 : 15,
                      color: theme.textPrimary,
                    },
                  ]}
                  numberOfLines={1}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    {
                      fontSize: isDesktop ? 12 : 11.5,
                      color: theme.textSecondary,
                    },
                  ]}
                  numberOfLines={isDesktop ? 2 : 1}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  cardsGridMobile: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
  },
  cardBase: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  cardDesktop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 125,
    gap: 10,
  },
  cardMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  textGroupMobile: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
    flex: 1,
    paddingHorizontal: 0,
  },
  cardTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
    lineHeight: 16,
  },
});
