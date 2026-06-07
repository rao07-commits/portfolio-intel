import { TRACKED_FUNDS } from "./funds";
import { fetchLatestFiling, resolveInfoTableUrl, fetchInformationTable } from "./edgar";
import { resolveTicker } from "./cusip-map";
import { hasProcessedAccession, insertFiling, upsert13fHolding, getPrior13fByFund } from "../db";

export interface SyncSummary {
  fundsChecked: number;
  newFilings: number;
  holdingsWritten: number;
  errors: string[];
}

// Pull the latest 13F-HR for each tracked fund. Already-processed accessions
// are skipped, so this is a cheap no-op outside filing season (13Fs land
// ~45 days after quarter end). Funds are processed sequentially to respect
// SEC rate limits.
export async function sync13f(): Promise<SyncSummary> {
  const summary: SyncSummary = { fundsChecked: 0, newFilings: 0, holdingsWritten: 0, errors: [] };

  for (const fund of TRACKED_FUNDS) {
    summary.fundsChecked++;
    try {
      const filing = await fetchLatestFiling(fund.cik);
      if (!filing) continue;
      if (await hasProcessedAccession(filing.accession)) continue;

      const infoTableUrl = await resolveInfoTableUrl(fund.cik, filing.accession);
      let entries = await fetchInformationTable(infoTableUrl, filing.reportDate);
      if (fund.topNOnly) entries = entries.slice(0, fund.topNOnly);

      const totalValue = entries.reduce((sum, e) => sum + e.value, 0);
      const prior = await getPrior13fByFund(fund.cik, filing.reportDate);
      const priorByCusip = new Map(prior.map((p) => [p.cusip, p]));

      for (const entry of entries) {
        const ticker = await resolveTicker(entry.cusip, entry.issuerName);

        // QoQ diff vs prior stored quarter (null when we have no prior data)
        let changeType: string | null = null;
        let changePct: number | null = null;
        if (prior.length > 0) {
          const prev = priorByCusip.get(entry.cusip);
          if (!prev) {
            changeType = "new";
          } else if (prev.shares > 0) {
            changePct = ((entry.shares - prev.shares) / prev.shares) * 100;
            changeType = changePct > 1 ? "added" : changePct < -1 ? "trimmed" : "unchanged";
          }
          priorByCusip.delete(entry.cusip);
        }

        await upsert13fHolding({
          cik: fund.cik,
          fund_name: fund.name,
          quarter_date: filing.reportDate,
          cusip: entry.cusip,
          issuer_name: entry.issuerName,
          ticker,
          shares: Math.round(entry.shares),
          market_value: Math.round(entry.value),
          pct_of_portfolio: totalValue > 0 ? (entry.value / totalValue) * 100 : 0,
          change_type: changeType,
          change_pct: changePct,
        });
        summary.holdingsWritten++;
      }

      // Positions present last quarter but absent now → exited (recorded under
      // the new quarter with zero size so the UI can surface them)
      for (const exited of Array.from(priorByCusip.values())) {
        await upsert13fHolding({
          cik: fund.cik,
          fund_name: fund.name,
          quarter_date: filing.reportDate,
          cusip: exited.cusip,
          issuer_name: exited.issuer_name,
          ticker: exited.ticker,
          shares: 0,
          market_value: 0,
          pct_of_portfolio: 0,
          change_type: "exited",
          change_pct: -100,
        });
        summary.holdingsWritten++;
      }

      await insertFiling({
        cik: fund.cik,
        accession: filing.accession,
        quarter_date: filing.reportDate,
        filing_date: filing.filingDate,
        fund_name: fund.name,
      });
      summary.newFilings++;
      console.log(`13F synced: ${fund.name} ${filing.reportDate} (${entries.length} positions)`);
    } catch (err) {
      console.error(`13F sync failed for ${fund.name}:`, err);
      summary.errors.push(`${fund.name}: ${err}`);
    }
  }

  return summary;
}
