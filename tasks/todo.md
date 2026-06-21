# Todo

Remote agents should use this file to plan non-trivial tasks, track progress, and record the verification performed before reporting completion.

## Current Task: Make New Briefing Framework Visible

### Plan
- [x] Confirm why the production page still looked unchanged.
- [x] Record the correction pattern in `tasks/lessons.md`.
- [x] Add a visible archived-briefing state for records generated before the new investor-discipline JSON fields existed.
- [ ] Run lint, TypeScript, production build, and diff checks.
- [ ] Commit, push, and verify Vercel production.

### Findings
- The deployment was live, but `/briefing` was rendering the latest stored June 19 briefing. That stored JSON predates the new fields, so the new sections were correctly coded but invisible for the currently selected archive record.
- Local `.env.local` does not contain `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, or `DIGEST_EMAIL`, so I cannot safely generate a fresh production briefing locally without pulling or using production secrets.

## Current Task: Briefing Investor Discipline Sections

### Plan
- [x] Confirm the current briefing JSON contract, email renderer, browser page, and deployment scripts.
- [x] Add additive briefing schema fields for data health, action discipline, catalyst calendar, thesis ledger, research backlog, source quality, and a richer portfolio risk dashboard.
- [x] Update prompt/playbook instructions so the daily Claude-generated JSON actually populates those fields.
- [x] Render the new fields in both the email digest and `/briefing` page.
- [x] Add normalization/defaults so older briefings and partial model outputs still render safely.
- [x] Run lint, TypeScript, production build, and diff checks.
- [x] Push/deploy if verification passes and add the production briefing URL to Chrome bookmarks if browser automation is available.

### Privacy Boundary
- Tax-aware rebalancing is intentionally out of scope. Accurate tax-lot handling would require brokerage data or manual trade/cost-basis exports, and the user does not want that data in this system.

### Review
- Added additive briefing JSON fields for `dataHealth`, `actionDiscipline`, `portfolioRiskDashboard`, `catalystCalendar`, `thesisLedger`, `researchBacklog`, `sourceQuality`, plus per-signal `actionStatus`, `variantPerception`, and `sourceQuality`.
- Updated the Claude briefing prompt and runtime `skills.md` playbook so the daily email asks for investor-discipline sections without requiring brokerage/tax-lot data.
- Updated `lib/email.ts` to render Data Health, Action Discipline, Catalyst Calendar, Thesis Ledger, Research Quarantine, Portfolio Risk Dashboard, and Source Quality.
- Updated `/briefing` so the browser archive renders the same new fields when future briefings contain them.
- Added parser normalization/defaults so older briefings and partial model output continue to render safely.
- Pushed commit `1446159 Add investor discipline briefing sections` to `origin/main`.
- Verified Vercel production deployment `dpl_Dt3sbVmwvHCynwyK8NB8AAyYRKg7` is `Ready`, alias `https://portfolio-intel-pearl.vercel.app`, cloned commit `1446159`.
- Added Chrome bookmark `Portfolio Briefing` for `https://portfolio-intel-pearl.vercel.app/briefing`.

### Verification
- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed. It still prints the pre-existing Recharts width/height warnings during static generation, but compilation and route generation succeed.
- `git diff --check` passed.

## Current Task: Deployment Access Check

### Plan
- [x] Check which deployment/CLI tools are installed locally.
- [x] Check repo remote, Vercel project linkage, and current working tree status.
- [x] Identify whether Codex can deploy directly or needs the user to log in/authorize.
- [x] Explain the practical path for getting the daily email changes into production.

### Findings
- Local CLIs are installed: Vercel CLI `54.4.1`, Codex CLI `0.142.0-alpha.6`, Claude Code `2.1.181`.
- Repo remote is `https://github.com/rao07-commits/portfolio-intel.git` on branch `main`.
- Vercel project is already linked via `.vercel/project.json`: project `portfolio-intel`.
- `vercel whoami` succeeds as `raosiddarth07-5712`, so this machine can likely deploy with Vercel CLI.
- GitHub push initially failed due to stale HTTPS credentials; `gh auth setup-git` fixed Git credential routing.
- Remote `main` had one newer commit (`a2c4d5b`), so the daily briefing commit was rebased cleanly before push.
- Pushed commit `03936e3 Improve daily briefing signal data quality` to `origin/main`.
- Production Vercel deploy succeeded: deployment `dpl_D6XUkdqZ4pPmsY3x8yM1cCErprF7`, ready state `READY`, alias `https://portfolio-intel-pearl.vercel.app`.
- Cron schedule is weekdays only: market data at `0 13 * * 1-5`, briefing at `30 13 * * 1-5`.

## Current Task: Runtime Briefing Skills File

### Plan
- [x] Check whether portfolio briefing `skills.md` exists and whether the email reads it.
- [x] Replace stale/untracked `skills.md` with current portfolio briefing instructions from project context, user discussion, and visible ChatGPT recommendations.
- [x] Wire the daily briefing runtime to append `skills.md` to Claude's system prompt.
- [x] Add Vercel output tracing so `skills.md` is included in the serverless function bundle.
- [x] Verify lint, TypeScript, production build, then commit and push.

### Review
- `skills.md` existed locally but was untracked and only referenced by `CLAUDE.md`; the live daily email did not read it.
- The correct interpretation is: `skills.md` can be made the durable portfolio-briefing playbook, but code must explicitly load it at runtime.
- `lib/agent/briefing-agent.ts` now reads root `skills.md` and appends it to the system prompt used for the daily briefing.
- `next.config.mjs` includes `skills.md` in the `/api/cron/briefing` function trace for Vercel.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- GitHub push succeeded at commit `1fe62c3`.
- Vercel production was verified after GitHub auto-deploy: alias `portfolio-intel-pearl.vercel.app` is `Ready`, and build logs show `Cloning github.com/rao07-commits/portfolio-intel (Branch: main, Commit: 1fe62c3)`.

## Current Task: ChatGPT Performance Tracker Improvements

### Plan
- [x] Capture the visible recommendations from the open ChatGPT "Performance Tracker Summary" tab.
- [x] Add structured signal fields: score, type, trigger reason, risk notes, and data quality.
- [x] Enrich required research context with recent price changes, market-data timestamps, and freshness/staleness flags.
- [x] Render the added signal metadata in the daily email without making it noisy.
- [x] Verify lint, TypeScript, production build, and diff hygiene.

### Chrome findings
- Full ChatGPT history extraction was not available through Chrome controls, but the visible recommendations were readable.
- Visible recommendations: store ticker metadata; pull latest price, prior close, 1D/5D/30D change, volume, market cap if available; pull macro inputs such as 10Y yield, 2Y yield, 10Y-2Y spread, breakeven inflation, oil, dollar, SPY/QQQ; pull recent headlines; store fetched data with timestamps.
- Visible validation layer: check market-data freshness, flag missing/stale prices, flag corporate actions/splits if detected, avoid confident signals when key data is missing, and add a `data_quality` field to every output.
- Visible signal engine: emit structured signal objects with ticker, company name, current price, 1D/5D price changes, 0-100 score, signal type, trigger reason, confidence, action, and risk notes.

### Review
- Added `lib/market-health.ts` to compute tracked symbols, current price, volume, 1D/5D/30D moves, freshness warnings, and `dataQuality`.
- Added `get_market_health` to both the raw briefing agent and MCP tool server, and included it in mandatory preloaded briefing research.
- Extended `BriefingOutput.tradeSignals` with optional company name, current price, recent changes, signal score/type, trigger reason, data quality, and risk notes.
- Updated the briefing prompt to require data-quality-aware confidence and to avoid confident signals when market data is missing/stale.
- Updated the daily email and `/briefing` page to render the new signal metadata compactly.
- Expanded daily market-data cron to always fetch SPY and QQQ, and added FRED series for 10Y/2Y yields, WTI oil, and the broad dollar index.

### Verification
- `npm run lint` passed.
- `npx tsc --noEmit` passed after replacing Set spreads with `Array.from(...)` for this project target.
- `npm run build` passed. It still prints pre-existing Recharts width/height warnings during static generation, but compilation and route generation succeed.
- `git diff --check` passed.

## Current Task: Daily Claude Email Research Gap Fix

### Plan
- [x] Confirm what local project powers the daily Claude portfolio email and what "import" means in this repo.
- [x] Audit briefing agent prompts, tool inputs, email rendering, and prior notes for research gaps.
- [x] Implement the smallest high-leverage fixes that improve portfolio allocation insight without inventing unrelated architecture.
- [x] Verify with typecheck/build and targeted checks for generated email/briefing behavior.
- [x] Record final review, verification, and any remaining handoff questions.

### Working assumptions
- ChatGPT/Codex chat history is not directly available unless exported or represented in local files.
- `/Users/sid/Desktop/portfolio-intel` is the project backing the daily Claude email.
- The previous completed task in this file is likely related to the enhancements the user remembered.

### Review
- Found the active daily email app at `/Users/sid/Desktop/portfolio-intel` and confirmed via local Claude memory that the older `/Users/sid/Documents/Claude/Scheduled/daily-market-briefing` skill is inactive/secondary.
- Imported the older skill's high-signal market-note requirements into the active app prompt: macro landscape, equities/sectors, positioning themes, source quality, specific numbers when available, and no invented exact levels.
- Hardened `generateBriefing()` so it preloads mandatory research context from previous briefing, recent signals, portfolio, macro, sectors, market news, IPOs, concentration, rebalance recommendations, and smart money before Claude writes the JSON.
- Broadened Finnhub news input from technology-only to technology + general market news, ranked by portfolio relevance, AI/macro relevance, and source quality.

### Verification
- `npm run lint` passed with no warnings or errors.
- `npx tsc --noEmit` passed.
- `npm run build` passed. Build still prints pre-existing Recharts width/height static-render warnings, but compilation and route generation succeeded.
- `git diff --check` passed.

### Remaining notes
- I cannot directly inspect ChatGPT account history from here unless the chat was exported, open in an inspectable browser/app surface, or saved locally.
- Production email delivery still needs deployed-environment verification because local production env/API credentials are not available in this sandbox.

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
