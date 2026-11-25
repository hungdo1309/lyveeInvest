"""Yahoo Finance helpers via yfinance — cached and slimmed for cost."""

from __future__ import annotations

import threading
import time
from typing import Any

import yfinance as yf

# In-process TTL caches: cut repeat Yahoo calls (retries, re-opens, typing).
_TICKER_TTL_S = 120.0
_SEARCH_TTL_S = 60.0
_TICKER_CACHE_MAX = 128
_SEARCH_CACHE_MAX = 64

_lock = threading.Lock()
_ticker_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_search_cache: dict[tuple[str, int], tuple[float, list[dict[str, Any]]]] = {}


def normalize_ticker(raw: str) -> str:
    cleaned = "".join(ch for ch in raw.upper().strip() if ch.isalnum() or ch in ".-")
    return cleaned


def _cache_get(cache: dict, key: Any, ttl: float) -> Any | None:
    entry = cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.monotonic() >= expires_at:
        cache.pop(key, None)
        return None
    return value


def _cache_set(cache: dict, key: Any, value: Any, ttl: float, max_size: int) -> None:
    now = time.monotonic()
    if len(cache) >= max_size:
        # Drop expired first, then oldest by expiry
        expired = [k for k, (exp, _) in cache.items() if now >= exp]
        for k in expired:
            cache.pop(k, None)
        while len(cache) >= max_size:
            oldest_key = min(cache.items(), key=lambda item: item[1][0])[0]
            cache.pop(oldest_key, None)
    cache[key] = (now + ttl, value)


def search_tickers(query: str, limit: int = 10) -> list[dict[str, Any]]:
    q = query.strip()
    if len(q) < 1:
        return []

    cache_key = (q.lower(), limit)
    with _lock:
        cached = _cache_get(_search_cache, cache_key, _SEARCH_TTL_S)
        if cached is not None:
            return [dict(row) for row in cached]

    try:
        # Skip news/lists/recommended — quotes only (less Yahoo payload + latency)
        result = yf.Search(
            q,
            max_results=limit,
            news_count=0,
            lists_count=0,
            include_cb=False,
            recommended=0,
        )
        quotes = result.quotes or []
    except Exception:
        return []

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in quotes:
        symbol = (row.get("symbol") or "").strip().upper()
        if not symbol or symbol in seen:
            continue
        quote_type = (row.get("quoteType") or row.get("typeDisp") or "").upper()
        if quote_type and quote_type not in {
            "EQUITY",
            "ETF",
            "MUTUALFUND",
            "INDEX",
            "ECNQUOTE",
        }:
            if quote_type in {"OPTION", "FUTURE", "CURRENCY", "CRYPTOCURRENCY"}:
                continue

        seen.add(symbol)
        name = row.get("longname") or row.get("shortname") or symbol
        out.append(
            {
                "symbol": symbol,
                "name": name,
                "exchange": row.get("exchDisp") or row.get("exchange"),
                "type": row.get("typeDisp") or row.get("quoteType"),
                "sector": row.get("sectorDisp") or row.get("sector"),
            }
        )
        if len(out) >= limit:
            break

    with _lock:
        _cache_set(_search_cache, cache_key, out, _SEARCH_TTL_S, _SEARCH_CACHE_MAX)
    return [dict(row) for row in out]


def _f(info: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = info.get(key)
        if value is None:
            continue
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if number == number:
            return number
    return None


def _format_market_cap(value: float | None) -> str | None:
    if value is None:
        return None
    abs_v = abs(value)
    if abs_v >= 1e12:
        return f"${value / 1e12:.2f}T"
    if abs_v >= 1e9:
        return f"${value / 1e9:.2f}B"
    if abs_v >= 1e6:
        return f"${value / 1e6:.2f}M"
    return f"${value:,.0f}"


def _slim_info(info: dict[str, Any]) -> dict[str, Any]:
    """Drop bulky unused Yahoo fields before caching / scoring."""
    slim = dict(info)
    slim.pop("companyOfficers", None)
    slim.pop("longBusinessSummary", None)
    return slim


def fetch_ticker_payload(ticker: str) -> dict[str, Any]:
    symbol = normalize_ticker(ticker)
    if not symbol:
        return {"ok": False, "error": "Enter a ticker symbol.", "ticker": ticker}

    with _lock:
        cached = _cache_get(_ticker_cache, symbol, _TICKER_TTL_S)
        if cached is not None:
            return cached

    stock = yf.Ticker(symbol)
    # Skip complementary timeseries fetch (trailingPegRatio). Scoring uses pegRatio.
    try:
        stock._quote._already_fetched_complementary = True  # type: ignore[attr-defined]
    except Exception:
        pass

    info = _slim_info(stock.info or {})

    price = _f(info, "currentPrice", "regularMarketPrice", "previousClose")
    name = info.get("shortName") or info.get("longName")
    if price is None and not name and not info.get("symbol"):
        return {
            "ok": False,
            "error": f"No data for “{symbol}”. Check the ticker and try again.",
            "ticker": symbol,
        }

    low = _f(info, "fiftyTwoWeekLow")
    high = _f(info, "fiftyTwoWeekHigh")
    pct_of_range = None
    range_half: str | None = None
    if price is not None and low is not None and high is not None and high > low:
        pct_of_range = (price - low) / (high - low) * 100
        range_half = "upper" if pct_of_range >= 50 else "lower"

    fwd_pe = _f(info, "forwardPE")
    rev_growth = _f(info, "revenueGrowth")
    market_cap = _f(info, "marketCap")
    trailing_yield = _f(info, "trailingAnnualDividendYield")
    quote_yield = _f(info, "dividendYield")
    if trailing_yield is not None:
        dividend_yield_pct = trailing_yield * 100 if trailing_yield <= 1 else trailing_yield
    elif quote_yield is not None:
        dividend_yield_pct = quote_yield
    else:
        dividend_yield_pct = None

    snapshot = {
        "price": price,
        "price_display": f"${price:,.2f}" if price is not None else None,
        "fifty_two_week_low": low,
        "fifty_two_week_high": high,
        "fifty_two_week_range_display": (
            f"${low:,.2f} - ${high:,.2f}" if low is not None and high is not None else None
        ),
        "pct_of_range": pct_of_range,
        "range_half": range_half,
        "market_cap": market_cap,
        "market_cap_display": _format_market_cap(market_cap),
        "forward_pe": fwd_pe,
        "forward_pe_display": f"{fwd_pe:.1f}" if fwd_pe is not None else None,
        "revenue_growth": rev_growth,
        "revenue_growth_display": (
            f"{rev_growth * 100:+.1f}%" if rev_growth is not None else None
        ),
        "dividend_yield": dividend_yield_pct,
        "dividend_yield_display": (
            f"{dividend_yield_pct:.2f}%" if dividend_yield_pct is not None else None
        ),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "sector_industry_display": " / ".join(
            part for part in [info.get("sector"), info.get("industry")] if part
        )
        or None,
        "name": name,
        "currency": info.get("currency") or "USD",
        "target_mean_price": _f(info, "targetMeanPrice"),
        "beta": _f(info, "beta"),
        "trailing_pe": _f(info, "trailingPE"),
        "price_to_book": _f(info, "priceToBook"),
        "price_to_sales": _f(info, "priceToSalesTrailing12Months"),
    }

    payload = {
        "ok": True,
        "ticker": symbol,
        "snapshot": snapshot,
        "raw": info,
    }

    with _lock:
        _cache_set(_ticker_cache, symbol, payload, _TICKER_TTL_S, _TICKER_CACHE_MAX)
    return payload
