import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { MockTestService } from '@/services/mockTestService';
import { MockTestRecord } from '@/types/mockTest';

interface TestHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTest: (testId: string) => void;
  isDark?: boolean;
}

export function TestHistoryModal({
  visible,
  onClose,
  onSelectTest,
  isDark = true,
}: TestHistoryModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<MockTestRecord[]>([]);

  useEffect(() => {
    let active = true;

    if (visible) {
      MockTestService.getRecentMockTests(25)
        .then((recent) => {
          if (!active) return;
          setTests(recent);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load test history:', err);
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [visible]);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Test History
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {tests.length > 0
                  ? `${tests.length} tests attempted`
                  : 'Track your test performance and review solutions'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close History"
              style={[
                styles.closeBtn,
                { backgroundColor: theme.activeBg },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}>
              <X size={18} color={theme.textPrimary} />
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.textPrimary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading past tests...
              </Text>
            </View>
          ) : tests.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: theme.activeBg },
                ]}>
                <BookOpen size={24} color={theme.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No Test Attempts Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Configure and start your first test to practice previous year
                questions and analyze your accuracy.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}>
              {tests.map((t) => {
                const isSubmitted = t.status === 'submitted';
                const scoreNum = Number(t.score) || 0;
                const totalNum = Number(t.total_marks) || 0;
                const accuracyNum = Number(t.accuracy) || 0;

                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      onClose();
                      onSelectTest(t.id);
                    }}
                    style={[
                      styles.testCard,
                      {
                        backgroundColor: theme.bg,
                        borderColor: theme.cardBorder,
                      },
                      Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                    ]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text
                          style={[
                            styles.testTitle,
                            { color: theme.textPrimary },
                          ]}
                          numberOfLines={1}>
                          {t.test_title}
                        </Text>
                        <Text
                          style={[
                            styles.testMeta,
                            { color: theme.textSecondary },
                          ]}>
                          {formatDate(t.created_at)} • {t.question_count} Qs •{' '}
                          {t.paper_type === 'CSAT' ? 'CSAT' : 'GS-I'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isSubmitted
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(245, 158, 11, 0.12)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isSubmitted ? '#10B981' : '#F59E0B' },
                          ]}>
                          {isSubmitted ? 'Completed' : 'In Progress'}
                        </Text>
                      </View>
                    </View>

                    {isSubmitted ? (
                      <View
                        style={[
                          styles.statsRow,
                          {
                            backgroundColor: theme.activeBg,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <View style={styles.statCol}>
                          <Text
                            style={[
                              styles.statLabel,
                              { color: theme.textMuted },
                            ]}>
                            SCORE
                          </Text>
                          <Text
                            style={[
                              styles.statVal,
                              {
                                color:
                                  scoreNum >= 0 ? theme.textPrimary : '#EF4444',
                              },
                            ]}>
                            {scoreNum.toFixed(1)} / {totalNum.toFixed(0)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statDivider,
                            { backgroundColor: theme.cardBorder },
                          ]}
                        />
                        <View style={styles.statCol}>
                          <Text
                            style={[
                              styles.statLabel,
                              { color: theme.textMuted },
                            ]}>
                            ACCURACY
                          </Text>
                          <Text
                            style={[
                              styles.statVal,
                              { color: theme.textPrimary },
                            ]}>
                            {accuracyNum.toFixed(0)}%
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statDivider,
                            { backgroundColor: theme.cardBorder },
                          ]}
                        />
                        <View style={styles.statCol}>
                          <Text
                            style={[
                              styles.statLabel,
                              { color: theme.textMuted },
                            ]}>
                            CORRECT
                          </Text>
                          <Text
                            style={[
                              styles.statVal,
                              { color: '#10B981' },
                            ]}>
                            {t.correct_count} / {t.question_count}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.inProgressRow,
                          { backgroundColor: theme.activeBg },
                        ]}>
                        <Clock size={14} color="#F59E0B" />
                        <Text
                          style={[
                            styles.inProgressText,
                            { color: theme.textSecondary },
                          ]}>
                          Test was not submitted yet. Tap to resume.
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <Text
                        style={[
                          styles.actionLinkText,
                          { color: theme.textPrimary },
                        ]}>
                        {isSubmitted ? 'Review Solutions' : 'Resume Test'}
                      </Text>
                      <ChevronRight size={14} color={theme.textPrimary} />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 56,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  testCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  testMeta: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
  },
  inProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  inProgressText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
