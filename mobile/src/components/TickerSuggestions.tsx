import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme/colors';
import type { SearchResult } from '../api/types';

type Props = {
  results: SearchResult[];
  loading: boolean;
  onSelect: (item: SearchResult) => void;
};

export function TickerSuggestions({ results, loading, onSelect }: Props) {
  if (loading) {
    return (
      <View style={[styles.box, styles.loadingBox]} testID="search-loading">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Searching…</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <View style={styles.box} testID="search-results">
      {results.map((item, index) => (
        <Pressable
          key={item.symbol}
          onPress={() => onSelect(item)}
          style={({ pressed }) => [
            styles.row,
            index > 0 && styles.rowBorder,
            pressed && styles.rowPressed,
          ]}
          testID={`search-result-${item.symbol}`}
        >
          <View style={styles.symbolBadge}>
            <Text style={styles.symbol}>{item.symbol}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[item.exchange, item.type].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: space.sm,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    gap: space.md,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    gap: space.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  symbolBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  symbol: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: colors.primary,
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
  },
  chevron: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textDim,
    marginTop: -2,
  },
});
