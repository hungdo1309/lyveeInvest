import { Platform } from 'react-native';
import type { AnalyzeResponse, SearchResponse, SearchResult } from './types';

/** Simulator/emulator defaults. Physical devices must set EXPO_PUBLIC_API_URL to your PC LAN IP. */
function defaultHost(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8001';
  }
  return 'http://localhost:8001';
}

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || defaultHost()).replace(/\/$/, '');

const SEARCH_CACHE_TTL_MS = 45_000;
const ANALYZE_CACHE_TTL_MS = 90_000;

type CacheEntry<T> = { expiresAt: number; value: T };

const searchCache = new Map<string, CacheEntry<SearchResult[]>>();
const analyzeCache = new Map<string, CacheEntry<AnalyzeResponse>>();

export function getApiBaseUrl(): string {
  return API_BASE;
}

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
  maxSize: number,
): void {
  if (cache.size >= maxSize) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

async function readError(response: Response): Promise<string> {
  let detail = `Request failed (${response.status})`;
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') {
      detail = body.detail;
    }
  } catch {
    // ignore
  }
  return detail;
}

export async function searchTickers(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const key = query.trim().toLowerCase();
  const cached = readCache(searchCache, key);
  if (cached) return cached;

  const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=10`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body = (await response.json()) as SearchResponse;
  const results = body.results ?? [];
  writeCache(searchCache, key, results, SEARCH_CACHE_TTL_MS, 40);
  return results;
}

export async function analyzeTicker(
  ticker: string,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  const key = ticker.trim().toUpperCase();
  const cached = readCache(analyzeCache, key);
  if (cached) return cached;

  const url = `${API_BASE}/api/analyze?ticker=${encodeURIComponent(ticker)}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body = (await response.json()) as AnalyzeResponse;
  writeCache(analyzeCache, key, body, ANALYZE_CACHE_TTL_MS, 30);
  return body;
}
