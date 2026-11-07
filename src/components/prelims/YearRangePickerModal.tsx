import React from 'react';
import { usePrelimsTheme } from '@/constants/prelimsTheme';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CalendarDays, Check, X } from 'lucide-react-native';

export type YearRangeSelection = 'all' | 'recent5' | 'earlier5' | number;

interface YearRangePickerModalProps {
  visible: boolean;
  selectedRange: YearRangeSelection;
  paper: 'gs1' | 'gs2';
  isDark?: boolean;
  onSelect: (selection: YearRangeSelection) => void;
  onClose: () => void;
}

export function YearRangePickerModal({
  visible,
  selectedRange,
  paper,
  isDark: propIsDark,
  onSelect,
  onClose,
}: YearRangePickerModalProps) {
  const prelimsTheme = usePrelimsTheme();
  const isDark = propIsDark !== undefined ? propIsDark : prelimsTheme.isDark;
  const colors = {
    dialogBg: isDark ? '#141C28' : '#FFFFFF',
    dialogBorder: isDark ? '#253244' : '#EAE5DC',
    headerBorder: isDark ? '#253244' : '#EAE5DC',
    iconBg: isDark ? '#141C28' : '#FAF9F6',
    iconBorder: isDark ? '#253244' : '#EAE5DC',
    textPrimary: isDark ? '#F0F4F8' : '#1C2433',
    textSecondary: isDark ? '#9DA8B9' : '#7A8499',
    rowBg: isDark ? '#141C28' : '#FAF9F6',
    rowBorder: isDark ? '#253244' : '#EAE5DC',
    chipBg: isDark ? '#141C28' : '#FAF9F6',
    chipBorder: isDark ? '#253244' : '#EAE5DC',
  };
  const isGS1 = paper === 'gs1';
  const years = isGS1
    ? [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016]
    : [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

  const presets = [
    {
      key: 'all' as const,
      label: isGS1 ? 'All Years (2016 – 2026)' : 'All Years (2018 – 2026)',
      sub: isGS1 ? '1,100 Verified Questions' : '720 Verified Questions',
    },
    {
      key: 'recent5' as const,
      label: 'Recent 5 Years (2022 – 2026)',
      sub: isGS1 ? '500 Questions' : '400 Questions',
    },
    {
      key: 'earlier5' as const,
      label: isGS1 ? 'Earlier Years (2016 – 2021)' : 'Earlier Years (2018 – 2021)',
      sub: isGS1 ? '600 Questions' : '320 Questions',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.dialog, { backgroundColor: colors.dialogBg, borderColor: colors.dialogBorder }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.headerBorder }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconTile, { backgroundColor: colors.iconBg, borderColor: colors.iconBorder }]}>
                <CalendarDays size={18} color={colors.textPrimary} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Examination Year</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Filter questions by exam cycle</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              onPress={onClose}
              accessibilityLabel="Close year picker"
            >
              <X size={16} color="#9DA8B9" strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Preset Options */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RANGE PRESETS</Text>
            {presets.map((preset) => {
              const isSelected = selectedRange === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  style={({ pressed }) => [
                    styles.rowItem,
                    { backgroundColor: isSelected ? (isDark ? '#1B2534' : '#FFF7ED') : colors.rowBg, borderColor: isSelected ? '#FF9500' : colors.rowBorder },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    onSelect(preset.key);
                    onClose();
                  }}
                >
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowLabel, { color: isSelected ? '#FF9500' : colors.textPrimary }]}>
                      {preset.label}
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{preset.sub}</Text>
                  </View>
                  {isSelected && <Check size={18} color="#FF9500" strokeWidth={2.5} />}
                </Pressable>
              );
            })}

            {/* Individual Years Grid */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>INDIVIDUAL EXAM YEARS</Text>
            <View style={styles.yearsGrid}>
              {years.map((yr) => {
                const isSelected = selectedRange === yr;
                return (
                  <Pressable
                    key={yr}
                    style={({ pressed }) => [
                      styles.yearChip,
                      { backgroundColor: isSelected ? '#FF9500' : colors.chipBg, borderColor: isSelected ? '#FF9500' : colors.chipBorder },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      onSelect(yr);
                      onClose();
                    }}
                  >
                    <Text style={[styles.yearChipText, { color: isSelected ? '#FFFFFF' : colors.textPrimary }]}>
                      {yr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 16, 20, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    borderRadius: 14,
    padding: 18,
    ...Platform.select({
      web: { boxShadow: '0 20px 45px rgba(0,0,0,0.45)' } as object,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#253244',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F4F8',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9DA8B9',
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9DA8B9',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
    backgroundColor: '#141C28',
  },
  rowItemActive: {
    backgroundColor: '#1C2433',
    borderColor: '#FF9500',
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0F4F8',
  },
  rowLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12,
    color: '#9DA8B9',
    marginTop: 2,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  yearChip: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#141C28',
    borderWidth: 1,
    borderColor: '#253244',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearChipActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F4F8',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});

