import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Clock,
  History,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { SUBJECT_COLORS, UPSC_THEME } from '@/constants/themeColors';
import { StudySession } from '@/types/study';

interface StudyHistoryModalProps {
  isDark: boolean;
}

export function StudyHistoryModal({ isDark }: StudyHistoryModalProps) {
  const {
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    sessions,
    deleteSession,
    resetToDefaults,
  } = useStudy();
  const colors = isDark ? UPSC_THEME.dark : UPSC_THEME.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');

  const filteredSessions = sessions.filter((s) => {
    if (selectedSubjectFilter !== 'All') {
      if (s.subject !== selectedSubjectFilter && s.customSubjectName !== selectedSubjectFilter) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.subject.toLowerCase().includes(q) ||
      (s.customSubjectName && s.customSubjectName.toLowerCase().includes(q)) ||
      s.topic.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      s.date.includes(q)
    );
  });

  return (
    <Modal
      visible={isHistoryModalOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsHistoryModalOpen(false)}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <History size={18} color={colors.accentAmber} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Study Logs & History ({sessions.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBarWrapper}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? '#1C1B2A' : '#F8FAFC',
                  borderColor: colors.cardBorderSubtle,
                },
              ]}>
              <Search size={15} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by subject, topic or date..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Subject Filter Pills */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {[
                'All',
                'Polity',
                'History',
                'Geography',
                'Economy',
                'Environment',
                'Science & Technology',
                'Current Affairs',
                'CSAT',
                'Mains Answer Writing',
              ].map((sub) => {
                const isSelected = selectedSubjectFilter === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setSelectedSubjectFilter(sub)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? isDark ? '#FFFFFF' : '#09090B'
                          : isDark ? '#1C1B2A' : '#F1F5F9',
                        borderColor: isSelected
                          ? isDark ? '#FFFFFF' : '#09090B'
                          : isDark ? '#2D3444' : '#E2E8F0',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected
                            ? isDark ? '#09090B' : '#FFFFFF'
                            : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {filteredSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No study sessions matching your search.
                </Text>
              </View>
            ) : (
              <View style={styles.sessionList}>
                {filteredSessions.map((session: StudySession) => {
                  const subjectKey = (session.subject in SUBJECT_COLORS) ? (session.subject as keyof typeof SUBJECT_COLORS) : 'Polity';
                  const subjectStyle = SUBJECT_COLORS[subjectKey] || SUBJECT_COLORS.Polity;
                  const displayName = session.customSubjectName || session.subject;
                  const isInterrupted = session.status === 'interrupted';

                  return (
                    <View
                      key={session.id}
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: isDark ? '#1B1A28' : '#FBFBFE',
                          borderColor: colors.cardBorderSubtle,
                        },
                      ]}>
                      <View style={styles.cardHeader}>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.subjectBadge,
                              {
                                backgroundColor: isDark
                                  ? '#27203A'
                                  : subjectStyle.bg,
                                borderColor: subjectStyle.border,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.subjectBadgeText,
                                { color: subjectStyle.text },
                              ]}>
                              {displayName}
                            </Text>
                          </View>

                          <View style={styles.dateTag}>
                            <Calendar size={11} color={colors.textMuted} />
                            <Text
                              style={[
                                styles.dateTagText,
                                { color: colors.textMuted },
                              ]}>
                              {session.date}
                            </Text>
                          </View>

                          {isInterrupted && (
                            <View style={styles.interruptedBadge}>
                              <Text style={styles.interruptedBadgeText}>Interrupted</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.durationCluster}>
                          <Clock size={12} color={colors.primary} />
                          <Text
                            style={[
                              styles.durationText,
                              { color: colors.primary },
                            ]}>
                            {session.durationMinutes} mins
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[styles.sessionTopic, { color: colors.textPrimary }]}>
                        {session.topic}
                      </Text>

                      {/* Optional Distraction & Paused indicators */}
                      {((session.distractionCount && session.distractionCount > 0) || (session.pausedSeconds && session.pausedSeconds > 0)) ? (
                        <View style={styles.metaRow}>
                          {session.distractionCount && session.distractionCount > 0 ? (
                            <View style={styles.metaTag}>
                              <Text style={styles.metaTagText}>
                                {session.distractionCount} tab {session.distractionCount === 1 ? 'switch' : 'switches'}
                              </Text>
                            </View>
                          ) : null}
                          {session.pausedSeconds && session.pausedSeconds > 0 ? (
                            <View style={styles.metaTag}>
                              <Text style={styles.metaTagText}>
                                Paused: {Math.max(1, Math.round(session.pausedSeconds / 60))}m
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {session.notes ? (
                        <Text
                          style={[
                            styles.sessionNotes,
                            { color: colors.textSecondary },
                          ]}>
                          {session.notes}
                        </Text>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <TouchableOpacity
                          onPress={() => deleteSession(session.id)}
                          style={styles.deleteBtn}>
                          <Trash2 size={13} color="#EF4444" />
                          <Text style={styles.deleteBtnText}>Delete Log</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Reset to defaults helper for testing */}
            <View style={styles.resetSection}>
              <TouchableOpacity
                onPress={resetToDefaults}
                style={[
                  styles.resetBtn,
                  { borderColor: colors.cardBorderSubtle },
                ]}>
                <RotateCcw size={14} color={colors.textMuted} />
                <Text style={[styles.resetBtnText, { color: colors.textMuted }]}>
                  Reset to Fresh UPSC Seed Data
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  scroll: {
    padding: 16,
  },
  sessionList: {
    gap: 12,
  },
  sessionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  durationCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sessionTopic: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  sessionNotes: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resetSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  filterScroll: {
    gap: 6,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  interruptedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  interruptedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaTag: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  metaTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888888',
  },
});
