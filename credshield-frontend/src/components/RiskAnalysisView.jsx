import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { COLORS, FONT_DISPLAY, FONT_MONO, TYPE, Card, FadeIn, RiskTierBadge, RISK_TIER_COLOR } from './ui';
import InfoTooltip from './InfoTooltip';

const API_BASE = 'http://localhost:3000/api';

function DelayGauge({ probability, size = 160 }) {
  const [animOffset, setAnimOffset] = useState(301.59);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, Number(probability) || 0));
  const offset = circumference - (pct / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimOffset(offset), 200);
    return () => clearTimeout(timer);
  }, [offset]);

  let color = COLORS.low;
  if (pct >= 70) color = COLORS.high;
  else if (pct >= 40) color = COLORS.medium;

  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={radius} fill="none" stroke={`${COLORS.inkMuted}15`} strokeWidth="8" />
      <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={animOffset} transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dashoffset 2.2s ease-out' }} />
      <text x="80" y="72" textAnchor="middle" dominantBaseline="central" style={{ ...FONT_MONO, fontSize: 28, fontWeight: 700, fill: color }}>
        {Math.round(pct)}%
      </text>
      <text x="80" y="96" textAnchor="middle" style={{ fontSize: 11, fill: COLORS.inkSoft }}>delay risk</text>
    </svg>
  );
}

function CustomSlider({ label, value, min, max, step, unit, tooltip, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  const calcValue = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }, [min, max, step]);

  const onPointerDown = (e) => {
    trackRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(calcValue(e.clientX));
  };
  const onPointerMove = (e) => { if (dragging) onChange(calcValue(e.clientX)); };
  const onPointerUp = () => setDragging(false);

  const displayVal = unit === '₹' ? `₹${Number(value).toLocaleString('en-IN')}` : unit ? `${value} ${unit}` : value;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ ...TYPE.caption, fontWeight: 600, color: COLORS.inkSoft }}>
          {label} {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        <span style={{ ...FONT_MONO, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{displayVal}</span>
      </div>
      <div ref={trackRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        style={{ position: 'relative', height: 20, cursor: 'pointer', touchAction: 'none' }}>
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 4, background: COLORS.bg, borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 8, left: 0, width: `${pct}%`, height: 4, background: COLORS.accent, borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 2, left: `${pct}%`, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', background: COLORS.accent, border: '3px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

export default function RiskAnalysisView({ customers, invoices, initialBuyerName }) {
  const [selectedBuyer, setSelectedBuyer] = useState(initialBuyerName || '');
  const [simScore, setSimScore] = useState(500);
  const [simDelay, setSimDelay] = useState(15);
  const [simExposure, setSimExposure] = useState(200000);
  const [prediction, setPrediction] = useState({ delayProbability: 0, predictedDays: 0 });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const scoredCustomers = useMemo(() => customers.filter((c) => c.score != null), [customers]);

  const currentBuyer = useMemo(() => {
    if (!selectedBuyer) return null;
    return customers.find((c) => c.name === selectedBuyer) || null;
  }, [customers, selectedBuyer]);

  // Initialize sliders from selected buyer
  useEffect(() => {
    if (currentBuyer && currentBuyer.score != null) {
      setSimScore(currentBuyer.score);
      setSimDelay(Number(currentBuyer.avgDelay || currentBuyer.avg_delay || 0));
      setSimExposure(Number(currentBuyer.exposure || 0));
    }
  }, [currentBuyer]);

  // Auto-select initial buyer
  useEffect(() => {
    if (initialBuyerName) setSelectedBuyer(initialBuyerName);
  }, [initialBuyerName]);

  // Debounced prediction
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/predict`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: simScore, avgDelay: simDelay, exposure: simExposure }),
        });
        const data = await res.json();
        setPrediction({ delayProbability: data.delayProbability, predictedDays: data.predictedDays });
      } catch { setPrediction({ delayProbability: 0.25, predictedDays: 6 }); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [simScore, simDelay, simExposure]);

  const resetSliders = () => {
    if (currentBuyer && currentBuyer.score != null) {
      setSimScore(currentBuyer.score);
      setSimDelay(Number(currentBuyer.avgDelay || currentBuyer.avg_delay || 0));
      setSimExposure(Number(currentBuyer.exposure || 0));
    } else { setSimScore(500); setSimDelay(15); setSimExposure(200000); }
  };

  // Local risk level calc
  let simRisk = 0;
  if (simScore >= 800) simRisk += 40; else if (simScore >= 500) simRisk += 20;
  if (simDelay > 60) simRisk += 30; else if (simDelay > 30) simRisk += 15;
  if (simExposure > 1000000) simRisk += 20; else if (simExposure > 500000) simRisk += 10;
  simRisk = Math.min(100, simRisk);
  const simRiskLevel = simRisk >= 70 ? 'HIGH' : simRisk >= 30 ? 'MEDIUM' : 'LOW';

  const probPct = Math.round((prediction.delayProbability || 0) * 100);
  const predDays = prediction.predictedDays || 0;
  const formatDays = (d) => d < 0 ? `${Math.abs(d)} days early` : `${d} days`;

  return (
    <div>
      {/* Buyer Selector */}
      <FadeIn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative', minWidth: 280 }}>
            <select value={selectedBuyer} onChange={(e) => setSelectedBuyer(e.target.value)}
              style={{ width: '100%', padding: '10px 36px 10px 14px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 10, fontSize: 14, outline: 'none', appearance: 'none', background: COLORS.surface }}>
              <option value="">Portfolio average</option>
              {customers.map((c) => <option key={c.id} value={c.name}>{c.name} {c.score != null ? `(${c.score})` : ''}</option>)}
            </select>
            <ChevronDown size={16} color={COLORS.inkMuted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
          {currentBuyer && <RiskTierBadge tier={currentBuyer.riskLevel || currentBuyer.risk_level || 'NEW'} />}
        </div>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Sliders */}
        <FadeIn delay={0.1}>
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ ...TYPE.sectionTitle }}>Scenario Simulator</h3>
              <button onClick={resetSliders} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: `1px solid ${COLORS.inkMuted}40`, borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12, color: COLORS.inkSoft }}>
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <CustomSlider label="Risk Score" value={simScore} min={300} max={1000} step={10} tooltip="Higher score = higher risk. 300 is safest, 1000 is critical." onChange={setSimScore} />
            <CustomSlider label="Average Delay" value={simDelay} min={0} max={120} step={1} unit="days" tooltip="Average number of days this buyer pays past the due date." onChange={setSimDelay} />
            <CustomSlider label="Risk Exposure" value={simExposure} min={0} max={2000000} step={10000} unit="₹" tooltip="Total unpaid amount this buyer currently owes you." onChange={setSimExposure} />
          </Card>
        </FadeIn>

        {/* Prediction Results */}
        <FadeIn delay={0.15}>
          <Card style={{ padding: 24, textAlign: 'center' }}>
            <h3 style={{ ...TYPE.sectionTitle, marginBottom: 16 }}>Prediction</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <DelayGauge probability={probPct} />
              <div style={{ padding: 18, background: COLORS.bg, borderRadius: 10, minWidth: 120 }}>
                <p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6 }}>Predicted Delay</p>
                <p style={{ ...FONT_MONO, fontSize: 22, fontWeight: 700, color: COLORS.ink }}>{formatDays(predDays)}</p>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ padding: 14, background: COLORS.bg, borderRadius: 10, display: 'inline-block', minWidth: 140 }}>
                <p style={{ ...TYPE.caption, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 4 }}>Risk Level</p>
                <RiskTierBadge tier={simRiskLevel} />
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Buyer Ranking Table */}
      {scoredCustomers.length > 0 && (
        <FadeIn delay={0.2}>
          <h3 style={{ ...TYPE.sectionTitle, marginBottom: 12 }}>Buyer Risk Ranking</h3>
          <Card interactive={false} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.inkMuted}20` }}>
                  {['#', 'Buyer', 'Score', 'Avg Delay', 'Exposure', 'Risk'].map((h) => (
                    <th key={h} style={{ ...TYPE.tableHeader, color: COLORS.inkSoft, textAlign: h === 'Exposure' ? 'right' : 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...scoredCustomers].sort((a, b) => (b.score || 0) - (a.score || 0)).map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.inkMuted}10` }}>
                    <td style={{ padding: '10px 12px', ...FONT_MONO, fontSize: 12, color: COLORS.inkMuted }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px', ...FONT_MONO, fontSize: 13, fontWeight: 700 }}>{c.score}</td>
                    <td style={{ padding: '10px 12px', ...FONT_MONO, fontSize: 13 }}>{c.avgDelay || c.avg_delay || 0} days</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', ...FONT_MONO, fontSize: 13 }}>₹{Number(c.exposure || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px' }}><RiskTierBadge tier={c.riskLevel || c.risk_level || 'NEW'} compact /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
