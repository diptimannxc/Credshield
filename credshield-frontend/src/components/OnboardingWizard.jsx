import { useState, useCallback } from 'react';
import { Plus, ArrowRight, ArrowLeft, X, SkipForward } from 'lucide-react';
import { COLORS, FONT_DISPLAY, FONT_MONO, TYPE, Card } from './ui';
import { createCustomer, createInvoice } from '../services/api';

const STEPS = ['buyer', 'invoice', 'done'];

export default function OnboardingWizard({ onComplete, onSkip, onBack }) {
  const [step, setStep] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [industry, setIndustry] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`#INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBuyer, setCreatedBuyer] = useState(null);

  const initials = (() => {
    const words = buyerName.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    if (words[0]?.length >= 2) return words[0].substring(0, 2).toUpperCase();
    return '';
  })();

  const handleCreateBuyer = async () => {
    if (!buyerName.trim()) { setError('Buyer name is required'); return; }
    setLoading(true); setError('');
    try {
      const buyer = await createCustomer({ name: buyerName.trim(), industry: industry.trim(), initials });
      setCreatedBuyer(buyer);
      setStep(1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreateInvoice = async () => {
    if (!amount || !dueDate) { setError('Amount and due date are required'); return; }
    setLoading(true); setError('');
    try {
      await createInvoice({ buyerName: buyerName.trim(), invoiceNumber, amount: parseFloat(amount), dueDate });
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: `1px solid ${COLORS.inkMuted}40`,
    borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = { ...TYPE.caption, color: COLORS.inkSoft, display: 'block', marginBottom: 6, fontWeight: 600 };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: COLORS.bg, fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520, padding: '0 24px' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              width: 40, height: 4, borderRadius: 2,
              background: i <= step ? COLORS.accent : `${COLORS.inkMuted}30`,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <Card style={{ padding: 40 }} interactive={false}>
          {/* Step 0: Buyer */}
          {step === 0 && (
            <>
              <h2 style={{ ...FONT_DISPLAY, fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                Onboard your first buyer
              </h2>
              <p style={{ ...TYPE.body, color: COLORS.inkSoft, textAlign: 'center', marginBottom: 28 }}>
                Who's the buyer you want to monitor?
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Buyer Name *</label>
                <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="e.g. Global Dynamics" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Industry</label>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Manufacturing" style={inputStyle} />
              </div>
              {initials && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${COLORS.accent}14`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...FONT_MONO, fontSize: 16, fontWeight: 700, color: COLORS.accent }}>
                    {initials}
                  </div>
                </div>
              )}
              {error && <p style={{ color: COLORS.high, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onBack} style={{ flex: 1, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={onSkip} style={{ flex: 1, padding: 12, border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 12, background: 'transparent', color: COLORS.inkSoft, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <SkipForward size={16} /> Skip
                </button>
                <button onClick={handleCreateBuyer} disabled={loading} style={{ flex: 2, padding: 12, background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 1: Invoice */}
          {step === 1 && (
            <>
              <h2 style={{ ...FONT_DISPLAY, fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                Add their first invoice
              </h2>
              <p style={{ ...TYPE.body, color: COLORS.inkSoft, textAlign: 'center', marginBottom: 28 }}>
                Create a sample invoice for <strong>{buyerName}</strong>
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Invoice Number</label>
                <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={{ ...inputStyle, ...FONT_MONO }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Amount (₹) *</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Due Date *</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
              </div>
              {error && <p style={{ color: COLORS.high, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setStep(0); setError(''); }} style={{ flex: 1, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
                  Back
                </button>
                <button onClick={() => onComplete(buyerName)} style={{ flex: 1, padding: 12, border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 12, background: 'transparent', color: COLORS.inkSoft, cursor: 'pointer', fontSize: 14 }}>
                  Skip
                </button>
                <button onClick={handleCreateInvoice} disabled={loading} style={{ flex: 2, padding: 12, background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  Create <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${COLORS.accent}14`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>🎉</span>
              </div>
              <h2 style={{ ...FONT_DISPLAY, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>You're all set!</h2>
              <p style={{ ...TYPE.body, color: COLORS.inkSoft, marginBottom: 24, lineHeight: 1.6 }}>
                <strong>{buyerName}</strong> has been onboarded with their first invoice.
                Head to Risk Analysis to see their prediction.
              </p>
              <button onClick={() => onComplete(buyerName)} style={{ padding: '14px 32px', background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                See Risk Analysis <ArrowRight size={18} />
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
