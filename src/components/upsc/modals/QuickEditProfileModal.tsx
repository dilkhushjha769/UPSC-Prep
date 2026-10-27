import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Trash2, X } from 'lucide-react-native';
import { PALETTE, SemanticColors, Typography } from '@/constants/colors';
import { useStudy } from '@/context/StudyContext';
import { Button } from '@/components/ui/Button';

interface QuickEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

function QuickEditProfileForm({
  onClose,
  isDark,
}: {
  onClose: () => void;
  isDark: boolean;
}) {
  const { config, updateConfig } = useStudy();
  const theme = isDark ? SemanticColors.dark : SemanticColors.light;

  const [name, setName] = useState(config.aspirantName || '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(config.avatarUri);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickPhoto = async () => {
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const selectedUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setAvatarUri(selectedUri);
      }
    } catch (e) {
      console.warn('Failed to pick profile image:', e);
      Alert.alert('Image Selection', 'Could not open photo library.');
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig({
        aspirantName: trimmed,
        firstName: trimmed.split(' ')[0],
        avatarUri: avatarUri || undefined,
      });
      onClose();
    } catch {
      setErrorMsg('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = (name.trim() || 'A').charAt(0).toUpperCase();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
          borderColor: isDark ? '#383A42' : '#E8E9F1',
        },
      ]}
      onPress={(e) => {
        e.stopPropagation();
      }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Update Profile
          </Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            Change your name and profile picture
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F4F5F9',
              borderColor: isDark ? '#383A42' : '#E8E9F1',
            },
          ]}>
          <X size={16} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}>
        {Boolean(errorMsg) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Avatar Photo Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickPhoto}
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: PALETTE.highlight.primary,
                  borderColor: isDark ? '#383A42' : '#E8E9F1',
                },
              ]}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>{initialLetter}</Text>
              )}
              <View
                style={[
                  styles.cameraBadge,
                  {
                    backgroundColor: PALETTE.highlight.primary,
                    borderColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                  },
                ]}>
                <Camera size={13} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.photoActionsRow}>
            <Button
              variant="secondary"
              size="sm"
              title={avatarUri ? 'Change Photo' : 'Upload Photo'}
              isDark={isDark}
              leftIcon={<Camera size={13} color={isDark ? '#6FBAFF' : PALETTE.highlight.primary} />}
              onPress={handlePickPhoto}
            />
            {Boolean(avatarUri) && (
              <Button
                variant="tertiary"
                size="sm"
                title="Remove"
                isDark={isDark}
                leftIcon={<Trash2 size={13} color={PALETTE.support.error.medium} />}
                textStyle={{ color: PALETTE.support.error.medium }}
                onPress={() => setAvatarUri(undefined)}
              />
            )}
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Aspirant Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dilkhush Jha"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? PALETTE.neutral.dark.darkest : '#F8F9FE',
                borderColor: isDark ? '#383A42' : '#E8E9F1',
                color: theme.textPrimary,
              },
            ]}
          />
        </View>

        {/* Save Button */}
        <Button
          variant="primary"
          size="md"
          title={isSaving ? 'Saving...' : 'Save Profile'}
          disabled={isSaving}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </Pressable>
  );
}

export function QuickEditProfileModal({
  isOpen,
  onClose,
  isDark = false,
}: QuickEditProfileModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {isOpen && (
          <QuickEditProfileForm
            key={isOpen ? 'open' : 'closed'}
            onClose={onClose}
            isDark={isDark}
          />
        )}
      </Pressable>
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
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.2,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: Typography.fontFamily,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
      } as any,
    }),
  },
  saveBtn: {
    marginTop: 6,
    alignSelf: 'stretch',
    backgroundColor: PALETTE.highlight.primary,
  },
});
