import { useEffect, useState } from 'react';
import { fetchInvoices, updateInvoice, markInvoicesReceivedBetween } from '../api';
import { formatCurrency, formatDate } from '../utils';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function invoiceNumber(value) {
  return String(value || '').replace(/^[^/]+\/\s*/, '');
}

function buildPaymentReportHtml(invoices) {
  const paid = invoices.filter((invoice) => invoice.paymentReceived);
  const paidAmount = paid.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
  const pendingAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0) - paidAmount;
  const rows = invoices.map((invoice, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(invoiceNumber(invoice.invoiceNo))}</td>
      <td>${escapeHtml(formatDate(invoice.invoiceDate))}</td>
      <td>${escapeHtml(invoice.dcNo || '-')}</td>
      <td>${escapeHtml(invoice.customerName)}</td>
      <td class="amount">₹ ${formatCurrency(invoice.grandTotal)}</td>
      <td>${invoice.paymentReceivedDate ? escapeHtml(formatDate(invoice.paymentReceivedDate)) : '-'}</td>
      <td class="status ${invoice.paymentReceived ? 'paid' : 'pending'}">${invoice.paymentReceived ? 'Received' : 'Not received'}</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Payment Advice</title><style>
    @page { size: A4 landscape; margin: 12mm; } * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #172033; margin: 0; font-size: 11px; }
    h1 { margin: 0 0 3px; color: #123b68; font-size: 20px; } h2 { margin: 0; font-size: 15px; }
    .header { border-bottom: 2px solid #123b68; padding-bottom: 9px; margin-bottom: 12px; }
    .meta { color: #526174; margin-top: 5px; } table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #123b68; color: white; } th, td { border: 1px solid #aeb9c7; padding: 6px; text-align: left; }
    .amount { text-align: right; white-space: nowrap; } .status { font-weight: 700; } .paid { color: #087443; } .pending { color: #b42318; }
    .summary { display: flex; gap: 28px; border-top: 1px solid #aeb9c7; margin-top: 14px; padding-top: 10px; }
    .summary strong { display: block; font-size: 13px; margin-top: 2px; }
  </style></head><body>
    <div class="header"><h1>SHIVANI ENGINEERING</h1><h2>Tax Invoice Payment Statement</h2><div class="meta">Prepared on ${escapeHtml(formatDate(new Date()))}</div></div>
    <table><thead><tr><th>#</th><th>Invoice No.</th><th>Invoice Date</th><th>DC No.</th><th>Customer</th><th>Amount</th><th>Payment Received Date</th><th>Payment Status</th></tr></thead><tbody>${rows || '<tr><td colspan="8">No invoices found</td></tr>'}</tbody></table>
    <div class="summary"><div>Total invoices<strong>${invoices.length}</strong></div><div>Received<strong>₹ ${formatCurrency(paidAmount)}</strong></div><div>Pending<strong>₹ ${formatCurrency(pendingAmount)}</strong></div></div>
  </body></html>`;
}

function openPrintReport(html, title = 'Payment Statement') {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) throw new Error('Please allow pop-ups to print the payment report.');
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.document.title = title;
  reportWindow.focus();
  setTimeout(() => reportWindow.print(), 300);
}

export default function PaymentTracking() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [rangeUpdating, setRangeUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRangeReceived = async () => {
    if (!fromDate || !toDate || !receivedDate) {
      setError('Choose From, To, and Payment Received dates.');
      return;
    }
    if (fromDate > toDate) {
      setError('From date must be before To date.');
      return;
    }
    if (!confirm(`Mark invoices from ${formatDate(fromDate)} to ${formatDate(toDate)} as received on ${formatDate(receivedDate)}?`)) return;
    setRangeUpdating(true);
    setError('');
    try {
      await markInvoicesReceivedBetween(fromDate, toDate, receivedDate);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRangeUpdating(false);
    }
  };

  const handleStatusChange = async (invoice, received) => {
    if (received && !receivedDate) {
      setError('Choose a Payment Received date before checking an invoice.');
      return;
    }
    setSavingId(invoice._id);
    setError('');
    try {
      const updated = await updateInvoice(invoice._id, {
        paymentReceived: received,
        paymentReceivedDate: received ? receivedDate : null,
      });
      setInvoices((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const paid = invoices.filter((invoice) => invoice.paymentReceived);
  const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
  const receivedAmount = paid.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
  const reportHtml = buildPaymentReportHtml(invoices);

  return (
    <div className="payment-page">
      <div className="payment-page-header no-print">
        <div><h2>Payment Tracking</h2><p>Select an invoice date range from the payment advice and mark that range as received.</p></div>
        <div className="payment-actions"><button type="button" className="btn btn-outline" onClick={() => openPrintReport(reportHtml, 'Tax Invoice Payment Statement')}>Print Statement</button><button type="button" className="btn btn-primary" onClick={() => openPrintReport(reportHtml, 'Tax Invoice Payment Statement PDF')}>Download PDF</button></div>
      </div>
      {error && <p className="payment-error no-print">{error}</p>}
      <div className="payment-range-panel no-print">
        <strong>Mark payment received for invoice date range</strong>
        <label>From <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label>To <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        <label>Payment received on <input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} /></label>
        <button type="button" className="btn btn-success" disabled={rangeUpdating} onClick={handleRangeReceived}>{rangeUpdating ? 'Updating...' : 'Mark range received'}</button>
      </div>
      <div className="payment-summary">
        <div className="payment-stat"><span>Total Invoices</span><strong>{invoices.length}</strong></div>
        <div className="payment-stat payment-stat-received"><span>Received</span><strong>{paid.length} | ₹ {formatCurrency(receivedAmount)}</strong></div>
        <div className="payment-stat payment-stat-pending"><span>Pending</span><strong>{invoices.length - paid.length} | ₹ {formatCurrency(totalAmount - receivedAmount)}</strong></div>
      </div>
      {loading ? <p className="empty-state">Loading payment records...</p> : invoices.length === 0 ? <p className="empty-state">No saved invoices found.</p> : (
        <div className="payment-table-wrap"><table className="payment-table"><thead><tr><th className="check-column">Received</th><th>#</th><th>Invoice No.</th><th>Invoice Date</th><th>DC No.</th><th>Customer</th><th>Amount</th><th>Payment Received Date</th></tr></thead><tbody>
          {invoices.map((invoice, index) => <tr key={invoice._id} className={invoice.paymentReceived ? 'payment-row-received' : ''}>
            <td className="check-column"><input type="checkbox" checked={Boolean(invoice.paymentReceived)} disabled={savingId === invoice._id} onChange={(event) => handleStatusChange(invoice, event.target.checked)} /></td>
            <td>{index + 1}</td><td className="invoice-number">{invoiceNumber(invoice.invoiceNo)}</td><td>{formatDate(invoice.invoiceDate)}</td><td>{invoice.dcNo || '-'}</td><td>{invoice.customerName}</td><td className="amount-cell">₹ {formatCurrency(invoice.grandTotal)}</td><td>{invoice.paymentReceivedDate ? formatDate(invoice.paymentReceivedDate) : '-'}</td>
          </tr>)}
        </tbody></table></div>
      )}
    </div>
  );
}
