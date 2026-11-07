import React from 'react';
import { FONT_FAMILY } from '@/constants/designTokens';
import { PALETTE } from '@/constants/colors';
import { usePrelimsTheme } from '@/constants/prelimsTheme';
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
  selectedPaperTab?: 'gs1' | 'gs2';
  onSelectPaperTab?: (tab: 'gs1' | 'gs2') => void;
}

export function PrelimsHeader({
  isDark: propIsDark,
  onBack,
  onToggleTheme,
  yearRangeLabel,
  onOpenYearPicker,
  searchQuery,
  onSearchChange,
  selectedPaperTab = 'gs1',
  onSelectPaperTab,
}: PrelimsHeaderProps) {
  const prelimsTheme = usePrelimsTheme();
  const isDark = propIsDark !== undefined ? propIsDark : prelimsTheme.isDark;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const colors = {
    controlBg: isDark ? '#141C28' : '#FFFFFF',
    controlBorder: isDark ? '#253244' : '#EAE5DC',
    textPrimary: isDark ? '#F0F4F8' : '#1C2433',
    textSecondary: isDark ? '#9DA8B9' : '#7A8499',
    placeholder: isDark ? '#6E7A8E' : '#8892A6',
    searchBg: isDark ? '#141C28' : '#FFFFFF',
    searchBorder: isDark ? '#253244' : '#EAE5DC',
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Controls Row: Back Button on Left; Year Range Dropdown + Theme Toggle on Right */}
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

          {/* Theme Toggle Button */}
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
                  borderColor: isDark ? '#253244' : '#F0EDE6',
                },
              ]}
            >
              {isDark ? (
                <Sun size={17} color="#FF9500" strokeWidth={2.2} />
              ) : (
                <Moon size={17} color={PALETTE.highlight.primary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Main Title & Subtitle with Clean Breathing Space */}
      <View style={styles.titleBlock}>
        <Text style={[styles.titleText, isMobile && styles.titleTextMobile, { color: colors.textPrimary }]}>
          Prelims Preparation
        </Text>
        <Text style={[styles.subtitleText, isMobile && styles.subtitleTextMobile, { color: colors.textSecondary }]}>
          Practice topic-wise, build your concepts and track your progress.
        </Text>
      </View>

      {/* 3. Unified Action Toolbar: Paper Selection Tabs on Left + Search Box on Right */}
      <View style={[styles.toolbarRow, isMobile && styles.toolbarRowMobile]}>
        {Boolean(onSelectPaperTab) && (
          <View style={styles.paperTabsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.paperTabBtn,
                {
                  backgroundColor:
                    selectedPaperTab === 'gs1' ? '#FF9500' : isDark ? '#141C28' : '#FFFFFF',
                  borderColor:
                    selectedPaperTab === 'gs1' ? '#FF9500' : isDark ? '#253244' : '#EAE5DC',
                },
                pressed && styles.pressed,
              ]}
              onPress={() => onSelectPaperTab?.('gs1')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedPaperTab === 'gs1' }}
            >
              <Text
                style={[
                  styles.paperTabText,
                  { color: selectedPaperTab === 'gs1' ? '#FFFFFF' : colors.textSecondary },
                  selectedPaperTab === 'gs1' && styles.paperTabTextActive,
                ]}
              >
                Paper 1 - GS-1
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.paperTabBtn,
                {
                  backgroundColor:
                    selectedPaperTab === 'gs2' ? '#FF9500' : isDark ? '#141C28' : '#FFFFFF',
                  borderColor:
                    selectedPaperTab === 'gs2' ? '#FF9500' : isDark ? '#253244' : '#EAE5DC',
                },
                pressed && styles.pressed,
              ]}
              onPress={() => onSelectPaperTab?.('gs2')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedPaperTab === 'gs2' }}
            >
              <Text
                style={[
                  styles.paperTabText,
                  { color: selectedPaperTab === 'gs2' ? '#FFFFFF' : colors.textSecondary },
                  selectedPaperTab === 'gs2' && styles.paperTabTextActive,
                ]}
              >
                Paper 2 - CSAT
              </Text>
            </Pressable>
          </View>
        )}

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
    width: 38,
    height: 38,
    borderRadius: 19,
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
  titleBlock: {
    marginBottom: 16,
  },
  titleText: {
    fontFamily: FONT_FAMILY.serif,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 5,
  },
  titleTextMobile: {
    fontSize: 22,
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
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  subtitleTextMobile: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toolbarRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  paperTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paperTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  paperTabText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  paperTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 270,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
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
