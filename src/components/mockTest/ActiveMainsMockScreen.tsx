import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Globe,
  ImageIcon,
  PenTool,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import {
  MainsAttachmentRecord,
  MainsEvaluationRecord,
  MainsPaperId,
  MainsQuestionRecord,
  MainsSubmissionRecord,
} from '@/types/mains';
import {
  getMainsPaperSummaries,
  getQuestionsByPaper,
} from '@/data/mainsQuestionRepository';
import { MainsAIEvaluationService } from '@/services/mainsAIEvaluationService';
import { MainsService } from '@/services/mainsService';

interface ActiveMainsMockScreenProps {
  paperId: MainsPaperId;
  testMode?: 'timed' | 'practice';
  onClose: () => void;
  isDark: boolean;
}

interface MockAnswerState {
  mode: 'typed' | 'handwritten';
  typedText: string;
  attachments: MainsAttachmentRecord[];
}

export function ActiveMainsMockScreen({
  paperId,
  testMode = 'timed',
  onClose,
  isDark,
}: ActiveMainsMockScreenProps) {
  // Questions for this paper
  const questions = useMemo(() => {
    return getQuestionsByPaper(paperId);
  }, [paperId]);

  const paperSummary = useMemo(() => {
    const list = getMainsPaperSummaries();
    return list.find((p) => p.paper_id === paperId) || list[0];
  }, [paperId]);

  // Current question index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion: MainsQuestionRecord | undefined = questions[currentIndex];

  // Language switch
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Answers map: questionId -> MockAnswerState
  const [answersMap, setAnswersMap] = useState<Record<string, MockAnswerState>>({});

  // Timer: 180 minutes (3 hours)
  const initialSeconds = testMode === 'timed' ? 180 * 60 : 0;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  // Submit & Evaluation state
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState('');
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [mockEvaluations, setMockEvaluations] = useState<
    { question: MainsQuestionRecord; submission: MainsSubmissionRecord; evaluation: MainsEvaluationRecord }[]
  >([]);

  // Image preview modal
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  // Timer interval
  useEffect(() => {
    if (testMode !== 'timed' || examSubmitted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testMode, examSubmitted]);

  // Current answer state
  const currentAnswer = useMemo<MockAnswerState>(() => {
    if (!currentQuestion) return { mode: 'typed', typedText: '', attachments: [] };
    return answersMap[currentQuestion.id] || { mode: 'typed', typedText: '', attachments: [] };
  }, [answersMap, currentQuestion]);

  // Update current answer helper
  const updateCurrentAnswer = (patch: Partial<MockAnswerState>) => {
    if (!currentQuestion) return;
    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { mode: 'typed', typedText: '', attachments: [] }),
        ...patch,
      },
    }));
  };

  // Word count helper
  const wordCount = useMemo(() => {
    const text = currentAnswer.typedText.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [currentAnswer.typedText]);

  // Upload image handlers
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is needed to upload answer sheets.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments: MainsAttachmentRecord[] = result.assets.map((asset, idx) => ({
          id: `att_${Date.now()}_${idx}`,
          file_name: asset.fileName || `page_${currentAnswer.attachments.length + idx + 1}.jpg`,
          file_uri: asset.uri,
          file_type: 'image/jpeg',
          file_size: asset.fileSize || 0,
          page_number: currentAnswer.attachments.length + idx + 1,
        }));

        updateCurrentAnswer({
          attachments: [...currentAnswer.attachments, ...newAttachments],
        });
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to select image.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is needed to photograph answer sheets.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAtt: MainsAttachmentRecord = {
          id: `att_${Date.now()}`,
          file_name: `camera_page_${currentAnswer.attachments.length + 1}.jpg`,
          file_uri: asset.uri,
          file_type: 'image/jpeg',
          file_size: asset.fileSize || 0,
          page_number: currentAnswer.attachments.length + 1,
        };

        updateCurrentAnswer({
          attachments: [...currentAnswer.attachments, newAtt],
        });
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Failed to capture photo.');
    }
  };

  const handleDeleteAttachment = (id: string) => {
    const updated = currentAnswer.attachments
      .filter((a) => a.id !== id)
      .map((a, idx) => ({ ...a, page_number: idx + 1 }));
    updateCurrentAnswer({ attachments: updated });
  };

  // Completion count
  const answeredQuestionsCount = useMemo(() => {
    return Object.values(answersMap).filter((ans) => {
      const hasText = ans.typedText && ans.typedText.trim().length > 10;
      const hasImages = ans.attachments && ans.attachments.length > 0;
      return hasText || hasImages;
    }).length;
  }, [answersMap]);

  // Submit full mock test & evaluate
  const handleSubmitMockTest = async () => {
    setIsSubmitConfirmOpen(false);
    setIsEvaluating(true);
    setEvaluationProgress('Compiling your answers and handwritten answer sheets...');

    try {
      const results: {
        question: MainsQuestionRecord;
        submission: MainsSubmissionRecord;
        evaluation: MainsEvaluationRecord;
      }[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const ans = answersMap[q.id];

        // If answered
        if (ans && ((ans.typedText && ans.typedText.trim().length > 0) || (ans.attachments && ans.attachments.length > 0))) {
          setEvaluationProgress(`Evaluating Question ${q.question_number} with UPSC strict rubric...`);

          const sub = await MainsService.createSubmission({
            questionId: q.id,
            paperId: q.paper_id,
            submissionMode: ans.mode,
            answerText: ans.typedText,
            attachments: ans.attachments,
          });

          const evalResult = await MainsAIEvaluationService.evaluateAnswer({
            submissionId: sub.id,
            question: q,
            submissionMode: ans.mode,
            answerText: ans.typedText,
            attachments: ans.attachments,
          });

          const evaluation = await MainsService.saveEvaluation(sub.id, evalResult.evaluation);
          results.push({ question: q, submission: sub, evaluation });
        }
      }

      setMockEvaluations(results);
      setExamSubmitted(true);
    } catch (err: any) {
      Alert.alert('Evaluation Error', err?.message || 'Evaluation encountered an issue.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Timer formatting
  const formattedTime = useMemo(() => {
    const hrs = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsRemaining]);

  // Total marks scored across full mock
  const totalMockScore = useMemo(() => {
    return mockEvaluations.reduce((sum, item) => sum + (item.evaluation.total_score || 0), 0);
  }, [mockEvaluations]);

  const maxTotalMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  }, [questions]);

  // Design Tokens
  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#F58235';

  if (!currentQuestion) {
    return null;
  }

  // If exam has been submitted, render the comprehensive Full Mock Results View
  if (examSubmitted) {
    const scorePct = maxTotalMarks > 0 ? (totalMockScore / maxTotalMarks) * 100 : 0;
    const scoreColor = scorePct >= 50 ? '#10B981' : scorePct >= 40 ? '#F59E0B' : '#EF4444';

    return (
      <View style={[styles.root, { backgroundColor: bg }]}>
        {/* Results Header */}
        <View style={[styles.topHeader, { backgroundColor: surface, borderBottomColor: border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.headerBackBtn}>
            <ArrowLeft size={18} color={textPrimary} />
            <Text style={[styles.headerBackBtnText, { color: textPrimary }]}>Exit to Mocks</Text>
          </TouchableOpacity>
          <Text style={[styles.headerPaperTitle, { color: textPrimary }]}>
            {paperSummary.paper_id} Mock Results
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsContainer}>
            {/* Scorecard Hero */}
            <View style={[styles.scoreHeroCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.scoreHeroLeft}>
                <Award size={36} color={scoreColor} />
                <View>
                  <Text style={[styles.scoreHeroLabel, { color: textSecondary }]}>Total Score Awarded</Text>
                  <View style={styles.scoreBigRow}>
                    <Text style={[styles.scoreBigNum, { color: scoreColor }]}>
                      {totalMockScore.toFixed(1)}
                    </Text>
                    <Text style={[styles.scoreBigMax, { color: textMuted }]}> / {maxTotalMarks}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.scoreHeroRight, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                <Text style={[styles.scoreHeroPct, { color: scoreColor }]}>
                  {scorePct.toFixed(1)}%
                </Text>
                <Text style={[styles.scoreHeroTier, { color: textSecondary }]}>
                  {scorePct >= 50 ? 'Strong Mains Selection Standard' : 'Average • Needs Analytical Depth'}
                </Text>
              </View>
            </View>

            {/* Questions Performance Breakdown */}
            <Text style={[styles.breakdownHeading, { color: textPrimary }]}>
              Question-by-Question Evaluation ({mockEvaluations.length} Attempted)
            </Text>

            <View style={styles.breakdownList}>
              {mockEvaluations.map(({ question: q, evaluation: ev }, idx) => (
                <View
                  key={q.id}
                  style={[styles.resultQuestionCard, { backgroundColor: surface, borderColor: border }]}>
                  <View style={styles.resQHeader}>
                    <View style={styles.resQHeaderLeft}>
                      <View style={[styles.resQNumChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.resQNumText, { color: accent }]}>Q.{q.question_number}</Text>
                      </View>
                      <Text style={[styles.resQMarksSpec, { color: textSecondary }]}>
                        {q.marks} Marks • {q.topic}
                      </Text>
                    </View>

                    <View style={styles.resQScoreChip}>
                      <Text style={[styles.resQScoreNum, { color: '#10B981' }]}>{ev.total_score}</Text>
                      <Text style={[styles.resQScoreMax, { color: textMuted }]}>/{q.marks}</Text>
                    </View>
                  </View>

                  <Text style={[styles.resQPrompt, { color: textPrimary }]} numberOfLines={2}>
                    {q.text_english}
                  </Text>

                  {/* Examiner Remarks */}
                  <View style={[styles.resQRemarksBox, { backgroundColor: surfaceSubtle }]}>
                    <Text style={[styles.resQRemarksTitle, { color: accent }]}>Examiner Verdict:</Text>
                    <Text style={[styles.resQRemarksText, { color: textSecondary }]}>
                      {ev.examiners_remarks}
                    </Text>
                  </View>

                  {/* Model Answer Preview */}
                  {ev.model_answer && (
                    <View style={styles.resQModelBox}>
                      <Text style={[styles.resQModelLabel, { color: textPrimary }]}>UPSC Model Answer Reference:</Text>
                      <Text style={[styles.resQModelText, { color: textSecondary }]} numberOfLines={3}>
                        {ev.model_answer}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* 1. Mock Exam Top Nav */}
      <View style={[styles.topHeader, { backgroundColor: surface, borderBottomColor: border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.headerBackBtn}>
          <ArrowLeft size={18} color={textPrimary} />
          <Text style={[styles.headerBackBtnText, { color: textPrimary }]}>Exit</Text>
        </TouchableOpacity>

        {/* Paper title & Countdown */}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerPaperTitle, { color: textPrimary }]}>
            {paperSummary.paper_id} Full Mock
          </Text>
          {testMode === 'timed' && (
            <View style={styles.timerPill}>
              <Clock size={12} color={secondsRemaining < 600 ? '#EF4444' : accent} />
              <Text
                style={[
                  styles.timerText,
                  { color: secondsRemaining < 600 ? '#EF4444' : textPrimary },
                ]}>
                {formattedTime}
              </Text>
            </View>
          )}
        </View>

        {/* Submit Exam Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsSubmitConfirmOpen(true)}
          style={[styles.finishBtn, { backgroundColor: accent }]}>
          <FileCheck size={14} color="#FFFFFF" />
          <Text style={styles.finishBtnText}>Submit Exam</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Question Palette (Horizontal Pill Bar) */}
      <View style={[styles.paletteBar, { backgroundColor: surfaceSubtle, borderBottomColor: border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
          {questions.map((q, idx) => {
            const isSelected = idx === currentIndex;
            const ans = answersMap[q.id];
            const isAnswered =
              ans && ((ans.typedText && ans.typedText.trim().length > 10) || (ans.attachments && ans.attachments.length > 0));

            return (
              <TouchableOpacity
                key={q.id}
                activeOpacity={0.8}
                onPress={() => setCurrentIndex(idx)}
                style={[
                  styles.paletteCell,
                  {
                    backgroundColor: isSelected
                      ? accent
                      : isAnswered
                      ? isDark
                        ? '#064E3B'
                        : '#D1FAE5'
                      : surface,
                    borderColor: isSelected ? accent : isAnswered ? '#10B981' : border,
                  },
                ]}>
                <Text
                  style={[
                    styles.paletteCellText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isAnswered
                        ? isDark
                          ? '#6EE7B7'
                          : '#065F46'
                        : textPrimary,
                      fontWeight: isSelected || isAnswered ? '700' : '500',
                    },
                  ]}>
                  Q.{q.question_number}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Main Workspace Area */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* Question Display Card */}
          <View style={[styles.qDisplayCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.qCardHeader}>
              <View style={styles.qCardMetaLeft}>
                <View style={[styles.qNumChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <Text style={[styles.qNumChipText, { color: accent }]}>
                    Question {currentQuestion.question_number}
                  </Text>
                </View>
                <Text style={[styles.qMarksInfo, { color: textSecondary }]}>
                  {currentQuestion.marks} Marks • {currentQuestion.word_limit} words
                </Text>
                {currentQuestion.is_case_study && (
                  <View style={[styles.caseBadge, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : '#F3E8FF' }]}>
                    <Sparkles size={10} color="#8B5CF6" />
                    <Text style={styles.caseBadgeText}>Case Study</Text>
                  </View>
                )}
              </View>

              {/* Language Switch */}
              {currentQuestion.text_hindi && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
                  style={[styles.langSwitchBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Globe size={12} color={accent} />
                  <Text style={[styles.langSwitchText, { color: textPrimary }]}>
                    {language === 'en' ? 'हिन्दी' : 'English'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Case Study Scenario (if applicable) */}
            {currentQuestion.is_case_study && currentQuestion.scenario_english && (
              <View style={[styles.scenarioBox, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                <Text style={[styles.scenarioLabel, { color: accent }]}>Case Scenario:</Text>
                <Text style={[styles.scenarioText, { color: textPrimary }]}>
                  {language === 'hi' && currentQuestion.scenario_hindi
                    ? currentQuestion.scenario_hindi
                    : currentQuestion.scenario_english}
                </Text>
              </View>
            )}

            {/* Question Text */}
            <Text style={[styles.qFullText, { color: textPrimary }]}>
              {language === 'hi' && currentQuestion.text_hindi
                ? currentQuestion.text_hindi
                : currentQuestion.text_english}
            </Text>
          </View>

          {/* Submission Mode Selector (Typed Answer vs Handwritten Upload) */}
          <View style={[styles.modeSelectorCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => updateCurrentAnswer({ mode: 'typed' })}
                style={[
                  styles.modeTab,
                  {
                    backgroundColor: currentAnswer.mode === 'typed' ? accent : 'transparent',
                  },
                ]}>
                <PenTool size={14} color={currentAnswer.mode === 'typed' ? '#FFFFFF' : textPrimary} />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color: currentAnswer.mode === 'typed' ? '#FFFFFF' : textPrimary,
                      fontWeight: currentAnswer.mode === 'typed' ? '700' : '500',
                    },
                  ]}>
                  Type Answer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => updateCurrentAnswer({ mode: 'handwritten' })}
                style={[
                  styles.modeTab,
                  {
                    backgroundColor: currentAnswer.mode === 'handwritten' ? accent : 'transparent',
                  },
                ]}>
                <ImageIcon size={14} color={currentAnswer.mode === 'handwritten' ? '#FFFFFF' : textPrimary} />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color: currentAnswer.mode === 'handwritten' ? '#FFFFFF' : textPrimary,
                      fontWeight: currentAnswer.mode === 'handwritten' ? '700' : '500',
                    },
                  ]}>
                  Upload Sheet ({currentAnswer.attachments.length} Pages)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: Typed Editor */}
            {currentAnswer.mode === 'typed' ? (
              <View style={styles.editorArea}>
                <TextInput
                  placeholder={`Write your answer here for Q.${currentQuestion.question_number} (Target: ~${currentQuestion.word_limit} words)...`}
                  placeholderTextColor={textMuted}
                  value={currentAnswer.typedText}
                  onChangeText={(text) => updateCurrentAnswer({ typedText: text })}
                  multiline
                  textAlignVertical="top"
                  style={[styles.answerTextInput, { color: textPrimary, backgroundColor: surfaceSubtle, borderColor: border }]}
                />
                <View style={styles.wordCounterRow}>
                  <Text style={[styles.wordCounterText, { color: wordCount > currentQuestion.word_limit ? '#EF4444' : textSecondary }]}>
                    {wordCount} / {currentQuestion.word_limit} words
                    {wordCount > currentQuestion.word_limit ? ' (Exceeds limit)' : ''}
                  </Text>
                </View>
              </View>
            ) : (
              /* Tab 2: Handwritten Sheet Upload */
              <View style={styles.uploadArea}>
                <View style={styles.uploadActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCaptureCamera}
                    style={[styles.uploadActionBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <Camera size={16} color={accent} />
                    <Text style={[styles.uploadActionBtnText, { color: textPrimary }]}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickImage}
                    style={[styles.uploadActionBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                    <ImageIcon size={16} color={accent} />
                    <Text style={[styles.uploadActionBtnText, { color: textPrimary }]}>Upload from Gallery</Text>
                  </TouchableOpacity>
                </View>

                {/* Uploaded Thumbnails */}
                {currentAnswer.attachments.length === 0 ? (
                  <View style={[styles.emptyUploadBox, { borderColor: borderSubtle }]}>
                    <FileText size={24} color={textMuted} />
                    <Text style={[styles.emptyUploadText, { color: textSecondary }]}>
                      No pages uploaded yet for this question. Take a photo or select handwritten sheet images.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.thumbnailsGrid}>
                    {currentAnswer.attachments.map((att, idx) => (
                      <View key={att.id} style={[styles.thumbCard, { borderColor: border }]}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setPreviewImageUri(att.file_uri)}>
                          <Image source={{ uri: att.file_uri }} style={styles.thumbImage} />
                          <View style={styles.pageBadge}>
                            <Text style={styles.pageBadgeText}>Page {idx + 1}</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleDeleteAttachment(att.id)}
                          style={styles.deleteThumbBtn}>
                          <Trash2 size={12} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Bottom Next / Prev Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={currentIndex === 0}
              onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              style={[
                styles.navBtn,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  opacity: currentIndex === 0 ? 0.4 : 1,
                },
              ]}>
              <ChevronLeft size={16} color={textPrimary} />
              <Text style={[styles.navBtnText, { color: textPrimary }]}>Previous</Text>
            </TouchableOpacity>

            <Text style={[styles.navIndicatorText, { color: textSecondary }]}>
              {currentIndex + 1} of {questions.length} ({answeredQuestionsCount} answered)
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={currentIndex === questions.length - 1}
              onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              style={[
                styles.navBtn,
                {
                  backgroundColor: accent,
                  borderColor: accent,
                  opacity: currentIndex === questions.length - 1 ? 0.4 : 1,
                },
              ]}>
              <Text style={[styles.navBtnText, { color: '#FFFFFF' }]}>Next Question</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit Confirmation Dialog */}
      <Modal
        visible={isSubmitConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSubmitConfirmOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: surface, borderColor: border }]}>
            <AlertTriangle size={32} color={accent} />
            <Text style={[styles.confirmTitle, { color: textPrimary }]}>Submit Full Mock Exam?</Text>
            <Text style={[styles.confirmDesc, { color: textSecondary }]}>
              You have answered {answeredQuestionsCount} out of {questions.length} questions.
              {answeredQuestionsCount < questions.length
                ? ` There are ${questions.length - answeredQuestionsCount} unanswered questions.`
                : ' All questions have answers prepared.'}
            </Text>

            <View style={styles.confirmButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsSubmitConfirmOpen(false)}
                style={[styles.confirmCancelBtn, { borderColor: border }]}>
                <Text style={[styles.confirmCancelBtnText, { color: textPrimary }]}>Keep Writing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmitMockTest}
                style={[styles.confirmSubmitBtn, { backgroundColor: accent }]}>
                <Text style={styles.confirmSubmitBtnText}>Yes, Submit & Evaluate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Evaluating Loading Overlay */}
      {isEvaluating && (
        <View style={styles.evaluatingOverlay}>
          <View style={[styles.evaluatingCard, { backgroundColor: surface, borderColor: border }]}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={[styles.evaluatingTitle, { color: textPrimary }]}>UPSC AI Evaluation in Progress</Text>
            <Text style={[styles.evaluatingSub, { color: textSecondary }]}>{evaluationProgress}</Text>
          </View>
        </View>
      )}

      {/* Full Image Zoom Preview Modal */}
      {previewImageUri && (
        <Modal visible transparent onRequestClose={() => setPreviewImageUri(null)}>
          <View style={styles.imageModalOverlay}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPreviewImageUri(null)}
              style={styles.closeImageBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Image source={{ uri: previewImageUri }} style={styles.fullImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Top Nav
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBackBtnText: { fontSize: 13, fontWeight: '600' },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerPaperTitle: { fontSize: 14, fontWeight: '700' },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  finishBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Palette Bar
  paletteBar: { paddingVertical: 8, borderBottomWidth: 1 },
  paletteScroll: { paddingHorizontal: 14, gap: 6 },
  paletteCell: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  paletteCellText: { fontSize: 11 },

  // Main scroll content
  scrollBody: { padding: 16, paddingBottom: 64 },
  contentWrap: { maxWidth: 860, alignSelf: 'center', width: '100%', gap: 14 },

  // Question Display Card
  qDisplayCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  qCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCardMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qNumChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qNumChipText: { fontSize: 11, fontWeight: '800' },
  qMarksInfo: { fontSize: 11, fontWeight: '600' },
  caseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  caseBadgeText: { color: '#8B5CF6', fontSize: 10, fontWeight: '700' },
  langSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  langSwitchText: { fontSize: 11, fontWeight: '600' },
  scenarioBox: { padding: 12, borderRadius: 8, borderWidth: 1, gap: 6 },
  scenarioLabel: { fontSize: 11, fontWeight: '700' },
  scenarioText: { fontSize: 13, lineHeight: 20 },
  qFullText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },

  // Mode Selector Card
  modeSelectorCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 14 },
  modeTabsRow: { flexDirection: 'row', gap: 8 },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modeTabText: { fontSize: 12 },

  // Editor Area
  editorArea: { gap: 8 },
  answerTextInput: {
    height: 240,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13.5,
    lineHeight: 21,
  },
  wordCounterRow: { alignItems: 'flex-end' },
  wordCounterText: { fontSize: 11, fontWeight: '600' },

  // Upload Area
  uploadArea: { gap: 12 },
  uploadActionsRow: { flexDirection: 'row', gap: 10 },
  uploadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadActionBtnText: { fontSize: 12, fontWeight: '600' },
  emptyUploadBox: { padding: 24, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', gap: 8 },
  emptyUploadText: { fontSize: 12, textAlign: 'center', maxWidth: 300 },
  thumbnailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbCard: { width: 90, height: 110, borderRadius: 8, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  pageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pageBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  deleteThumbBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 3,
  },

  // Nav Row
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  navBtnText: { fontSize: 12, fontWeight: '600' },
  navIndicatorText: { fontSize: 11 },

  // Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, padding: 22, alignItems: 'center', gap: 14 },
  confirmTitle: { fontSize: 17, fontWeight: '800' },
  confirmDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  confirmButtonsRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  confirmCancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  confirmCancelBtnText: { fontSize: 13, fontWeight: '600' },
  confirmSubmitBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  confirmSubmitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Evaluating Overlay
  evaluatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 999,
  },
  evaluatingCard: { padding: 28, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12, maxWidth: 360, width: '100%' },
  evaluatingTitle: { fontSize: 16, fontWeight: '800' },
  evaluatingSub: { fontSize: 12, textAlign: 'center' },

  // Image zoom modal
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, padding: 10, zIndex: 10 },
  fullImage: { width: '92%', height: '80%' },

  // Results View
  resultsContainer: { maxWidth: 860, alignSelf: 'center', width: '100%', gap: 16 },
  scoreHeroCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  scoreHeroLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreHeroLabel: { fontSize: 12, fontWeight: '500' },
  scoreBigRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  scoreBigNum: { fontSize: 32, fontWeight: '900' },
  scoreBigMax: { fontSize: 16 },
  scoreHeroRight: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  scoreHeroPct: { fontSize: 20, fontWeight: '800' },
  scoreHeroTier: { fontSize: 11, marginTop: 2 },

  breakdownHeading: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  breakdownList: { gap: 12 },
  resultQuestionCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  resQHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resQHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resQNumChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  resQNumText: { fontSize: 11, fontWeight: '800' },
  resQMarksSpec: { fontSize: 11 },
  resQScoreChip: { flexDirection: 'row', alignItems: 'baseline' },
  resQScoreNum: { fontSize: 16, fontWeight: '800' },
  resQScoreMax: { fontSize: 12 },
  resQPrompt: { fontSize: 13, lineHeight: 19 },
  resQRemarksBox: { padding: 10, borderRadius: 8, gap: 3 },
  resQRemarksTitle: { fontSize: 11, fontWeight: '700' },
  resQRemarksText: { fontSize: 12, lineHeight: 17 },
  resQModelBox: { gap: 3, marginTop: 4 },
  resQModelLabel: { fontSize: 11, fontWeight: '700' },
  resQModelText: { fontSize: 12, lineHeight: 18 },
});
