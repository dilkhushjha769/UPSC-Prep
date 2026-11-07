/**
 * VisualLearningSection.tsx
 *
 * Visual Learning Experience for UPSC Current Affairs:
 * Replaces lengthy paragraphs with interactive, educational visual blocks:
 * 1. Infographics: Verified statistics, government scheme indicators, comparisons.
 * 2. Maps & Geographical Visuals: Countries, rivers, borders, straits, protected regions.
 * 3. Flowcharts & Process Diagrams: Parliamentary procedures, constitutional mechanisms, policy flows.
 * 4. Timelines: Chronological milestones, historical developments, legal evolution.
 * 5. Comparison Tables: Side-by-side parameter comparisons (e.g., Old vs New norms).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
    useWindowDimensions,
  Platform,
} from 'react-native';
import {
  BarChart3,
  Compass,
    GitFork,
    TrendingUp,
  MapPin,
  Clock,
  Columns,
  CheckCircle2,
} from 'lucide-react-native';
import {
  VisualLearningAsset,
  InfographicData,
  MapVisualData,
  FlowchartData,
  TimelineData,
  ComparisonData,
} from '@/data/currentAffairsData';
import { useAppTheme } from '@/context/ThemeContext';
import { BW_THEME } from '@/constants/bwTheme';

interface VisualLearningSectionProps {
  assets?: VisualLearningAsset[];
  isDark?: boolean;
}

export function VisualLearningSection({
  assets = [],
  isDark: propIsDark,
}: VisualLearningSectionProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 720;

  if (!assets || assets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Visual Learning Section Header */}
      <View style={styles.mainHeaderRow}>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.sectionBadge, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : '#FFF7ED' }]}>
            <Text style={styles.sectionBadgeText}>VISUAL LEARNING MODULE</Text>
          </View>
          <Text style={[styles.mainSectionTitle, { color: theme.textPrimary }]}>
            Infographics, Process Flows & Key Visuals
          </Text>
          <Text style={[styles.mainSectionSubtitle, { color: theme.textSecondary }]}>
            High-yield visual synthesis designed for rapid concept retention and answer-writing.
          </Text>
        </View>
      </View>

      {/* Render Each Visual Learning Asset */}
      <View style={styles.assetsList}>
        {assets.map((asset) => {
          switch (asset.type) {
            case 'infographic':
              return asset.infographic ? (
                <InfographicBlock
                  key={asset.id}
                  data={asset.infographic}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              ) : null;

            case 'map_visual':
              return asset.mapVisual ? (
                <MapVisualBlock
                  key={asset.id}
                  data={asset.mapVisual}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              ) : null;

            case 'flowchart':
              return asset.flowchart ? (
                <FlowchartBlock
                  key={asset.id}
                  data={asset.flowchart}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              ) : null;

            case 'timeline':
              return asset.timeline ? (
                <TimelineBlock
                  key={asset.id}
                  data={asset.timeline}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              ) : null;

            case 'comparison':
              return asset.comparison ? (
                <ComparisonBlock
                  key={asset.id}
                  data={asset.comparison}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              ) : null;

            default:
              return null;
          }
        })}
      </View>
    </View>
  );
}

// ============================================================================
// 1. INFOGRAPHIC BLOCK
// ============================================================================

function InfographicBlock({
  data,
  isDark,
  isDesktop,
}: {
  data: InfographicData;
  isDark: boolean;
  isDesktop: boolean;
}) {
  return (
    <View
      style={[
        styles.blockCard,
        {
          backgroundColor: isDark ? '#141C28' : '#FFFFFF',
          borderColor: isDark ? '#253244' : '#EAE5DC',
        },
      ]}
    >
      <View style={styles.blockTitleRow}>
        <View style={[styles.blockIconPill, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE' }]}>
          <BarChart3 size={16} color="#FF9500" strokeWidth={2.2} />
        </View>
        <View style={styles.blockTitleTextWrap}>
          <Text style={[styles.blockTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {data.title}
          </Text>
          {Boolean(data.subtitle) && (
            <Text style={[styles.blockSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {data.subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Grid of verified key statistics */}
      <View style={[styles.statsGrid, isDesktop ? styles.statsGridDesktop : styles.statsGridMobile]}>
        {data.stats.map((stat, idx) => (
          <View
            key={`stat-${idx}`}
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? '#1B2534' : '#FAF9F6',
                borderColor: isDark ? '#2A374A' : '#EAE5DC',
              },
            ]}
          >
            <View style={styles.statTopRow}>
              <Text style={[styles.statValue, { color: stat.accent || '#FF9500' }]}>
                {stat.value}
              </Text>
              {Boolean(stat.change) && (
                <View style={[styles.changeBadge, { backgroundColor: isDark ? '#1A3326' : '#E3F1E8' }]}>
                  <TrendingUp size={11} color="#3FA573" strokeWidth={2.5} />
                  <Text style={[styles.changeText, { color: '#3FA573' }]}>{stat.change}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.statLabel, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
              {stat.label}
            </Text>
            {Boolean(stat.subtext) && (
              <Text style={[styles.statSubtext, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {stat.subtext}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Notes / Caveats */}
      {Boolean(data.notes && data.notes.length > 0) && (
        <View style={[styles.notesContainer, { borderTopColor: isDark ? '#253244' : '#EAE5DC' }]}>
          {data.notes!.map((note, idx) => (
            <View key={`note-${idx}`} style={styles.noteItem}>
              <View style={[styles.noteBullet, { backgroundColor: '#FF9500' }]} />
              <Text style={[styles.noteText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {note}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// 2. MAP & GEOGRAPHICAL VISUAL BLOCK
// ============================================================================

function MapVisualBlock({
  data,
  isDark,
  isDesktop,
}: {
  data: MapVisualData;
  isDark: boolean;
  isDesktop: boolean;
}) {
  return (
    <View
      style={[
        styles.blockCard,
        {
          backgroundColor: isDark ? '#141C28' : '#FFFFFF',
          borderColor: isDark ? '#253244' : '#EAE5DC',
        },
      ]}
    >
      <View style={styles.blockTitleRow}>
        <View style={[styles.blockIconPill, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE' }]}>
          <Compass size={16} color="#3FA573" strokeWidth={2.2} />
        </View>
        <View style={styles.blockTitleTextWrap}>
          <Text style={[styles.blockTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {data.title}
          </Text>
          <View style={styles.geoPillRow}>
            <View style={[styles.locationBadge, { backgroundColor: isDark ? '#1C2E24' : '#E3F1E8' }]}>
              <MapPin size={11} color="#3FA573" strokeWidth={2.5} />
              <Text style={[styles.locationBadgeText, { color: '#3FA573' }]}>{data.locationName}</Text>
            </View>
            <Text style={[styles.regionText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {data.region}
            </Text>
          </View>
        </View>
      </View>

      {/* Strategic Geographic Importance Card */}
      <View
        style={[
          styles.geoHighlightBox,
          {
            backgroundColor: isDark ? '#1B2534' : '#F5F3EE',
            borderColor: isDark ? '#253244' : '#EAE5DC',
          },
        ]}
      >
        <Text style={[styles.geoHighlightTitle, { color: '#FF9500' }]}>
          UPSC GEOGRAPHY & STRATEGIC SIGNIFICANCE
        </Text>
        <Text style={[styles.geoHighlightBody, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
          {data.strategicImportance}
        </Text>
      </View>

      {/* Key Geographical Features */}
      <View style={[styles.featuresGrid, isDesktop ? styles.featuresGridDesktop : styles.featuresGridMobile]}>
        {data.keyFeatures.map((feat, idx) => (
          <View
            key={`feat-${idx}`}
            style={[
              styles.featureItem,
              {
                backgroundColor: isDark ? '#182232' : '#FAF9F6',
                borderColor: isDark ? '#253244' : '#EAE5DC',
              },
            ]}
          >
            <Text style={[styles.featureLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {feat.label}
            </Text>
            <Text style={[styles.featureValue, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
              {feat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// 3. FLOWCHART & PROCEDURAL DIAGRAM BLOCK
// ============================================================================

function FlowchartBlock({
  data,
  isDark,
  isDesktop,
}: {
  data: FlowchartData;
  isDark: boolean;
  isDesktop: boolean;
}) {
  return (
    <View
      style={[
        styles.blockCard,
        {
          backgroundColor: isDark ? '#141C28' : '#FFFFFF',
          borderColor: isDark ? '#253244' : '#EAE5DC',
        },
      ]}
    >
      <View style={styles.blockTitleRow}>
        <View style={[styles.blockIconPill, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE' }]}>
          <GitFork size={16} color="#60A5FA" strokeWidth={2.2} />
        </View>
        <View style={styles.blockTitleTextWrap}>
          <Text style={[styles.blockTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {data.title}
          </Text>
          <Text style={[styles.blockSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Step-by-step institutional mechanism & procedural flow
          </Text>
        </View>
      </View>

      {/* Sequential Flowchart Stepper */}
      <View style={styles.flowchartList}>
        {data.steps.map((step, idx) => {
          const isLast = idx === data.steps.length - 1;
          return (
            <View key={`step-${idx}`} style={styles.stepRow}>
              {/* Left Column: Number Node and Connecting Line */}
              <View style={styles.stepIndicatorCol}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isDark ? '#1B2534' : '#FFF7ED',
                      borderColor: '#FF9500',
                    },
                  ]}
                >
                  <Text style={styles.stepCircleText}>{step.stepNumber}</Text>
                </View>
                {!isLast && <View style={[styles.stepConnectorLine, { backgroundColor: isDark ? '#253244' : '#EAE5DC' }]} />}
              </View>

              {/* Right Column: Step Content Card */}
              <View
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: isDark ? '#1B2534' : '#FAF9F6',
                    borderColor: isDark ? '#253244' : '#EAE5DC',
                  },
                ]}
              >
                <View style={styles.stepCardHeader}>
                  <Text style={[styles.stepTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                    {step.title}
                  </Text>
                  {Boolean(step.authorityOrBody) && (
                    <View style={[styles.authorityBadge, { backgroundColor: isDark ? '#253244' : '#EAE5DC' }]}>
                      <Text style={[styles.authorityBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {step.authorityOrBody}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.stepDescription, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {step.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Expected Outcome */}
      {Boolean(data.outcome) && (
        <View style={[styles.outcomeBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#E9EDF9' }]}>
          <CheckCircle2 size={16} color="#38BDF8" strokeWidth={2.2} />
          <Text style={[styles.outcomeText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            <Text style={{ fontWeight: '700', color: '#38BDF8' }}>Final Mandate: </Text>
            {data.outcome}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// 4. TIMELINE BLOCK
// ============================================================================

function TimelineBlock({
  data,
  isDark,
  isDesktop,
}: {
  data: TimelineData;
  isDark: boolean;
  isDesktop: boolean;
}) {
  return (
    <View
      style={[
        styles.blockCard,
        {
          backgroundColor: isDark ? '#141C28' : '#FFFFFF',
          borderColor: isDark ? '#253244' : '#EAE5DC',
        },
      ]}
    >
      <View style={styles.blockTitleRow}>
        <View style={[styles.blockIconPill, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE' }]}>
          <Clock size={16} color="#FF9500" strokeWidth={2.2} />
        </View>
        <View style={styles.blockTitleTextWrap}>
          <Text style={[styles.blockTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {data.title}
          </Text>
          <Text style={[styles.blockSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Chronological legal evolution and key milestone developments
          </Text>
        </View>
      </View>

      {/* Timeline Stepper */}
      <View style={styles.timelineList}>
        {data.events.map((event, idx) => {
          const isLast = idx === data.events.length - 1;
          return (
            <View key={`time-${idx}`} style={styles.timelineRow}>
              {/* Left Pillar: Date Badge & Connecting Bar */}
              <View style={styles.timelinePillar}>
                <View style={[styles.dateBadge, { backgroundColor: '#FF9500' }]}>
                  <Text style={styles.dateBadgeText}>{event.yearOrDate}</Text>
                </View>
                {!isLast && <View style={[styles.timelineBar, { backgroundColor: isDark ? '#253244' : '#EAE5DC' }]} />}
              </View>

              {/* Right Pillar: Event Description */}
              <View
                style={[
                  styles.timelineCard,
                  {
                    backgroundColor: isDark ? '#1B2534' : '#FAF9F6',
                    borderColor: isDark ? '#253244' : '#EAE5DC',
                  },
                ]}
              >
                <Text style={[styles.timelineEventTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                  {event.title}
                </Text>
                <Text style={[styles.timelineEventDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {event.description}
                </Text>
                {Boolean(event.significance) && (
                  <View style={[styles.significanceBox, { backgroundColor: isDark ? '#141C28' : '#F5F3EE' }]}>
                    <Text style={[styles.significanceText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                      <Text style={{ fontWeight: '700', color: '#FF9500' }}>UPSC Angle: </Text>
                      {event.significance}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// 5. COMPARISON TABLE BLOCK
// ============================================================================

function ComparisonBlock({
  data,
  isDark,
  isDesktop,
}: {
  data: ComparisonData;
  isDark: boolean;
  isDesktop: boolean;
}) {
  return (
    <View
      style={[
        styles.blockCard,
        {
          backgroundColor: isDark ? '#141C28' : '#FFFFFF',
          borderColor: isDark ? '#253244' : '#EAE5DC',
        },
      ]}
    >
      <View style={styles.blockTitleRow}>
        <View style={[styles.blockIconPill, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE' }]}>
          <Columns size={16} color="#A78BFA" strokeWidth={2.2} />
        </View>
        <View style={styles.blockTitleTextWrap}>
          <Text style={[styles.blockTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {data.title}
          </Text>
          <Text style={[styles.blockSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Comparative breakdown: {data.subjectA} vs {data.subjectB}
          </Text>
        </View>
      </View>

      {/* Comparison Table */}
      <View style={[styles.tableContainer, { borderColor: isDark ? '#253244' : '#EAE5DC' }]}>
        {/* Table Header Row */}
        <View style={[styles.tableHeaderRow, { backgroundColor: isDark ? '#1B2534' : '#F5F3EE' }]}>
          <Text style={[styles.colHeader, { flex: 1.2, color: isDark ? '#94A3B8' : '#64748B' }]}>
            Parameter
          </Text>
          <Text style={[styles.colHeader, { flex: 1.4, color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {data.subjectA}
          </Text>
          <Text style={[styles.colHeader, { flex: 1.4, color: '#FF9500' }]}>
            {data.subjectB}
          </Text>
        </View>

        {/* Table Data Rows */}
        {data.rows.map((row, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <View
              key={`row-${idx}`}
              style={[
                styles.tableDataRow,
                {
                  backgroundColor: isEven
                    ? isDark ? '#141C28' : '#FFFFFF'
                    : isDark ? '#182232' : '#FAF9F6',
                  borderTopColor: isDark ? '#253244' : '#EAE5DC',
                },
              ]}
            >
              <Text style={[styles.paramCell, { flex: 1.2, color: isDark ? '#94A3B8' : '#64748B' }]}>
                {row.parameter}
              </Text>
              <Text style={[styles.dataCell, { flex: 1.4, color: isDark ? '#E2E8F0' : '#334155' }]}>
                {row.currentOrSubjectA}
              </Text>
              <Text style={[styles.dataCell, { flex: 1.4, color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '600' }]}>
                {row.proposedOrSubjectB}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
    gap: 16,
  },
  mainHeaderRow: {
    marginBottom: 4,
  },
  headerTitleWrap: {
    gap: 4,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionBadgeText: {
    color: '#FF9500',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  mainSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  mainSectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  assetsList: {
    gap: 16,
  },
  blockCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        } as object)
      : {
          elevation: 1,
        }),
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blockIconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTitleTextWrap: {
    flex: 1,
    gap: 2,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  blockSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  // Infographics
  statsGrid: {
    gap: 10,
  },
  statsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statsGridMobile: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  statSubtext: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  notesContainer: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  // Map Visual
  geoPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  regionText: {
    fontSize: 12,
  },
  geoHighlightBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  geoHighlightTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  geoHighlightBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  featuresGrid: {
    gap: 8,
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featuresGridMobile: {
    flexDirection: 'column',
  },
  featureItem: {
    flex: 1,
    minWidth: 180,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  featureValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Flowchart
  flowchartList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF9500',
  },
  stepConnectorLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  stepCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 4,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  authorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  authorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  outcomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
  },
  outcomeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Timeline
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  timelinePillar: {
    alignItems: 'center',
    width: 72,
  },
  dateBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dateBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  timelineBar: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 4,
  },
  timelineEventTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  timelineEventDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  significanceBox: {
    marginTop: 4,
    padding: 8,
    borderRadius: 6,
  },
  significanceText: {
    fontSize: 12,
    lineHeight: 17,
  },
  // Comparison Table
  tableContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  paramCell: {
    fontSize: 12,
    fontWeight: '700',
  },
  dataCell: {
    fontSize: 12.5,
    lineHeight: 17,
  },
});

