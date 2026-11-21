import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, X, Search, Trash2, FileText } from 'lucide-react';
import {
  COLORS,
  FONT_DISPLAY,
  FONT_MONO,
  TYPE,
  Card,
  RiskTierBadge,
  AnimatedCounter,
  FadeIn,
  RISK_TIER_COLOR,
} from './ui';

// ─── ScoreRing (80×80 SVG gauge) ────────────────────────────────────────────

function ScoreRing({ score, size = 80 }) {
  const [animOffset, setAnimOffset] = useState(251.33);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const pct = score != null ? Math.min(1, (score - 300) / 700) : 0;
  const offset = circumference - pct * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimOffset(offset), 100);
    return () => clearTimeout(timer);
  }, [offset]);

  let color = COLORS.low;
  if (score >= 800) color = COLORS.high;
  else if (score >= 400) color = COLORS.medium;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={radius} fill="none" stroke={`${COLORS.inkMuted}20`} strokeWidth="5" />
      {score != null && (
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animOffset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      )}
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ ...FONT_MONO, fontSize: 16, fontWeight: 700, fill: score != null ? color : COLORS.inkMuted }}
      >
        {score != null ? score : '—'}
      </text>
    </svg>
  );
}

// ─── Add Buyer Modal ─────────────────────────────────────────────────────────

function AddBuyerModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initials = useMemo(() => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    if (words[0]?.length >= 2) return words[0].substring(0, 2).toUpperCase();
    return '';
  }, [name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), industry: industry.trim(), initials });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ ...FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Onboard Buyer</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} color={COLORS.inkSoft} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Buyer Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Global Dynamics" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Manufacturing" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 }}>Initials</label>
            <div style={{ ...FONT_MONO, fontSize: 18, fontWeight: 700, color: initials ? COLORS.accent : COLORS.inkMuted }}>{initials || '—'}</div>
          </div>
          {error && <p style={{ color: COLORS.high, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create Buyer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

function DeleteModal({ buyerName, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 400, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${COLORS.high}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 size={24} color={COLORS.high} />
        </div>
        <h3 style={{ ...FONT_DISPLAY, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete buyer?</h3>
        <p style={{ ...TYPE.body, color: COLORS.inkSoft, marginBottom: 24 }}>
          This will permanently delete <strong>{buyerName}</strong> and all their invoices.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: `1px solid ${COLORS.border}`, borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '10px 24px', background: COLORS.high, color: COLORS.surface, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ───────────────────────────────────────────────────────────

function DetailDrawer({ customer, invoices, onClose, onUpdateNotes, onDeleteCustomer, onSelectInvoice }) {
  const [notes, setNotes] = useState(customer?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setNotes(customer?.notes || '');
  }, [customer]);

  if (!customer) return null;

  const riskLevel = customer.riskLevel || customer.risk_level || 'NEW';
  const avgDelay = customer.avgDelay || customer.avg_delay;
  const customerInvoices = invoices
    .filter((i) => (i.buyerName || i.buyer_name) === customer.name)
    .slice(0, 5);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onUpdateNotes(customer.id, notes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300 }} onClick={onClose} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`,
        zIndex: 310, overflowY: 'auto', padding: 32,
        transition: 'transform 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ ...FONT_DISPLAY, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{customer.name}</h2>
            <p style={{ ...TYPE.caption, color: COLORS.inkSoft }}>{customer.industry || '—'}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} color={COLORS.inkSoft} /></button>
        </div>

        {/* Score Ring + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <ScoreRing score={customer.score} />
          <div>
            <RiskTierBadge tier={riskLevel} />
            <p style={{ ...TYPE.caption, color: COLORS.inkSoft, marginTop: 6 }}>
              {customer.score != null
                ? `Score ${customer.score}/1000 — higher = more risk`
                : 'No paid invoices yet — cannot score'}
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Volume', value: `₹${Number(customer.volume || 0).toLocaleString('en-IN')}` },
            { label: 'Exposure', value: `₹${Number(customer.exposure || 0).toLocaleString('en-IN')}` },
            { label: 'Avg Delay', value: avgDelay != null ? `${avgDelay} days` : '—' },
            { label: 'Active Invoices', value: customerInvoices.filter((i) => i.status !== 'Paid').length },
          ].map((item) => (
            <div key={item.label} style={{ padding: 14, background: COLORS.bg, borderRadius: 10 }}>
              <p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 4 }}>{item.label}</p>
              <p style={{ ...FONT_MONO, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Invoices */}
        <h4 style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Invoices</h4>
        {customerInvoices.length === 0 ? (
          <p style={{ ...TYPE.caption, color: COLORS.inkMuted, marginBottom: 24 }}>No invoices yet.</p>
        ) : (
          <div style={{ marginBottom: 24 }}>
            {customerInvoices.map((inv) => {
              const statusColor = inv.status === 'Paid' ? COLORS.low : inv.status === 'Overdue' ? COLORS.high : COLORS.medium;
              return (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice && onSelectInvoice(inv.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    borderBottom: `1px solid ${COLORS.inkMuted}15`,
                  }}
                >
                  <div>
                    <span style={{ ...FONT_MONO, fontSize: 13, fontWeight: 600 }}>{inv.invoiceNumber || inv.invoice_number}</span>
                    <span style={{ ...TYPE.caption, color: COLORS.inkMuted, marginLeft: 8 }}>{inv.dueDate || inv.due_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...FONT_MONO, fontSize: 13, fontWeight: 600 }}>₹{Number(inv.amount).toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, padding: '2px 8px', borderRadius: 999, background: `${statusColor}14` }}>{inv.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Analyst Notes */}
        <h4 style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Analyst Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this buyer..."
          rows={4}
          style={{
            width: '100%', padding: 12, border: `1px solid ${COLORS.inkMuted}40`,
            borderRadius: 10, fontSize: 13, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 8,
          }}
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          style={{
            padding: '8px 20px', background: COLORS.accent, color: COLORS.surface,
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', opacity: saving ? 0.6 : 1, marginBottom: 24,
          }}
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </button>

        {/* Delete Button */}
        <div style={{ borderTop: `1px solid ${COLORS.inkMuted}20`, paddingTop: 16 }}>
          <button
            onClick={() => setShowDelete(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', background: `${COLORS.high}10`, color: COLORS.high,
              border: `1px solid ${COLORS.high}30`, borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Trash2 size={14} /> Delete Buyer
          </button>
        </div>
      </div>

      {showDelete && (
        <DeleteModal
          buyerName={customer.name}
          onConfirm={() => { onDeleteCustomer(customer.id); onClose(); }}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

// ─── CustomersView ───────────────────────────────────────────────────────────

export default function CustomersView({
  customers,
  invoices,
  onAddCustomer,
  onUpdateNotes,
  onDeleteCustomer,
  isLoading,
  selectedCustomerName,
  setSelectedCustomerName,
  searchQuery,
  setSearchQuery,
  onSelectInvoice,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const search = localSearch || searchQuery || '';

  // Portfolio stats
  const totalBuyers = customers.length;
  const highRiskCount = customers.filter((c) => (c.riskLevel || c.risk_level) === 'HIGH').length;
  const totalExposure = customers.reduce((sum, c) => sum + Number(c.exposure || 0), 0);
  const scoredCustomers = customers.filter((c) => c.avgDelay != null || c.avg_delay != null);
  const avgDelay = scoredCustomers.length > 0
    ? scoredCustomers.reduce((sum, c) => sum + Number(c.avgDelay || c.avg_delay || 0), 0) / scoredCustomers.length
    : 0;

  // Filter
  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Selected customer for drawer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerName) return null;
    return customers.find((c) => c.name === selectedCustomerName) || null;
  }, [customers, selectedCustomerName]);

  return (
    <div>
      {/* ── Portfolio Overview Cards ── */}
      <FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 20 }}>
            <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>Total Buyers</p>
            <p style={{ ...TYPE.kpiNumber, color: COLORS.ink }}><AnimatedCounter value={totalBuyers} /></p>
          </Card>
          <Card style={{ padding: 20 }}>
            <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>High Risk</p>
            <p style={{ ...TYPE.kpiNumber, color: COLORS.high }}><AnimatedCounter value={highRiskCount} /></p>
          </Card>
          <Card style={{ padding: 20 }}>
            <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>Total Exposure</p>
            <p style={{ ...TYPE.kpiNumber, color: COLORS.ink }}><AnimatedCounter value={totalExposure} prefix="₹" /></p>
          </Card>
          <Card style={{ padding: 20 }}>
            <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 6 }}>Avg Delay</p>
            <p style={{ ...TYPE.kpiNumber, color: COLORS.ink }}><AnimatedCounter value={avgDelay} suffix=" days" decimals={1} /></p>
          </Card>
        </div>
      </FadeIn>

      {/* ── Search & Add ── */}
      <FadeIn delay={0.1}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} color={COLORS.inkMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search buyers..."
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', background: COLORS.accent, color: COLORS.surface,
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Onboard Buyer
          </button>
        </div>
      </FadeIn>

      {/* ── Buyer Table ── */}
      <FadeIn delay={0.15}>
        <Card style={{ overflow: 'hidden' }} interactive={false}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.inkMuted}20` }}>
                {['Buyer Name', 'Industry', 'Risk Level', 'Score', 'Avg Delay', 'Exposure', 'Volume'].map((h) => (
                  <th key={h} style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: 'left', padding: '14px 16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const riskLevel = customer.riskLevel || customer.risk_level || 'NEW';
                const rowColor = RISK_TIER_COLOR[riskLevel] || COLORS.new;
                const delay = customer.avgDelay || customer.avg_delay;

                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomerName(customer.name)}
                    style={{ borderBottom: `1px solid ${COLORS.inkMuted}10`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${rowColor}0D`;
                      e.currentTarget.style.borderLeft = `3px solid ${rowColor}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeft = '3px solid transparent';
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: `${rowColor}14`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: rowColor,
                        }}>
                          {customer.logoText || customer.logo_text || '??'}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{customer.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', ...TYPE.body, color: COLORS.inkSoft }}>{customer.industry || '—'}</td>
                    <td style={{ padding: '14px 16px' }}><RiskTierBadge tier={riskLevel} compact /></td>
                    <td style={{ padding: '14px 16px', ...FONT_MONO, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{customer.score ?? '—'}</td>
                    <td style={{ padding: '14px 16px', ...FONT_MONO, fontSize: 13, color: COLORS.ink }}>{delay != null ? `${delay} days` : '—'}</td>
                    <td style={{ padding: '14px 16px', ...FONT_MONO, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>₹{Number(customer.exposure || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px', ...FONT_MONO, fontSize: 13, color: COLORS.inkSoft }}>₹{Number(customer.volume || 0).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: COLORS.inkMuted }}>
                    No buyers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </FadeIn>

      {/* ── Modals & Drawer ── */}
      {showAddModal && (
        <AddBuyerModal
          onClose={() => setShowAddModal(false)}
          onSubmit={onAddCustomer}
        />
      )}

      {selectedCustomer && (
        <DetailDrawer
          customer={selectedCustomer}
          invoices={invoices}
          onClose={() => setSelectedCustomerName(null)}
          onUpdateNotes={onUpdateNotes}
          onDeleteCustomer={onDeleteCustomer}
          onSelectInvoice={onSelectInvoice}
        />
      )}
    </div>
  );
}
