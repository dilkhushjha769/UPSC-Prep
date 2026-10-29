import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Settings, X } from 'lucide-react-native';
import { PrimaryToggle } from '@/components/common/PrimaryToggle';
import { practiceSoundService, PracticeSoundSettings } from '@/services/practiceSoundService';

interface Props {
  isDark: boolean;
}

interface SoundRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  border: string;
  text: string;
  isDark: boolean;
}

function SoundRow({ label, value, onChange, disabled, border, text, isDark }: SoundRowProps) {
  return (
    <View style={[styles.row, { borderColor: border, opacity: disabled ? 0.45 : 1 }]}>
      <Text style={[styles.rowLabel, { color: text }]}>{label}</Text>
      <PrimaryToggle
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        isDark={isDark}
        activeTrackColor="#006FFD"
      />
    </View>
  );
}

/** Grey gear button that opens a small sound-effects settings sheet. */
export function PracticeSoundSettingsButton({ isDark }: Props) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<PracticeSoundSettings>(practiceSoundService.getSettings());

  useEffect(() => practiceSoundService.subscribe(setS), []);

  const grey = isDark ? '#9CA3AF' : '#6B7280';
  const text = isDark ? '#F5F5F7' : '#0F172A';
  const card = isDark ? '#1F2024' : '#FFFFFF';
  const border = isDark ? '#35373F' : '#E2E8F0';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Practice settings"
        style={({ pressed }) => [
          styles.gearBtn,
          { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' },
          pressed && { opacity: 0.7 },
        ]}>
        <Settings size={16} color={grey} strokeWidth={2.2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: card, borderColor: border }]} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: text }]}>Practice Settings</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
                <X size={18} color={grey} strokeWidth={2.2} />
              </Pressable>
            </View>
            <SoundRow label="Sound effects" value={s.enabled} onChange={(v) => practiceSoundService.update({ enabled: v })} border={border} text={text} isDark={isDark} />
            <SoundRow label="Correct answer sound" value={s.correctSound} disabled={!s.enabled} onChange={(v) => practiceSoundService.update({ correctSound: v })} border={border} text={text} isDark={isDark} />
            <SoundRow label="Wrong answer sound" value={s.incorrectSound} disabled={!s.enabled} onChange={(v) => practiceSoundService.update({ incorrectSound: v })} border={border} text={text} isDark={isDark} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gearBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: 1, padding: 18, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 14, fontWeight: '600' },
});
