// Pragmatic CUSIP/issuer-name → ticker resolution for 13F holdings.
//
// 13F info tables identify positions by CUSIP + free-text issuer name; SEC's
// company_tickers.json maps name ↔ ticker (no CUSIP). Strategy:
//   1. Static CUSIP override map for names that matter most (user holdings
//      overlap + mega-caps) — guaranteed correct.
//   2. Normalized issuer-name match against company_tickers.json.
//   3. Otherwise null — UI/email fall back to showing the issuer name.
// OpenFIGI batch lookup is a possible future enhancement; not built now.

const SEC_UA = process.env.SEC_USER_AGENT || "portfolio-intel (rao.siddarth07@gmail.com)";

// CUSIP → ticker overrides. Every entry was verified against actual 13F filing
// data (issuer name seen at that CUSIP in tracked funds' Q1-2026 filings) and
// cross-checked with SEC company_tickers.json on 2026-06-06.
const CUSIP_OVERRIDES: Record<string, string> = {
  "023135106": "AMZN", // AMAZON COM INC
  "67066G104": "NVDA", // NVIDIA CORPORATION
  "02079K305": "GOOGL", // ALPHABET INC
  "02079K107": "GOOG", // ALPHABET INC
  "037833100": "AAPL", // APPLE INC
  "594918104": "MSFT", // MICROSOFT CORP
  "30303M102": "META", // META PLATFORMS INC
  "88160R101": "TSLA", // TESLA INC
  "595112103": "MU", // MICRON TECHNOLOGY INC
  "11135F101": "AVGO", // BROADCOM INC
  "874039100": "TSM", // TAIWAN SEMICONDUCTOR MANUFAC
  "084670702": "BRK.B", // BERKSHIRE HATHAWAY INC DEL
  "00827B106": "AFRM", // AFFIRM HLDGS INC
  "770700102": "HOOD", // ROBINHOOD MKTS INC
  "78462F103": "SPY", // STATE STR SPDR S&P 500 ETF
  "020764106": "AMR", // ALPHA METALLURGICAL RESOUR
  "11271J107": "BN", // BROOKFIELD CORP
  "76131D103": "QSR", // RESTAURANT BRANDS INTL INC
  "060505104": "BAC", // BANK AMERICA CORP
  "16935C109": "CHYM", // CHIME FINL INC
  "674599105": "OXY", // OCCIDENTAL PETE CORP
  "038222105": "AMAT", // APPLIED MATLS INC
  "55024U109": "LITE", // LUMENTUM HLDGS INC
  "042068205": "ARM", // ARM HOLDINGS PLC
  "007973100": "AEIS", // ADVANCED ENERGY INDS
  "H1467J104": "CB", // CHUBB LTD SWITZ
  "615369105": "MCO", // MOODYS CORP
  "219350105": "GLW", // CORNING INC
  "55405Y100": "MTSI", // MACOM TECH SOLUTIONS HLDGS
  "N07059210": "ASML", // ASML HLDG NV
  "G25457105": "CRDO", // CREDO TECHNOLOGY GROUP
  "253393102": "DKS", // DICKS SPORTING GOODS INC
  "77311W101": "RKT", // ROCKET COS INC
};

interface SecTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

let nameIndexPromise: Promise<Map<string, string>> | null = null;

export function normalizeIssuerName(name: string): string {
  // Strips corporate suffixes AND the abbreviations 13F filers use for them
  // (HLDGS, MKTS, FINL, INTL, ...) so "ROBINHOOD MKTS INC" matches
  // "Robinhood Markets, Inc."
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\b(INC|INCORPORATED|CORP|CORPORATION|CO|COS|COMPANY|COMPANIES|LTD|LIMITED|PLC|LLC|LP|HOLDING|HOLDINGS|HLDG|HLDGS|GROUP|GRP|THE|CL|CLASS|[ABC]|COM|NEW|DEL|ADR|ADS|SHS|ORD|MKTS|MARKETS|FINL|FINANCIAL|INTL|INTERNATIONAL|INDS|INDUSTRIES|MATLS|MATERIALS|RESOUR|RESOURCES|PETE|PETROLEUM|TECH|TECHNOLOGY|TECHNOLOGIES|SOLUTIONS|TR|TRUST|NV|SA|AG|DE|NY|ON|UK|SWITZ)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function buildNameIndex(): Promise<Map<string, string>> {
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": SEC_UA },
  });
  if (!res.ok) throw new Error(`company_tickers.json error: ${res.status}`);
  const data = (await res.json()) as Record<string, SecTickerEntry>;

  const index = new Map<string, string>();
  for (const entry of Object.values(data)) {
    const key = normalizeIssuerName(entry.title);
    // First occurrence wins — company_tickers.json lists primary listings first
    if (key && !index.has(key)) index.set(key, entry.ticker);
  }
  return index;
}

// Resolve a 13F holding to a ticker; null when unknown (caller shows issuer name)
export async function resolveTicker(cusip: string, issuerName: string): Promise<string | null> {
  if (CUSIP_OVERRIDES[cusip]) return CUSIP_OVERRIDES[cusip];

  if (!nameIndexPromise) nameIndexPromise = buildNameIndex();
  try {
    const index = await nameIndexPromise;
    return index.get(normalizeIssuerName(issuerName)) || null;
  } catch (err) {
    console.warn("CUSIP name-index unavailable:", err);
    nameIndexPromise = null; // retry next invocation
    return null;
  }
}
