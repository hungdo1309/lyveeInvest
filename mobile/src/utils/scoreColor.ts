import { colors } from '../theme/colors';

/** ASYM/VAL: higher is better. RISK: higher is worse. */
export function scoreColor(label: string, score: number): string {
  const key = label.toUpperCase();
  const isRisk = key === 'RISK';

  if (isRisk) {
    if (score >= 7) return colors.risk;
    if (score >= 4.5) return colors.warning;
    return colors.primary;
  }

  // ASYM / VAL / anything else positive-oriented
  if (score >= 7) return colors.primary;
  if (score >= 4.5) return colors.warning;
  return colors.risk;
}

export function verdictColor(verdict: string): string {
  if (verdict.includes('BUY')) return colors.primary;
  if (verdict === 'HOLD') return colors.warning;
  return colors.risk;
}
