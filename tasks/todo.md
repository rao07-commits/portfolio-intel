# Todo

Remote agents should use this file to plan non-trivial tasks, track progress, and record the verification performed before reporting completion.

## Current Task: 13F Smart Money Tab + Delta-Focused Email Redesign

Plan: ~/.claude/plans/deep-coalescing-blossom.md

- [x] Phase 0: Bug fixes — signalColor, undefined reason, NaN concentration gating
- [x] Phase 1: Extract lib/scorecard.ts, refactor scorecard page
- [x] Phase 2: DB — sec_13f_holdings, sec_13f_filings tables + helpers
- [x] Phase 3: 13F data layer (funds.ts w/ verified CIKs, edgar.ts, cusip-map.ts, sync.ts)
- [x] Phase 4: /api/cron/13f-update route + vercel.json weekly cron
- [x] Phase 5: app/smart-money/page.tsx + nav tab
- [x] Phase 6: Agent tools — get_smart_money, get_recent_signals, get_previous_briefing (both files)
- [x] Phase 7: Finnhub fetchMetrics + lib/valuation.ts
- [x] Phase 8: BriefingOutput schema + prompts.ts anti-repeat/delta/day-of-week
- [x] Phase 9: Email redesign (sendBriefingDigest extras) + cron wiring
- [x] Verification: EDGAR fetch, build, email render checks (see below)

## Review

### What was verified
- `npm run build` passes; /smart-money page + /api/cron/13f-update route present in route table.
- All 10 fund CIKs curl-verified against data.sec.gov submissions (names + active
  13F-HR, all reportDate 2026-03-31). Stale/wrong alternates documented in funds.ts.
- EDGAR pipeline tested live: Berkshire (29 positions, $263B, AAPL top at 22%) and
  Pershing Square (11 positions, AMZN/UBER/MSFT/META — AMZN overlap with user works).
- CUSIP resolution swept across all 10 funds: 79–100% per fund after fixes (only
  ambiguous ETF trusts left unresolved, by design). Atreides top-20 spot-checked
  by hand — all correct.
- Caught + fixed a real memory error during verification: CUSIP 00827B106 is
  AFFIRM (AFRM), not AppLovin — every override is now backed by filing data +
  company_tickers.json cross-check.

### Not verifiable locally (needs deploy or prod env)
- DB-backed pages (/smart-money, /scorecard) 500 locally because POSTGRES_URL
  only exists on Vercel (pre-existing; affects all DB pages). Pulling prod env
  was denied by permissions — verify after deploy instead.
- Actual email render: trigger /api/cron/briefing on the deployment and inspect
  the delivered email (no "undefined", no "NaN%", green INITIATE LONG, scorecard
  + valuation sections, "What's New" lead).
- First 13F sync: hit /api/cron/13f-update with CRON_SECRET after deploy.

### Follow-ups for the user
- Seed real share quantities via POST /api/portfolio (documented in README) to
  re-enable the concentration section.
- lib/earnings-calendar.ts is hardcoded + stale — needs a data source eventually.
- QoQ change badges (NEW/ADDED/TRIMMED/EXITED) appear from the second synced
  quarter onward (no prior quarter to diff on first sync).

---

## Previous Task (done)

- [x] Add repo-local AGENTS.md so remote agents can read working instructions.
- [x] Add task tracking files referenced by AGENTS.md.
- Verified AGENTS.md exists at the repo root; tasks/todo.md and tasks/lessons.md exist.
