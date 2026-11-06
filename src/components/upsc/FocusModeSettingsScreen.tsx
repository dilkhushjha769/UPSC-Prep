import { PrimaryToggle } from '@/components/common/PrimaryToggle';
import { useAppTheme } from '@/context/ThemeContext';
import { examFocusService } from '@/services/examFocusService';
import { Check, ChevronLeft, ExternalLink } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  isDark?: boolean;
  onBack: () => void;
}

const APPS: { id: string; name: string; pkg: string }[] = [
  { id: 'whatsapp', name: 'WhatsApp', pkg: 'com.whatsapp' },
  { id: 'instagram', name: 'Instagram', pkg: 'com.instagram.android' },
  { id: 'youtube', name: 'YouTube', pkg: 'com.google.android.youtube' },
  { id: 'telegram', name: 'Telegram', pkg: 'org.telegram.messenger' },
  { id: 'facebook', name: 'Facebook', pkg: 'com.facebook.katana' },
  { id: 'x', name: 'X (Twitter)', pkg: 'com.twitter.android' },
  { id: 'snapchat', name: 'Snapchat', pkg: 'com.snapchat.android' },
  { id: 'gmail', name: 'Gmail', pkg: 'com.google.android.gm' },
  { id: 'chrome', name: 'Chrome', pkg: 'com.android.chrome' },
  { id: 'games', name: 'Games', pkg: '' },
];

export function FocusModeSettingsScreen({ isDark: propIsDark, onBack }: Props) {
  const { isDark: appIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : appIsDark;
  const [enabled, setEnabled] = useState(examFocusService.isEnabledByUser());
  const [selected, setSelected] = useState<string[]>(examFocusService.getFocusApps());
  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    const t = setTimeout(() => setSelected(examFocusService.getFocusApps()), 150);
    return () => clearTimeout(t);
  }, []);

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const card = isDark ? '#141C28' : '#FFFFFF';
  const border = isDark ? '#253244' : '#EAE5DC';
  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const track = { false: isDark ? '#1B2534' : '#DDD6CA', true: '#F58235' };

  const toggleApp = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    void examFocusService.setFocusApps(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderColor: border }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Back">
          <ChevronLeft size={22} color={text} />
        </Pressable>
        <Text style={[styles.title, { color: text }]}>Focus Mode</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: text }]}>Enable Focus Mode during tests</Text>
              <Text style={[styles.rowSub, { color: muted }]}>
                Mutes in-app reminders and sounds while a quiz or mock test is running.
              </Text>
            </View>
            <PrimaryToggle
              value={enabled}
              onValueChange={(v) => {
                setEnabled(v);
                void examFocusService.setEnabledByUser(v);
              }}
              isDark={isDark}
              activeTrackColor="#B9570A"
            />
          </View>
        </View>

        <Text style={[styles.section, { color: muted }]}>APPS TO SILENCE DURING TESTS</Text>
        <View style={[styles.note, { backgroundColor: isDark ? '#1B2534' : '#E9EDF9', borderColor: border }]}>
          <Text style={[styles.noteText, { color: muted }]}>
            {isAndroid
              ? 'Android does not let one app block or mute another app. Pick the apps that distract you, then tap "Mute" to open that app’s own notification settings and turn its notifications off yourself.'
              : 'Browsers and iOS do not let an app block other apps. Pick the apps that distract you and silence them from your device settings or Do Not Disturb before you start.'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border, paddingVertical: 4 }]}>
          {APPS.map((app, i) => {
            const on = selected.includes(app.id);
            return (
              <View key={app.id} style={[styles.appRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: border }]}>
                <Pressable style={styles.appMain} onPress={() => toggleApp(app.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <View style={[styles.check, { borderColor: on ? '#B9570A' : border, backgroundColor: on ? '#B9570A' : 'transparent' }]}>
                    {on && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.appName, { color: text }]}>{app.name}</Text>
                </Pressable>
                {isAndroid && on && app.pkg !== '' && (
                  <Pressable onPress={() => examFocusService.openAppNotificationSettings(app.pkg)} style={styles.muteBtn}>
                    <Text style={styles.muteText}>Mute</Text>
                    <ExternalLink size={12} color="#B9570A" />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {isAndroid && (
          <Pressable
            onPress={() => examFocusService.openAndroidDndSettings()}
            style={[styles.dndBtn, { backgroundColor: card, borderColor: border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: text }]}>Do Not Disturb access</Text>
              <Text style={[styles.rowSub, { color: muted }]}>
                Opens Android settings so you can allow this app to use Do Not Disturb. Nothing changes until you grant it.
              </Text>
            </View>
            <ExternalLink size={16} color={muted} />
          </Pressable>
        )}

        {Platform.OS === 'web' && (
          <Pressable onPress={() => Linking.openSettings().catch(() => { })} style={{ display: 'none' }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: 16, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 14.5, fontWeight: '700' },
  rowSub: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  section: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 8 },
  note: { borderRadius: 12, borderWidth: 1, padding: 12 },
  noteText: { fontSize: 12, lineHeight: 18 },
  appRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  appMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14.5, fontWeight: '600' },
  muteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(13,110,253,0.12)' },
  muteText: { fontSize: 12, fontWeight: '700', color: '#B9570A' },
  dndBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
});

