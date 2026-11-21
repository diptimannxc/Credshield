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

// ─── CashflowChart (CSS bar chart with Y-axis) ─────────────────────────────

function buildMonthlySeries(invoices, monthsCount) {
  const now = new Date();
  const buckets = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      projected: 0,
      actual: 0,
    });
  }
  invoices.forEach((inv) => {
    const dueStr = inv.dueDate || inv.due_date || '';
    const d = new Date(dueStr);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) return;
    bucket.projected += Number(inv.amount);
    if (inv.status === 'Paid') bucket.actual += Number(inv.amount);
  });
  return buckets;
}

function CashflowChart({ invoices, monthsCount = 6 }) {
  const series = buildMonthlySeries(invoices, monthsCount);
  const maxVal = Math.max(1, ...series.map((b) => Math.max(b.projected, b.actual)));
  const hasData = series.some((b) => b.projected > 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const formatAmount = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  if (!hasData) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.inkMuted, fontSize: 12 }}>
        No invoices due in this range yet.
      </div>
    );
  }

  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div>
      <h3 style={{ ...TYPE.sectionTitle, marginBottom: 16 }}>Cashflow Trend</h3>
      <div style={{ display: 'flex', height: 160 }}>
        {/* Y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 52, paddingRight: 8, flexShrink: 0 }}>
          {ticks.map((t) => (
            <span key={t} style={{ ...FONT_MONO, fontSize: 10, fontWeight: 500, color: COLORS.inkSoft, textAlign: 'right', lineHeight: 1 }}>
              {formatAmount(Math.round(maxVal * t))}
            </span>
          ))}
        </div>
        {/* Bars */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, borderLeft: `1px solid ${COLORS.border}` }}>
          {series.map((b, idx) => (
            <div key={b.key} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
              <div
                title={`Projected: ₹${b.projected.toLocaleString('en-IN')}`}
                style={{
                  flex: 1,
                  height: mounted ? `${(b.projected / maxVal) * 100}%` : '0%',
                  background: `${COLORS.accent}22`,
                  borderRadius: '4px 4px 0 0',
                  minHeight: b.projected > 0 && mounted ? 3 : 0,
                  transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.08}s`,
                }}
              />
              <div
                title={`Collected: ₹${b.actual.toLocaleString('en-IN')}`}
                style={{
                  flex: 1,
                  height: mounted ? `${(b.actual / maxVal) * 100}%` : '0%',
                  background: b.actual < b.projected ? COLORS.medium : COLORS.low,
                  borderRadius: '4px 4px 0 0',
                  minHeight: b.actual > 0 && mounted ? 3 : 0,
                  transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.08 + 0.1}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* X-axis month labels */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.border}`, marginLeft: 60 }}>
        {series.map((b) => (
          <span key={b.key} style={{ flex: 1, textAlign: 'center', ...FONT_MONO, fontSize: 9, fontWeight: 500, color: COLORS.inkSoft }}>
            {b.label.toUpperCase()}
          </span>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: `${COLORS.accent}55` }} />
          <span style={{ fontSize: 9, fontWeight: 500, color: COLORS.inkSoft }}>Projected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.low }} />
          <span style={{ fontSize: 9, fontWeight: 500, color: COLORS.inkSoft }}>Collected</span>
        </div>
      </div>
    </div>
  );
}

// ─── CashflowHeatmap (GitHub-style activity grid) ────────────────────────────

function buildHeatmapCells(invoices, weeks = 9) {
  const totalDays = weeks * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    cells.push({ date: d, amount: 0 });
  }

  const keyOf = (d) => d.toISOString().slice(0, 10);
  const byDate = new Map(cells.map((c) => [keyOf(c.date), c]));

  invoices.forEach((inv) => {
    const dueStr = inv.dueDate || inv.due_date || '';
    const d = new Date(dueStr);
    if (isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    const cell = byDate.get(keyOf(d));
    if (cell) cell.amount += Number(inv.amount);
  });

  return cells;
}

function CashflowHeatmap({ invoices }) {
  const weeks = 9;
  const cells = buildHeatmapCells(invoices, weeks);
  const maxAmt = Math.max(1, ...cells.map((c) => c.amount));
  const hasData = cells.some((c) => c.amount > 0);
  const [heatLevel, setHeatLevel] = useState(0);

  useEffect(() => {
    if (!hasData) return;
    let start = null;
    const delay = 800;
    const duration = 2800;
    let rafId;
    const step = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      if (elapsed < delay) { rafId = requestAnimationFrame(step); return; }
      const progress = Math.min((elapsed - delay) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setHeatLevel(eased);
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [hasData]);

  if (!hasData) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.inkMuted, fontSize: 12, textAlign: 'center', padding: '0 16px' }}>
        No due dates in range yet to visualize daily activity.
      </div>
    );
  }

  return (
    <div>
      <h4 style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Invoice Activity ({weeks * 7} days)
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          gridTemplateRows: 'repeat(7, 1fr)',
          gridAutoFlow: 'column',
          gap: 3,
        }}
      >
        {cells.map((c, i) => {
          const intensity = c.amount / maxAmt;
          const scaledAlpha = c.amount > 0
            ? Math.round((28 + intensity * 68) * heatLevel)
            : 0;
          const alphaHex = scaledAlpha.toString(16).padStart(2, '0');
          const borderAlpha = c.amount > 0
            ? Math.round(0x30 * heatLevel).toString(16).padStart(2, '0')
            : null;
          return (
            <div
              key={i}
              title={`${c.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ₹${c.amount.toLocaleString('en-IN')}`}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 3,
                background: c.amount > 0
                  ? `${COLORS.accent}${alphaHex}`
                  : COLORS.bg,
                border: `1px solid ${c.amount > 0 && borderAlpha ? `${COLORS.accent}${borderAlpha}` : COLORS.border}`,
                minWidth: 10,
                minHeight: 10,
              }}
            />
          );
        })}
      </div>
      <p style={{ fontSize: 9, color: COLORS.inkSoft, marginTop: 10 }}>
        Daily invoice due-amounts, last {weeks} weeks — darker = higher volume
      </p>
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
