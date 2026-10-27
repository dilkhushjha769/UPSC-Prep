import React, { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Calendar } from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface PrelimsCountdownCardProps {
  isDark: boolean;
  onOpenPrelims?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  targetFormatted: string;
}

function calculateRemaining(targetDateStr: string): TimeRemaining {
  // Target UPSC CSE Prelims Paper 1 start: 09:30 AM IST
  let targetTime = new Date(`${targetDateStr}T09:30:00`).getTime();
  if (isNaN(targetTime)) {
    // Fallback to May 23, 2027
    targetTime = new Date('2027-05-23T09:30:00').getTime();
  }

  const now = Date.now();
  const diffMs = Math.max(0, targetTime - now);

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const d = new Date(targetTime);
  const targetFormatted = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return { days, hours, minutes, seconds, targetFormatted };
}

// =============================================================================
// STOPWATCH TIMER ICON (Exact match to User Reference Image 2)
// =============================================================================

function StopwatchTimerIcon({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? '#FFFFFF' : '#09090B';
  const sectorFill = isDark ? '#FFFFFF' : '#09090B';

  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      {/* Top T-Bar Crown Button */}
      <Line x1="9" y1="2" x2="15" y2="2" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="2" x2="12" y2="5" stroke={stroke} strokeWidth="2.2" />

      {/* Top-Right Angled Lap Button */}
      <Line x1="17.5" y1="6.5" x2="19.5" y2="4.5" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />

      {/* Main Circular Stopwatch Rim */}
      <Circle
        cx="12"
        cy="13.5"
        r="8"
        stroke={stroke}
        strokeWidth="2.2"
      />

      {/* Inner Elapsed Timer Wedge/Sector (From 12 o'clock to 4:30) */}
      <Path
        d="M 12 13.5 L 12 8 A 5.5 5.5 0 0 1 15.9 17.4 Z"
        fill={sectorFill}
      />
    </Svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PrelimsCountdownCard({ isDark, onOpenPrelims }: PrelimsCountdownCardProps) {
  const { config } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 640;

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateRemaining(config.targetExamDate || '2027-05-23')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateRemaining(config.targetExamDate || '2027-05-23'));
    }, 1000);

    return () => clearInterval(timer);
  }, [config.targetExamDate]);

  const units = [
    { label: 'DAYS', value: timeLeft.days, isHero: true },
    { label: isDesktop ? 'HOURS' : 'HR', value: String(timeLeft.hours).padStart(2, '0'), isHero: false },
    { label: isDesktop ? 'MINS' : 'MIN', value: String(timeLeft.minutes).padStart(2, '0'), isHero: false },
    { label: isDesktop ? 'SECS' : 'SEC', value: String(timeLeft.seconds).padStart(2, '0'), isHero: false },
  ];

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: theme.cardBg,
          borderColor: isDark ? '#2D3444' : theme.cardBorder,
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'center' : 'stretch',
        },
        Platform.OS === 'web' && ({
          boxShadow: isDark
            ? '0 2px 10px rgba(0, 0, 0, 0.22)'
            : '0 1px 4px rgba(0, 0, 0, 0.04)',
        } as object),
      ]}>
      {/* Top Header Row (Mobile: Space Between Left & Right; Desktop: Inline Left Group) */}
      <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
        <TouchableOpacity
          activeOpacity={onOpenPrelims ? 0.75 : 1}
          onPress={onOpenPrelims}
          disabled={!onOpenPrelims}
          style={styles.titleGroup}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F4F4F5',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.20)' : '#E4E4E7',
              },
            ]}>
            <StopwatchTimerIcon isDark={isDark} />
          </View>
          <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>
            UPSC Prelims {config.targetExamYear || 2027}
          </Text>
          {Boolean(onOpenPrelims) && (
            <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700' }}>→</Text>
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: isDark ? '#1F2430' : '#F4F4F5',
              borderColor: isDark ? '#313849' : '#E4E4E7',
            },
          ]}>
          <Calendar size={10} color={isDark ? '#F0E2D5' : '#71717A'} />
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {timeLeft.targetFormatted}
          </Text>
        </View>
      </View>

      {/* Timer Row: Centered snug pills on mobile, compact right group on desktop */}
      <View style={[styles.timerRow, isDesktop ? styles.timerRowDesktop : styles.timerRowMobile]}>
        {units.map((unit, index) => {
          const isLast = index === units.length - 1;

          let boxBg = isDark ? '#1F2024' : '#F8F9FE';
          let boxBorder = isDark ? '#494A50' : '#E8E9F1';
          let numColor: string = theme.textPrimary;
          let labelColor: string = theme.textMuted;

          if (unit.isHero) {
            boxBg = '#006FFD';
            boxBorder = '#006FFD';
            numColor = '#FFFFFF';
            labelColor = '#FFFFFF';
          }

          return (
            <React.Fragment key={unit.label}>
              <View
                style={[
                  styles.pillBox,
                  {
                    backgroundColor: boxBg,
                    borderColor: boxBorder,
                  },
                  Platform.OS === 'web' && unit.isHero && ({
                    boxShadow: isDark
                      ? '0 1px 4px rgba(0, 0, 0, 0.35)'
                      : '0 2px 6px rgba(0, 0, 0, 0.16)',
                  } as object),
                ]}>
                <Text style={[styles.pillNumber, { color: numColor }]}>
                  {unit.value}
                </Text>
                <Text style={[styles.pillLabel, { color: labelColor }]}>
                  {unit.label}
                </Text>
              </View>

              {!isLast && (
                <View style={styles.colonWrapper}>
                  <View
                    style={[
                      styles.colonDot,
                      {
                        backgroundColor: isDark
                          ? index === 0
                            ? '#FFFFFF'
                            : '#4F4036'
                          : index === 0
                          ? '#09090B'
                          : '#D9C7B8',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.colonDot,
                      {
                        backgroundColor: isDark
                          ? index === 0
                            ? '#FFFFFF'
                            : '#4F4036'
                          : index === 0
                          ? '#09090B'
                          : '#D9C7B8',
                      },
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerRowDesktop: {
    width: 'auto',
    gap: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerRowDesktop: {
    gap: 4,
  },
  timerRowMobile: {
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 3,
  },
  pillBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 2.5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
  },
  pillNumber: {
    fontSize: 12.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  pillLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  colonWrapper: {
    paddingHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2.5,
  },
  colonDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
});
