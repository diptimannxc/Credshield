import { useState, useEffect, useRef, useMemo } from 'react';
import { AlertTriangle, TrendingDown, Clock, DollarSign, Zap, ArrowRight } from 'lucide-react';
import {
  COLORS,
  FONT_DISPLAY,
  FONT_MONO,
  TYPE,
  Card,
  RiskTierBadge,
  AnimatedCounter,
  FadeIn,
  Stagger,
  RISK_TIER_COLOR,
} from './ui';

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, prefix = '', suffix = '', decimals = 0, caption, color }) {
  return (
    <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
      <p style={{ ...TYPE.kpiLabel, color: COLORS.inkSoft, marginBottom: 8 }}>{label}</p>
      <div style={{ ...TYPE.kpiNumber, color: color || COLORS.ink }}>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <p style={{ ...TYPE.caption, color: COLORS.inkMuted, marginTop: 6, minHeight: 16 }}>
        {caption || '\u00A0'}
      </p>
    </Card>
  );
}

// ─── RiskRing ────────────────────────────────────────────────────────────────

function RiskRing({ percentage, size = 48 }) {
  const [animOffset, setAnimOffset] = useState(119.38);
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimOffset(offset), 100);
    return () => clearTimeout(timer);
  }, [offset]);

  let color = COLORS.low;
  if (percentage >= 70) color = COLORS.high;
  else if (percentage >= 40) color = COLORS.medium;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={radius} fill="none" stroke={`${COLORS.inkMuted}20`} strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animOffset}
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ ...FONT_MONO, fontSize: 11, fontWeight: 700, fill: color }}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
}

// ─── CashflowChart (CSS bar chart) ──────────────────────────────────────────

function CashflowChart({ invoices }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Bucket invoices by month (last 6 months)
  const months = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      buckets.push({ key, label, projected: 0, collected: 0 });
    }

    invoices.forEach((inv) => {
      const dueStr = inv.dueDate || inv.due_date || '';
      const due = new Date(dueStr);
      if (isNaN(due)) return;
      const key = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) {
        bucket.projected += Number(inv.amount);
        if (inv.status === 'Paid') {
          bucket.collected += Number(inv.amount);
        }
      }
    });

    return buckets;
  }, [invoices]);

  const maxAmount = Math.max(...months.map((m) => Math.max(m.projected, m.collected)), 1);

  return (
    <div>
      <h3 style={{ ...TYPE.sectionTitle, marginBottom: 16 }}>Cashflow Trend</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, paddingBottom: 24 }}>
        {months.map((month) => {
          const projH = (month.projected / maxAmount) * 120;
          const collH = (month.collected / maxAmount) * 120;
          return (
            <div key={month.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                <div
                  style={{
                    width: 18,
                    height: animated ? projH : 0,
                    background: `${COLORS.accent}22`,
                    border: `1px solid ${COLORS.accent}44`,
                    borderRadius: '4px 4px 0 0',
                    transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                  }}
                  title={`Projected: ₹${month.projected.toLocaleString('en-IN')}`}
                />
                <div
                  style={{
                    width: 18,
                    height: animated ? collH : 0,
                    background: month.collected >= month.projected ? COLORS.low : COLORS.medium,
                    borderRadius: '4px 4px 0 0',
                    transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s`,
                  }}
                  title={`Collected: ₹${month.collected.toLocaleString('en-IN')}`}
                />
              </div>
              <span style={{ ...TYPE.caption, color: COLORS.inkMuted }}>{month.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: `${COLORS.accent}22`, border: `1px solid ${COLORS.accent}44`, borderRadius: 2 }} />
          <span style={{ ...TYPE.caption, color: COLORS.inkSoft }}>Projected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: COLORS.low, borderRadius: 2 }} />
          <span style={{ ...TYPE.caption, color: COLORS.inkSoft }}>Collected</span>
        </div>
      </div>
    </div>
  );
}

// ─── CashflowHeatmap (GitHub-style activity grid) ────────────────────────────

function CashflowHeatmap({ invoices }) {
  const [warmth, setWarmth] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2800;
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setWarmth(eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  // Build 63-day grid (9 cols × 7 rows)
  const grid = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 62; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      let amount = 0;
      invoices.forEach((inv) => {
        const dueStr = inv.dueDate || inv.due_date || '';
        // Try to match by normalizing
        const due = new Date(dueStr);
        if (!isNaN(due) && due.toISOString().split('T')[0] === dateStr) {
          amount += Number(inv.amount);
        }
      });
      days.push({ date: dateStr, amount });
    }
    return days;
  }, [invoices]);

  const maxAmount = Math.max(...grid.map((d) => d.amount), 1);

  return (
    <div>
      <h4 style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Invoice Activity (63 days)
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'repeat(7, 1fr)',
          gridAutoFlow: 'column',
          gridAutoColumns: '1fr',
          gap: 3,
        }}
      >
        {grid.map((day, i) => {
          const intensity = day.amount > 0 ? Math.max(0.15, (day.amount / maxAmount)) : 0;
          const alpha = Math.round(intensity * warmth * 255).toString(16).padStart(2, '0');
          return (
            <div
              key={i}
              title={`${day.date}: ₹${day.amount.toLocaleString('en-IN')}`}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 3,
                background: day.amount > 0 ? `${COLORS.accent}${alpha}` : `${COLORS.inkMuted}10`,
                minWidth: 10,
                minHeight: 10,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── DashboardView ───────────────────────────────────────────────────────────

export default function DashboardView({
  customers,
  invoices,
  recommendations,
  onSelectCustomer,
  onExecuteRecommendation,
}) {
  // ── KPI Calculations ──

  const activeInvoices = invoices.filter((i) => i.status !== 'Paid').length;
  const totalInvoices = invoices.length;

  const outstandingAmount = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const scoredCustomers = customers.filter((c) => c.avgDelay != null && c.avgDelay !== null);
  const avgDelay = scoredCustomers.length > 0
    ? scoredCustomers.reduce((sum, c) => sum + Number(c.avgDelay || c.avg_delay || 0), 0) / scoredCustomers.length
    : 0;

  const atRiskAmount = invoices
    .filter((i) => i.status === 'Overdue' && Number(i.delayProbability || i.delay_probability || 0) > 70)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

  // ── Top risky customers ──

  const riskyCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const rl = c.riskLevel || c.risk_level;
        const hasOverdue = invoices.some(
          (i) => (i.buyerName || i.buyer_name) === c.name && i.status === 'Overdue'
        );
        return rl === 'HIGH' || rl === 'MEDIUM' || hasOverdue;
      })
      .sort((a, b) => Number(b.exposure) - Number(a.exposure))
      .slice(0, 4);
  }, [customers, invoices]);

  return (
    <div>
      {/* ── KPI Cards ── */}
      <FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
          <MetricCard
            label="Active Invoices"
            value={activeInvoices}
            caption={`${totalInvoices} total invoices`}
          />
          <MetricCard
            label="Outstanding Amount"
            value={outstandingAmount}
            prefix="₹"
            color={COLORS.medium}
          />
          <MetricCard
            label="Avg Payment Delay"
            value={avgDelay}
            suffix=" days"
            decimals={1}
            caption={`${scoredCustomers.length} scored buyers`}
          />
          <MetricCard
            label="At Risk This Month"
            value={atRiskAmount}
            prefix="₹"
            color={atRiskAmount > 0 ? COLORS.high : COLORS.low}
            caption={atRiskAmount > 0 ? `${overdueCount} overdue invoices` : 'No critical risk'}
          />
        </div>
      </FadeIn>

      {/* ── Cashflow Section ── */}
      <FadeIn delay={0.2}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 24 }}>
            <CashflowChart invoices={invoices} />
          </Card>
          <Card style={{ padding: 24 }}>
            <CashflowHeatmap invoices={invoices} />
          </Card>
        </div>
      </FadeIn>

      {/* ── Cash at Risk Card ── */}
      {atRiskAmount > 0 && (
        <FadeIn delay={0.3}>
          <Card tone="HIGH" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${COLORS.high}14`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} color={COLORS.high} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ ...TYPE.sectionTitle, color: COLORS.high, marginBottom: 4 }}>
                  Cash at Risk
                </h3>
                <p style={{ ...TYPE.body, color: COLORS.inkSoft }}>
                  <span style={{ ...FONT_MONO, fontWeight: 700, color: COLORS.high }}>
                    ₹{atRiskAmount.toLocaleString('en-IN')}
                  </span>
                  {' '}across {overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''} with high delay probability.
                </p>
              </div>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* ── Risk Alerts Grid ── */}
      <FadeIn delay={0.35}>
        <h3 style={{ ...TYPE.sectionTitle, marginBottom: 12 }}>Risk Alerts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {riskyCustomers.length === 0 ? (
            <Card style={{ padding: 24, gridColumn: 'span 4', textAlign: 'center' }}>
              <p style={{ ...TYPE.body, color: COLORS.inkSoft }}>No high-risk buyers detected. Portfolio looks healthy.</p>
            </Card>
          ) : (
            riskyCustomers.map((customer) => {
              const riskLevel = customer.riskLevel || customer.risk_level || 'NEW';
              const delay = Number(customer.avgDelay || customer.avg_delay || 0);
              const exposure = Number(customer.exposure || 0);
              const riskPct = customer.score
                ? Math.min(100, Math.round(((customer.score - 300) / 700) * 100))
                : 0;

              return (
                <Card
                  key={customer.id}
                  tone={riskLevel}
                  style={{ padding: 20, cursor: 'pointer' }}
                  onClick={() => onSelectCustomer && onSelectCustomer(customer.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <RiskRing percentage={riskPct} />
                    <RiskTierBadge tier={riskLevel} compact />
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>
                    {customer.name}
                  </h4>
                  <p style={{ ...TYPE.caption, color: COLORS.inkSoft, marginBottom: 8 }}>
                    {customer.industry || '—'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ ...TYPE.caption, color: COLORS.inkMuted }}>
                      Exposure: <span style={{ ...FONT_MONO, fontWeight: 600, color: COLORS.ink }}>₹{exposure.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </FadeIn>

      {/* ── Actionable Insights ── */}
      {recommendations.length > 0 && (
        <FadeIn delay={0.4}>
          <h3 style={{ ...TYPE.sectionTitle, marginBottom: 12 }}>Actionable Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {recommendations.map((rec) => (
              <Card key={rec.id} style={{ padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{rec.icon}</div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>
                  {rec.title}
                </h4>
                <p style={{ ...TYPE.caption, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
                  {rec.description}
                </p>
                <button
                  onClick={() => onExecuteRecommendation && onExecuteRecommendation(rec)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    background: `${COLORS.accent}10`,
                    color: COLORS.accent,
                    border: `1px solid ${COLORS.accent}30`,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Execute <ArrowRight size={12} />
                </button>
              </Card>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
