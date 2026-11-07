import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Globe,
  ImageIcon,
  Lock,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import { CommunityPost } from '@/types/community';
import { MainsAttachmentRecord, MainsPaperId } from '@/types/mains';
import { CommunityService } from '@/services/communityService';
import { getAllMainsQuestions } from '@/data/mainsQuestionRepository';

interface PublishAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onPostCreated: (post: CommunityPost) => void;
}

const PAPERS: { id: MainsPaperId; title: string }[] = [
  { id: 'GS4', title: 'GS IV (Ethics & Cases)' },
  { id: 'GS1', title: 'GS I (History & Geo)' },
  { id: 'GS2', title: 'GS II (Polity & IR)' },
  { id: 'GS3', title: 'GS III (Economy & Sci)' },
  { id: 'ESSAY', title: 'Essay Paper' },
  { id: 'OPTIONAL', title: 'Optional Subject' },
];

export function PublishAnswerModal({
  isOpen,
  onClose,
  isDark,
  onPostCreated,
}: PublishAnswerModalProps) {
  const [paperId, setPaperId] = useState<MainsPaperId>('GS4');
  const year = '2026';
  const [marks, setMarks] = useState<10 | 15 | 20 | 125 | 250>(10);
  const [wordLimit, setWordLimit] = useState(150);
  const [topic, setTopic] = useState('');
  const [subjectArea, setSubjectArea] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [approachNote, setApproachNote] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Question Picker from Repo
  const [isSelectingFromRepo, setIsSelectingFromRepo] = useState(false);
  const [selectedRepoQuestionId, setSelectedRepoQuestionId] = useState<string | null>(null);

  // Uploaded Sheets
  const [attachments, setAttachments] = useState<MainsAttachmentRecord[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#F58235';

  const repoQuestions = getAllMainsQuestions().filter((q) => q.paper_id === paperId);

  const handlePickFromRepo = (q: (typeof repoQuestions)[0]) => {
    setSelectedRepoQuestionId(q.id);
    setQuestionTitle(q.title || `Q${q.question_number}: ${q.text_english.slice(0, 50)}`);
    setQuestionText(q.text_english);
    setTopic(q.topic);
    setSubjectArea(q.subject_area);
    setMarks(q.marks as any);
    setWordLimit(q.word_limit);
    setIsSelectingFromRepo(false);
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow gallery access to select handwritten sheets.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets) {
        const newAtts: MainsAttachmentRecord[] = result.assets.map((asset, idx) => ({
          id: `att_${Date.now()}_${idx}`,
          file_uri: asset.uri,
          file_name: asset.fileName || `Answer_Page_${attachments.length + idx + 1}.jpg`,
          file_type: 'image/jpeg',
          file_size: asset.fileSize,
          page_number: attachments.length + idx + 1,
        }));
        setAttachments((prev) => [...prev, ...newAtts]);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Could not select images.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access to photograph your answer sheets.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newAtt: MainsAttachmentRecord = {
          id: `att_${Date.now()}`,
          file_uri: asset.uri,
          file_name: `Camera_Page_${attachments.length + 1}.jpg`,
          file_type: 'image/jpeg',
          file_size: asset.fileSize,
          page_number: attachments.length + 1,
        };
        setAttachments((prev) => [...prev, newAtt]);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Could not capture photo.');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) =>
      prev.filter((a) => a.id !== id).map((a, idx) => ({ ...a, page_number: idx + 1 }))
    );
  };

  const handlePublish = async () => {
    if (!questionText.trim()) {
      Alert.alert('Question Required', 'Please enter or select the UPSC question you attempted.');
      return;
    }

    if (attachments.length === 0) {
      Alert.alert('Answer Sheet Required', 'Please upload at least one page of your answer sheet.');
      return;
    }

    setIsPublishing(true);
    try {
      const post = await CommunityService.createPost({
        paper_id: paperId,
        subject_area: subjectArea.trim() || undefined,
        topic: topic.trim() || undefined,
        question_id: selectedRepoQuestionId || undefined,
        question_title: questionTitle.trim() || undefined,
        question_text: questionText.trim(),
        year: parseInt(year, 10) || 2026,
        marks,
        word_limit: wordLimit,
        approach_note: approachNote.trim() || undefined,
        is_public: isPublic,
        attachments,
      });

      Alert.alert('Published!', 'Your answer sheet has been published to the Mains Community.');
      onPostCreated(post);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to publish answer sheet.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Publish Answer Sheet</Text>
          <TouchableOpacity
            disabled={isPublishing}
            onPress={handlePublish}
            style={[styles.publishBtn, { backgroundColor: accent }, isPublishing && { opacity: 0.6 }]}>
            {isPublishing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishBtnText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Paper Selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: textSecondary }]}>SELECT PAPER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paperRow}>
              {PAPERS.map((p) => {
                const isSelected = p.id === paperId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setPaperId(p.id);
                      setSelectedRepoQuestionId(null);
                    }}
                    style={[
                      styles.paperPill,
                      { borderColor: isSelected ? accent : border },
                      isSelected && { backgroundColor: `${accent}15` },
                    ]}>
                    <Text
                      style={[
                        styles.paperPillText,
                        { color: isSelected ? accent : textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}>
                      {p.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Quick Pick from Repository */}
          {repoQuestions.length > 0 && (
            <View style={[styles.repoPickerCard, { backgroundColor: surfaceSubtle, borderColor: border }]}>
              <View style={styles.repoPickerHeader}>
                <Text style={[styles.repoPickerTitle, { color: textPrimary }]}>
                  Use Question from Database
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsSelectingFromRepo(!isSelectingFromRepo)}
                  style={[styles.repoToggleBtn, { backgroundColor: `${accent}20` }]}>
                  <Text style={[styles.repoToggleBtnText, { color: accent }]}>
                    {isSelectingFromRepo ? 'Close' : 'Browse Questions'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isSelectingFromRepo && (
                <View style={styles.repoList}>
                  {repoQuestions.map((q) => (
                    <TouchableOpacity
                      key={q.id}
                      onPress={() => handlePickFromRepo(q)}
                      style={[
                        styles.repoItem,
                        { borderBottomColor: border },
                        selectedRepoQuestionId === q.id && { backgroundColor: `${accent}10` },
                      ]}>
                      <Text style={[styles.repoItemNumber, { color: accent }]}>
                        Q{q.question_number} ({q.marks}M)
                      </Text>
                      <Text style={[styles.repoItemText, { color: textPrimary }]} numberOfLines={2}>
                        {q.text_english}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Question Details Form */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Question Details</Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Question Title / Theme</Text>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="e.g. Nolan Committee Principles & Discretion"
                placeholderTextColor={textMuted}
                value={questionTitle}
                onChangeText={setQuestionTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Full Question Text *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border },
                ]}
                placeholder="Paste or write the complete question text..."
                placeholderTextColor={textMuted}
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Marks</Text>
                <View style={styles.marksRow}>
                  {[10, 15, 20].map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        setMarks(m as any);
                        setWordLimit(m === 10 ? 150 : 250);
                      }}
                      style={[
                        styles.markBtn,
                        { borderColor: marks === m ? accent : border },
                        marks === m && { backgroundColor: `${accent}15` },
                      ]}>
                      <Text style={{ color: marks === m ? accent : textPrimary, fontWeight: '700' }}>
                        {m}M
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Word Limit</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                  value={wordLimit.toString()}
                  onChangeText={(val) => setWordLimit(parseInt(val, 10) || 150)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Topic / Subject Area</Text>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="e.g. Administrative Ethics, Civil Service Values"
                placeholderTextColor={textMuted}
                value={topic}
                onChangeText={setTopic}
              />
            </View>
          </View>

          {/* Answer Sheet Uploads */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.uploadHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  Upload Handwritten Answer Sheets *
                </Text>
                <Text style={[styles.cardSub, { color: textSecondary }]}>
                  {attachments.length} {attachments.length === 1 ? 'page' : 'pages'} uploaded
                </Text>
              </View>

              <View style={styles.uploadActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCaptureCamera}
                  style={[styles.uploadActionBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Camera size={16} color={textPrimary} />
                  <Text style={[styles.uploadActionText, { color: textPrimary }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickImages}
                  style={[styles.uploadActionBtn, { backgroundColor: `${accent}15`, borderColor: accent }]}>
                  <ImageIcon size={16} color={accent} />
                  <Text style={[styles.uploadActionText, { color: accent }]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            {attachments.length === 0 ? (
              <View style={[styles.dropZone, { borderColor: border }]}>
                <Upload size={28} color={textMuted} />
                <Text style={[styles.dropZoneText, { color: textSecondary }]}>
                  No pages added yet. Take a clear photo of your handwritten answer or select multiple images from your device.
                </Text>
              </View>
            ) : (
              <View style={styles.attachmentsGrid}>
                {attachments.map((att, idx) => (
                  <View key={att.id} style={[styles.thumbCard, { borderColor: border }]}>
                    <Image source={{ uri: att.file_uri }} style={styles.thumbImage} />
                    <View style={styles.pageBadge}>
                      <Text style={styles.pageBadgeText}>Page {idx + 1}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(att.id)}
                      style={styles.removeBtn}>
                      <Trash2 size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Personal Strategy & Privacy */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Strategy & Visibility</Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                Your Approach / Personal Strategy (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border },
                ]}
                placeholder="Share your framework, committees quoted, or areas where you want peer feedback..."
                placeholderTextColor={textMuted}
                value={approachNote}
                onChangeText={setApproachNote}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={[styles.privacyRow, { borderTopColor: border }]}>
              <View style={styles.privacyInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {isPublic ? <Globe size={16} color="#10B981" /> : <Lock size={16} color="#F59E0B" />}
                  <Text style={[styles.privacyTitle, { color: textPrimary }]}>
                    {isPublic ? 'Public Answer Sheet' : 'Private (Only You)'}
                  </Text>
                </View>
                <Text style={[styles.privacyDesc, { color: textSecondary }]}>
                  {isPublic
                    ? 'Visible to all UPSC community aspirants for likes, peer reviews, and feedback.'
                    : 'Hidden from public feed. Saved securely to your personal archive.'}
                </Text>
              </View>

              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: border, true: `${accent}80` }}
                thumbColor={isPublic ? accent : '#F4F4F5'}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  paperRow: {
    flexDirection: 'row',
  },
  paperPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  paperPillText: {
    fontSize: 12.5,
  },
  repoPickerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  repoPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repoPickerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  repoToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  repoToggleBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  repoList: {
    marginTop: 6,
    maxHeight: 200,
  },
  repoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 2,
  },
  repoItemNumber: {
    fontSize: 11,
    fontWeight: '800',
  },
  repoItemText: {
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  marksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  markBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropZoneText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  thumbCard: {
    width: 90,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  pageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  privacyInfo: {
    flex: 1,
    gap: 4,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  privacyDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});

