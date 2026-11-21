import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { Shield, ArrowRight, Zap, Eye, TrendingUp } from 'lucide-react';
import { COLORS, FONT_DISPLAY, FONT_MONO, TYPE } from './ui';
import Crosshair from './Crosshair';

// ─── Animated Node Graph Background ─────────────────────────────────────────

function NodeGraph() {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, raf;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const initNodes = () => {
      nodesRef.current = Array.from({ length: 50 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 2 + Math.random() * 3,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;

      // Update positions
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Mouse repel
        const dx = n.x - mouseRef.current.x;
        const dy = n.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          n.vx += (dx / dist) * 0.08;
          n.vy += (dy / dist) * 0.08;
        }

        // Dampen
        n.vx *= 0.998;
        n.vy *= 0.998;
      });

      // Draw edges
      ctx.strokeStyle = 'rgba(15, 111, 92, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.globalAlpha = 1 - dist / 180;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      ctx.globalAlpha = 1;
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 111, 92, 0.25)`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    const onMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };

    resize();
    initNodes();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────

export default function LandingPage({ onEnterApp }) {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });
    if (heroRef.current) {
      tl.from(heroRef.current.children, {
        y: 40, opacity: 0, stagger: 0.12, duration: 0.8,
        ease: 'power3.out',
      });
    }
    if (ctaRef.current) {
      tl.from(ctaRef.current.children, {
        y: 20, opacity: 0, stagger: 0.1, duration: 0.5,
        ease: 'power3.out',
      }, '-=0.3');
    }
    if (featuresRef.current) {
      tl.from(featuresRef.current.children, {
        y: 30, opacity: 0, stagger: 0.08, duration: 0.6,
        ease: 'power3.out',
      }, '-=0.2');
    }
  }, []);

  const features = [
    { icon: Zap, title: 'Predict', desc: 'AI predicts which invoices will be paid late' },
    { icon: Shield, title: 'Protect', desc: 'Know your exposure before extending credit' },
    { icon: Eye, title: 'Prevent', desc: 'Act on insights before losses happen' },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#0B0907',
        color: '#F5F0EB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'none',
      }}
    >
      <NodeGraph />
      <Crosshair color="white" containerRef={containerRef} />

      {/* Hero */}
      <div ref={heroRef} style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 700, padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <Shield size={36} color="#0F6F5C" strokeWidth={2.5} />
          <span style={{ ...FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: '#A89E92', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            CredShield
          </span>
        </div>
        <h1 style={{ ...FONT_DISPLAY, fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
          Predict, Protect,<br />
          <span style={{ color: '#0F6F5C' }}>Prevent</span>
        </h1>
        <p style={{ fontSize: 18, color: '#A89E92', lineHeight: 1.6, marginBottom: 40 }}>
          AI-powered credit risk intelligence for MSMEs.<br />
          Know which buyers will pay late — before they do.
        </p>
      </div>

      {/* CTAs */}
      <div ref={ctaRef} style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 16, marginBottom: 60 }}>
        <button
          onClick={() => onEnterApp('wizard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', background: '#0F6F5C', color: '#F5F0EB',
            border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', transition: 'transform 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#0d5e4d'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#0F6F5C'; }}
        >
          Get Started <ArrowRight size={18} />
        </button>
        <button
          onClick={() => onEnterApp('dashboard')}
          style={{
            padding: '14px 28px', background: 'transparent', color: '#A89E92',
            border: '1px solid #A89E92', borderRadius: 12, fontSize: 15,
            cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#F5F0EB'; e.currentTarget.style.color = '#F5F0EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#A89E92'; e.currentTarget.style.color = '#A89E92'; }}
        >
          Enter Dashboard
        </button>
      </div>

      {/* Features */}
      <div ref={featuresRef} style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 24, padding: '0 24px', maxWidth: 800 }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              style={{
                flex: 1, padding: 24, borderRadius: 16,
                border: '1px solid rgba(245, 240, 235, 0.08)',
                background: 'rgba(245, 240, 235, 0.03)',
                textAlign: 'center',
                transition: 'border-color 0.3s, background 0.3s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 111, 92, 0.3)'; e.currentTarget.style.background = 'rgba(15, 111, 92, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(245, 240, 235, 0.08)'; e.currentTarget.style.background = 'rgba(245, 240, 235, 0.03)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(15, 111, 92, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon size={22} color="#0F6F5C" />
              </div>
              <h3 style={{ ...FONT_DISPLAY, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#A89E92', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p style={{ position: 'relative', zIndex: 10, marginTop: 60, fontSize: 12, color: '#6B635A' }}>
        Built for LeanIn Hacks 2026
      </p>
    </div>
  );
}
