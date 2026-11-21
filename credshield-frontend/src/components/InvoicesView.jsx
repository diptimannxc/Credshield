import { useState, useMemo, useCallback } from 'react';
import { Plus, X, Search, Trash2, Check, Upload, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS, FONT_DISPLAY, FONT_MONO, TYPE, Card, FadeIn, AnimatedCounter, RISK_TIER_COLOR } from './ui';

function StatusBadge({ status }) {
  const color = status === 'Paid' ? COLORS.low : status === 'Overdue' ? COLORS.high : COLORS.medium;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: `${color}14`, fontSize: 12, fontWeight: 600, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {status}
    </span>
  );
}

function RiskBar({ probability }) {
  const pct = Number(probability) || 0;
  let color = COLORS.low;
  if (pct >= 70) color = COLORS.high;
  else if (pct >= 40) color = COLORS.medium;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, background: `${COLORS.inkMuted}15`, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ ...FONT_MONO, fontSize: 11, fontWeight: 600, color, minWidth: 30 }}>{pct}%</span>
    </div>
  );
}

function AddInvoiceModal({ customers, onClose, onSubmit }) {
  const [invoiceNumber, setInvoiceNumber] = useState(`#INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [buyerName, setBuyerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buyerName || !amount || !dueDate) { setError('All fields required'); return; }
    setLoading(true);
    try {
      await onSubmit({ buyerName, invoiceNumber, amount: parseFloat(amount), dueDate });
      onClose();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ ...FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Add Invoice</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Invoice #</label>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', ...FONT_MONO }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Buyer *</label>
            <select value={buyerName} onChange={(e) => setBuyerName(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: COLORS.surface }}>
              <option value="">Select buyer...</option>
              {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Amount (₹) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Due Date *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <p style={{ color: COLORS.high, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CsvUploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const r = await onUpload(file);
      setResult(r);
    } catch (err) { setResult({ error: err.message }); } finally { setUploading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ ...FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Upload CSV</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {!result ? (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('csv-modal-input')?.click()}
              style={{
                border: `2px dashed ${dragOver ? COLORS.accent : COLORS.inkMuted}40`, borderRadius: 12,
                padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 20,
                background: dragOver ? `${COLORS.accent}08` : 'transparent',
              }}
            >
              <Upload size={32} color={COLORS.inkMuted} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: COLORS.inkSoft }}>{file ? file.name : 'Drop CSV here or click to browse'}</p>
              <input id="csv-modal-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0])} />
            </div>
            <button onClick={handleUpload} disabled={!file || uploading} style={{ width: '100%', padding: 12, background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: !file || uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {result.error ? (
              <p style={{ color: COLORS.high, fontSize: 14 }}>Error: {result.error}</p>
            ) : (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.low, marginBottom: 8 }}>Uploaded successfully!</p>
                <p style={{ fontSize: 14, color: COLORS.inkSoft }}>{result.inserted} invoices inserted, {result.skipped?.length || 0} skipped</p>
              </>
            )}
            <button onClick={onClose} style={{ marginTop: 16, padding: '10px 24px', background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesView({ invoices, customers, onAddInvoice, onMarkPaid, onDeleteInvoice, onFileUpload, isLoading, searchQuery, setSearchQuery, onSelectCustomer }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const perPage = 10;

  const search = localSearch || searchQuery || '';

  const totalInvoices = invoices.length;
  const pendingCount = invoices.filter((i) => i.status === 'Pending').length;
  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;
  const overdueAmount = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + Number(i.amount), 0);

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== 'All') list = list.filter((i) => i.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => (i.invoiceNumber || i.invoice_number || '').toLowerCase().includes(q) || (i.buyerName || i.buyer_name || '').toLowerCase().includes(q));
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (sortKey === 'amount') { va = Number(va); vb = Number(vb); }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [invoices, statusFilter, search, sortKey, sortDir]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  return (
    <div>
      <FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 20 }}><p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>Total Invoices</p><p style={TYPE.kpiNumber}><AnimatedCounter value={totalInvoices} /></p></Card>
          <Card style={{ padding: 20 }}><p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>Pending</p><p style={{ ...TYPE.kpiNumber, color: COLORS.medium }}><AnimatedCounter value={pendingCount} /></p></Card>
          <Card style={{ padding: 20 }}><p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>Overdue</p><p style={{ ...TYPE.kpiNumber, color: COLORS.high }}><AnimatedCounter value={overdueCount} /></p><p style={{ ...TYPE.caption, color: COLORS.inkMuted, marginTop: 4 }}>₹{overdueAmount.toLocaleString('en-IN')}</p></Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Pending', 'Paid', 'Overdue'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }} style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${statusFilter === s ? COLORS.accent : COLORS.inkMuted}40`,
                background: statusFilter === s ? `${COLORS.accent}10` : 'transparent', color: statusFilter === s ? COLORS.accent : COLORS.inkSoft,
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color={COLORS.inkMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={localSearch} onChange={(e) => { setLocalSearch(e.target.value); setPage(0); }} placeholder="Search..." style={{ padding: '8px 12px 8px 32px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 13, outline: 'none', width: 200 }} />
            </div>
            <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', border: `1px solid ${COLORS.accent}`, borderRadius: 10, background: 'transparent', color: COLORS.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Upload size={14} /> CSV</button>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Plus size={14} /> Add</button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card interactive={false} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.inkMuted}20` }}>
                <th onClick={() => toggleSort('invoiceNumber')} style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'left', padding: '14px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Invoice # <SortIcon col="invoiceNumber" /></th>
                <th style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'left', padding: '14px 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Buyer</th>
                <th onClick={() => toggleSort('amount')} style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'right', padding: '14px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount <SortIcon col="amount" /></th>
                <th style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'left', padding: '14px 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due Date</th>
                <th style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'left', padding: '14px 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'left', padding: '14px 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delay Risk</th>
                <th style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'right', padding: '14px 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pred. Delay</th>
                <th style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'center', padding: '14px 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${COLORS.inkMuted}10` }}>
                  <td style={{ padding: '12px', ...FONT_MONO, fontSize: 13, fontWeight: 600 }}>{inv.invoiceNumber || inv.invoice_number}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => onSelectCustomer && onSelectCustomer(inv.buyerName || inv.buyer_name)} style={{ border: 'none', background: 'transparent', color: COLORS.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>{inv.buyerName || inv.buyer_name}</button>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', ...FONT_MONO, fontSize: 13, fontWeight: 600 }}>₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: COLORS.inkSoft }}>{inv.dueDate || inv.due_date}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '12px' }}><RiskBar probability={inv.delayProbability || inv.delay_probability || 0} /></td>
                  <td style={{ padding: '12px', textAlign: 'right', ...FONT_MONO, fontSize: 13 }}>{inv.predictedDelay || inv.predicted_delay || 0} days</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {inv.status !== 'Paid' && (
                        <button onClick={() => onMarkPaid(inv.id)} title="Mark Paid" style={{ padding: '4px 8px', border: `1px solid ${COLORS.low}40`, borderRadius: 6, background: `${COLORS.low}10`, cursor: 'pointer' }}>
                          <Check size={14} color={COLORS.low} />
                        </button>
                      )}
                      {confirmDelete === inv.id ? (
                        <button onClick={() => { onDeleteInvoice(inv.id); setConfirmDelete(null); }} style={{ padding: '4px 10px', background: COLORS.high, color: COLORS.surface, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
                      ) : (
                        <button onClick={() => setConfirmDelete(inv.id)} title="Delete" style={{ padding: '4px 8px', border: `1px solid ${COLORS.high}40`, borderRadius: 6, background: `${COLORS.high}10`, cursor: 'pointer' }}>
                          <Trash2 size={14} color={COLORS.high} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: COLORS.inkMuted }}>No invoices found.</td></tr>}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${COLORS.inkMuted}15` }}>
              <span style={{ ...TYPE.caption, color: COLORS.inkSoft }}>Page {page + 1} of {totalPages} ({filtered.length} results)</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ padding: '6px 12px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 8, background: 'transparent', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: 13 }}><ChevronLeft size={14} /> Prev</button>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} style={{ padding: '6px 12px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 8, background: 'transparent', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: 13 }}>Next <ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

      {showAdd && <AddInvoiceModal customers={customers} onClose={() => setShowAdd(false)} onSubmit={onAddInvoice} />}
      {showUpload && <CsvUploadModal onClose={() => setShowUpload(false)} onUpload={onFileUpload} />}
    </div>
  );
}
