import React, { useState, useMemo } from 'react';
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
  CalendarDays,
  BookOpen,
} from 'lucide-react-native';
import { MONTHLY_OVERVIEWS, MonthlyOverview } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';

interface MonthlyRevisionModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function MonthlyRevisionModal({
  visible,
  onClose,
  isDark,
}: MonthlyRevisionModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');
  const [activeTab, setActiveTab] = useState<'gs1' | 'gs2' | 'gs3' | 'schemes' | 'reports'>('gs2');

  const currentOverview: MonthlyOverview = useMemo(() => {
    return (
      MONTHLY_OVERVIEWS.find((m) => m.monthKey === selectedMonthKey) ||
      MONTHLY_OVERVIEWS[0]
    );
  }, [selectedMonthKey]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <CalendarDays size={20} color={theme.textPrimary} strokeWidth={1.8} />
            <Text style={styles.headerTitle}>Monthly Current Affairs Revision</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Month Selector Tabs */}
          <View style={styles.monthTabsRow}>
            {MONTHLY_OVERVIEWS.map((m) => {
              const isSelected = m.monthKey === selectedMonthKey;
              return (
                <Pressable
                  key={m.monthKey}
                  style={[styles.monthTab, isSelected && styles.monthTabActive]}
                  onPress={() => setSelectedMonthKey(m.monthKey)}
                >
                  <Text style={[styles.monthTabText, isSelected && styles.monthTabTextActive]}>
                    {m.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Monthly Executive Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <BookOpen size={16} color={theme.textPrimary} strokeWidth={2} />
              <Text style={styles.summaryBadge}>EXECUTIVE COMPILATION</Text>
            </View>
            <Text style={styles.summaryText}>{currentOverview.summary}</Text>
          </View>

          {/* Subject Navigation Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navTabsRow}
          >
            <Pressable
              style={[styles.navTab, activeTab === 'gs2' && styles.navTabActive]}
              onPress={() => setActiveTab('gs2')}
            >
              <Text style={[styles.navTabText, activeTab === 'gs2' && styles.navTabTextActive]}>
                GS-2 Polity & IR
              </Text>
            </Pressable>

            <Pressable
              style={[styles.navTab, activeTab === 'gs3' && styles.navTabActive]}
              onPress={() => setActiveTab('gs3')}
            >
              <Text style={[styles.navTabText, activeTab === 'gs3' && styles.navTabTextActive]}>
                GS-3 Economy & Env
              </Text>
            </Pressable>

            <Pressable
              style={[styles.navTab, activeTab === 'gs1' && styles.navTabActive]}
              onPress={() => setActiveTab('gs1')}
            >
              <Text style={[styles.navTabText, activeTab === 'gs1' && styles.navTabTextActive]}>
                GS-1 Heritage & Society
              </Text>
            </Pressable>

            <Pressable
              style={[styles.navTab, activeTab === 'schemes' && styles.navTabActive]}
              onPress={() => setActiveTab('schemes')}
            >
              <Text style={[styles.navTabText, activeTab === 'schemes' && styles.navTabTextActive]}>
                Government Schemes
              </Text>
            </Pressable>

            <Pressable
              style={[styles.navTab, activeTab === 'reports' && styles.navTabActive]}
              onPress={() => setActiveTab('reports')}
            >
              <Text style={[styles.navTabText, activeTab === 'reports' && styles.navTabTextActive]}>
                Reports & Indices
              </Text>
            </Pressable>
          </ScrollView>

          {/* Content Sections based on Active Tab */}
          {activeTab === 'gs2' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>GS Paper 2: Polity, Governance & International Relations</Text>
              {currentOverview.gs2Highlights.map((pt, idx) => (
                <View key={idx} style={styles.pointCard}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.pointText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'gs3' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>GS Paper 3: Economy, Environment, Sci-Tech & Security</Text>
              {currentOverview.gs3Highlights.map((pt, idx) => (
                <View key={idx} style={styles.pointCard}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.pointText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'gs1' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>GS Paper 1: History, Art & Culture, Geography & Society</Text>
              {currentOverview.gs1Highlights.map((pt, idx) => (
                <View key={idx} style={styles.pointCard}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.pointText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'schemes' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Major Government Schemes & Policies in News</Text>
              {currentOverview.schemesInNews.map((sch, idx) => (
                <View key={idx} style={styles.schemeCard}>
                  <View style={styles.schemeTop}>
                    <Text style={styles.schemeName}>{sch.name}</Text>
                    <Text style={styles.schemeMinistry}>{sch.ministry}</Text>
                  </View>
                  <Text style={styles.schemeObjective}>{sch.objective}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'reports' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Global Reports & Indices Published</Text>
              {currentOverview.reportsAndIndices.map((rep, idx) => (
                <View key={idx} style={styles.reportCard}>
                  <View style={styles.reportTop}>
                    <Text style={styles.reportName}>{rep.name}</Text>
                    <Text style={styles.reportAgency}>{rep.releasedBy}</Text>
                  </View>
                  <Text style={styles.reportFact}>{rep.indiaRankOrFact}</Text>
                </View>
              ))}
            </View>
          )}
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
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 48,
    },
    monthTabsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    monthTab: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    monthTabActive: {
      backgroundColor: '#006FFD',
      borderColor: '#006FFD',
    },
    monthTabText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    monthTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    summaryCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 20,
    },
    summaryHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    summaryBadge: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 0.8,
    },
    summaryText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textPrimary,
    },
    navTabsRow: {
      gap: 8,
      paddingBottom: 16,
    },
    navTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    navTabActive: {
      backgroundColor: '#006FFD',
      borderColor: '#006FFD',
    },
    navTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    navTabTextActive: {
      fontWeight: '700',
      color: '#FFFFFF',
    },
    sectionBlock: {
      marginTop: 8,
    },
    sectionHeading: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 14,
      letterSpacing: -0.2,
    },
    pointCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 10,
      gap: 12,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textPrimary,
      marginTop: 8,
    },
    pointText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 21,
      color: theme.textPrimary,
    },
    schemeCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 12,
    },
    schemeTop: {
      marginBottom: 6,
    },
    schemeName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    schemeMinistry: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    schemeObjective: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
    },
    reportCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 12,
    },
    reportTop: {
      marginBottom: 6,
    },
    reportName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    reportAgency: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    reportFact: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
    },
  });
