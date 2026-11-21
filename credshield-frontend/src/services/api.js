const API_BASE = 'http://localhost:3000/api';

export async function createCustomer({ name, industry, initials }) {
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      industry,
      riskLevel: 'NEW',
      score: null,
      avgDelay: null,
      exposure: 0,
      volume: 0,
      since: new Date().getFullYear().toString(),
      logoText: initials,
      notes: null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create customer');
  }
  return res.json();
}

export async function createInvoice({ buyerName, invoiceNumber, amount, dueDate }) {
  const res = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerName,
      invoiceNumber,
      amount,
      dueDate,
      status: 'Pending',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create invoice');
  }
  return res.json();
}

export async function markInvoicePaid(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Paid' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to mark invoice paid');
  }
  return res.json();
}
