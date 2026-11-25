import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme/colors';
import type { Snapshot } from '../api/types';

type Props = {
  snapshot: Snapshot;
};

type Cell = {
  key: string;
  label: string;
  value: string;
  accent?: string;
};

export function SnapshotStrip({ snapshot }: Props) {
  const rangeAccent =
    snapshot.range_half === 'upper'
      ? colors.primary
      : snapshot.range_half === 'lower'
        ? colors.risk
        : colors.text;

  const rangeValue =
    snapshot.fifty_two_week_range_display != null
      ? snapshot.pct_of_range != null
        ? `${snapshot.fifty_two_week_range_display} · ${snapshot.pct_of_range.toFixed(0)}%`
        : snapshot.fifty_two_week_range_display
      : '—';

  const cells: Cell[] = [
    { key: 'price', label: 'Price', value: snapshot.price_display ?? '—' },
    { key: 'range', label: '52W Range', value: rangeValue, accent: rangeAccent },
    { key: 'marketCap', label: 'Market Cap', value: snapshot.market_cap_display ?? '—' },
    { key: 'forwardPe', label: 'Forward P/E', value: snapshot.forward_pe_display ?? '—' },
    {
      key: 'revGrowth',
      label: 'Rev Growth',
      value: snapshot.revenue_growth_display ?? '—',
    },
    {
      key: 'dividend',
      label: 'Div Yield',
      value: snapshot.dividend_yield_display ?? '—',
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="snapshot-strip"
    >
      {cells.map((cell) => (
        <View key={cell.key} style={styles.chip} testID={`snapshot-${cell.key}`}>
          <Text style={styles.label}>{cell.label}</Text>
          <Text
            style={[styles.value, cell.accent ? { color: cell.accent } : null]}
            numberOfLines={2}
          >
            {cell.value}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: space.sm,
    paddingVertical: 2,
  },
  chip: {
    width: 148,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    minHeight: 88,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textDim,
    marginBottom: space.sm,
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
});
