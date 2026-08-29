import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInvoice } from '../api';
import { reportsForInvoice } from '../reportSpecs';
import InspectionReport from './InspectionReport';
import '../reports.css';

function toDateInput(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : d.toISOString().slice(0, 10);
}

function printReports() {
  const prev = document.title;
  document.title = ' ';
  const restore = () => {
    document.title = prev;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

/**
 * /reports/:id — prints one Final Inspection Report per item of a saved
 * Tax Invoice, so the invoice and the reports always stay in sync.
 */
export default function InspectionReports() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState(10);
  const [meta, setMeta] = useState({
    customer: '',
    dcNo: '',
    date: toDateInput(),
    lotSize: '',
    sampleSize: "10 No's",
    issueNo: '-',
  });

  useEffect(() => {
    fetchInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        setMeta((m) => ({
          ...m,
          customer: inv.customerName || '',
          dcNo: inv.dcNo || inv.invoiceNo || '',
          date: toDateInput(inv.dcDate || inv.invoiceDate),
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const reports = useMemo(() => reportsForInvoice(invoice), [invoice]);

  if (loading) return <p className="empty-state">Loading reports...</p>;
  if (!invoice) return <p className="empty-state">Invoice not found</p>;

  return (
    <div>
      <div className="report-toolbar no-print">
        <Link to={`/invoice/${id}`} className="btn btn-outline">← Back to Invoice</Link>
        <Link to="/invoices" className="btn btn-outline">Saved Invoices</Link>
        <button type="button" className="btn btn-primary" onClick={printReports}>
          Print {reports.length} Report{reports.length === 1 ? '' : 's'} (A4 Landscape)
        </button>
      </div>

      <div className="report-controls no-print">
        {[
          ['customer', 'Customer'],
          ['dcNo', 'D.C. No'],
          ['date', 'Date'],
          ['lotSize', 'Lot Size'],
          ['sampleSize', 'Sample Size'],
          ['issueNo', 'Issue No'],
        ].map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`rep-${key}`}>{label}</label>
            <input
              id={`rep-${key}`}
              value={meta[key]}
              onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div>
          <label htmlFor="rep-obs">Observation columns (1-10)</label>
          <input
            id="rep-obs"
            type="number"
            min="1"
            max="10"
            value={observations}
            onChange={(e) => setObservations(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="report-stack">
        {reports.map((report) => (
          <InspectionReport
            key={report.key}
            report={report}
            meta={{ ...meta, lotSize: meta.lotSize || `${report.quantity} No's` }}
            observations={observations}
          />
        ))}
        {reports.length === 0 && (
          <p className="empty-state">This invoice has no items, so there is nothing to inspect.</p>
        )}
      </div>
    </div>
  );
}
