import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Camera,
  Check,
  ChevronLeft,
  Crop,
  Trash2,
  Upload,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';
import { ExamMedium } from '@/types/study';
import { supabase } from '@/services/supabase';
import { PhotoCropModal } from './PhotoCropModal';

interface EditProfileScreenProps {
  isDark: boolean;
  onBack: () => void;
  onSaved?: () => void;
}

const TARGET_YEARS = [2025, 2026, 2027, 2028];
const DAILY_HOURS = [4, 6, 8, 10];
const POPULAR_OPTIONALS = [
  'PSIR',
  'Geography',
  'History',
  'Sociology',
  'Public Admin',
  'Anthropology',
  'Philosophy',
  'Economics',
];

export function EditProfileScreen({
  isDark,
  onBack,
  onSaved,
}: EditProfileScreenProps) {
  const { config, updateConfig } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  // Form Fields
  const [name, setName] = useState(config.aspirantName || config.firstName || 'Dilkhush Jha');
  const [email, setEmail] = useState(config.email || 'dilkhush.jha@gmail.com');
  const [mobile, setMobile] = useState(config.mobile || '+91-9876543210');
  const [targetYear, setTargetYear] = useState<number>(config.targetExamYear || 2026);
  const [optionalSubject, setOptionalSubject] = useState(config.optionalSubject || 'PSIR');
  const [dailyHours, setDailyHours] = useState<number>(
    Math.round((config.dailyGoalMinutes || 360) / 60)
  );
  const [medium, setMedium] = useState<ExamMedium>(config.medium || 'English');

  // Photo & Scaling State
  const [avatarUri, setAvatarUri] = useState<string | undefined>(config.avatarUri);
  const [avatarScale, setAvatarScale] = useState<number>(config.avatarScale || 1);
  const [avatarOffsetX, setAvatarOffsetX] = useState<number>(config.avatarOffsetX || 0);
  const [avatarOffsetY, setAvatarOffsetY] = useState<number>(config.avatarOffsetY || 0);
  const [avatarRotation, setAvatarRotation] = useState<number>(config.avatarRotation || 0);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initials =
    name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'UPSC';

  // Image Picker with Cropping Enabled
  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Please grant photo library access to change your profile picture.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Handled by our dedicated full-control PhotoCropModal
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const selectedUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setPendingCropUri(selectedUri);
        setIsCropModalOpen(true);
      }
    } catch (e) {
      console.warn('Failed to pick profile image:', e);
      Alert.alert('Image Selection', 'Could not open photo library.');
    }
  };

  const handleTakeNewPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera permission required',
            'Please grant camera access to capture a profile picture.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const capturedUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setPendingCropUri(capturedUri);
        setIsCropModalOpen(true);
      }
    } catch (e) {
      console.warn('Failed to capture photo:', e);
      Alert.alert('Camera', 'Could not access camera.');
    }
  };

  const handleOpenCropCurrent = () => {
    if (avatarUri) {
      setPendingCropUri(avatarUri);
      setIsCropModalOpen(true);
    } else {
      handlePickImage();
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUri(undefined);
    setPendingCropUri(null);
    setAvatarScale(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setAvatarRotation(0);
  };

  // Save to AsyncStorage + Supabase Cloud Database
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trimmedName = name.trim() || 'Aspirant';
      const trimmedEmail = email.trim() || 'aspirant@upscprep.org';

      const updatedPayload = {
        aspirantName: trimmedName,
        firstName: trimmedName.split(' ')[0] || trimmedName,
        lastName: trimmedName.split(' ').slice(1).join(' ') || '',
        email: trimmedEmail,
        mobile: mobile.trim(),
        targetExamYear: targetYear,
        optionalSubject: optionalSubject.trim(),
        dailyGoalMinutes: dailyHours * 60,
        medium,
        avatarUri,
        avatarScale,
        avatarOffsetX,
        avatarOffsetY,
        avatarRotation,
      };

      // 1. Update local storage via StudyContext
      await updateConfig(updatedPayload);

      // 2. Sync to Supabase mock_tests / user session metadata if available
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: {
              full_name: trimmedName,
              avatar_url: avatarUri,
              target_year: targetYear,
              optional_subject: optionalSubject,
            },
          });
        }
      } catch (cloudErr) {
        // Non-blocking sync log
        console.log('Cloud user profile sync info:', cloudErr);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSaved) {
          onSaved();
        } else {
          onBack();
        }
      }, 600);
    } catch (err) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.bg,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          accessibilityLabel="Back to Profile"
          style={[
            styles.backBtn,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}>
          <ChevronLeft size={20} color={theme.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Edit Profile
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSaving}
          style={[
            styles.saveHeaderBtn,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            {
              backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
              opacity: isSaving ? 0.7 : 1,
            },
          ]}>
          {isSaving ? (
            <ActivityIndicator size="small" color={isDark ? '#000000' : '#FFFFFF'} />
          ) : saveSuccess ? (
            <View style={styles.savedRow}>
              <Check size={14} color={isDark ? '#09090B' : '#FFFFFF'} strokeWidth={3} />
              <Text
                style={[
                  styles.saveBtnText,
                  { color: isDark ? '#09090B' : '#FFFFFF' },
                ]}>
                Saved
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.saveBtnText,
                { color: isDark ? '#09090B' : '#FFFFFF' },
              ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          isDesktop && styles.desktopScrollBody,
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Picture & Scaling Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenCropCurrent}
            accessibilityLabel="Adjust Photo"
            style={styles.avatarPreviewOuter}>
            <View
              style={[
                styles.avatarCircleFrame,
                {
                  backgroundColor: isDark ? '#141824' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.avatarImage,
                    {
                      transform: [
                        { scale: avatarScale },
                        { translateX: avatarOffsetX },
                        { translateY: avatarOffsetY },
                        { rotate: `${avatarRotation}deg` },
                      ],
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarInitials, { color: theme.textPrimary }]}>
                  {initials}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.avatarEditBadge,
                {
                  backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? '#09090B' : '#FFFFFF',
                },
              ]}>
              <Camera size={12} color={isDark ? '#09090B' : '#FFFFFF'} strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          {/* Balanced 2-Column Action Grid (No Stranded Buttons on Mobile) */}
          <View style={styles.photoActionsContainer}>
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handlePickImage}
                style={[
                  styles.actionPillBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}>
                <Upload size={14} color={theme.textPrimary} strokeWidth={2.2} />
                <Text style={[styles.actionPillText, { color: theme.textPrimary }]}>
                  Choose Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleTakeNewPhoto}
                style={[
                  styles.actionPillBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}>
                <Camera size={14} color={theme.textPrimary} strokeWidth={2.2} />
                <Text style={[styles.actionPillText, { color: theme.textPrimary }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>

            {Boolean(avatarUri) && (
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleOpenCropCurrent}
                  style={[
                    styles.actionPillBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}>
                  <Crop size={14} color={theme.textPrimary} strokeWidth={2.2} />
                  <Text style={[styles.actionPillText, { color: theme.textPrimary }]}>
                    Crop & Frame
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleRemovePhoto}
                  style={[
                    styles.actionPillBtn,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)',
                    },
                  ]}>
                  <Trash2 size={13} color="#EF4444" strokeWidth={2.2} />
                  <Text style={[styles.actionPillText, { color: '#EF4444' }]}>
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Input Fields Form */}
        <View style={styles.formSection}>
          <Text style={[styles.groupHeading, { color: theme.textMuted }]}>
            PERSONAL DETAILS
          </Text>

          {/* Full Name */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              ASPIRANT NAME
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Dilkhush Jha"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.cleanInput,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="aspirant@upscprep.org"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.cleanInput,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              CONTACT PHONE
            </Text>
            <TextInput
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholder="+91-9876543210"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.cleanInput,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: theme.textPrimary,
                },
              ]}
            />
          </View>

          <Text style={[styles.groupHeading, { color: theme.textMuted, marginTop: 20 }]}>
            UPSC CSE TARGET
          </Text>

          {/* Target Exam Year */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              TARGET YEAR
            </Text>
            <View style={styles.pillSelectionRow}>
              {TARGET_YEARS.map((yr) => {
                const isSelected = targetYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    onPress={() => setTargetYear(yr)}
                    activeOpacity={0.7}
                    style={[
                      styles.choicePill,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.07)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.choicePillText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#09090B'
                              : '#FFFFFF'
                            : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Optional Subject */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              OPTIONAL SUBJECT
            </Text>
            <TextInput
              value={optionalSubject}
              onChangeText={setOptionalSubject}
              placeholder="e.g. PSIR, Sociology, Geography"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.cleanInput,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: theme.textPrimary,
                  marginBottom: 8,
                },
              ]}
            />
            <View style={styles.popularTagsRow}>
              {POPULAR_OPTIONALS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setOptionalSubject(opt)}
                  activeOpacity={0.7}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor:
                        optionalSubject === opt
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                      borderColor:
                        optionalSubject === opt
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.tagChipText,
                      {
                        color:
                          optionalSubject === opt
                            ? isDark
                              ? '#09090B'
                              : '#FFFFFF'
                            : theme.textMuted,
                      },
                    ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Daily Study Goal */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              DAILY COMMITMENT
            </Text>
            <View style={styles.pillSelectionRow}>
              {DAILY_HOURS.map((hr) => {
                const isSelected = dailyHours === hr;
                return (
                  <TouchableOpacity
                    key={hr}
                    onPress={() => setDailyHours(hr)}
                    activeOpacity={0.7}
                    style={[
                      styles.choicePill,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.07)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.choicePillText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#09090B'
                              : '#FFFFFF'
                            : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {hr}h / day
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Medium */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              EXAMINATION MEDIUM
            </Text>
            <View style={styles.pillSelectionRow}>
              {(['English', 'Hindi'] as ExamMedium[]).map((med) => {
                const isSelected = medium === med;
                return (
                  <TouchableOpacity
                    key={med}
                    onPress={() => setMedium(med)}
                    activeOpacity={0.7}
                    style={[
                      styles.choicePill,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.07)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.choicePillText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#09090B'
                              : '#FFFFFF'
                            : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {med}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Bottom Save Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
          style={[
            styles.bottomSaveBtn,
            {
              backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
            },
          ]}>
          {isSaving ? (
            <ActivityIndicator size="small" color={isDark ? '#000000' : '#FFFFFF'} />
          ) : (
            <Text
              style={[
                styles.bottomSaveBtnText,
                { color: isDark ? '#09090B' : '#FFFFFF' },
              ]}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Professional Crop & Adjustment Studio Modal */}
      {Boolean(isCropModalOpen && pendingCropUri) && (
        <PhotoCropModal
          visible={isCropModalOpen}
          imageUri={pendingCropUri!}
          isDark={isDark}
          onCancel={() => {
            setIsCropModalOpen(false);
            setPendingCropUri(null);
          }}
          onApplyCroppedImage={(result) => {
            setAvatarUri(result.uri);
            setAvatarScale(1);
            setAvatarOffsetX(0);
            setAvatarOffsetY(0);
            setAvatarRotation(0);
            setIsCropModalOpen(false);
            setPendingCropUri(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  desktopScrollBody: {
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  avatarPreviewOuter: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircleFrame: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  photoActionsContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 8,
    alignItems: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  zoomControlBox: {
    marginTop: 14,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  zoomLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  zoomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoomStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  groupHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  fieldItem: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  cleanInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  pillSelectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  choicePillText: {
    fontSize: 12.5,
  },
  popularTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomSaveBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bottomSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
