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
