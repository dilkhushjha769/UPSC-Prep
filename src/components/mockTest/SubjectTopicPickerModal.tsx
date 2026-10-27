import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Search, X, Check } from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { PaperType } from '@/types/mockTest';

interface SubjectTopicPickerModalProps {
  visible: boolean;
  onClose: () => void;
  subjects: { name: string; count: number }[];
  topicsBySubject: Record<string, string[]>;
  selectedSubject: string;
  selectedTopic: string;
  onSelect: (subject: string, topic: string) => void;
  paperType: PaperType;
  isDark?: boolean;
}

export function SubjectTopicPickerModal(props: SubjectTopicPickerModalProps) {
  if (!props.visible) return null;
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}>
      <SubjectTopicPickerInner {...props} />
    </Modal>
  );
}

function SubjectTopicPickerInner({
  onClose,
  subjects,
  topicsBySubject,
  selectedSubject,
  selectedTopic,
  onSelect,
  paperType,
  isDark = true,
}: SubjectTopicPickerModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>(selectedSubject);
  const [activeTopic, setActiveTopic] = useState<string>(selectedTopic);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjects, searchQuery]);

  const availableTopics = useMemo(() => {
    if (!activeSubject) return [];
    return topicsBySubject[activeSubject] || [];
  }, [activeSubject, topicsBySubject]);

  const handleApply = (sub: string, top: string) => {
    onSelect(sub, top);
    onClose();
  };

  const handleReset = () => {
    onSelect('', '');
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#151A2B' : '#FFFFFF',
              borderColor: isDark ? '#232D44' : '#E2E8F0',
            },
          ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Select Subject & Topic
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                {paperType === 'CSAT' ? 'CSAT Paper II' : 'GS Paper I'} · {subjects.length} subjects available
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E2538' : '#F1F5F9' },
              ]}>
              <X size={15} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? '#0E121F' : '#F8FAFC',
                borderColor: isDark ? '#232D44' : '#E2E8F0',
              },
            ]}>
            <Search size={15} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Filter subjects..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <X size={14} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Quick Reset / All Subjects */}
          <View style={styles.resetRow}>
            <Pressable
              onPress={handleReset}
              style={[
                styles.allSubjectsChip,
                !activeSubject
                  ? [
                      styles.chipActive,
                      {
                        backgroundColor: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: isDark ? '#F8FAFC' : '#0F172A',
                      },
                    ]
                  : [
                      styles.chipInactive,
                      {
                        backgroundColor: isDark ? '#0E121F' : '#F8FAFC',
                        borderColor: isDark ? '#232D44' : '#E2E8F0',
                      },
                    ],
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: !activeSubject
                      ? isDark
                        ? '#0F1117'
                        : '#FFFFFF'
                      : theme.textSecondary,
                    fontWeight: !activeSubject ? '600' : '500',
                  },
                ]}>
                All Subjects (No Filter)
              </Text>
            </Pressable>
          </View>

          {/* Subjects List */}
          <ScrollView
            style={styles.subjectList}
            showsVerticalScrollIndicator={false}>
            {filteredSubjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No subjects match &ldquo;{searchQuery}&rdquo;
                </Text>
              </View>
            ) : (
              filteredSubjects.map((sub) => {
                const isSelected = activeSubject === sub.name;
                return (
                  <View key={sub.name} style={styles.subjectItemWrapper}>
                    <Pressable
                      onPress={() => {
                        if (isSelected) {
                          // deselect
                          setActiveSubject('');
                          setActiveTopic('');
                        } else {
                          setActiveSubject(sub.name);
                          setActiveTopic('');
                        }
                      }}
                      style={[
                        styles.subjectRow,
                        isSelected && [
                          styles.subjectRowActive,
                          {
                            backgroundColor: isDark ? '#1C2438' : '#F1F5F9',
                          },
                        ],
                        {
                          borderBottomColor: isDark ? '#1A2133' : '#F8FAFC',
                        },
                      ]}>
                      <View style={styles.subjectInfo}>
                        <Text
                          style={[
                            styles.subjectName,
                            {
                              color: theme.textPrimary,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}>
                          {sub.name}
                        </Text>
                        <Text
                          style={[
                            styles.subjectCount,
                            { color: theme.textMuted },
                          ]}>
                          {sub.count} questions
                        </Text>
                      </View>

                      {isSelected && (
                        <Check size={14} color={theme.textPrimary} strokeWidth={2.5} />
                      )}
                    </Pressable>

                    {/* Associated Topics for Selected Subject */}
                    {isSelected && availableTopics.length > 0 && (
                      <View
                        style={[
                          styles.topicsContainer,
                          {
                            backgroundColor: isDark ? '#0E121F' : '#F8FAFC',
                            borderColor: isDark ? '#232D44' : '#E2E8F0',
                          },
                        ]}>
                        <Text style={[styles.topicsHeading, { color: theme.textMuted }]}>
                          TOPIC (OPTIONAL)
                        </Text>
                        <View style={styles.topicPills}>
                          <Pressable
                            onPress={() => setActiveTopic('')}
                            style={[
                              styles.topicPill,
                              !activeTopic
                                ? [
                                    styles.topicPillActive,
                                    {
                                      backgroundColor: isDark ? '#F8FAFC' : '#0F172A',
                                    },
                                  ]
                                : [
                                    styles.topicPillInactive,
                                    {
                                      backgroundColor: isDark ? '#151A2B' : '#FFFFFF',
                                      borderColor: isDark ? '#232D44' : '#E2E8F0',
                                    },
                                  ],
                            ]}>
                            <Text
                              style={[
                                styles.topicPillText,
                                {
                                  color: !activeTopic
                                    ? isDark
                                      ? '#0F1117'
                                      : '#FFFFFF'
                                    : theme.textSecondary,
                                },
                              ]}>
                              All Topics
                            </Text>
                          </Pressable>

                          {availableTopics.map((top) => {
                            const isTopActive = activeTopic === top;
                            return (
                              <Pressable
                                key={top}
                                onPress={() =>
                                  setActiveTopic(isTopActive ? '' : top)
                                }
                                style={[
                                  styles.topicPill,
                                  isTopActive
                                    ? [
                                        styles.topicPillActive,
                                        {
                                          backgroundColor: isDark ? '#F8FAFC' : '#0F172A',
                                        },
                                      ]
                                    : [
                                        styles.topicPillInactive,
                                        {
                                          backgroundColor: isDark ? '#151A2B' : '#FFFFFF',
                                          borderColor: isDark ? '#232D44' : '#E2E8F0',
                                        },
                                      ],
                                ]}>
                                <Text
                                  style={[
                                    styles.topicPillText,
                                    {
                                      color: isTopActive
                                        ? isDark
                                          ? '#0F1117'
                                          : '#FFFFFF'
                                        : theme.textSecondary,
                                    },
                                  ]}>
                                  {top}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer Action */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? '#232D44' : '#F1F5F9' },
            ]}>
            <Pressable
              onPress={handleReset}
              style={[
                styles.secondaryBtn,
                { borderColor: isDark ? '#232D44' : '#E2E8F0' },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                Clear
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleApply(activeSubject, activeTopic)}
              style={[
                styles.applyBtn,
                { backgroundColor: isDark ? '#F8FAFC' : '#0F172A' },
              ]}>
              <Text
                style={[
                  styles.applyBtnText,
                  { color: isDark ? '#0F1117' : '#FFFFFF' },
                ]}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  resetRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  allSubjectsChip: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipActive: {},
  chipInactive: {},
  chipText: {
    fontSize: 11,
  },
  subjectList: {
    maxHeight: 340,
    paddingHorizontal: 16,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  subjectItemWrapper: {
    marginBottom: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subjectRowActive: {
    borderRadius: 8,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 13,
  },
  subjectCount: {
    fontSize: 11,
    marginTop: 2,
  },
  topicsContainer: {
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  topicsHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  topicPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  topicPillActive: {},
  topicPillInactive: {
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: 11,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  applyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
