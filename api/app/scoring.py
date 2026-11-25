"""Rule-based ASYM / VAL / RISK scores from Yahoo quote fields."""

from __future__ import annotations

from typing import Any


def _f(info: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = info.get(key)
        if value is None:
            continue
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if number == number:  # not NaN
            return number
    return None


def _clamp(value: float, low: float = 0.0, high: float = 10.0) -> float:
    return max(low, min(high, value))


def _round1(value: float) -> float:
    return round(value, 1)


def asymmetry_score(info: dict[str, Any]) -> dict[str, Any]:
    price = _f(info, "currentPrice", "regularMarketPrice", "previousClose")
    low = _f(info, "fiftyTwoWeekLow")
    high = _f(info, "fiftyTwoWeekHigh")
    target = _f(info, "targetMeanPrice")
    ma200 = _f(info, "twoHundredDayAverage")

    metrics: list[dict[str, str]] = []
    components: list[float] = []

    pct_of_range: float | None = None
    if price is not None and low is not None and high is not None and high > low:
        pct_of_range = (price - low) / (high - low) * 100
        # Near 52W low = more asymmetric upside
        components.append(_clamp(10 - pct_of_range / 10))
        metrics.append(
            {
                "label": "52W range position",
                "value": f"{pct_of_range:.0f}% of range",
            }
        )

    upside_pct: float | None = None
    if price is not None and target is not None and price > 0:
        upside_pct = (target - price) / price * 100
        # ~0% upside → ~5; 40%+ upside → ~10; large downside → lower
        components.append(_clamp(5 + upside_pct / 8))
        metrics.append(
            {
                "label": "Upside to analyst target",
                "value": f"{upside_pct:+.1f}%",
            }
        )

    if price is not None and ma200 is not None and ma200 > 0:
        vs_ma = (price - ma200) / ma200 * 100
        # Below 200d MA can imply more room / mean-reversion asymmetry
        components.append(_clamp(5 - vs_ma / 6))
        metrics.append(
            {
                "label": "vs 200-day average",
                "value": f"{vs_ma:+.1f}%",
            }
        )

    score = _round1(sum(components) / len(components)) if components else 5.0
    why = (
        "Higher when price sits low in the 52-week range and/or has meaningful "
        "upside to the analyst mean target."
    )
    return {
        "score": score,
        "label": "ASYM",
        "title": "Asymmetry",
        "description": "Downside floor vs upside ceiling from range and targets.",
        "metrics": metrics,
        "why": why,
        "pct_of_range": pct_of_range,
        "upside_to_target_pct": upside_pct,
    }


def _yield_pct(info: dict[str, Any]) -> float | None:
    # Prefer trailingAnnualDividendYield (fraction, e.g. 0.00312)
    trailing = _f(info, "trailingAnnualDividendYield")
    if trailing is not None:
        return trailing * 100 if trailing <= 1 else trailing
    # dividendYield on Yahoo quotes is typically already percent (e.g. 2.6)
    raw = _f(info, "dividendYield")
    if raw is None:
        return None
    return raw


def _payout_pct(info: dict[str, Any]) -> float | None:
    raw = _f(info, "payoutRatio")
    if raw is None:
        return None
    # Fraction (0.35) or percent (35)
    return raw * 100 if raw <= 1.5 else raw


def valuation_score(info: dict[str, Any]) -> dict[str, Any]:
    forward_pe = _f(info, "forwardPE")
    trailing_pe = _f(info, "trailingPE")
    peg = _f(info, "pegRatio")
    ps = _f(info, "priceToSalesTrailing12Months")
    pb = _f(info, "priceToBook")
    ev_ebitda = _f(info, "enterpriseToEbitda")
    rev_growth = _f(info, "revenueGrowth")
    div_yield = _yield_pct(info)

    metrics: list[dict[str, str]] = []
    components: list[float] = []

    pe = forward_pe if forward_pe is not None else trailing_pe
    pe_label = "Forward P/E" if forward_pe is not None else "Trailing P/E"
    if pe is not None and pe > 0:
        # ~15 → high score; ~40 → mid; very high PE → low
        components.append(_clamp(12 - pe / 4))
        metrics.append({"label": pe_label, "value": f"{pe:.1f}"})

    if peg is not None and peg > 0:
        components.append(_clamp(11 - peg * 4))
        metrics.append({"label": "PEG ratio", "value": f"{peg:.2f}"})

    if ps is not None and ps > 0:
        components.append(_clamp(10 - ps / 1.5))
        metrics.append({"label": "P/S (TTM)", "value": f"{ps:.1f}"})

    if pb is not None and pb > 0:
        components.append(_clamp(10 - pb / 1.2))
        metrics.append({"label": "P/B", "value": f"{pb:.1f}"})

    if ev_ebitda is not None and ev_ebitda > 0:
        components.append(_clamp(11 - ev_ebitda / 3))
        metrics.append({"label": "EV/EBITDA", "value": f"{ev_ebitda:.1f}"})

    # Meaningful yield only; cap reward so distressed double-digit yields don't max VAL
    if div_yield is not None and div_yield > 0.05:
        capped = min(div_yield, 5.0)
        components.append(_clamp(3 + capped * 1.4))
        metrics.append({"label": "Dividend yield", "value": f"{div_yield:.2f}%"})

    if rev_growth is not None:
        # Growth softens rich multiples slightly in the narrative metrics only
        metrics.append(
            {
                "label": "Revenue growth YoY",
                "value": f"{rev_growth * 100:+.1f}%",
            }
        )
        if pe is not None and pe > 25 and rev_growth > 0.15:
            components.append(6.5)

    score = _round1(sum(components) / len(components)) if components else 5.0
    return {
        "score": score,
        "label": "VAL",
        "title": "Valuation",
        "description": "Cheaper multiples and healthier yields score higher on fixed bands.",
        "metrics": metrics,
        "why": (
            "Score rises when P/E, PEG, P/S, P/B, EV/EBITDA look inexpensive, "
            "or when dividend yield is attractive (capped so extreme yields don't dominate). "
            "Not peer-adjusted yet."
        ),
    }


def risk_score(info: dict[str, Any]) -> dict[str, Any]:
    beta = _f(info, "beta")
    short_pct = _f(info, "shortPercentOfFloat")
    profit_margin = _f(info, "profitMargins")
    debt_to_equity = _f(info, "debtToEquity")
    current_ratio = _f(info, "currentRatio")
    payout = _payout_pct(info)
    div_yield = _yield_pct(info)

    metrics: list[dict[str, str]] = []
    components: list[float] = []

    if beta is not None:
        # beta 1 → ~5; 2 → ~9
        components.append(_clamp(beta * 4.5))
        metrics.append({"label": "Beta", "value": f"{beta:.2f}"})

    if short_pct is not None:
        # Yahoo often returns fraction (0.05) or percent — normalize
        pct = short_pct * 100 if short_pct <= 1 else short_pct
        components.append(_clamp(pct / 2))
        metrics.append({"label": "Short % of float", "value": f"{pct:.1f}%"})

    if profit_margin is not None:
        metrics.append(
            {
                "label": "Profit margin",
                "value": f"{profit_margin * 100:.1f}%",
            }
        )
        if profit_margin < 0:
            components.append(8.0)
        elif profit_margin < 0.05:
            components.append(6.0)
        else:
            components.append(3.5)

    if debt_to_equity is not None:
        # Yahoo D/E often scaled (e.g. 150 = 1.5)
        de = debt_to_equity / 100 if debt_to_equity > 10 else debt_to_equity
        components.append(_clamp(de * 2.5))
        metrics.append({"label": "Debt / equity", "value": f"{de:.2f}"})

    if current_ratio is not None:
        metrics.append({"label": "Current ratio", "value": f"{current_ratio:.2f}"})
        if current_ratio < 1:
            components.append(7.5)
        elif current_ratio < 1.5:
            components.append(5.0)
        else:
            components.append(3.0)

    if payout is not None:
        metrics.append({"label": "Payout ratio", "value": f"{payout:.0f}%"})
        if payout >= 100:
            components.append(8.5)
        elif payout >= 80:
            components.append(7.0)
        elif payout >= 60:
            components.append(5.0)
        elif payout >= 0:
            components.append(3.0)

    # Very high yield can signal distress / value-trap risk
    if div_yield is not None and div_yield >= 6:
        metrics.append({"label": "Dividend yield", "value": f"{div_yield:.2f}%"})
        if div_yield >= 8:
            components.append(8.0)
        else:
            components.append(6.5)

    score = _round1(sum(components) / len(components)) if components else 5.0
    return {
        "score": score,
        "label": "RISK",
        "title": "Risk",
        "description": (
            "Higher = more concerning (volatility, leverage, payout pressure, losses)."
        ),
        "metrics": metrics,
        "why": (
            "Combines beta, short interest, profitability, balance-sheet pressure, "
            "payout ratio, and unusually high dividend yield into a 0-10 risk reading."
        ),
    }


def composite_from_scores(asym: float, val: float, risk: float) -> dict[str, Any]:
    composite = _round1((asym + val + (10 - risk)) / 3)
    if composite >= 8:
        verdict, blurb = "STRONG BUY", "Skew favors upside across asymmetry, value, and risk."
    elif composite >= 6.5:
        verdict, blurb = "BUY", "Setup looks constructive on the rule-based composite."
    elif composite >= 5:
        verdict, blurb = "HOLD", "Mixed signals — no clear edge from these metrics alone."
    elif composite >= 3.5:
        verdict, blurb = "AVOID", "Risk and/or valuation outweigh the asymmetry case."
    else:
        verdict, blurb = "STRONG AVOID", "Metrics stack against a favorable risk/reward."

    return {
        "score": composite,
        "verdict": verdict,
        "blurb": blurb,
        "formula": "(ASYM + VAL + (10 - RISK)) / 3",
    }
