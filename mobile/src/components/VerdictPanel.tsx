import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme/colors';
import type { AnalyzeResponse } from '../api/types';
import { scoreColor, verdictColor } from '../utils/scoreColor';
import { FORMULA_PLAIN, scoreFullName } from '../utils/labels';

type Props = {
  data: AnalyzeResponse;
};

function mutedFor(verdict: string): string {
  if (verdict.includes('BUY')) return colors.primaryMuted;
  if (verdict === 'HOLD') return colors.warningMuted;
  return colors.riskMuted;
}

export function VerdictPanel({ data }: Props) {
  const { composite, scores } = data;
  const color = verdictColor(composite.verdict);
  const tiles = [
    { key: 'ASYM', score: scores.asymmetry.score },
    { key: 'VAL', score: scores.valuation.score },
    { key: 'RISK', score: scores.risk.score },
  ];

  return (
    <View
      style={[styles.panel, { backgroundColor: mutedFor(composite.verdict), borderColor: color }]}
      testID="verdict-panel"
    >
      <Text style={[styles.verdict, { color }]} testID="verdict-label">
        {composite.verdict}
      </Text>
      <Text style={styles.blurb}>{composite.blurb}</Text>

      <View style={styles.scoreBlock}>
        <Text style={styles.compositeScore} testID="composite-score">
          {composite.score.toFixed(1)}
          <Text style={styles.over}> / 10</Text>
        </Text>
        <Text style={styles.formula}>{FORMULA_PLAIN}</Text>
      </View>

      <View style={styles.tiles}>
        {tiles.map((tile) => {
          const tone = scoreColor(tile.key, tile.score);
          return (
            <View key={tile.key} style={styles.tile}>
              <Text style={styles.tileName}>{scoreFullName(tile.key)}</Text>
              <Text style={styles.tileCode}>{tile.key}</Text>
              <Text style={[styles.tileScore, { color: tone }]}>{tile.score.toFixed(1)}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.disclaimer}>
        Not investment advice · Rule-based scores and for research only
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  verdict: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  blurb: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: space.lg,
  },
  scoreBlock: {
    marginBottom: space.lg,
  },
  compositeScore: {
    fontFamily: fonts.monoBold,
    fontSize: 40,
    color: colors.text,
  },
  over: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.textDim,
  },
  formula: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
  },
  tiles: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.lg,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
  },
  tileName: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  tileCode: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
    marginBottom: 8,
  },
  tileScore: {
    fontFamily: fonts.monoBold,
    fontSize: 20,
  },
  disclaimer: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.warning,
    lineHeight: 19,
  },
});
