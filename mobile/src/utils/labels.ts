/** Short code → plain-English name for UI. */
export const SCORE_NAMES: Record<string, string> = {
  ASYM: 'Asymmetry',
  VAL: 'Valuation',
  RISK: 'Risk',
};

export function scoreFullName(code: string): string {
  return SCORE_NAMES[code.toUpperCase()] ?? code;
}

export function scoreHeading(code: string): string {
  const full = scoreFullName(code);
  const key = code.toUpperCase();
  if (full.toUpperCase() === key) return full;
  return `${full} (${key})`;
}

/** Snapshot strip: short label + optional plain-English subtitle. */
export const SNAPSHOT_LABELS: Record<
  string,
  { label: string; hint?: string }
> = {
  price: { label: 'Price' },
  range: { label: '52-Week Range', hint: 'High / low over the past year' },
  marketCap: { label: 'Market Cap', hint: 'Total company value' },
  forwardPe: {
    label: 'Forward P/E',
    hint: 'Price / expected earnings',
  },
  revGrowth: {
    label: 'Revenue Growth',
    hint: 'Year over year (YoY)',
  },
  sector: { label: 'Sector / Industry' },
};

/** Expand common finance acronyms in metric row labels. */
export function expandMetricLabel(label: string): string {
  const map: Record<string, string> = {
    'Forward P/E': 'Forward P/E (price / expected earnings)',
    'Trailing P/E': 'Trailing P/E (price / past earnings)',
    'PEG ratio': 'PEG (P/E relative to growth)',
    'P/S (TTM)': 'Price / Sales (last 12 months)',
    'P/B': 'Price / Book value',
    'EV/EBITDA': 'EV/EBITDA (enterprise value / cash earnings)',
    'Revenue growth YoY': 'Revenue growth (year over year)',
    'Dividend yield': 'Dividend yield',
    'Payout ratio': 'Payout ratio (% of earnings paid as dividends)',
    'Short % of float': 'Short interest (% of shares available)',
    'Debt / equity': 'Debt / Equity (leverage)',
    'Current ratio': 'Current ratio (short-term liquidity)',
    'Profit margin': 'Profit margin',
    Beta: 'Beta (volatility vs market)',
    '52W range position': '52-week range position',
    'Upside to analyst target': 'Upside to analyst price target',
    'vs 200-day average': 'vs 200-day moving average',
  };
  return map[label] ?? label;
}

export const FORMULA_PLAIN =
  '(Asymmetry + Valuation + (10 - Risk)) / 3';
