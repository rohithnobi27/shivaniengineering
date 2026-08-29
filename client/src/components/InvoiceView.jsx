import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInvoice } from '../api';
import {
  formatCurrency,
  formatDate,
  invoiceToText,
  downloadTextFile,
  shareInvoice,
} from '../utils';

const COMPANY = {
  name: 'SHIVANI ENGINEERING',
  address: 'No.8A/10 B, B. Schedule, 3rd Phase, Sidco Ind. Estate, HOSUR - 635 126.',
  gstin: '33APKPA2477C1ZC',
  stateCode: '33',
  mobile: '9524514514, 9698414514',
  bank: 'UNION BANK OF INDIA, Hosur Branch',
  account: '620901010050263',
  ifsc: 'UBIN0562092',
};

function printInvoice() {
  const prev = document.title;
  document.title = ' ';
  const restore = () => {
    document.title = prev;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice(id)
      .then(setInvoice)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="empty-state">Loading...</p>;
  if (!invoice) return <p className="empty-state">Invoice not found</p>;

  const handleDownload = () => {
    const safeName = String(invoice.invoiceNo || id).replace(/[^\w.-]+/g, '_');
    downloadTextFile(`Invoice_${safeName}.txt`, invoiceToText(invoice));
  };

  const handleShare = async () => {
    await shareInvoice(invoice);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <div className="actions no-print" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Link to="/invoices" className="btn btn-outline">← Back to List</Link>
        <button type="button" className="btn btn-primary" onClick={printInvoice}>Print / PDF</button>
        <button type="button" className="btn btn-outline" onClick={handleDownload}>Download</button>
        <button type="button" className="btn btn-primary" onClick={handleShare}>Share</button>
        <Link to={`/reports/${id}`} className="btn btn-success">Inspection Reports</Link>
      </div>

      <div className="invoice-paper">
        <div className="invoice-header">
          <div className="company-name">{COMPANY.name}</div>
          <div className="company-details">
            {COMPANY.address}<br />
            GSTIN: {COMPANY.gstin} | State Code: {COMPANY.stateCode}<br />
            Mobile: {COMPANY.mobile}
          </div>
          <div className="invoice-title">TAX INVOICE</div>
        </div>

        <div className="party-grid">
          <div className="party-to">
            <strong>To M/s</strong>
            <p>{invoice.customerName}</p>
            {invoice.customerAddress && <p style={{ whiteSpace: 'pre-line' }}>{invoice.customerAddress}</p>}
          </div>
          <div className="party-meta view-meta">
            <p><strong>Invoice No:</strong> {invoice.invoiceNo}</p>
            <p><strong>Date:</strong> {formatDate(invoice.invoiceDate)}</p>
            {invoice.poNo && <p><strong>P.O. No:</strong> {invoice.poNo}</p>}
            {invoice.poDate && <p><strong>P.O. Date:</strong> {formatDate(invoice.poDate)}</p>}
            {invoice.dcNo && <p><strong>D.C. No:</strong> {invoice.dcNo}</p>}
            {invoice.dcDate && <p><strong>D.C. Date:</strong> {formatDate(invoice.dcDate)}</p>}
            {invoice.customerGstin && <p><strong>GST TIN:</strong> {invoice.customerGstin}</p>}
            {invoice.vehicleNo && <p><strong>Vehicle No:</strong> {invoice.vehicleNo}</p>}
          </div>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Particulars</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.slNo}>
                <td>{item.slNo}</td>
                <td>{item.particulars}</td>
                <td>{item.hsnCode}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitRate)}</td>
                <td className="amount-cell">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals-section">
          <table className="totals-table">
            <tbody>
              <tr>
                <td>TOTAL</td>
                <td>{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td>IGST @ {invoice.igstPercent}%</td>
                <td>{formatCurrency(invoice.igstAmount)}</td>
              </tr>
              <tr className="grand-total">
                <td>GRAND TOTAL</td>
                <td>{formatCurrency(invoice.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="amount-words">
          <strong>Total Amount (in words):</strong> {invoice.amountInWords}
        </div>

        <div className="bank-details">
          <strong>Bank Details:</strong> {COMPANY.bank} | A/c No: {COMPANY.account} | IFSC: {COMPANY.ifsc}
        </div>

        <div className="signature-section">
          <div className="signature-block">
            <p className="signature-label">Customer Signature</p>
            <div className="signature-line" />
          </div>
          <div className="signature-block signature-right">
            <p className="signature-for">For {COMPANY.name}</p>
            <div className="signature-line" />
            <p className="signature-label">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
