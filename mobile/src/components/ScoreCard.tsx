import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme/colors';
import type { ScoreBlock } from '../api/types';
import { scoreColor } from '../utils/scoreColor';
import { expandMetricLabel, scoreFullName } from '../utils/labels';

type Props = {
  index: string;
  block: ScoreBlock;
};

export function ScoreCard({ index, block }: Props) {
  const badgeColor = scoreColor(block.label, block.score);

  return (
    <View style={styles.card} testID={`score-card-${block.label}`}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.index}>{index}</Text>
          <Text style={styles.title}>{scoreFullName(block.label)}</Text>
          <Text style={styles.code}>{block.label}</Text>
        </View>
        <View style={[styles.scorePill, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}>
          <Text style={[styles.scoreValue, { color: badgeColor }]}>
            {block.score.toFixed(1)}
          </Text>
          <Text style={[styles.scoreMax, { color: badgeColor }]}>/10</Text>
        </View>
      </View>

      <Text style={styles.description}>{block.description}</Text>

      <View style={styles.metrics}>
        {block.metrics.length === 0 ? (
          <Text style={styles.emptyMetrics}>No metrics available</Text>
        ) : (
          block.metrics.map((metric) => (
            <View key={metric.label} style={styles.metricRow}>
              <Text style={styles.metricLabel} numberOfLines={2}>
                {expandMetricLabel(metric.label)}
              </Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.whyBox}>
        <Text style={styles.whyLabel}>Why this score</Text>
        <Text style={styles.why}>{block.why}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  index: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  scorePill: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
  },
  scoreValue: {
    fontFamily: fonts.monoBold,
    fontSize: 22,
  },
  scoreMax: {
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 1,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: space.lg,
  },
  metrics: {
    gap: space.sm,
  },
  emptyMetrics: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  metricLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  metricValue: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    color: colors.text,
  },
  whyBox: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  whyLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 6,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
