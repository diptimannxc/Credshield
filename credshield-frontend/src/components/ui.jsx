import { useState, useEffect, useRef, useCallback, Children, cloneElement } from 'react';

// ─── Color Palette ───────────────────────────────────────────────────────────

export const COLORS = {
  bg: '#F5F0EB',
  surface: '#FFFFFF',
  ink: '#1A1612',
  inkSoft: '#6B635A',
  inkMuted: '#A89E92',
  border: '#1A1612',
  accent: '#0F6F5C',
  accentHover: '#0d5e4d',
  low: '#2F7D4F',
  medium: '#B8860B',
  high: '#C6362F',
  new: '#6B635A',
};

// ─── Risk Tier Colors ────────────────────────────────────────────────────────

export const RISK_TIER_COLOR = {
  LOW: COLORS.low,
  MEDIUM: COLORS.medium,
  HIGH: COLORS.high,
  NEW: COLORS.new,
};

// ─── Typography ──────────────────────────────────────────────────────────────

export const FONT_DISPLAY = { fontFamily: "'Playfair Display', Georgia, serif" };
export const FONT_MONO = { fontFamily: "'IBM Plex Mono', monospace" };

export const TYPE = {
  pageTitle: { fontSize: 32, fontWeight: 700, ...FONT_DISPLAY },
  sectionTitle: { fontSize: 20, fontWeight: 600, ...FONT_DISPLAY },
  kpiNumber: { fontSize: 26, fontWeight: 700, ...FONT_MONO },
  kpiLabel: { fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  tableHeader: { fontSize: 13, fontWeight: 600 },
  body: { fontSize: 14, fontWeight: 400 },
  caption: { fontSize: 12, fontWeight: 400 },
};

// ─── FadeIn (Scroll-triggered entrance) ──────────────────────────────────────

export function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(10px)',
        transition: `opacity 0.35s cubic-bezier(0.19, 1, 0.22, 1) ${delay}s, transform 0.35s cubic-bezier(0.19, 1, 0.22, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Stagger (Wraps each child in FadeIn with incrementing delay) ────────────

export function Stagger({ children, gap = 0.05, baseDelay = 0, className = '' }) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <FadeIn key={i} delay={baseDelay + i * gap}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

export function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 800;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span style={FONT_MONO}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({ children, className = '', tone, interactive = true, style, ...rest }) {
  const [hovered, setHovered] = useState(false);
  const strokeColor = RISK_TIER_COLOR[tone] || COLORS.accent;

  return (
    <div
      className={className}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      style={{
        position: 'relative',
        background: COLORS.surface,
        border: `1px solid ${COLORS.ink}`,
        borderRadius: 16,
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 28px rgba(26,22,18,0.14)'
          : '0 2px 8px rgba(26,22,18,0.06)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        ...style,
      }}
      {...rest}
    >
      {/* Animated border draw SVG */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: 16,
        }}
      >
        <rect
          x="0.5"
          y="0.5"
          width="calc(100% - 1px)"
          height="calc(100% - 1px)"
          rx="16"
          ry="16"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={hovered ? 0 : 1}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        />
      </svg>
      {children}
    </div>
  );
}

// ─── RiskTierBadge ───────────────────────────────────────────────────────────

export function RiskTierBadge({ tier, compact = false }) {
  const labels = {
    HIGH: 'High risk',
    MEDIUM: 'Medium risk',
    LOW: 'Low risk',
    NEW: 'Not yet scored',
  };

  const color = RISK_TIER_COLOR[tier] || COLORS.new;
  const label = labels[tier] || labels.NEW;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '2px 8px' : '4px 12px',
        borderRadius: 999,
        border: `1px solid ${color}`,
        background: `${color}14`,
        fontSize: compact ? 11 : 12,
        fontWeight: 600,
        color: color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          border: `1.5px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}
