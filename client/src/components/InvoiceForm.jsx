import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ComponentPanel from './ComponentPanel';
import { saveInvoice, fetchNextInvoiceNo } from '../api';
import { calcLineAmount, calcTotals, numberToWords, formatCurrency } from '../utils';

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

const PO_STORAGE_KEY = 'shivani-engineering-po-details';

function getSavedPoDetails() {
  try {
    return JSON.parse(localStorage.getItem(PO_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const emptyItem = () => ({
  id: crypto.randomUUID(),
  componentId: null,
  particulars: '',
  hsnCode: '',
  quantity: 0,
  unitRate: 0,
  amount: 0,
});

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => {
    const savedPo = getSavedPoDetails();
    return {
      invoiceNo: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      customerName: 'CADM TOOLS & COMPONENTS PVT LTD UNIT II',
      customerAddress: 'III/A1 Industrial Area Bommasandra Bengaluru',
      customerGstin: '29AAHCC7543C1ZN',
      poNo: savedPo.poNo || '',
      poDate: savedPo.poDate || '',
      dcNo: '',
      dcDate: '',
      vendorCode: '',
      vehicleNo: '',
      igstPercent: 18,
    };
  });

  const [items, setItems] = useState([]);

  const loadNextInvoiceNo = useCallback((date) => {
    fetchNextInvoiceNo(date)
      .then(({ invoiceNo }) => {
        setForm((prev) => ({ ...prev, invoiceNo }));
      })
      .catch(console.error);
  }, []);

  const updatePoDetails = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const savedPo = getSavedPoDetails();
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify({ ...savedPo, [field]: value }));
  };

  useEffect(() => {
    loadNextInvoiceNo(form.invoiceDate);
    // only on mount — date changes handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateItem = useCallback((id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitRate') {
          updated.amount = calcLineAmount(
            Number(updated.quantity) || 0,
            Number(updated.unitRate) || 0
          );
        }
        return updated;
      })
    );
  }, []);

  const addComponentToItems = (component, quantity) => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        componentId: component._id,
        particulars: component.particulars,
        hsnCode: component.hsnCode,
        quantity,
        unitRate: component.unitRate,
        amount: calcLineAmount(quantity, component.unitRate),
      },
    ]);
    showToast(`Added ${component.name} x ${quantity}`);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addEmptyRow = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const { subtotal, igstAmount, grandTotal } = calcTotals(items, form.igstPercent);
  const amountInWords = numberToWords(grandTotal);

  const handleSave = async () => {
    if (!form.invoiceNo || !form.customerName) {
      showToast('Invoice No and Customer Name are required', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Add at least one item', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        invoiceDate: form.invoiceDate,
        poDate: form.poDate || undefined,
        dcDate: form.dcDate || undefined,
        items: items.map((item, idx) => ({
          slNo: idx + 1,
          componentId: item.componentId,
          particulars: item.particulars,
          hsnCode: item.hsnCode,
          quantity: Number(item.quantity),
          unitRate: Number(item.unitRate),
          amount: item.amount,
        })),
        subtotal,
        igstAmount,
        grandTotal,
        amountInWords,
      };

      const saved = await saveInvoice(payload);
      showToast('DC saved successfully!');
      setTimeout(() => navigate(`/invoice/${saved._id}`), 800);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const prev = document.title;
    document.title = ' ';
    const restore = () => {
      document.title = prev;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  const selectedIds = items.map((i) => i.componentId).filter(Boolean);

  return (
    <div className="main-layout">
      <ComponentPanel onAddItem={addComponentToItems} selectedIds={selectedIds} />

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
          <div className="form-group party-to">
            <label>To M/s</label>
            <textarea
              rows={4}
              value={form.customerName + (form.customerAddress ? '\n' + form.customerAddress : '')}
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                setForm({ ...form, customerName: lines[0], customerAddress: lines.slice(1).join('\n') });
              }}
            />
          </div>
          <div className="party-meta">
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
              <div className="form-group">
                <label>Invoice No</label>
                <input
                  value={form.invoiceNo}
                  onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                  placeholder="26-27/200"
                  title="Auto-increments (e.g. 26-27/200) — you can edit"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => {
                    const invoiceDate = e.target.value;
                    setForm((prev) => ({ ...prev, invoiceDate }));
                    loadNextInvoiceNo(invoiceDate);
                  }}
                />
              </div>
              <div className="form-group">
                <label>P.O. No</label>
                <input value={form.poNo} onChange={(e) => updatePoDetails('poNo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>P.O. Date</label>
                <input type="date" value={form.poDate} onChange={(e) => updatePoDetails('poDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Your D.C. No</label>
                <input value={form.dcNo} onChange={(e) => setForm({ ...form, dcNo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>D.C. Date</label>
                <input type="date" value={form.dcDate} onChange={(e) => setForm({ ...form, dcDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>GST TIN</label>
                <input value={form.customerGstin} onChange={(e) => setForm({ ...form, customerGstin: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vendor Code</label>
                <input value={form.vendorCode} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Vehicle No</label>
                <input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Sl.</th>
              <th>Particulars</th>
              <th style={{ width: '100px' }}>HSN/SAC</th>
              <th style={{ width: '80px' }}>Qty</th>
              <th style={{ width: '90px' }}>Rate</th>
              <th style={{ width: '100px' }}>Amount</th>
              <th className="no-print" style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>
                  <input
                    value={item.particulars}
                    onChange={(e) => updateItem(item.id, 'particulars', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.hsnCode}
                    onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="qty-input"
                    type="number"
                    min="0"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitRate || ''}
                    onChange={(e) => updateItem(item.id, 'unitRate', e.target.value)}
                  />
                </td>
                <td className="amount-cell">{formatCurrency(item.amount)}</td>
                <td className="no-print">
                  <button type="button" className="btn btn-danger" onClick={() => removeItem(item.id)}>×</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                  Select a component from the left panel (e.g. BAR 32x48) and click "Add to DC"
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="add-row-section no-print">
          <button type="button" className="btn btn-outline" onClick={addEmptyRow}>+ Add Manual Row</button>
        </div>

        <div className="totals-section">
          <table className="totals-table">
            <tbody>
              <tr>
                <td>TOTAL</td>
                <td>{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td>
                  IGST @{' '}
                  <input
                    type="number"
                    value={form.igstPercent}
                    onChange={(e) => setForm({ ...form, igstPercent: Number(e.target.value) })}
                    style={{ width: '40px', border: 'none', background: 'transparent', fontWeight: 600 }}
                    className="no-print"
                  />
                  <span className="print-only">{form.igstPercent}</span>%
                </td>
                <td>{formatCurrency(igstAmount)}</td>
              </tr>
              <tr className="grand-total">
                <td>GRAND TOTAL</td>
                <td>{formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="amount-words">
          <strong>Total Amount (in words):</strong> {amountInWords}
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

        <div className="actions no-print">
          <button type="button" className="btn btn-success" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save DC to Database'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>Print Invoice</button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
