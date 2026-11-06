import { getAllMainsQuestions } from '@/data/mainsQuestionRepository';
import { CommunityService } from '@/services/communityService';
import { ExchangeType, PeerReviewExchangeRequest } from '@/types/community';
import { MainsAttachmentRecord, MainsPaperId } from '@/types/mains';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeftRight,
  Camera,
  Check,
  Eye,
  ImageIcon,
  Trash2,
  Upload,
  Users,
  X
} from 'lucide-react-native';
import { useState } from 'react';
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

interface CreateExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onExchangeCreated: (request: PeerReviewExchangeRequest) => void;
}

const EXCHANGE_TYPES: {
  type: ExchangeType;
  title: string;
  badge: string;
  desc: string;
  icon: any;
}[] = [
    {
      type: 'mutual',
      title: 'Mutual Answer Exchange',
      badge: 'Recommended',
      desc: 'You and a peer both submit answers to this question and evaluate each other.',
      icon: ArrowLeftRight,
    },
    {
      type: 'review_only',
      title: 'Review Only Request',
      badge: '1-Way',
      desc: 'Submit your answer sheet and request a verified peer to review it.',
      icon: Eye,
    },
    {
      type: 'open_review',
      title: 'Open Community Review',
      badge: 'Open Pool',
      desc: 'Make answer sheet open for any eligible peer in the community to evaluate.',
      icon: Users,
    },
  ];

const PAPERS: { id: MainsPaperId; title: string }[] = [
  { id: 'GS4', title: 'GS IV (Ethics)' },
  { id: 'GS1', title: 'GS I (History & Geo)' },
  { id: 'GS2', title: 'GS II (Polity & Governance)' },
  { id: 'GS3', title: 'GS III (Economy & Env)' },
  { id: 'ESSAY', title: 'Essay' },
];

export function CreateExchangeModal({
  isOpen,
  onClose,
  isDark,
  onExchangeCreated,
}: CreateExchangeModalProps) {
  const [exchangeType, setExchangeType] = useState<ExchangeType>('mutual');
  const [paperId, setPaperId] = useState<MainsPaperId>('GS4');
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [marks, setMarks] = useState<number>(10);
  const [wordLimit, setWordLimit] = useState<number>(150);
  const [deadlineHours, setDeadlineHours] = useState<number>(48);
  const [partnerRequirements, setPartnerRequirements] = useState('');
  const [attachments, setAttachments] = useState<MainsAttachmentRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Repo questions
  const [isSelectingFromRepo, setIsSelectingFromRepo] = useState(false);
  const repoQuestions = getAllMainsQuestions().filter((q) => q.paper_id === paperId);

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#F58235';

  const handlePickFromRepo = (q: (typeof repoQuestions)[0]) => {
    setQuestionTitle(q.title || `Q${q.question_number}: ${q.text_english.slice(0, 50)}`);
    setQuestionText(q.text_english);
    setTopic(q.topic);
    setMarks(q.marks);
    setWordLimit(q.word_limit);
    setIsSelectingFromRepo(false);
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is needed to upload answer sheets.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (!res.canceled && res.assets) {
        const newAtts: MainsAttachmentRecord[] = res.assets.map((asset, idx) => ({
          id: `att_${Date.now()}_${idx}`,
          file_uri: asset.uri,
          file_name: `Answer_Page_${attachments.length + idx + 1}.jpg`,
          file_type: 'image/jpeg',
          file_size: asset.fileSize,
          page_number: attachments.length + idx + 1,
        }));
        setAttachments((prev) => [...prev, ...newAtts]);
      }
    } catch { }
  };

  const handleCaptureCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is needed.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
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
    } catch { }
  };

  const handleCreate = async () => {
    if (!questionText.trim()) {
      Alert.alert('Question Required', 'Please enter or select a question.');
      return;
    }
    if (attachments.length === 0) {
      Alert.alert('Answer Sheet Required', 'Please attach your answer sheet pages.');
      return;
    }

    setIsSubmitting(true);
    try {
      const request = await CommunityService.createExchangeRequest({
        exchange_type: exchangeType,
        paper_id: paperId,
        topic: topic.trim() || 'Mains Practice Question',
        question_title: questionTitle.trim() || undefined,
        question_text: questionText.trim(),
        question_marks: marks,
        question_word_limit: wordLimit,
        deadline_hours: deadlineHours,
        partner_requirements: partnerRequirements.trim() || undefined,
        submission: {
          attachments,
        },
      });

      Alert.alert(
        'Request Live!',
        'Your peer review exchange request is now posted. When a peer accepts, you will be notified.'
      );
      onExchangeCreated(request);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Create Review Request</Text>
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleCreate}
            style={[styles.postBtn, { backgroundColor: accent }, isSubmitting && { opacity: 0.6 }]}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postBtnText}>Post Request</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Exchange Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: textSecondary }]}>
              SELECT EXCHANGE TYPE
            </Text>
            <View style={styles.typeCardsCol}>
              {EXCHANGE_TYPES.map((et) => {
                const isSelected = et.type === exchangeType;
                const IconComponent = et.icon;
                return (
                  <TouchableOpacity
                    key={et.type}
                    onPress={() => setExchangeType(et.type)}
                    style={[
                      styles.typeCard,
                      { backgroundColor: surface, borderColor: isSelected ? accent : border },
                      isSelected && { borderWidth: 2 },
                    ]}>
                    <View style={styles.typeCardTop}>
                      <View style={[styles.typeIconBox, { backgroundColor: `${accent}15` }]}>
                        <IconComponent size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.typeTitle, { color: textPrimary }]}>{et.title}</Text>
                          <View style={[styles.typeBadge, { backgroundColor: `${accent}15` }]}>
                            <Text style={[styles.typeBadgeText, { color: accent }]}>{et.badge}</Text>
                          </View>
                        </View>
                        <Text style={[styles.typeDesc, { color: textSecondary }]}>{et.desc}</Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: accent }]}>
                          <Check size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Paper Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: textSecondary }]}>SELECT PAPER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paperRow}>
              {PAPERS.map((p) => {
                const isSelected = p.id === paperId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPaperId(p.id)}
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

          {/* Database Question Quick Picker */}
          {repoQuestions.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSelectingFromRepo(!isSelectingFromRepo)}
              style={[styles.repoPickerBar, { backgroundColor: surfaceSubtle, borderColor: border }]}>
              <Text style={[styles.repoPickerText, { color: accent }]}>
                {isSelectingFromRepo ? 'Hide Database Questions' : 'Import from UPSC Question Database'}
              </Text>
            </TouchableOpacity>
          )}

          {isSelectingFromRepo && (
            <View style={[styles.repoBox, { backgroundColor: surface, borderColor: border }]}>
              {repoQuestions.map((q) => (
                <TouchableOpacity
                  key={q.id}
                  onPress={() => handlePickFromRepo(q)}
                  style={[styles.repoItem, { borderBottomColor: border }]}>
                  <Text style={[styles.repoItemNum, { color: accent }]}>
                    Q{q.question_number} • {q.marks}M
                  </Text>
                  <Text style={[styles.repoItemDesc, { color: textPrimary }]} numberOfLines={2}>
                    {q.text_english}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Question Text & Details */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Question & Topic</Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Topic / Subject Area *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="e.g. Case Study: Procurement Scandal"
                placeholderTextColor={textMuted}
                value={topic}
                onChangeText={setTopic}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Question Text *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border },
                ]}
                placeholder="Enter full question..."
                placeholderTextColor={textMuted}
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={3}
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
                        setMarks(m);
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
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Review Deadline</Text>
                <View style={styles.marksRow}>
                  {[24, 48, 72].map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDeadlineHours(d)}
                      style={[
                        styles.markBtn,
                        { borderColor: deadlineHours === d ? accent : border },
                        deadlineHours === d && { backgroundColor: `${accent}15` },
                      ]}>
                      <Text style={{ color: deadlineHours === d ? accent : textPrimary, fontWeight: '700' }}>
                        {d}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                Partner Requirements / Review Notes (Optional)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceSubtle, color: textPrimary, borderColor: border }]}
                placeholder="e.g. Please check if stakeholders & 2nd ARC quotes are adequate."
                placeholderTextColor={textMuted}
                value={partnerRequirements}
                onChangeText={setPartnerRequirements}
              />
            </View>
          </View>

          {/* Upload Answer Sheet */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.uploadHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  Your Answer Sheet *
                </Text>
                <Text style={[styles.cardSub, { color: textSecondary }]}>
                  {attachments.length} {attachments.length === 1 ? 'page' : 'pages'} uploaded
                </Text>
              </View>

              <View style={styles.uploadActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCaptureCamera}
                  style={[styles.actionBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
                  <Camera size={15} color={textPrimary} />
                  <Text style={[styles.actionBtnText, { color: textPrimary }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickImages}
                  style={[styles.actionBtn, { backgroundColor: `${accent}15`, borderColor: accent }]}>
                  <ImageIcon size={15} color={accent} />
                  <Text style={[styles.actionBtnText, { color: accent }]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            {attachments.length === 0 ? (
              <View style={[styles.dropZone, { borderColor: border }]}>
                <Upload size={24} color={textMuted} />
                <Text style={[styles.dropZoneText, { color: textSecondary }]}>
                  Upload your handwritten answer sheet so your peer reviewer can inspect it.
                </Text>
              </View>
            ) : (
              <View style={styles.attachmentsGrid}>
                {attachments.map((att, idx) => (
                  <View key={att.id} style={[styles.thumbCard, { borderColor: border }]}>
                    <Image source={{ uri: att.file_uri }} style={styles.thumbImage} />
                    <View style={styles.pageBadge}>
                      <Text style={styles.pageBadgeText}>P{idx + 1}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        setAttachments((prev) =>
                          prev.filter((a) => a.id !== att.id).map((a, i) => ({ ...a, page_number: i + 1 }))
                        )
                      }
                      style={styles.removeBtn}>
                      <Trash2 size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: {
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
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  typeCardsCol: {
    gap: 10,
  },
  typeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  typeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
  },
  repoPickerBar: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  repoPickerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  repoBox: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    padding: 8,
  },
  repoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 2,
  },
  repoItemNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  repoItemDesc: {
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
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  marksRow: {
    flexDirection: 'row',
    gap: 6,
  },
  markBtn: {
    flex: 1,
    paddingVertical: 8,
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dropZoneText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  thumbCard: {
    width: 80,
    height: 110,
    borderRadius: 8,
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
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

