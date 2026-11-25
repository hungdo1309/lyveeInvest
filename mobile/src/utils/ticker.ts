export function sanitizeSearchQuery(raw: string): string {
  // Allow company names + tickers while typing
  return raw.replace(/[^\w.\-\s]/g, '').slice(0, 48);
}

export function sanitizeTicker(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9.-]/g, '');
}
