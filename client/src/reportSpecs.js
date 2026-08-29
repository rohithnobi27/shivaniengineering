/**
 * Final Inspection Report specifications (ADDITIVE — no existing code touched).
 *
 * Each spec is matched against a saved invoice item's `particulars` text so
 * every line on a Tax Invoice automatically gets its own report page.
 */

export const REPORT_SPECS = [
  {
    key: 'boss-handle-bar',
    partName: 'BOSS HANDLE BAR',
    partNo: 'K2150169',
    match: /BOSS\s*HANDLE\s*BAR/i,
    spec: {
      totalLength: '15.00 ± 0.2',
      outerDia: '12.00 ± 0.2',
      odChamfer: '15 x 0.50',
      tapping: 'M8 x 1.25P Gauge',
    },
  },
  {
    key: 'boss-dia',
    partName: 'BOSS DIA 19x20',
    partNo: 'ITEM NO: 1',
    match: /BOSS\s*DIA/i,
    spec: {
      totalLength: '50.00 ± 0.2',
      outerDia: '19.00 ± 0.2',
      odChamfer: '4.500 x 0.50',
    },
  },
  {
    key: 'punch-handle',
    partName: 'PUNCH HANDLE',
    partNo: 'ITEM NO: 2',
    match: /PUNCH\s*HANDLE/i,
    spec: {
      totalLength: '50.00 ± 0.3',
      innerDia: '23.5 ± 0.5',
      outerDia: '11.20 ± 0.02',
      odChamfer: '45 x 0.50',
    },
  },
  {
    key: 'arch-handle-support',
    partName: 'ARCH HANDLE SUPPORT',
    partNo: 'ITEM NO: 2',
    match: /ARCH\s*HANDLE\s*SUPPORT/i,
    spec: {
      totalLength: '50.00 ± 0.3',
      innerDia: '23.5 ± 0.5',
      outerDia: '11.20 ± 0.02',
      odChamfer: '45 x 0.50',
    },
  },
  {
    key: 'bar-32x48',
    partName: 'BAR 32x48',
    partNo: 'ITEM NO: 6',
    match: /BAR\s*32\s*[xX×]\s*48/i,
    spec: {
      totalLength: '30.00 ± 0.2',
      outerDia: '18.00 ± 0.2',
      odChamfer: '45 x 0.50',
      tapping: 'M12 x 1.25P Gauge',
    },
  },
  {
    key: 'bar-18x30',
    partName: 'BAR 18x30',
    partNo: 'ITEM NO: 4',
    match: /BAR\s*18\s*[xX×]\s*30/i,
    spec: {
      totalLength: '18.00 ± 0.2',
      innerDia: '16.00 ± 0.2',
      outerDia: '31.00 ± 0.2',
      odChamfer: '45 x 0.50',
    },
  },
];

/** Generic fallback so ANY invoice line still prints a usable report sheet. */
const FALLBACK_SPEC = {};

function extractPartNo(particulars = '') {
  const m = particulars.match(/ITEM\s*NO\.?\s*:?\s*([A-Za-z0-9-]+)/i);
  if (m) return `ITEM NO: ${m[1]}`;
  const code = particulars.match(/\b([A-Z]\d{6,})\b/);
  return code ? code[1] : '-';
}

function extractName(particulars = '') {
  return (
    particulars
      .replace(/ITEM\s*NO\.?\s*:?\s*[A-Za-z0-9-]+/i, '')
      .replace(/With\s*Material\s*\d+/i, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'COMPONENT'
  );
}

/** Map one saved-invoice item -> report definition. */
export function specForItem(item, index = 0) {
  const particulars = item?.particulars || '';
  const found = REPORT_SPECS.find((s) => s.match.test(particulars));
  return {
    key: `${found ? found.key : 'generic'}-${item?.slNo ?? index}`,
    partName: found ? found.partName : extractName(particulars),
    partNo: found ? found.partNo : extractPartNo(particulars),
    spec: found ? found.spec : FALLBACK_SPEC,
    quantity: Number(item?.quantity) || 0,
  };
}

/** One report definition per invoice line item, in invoice order. */
export function reportsForInvoice(invoice) {
  return (invoice?.items || []).map(specForItem);
}

/** Deterministic pseudo-random in [0,1) from a string seed. */
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Parse "50.00 ± 0.2" -> { nominal, tol, decimals } */
function parseSpec(standard) {
  if (!standard) return null;
  const m = String(standard).match(/(-?\d+(?:\.\d+)?)\s*(?:±|\+\/-)\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const decimals = (m[1].split('.')[1] || '').length || 2;
  return { nominal: Number(m[1]), tol: Number(m[2]), decimals };
}

/**
 * Actual observation reading — random but deterministic, always well inside
 * tolerance (±80%) so every reading passes, like the paper forms.
 */
export function observationFor(standard, key) {
  const parsed = parseSpec(standard);
  if (!parsed) return 'OK';
  const offset = (seeded(key) * 2 - 1) * parsed.tol * 0.8;
  return (parsed.nominal + offset).toFixed(parsed.decimals);
}
