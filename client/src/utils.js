const ones = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function convertHundreds(num) {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' hundred';
    num %= 100;
    if (num > 0) str += ' ';
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)];
    if (num % 10 > 0) str += ' ' + ones[num % 10];
  } else if (num > 0) {
    str += ones[num];
  }
  return str;
}

export function numberToWords(amount) {
  if (amount === 0) return 'Zero only';

  let remaining = Math.floor(amount);
  const paise = Math.round((amount - remaining) * 100);

  let words = '';

  if (remaining >= 10000000) {
    words += convertHundreds(Math.floor(remaining / 10000000)) + ' crore ';
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    words += convertHundreds(Math.floor(remaining / 100000)) + ' lakh ';
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    words += convertHundreds(Math.floor(remaining / 1000)) + ' thousand ';
    remaining %= 1000;
  }
  if (remaining > 0) {
    words += convertHundreds(remaining);
  }

  words = words.trim();
  if (paise > 0) {
    words += ` and ${convertHundreds(paise)} paise`;
  }
  const result = words + ' only';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/** Detect BAR line with a given item number (4 or 6, etc.) */
export function hasBarItem(items, itemNo) {
  const no = String(itemNo);
  return (items || []).some((item) => {
    const p = item.particulars || '';
    if (!/BAR/i.test(p)) return false;
    if (new RegExp(`ITEM\\s*NO\\.?\\s*:?\\s*${no}\\b`, 'i').test(p)) return true;
    // fallback by product name → item no mapping
    if (no === '6' && /BAR\s*32\s*[xX×]\s*48/i.test(p)) return true;
    if (no === '4' && /BAR\s*18\s*[xX×]\s*30/i.test(p)) return true;
    return false;
  });
}

export function findBarItemLines(items, itemNo) {
  const no = String(itemNo);
  return (items || []).filter((item) => {
    const p = item.particulars || '';
    if (!/BAR/i.test(p)) return false;
    if (new RegExp(`ITEM\\s*NO\\.?\\s*:?\\s*${no}\\b`, 'i').test(p)) return true;
    if (no === '6' && /BAR\s*32\s*[xX×]\s*48/i.test(p)) return true;
    if (no === '4' && /BAR\s*18\s*[xX×]\s*30/i.test(p)) return true;
    return false;
  });
}

/** List BAR item numbers present on an invoice (for report buttons) */
export function getBarReportItemNos(items) {
  const found = [];
  if (hasBarItem(items, 6)) found.push('6');
  if (hasBarItem(items, 4)) found.push('4');
  return found;
}

export function getFYPrefix(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
}

/** Build plain-text invoice for download / share */
export function invoiceToText(invoice) {
  if (!invoice) return '';
  const lines = [
    'SHIVANI ENGINEERING — TAX INVOICE',
    `Invoice No: ${invoice.invoiceNo}`,
    `Date: ${formatDate(invoice.invoiceDate)}`,
    `DC No: ${invoice.dcNo || '-'}`,
    `Customer: ${invoice.customerName}`,
    invoice.customerAddress || '',
    `GST TIN: ${invoice.customerGstin || '-'}`,
    '',
    'Items:',
  ];
  (invoice.items || []).forEach((item) => {
    lines.push(
      `${item.slNo}. ${item.particulars} | HSN ${item.hsnCode} | Qty ${item.quantity} | Rate ${formatCurrency(item.unitRate)} | Amt ${formatCurrency(item.amount)}`
    );
  });
  lines.push(
    '',
    `Subtotal: ${formatCurrency(invoice.subtotal)}`,
    `IGST @ ${invoice.igstPercent}%: ${formatCurrency(invoice.igstAmount)}`,
    `Grand Total: ${formatCurrency(invoice.grandTotal)}`,
    `In words: ${invoice.amountInWords || ''}`,
  );
  return lines.filter((l, i) => l !== '' || i === 0).join('\n');
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function printTaxReport({ rows, summary, filters }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Please allow pop-ups to print the tax report.');

  const filterText = [
    filters.item && `Item: ${filters.item}`,
    filters.from && `From: ${filters.from}`,
    filters.to && `To: ${filters.to}`,
  ].filter(Boolean).join(' | ') || 'All saved invoices';

  const body = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(row.sourceRefs.join(', '))}</td>
      <td>${escapeHtml(row.particulars)}</td>
      <td>${escapeHtml(row.hsnCode || '-')}</td>
      <td class="number">${row.quantity}</td>
      <td class="number">₹ ${formatCurrency(row.unitRate)}</td>
      <td class="number">₹ ${formatCurrency(row.taxableAmount)}</td>
      <td class="number">${formatCurrency(row.gstPercent)}%</td>
      <td class="number">₹ ${formatCurrency(row.gstAmount)}</td>
      <td class="number">₹ ${formatCurrency(row.totalAmount)}</td>
    </tr>`).join('');

  printWindow.document.write(`<!doctype html>
    <html><head><title>Tax Item Report</title><meta charset="utf-8">
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; font-size: 11px; }
      h1 { margin: 0 0 4px; font-size: 20px; color: #123b68; }
      h2 { margin: 0; font-size: 15px; color: #123b68; }
      .header { border-bottom: 2px solid #123b68; padding-bottom: 9px; margin-bottom: 12px; }
      .meta { color: #526174; margin-top: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #123b68; color: white; font-weight: 700; }
      th, td { border: 1px solid #aeb9c7; padding: 6px 7px; text-align: left; }
      .number { text-align: right; white-space: nowrap; }
      tbody tr:nth-child(even) { background: #f3f6f9; }
      tfoot td { font-weight: 700; background: #e8eef5; }
      .summary { display: flex; gap: 24px; margin-top: 14px; border-top: 1px solid #aeb9c7; padding-top: 10px; }
      .summary strong { display: block; font-size: 13px; margin-top: 2px; }
      .print-note { margin-top: 22px; color: #687588; font-size: 10px; }
    </style></head><body>
      <div class="header"><h1>SHIVANI ENGINEERING</h1><h2>Tax / Item Report</h2><div class="meta">${escapeHtml(filterText)} | Generated: ${escapeHtml(new Date().toLocaleDateString('en-IN'))}</div></div>
      <table><thead><tr>
        <th>#</th><th>DC No. / Date</th><th>Particulars</th><th>HSN</th><th class="number">Total Pieces</th><th class="number">Rate</th><th class="number">Taxable Amount</th><th class="number">GST %</th><th class="number">GST Amount</th><th class="number">Total Amount</th>
      </tr></thead><tbody>${body}</tbody>
      <tfoot><tr><td colspan="4">Report Total</td><td class="number">${summary.totalPieces}</td><td></td><td class="number">₹ ${formatCurrency(summary.totalCost)}</td><td></td><td class="number">₹ ${formatCurrency(summary.totalGst)}</td><td class="number">₹ ${formatCurrency(summary.grandTotal)}</td></tr></tfoot></table>
      <div class="summary"><div>Total DCs<strong>${summary.dcCount}</strong></div><div>Total Pieces<strong>${summary.totalPieces}</strong></div><div>Total GST<strong>₹ ${formatCurrency(summary.totalGst)}</strong></div><div>Grand Total<strong>₹ ${formatCurrency(summary.grandTotal)}</strong></div></div>
      <div class="print-note">This report groups identical particulars, HSN, rate, and GST percentage across the selected invoices.</div>
    </body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener('load', () => printWindow.print());
}

export async function shareInvoice(invoice) {
  const text = invoiceToText(invoice);
  const title = `Invoice ${invoice.invoiceNo}`;
  const url = `${window.location.origin}/invoice/${invoice._id}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text: `${text}\n\n${url}`, url });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title}\n${text}\n${url}`)}`;
  window.open(wa, '_blank', 'noopener,noreferrer');
  return 'whatsapp';
}

export function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

export function calcLineAmount(qty, rate) {
  return Math.round(qty * rate * 100) / 100;
}

export function calcTotals(items, igstPercent = 18) {
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const igstAmount = Math.round(subtotal * (igstPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + igstAmount) * 100) / 100;
  return { subtotal, igstAmount, grandTotal };
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: '2-digit' });
}

function invoiceNumberOnly(value) {
  return String(value || '').replace(/^[^/]+\/\s*/, '');
}

/**
 * Group invoice lines by item, rate, GST, and invoice date so each date has
 * its own quantity and amount row in the printable report.
 */
export function buildItemWiseRows(invoices = []) {
  const map = new Map();

  invoices.forEach((inv) => {
    const pct = inv.igstPercent != null ? inv.igstPercent : 18;
    const invoiceDate = inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : '';
    (inv.items || []).forEach((item) => {
      const name = (item.particulars || '').trim() || 'Unnamed item';
      const rate = Number(item.unitRate || 0);
      const key = `${name.toLowerCase()}|${item.hsnCode || ''}|${rate}|${pct}|${invoiceDate}`;
      const qty = Number(item.quantity || 0);
      const amount = Number(item.amount != null ? item.amount : qty * rate);

      if (!map.has(key)) {
        map.set(key, {
          particulars: name,
          hsnCode: item.hsnCode || '-',
          unitRate: rate,
          gstPercent: pct,
          pieces: 0,
          amount: 0,
          invoiceNumbers: new Set(),
          invoiceDate,
        });
      }
      const row = map.get(key);
      row.pieces += qty;
      row.amount += amount;
      if (inv.invoiceNo || inv.dcNo) row.invoiceNumbers.add(invoiceNumberOnly(inv.invoiceNo || inv.dcNo));
    });
  });

  return Array.from(map.values())
    .map((row) => {
      const amount = Math.round(row.amount * 100) / 100;
      const gstAmount = Math.round(amount * (row.gstPercent / 100) * 100) / 100;
      return {
        ...row,
        invoiceList: Array.from(row.invoiceNumbers).join(', '),
        amount,
        gstAmount,
        total: Math.round((amount + gstAmount) * 100) / 100,
      };
    })
    .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate) || a.particulars.localeCompare(b.particulars));
}

/** Build a clean A4 printable HTML tax report (item-wise) */
export function buildItemReportHtml(invoices = [], filters = {}) {
  const rows = buildItemWiseRows(invoices);
  const esc = (v) =>
    String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const totalPieces = rows.reduce((s, r) => s + r.pieces, 0);
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const totalGst = rows.reduce((s, r) => s + r.gstAmount, 0);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  const period =
    filters.from || filters.to
      ? `${filters.from ? formatDate(filters.from) : 'Beginning'} to ${filters.to ? formatDate(filters.to) : 'Today'}`
      : 'All dates';

  const body = rows
    .reduce((html, r, i) => {
      const previousRow = rows[i - 1];
      const startsDateGroup = !previousRow || previousRow.invoiceDate !== r.invoiceDate;
      const dateInvoices = rows
        .filter((candidate) => candidate.invoiceDate === r.invoiceDate)
        .flatMap((candidate) => candidate.invoiceList.split(', '))
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(', ');
      const groupHeader = startsDateGroup
        ? `<tr class="date-group"><td colspan="10"><strong>Date: ${esc(formatDate(r.invoiceDate))}</strong><span>Invoices: ${esc(dateInvoices)}</span></td></tr>`
        : '';
      return `${html}${groupHeader}<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(r.particulars)}</td>
      <td class="c">${esc(r.hsnCode)}</td>
      <td class="r"><strong>${r.pieces}</strong></td>
      <td class="r">${formatCurrency(r.unitRate)}</td>
      <td class="r">${formatCurrency(r.amount)}</td>
      <td class="c">${r.gstPercent}%</td>
      <td class="r">${formatCurrency(r.gstAmount)}</td>
      <td class="r">${formatCurrency(r.total)}</td>
      <td class="c">${esc(r.invoiceList)}</td>
    </tr>`;
    }, '');

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Item-wise Tax Report</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 16px; }
  @media print { body { padding: 0; } }
  h1 { font-size: 18px; margin: 0; text-align: center; letter-spacing: .5px; }
  h2 { font-size: 13px; margin: 4px 0 0; text-align: center; font-weight: 600; color: #1e40af; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; margin: 10px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #555; padding: 5px 6px; }
  th { background: #eef2ff; text-align: left; }
  .date-group td { background: #dbe7f7; color: #123b68; padding: 7px 6px; }
  .date-group span { float: right; font-weight: 600; }
  td.c, th.c { text-align: center; }
  td.r, th.r { text-align: right; }
  tfoot td { font-weight: bold; background: #f5f5f5; }
  .hr { border-top: 2px solid #1e40af; margin: 8px 0; }
  .note { margin-top: 10px; font-size: 10px; color: #555; }
  @media print { .noprint { display: none; } }
  .noprint { text-align: center; margin: 12px 0; }
  .noprint button { padding: 8px 16px; font-size: 13px; cursor: pointer; }
</style></head>
<body>
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
  <h1>SHIVANI ENGINEERING</h1>
  <h2>Item-wise Tax Report</h2>
  <div class="hr"></div>
  <div class="meta">
    <div><strong>Item filter:</strong> ${esc(filters.item || 'All items')}</div>
    <div><strong>Period:</strong> ${esc(period)}</div>
    <div><strong>Printed:</strong> ${formatDate(new Date())}</div>
  </div>
  <table>
    <thead><tr>
      <th class="c">Sl</th><th>Particulars</th><th class="c">HSN</th><th class="r">Pieces</th>
      <th class="r">Rate</th><th class="r">Amount</th><th class="c">GST %</th>
      <th class="r">GST Amt</th><th class="r">Total</th><th class="c">Invoice No. / Date</th>
    </tr></thead>
    <tbody>${body || '<tr><td colspan="10" class="c">No items found</td></tr>'}</tbody>
    <tfoot><tr>
      <td colspan="3" class="r">TOTAL</td>
      <td class="r">${totalPieces}</td>
      <td></td>
      <td class="r">${formatCurrency(totalAmount)}</td>
      <td></td>
      <td class="r">${formatCurrency(totalGst)}</td>
      <td class="r">${formatCurrency(grandTotal)}</td>
      <td></td>
    </tr></tfoot>
  </table>
  <p class="note">Pieces, amount and GST are totalled per item (same rate &amp; GST grouped together) across ${invoices.length} DC/Invoice(s).</p>
</body></html>`;
}

/** Open printable HTML in a new window and trigger the print dialog */
export function printHtml(html, title = 'Report') {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow pop-ups to print the report.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  w.focus();
  setTimeout(() => w.print(), 400);
}
