import { useMemo } from 'react';
import { Printer, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { COLORS, FONT_DISPLAY, FONT_MONO, TYPE, Card, FadeIn, AnimatedCounter, RiskTierBadge, RISK_TIER_COLOR } from './ui';

export default function ReportsView({ customers, invoices }) {
  const scoredCustomers = useMemo(() => customers.filter((c) => c.score != null), [customers]);

  // Risk Exposure Index
  const riskExposureIndex = useMemo(() => {
    const weights = { HIGH: 3, MEDIUM: 2, LOW: 1, NEW: 0 };
    const total = scoredCustomers.reduce((sum, c) => {
      const rl = c.riskLevel || c.risk_level || 'NEW';
      return sum + (weights[rl] || 0) * Number(c.exposure || 0);
    }, 0);
    return total / Math.max(scoredCustomers.length, 1);
  }, [scoredCustomers]);

  const avgDelay = scoredCustomers.length > 0
    ? scoredCustomers.reduce((s, c) => s + Number(c.avgDelay || c.avg_delay || 0), 0) / scoredCustomers.length : 0;

  // Executive assessment
  let sentiment, sentimentText, SentimentIcon;
  if (scoredCustomers.length === 0) {
    sentiment = 'neutral'; sentimentText = 'Portfolio not yet evaluated — no scored buyers.'; SentimentIcon = Minus;
  } else if (riskExposureIndex > 500000 && avgDelay > 60) {
    sentiment = 'negative'; sentimentText = 'Elevated risk exposure detected. Consider tightening credit terms for high-risk buyers.'; SentimentIcon = TrendingDown;
  } else if (riskExposureIndex < 100000 && avgDelay < 30) {
    sentiment = 'positive'; sentimentText = 'Portfolio risk is well managed. Payment behavior is healthy across buyers.'; SentimentIcon = TrendingUp;
  } else {
    sentiment = 'neutral'; sentimentText = 'Moderate risk with watchpoints. Monitor high-exposure buyers closely.'; SentimentIcon = Minus;
  }
  const sentimentColor = sentiment === 'positive' ? COLORS.low : sentiment === 'negative' ? COLORS.high : COLORS.medium;

  const totalVolume = customers.reduce((s, c) => s + Number(c.volume || 0), 0);
  const totalExposure = customers.reduce((s, c) => s + Number(c.exposure || 0), 0);
  const highCount = customers.filter((c) => (c.riskLevel || c.risk_level) === 'HIGH').length;
  const medCount = customers.filter((c) => (c.riskLevel || c.risk_level) === 'MEDIUM').length;
  const lowCount = customers.filter((c) => (c.riskLevel || c.risk_level) === 'LOW').length;

  const criticalAssets = useMemo(() =>
    [...scoredCustomers].sort((a, b) => Number(b.exposure || 0) - Number(a.exposure || 0)),
  [scoredCustomers]);

  const now = new Date();
  const timestamp = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Header */}
      <FadeIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ ...FONT_DISPLAY, fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Executive Risk Report</h2>
            <p style={{ ...TYPE.caption, color: COLORS.inkMuted }}>Generated {timestamp}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }} className="no-print">
            <button onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 13, color: COLORS.inkSoft }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: COLORS.accent, color: COLORS.surface, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <Printer size={14} /> Print
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Risk Exposure Index + Assessment */}
      <FadeIn delay={0.05}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 24 }}>
            <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 8 }}>Risk Exposure Index</p>
            <div style={{ ...TYPE.kpiNumber, fontSize: 32, color: COLORS.ink }}>
              <AnimatedCounter value={riskExposureIndex} prefix="₹" decimals={0} />
            </div>
            <p style={{ ...TYPE.caption, color: COLORS.inkMuted, marginTop: 6 }}>Weighted avg exposure across {scoredCustomers.length} scored buyers</p>
          </Card>
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sentimentColor}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SentimentIcon size={20} color={sentimentColor} />
              </div>
              <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft }}>Executive Assessment</p>
            </div>
            <p style={{ ...TYPE.body, color: COLORS.ink, lineHeight: 1.6 }}>{sentimentText}</p>
          </Card>
        </div>
      </FadeIn>

      {/* Key Metrics */}
      <FadeIn delay={0.1}>
        <h3 style={{ ...TYPE.sectionTitle, marginBottom: 12 }}>Key Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 4 }}>Total Buyers</p><p style={{ ...FONT_MONO, fontSize: 20, fontWeight: 700 }}>{customers.length}</p></Card>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 4 }}>Total Volume</p><p style={{ ...FONT_MONO, fontSize: 20, fontWeight: 700 }}>₹{totalVolume.toLocaleString('en-IN')}</p></Card>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 4 }}>Total Exposure</p><p style={{ ...FONT_MONO, fontSize: 20, fontWeight: 700 }}>₹{totalExposure.toLocaleString('en-IN')}</p></Card>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 4 }}>Avg Delay</p><p style={{ ...FONT_MONO, fontSize: 20, fontWeight: 700 }}>{avgDelay.toFixed(1)} days</p></Card>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.high, fontWeight: 600, marginBottom: 4 }}>High Risk</p><p style={{ ...FONT_MONO, fontSize: 24, fontWeight: 700, color: COLORS.high }}>{highCount}</p></Card>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.medium, fontWeight: 600, marginBottom: 4 }}>Medium Risk</p><p style={{ ...FONT_MONO, fontSize: 24, fontWeight: 700, color: COLORS.medium }}>{medCount}</p></Card>
          <Card style={{ padding: 18 }}><p style={{ ...TYPE.caption, color: COLORS.low, fontWeight: 600, marginBottom: 4 }}>Low Risk</p><p style={{ ...FONT_MONO, fontSize: 24, fontWeight: 700, color: COLORS.low }}>{lowCount}</p></Card>
        </div>
      </FadeIn>

      {/* Critical Assets Table */}
      {criticalAssets.length > 0 && (
        <FadeIn delay={0.15}>
          <h3 style={{ ...TYPE.sectionTitle, marginBottom: 12 }}>Critical Assets</h3>
          <Card interactive={false} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.inkMuted}20` }}>
                  {['Name', 'Risk Level', 'Score', 'Exposure', 'Avg Delay', 'Volume'].map((h) => (
                    <th key={h} style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: h === 'Exposure' || h === 'Volume' ? 'right' : 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criticalAssets.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.inkMuted}10` }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px' }}><RiskTierBadge tier={c.riskLevel || c.risk_level || 'NEW'} compact /></td>
                    <td style={{ padding: '10px 12px', ...FONT_MONO, fontSize: 13, fontWeight: 700 }}>{c.score}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', ...FONT_MONO, fontSize: 13, fontWeight: 600 }}>₹{Number(c.exposure || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', ...FONT_MONO, fontSize: 13 }}>{c.avgDelay || c.avg_delay || 0} days</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', ...FONT_MONO, fontSize: 13, color: COLORS.inkSoft }}>₹{Number(c.volume || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </FadeIn>
      )}

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}
