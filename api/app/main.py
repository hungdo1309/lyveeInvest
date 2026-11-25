"""Lyvee Invest API — Yahoo snapshot + rule-based scores (no AI, no DB)."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.scoring import (
    asymmetry_score,
    composite_from_scores,
    risk_score,
    valuation_score,
)
from app.yahoo import fetch_ticker_payload, normalize_ticker, search_tickers

app = FastAPI(title="Lyvee Invest API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/search")
async def search(
    q: str = Query(..., min_length=2, description="Ticker or company name"),
    limit: int = Query(10, ge=1, le=25),
) -> dict[str, Any]:
    results = await asyncio.to_thread(search_tickers, q, limit)
    return {"query": q.strip(), "results": results}


@app.get("/api/snapshot")
async def snapshot(ticker: str = Query(..., min_length=1)) -> dict[str, Any]:
    symbol = normalize_ticker(ticker)
    payload = await asyncio.to_thread(fetch_ticker_payload, symbol)
    if not payload.get("ok"):
        raise HTTPException(status_code=404, detail=payload.get("error", "Not found"))
    return {
        "ticker": payload["ticker"],
        "snapshot": payload["snapshot"],
    }


@app.get("/api/analyze")
async def analyze(ticker: str = Query(..., min_length=1)) -> dict[str, Any]:
    """Fetch Yahoo data and return snapshot + ASYM / VAL / RISK + composite."""
    symbol = normalize_ticker(ticker)
    payload = await asyncio.to_thread(fetch_ticker_payload, symbol)
    if not payload.get("ok"):
        raise HTTPException(status_code=404, detail=payload.get("error", "Not found"))

    info = payload["raw"]
    asym = asymmetry_score(info)
    val = valuation_score(info)
    risk = risk_score(info)
    composite = composite_from_scores(asym["score"], val["score"], risk["score"])

    return {
        "ticker": payload["ticker"],
        "snapshot": payload["snapshot"],
        "scores": {
            "asymmetry": asym,
            "valuation": val,
            "risk": risk,
        },
        "composite": composite,
    }
