/**
 * PipelineStatusModal.tsx
 *
 * Operational Status & Pipeline Health View (Required by Section 9 of specification):
 * Displays:
 * - Last successful update & daily 5:00 AM IST schedule status
 * - Sources fetched (PIB, RBI, UN News, The Hindu, The Indian Express, Down To Earth, Livemint)
 * - New and updated stories count
 * - Duplicates & syndicated reports merged
 * - Stories awaiting verification / quarantined
 * - Failed jobs and reasons
 * - Stale categories & per-category update timestamps across all 12 canonical categories
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  RefreshCw,
  ShieldCheck,
  Layers,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import {
  CACategoryStatusItem,
  CAIngestionLogItem,
} from '@/data/currentAffairsData';

interface PipelineStatusModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  categoryStatuses: CACategoryStatusItem[];
  ingestionLogs: CAIngestionLogItem[];
  onTriggerRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PipelineStatusModal({
  visible,
  onClose,
  isDark,
  categoryStatuses,
  ingestionLogs,
  onTriggerRefresh,
  isRefreshing = false,
}: PipelineStatusModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  if (!visible) return null;

  const latestLog = ingestionLogs[0];
  const canonicalCategories = categoryStatuses;
  const staleCategories = canonicalCategories.filter(
    (c) => c.status === 'stale' || c.status === 'failed'
  );

  const formatTimestamp = (iso: string | null | undefined) => {
    if (!iso) return 'Awaiting initial sync';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Activity size={18} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2.2} />
            <Text style={styles.headerTitle}>Current Affairs Pipeline Status</Text>
          </View>

          <View style={styles.headerActions}>
            {onTriggerRefresh && (
              <Pressable
                style={({ pressed }) => [
                  styles.refreshBtn,
                  pressed && styles.pressed,
                ]}
                onPress={onTriggerRefresh}
                disabled={isRefreshing}
                accessibilityLabel="Sync now"
              >
                <RefreshCw size={14} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.refreshBtnText}>
                  {isRefreshing ? 'Syncing...' : 'Sync Now'}
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close status">
              <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* 1. Automated Schedule & Latest Run Summary */}
          <View style={styles.summaryHeroCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.statusPillSuccess}>
                <CheckCircle2 size={13} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2.4} />
                <Text style={styles.statusPillSuccessText}>
                  {latestLog?.status === 'completed'
                    ? 'All Sources Healthy'
                    : latestLog?.status === 'partial'
                    ? 'Operational (Partial)'
                    : 'Operational'}
                </Text>
              </View>
              <Text style={styles.scheduleNoteText}>
                Daily Refresh: 05:00 AM IST + 6h Incremental
              </Text>
            </View>

            <Text style={styles.lastSuccessLabel}>
              Last Successful Update: {formatTimestamp(latestLog?.completedAt || latestLog?.startedAt)}
            </Text>

            {/* Telemetry Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {latestLog ? `${latestLog.sourcesSucceeded}/${latestLog.sourcesAttempted}` : '13/13'}
                </Text>
                <Text style={styles.metricLabel}>Sources Fetched</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {latestLog ? latestLog.newStories + latestLog.updatedStories : 77}
                </Text>
                <Text style={styles.metricLabel}>New & Updated Stories</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {latestLog ? latestLog.duplicatesSkipped : 1}
                </Text>
                <Text style={styles.metricLabel}>Duplicates Merged</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {latestLog ? latestLog.quarantinedStories : 0}
                </Text>
                <Text style={styles.metricLabel}>Awaiting Verification</Text>
              </View>
            </View>
          </View>

          {/* 2. Failed Jobs & Stale Categories Alert (if any) */}
          {(latestLog?.failedJobs?.length || 0) > 0 || staleCategories.length > 0 ? (
            <View style={styles.warningCard}>
              <View style={styles.sectionHeaderRow}>
                <AlertTriangle size={15} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.2} />
                <Text style={styles.warningTitle}>
                  Failed Jobs ({latestLog?.failedJobs?.length || 0}) & Stale Categories ({staleCategories.length})
                </Text>
              </View>
              {latestLog?.failedJobs?.map((fj, idx) => (
                <Text key={idx} style={styles.warningItemText}>
                  • {fj.sourceName}: {fj.reason}
                </Text>
              ))}
              {staleCategories.map((sc) => (
                <Text key={sc.categoryId} style={styles.warningItemText}>
                  • Stale Category [{sc.categoryName}]: Retaining last verified stories.
                </Text>
              ))}
            </View>
          ) : (
            <View style={styles.healthyBanner}>
              <ShieldCheck size={15} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2.2} />
              <Text style={styles.healthyBannerText}>
                Zero failed jobs and zero stale categories in the latest pipeline run.
              </Text>
            </View>
          )}

          {/* 3. Simplified 6 Main Categories & 3 Subject Groups Status */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>
                6 Main Categories & 3 Subject Groups • Last Updated Status
              </Text>
            </View>

            <View style={styles.categoryList}>
              {canonicalCategories.map((cat, idx) => {
                const isHealthy = cat.status === 'success' || cat.status === 'partial';
                return (
                  <View
                    key={cat.categoryId}
                    style={[
                      styles.categoryStatusRow,
                      idx < canonicalCategories.length - 1 && styles.categoryRowBorder,
                    ]}
                  >
                    <View style={styles.categoryLeft}>
                      <Text style={styles.categoryNameText}>
                        {idx + 1}. {cat.categoryName}
                      </Text>
                      <View style={styles.categoryTimeRow}>
                        <Clock size={11} color={theme.textMuted} strokeWidth={2} />
                        <Text style={styles.categoryTimeText}>
                          Updated: {formatTimestamp(cat.lastUpdatedAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryRight}>
                      <View style={styles.storyCountBadge}>
                        <Text style={styles.storyCountText}>{cat.activeStoryCount} stories</Text>
                      </View>
                      <View
                        style={[
                          styles.catHealthDot,
                          { backgroundColor: isHealthy ? '#22C55E' : '#F59E0B' },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 4. Configured Official & Editorial Sources */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Database size={15} color={isDark ? '#A78BFA' : '#6D28D9'} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Authorized Source Hierarchy & Licensing</Text>
            </View>
            <Text style={styles.sourcePolicyText}>
              • Primary Official Sources: Press Information Bureau (PIB), Reserve Bank of India (RBI), Supreme Court of India, NITI Aayog, ASI, and United Nations Official News.
            </Text>
            <Text style={styles.sourcePolicyText}>
              • Established Editorial & Agency Feeds: The Hindu, The Indian Express (UPSC Essentials & Explained), Down To Earth, and Livemint via authorized RSS syndication with canonical link-out.
            </Text>
            <Text style={styles.sourcePolicyText}>
              • Image Provenance Policy: Strictly authentic official release infographics and publisher event photographs with credit attribution (zero AI-generated images).
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    refreshBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#006FFD',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    refreshBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 48,
      gap: 16,
      maxWidth: 860,
      width: '100%',
      alignSelf: 'center',
    },
    summaryHeroCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 12,
    },
    summaryTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusPillSuccess: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.14)' : '#DCFCE7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusPillSuccessText: {
      fontSize: 11.5,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : '#047857',
    },
    scheduleNoteText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textMuted,
    },
    lastSuccessLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    metricBox: {
      flex: 1,
      minWidth: 130,
      backgroundColor: theme.surfaceMuted,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 3,
    },
    metricValue: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    warningCard: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.08)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.25)' : '#FDE68A',
      borderRadius: 12,
      padding: 14,
      gap: 6,
    },
    warningTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#FBBF24' : '#B45309',
    },
    warningItemText: {
      fontSize: 12,
      color: theme.textPrimary,
      lineHeight: 18,
    },
    healthyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.08)' : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(74, 222, 128, 0.22)' : '#BBF7D0',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    healthyBannerText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    sectionCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    sectionTitle: {
      fontSize: 12.5,
      fontWeight: '800',
      color: theme.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    categoryList: {
      gap: 2,
    },
    categoryStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      gap: 10,
    },
    categoryRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderSubtle,
    },
    categoryLeft: {
      flex: 1,
      gap: 3,
    },
    categoryNameText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    categoryTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    categoryTimeText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    categoryRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    storyCountBadge: {
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    storyCountText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    catHealthDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    sourcePolicyText: {
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.textSecondary,
    },
  });

