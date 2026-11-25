export type MetricRow = {
  label: string;
  value: string;
};

export type ScoreBlock = {
  score: number;
  label: string;
  title: string;
  description: string;
  metrics: MetricRow[];
  why: string;
};

export type Snapshot = {
  price: number | null;
  price_display: string | null;
  fifty_two_week_low: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_range_display: string | null;
  pct_of_range: number | null;
  range_half: 'upper' | 'lower' | null;
  market_cap: number | null;
  market_cap_display: string | null;
  forward_pe: number | null;
  forward_pe_display: string | null;
  revenue_growth: number | null;
  revenue_growth_display: string | null;
  dividend_yield: number | null;
  dividend_yield_display: string | null;
  sector: string | null;
  industry: string | null;
  sector_industry_display: string | null;
  name: string | null;
  currency: string;
  target_mean_price: number | null;
  beta: number | null;
};

export type AnalyzeResponse = {
  ticker: string;
  snapshot: Snapshot;
  scores: {
    asymmetry: ScoreBlock;
    valuation: ScoreBlock;
    risk: ScoreBlock;
  };
  composite: {
    score: number;
    verdict: string;
    blurb: string;
    formula: string;
  };
};

export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
  sector: string | null;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};
