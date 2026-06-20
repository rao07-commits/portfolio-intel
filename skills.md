# Portfolio Briefing Skills

This file is the durable briefing playbook for the daily Portfolio Intel email.
It is not a Codex skill by itself. The production app reads this file at briefing
runtime and appends it to the model instructions so the daily email has the
current portfolio context, research standards, and signal-quality rules.

The runtime email flow is:

1. Vercel cron calls `/api/cron/market-data`.
2. Vercel cron calls `/api/cron/briefing`.
3. `lib/agent/briefing-agent.ts` loads this file and the built-in system prompt.
4. Claude generates the briefing JSON using the app tools and preloaded research.
5. `lib/email.ts` sends the digest through Resend.

Informational only. The email must always include a non-financial-advice
disclaimer.

## 1. Investor Context

The user is an active investor with a concentrated AMZN position that should be
diversified over time. The user wants more AI and semiconductor exposure, but
not at the cost of hidden concentration risk. The email should help with
portfolio allocation, not just summarize news.

Known holdings and watch areas:

- AMZN
- NVDA
- CRWD
- GOOG
- APP
- ASTS
- HOOD
- EWY
- MU
- SPY
- GLD
- BTC
- 401K target-date fund
- Cash to deploy systematically

Portfolio objectives:

- Bring AMZN down toward a 15% max position.
- Do not trim more than about 5% of portfolio per month without a fresh reason.
- Increase AI/semis exposure toward a 15% target.
- Deploy excess cash through DCA into underweight sectors.
- Keep single positions below 15% and sectors below 35% unless the email clearly
  flags why the current state is temporary.
- Prefer medium-term themes over short-term day trades.

Target allocation:

| Bucket | Target |
|---|---:|
| Technology, mega-cap tech, semis | 30% |
| Broad market | 20% |
| Communication services | 10% |
| International | 10% |
| Consumer discretionary | 5% |
| Financials | 5% |
| Commodities | 5% |
| Crypto | 5% |
| Cash | 10% |

## 2. Daily Research Requirements

The daily email should read like a concise morning market note. It should be
opinionated, grounded in data, and focused on portfolio implications.

Every briefing should consider:

- What changed versus the prior briefing.
- Whether any allocation trigger actually fired.
- Portfolio holdings, prices, weights, and P&L where available.
- Recent trade signals, so the email does not keep re-pitching the same names.
- Market data quality and freshness before issuing confident signals.
- Macro inputs: Fed funds, 10Y yield, 2Y yield, 10Y-2Y spread, CPI, PPI,
  unemployment, GDP, ISM, consumer sentiment, 10Y breakevens, mortgage rates,
  WTI oil, broad dollar index.
- Broad market context: SPY and QQQ.
- Sector performance and rotation.
- AI, semiconductor, cloud, data center, power, enterprise software, and
  portfolio-relevant headlines.
- IPO calendar when relevant.
- Smart-money 13F data when there are new filings or meaningful quarterly
  changes.
- Scorecard and valuation snapshots computed deterministically by code.

Avoid filler. If nothing changed, say that clearly and keep the section lean.

## 3. Data Ingestion

The app should gather and store data with timestamps wherever possible.

Required market data:

- Latest price.
- Prior close or 1D change.
- 5D change when enough history exists.
- 30D change when enough history exists.
- Volume where available.
- Market-data date.
- Data-quality warnings.

Required macro and market inputs:

- 10Y yield.
- 2Y yield.
- 10Y-2Y spread.
- Breakeven inflation.
- Oil.
- Dollar.
- SPY.
- QQQ.

Required news inputs:

- Recent AI and tech headlines.
- Recent general market headlines.
- Portfolio-specific news for holdings and signal candidates.
- Source and URL when available.

Preferred sources and source quality:

- Reuters, Bloomberg, Financial Times, WSJ, Barron's, The Information,
  Seeking Alpha, Morningstar, SEC/company data, major bank research summaries.
- Avoid letting low-signal aggregator headlines drive the thesis.

## 4. Validation Layer

The email must not sound more confident than the data allows.

For every tracked ticker, validate:

- Whether market data exists.
- Whether the latest price is fresh.
- Whether prior close exists.
- Whether 5D and 30D history exists.
- Whether stale or missing data should reduce confidence.

Every trade signal should include `dataQuality`:

- `high`: fresh price and enough history.
- `medium`: usable data but incomplete history.
- `low`: missing or stale key data.

Rules:

- Do not issue a high-confidence buy, trim, or sell on low-quality data.
- If data is low quality, use `watch` or `research` style language.
- Flag stale or missing data directly in the trigger or risk notes.
- Do not invent exact prices, yields, or percent moves when the tools did not
  provide them.
- Corporate actions and splits should be flagged when detected or suspected.

## 5. Signal Engine

Trade signals should be structured, not just a ticker and a sentence.

Each signal should include as many of these fields as the data supports:

- `symbol`
- `companyName`
- `action`
- `reason`
- `currentPrice`
- `priceChange1d`
- `priceChange5d`
- `signalScore` from 0 to 100
- `signalType`
- `triggerReason`
- `dataQuality`
- `riskNotes`
- `entryRange`
- `targetPrice`
- `stopLoss`
- `timeframe`
- `confidence`

Valid signal types:

- `breakout`
- `pullback`
- `catalyst`
- `macro`
- `valuation`
- `earnings`
- `technical`
- `risk-off`
- `no-signal`

Valid actions:

- `watch`
- `research`
- `buy_candidate`
- `trim_candidate`
- `avoid`
- `hold`
- `initiate long`
- `add`
- `trim`
- `exit`

Discovery requirement:

- At least 3 of up to 5 trade signals should be names the user does not already
  own, unless the data strongly says no new ideas are warranted.
- At least 2 ideas should be individual stocks, not ETFs.
- Every new idea needs a variant perception: why the market may be mispricing
  the setup.

Do not repeat recent names unless the thesis materially changed. If a prior idea
is still in play, give a one-line status instead of a full re-pitch.

## 6. Themes To Track

The email should frame ideas as themes first and tickers second.

Core themes:

- AI semiconductor cycle: NVDA, MU, AMD, AVGO, TSM, ASML, AMAT, LRCX, KLAC,
  MRVL, ARM, SMCI.
- AI infrastructure and power: VRT, ANET, EQIX, CEG, VST, data center cooling,
  networking, and power constraints.
- Enterprise AI adoption: PLTR, SNOW, DDOG, NET, PATH, CFLT, MDB, CRWD.
- AI applications and cheaper inference beneficiaries: META, UBER, ABNB, PINS,
  APP, GOOG, AMZN.
- Macro rotation: financials/cyclicals when the yield curve steepens; growth
  when inflation and rates ease; defensives when labor or sentiment weakens.
- Korea and memory cycle exposure through EWY and MU.
- Cash deployment and AMZN concentration reduction.

## 7. Email Shape

The email should prioritize decision usefulness:

1. What's New Today.
2. Signal Scorecard.
3. Valuation Snapshot.
4. Trade Signals with score, type, trigger, risk, and data quality.
5. Allocation Actions, only when a real trigger fired.
6. Smart Money, only when new 13F data or meaningful changes exist.
7. Monday week-ahead or Friday week-recap when applicable.
8. Market Overview.
9. News, IPOs, Sector Rotation.
10. Portfolio Risk.
11. Disclaimer.

Keep the email concise. The user should be able to understand what changed, what
matters, and what action, if any, is worth considering.

## 8. Current Known Limitations

- ChatGPT history is not directly available to the production app unless its
  recommendations are copied into this file or implemented in code.
- The visible ChatGPT "Performance Tracker Summary" recommendations have been
  incorporated here: data ingestion, freshness validation, data quality, and a
  structured signal engine.
- Portfolio concentration analysis depends on real share quantities in the
  holdings table. If quantities are missing or zero, the email should show a
  data alert instead of rendering misleading HHI or position weights.
- 13F data is quarterly, delayed, and long-only. Use it for context, not daily
  trading urgency.
- Hardcoded earnings dates may become stale and should be treated cautiously
  unless refreshed by a live source.

## 9. How To Update This File

When the user corrects the daily email or shares new briefing preferences:

1. Add the durable instruction here.
2. If the instruction requires data, add or update the relevant tool/code path.
3. If the instruction should appear in the email, update `BriefingOutput` and
   `lib/email.ts`.
4. Run lint, TypeScript, and build.
5. Commit, push, and deploy to Vercel.
