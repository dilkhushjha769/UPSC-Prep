import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import {
  AlertCircle,
  BookOpen,
  Flame,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  StopCircle,
  X,
} from 'lucide-react-native';
import { useStudy } from '@/context/StudyContext';
import { BW_THEME } from '@/constants/bwTheme';
import { UPSCSubject } from '@/types/study';
import {
  ambientSoundManager,
  formatHumanDuration,
  formatTimerHHMMSS,
} from '@/services/focusTimerService';

interface SubjectOptionItem {
  id: UPSCSubject;
  label: string;
}

const UPSC_SUBJECT_LIST: SubjectOptionItem[] = [
  { id: 'Polity', label: 'Polity' },
  { id: 'History', label: 'History' },
  { id: 'Geography', label: 'Geography' },
  { id: 'Economy', label: 'Economy' },
  { id: 'Environment', label: 'Environment' },
  { id: 'Science & Technology', label: 'Science & Tech' },
  { id: 'Current Affairs', label: 'Current Affairs' },
  { id: 'CSAT', label: 'CSAT' },
  { id: 'Mains Answer Writing', label: 'Mains Answer Writing' },
  { id: 'Custom Subject', label: '+ Custom' },
];

const PRESET_DURATIONS = [
  { label: '25m', mins: 25 },
  { label: '45m', mins: 45 },
  { label: '60m', mins: 60 },
  { label: '90m', mins: 90 },
  { label: '120m', mins: 120 },
  { label: 'Open', mins: 0 },
];

interface FocusTimerModalProps {
  isDark: boolean;
}

export function FocusTimerModal({ isDark }: FocusTimerModalProps) {
  const {
    isFocusModalOpen,
    setIsFocusModalOpen,
    activeTimer,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopAndSaveFocusTimer,
    discardFocusTimer,
    config,
    todayTotalMinutes,
    todayRemainingMinutes,
    streak,
  } = useStudy();

  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 640;

  // Setup inputs state
  const [selectedSubject, setSelectedSubject] = useState<UPSCSubject>('Polity');
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');
  const [topicInput, setTopicInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [targetMins, setTargetMins] = useState<number>(config.qualifyingStreakMinutes || 60);

  // Sound and Discard confirmation
  const [soundMode, setSoundMode] = useState<'off' | 'whitenoise' | 'rain' | 'binaural'>('off');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const handleSoundChange = (mode: 'off' | 'whitenoise' | 'rain' | 'binaural') => {
    setSoundMode(mode);
    ambientSoundManager.setMode(mode);
  };

  const timerSeconds = activeTimer.elapsedSeconds;
  const targetSeconds = targetMins > 0 ? targetMins * 60 : 3600;
  const progressRatio = targetMins > 0 ? Math.min(1, timerSeconds / targetSeconds) : 1;

  // SVG Ring dimensions
  const size = isDesktop ? 220 : 185;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = targetMins > 0 ? circumference * (1 - progressRatio) : 0;

  const handleStart = () => {
    const finalSubject = selectedSubject;
    const finalCustomName = selectedSubject === 'Custom Subject' ? (customSubjectInput.trim() || 'Custom Subject') : undefined;
    const finalTopic = topicInput.trim() || (finalCustomName ? `${finalCustomName} Revision` : `${selectedSubject} Revision`);

    startFocusTimer(finalSubject, finalTopic, targetMins, finalCustomName);
  };

  const handleStopAndSave = async () => {
    try {
      await stopAndSaveFocusTimer(notesInput.trim());
      setNotesInput('');
    } catch (e) {
      console.warn('Error saving focus session:', e);
    }
  };

  const handleDiscard = () => {
    if (timerSeconds > 120) {
      setIsDiscardConfirmOpen(true);
    } else {
      discardFocusTimer();
      setNotesInput('');
    }
  };

  const confirmDiscard = () => {
    setIsDiscardConfirmOpen(false);
    discardFocusTimer();
    setNotesInput('');
  };

  const isQualified = Math.floor(timerSeconds / 60) >= config.qualifyingStreakMinutes;

  const subjectDisplayName = activeTimer.subject === 'Custom Subject' && activeTimer.customSubjectName
    ? activeTimer.customSubjectName
    : activeTimer.subject;

  return (
    <Modal
      visible={isFocusModalOpen}
      animationType="fade"
      transparent
      onRequestClose={() => {
        if (!activeTimer.isRunning) {
          setIsFocusModalOpen(false);
        }
      }}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.cardBg,
              borderColor: isDark ? '#2D3444' : theme.cardBorder,
            },
            Platform.OS === 'web' && ({
              boxShadow: isDark
                ? '0 20px 60px rgba(0, 0, 0, 0.75)'
                : '0 16px 40px rgba(0, 0, 0, 0.15)',
            } as object),
          ]}>
          {/* Minimal Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {activeTimer.isRunning || activeTimer.isPaused ? 'Focus' : 'Focus Mode'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsFocusModalOpen(false)}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1C202B' : '#F1F5F9',
                  borderColor: isDark ? '#2D3444' : '#E2E8F0',
                },
              ]}>
              <X size={15} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* ======================================================== */}
            {/* VIEW 1: CLEAN SETUP FORM (NOT RUNNING)                  */}
            {/* ======================================================== */}
            {!activeTimer.isRunning && !activeTimer.isPaused && (
              <View style={styles.setupSection}>
                {/* 1. Subject Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    SUBJECT
                  </Text>

                  <View style={styles.subjectGrid}>
                    {UPSC_SUBJECT_LIST.map((sub) => {
                      const isSelected = sub.id === selectedSubject;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          activeOpacity={0.75}
                          onPress={() => setSelectedSubject(sub.id)}
                          style={[
                            styles.subjectChip,
                            {
                              backgroundColor: isSelected
                                ? isDark ? '#FFFFFF' : '#09090B'
                                : isDark ? '#151822' : '#F8FAFC',
                              borderColor: isSelected
                                ? isDark ? '#FFFFFF' : '#09090B'
                                : isDark ? '#242B3B' : '#E2E8F0',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.subjectChipText,
                              {
                                color: isSelected
                                  ? isDark ? '#09090B' : '#FFFFFF'
                                  : theme.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                            numberOfLines={1}>
                            {sub.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Subject Name Input */}
                  {selectedSubject === 'Custom Subject' && (
                    <View style={styles.customSubContainer}>
                      <TextInput
                        value={customSubjectInput}
                        onChangeText={setCustomSubjectInput}
                        placeholder="Enter custom subject..."
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: isDark ? '#151822' : '#F8FAFC',
                            borderColor: isDark ? '#2E3547' : '#E2E8F0',
                            color: theme.textPrimary,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>

                {/* 2. Topic Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    TOPIC (OPTIONAL)
                  </Text>
                  <TextInput
                    value={topicInput}
                    onChangeText={setTopicInput}
                    placeholder="Chapter, topic or task..."
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? '#151822' : '#F8FAFC',
                        borderColor: isDark ? '#262D3D' : '#E2E8F0',
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* 3. Duration Presets */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    DURATION
                  </Text>

                  <View style={styles.presetRow}>
                    {PRESET_DURATIONS.map((preset) => {
                      const isSelected = targetMins === preset.mins;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          activeOpacity={0.75}
                          onPress={() => setTargetMins(preset.mins)}
                          style={[
                            styles.presetPill,
                            {
                              backgroundColor: isSelected
                                ? isDark ? '#1C202B' : '#F4F4F5'
                                : isDark ? '#141722' : '#FFFFFF',
                              borderColor: isSelected
                                ? isDark ? '#FFFFFF' : '#09090B'
                                : isDark ? '#262D3D' : '#E2E8F0',
                              borderWidth: isSelected ? 1.5 : 1,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.presetMins,
                              {
                                color: isSelected ? theme.textPrimary : theme.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: ACTIVE FOCUS SCREEN                             */}
            {/* ======================================================== */}
            {(activeTimer.isRunning || activeTimer.isPaused) && (
              <View style={styles.activeFocusSection}>
                {/* Subject & Topic */}
                <View
                  style={[
                    styles.activeSessionCard,
                    {
                      backgroundColor: isDark ? '#141722' : '#F8FAFC',
                      borderColor: isDark ? '#262D3D' : '#E2E8F0',
                    },
                  ]}>
                  <View style={styles.activeSubjectRow}>
                    <View
                      style={[
                        styles.activeSubjectTag,
                        {
                          backgroundColor: isDark ? '#222838' : '#E2E8F0',
                        },
                      ]}>
                      <BookOpen size={11} color={theme.textPrimary} />
                      <Text style={[styles.activeSubjectText, { color: theme.textPrimary }]}>
                        {subjectDisplayName}
                      </Text>
                    </View>

                    {isQualified && (
                      <View style={styles.qualifiedBadge}>
                        <Flame size={12} color="#D97706" fill="#FBBF24" />
                        <Text style={styles.qualifiedText}>Streak Qualified</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.activeTopicTitle, { color: theme.textPrimary }]}>
                    {activeTimer.topic || `${subjectDisplayName} Study`}
                  </Text>
                </View>

                {/* Circular Timer Ring */}
                <View style={styles.timerRingSection}>
                  <View style={[styles.ringContainer, { width: size, height: size }]}>
                    <Svg width={size} height={size}>
                      <G rotation="-90" origin={`${center}, ${center}`}>
                        <Circle
                          cx={center}
                          cy={center}
                          r={radius}
                          stroke={isDark ? '#232938' : '#E2E8F0'}
                          strokeWidth={strokeWidth}
                          fill="none"
                        />
                        <Circle
                          cx={center}
                          cy={center}
                          r={radius}
                          stroke={
                            isQualified
                              ? isDark ? '#34D399' : '#059669'
                              : isDark ? '#FFFFFF' : '#09090B'
                          }
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </G>
                    </Svg>

                    {/* Ring Center */}
                    <View style={styles.ringCenter}>
                      <Text style={[styles.timerDigits, { color: theme.textPrimary }]}>
                        {formatTimerHHMMSS(timerSeconds)}
                      </Text>

                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: activeTimer.isPaused
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          },
                        ]}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: activeTimer.isPaused
                                ? '#F59E0B'
                                : '#10B981',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: activeTimer.isPaused
                                ? '#F59E0B'
                                : '#10B981',
                            },
                          ]}>
                          {activeTimer.isPaused ? 'Paused' : 'Active'}
                        </Text>
                      </View>

                      <Text style={[styles.thresholdHint, { color: theme.textMuted }]}>
                        {targetMins > 0
                          ? `${Math.floor(timerSeconds / 60)} / ${targetMins}m`
                          : 'Stopwatch'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Daily Summary Row */}
                <View
                  style={[
                    styles.dailyContextCard,
                    {
                      backgroundColor: isDark ? '#141722' : '#F8FAFC',
                      borderColor: isDark ? '#262D3D' : '#E2E8F0',
                    },
                  ]}>
                  <View style={styles.dailyContextItem}>
                    <Text style={[styles.contextLabel, { color: theme.textMuted }]}>
                      TODAY
                    </Text>
                    <Text style={[styles.contextValue, { color: theme.textPrimary }]}>
                      {Math.floor(todayTotalMinutes / 60)}h {todayTotalMinutes % 60}m
                    </Text>
                  </View>

                  <View style={styles.contextDivider} />

                  <View style={styles.dailyContextItem}>
                    <Text style={[styles.contextLabel, { color: theme.textMuted }]}>
                      REMAINING
                    </Text>
                    <Text style={[styles.contextValue, { color: theme.textPrimary }]}>
                      {Math.floor(todayRemainingMinutes / 60)}h {todayRemainingMinutes % 60}m
                    </Text>
                  </View>

                  <View style={styles.contextDivider} />

                  <View style={styles.dailyContextItem}>
                    <Text style={[styles.contextLabel, { color: theme.textMuted }]}>
                      STREAK
                    </Text>
                    <View style={styles.streakRow}>
                      <Flame size={12} color="#D97706" fill="#FBBF24" />
                      <Text style={[styles.contextValue, { color: theme.textPrimary }]}>
                        {streak.currentStreak}d
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Minimal Ambient Sound Selector */}
                <View
                  style={[
                    styles.ambientCard,
                    {
                      backgroundColor: isDark ? '#141722' : '#F8FAFC',
                      borderColor: isDark ? '#262D3D' : '#E2E8F0',
                    },
                  ]}>
                  <View style={styles.ambientHeader}>
                    <Headphones size={12} color={theme.textPrimary} />
                    <Text style={[styles.ambientTitle, { color: theme.textPrimary }]}>
                      Sound
                    </Text>
                  </View>

                  <View style={styles.ambientOptionsRow}>
                    {(['off', 'rain', 'whitenoise', 'binaural'] as const).map((mode) => {
                      const isSelected = soundMode === mode;
                      const labels = {
                        off: 'Off',
                        rain: 'Rain',
                        whitenoise: 'White Noise',
                        binaural: '432Hz Alpha',
                      };
                      return (
                        <TouchableOpacity
                          key={mode}
                          activeOpacity={0.7}
                          onPress={() => handleSoundChange(mode)}
                          style={[
                            styles.ambientPill,
                            {
                              backgroundColor: isSelected
                                ? isDark ? '#FFFFFF' : '#09090B'
                                : isDark ? '#1C202B' : '#FFFFFF',
                              borderColor: isSelected
                                ? isDark ? '#FFFFFF' : '#09090B'
                                : isDark ? '#2D3444' : '#E2E8F0',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.ambientPillText,
                              {
                                color: isSelected
                                  ? isDark ? '#09090B' : '#FFFFFF'
                                  : theme.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}>
                            {labels[mode]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Discard Confirmation Dialog */}
            {isDiscardConfirmOpen && (
              <View
                style={[
                  styles.confirmBox,
                  {
                    backgroundColor: isDark ? '#1E1719' : '#FEF2F2',
                    borderColor: isDark ? '#5C2226' : '#FECACA',
                  },
                ]}>
                <View style={styles.confirmHeader}>
                  <AlertCircle size={14} color="#EF4444" />
                  <Text style={[styles.confirmTitle, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                    Discard Session?
                  </Text>
                </View>
                <Text style={[styles.confirmDescription, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Studied for {formatHumanDuration(timerSeconds)}. This time will not be saved.
                </Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    onPress={() => setIsDiscardConfirmOpen(false)}
                    style={[
                      styles.confirmBtnCancel,
                      { borderColor: isDark ? '#374151' : '#D1D5DB' },
                    ]}>
                    <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: '600' }}>
                      Keep
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmDiscard}
                    style={styles.confirmBtnDiscard}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      Discard
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {!activeTimer.isRunning && !activeTimer.isPaused ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleStart}
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                    },
                  ]}>
                  <Play
                    size={15}
                    color={isDark ? '#09090B' : '#FFFFFF'}
                    fill={isDark ? '#09090B' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.primaryActionText,
                      { color: isDark ? '#09090B' : '#FFFFFF' },
                    ]}>
                    Start Focus
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.runningControlsRow}>
                  {/* Pause / Resume */}
                  {activeTimer.isPaused ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={resumeFocusTimer}
                      style={[
                        styles.controlSecondaryBtn,
                        {
                          backgroundColor: isDark ? '#1C202B' : '#F4F4F5',
                          borderColor: isDark ? '#2E3547' : '#E2E8F0',
                        },
                      ]}>
                      <Play
                        size={14}
                        color={theme.textPrimary}
                        fill={theme.textPrimary}
                      />
                      <Text style={[styles.controlSecondaryText, { color: theme.textPrimary }]}>
                        Resume
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={pauseFocusTimer}
                      style={[
                        styles.controlSecondaryBtn,
                        {
                          backgroundColor: isDark ? '#1C202B' : '#F4F4F5',
                          borderColor: isDark ? '#2E3547' : '#E2E8F0',
                        },
                      ]}>
                      <Pause size={14} color={theme.textPrimary} />
                      <Text style={[styles.controlSecondaryText, { color: theme.textPrimary }]}>
                        Pause
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* End Focus */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleStopAndSave}
                    style={[
                      styles.finishBtn,
                      {
                        backgroundColor: isDark ? '#FFFFFF' : '#09090B',
                      },
                    ]}>
                    <StopCircle size={15} color={isDark ? '#09090B' : '#FFFFFF'} />
                    <Text
                      style={[
                        styles.finishBtnText,
                        { color: isDark ? '#09090B' : '#FFFFFF' },
                      ]}>
                      End Focus
                    </Text>
                  </TouchableOpacity>

                  {/* Discard */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDiscard}
                    style={[
                      styles.discardBtn,
                      {
                        backgroundColor: isDark ? '#1C202B' : '#F4F4F5',
                        borderColor: isDark ? '#2E3547' : '#E2E8F0',
                      },
                    ]}>
                    <RotateCcw size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 18,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.12)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  setupSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 12,
  },
  customSubContainer: {
    marginTop: 4,
  },
  textInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetMins: {
    fontSize: 12,
  },
  activeFocusSection: {
    gap: 16,
  },
  activeSessionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  activeSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeSubjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeSubjectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qualifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  activeTopicTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timerRingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  timerDigits: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  thresholdHint: {
    fontSize: 10,
  },
  dailyContextCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dailyContextItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  contextDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  contextLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contextValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ambientCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  ambientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ambientTitle: {
    fontSize: 10,
    fontWeight: '700',
  },
  ambientOptionsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  ambientPill: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  ambientPillText: {
    fontSize: 10,
  },
  confirmBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  confirmBtnCancel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  confirmBtnDiscard: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  actionsContainer: {
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  runningControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  controlSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  finishBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  discardBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
