import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { analyzeTicker, searchTickers } from './src/api/client';
import type { AnalyzeResponse, SearchResult } from './src/api/types';
import { SnapshotStrip } from './src/components/SnapshotStrip';
import { ScoreCard } from './src/components/ScoreCard';
import { TickerSuggestions } from './src/components/TickerSuggestions';
import { VerdictPanel } from './src/components/VerdictPanel';
import { OtherAppsLink } from './src/components/OtherAppsLink';
import { OtherAppsScreen } from './src/components/OtherAppsScreen';
import { HelpLink } from './src/components/HelpLink';
import { HelpScreen } from './src/components/HelpScreen';
import { colors, fonts, radius, space } from './src/theme/colors';
import { sanitizeSearchQuery } from './src/utils/ticker';

const SEARCH_DEBOUNCE_MS = 450;
const SEARCH_MIN_CHARS = 2;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [screen, setScreen] = useState<'home' | 'other-apps' | 'help'>('home');
  const searchAbort = useRef<AbortController | null>(null);
  const analyzeAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  const runAnalyze = useCallback(async (symbol: string) => {
    analyzeAbort.current?.abort();
    const controller = new AbortController();
    analyzeAbort.current = controller;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const result = await analyzeTicker(symbol, controller.signal);
      if (controller.signal.aborted) return;
      setData(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      setData(null);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const clearSearch = () => {
    searchAbort.current?.abort();
    analyzeAbort.current?.abort();
    setQuery('');
    setSelectedSymbol(null);
    setData(null);
    setError(null);
    setSuggestions([]);
    setSearching(false);
    setLoading(false);
  };

  const onChangeQuery = (value: string) => {
    const next = sanitizeSearchQuery(value);
    setQuery(next);
    setSelectedSymbol(null);
    setData(null);
    setError(null);
    if (!next.trim()) {
      searchAbort.current?.abort();
      setSuggestions([]);
      setSearching(false);
    }
  };

  const onSelectResult = (item: SearchResult) => {
    Keyboard.dismiss();
    searchAbort.current?.abort();
    setQuery(item.symbol);
    setSelectedSymbol(item.symbol);
    setSuggestions([]);
    setFocused(false);
    void runAnalyze(item.symbol);
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < SEARCH_MIN_CHARS || selectedSymbol) {
      setSearching(false);
      return;
    }

    const handle = setTimeout(() => {
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;
      setSearching(true);
      void searchTickers(trimmed, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setSuggestions(results);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (err instanceof Error && err.name === 'AbortError') return;
          setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSearching(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(handle);
    };
  }, [query, selectedSymbol]);

  if (!fontsLoaded) {
    return null;
  }

  const showSuggestions =
    !selectedSymbol &&
    query.trim().length >= SEARCH_MIN_CHARS &&
    (searching || suggestions.length > 0);
  const showEmptyState = !query.trim() && !data && !loading && !error;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        {screen === 'other-apps' ? (
          <OtherAppsScreen onBack={() => setScreen('home')} />
        ) : screen === 'help' ? (
          <HelpScreen onBack={() => setScreen('home')} />
        ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          testID="home-scroll"
        >
          <View style={styles.header}>
            <Image
              source={require('./assets/logo-96.png')}
              style={styles.logo}
              resizeMode="cover"
              testID="logo-tile"
            />
            <View style={styles.headerText}>
              <Text style={styles.appName}>LyveeInvest Analyzer</Text>
              <View style={styles.sourceRow}>
                <View style={styles.sourceDot} />
                <Text style={styles.sourceText}>Market Data from Yahoo Finance</Text>
              </View>
            </View>
          </View>

          <OtherAppsLink onPress={() => setScreen('other-apps')} />
          <HelpLink onPress={() => setScreen('help')} />

          <View
            style={[styles.searchShell, focused && styles.searchShellFocused]}
          >
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ticker or Name"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={48}
              style={styles.searchInput}
              testID="ticker-input"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={clearSearch}
                style={styles.clearBtn}
                hitSlop={10}
                testID="clear-search"
              >
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            ) : null}
          </View>

          {!selectedSymbol ? (
            <Text style={styles.helper} testID="helper-line">
              {query.trim().length === 0
                ? 'Find a stock to get scores and a verdict'
                : query.trim().length < SEARCH_MIN_CHARS
                  ? 'Type at least 2 characters'
                  : 'Tap a match to analyze'}
            </Text>
          ) : null}

          {showSuggestions ? (
            <TickerSuggestions
              results={suggestions}
              loading={searching && suggestions.length === 0}
              onSelect={onSelectResult}
            />
          ) : null}

          {!selectedSymbol &&
          query.trim().length > 0 &&
          !searching &&
          suggestions.length === 0 ? (
            <View style={styles.emptySearch} testID="search-empty">
              <Text style={styles.emptySearchTitle}>No matches</Text>
              <Text style={styles.emptySearchText}>
                Try another ticker or company name
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.statusBox} testID="loading-state">
              <ActivityIndicator color={colors.primary} />
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>Loading analysis</Text>
                <Text style={styles.statusText}>Pulling Yahoo market data…</Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox} testID="error-state">
              <Text style={styles.errorTitle}>Couldn’t load data</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={() => selectedSymbol && void runAnalyze(selectedSymbol)}
                style={styles.retryBtn}
                testID="retry-button"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {showEmptyState ? (
            <View style={styles.emptyState} testID="empty-state">
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>LI</Text>
              </View>
              <Text style={styles.emptyTitle}>Quick stock signal</Text>
              <Text style={styles.emptyBody}>
                Search any ticker to see asymmetry, valuation, and risk scores —
                then a clear composite verdict.
              </Text>
            </View>
          ) : null}

          {data && !error ? (
            <View style={styles.results}>
              <View style={styles.companyCard}>
                <Text style={styles.tickerBadge}>{data.ticker}</Text>
                {data.snapshot.name ? (
                  <Text style={styles.companyName}>{data.snapshot.name}</Text>
                ) : null}
                {data.snapshot.sector_industry_display ? (
                  <Text style={styles.companyMeta}>
                    {data.snapshot.sector_industry_display}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.sectionLabel}>Market snapshot</Text>
              <SnapshotStrip snapshot={data.snapshot} />

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                Score breakdown
              </Text>
              <ScoreCard index="01" block={data.scores.asymmetry} />
              <ScoreCard index="02" block={data.scores.valuation} />
              <ScoreCard index="03" block={data.scores.risk} />

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Verdict</Text>
              <VerdictPanel data={data} />
              <Pressable
                onPress={() => setScreen('help')}
                style={({ pressed }) => [
                  styles.inlineHelp,
                  pressed && styles.inlineHelpPressed,
                ]}
                testID="help-from-results"
              >
                <Text style={styles.inlineHelpText}>How scores work ›</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  appName: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  sourceText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingLeft: space.lg,
    paddingRight: space.sm,
    minHeight: 56,
  },
  searchShellFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    paddingVertical: space.md,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  helper: {
    marginTop: space.md,
    marginBottom: space.sm,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  emptySearch: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.sm,
  },
  emptySearchTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  emptySearchText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  statusBox: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  errorBox: {
    marginTop: space.md,
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  errorTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.warning,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  emptyState: {
    marginTop: space.xxl,
    alignItems: 'center',
    paddingHorizontal: space.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  emptyIconText: {
    fontFamily: fonts.monoBold,
    fontSize: 20,
    color: colors.primary,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  results: {
    marginTop: space.xl,
    gap: 0,
  },
  companyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.lg,
  },
  tickerBadge: {
    fontFamily: fonts.monoBold,
    fontSize: 28,
    letterSpacing: 1,
    color: colors.primary,
  },
  companyName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    marginTop: 6,
  },
  companyMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: space.md,
    marginTop: space.sm,
  },
  sectionSpaced: {
    marginTop: space.xl,
  },
  inlineHelp: {
    marginTop: space.md,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  inlineHelpPressed: {
    opacity: 0.7,
  },
  inlineHelpText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.primary,
  },
});
