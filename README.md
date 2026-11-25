# Lyvee Invest

Phone app for quick, **rule-based** stock snapshots. No AI. No database. No accounts.

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo (React Native) |
| API | FastAPI |
| Data | yfinance (Yahoo Finance) |

## What it shows

1. Live snapshot (price, 52W range, market cap, fwd P/E, rev growth, sector)
2. Three formula scores: **ASYM**, **VAL**, **RISK**
3. Composite verdict: `(ASYM + VAL + (10 - RISK)) / 3`

## Run locally

### 1. API

```bash
cd /c/Users/hungd/Projects/lyveeInvest/api
python -m venv .venv
source .venv/Scripts/activate   # Git Bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Health check: http://localhost:8001/api/health  
Example: http://localhost:8001/api/analyze?ticker=AAPL

### 2. Mobile

```bash
cd /c/Users/hungd/Projects/lyveeInvest/mobile
npm install
npx expo start --tunnel --clear
```

- iOS simulator: API defaults to `http://localhost:8001`
- Android emulator: API defaults to `http://10.0.2.2:8001`
- Physical phone (Expo Go): set your PC's LAN IP in `mobile/.env` (or the shell):

```bash
# Windows PowerShell example — use your machine's Wi‑Fi IP
$env:EXPO_PUBLIC_API_URL="http://192.168.x.x:8001"
npx expo start --tunnel --clear
```

Or create `mobile/.env` from `.env.example` with the same URL.

Phone and PC must be on the same Wi‑Fi. Tunnel mode only helps Metro; the API still needs a reachable LAN URL.

## Project layout

```
api/          FastAPI + yfinance + scoring
mobile/       Expo app
```

## Cost & performance notes

- API caches Yahoo ticker payloads (~2 min) and search (~1 min) in memory
- Search requests news/lists are disabled; complementary PEG fetch skipped
- Mobile aborts stale fetches, debounces search (450 ms, min 2 chars), and caches recent results
- Header uses a small `logo-96.png` instead of the full 1024 app icon

Bundle ID placeholder: `com.lyveeinvest.app` (change before store submit).
