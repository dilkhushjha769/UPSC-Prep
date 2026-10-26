import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  X,
  Bookmark,
  FileText,
  Plus,
  Trash2,
} from '@/components/common/LucideIcons';
import { BW_THEME } from '@/constants/bwTheme';

interface NoteItem {
  id: string;
  title: string;
  date: string;
  content: string;
}

interface NotesLibraryModalProps {
  visible: boolean;
  initialTab?: 'notes' | 'library';
  initialNoteTitle?: string;
  onClose: () => void;
  isDark: boolean;
  savedItemIds: string[];
  onRemoveSavedItem: (id: string) => void;
  onOpenItem: (id: string) => void;
}

export function NotesLibraryModal({
  visible,
  initialTab = 'notes',
  initialNoteTitle = '',
  onClose,
  isDark,
  savedItemIds,
  onRemoveSavedItem,
  onOpenItem,
}: NotesLibraryModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [activeTab, setActiveTab] = useState<'notes' | 'library'>(initialTab);
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n_1',
      title: 'Judicial Autonomy & Art 324 Pointers',
      date: '25 Oct 2026',
      content: 'Anoop Baranwal case: CJI excluded from CEC panel. Mention UK JAC and South Africa Chapter 9 institutions for global comparison.',
    },
    {
      id: 'n_2',
      title: 'Green Hydrogen SIGHT Scheme Formula',
      date: '24 Oct 2026',
      content: 'Production target: 5 MMT by 2030. Electrolyser component requires min 50% domestic value addition. Direct relevance to GS-3 energy security.',
    },
  ]);

  const [isAddingNote, setIsAddingNote] = useState(Boolean(initialNoteTitle));
  const [newTitle, setNewTitle] = useState(initialNoteTitle);
  const [newContent, setNewContent] = useState('');

  const handleAddNote = () => {
    if (!newTitle.trim()) return;
    const note: NoteItem = {
      id: `note_${Date.now()}`,
      title: newTitle.trim(),
      date: 'Today',
      content: newContent.trim(),
    };
    setNotes((prev) => [note, ...prev]);
    setNewTitle('');
    setNewContent('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
          </Pressable>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'notes' && styles.tabBtnActive]}
              onPress={() => setActiveTab('notes')}
            >
              <FileText size={14} color={activeTab === 'notes' ? (isDark ? '#000000' : '#FFFFFF') : theme.textSecondary} />
              <Text style={[styles.tabBtnText, activeTab === 'notes' && styles.tabBtnTextActive]}>
                Notes ({notes.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, activeTab === 'library' && styles.tabBtnActive]}
              onPress={() => setActiveTab('library')}
            >
              <Bookmark size={14} color={activeTab === 'library' ? (isDark ? '#000000' : '#FFFFFF') : theme.textSecondary} />
              <Text style={[styles.tabBtnText, activeTab === 'library' && styles.tabBtnTextActive]}>
                My Library ({savedItemIds.length})
              </Text>
            </Pressable>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'notes' ? (
            /* NOTES SECTION */
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Current Affairs Revision Notes</Text>
                {!isAddingNote && (
                  <Pressable style={styles.addNoteTrigger} onPress={() => setIsAddingNote(true)}>
                    <Plus size={14} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.2} />
                    <Text style={styles.addNoteTriggerText}>Add Note</Text>
                  </Pressable>
                )}
              </View>

              {/* Note Creator Form */}
              {isAddingNote && (
                <View style={styles.newNoteCard}>
                  <Text style={styles.newNoteLabel}>New Revision Note</Text>
                  <TextInput
                    style={styles.inputTitle}
                    placeholder="Topic / Concept title..."
                    placeholderTextColor={theme.textMuted}
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                  <TextInput
                    style={styles.inputContent}
                    placeholder="Key factual pointers, article numbers, committee names..."
                    placeholderTextColor={theme.textMuted}
                    value={newContent}
                    onChangeText={setNewContent}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.newNoteActions}>
                    <Pressable style={styles.cancelBtn} onPress={() => setIsAddingNote(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.saveNoteBtn} onPress={handleAddNote}>
                      <Text style={styles.saveNoteBtnText}>Save Note</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Notes List */}
              {notes.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No Notes Yet</Text>
                  <Text style={styles.emptySub}>Capture concise exam pointers while reviewing daily editorials.</Text>
                </View>
              ) : (
                notes.map((note) => (
                  <View key={note.id} style={styles.noteCard}>
                    <View style={styles.noteTopRow}>
                      <Text style={styles.noteTitle}>{note.title}</Text>
                      <Pressable style={styles.trashBtn} onPress={() => handleDeleteNote(note.id)}>
                        <Trash2 size={14} color={theme.textMuted} strokeWidth={2} />
                      </Pressable>
                    </View>
                    <Text style={styles.noteDate}>{note.date}</Text>
                    <Text style={styles.noteBody}>{note.content}</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            /* MY LIBRARY SECTION */
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>Saved Articles & Events</Text>

              {savedItemIds.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Bookmark size={24} color={theme.textMuted} strokeWidth={1.8} />
                  <Text style={styles.emptyTitle}>No Bookmarked Items</Text>
                  <Text style={styles.emptySub}>
                    Tap the Bookmark icon on any daily event or editorial to save it here for fast revision.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {savedItemIds.map((id, idx) => (
                    <View key={id} style={styles.libraryCard}>
                      <Pressable style={styles.libraryCardBody} onPress={() => onOpenItem(id)}>
                        <Text style={styles.libraryItemIndex}>Bookmark #{idx + 1}</Text>
                        <Text style={styles.libraryItemTitle}>Reference Item: {id}</Text>
                        <Text style={styles.libraryItemAction}>Tap to view exam breakdown →</Text>
                      </Pressable>
                      <Pressable style={styles.removeSavedBtn} onPress={() => onRemoveSavedItem(id)}>
                        <Trash2 size={15} color="#EF4444" strokeWidth={2} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceMuted,
      borderRadius: 8,
      padding: 3,
      gap: 4,
    },
    tabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    tabBtnActive: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
    },
    tabBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    tabBtnTextActive: {
      color: isDark ? '#000000' : '#FFFFFF',
      fontWeight: '700',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    sectionContainer: {
      gap: 14,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    addNoteTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 7,
    },
    addNoteTriggerText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDark ? '#000000' : '#FFFFFF',
    },
    newNoteCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 10,
    },
    newNoteLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    inputTitle: {
      backgroundColor: theme.surfaceMuted,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    inputContent: {
      backgroundColor: theme.surfaceMuted,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12.5,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      textAlignVertical: 'top',
      minHeight: 80,
    },
    newNoteActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 4,
    },
    cancelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 6,
    },
    cancelBtnText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
    },
    saveNoteBtn: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 6,
    },
    saveNoteBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#000000' : '#FFFFFF',
    },
    noteCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 6,
    },
    noteTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    noteTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
    },
    trashBtn: {
      padding: 4,
    },
    noteDate: {
      fontSize: 11,
      color: theme.textMuted,
    },
    noteBody: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
      marginTop: 2,
    },
    emptyCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 30,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 8,
      marginTop: 10,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    emptySub: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 17,
      maxWidth: 300,
    },
    libraryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    libraryCardBody: {
      flex: 1,
      gap: 3,
    },
    libraryItemIndex: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    libraryItemTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    libraryItemAction: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    removeSavedBtn: {
      padding: 8,
    },
  });
