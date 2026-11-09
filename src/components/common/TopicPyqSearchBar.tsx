/**
 * Clean Google-Style Topic-Based PYQ Search Bar & Autocomplete
 * ----------------------------------------------------------------------------
 * Unified single search bar with instant Google-like autocomplete suggestions,
 * text completion bolding, and sleek trending topic pills.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  ArrowUpLeft,
  Clock,
  Search,
  TrendingUp,
  X,
} from 'lucide-react-native';
import {
  TopicDiscoveryBundle,
  TopicSuggestionItem,
  TopicSuggestionService,
} from '@/services/topicSuggestionService';
import { PYQExamType } from '@/services/pyqMatchingService';

export interface TopicPyqSearchBarProps {
  isDark?: boolean;
  defaultExamScope?: 'ALL' | PYQExamType;
  onSelectTopic: (topicTitle: string, initialExamScope?: 'ALL' | PYQExamType) => void;
  onQueryChange?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Google-style suggestion text component:
 * What the user typed is regular/light, and the predicted remainder is bold.
 */
function GoogleSuggestionText({
  text,
  query,
  isDark,
}: {
  text: string;
  query: string;
  isDark: boolean;
}) {
  const normQuery = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const matchIdx = lowerText.indexOf(normQuery);

  const textPrimary = isDark ? '#F0F4F8' : '#1C2433';
  const textMuted = isDark ? '#9DA8B9' : '#4A5568';

  if (!normQuery || matchIdx === -1) {
    return (
      <Text style={[styles.suggestionText, { color: textPrimary, fontWeight: '600' }]}>
        {text}
      </Text>
    );
  }

  const before = text.slice(0, matchIdx);
  const matched = text.slice(matchIdx, matchIdx + normQuery.length);
  const after = text.slice(matchIdx + normQuery.length);

  return (
    <Text style={[styles.suggestionText, { color: textPrimary }]}>
      {before && <Text style={{ fontWeight: '700', color: textPrimary }}>{before}</Text>}
      <Text style={{ fontWeight: '400', color: textMuted }}>{matched}</Text>
      <Text style={{ fontWeight: '700', color: textPrimary }}>{after}</Text>
    </Text>
  );
}

export function TopicPyqSearchBar({
  isDark = false,
  defaultExamScope = 'ALL',
  onSelectTopic,
  onQueryChange,
  style,
}: TopicPyqSearchBarProps) {
  const [inputText, setInputText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [discovery, setDiscovery] = useState<TopicDiscoveryBundle | null>(null);

  const inputRef = useRef<any>(null);

  // Debounce user typing (180ms for instant Google feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputText.trim());
      setHighlightedIndex(0);
    }, 180);
    return () => clearTimeout(timer);
  }, [inputText]);

  // Load discovery bundle on mount
  useEffect(() => {
    let active = true;
    TopicSuggestionService.getDiscoveryBundle()
      .then((bundle) => {
        if (active) setDiscovery(bundle);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Compute instant autocomplete suggestions
  const suggestions: TopicSuggestionItem[] = useMemo(() => {
    if (!debouncedQuery) {
      if (discovery?.recentSearches && discovery.recentSearches.length > 0) {
        return discovery.recentSearches.slice(0, 5);
      }
      return discovery?.popularTopics.slice(0, 6) || TopicSuggestionService.getPopularTopics(6);
    }
    return TopicSuggestionService.getInstantSuggestions(debouncedQuery, {
      limit: 7,
      examScope: defaultExamScope,
    });
  }, [debouncedQuery, defaultExamScope, discovery]);

  const handleChooseTopic = (topicTitle: string) => {
    const clean = topicTitle.trim();
    if (!clean) return;
    setIsFocused(false);
    onSelectTopic(clean, defaultExamScope);
  };

  const handleClearInput = () => {
    setInputText('');
    setDebouncedQuery('');
    onQueryChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS !== 'web') return;
    const key = e?.nativeEvent?.key;
    if (!key) return;

    if (key === 'ArrowDown') {
      e.preventDefault?.();
      setHighlightedIndex((prev) =>
        suggestions.length > 0 ? (prev + 1) % suggestions.length : 0
      );
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setHighlightedIndex((prev) =>
        suggestions.length > 0 ? (prev - 1 + suggestions.length) % suggestions.length : 0
      );
    } else if (key === 'Enter') {
      e.preventDefault?.();
      if (suggestions[highlightedIndex]) {
        handleChooseTopic(suggestions[highlightedIndex].title);
      } else if (inputText.trim().length >= 2) {
        handleChooseTopic(inputText.trim());
      }
    } else if (key === 'Escape') {
      setIsFocused(false);
    }
  };

  // Color tokens
  const colors = {
    barBg: isDark ? '#141C28' : '#FFFFFF',
    barBorder: isDark ? '#253244' : '#E5E7EB',
    focusedBorder: isDark ? '#FF9500' : '#FF9500',
    dropdownBg: isDark ? '#141C28' : '#FFFFFF',
    dropdownBorder: isDark ? '#253244' : '#E5E7EB',
    hoverBg: isDark ? '#1E293B' : '#F1F5F9',
    textPrimary: isDark ? '#F0F4F8' : '#1C2433',
    textSecondary: isDark ? '#9DA8B9' : '#64748B',
    placeholder: isDark ? '#6E7A8E' : '#94A3B8',
    countBadgeBg: isDark ? '#1E293B' : '#F1F5F9',
    countBadgeText: isDark ? '#CBD5E1' : '#475569',
    chipBg: isDark ? '#141C28' : '#FFFFFF',
    chipBorder: isDark ? '#253244' : '#E2E8F0',
    accent: '#FF9500',
  };

  const showDropdown = isFocused && suggestions.length > 0;
  const isRecentView = !debouncedQuery && Boolean(discovery?.recentSearches?.length);

  return (
    <View style={[styles.container, style]}>
      {/* 1. Google-Style Clean Search Input Box */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.barBg,
            borderColor: isFocused ? colors.focusedBorder : colors.barBorder,
            borderBottomLeftRadius: showDropdown ? 0 : 24,
            borderBottomRightRadius: showDropdown ? 0 : 24,
          },
        ]}
      >
        <Search
          size={18}
          color={isFocused ? colors.accent : colors.textSecondary}
          strokeWidth={2.2}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          value={inputText}
          onChangeText={(txt) => {
            setInputText(txt);
            setIsFocused(true);
            onQueryChange?.(txt);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyPress={handleKeyPress}
          onSubmitEditing={() => {
            if (suggestions[highlightedIndex] && inputText.trim().length > 0) {
              handleChooseTopic(suggestions[highlightedIndex].title);
            } else if (inputText.trim().length >= 2) {
              handleChooseTopic(inputText.trim());
            }
          }}
          placeholder="Search any topic, concept or keyword..."
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[
            styles.inputField,
            { color: colors.textPrimary },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
        />

        {inputText.length > 0 && (
          <TouchableOpacity
            onPress={handleClearInput}
            style={styles.clearBtn}
            accessibilityLabel="Clear search input"
          >
            <X size={15} color={colors.textSecondary} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Google-Style Connected Dropdown List */}
      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.dropdownBg,
              borderColor: isFocused ? colors.focusedBorder : colors.dropdownBorder,
            },
          ]}
        >
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleChooseTopic(item.title)}
                onHoverIn={() => setHighlightedIndex(idx)}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  {
                    backgroundColor:
                      isHighlighted || pressed ? colors.hoverBg : 'transparent',
                  },
                ]}
              >
                {/* Left Google Search or History Icon */}
                <View style={styles.iconCol}>
                  {isRecentView ? (
                    <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                  ) : (
                    <Search size={16} color={colors.textSecondary} strokeWidth={2} />
                  )}
                </View>

                {/* Middle Autocomplete Text */}
                <View style={styles.textCol}>
                  <GoogleSuggestionText
                    text={item.title}
                    query={debouncedQuery}
                    isDark={isDark}
                  />
                </View>

                {/* Right PYQ Count & Diagonal Arrow */}
                <View style={styles.metaCol}>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: colors.countBadgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: colors.countBadgeText },
                      ]}
                    >
                      {item.totalCount} Qs
                    </Text>
                  </View>
                  <ArrowUpLeft size={15} color={colors.textSecondary} strokeWidth={2} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 3. Clean Trending Topics Row */}
      <View style={styles.trendingRow}>
        <View style={styles.trendingLabelWrap}>
          <TrendingUp size={13} color={colors.accent} strokeWidth={2.5} />
          <Text style={[styles.trendingLabel, { color: colors.textSecondary }]}>Trending:</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trendingScrollView}
          contentContainerStyle={styles.trendingScroll}
        >
          {(discovery?.popularTopics || TopicSuggestionService.getPopularTopics(8)).map(
            (topic) => (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={0.75}
                onPress={() => handleChooseTopic(topic.title)}
                style={[
                  styles.trendingPill,
                  {
                    backgroundColor: colors.chipBg,
                    borderColor: colors.chipBorder,
                  },
                ]}
              >
                <Text style={[styles.trendingPillText, { color: colors.textPrimary }]}>
                  {topic.title}
                </Text>
                <Text style={[styles.trendingPillCount, { color: colors.accent }]}>
                  {topic.totalCount}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    zIndex: 50,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '400',
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 6,
    marginLeft: 4,
  },
  dropdown: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1.5,
    borderTopWidth: 0,
    overflow: 'hidden',
    paddingTop: 2,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCol: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    width: '100%',
    overflow: 'hidden',
  },
  trendingScrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowX: 'auto',
        scrollbarWidth: 'none',
      } as any,
      default: {},
    }),
  },
  trendingLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trendingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 2,
  },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  trendingPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendingPillCount: {
    fontSize: 11,
    fontWeight: '700',
  },
});
