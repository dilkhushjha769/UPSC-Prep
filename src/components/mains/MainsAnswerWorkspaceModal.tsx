import React, { useEffect, useState } from 'react';
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
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  ImageIcon,
  Maximize2,
  PenTool,
  Save,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import {
  MainsAttachmentRecord,
  MainsEvaluationRecord,
  MainsQuestionRecord,
  MainsSubmissionMode,
  MainsSubmissionRecord,
} from '@/types/mains';
import { MainsService } from '@/services/mainsService';
import { MainsAIEvaluationService } from '@/services/mainsAIEvaluationService';

interface MainsAnswerWorkspaceModalProps {
  visible: boolean;
  onClose: () => void;
  question: MainsQuestionRecord | null;
  onSubmissionComplete: (submission: MainsSubmissionRecord, evaluation: MainsEvaluationRecord) => void;
  isDark: boolean;
}

export function MainsAnswerWorkspaceModal({
  visible,
  onClose,
  question,
  onSubmissionComplete,
  isDark,
}: MainsAnswerWorkspaceModalProps) {
  const [mode, setMode] = useState<MainsSubmissionMode>('typed');
  const [answerText, setAnswerText] = useState('');
  const [attachments, setAttachments] = useState<MainsAttachmentRecord[]>([]);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Draft status
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastDraftSavedTime, setLastDraftSavedTime] = useState<string | null>(null);

  // Submitting & Evaluation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState<string>('');

  // Image preview modal
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  // Load existing draft if present
  useEffect(() => {
    if (visible && question) {
      MainsService.getDraft(question.id).then((draft) => {
        if (draft) {
          setAnswerText(draft.answer_text || '');
          setMode(draft.submission_mode || 'typed');
          setAttachments(draft.attachments || []);
          setLastDraftSavedTime(new Date(draft.last_saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          setAnswerText('');
          setAttachments([]);
          setLastDraftSavedTime(null);
        }
      });
    }
  }, [visible, question]);

  if (!visible || !question) return null;

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const cardBg = isDark ? '#141C28' : '#FFFFFF';
  const cardBorder = isDark ? '#253244' : '#EAE5DC';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#9DA8B9' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const wordLimit = question.word_limit;
  const isExceedingWordLimit = wordCount > wordLimit * 1.15;
  const isCloseToWordLimit = wordCount >= wordLimit * 0.9 && !isExceedingWordLimit;

  // Save draft helper
  const handleSaveDraft = async () => {
    if (!question) return;
    setIsDraftSaving(true);
    try {
      await MainsService.saveDraft(question.id, mode, answerText, attachments);
      setLastDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Save draft error:', e);
    } finally {
      setIsDraftSaving(false);
    }
  };

  // Image upload helpers
  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to upload answer sheets.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newRecords: MainsAttachmentRecord[] = result.assets.map((asset, idx) => ({
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          page_number: attachments.length + idx + 1,
          file_uri: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
          file_type: 'image/jpeg',
          file_name: asset.fileName || `Answer_Page_${attachments.length + idx + 1}.jpg`,
          file_size: asset.fileSize,
        }));

        setAttachments((prev) => [...prev, ...newRecords]);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required to photograph handwritten answer sheets.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newRecord: MainsAttachmentRecord = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          page_number: attachments.length + 1,
          file_uri: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
          file_type: 'image/jpeg',
          file_name: `Answer_Page_${attachments.length + 1}.jpg`,
          file_size: asset.fileSize,
        };

        setAttachments((prev) => [...prev, newRecord]);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= attachments.length) return;

    const copy = [...attachments];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Re-index page numbers
    copy.forEach((att, idx) => {
      att.page_number = idx + 1;
    });

    setAttachments(copy);
  };

  const handleRemovePage = (index: number) => {
    const copy = attachments.filter((_, i) => i !== index);
    copy.forEach((att, idx) => {
      att.page_number = idx + 1;
    });
    setAttachments(copy);
  };

  // Submission handler
  const handleSubmitAnswer = async () => {
    if (mode === 'typed' && answerText.trim().length < 25) {
      Alert.alert('Answer Too Short', 'Please write a substantial answer before submitting for evaluation.');
      return;
    }
    if (mode === 'handwritten' && attachments.length === 0) {
      Alert.alert('No Pages Uploaded', 'Please upload at least one page of your handwritten answer sheet.');
      return;
    }

    setIsSubmitting(true);
    setEvaluationStep('Creating answer submission record...');

    try {
      // 1. Create submission record
      const submission = await MainsService.createSubmission({
        questionId: question.id,
        paperId: question.paper_id,
        submissionMode: mode,
        answerText: mode === 'typed' ? answerText : '',
        attachments: mode === 'handwritten' ? attachments : [],
      });

      // 2. Perform AI Evaluation / OCR
      setEvaluationStep(
        mode === 'handwritten'
          ? 'Scanning handwriting & transcribing answer sheets...'
          : 'Analyzing content against UPSC Mains parameters...'
      );

      const { evaluation, ocrExtractedText } = await MainsAIEvaluationService.evaluateAnswer({
        submissionId: submission.id,
        question,
        submissionMode: mode,
        answerText: mode === 'typed' ? answerText : '',
        attachments: mode === 'handwritten' ? attachments : [],
      });

      if (ocrExtractedText) {
        submission.ocr_extracted_text = ocrExtractedText;
      }

      setEvaluationStep('Generating UPSC examiner marks & model answer report...');

      // 3. Save evaluation report
      const savedEval = await MainsService.saveEvaluation(submission.id, evaluation);

      setEvaluationStep('Complete!');
      setIsSubmitting(false);

      // Transition to evaluation view
      onSubmissionComplete(submission, savedEval);
    } catch (err: any) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      Alert.alert('Submission Issue', err?.message || 'Could not complete evaluation. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: bg }]}>
        {/* Top App Bar */}
        <View style={[styles.topBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <View style={styles.topBarLeft}>
            <View style={[styles.paperBadge, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)' }]}>
              <Text style={[styles.paperBadgeText, { color: accent }]}>{question.paper_id}</Text>
            </View>
            <Text style={[styles.qNumTitle, { color: textPrimary }]}>Q.{question.question_number}</Text>
            <View style={[styles.metaPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.metaPillText, { color: textSecondary }]}>
                {question.marks} Marks • {question.word_limit} Words
              </Text>
            </View>
          </View>

          <View style={styles.topBarRight}>
            {lastDraftSavedTime && (
              <View style={styles.draftStatusRow}>
                <Check size={12} color="#10B981" />
                <Text style={[styles.draftSavedText, { color: textMuted }]}>Draft saved {lastDraftSavedTime}</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSaveDraft}
              disabled={isDraftSaving}
              style={[styles.saveDraftBtn, { borderColor: cardBorder }]}>
              {isDraftSaving ? (
                <ActivityIndicator size="small" color={accent} />
              ) : (
                <>
                  <Save size={14} color={textPrimary} />
                  <Text style={[styles.saveDraftBtnText, { color: textPrimary }]}>Save Draft</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.iconCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <X size={18} color={textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Question Prompt Card */}
          <View style={[styles.questionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.questionCardHeader}>
              <View style={styles.qHeaderTitleRow}>
                <Text style={[styles.questionMetaHeader, { color: textSecondary }]}>
                  {question.subject_area} • {question.topic}
                </Text>
              </View>

              <View style={styles.questionCardTools}>
                {/* Language Switch */}
                {question.text_hindi ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    style={[styles.langToggleBtn, { borderColor: cardBorder }]}>
                    <Globe size={13} color={accent} />
                    <Text style={[styles.langToggleBtnText, { color: textPrimary }]}>
                      {language === 'en' ? 'हिंदी में देखें' : 'View in English'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsQuestionCollapsed(!isQuestionCollapsed)}
                  style={styles.collapseBtn}>
                  {isQuestionCollapsed ? (
                    <ChevronDown size={18} color={textSecondary} />
                  ) : (
                    <ChevronUp size={18} color={textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {!isQuestionCollapsed && (
              <View style={styles.questionBody}>
                {question.title && (
                  <Text style={[styles.questionTitleText, { color: accent }]}>{question.title}</Text>
                )}

                {question.is_case_study && (
                  <View style={[styles.caseScenarioBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: cardBorder }]}>
                    <Text style={[styles.caseScenarioLabel, { color: textSecondary }]}>Case Scenario:</Text>
                    <Text style={[styles.questionText, { color: textPrimary }]}>
                      {language === 'hi' && question.scenario_hindi
                        ? question.scenario_hindi
                        : question.scenario_english || question.text_english}
                    </Text>
                  </View>
                )}

                {!question.is_case_study && (
                  <Text style={[styles.questionText, { color: textPrimary }]}>
                    {language === 'hi' && question.text_hindi ? question.text_hindi : question.text_english}
                  </Text>
                )}

                {question.sub_questions && question.sub_questions.length > 0 && (
                  <View style={styles.subQuestionsList}>
                    {question.sub_questions.map((subQ, idx) => (
                      <View key={idx} style={styles.subQuestionRow}>
                        <Text style={[styles.subQuestionIndex, { color: accent }]}>
                          ({String.fromCharCode(97 + idx)})
                        </Text>
                        <Text style={[styles.subQuestionText, { color: textPrimary }]}>{subQ}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Mode Switcher (Typed Answer vs Upload Handwritten Sheets) */}
          <View style={[styles.modeTabsRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('typed')}
              style={[styles.modeTabBtn, mode === 'typed' && styles.modeTabBtnActive]}>
              <PenTool size={16} color={mode === 'typed' ? accent : textSecondary} />
              <Text style={[styles.modeTabBtnText, { color: mode === 'typed' ? accent : textSecondary }]}>
                Option 1: Type Answer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('handwritten')}
              style={[styles.modeTabBtn, mode === 'handwritten' && styles.modeTabBtnActive]}>
              <Upload size={16} color={mode === 'handwritten' ? accent : textSecondary} />
              <Text style={[styles.modeTabBtnText, { color: mode === 'handwritten' ? accent : textSecondary }]}>
                Option 2: Upload Handwritten Sheet ({attachments.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode 1: Typed Editor */}
          {mode === 'typed' && (
            <View style={[styles.editorCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Word Count Bar */}
              <View style={[styles.editorMetaBar, { borderBottomColor: cardBorder }]}>
                <View style={styles.liveWordCountRow}>
                  <Text style={[styles.liveWordCountNum, { color: isExceedingWordLimit ? '#EF4444' : isCloseToWordLimit ? '#F59E0B' : accent }]}>
                    {wordCount}
                  </Text>
                  <Text style={[styles.liveWordCountLimit, { color: textSecondary }]}> / {wordLimit} words</Text>
                </View>

                {isExceedingWordLimit && (
                  <View style={styles.limitWarningPill}>
                    <AlertCircle size={13} color="#EF4444" />
                    <Text style={styles.limitWarningText}>Exceeding prescribed limit</Text>
                  </View>
                )}
              </View>

              <TextInput
                multiline
                textAlignVertical="top"
                placeholder="Write your UPSC Mains answer here. Maintain Introduction -> Body (Points/Sub-headings) -> Forward-looking Conclusion structure..."
                placeholderTextColor={textMuted}
                value={answerText}
                onChangeText={setAnswerText}
                style={[styles.editorInput, { color: textPrimary }]}
              />
            </View>
          )}

          {/* Mode 2: Handwritten Answer Sheet Upload */}
          {mode === 'handwritten' && (
            <View style={[styles.uploadCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.uploadCardHeader}>
                <View>
                  <Text style={[styles.uploadTitle, { color: textPrimary }]}>Upload Handwritten Answer Sheet</Text>
                  <Text style={[styles.uploadSub, { color: textSecondary }]}>
                    Support JPG, JPEG, PNG and scanned pages. You can upload multiple pages, reorder, and preview.
                  </Text>
                </View>

                <View style={styles.uploadActionButtons}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCaptureCamera}
                    style={[styles.actionPickBtn, { borderColor: cardBorder }]}>
                    <Camera size={15} color={textPrimary} />
                    <Text style={[styles.actionPickBtnText, { color: textPrimary }]}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickImages}
                    style={[styles.actionPickBtn, { backgroundColor: isDark ? 'rgba(245, 130, 53, 0.15)' : 'rgba(245, 130, 53, 0.1)', borderColor: 'transparent' }]}>
                    <ImageIcon size={15} color={accent} />
                    <Text style={[styles.actionPickBtnText, { color: accent }]}>Choose Files</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Uploaded Pages List */}
              {attachments.length === 0 ? (
                <View style={[styles.emptyUploadBox, { borderColor: cardBorder }]}>
                  <Upload size={32} color={textMuted} />
                  <Text style={[styles.emptyUploadTitle, { color: textPrimary }]}>No answer sheets uploaded yet</Text>
                  <Text style={[styles.emptyUploadSub, { color: textSecondary }]}>
                    Take photos of your written answer booklet or pick files from your device.
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadedPagesList}>
                  {attachments.map((att, idx) => (
                    <View key={att.id || idx} style={[styles.pageRowItem, { backgroundColor: isDark ? '#1A2333' : '#F8FAFC', borderColor: cardBorder }]}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setPreviewImageUri(att.file_uri)}
                        style={styles.pageThumbWrap}>
                        <Image source={{ uri: att.file_uri }} style={styles.pageThumb} resizeMode="cover" />
                        <View style={styles.zoomIconOverlay}>
                          <Maximize2 size={12} color="#FFF" />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.pageMetaWrap}>
                        <Text style={[styles.pageTitle, { color: textPrimary }]}>Page {att.page_number || idx + 1}</Text>
                        <Text style={[styles.pageFileName, { color: textSecondary }]} numberOfLines={1}>
                          {att.file_name}
                        </Text>
                      </View>

                      {/* Rearrange & Remove Controls */}
                      <View style={styles.pageControlsRow}>
                        <TouchableOpacity
                          disabled={idx === 0}
                          onPress={() => handleMovePage(idx, 'up')}
                          style={[styles.iconActionBtn, idx === 0 && { opacity: 0.3 }]}>
                          <ArrowUp size={16} color={textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          disabled={idx === attachments.length - 1}
                          onPress={() => handleMovePage(idx, 'down')}
                          style={[styles.iconActionBtn, idx === attachments.length - 1 && { opacity: 0.3 }]}>
                          <ArrowDown size={16} color={textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemovePage(idx)}
                          style={[styles.iconActionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Submit Action Bar */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmitAnswer}
              disabled={isSubmitting}
              style={[styles.submitFinalBtn, { backgroundColor: accent }]}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={18} color="#FFFFFF" />
                  <Text style={styles.submitFinalBtnText}>Submit Answer for UPSC Evaluation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Evaluation Loading Overlay */}
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={[styles.loadingTitle, { color: textPrimary }]}>Evaluating UPSC Answer</Text>
              <Text style={[styles.loadingStep, { color: textSecondary }]}>{evaluationStep}</Text>
              <View style={[styles.loadingPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.loadingPillText, { color: textMuted }]}>
                  Rigorous civil services scoring in progress...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Full Image Preview Modal */}
        {previewImageUri && (
          <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setPreviewImageUri(null)}>
            <View style={styles.imageModalBackdrop}>
              <TouchableOpacity style={styles.imageModalCloseBtn} onPress={() => setPreviewImageUri(null)}>
                <X size={26} color="#FFFFFF" />
              </TouchableOpacity>
              <Image source={{ uri: previewImageUri }} style={styles.imageModalFull} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paperBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  paperBadgeText: { fontSize: 11, fontWeight: '700' },
  qNumTitle: { fontSize: 16, fontWeight: '700' },
  metaPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  metaPillText: { fontSize: 12, fontWeight: '600' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  draftStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  draftSavedText: { fontSize: 11 },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveDraftBtnText: { fontSize: 12, fontWeight: '600' },
  iconCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: { padding: 16, paddingBottom: 60, maxWidth: 900, alignSelf: 'center', width: '100%', gap: 16 },
  questionCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  questionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qHeaderTitleRow: { flex: 1, marginRight: 10 },
  questionMetaHeader: { fontSize: 12, fontWeight: '600' },
  questionCardTools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  langToggleBtnText: { fontSize: 12, fontWeight: '600' },
  collapseBtn: { padding: 4 },
  questionBody: { gap: 10, marginTop: 4 },
  questionTitleText: { fontSize: 15, fontWeight: '700' },
  caseScenarioBox: { padding: 14, borderRadius: 8, borderWidth: 1, gap: 6 },
  caseScenarioLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  questionText: { fontSize: 14, lineHeight: 22 },
  subQuestionsList: { gap: 8, marginTop: 4 },
  subQuestionRow: { flexDirection: 'row', gap: 8 },
  subQuestionIndex: { fontSize: 13, fontWeight: '700' },
  subQuestionText: { fontSize: 13, flex: 1, lineHeight: 20 },
  modeTabsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabBtnActive: {
    borderBottomColor: '#FF9500',
  },
  modeTabBtnText: { fontSize: 13, fontWeight: '600' },
  editorCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  editorMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  liveWordCountRow: { flexDirection: 'row', alignItems: 'baseline' },
  liveWordCountNum: { fontSize: 16, fontWeight: '800' },
  liveWordCountLimit: { fontSize: 13 },
  limitWarningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  limitWarningText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
  editorInput: {
    minHeight: 280,
    padding: 16,
    fontSize: 15,
    lineHeight: 26,
  },
  uploadCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadTitle: { fontSize: 15, fontWeight: '700' },
  uploadSub: { fontSize: 12, marginTop: 2, maxWidth: 450 },
  uploadActionButtons: { flexDirection: 'row', gap: 8 },
  actionPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPickBtnText: { fontSize: 12, fontWeight: '600' },
  emptyUploadBox: {
    padding: 30,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  emptyUploadTitle: { fontSize: 14, fontWeight: '700' },
  emptyUploadSub: { fontSize: 12, textAlign: 'center' },
  uploadedPagesList: { gap: 10 },
  pageRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  pageThumbWrap: {
    width: 60,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  pageThumb: { width: '100%', height: '100%' },
  zoomIconOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 3,
    padding: 3,
  },
  pageMetaWrap: { flex: 1 },
  pageTitle: { fontSize: 14, fontWeight: '700' },
  pageFileName: { fontSize: 11, marginTop: 2 },
  pageControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitSection: { marginTop: 8 },
  submitFinalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitFinalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999,
  },
  loadingBox: {
    width: '100%',
    maxWidth: 420,
    padding: 26,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700' },
  loadingStep: { fontSize: 13, textAlign: 'center' },
  loadingPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 6 },
  loadingPillText: { fontSize: 11 },
  imageModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  imageModalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  imageModalFull: { width: '92%', height: '85%' },
});
