const API = '/api';

export async function fetchCategories() {
  const res = await fetch(`${API}/components/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchComponents(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/components${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch components');
  return res.json();
}

export async function fetchInvoices(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') query.set(k, v);
  });
  const qs = query.toString();
  const res = await fetch(`${API}/invoices${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function fetchInvoiceSummary(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') query.set(k, v);
  });
  const qs = query.toString();
  const res = await fetch(`${API}/invoices/summary${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchNextInvoiceNo(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API}/invoices/next-invoice${query}`);
  if (!res.ok) throw new Error('Failed to fetch next invoice number');
  return res.json();
}

export async function fetchInvoice(id) {
  const res = await fetch(`${API}/invoices/${id}`);
  if (!res.ok) throw new Error('Failed to fetch invoice');
  return res.json();
}

export async function saveInvoice(data) {
  const res = await fetch(`${API}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save invoice');
  return res.json();
}

export async function deleteInvoice(id) {
  const res = await fetch(`${API}/invoices/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete invoice');
  return res.json();
}

export async function addComponent(data) {
  const res = await fetch(`${API}/components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add component');
  return res.json();
}
