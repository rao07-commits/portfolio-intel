// Curated list of tracked 13F filers. Every CIK below was verified against
// data.sec.gov/submissions on 2026-06-06 (entity name + an active 13F-HR
// filing history, latest reportDate 2026-03-31 for all).
//
// Alternates checked and rejected:
// - CIK 2026053 "Pershing Square Inc." (holdco) — we track the manager LP instead.
// - CIK 1173334 "PABRAI MOHNISH" — stale, last 13F-HR 2012; Dalal Street LLC is
//   Pabrai's current filer.
// - CIK 1279148 "Gotham Asset Management LP" — stale, last 13F-HR 2009; the LLC
//   is the current filer.

export interface TrackedFund {
  cik: string; // no leading zeros
  name: string;
  manager: string;
  // Cap stored positions for funds with very wide books (e.g. Greenblatt holds
  // hundreds of quant-value positions; only the top N are interesting).
  topNOnly?: number;
}

export const TRACKED_FUNDS: TrackedFund[] = [
  { cik: "1336528", name: "Pershing Square Capital Management", manager: "Bill Ackman" },
  { cik: "1549575", name: "Dalal Street (Pabrai)", manager: "Mohnish Pabrai" },
  { cik: "1777813", name: "Atreides Management", manager: "Gavin Baker" },
  { cik: "1135730", name: "Coatue Management", manager: "Philippe Laffont" },
  { cik: "1541617", name: "Altimeter Capital", manager: "Brad Gerstner" },
  { cik: "1387322", name: "Whale Rock Capital", manager: "Alex Sacerdote" },
  { cik: "1569049", name: "Light Street Capital", manager: "Glen Kacher" },
  { cik: "1067983", name: "Berkshire Hathaway", manager: "Warren Buffett" },
  { cik: "1709323", name: "Himalaya Capital", manager: "Li Lu" },
  { cik: "1510387", name: "Gotham Asset Management", manager: "Joel Greenblatt", topNOnly: 20 },
];
