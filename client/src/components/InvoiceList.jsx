import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchInvoiceSummary, deleteInvoice, fetchInvoice } from '../api';
import {
  formatCurrency,
  formatDate,
  invoiceToText,
  downloadTextFile,
  buildItemReportHtml,
  printHtml,
  shareInvoice,
} from '../utils';

const EMPTY_SUMMARY = {
  dcCount: 0,
  totalPieces: 0,
  totalCost: 0,
  totalGst: 0,
  grandTotal: 0,
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({ item: '', from: '', to: '' });

  const load = (params = applied) => {
    setLoading(true);
    fetchInvoiceSummary(params)
      .then((data) => {
        setInvoices(data.invoices || []);
        setSummary(data.summary || EMPTY_SUMMARY);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load({ item: '', from: '', to: '' });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = { item: item.trim(), from, to };
    setApplied(next);
    load(next);
  };

  const handleClear = () => {
    setItem('');
    setFrom('');
    setTo('');
    const next = { item: '', from: '', to: '' };
    setApplied(next);
    load(next);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this DC/Invoice?')) return;
    try {
      await deleteInvoice(id);
      load(applied);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownload = async (id, invoiceNo) => {
    try {
      const inv = await fetchInvoice(id);
      const safeName = String(invoiceNo || id).replace(/[^\w.-]+/g, '_');
      downloadTextFile(`Invoice_${safeName}.txt`, invoiceToText(inv));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleShare = async (id) => {
    try {
      const inv = await fetchInvoice(id);
      await shareInvoice(inv);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadReport = () => {
    const html = buildItemReportHtml(invoices, applied);
    printHtml(html, 'Item-wise Tax Report');
  };

  const hasFilter = applied.item || applied.from || applied.to;

  return (
    <div className="invoice-list-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#1e40af' }}>Saved DC / Invoices</h2>
        <Link to="/" className="btn btn-primary">+ New DC</Link>
      </div>

      <form className="tax-search-panel" onSubmit={handleSearch}>
        <h3>Tax / Item Report</h3>
        <p className="tax-search-hint">
          Search e.g. <strong>bar 6</strong> or <strong>bar 4</strong> with a date range to get all matching DCs, pieces, cost and GST.
        </p>
        <div className="tax-search-grid">
          <div className="form-group">
            <label>Item search</label>
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="bar 6"
            />
          </div>
          <div className="form-group">
            <label>From date</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To date</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="tax-search-actions">
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-outline" onClick={handleClear}>Clear</button>
          </div>
        </div>

        {(hasFilter || invoices.length > 0) && (
          <div className="tax-summary">
            <div className="tax-stat">
              <span className="tax-stat-label">Total DCs</span>
              <span className="tax-stat-value">{summary.dcCount}</span>
            </div>
            <div className="tax-stat">
              <span className="tax-stat-label">Total Pieces</span>
              <span className="tax-stat-value">{summary.totalPieces}</span>
            </div>
            <div className="tax-stat">
              <span className="tax-stat-label">Total Cost</span>
              <span className="tax-stat-value">₹ {formatCurrency(summary.totalCost)}</span>
            </div>
            <div className="tax-stat">
              <span className="tax-stat-label">Total GST</span>
              <span className="tax-stat-value">₹ {formatCurrency(summary.totalGst)}</span>
            </div>
            <div className="tax-stat tax-stat-grand">
              <span className="tax-stat-label">Grand Total</span>
              <span className="tax-stat-value">₹ {formatCurrency(summary.grandTotal)}</span>
            </div>
          </div>
        )}

        {invoices.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={handleDownloadReport}>
              Print Item-wise Tax Report
            </button>
          </div>
        )}
      </form>

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <p>{hasFilter ? 'No invoices match this search.' : 'No invoices saved yet.'}</p>
          {!hasFilter && (
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Create your first DC
            </Link>
          )}
        </div>
      ) : (
        invoices.map((inv) => (
            <div key={inv._id} className="invoice-card">
              <div>
                <h3>
                  Invoice No: {inv.invoiceNo}
                  {inv.dcNo ? ` | DC: ${inv.dcNo}` : ''}
                </h3>
                <p>
                  {inv.customerName} | Date: {formatDate(inv.invoiceDate)} |{' '}
                  {inv.items?.length || 0} items | Total: ₹ {formatCurrency(inv.grandTotal)}
                  {inv.igstAmount != null && ` | GST: ₹ ${formatCurrency(inv.igstAmount)}`}
                </p>
              </div>
              <div className="card-actions">
                <Link to={`/invoice/${inv._id}`} className="btn btn-outline">View</Link>
                <button type="button" className="btn btn-outline" onClick={() => handleDownload(inv._id, inv.invoiceNo)}>
                  Download
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleShare(inv._id)}>
                  Share
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(inv._id)}>Delete</button>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
