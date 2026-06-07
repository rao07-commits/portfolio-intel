// SEC EDGAR client for 13F filings. No API key needed, but SEC requires a
// descriptive User-Agent (anonymous UAs get 403) and asks for <10 req/s.

const SEC_UA = process.env.SEC_USER_AGENT || "portfolio-intel (rao.siddarth07@gmail.com)";

function headers() {
  return { "User-Agent": SEC_UA };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSec(url: string): Promise<Response> {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`EDGAR error ${res.status}: ${url}`);
  await sleep(200); // stay well under SEC's 10 req/s ceiling
  return res;
}

export interface FilingRef {
  accession: string; // with dashes, e.g. 0001193125-26-226661
  reportDate: string; // quarter end, e.g. 2026-03-31
  filingDate: string;
}

export interface InfoTableEntry {
  issuerName: string;
  cusip: string;
  value: number; // dollars (normalized)
  shares: number;
}

// Latest 13F-HR for a CIK (null if none)
export async function fetchLatestFiling(cik: string): Promise<FilingRef | null> {
  const padded = cik.padStart(10, "0");
  const res = await fetchSec(`https://data.sec.gov/submissions/CIK${padded}.json`);
  const data = await res.json();
  const recent = data?.filings?.recent;
  if (!recent) return null;
  // form/accessionNumber/filingDate/reportDate are parallel arrays
  for (let i = 0; i < recent.form.length; i++) {
    if (recent.form[i] === "13F-HR") {
      return {
        accession: recent.accessionNumber[i],
        reportDate: recent.reportDate[i],
        filingDate: recent.filingDate[i],
      };
    }
  }
  return null;
}

// The information table is a separate XML in the accession dir (NOT primary_doc.xml).
export async function resolveInfoTableUrl(cik: string, accession: string): Promise<string> {
  const accNoDashes = accession.replace(/-/g, "");
  const base = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDashes}`;
  const res = await fetchSec(`${base}/index.json`);
  const index = await res.json();
  const items: { name: string }[] = index?.directory?.item || [];
  const candidates = items
    .map((i) => i.name)
    .filter((n) => n.toLowerCase().endsWith(".xml") && n.toLowerCase() !== "primary_doc.xml");
  if (candidates.length === 0) throw new Error(`No information-table XML found in ${base}`);
  return `${base}/${candidates[0]}`;
}

function tag(block: string, name: string): string | null {
  // Lightweight extraction — 13F info tables are flat, namespaced-but-simple XML
  const m = block.match(new RegExp(`<(?:\\w+:)?${name}>([^<]*)</(?:\\w+:)?${name}>`));
  return m ? m[1].trim() : null;
}

// Fetch + parse the information table, aggregating rows by CUSIP (the same
// issuer appears in multiple <infoTable> rows for different accounts/classes).
// Option positions (<putCall>) are skipped — we track equity exposure only.
export async function fetchInformationTable(url: string, reportDate: string): Promise<InfoTableEntry[]> {
  const res = await fetchSec(url);
  const xml = await res.text();

  // Pre-Q3-2022 filings report value in thousands; newer ones in dollars
  const valueMultiplier = reportDate < "2022-09-30" ? 1000 : 1;

  const byCusip = new Map<string, InfoTableEntry>();
  const rows = xml.match(/<(?:\w+:)?infoTable>[\s\S]*?<\/(?:\w+:)?infoTable>/g) || [];
  for (const row of rows) {
    if (tag(row, "putCall")) continue; // skip options
    const cusip = tag(row, "cusip");
    const issuerName = tag(row, "nameOfIssuer");
    const value = Number(tag(row, "value") || 0) * valueMultiplier;
    const shares = Number(tag(row, "sshPrnamt") || 0);
    if (!cusip || !issuerName) continue;

    const existing = byCusip.get(cusip);
    if (existing) {
      existing.value += value;
      existing.shares += shares;
    } else {
      byCusip.set(cusip, { issuerName, cusip, value, shares });
    }
  }

  return Array.from(byCusip.values()).sort((a, b) => b.value - a.value);
}
