import React from 'react';
import { PALETTE } from '@/constants/colors';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react-native';

interface PrelimsHeaderProps {
  isDark?: boolean;
  onBack?: () => void;
  onToggleTheme?: () => void;
  yearRangeLabel: string;
  onOpenYearPicker: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

export function PrelimsHeader({
  isDark = true,
  onBack,
  onToggleTheme,
  yearRangeLabel,
  onOpenYearPicker,
  searchQuery,
  onSearchChange,
}: PrelimsHeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const colors = {
    controlBg: isDark ? '#26282E' : '#FFFFFF',
    controlBorder: isDark ? '#35373F' : '#E8E9F1',
    textPrimary: isDark ? '#F5F5F7' : '#1F2024',
    textSecondary: isDark ? '#A7ABB5' : '#71727A',
    placeholder: isDark ? '#71727A' : '#9CA3AF',
    searchBg: isDark ? '#25272D' : '#FFFFFF',
    searchBorder: isDark ? '#35373F' : '#E8E9F1',
  };

  return (
    <View style={styles.container}>
      {/* Top Controls Row: Back Button on Left; Year Range Dropdown + Theme Toggle on Right */}
      <View style={styles.topControlRow}>
        {Boolean(onBack) ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
          >
            <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        {/* Right side controls: Year Range Button + Theme Toggle Button */}
        <View style={styles.topRightControls}>
          {/* Year Range Button */}
          <Pressable
            style={({ pressed }) => [
              styles.yearBtn,
              isMobile && styles.yearBtnMobile,
              { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
              pressed && styles.pressed,
            ]}
            onPress={onOpenYearPicker}
            accessibilityRole="button"
            accessibilityLabel={`Selected year range: ${yearRangeLabel}. Tap to change.`}
          >
            <CalendarDays size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.yearBtnText, isMobile && styles.yearBtnTextMobile, { color: colors.textPrimary }]}>{yearRangeLabel}</Text>
            <ChevronDown size={14} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>

          {/* Theme Toggle Button (Exact To-Do List design) */}
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.themeToggleBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                  borderColor: isDark ? '#383A42' : '#F0F1F5',
                },
              ]}
            >
              {isDark ? (
                <Sun size={17} color="#FBBF24" strokeWidth={2.2} />
              ) : (
                <Moon size={17} color={PALETTE.highlight.primary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Title, Subtitle & Topic Search Block */}
      <View style={[styles.mainRow, isMobile && styles.mainRowMobile]}>
        {/* Title & Subtitle */}
        <View style={styles.titleBlock}>
          <Text style={[styles.titleText, isMobile && styles.titleTextMobile, { color: colors.textPrimary }]}>Prelims Preparation</Text>
          <Text style={[styles.subtitleText, isMobile && styles.subtitleTextMobile, { color: colors.textSecondary }]}>
            Practice topic-wise, build your concepts and track your progress.
          </Text>
        </View>

        {/* Search Input Box */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.searchBg, borderColor: colors.searchBorder },
            isMobile && styles.searchContainerMobile,
          ]}
        >
          <Search size={16} color={colors.textSecondary} strokeWidth={2.2} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search topics..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {Boolean(searchQuery) && (
            <Pressable
              onPress={() => onSearchChange('')}
              style={styles.clearSearchBtn}
              accessibilityLabel="Clear search"
            >
              <X size={14} color={colors.textSecondary} strokeWidth={2.4} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  yearBtnMobile: {
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  yearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  yearBtnTextMobile: {
    fontSize: 12,
  },
  themeToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
  },
  mainRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  titleBlock: {
    flex: 1,
  },
  titleText: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 5,
  },
  titleTextMobile: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-medium' },
      web: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
      default: {},
    }),
  },
  subtitleText: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
  },
  subtitleTextMobile: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 280,
    height: 40,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  searchContainerMobile: {
    width: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontWeight: '500',
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
      default: {},
    }),
  },
  clearSearchBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
