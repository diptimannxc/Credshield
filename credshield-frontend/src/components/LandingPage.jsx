// LandingPage.jsx — Storytelling landing page for CredShield
import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NodeGraphSection from './Nodegraphsection.jsx';

gsap.registerPlugin(ScrollTrigger);

/* ─── Brand Palette Tokens ─── */
const C = {
  bg:        '#F5F0EB',
  surface:   '#FFFFFF',
  ink:       '#1A1612',
  inkSoft:   '#6B635A',
  inkMuted:  '#A89E92',
  border:    '#1A1612',
  accent:    '#0F6F5C',
  low:       '#2F7D4F',
  medium:    '#B8860B',
  high:      '#C6362F',
  dark:      '#0B0907',
};

function StorySection() {
  const wrapRef = useRef(null);
  const bgGlowRef = useRef(null);
  const p1Ref = useRef(null);
  const p2Ref = useRef(null);
  const p3Ref = useRef(null);
  const delayedWordRef = useRef(null);
  const overdueWordRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(p2Ref.current, { opacity: 0, y: 50, scale: 0.95 });
      gsap.set(p3Ref.current, { opacity: 0, y: 50, scale: 0.95 });
      gsap.set(overdueWordRef.current, { opacity: 0, y: 25, scale: 0.9 });
      gsap.set(bgGlowRef.current, { opacity: 0.15, scale: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=280%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(p1Ref.current, { opacity: 0, y: -40, scale: 0.92, duration: 0.8, ease: 'power2.inOut' }, 0.2)
        .to(bgGlowRef.current, { opacity: 0.3, scale: 1.25, duration: 1, ease: 'power2.out' }, 0.2);

      tl.to(p2Ref.current, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }, 0.7);

      tl.to(p2Ref.current.querySelector('.p2-subtext'), { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 1.7)
        .to(delayedWordRef.current, { y: 40, opacity: 0, scale: 0.9, duration: 0.7, ease: 'power2.inOut' }, 1.7)
        .to(p3Ref.current, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, 2.0)
        .to(overdueWordRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.4)' }, 2.2)
        .to(bgGlowRef.current, { backgroundColor: C.high, opacity: 0.2, scale: 1.4, duration: 1, ease: 'power2.out' }, 2.0);
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100vh', background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div ref={bgGlowRef} style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: C.medium, filter: 'blur(160px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '1200px', padding: '0 24px', width: '100%' }}>
        <div ref={p1Ref} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(56px, 8.5vw, 110px)', fontWeight: 700, color: C.bg, letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>
            Every Business <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.bg }}>Grows.</span>
          </h1>
        </div>
        <div ref={p2Ref} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <h2 className="p2-subtext" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 600, color: C.bg, letterSpacing: '-0.02em', margin: 0 }}>
            Every Business payment gets
          </h2>
          <div ref={delayedWordRef} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(64px, 10vw, 130px)', fontWeight: 700, fontStyle: 'italic', color: C.medium, letterSpacing: '-0.02em', lineHeight: 0.9, textShadow: '0 0 30px rgba(184, 134, 11, 0.3)' }}>
            Delayed
          </div>
        </div>
        <div ref={p3Ref} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 600, color: C.bg, letterSpacing: '-0.02em', margin: 0 }}>
            Until one payment gets
          </h2>
          <div ref={overdueWordRef} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(64px, 10vw, 140px)', fontWeight: 700, fontStyle: 'italic', color: C.high, letterSpacing: '-0.02em', lineHeight: 0.9, textShadow: '0 0 40px rgba(198, 54, 47, 0.4)' }}>
            Overdue
          </div>
        </div>
      </div>
    </section>
  );
}

function InteractiveUnveilRow({ question, answer, isLast }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div onClick={() => setRevealed((prev) => !prev)} style={{ width: '100%', padding: '46px 0', borderBottom: isLast ? 'none' : `1px solid ${C.ink}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5.5vw, 76px)', fontWeight: 600, color: C.ink, opacity: revealed ? 0.35 : 1, transition: 'opacity 0.4s ease' }}>
        {question}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 700, color: C.accent, opacity: revealed ? 1 : 0, transform: revealed ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.9)', transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)', pointerEvents: 'none' }}>
          {answer}
        </span>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: `1.5px solid ${revealed ? C.accent : C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: revealed ? C.accent : 'transparent', color: revealed ? C.surface : C.ink, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', transform: revealed ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ClickRevealSection() {
  const wrapRef = useRef(null);
  const bgRef = useRef(null);
  const q1Ref = useRef(null);
  const q2Ref = useRef(null);
  const q3Ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(bgRef.current, { backgroundColor: C.dark });
      gsap.set([q1Ref.current, q2Ref.current, q3Ref.current], { opacity: 0, y: 40 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=300%',
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(bgRef.current, { backgroundColor: C.bg, duration: 1, ease: 'power2.inOut' }, 0);
      tl.to(q1Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.8);
      tl.to(q2Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.6);
      tl.to(q3Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 2.4);
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div ref={bgRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 64px' }}>
        <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, marginBottom: '44px', textAlign: 'center' }}>
            — Tap question to unveil answer —
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div ref={q1Ref}><InteractiveUnveilRow question="Delay?" answer="Predicted." /></div>
            <div ref={q2Ref}><InteractiveUnveilRow question="Business Growth?" answer="Protected." /></div>
            <div ref={q3Ref}><InteractiveUnveilRow question="Losses?" answer="Prevented." isLast={true} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NavBar({ onEnterApp }) {
  const [credHover, setCredHover] = useState(false);
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', background: 'transparent' }}>
      <style>{`
        body[data-nav-theme="light"] .nav-wordmark-cred { color: #1A1612 !important; }
        body[data-nav-theme="dark"] .nav-wordmark-cred { color: #F5F0EB !important; }
        body[data-nav-theme="light"] .nav-wordmark-ghost { color: #6B635A !important; }
        body[data-nav-theme="dark"] .nav-wordmark-ghost { color: rgba(245, 240, 235, 0.6) !important; }
        body[data-nav-theme="light"] .nav-link-item { color: #6B635A !important; }
        body[data-nav-theme="dark"] .nav-link-item { color: rgba(245, 240, 235, 0.7) !important; }
      `}</style>
      <div onMouseEnter={() => setCredHover(true)} onMouseLeave={() => setCredHover(false)} style={{ display: 'flex', alignItems: 'baseline', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
        <span className="nav-wordmark-cred" style={{ color: C.bg, transform: credHover ? 'translateX(-4px)' : 'translateX(0)', transition: 'color 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', display: 'inline-block' }}>Cred</span>
        <span className="nav-wordmark-ghost" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: 'rgba(245, 240, 235, 0.6)', fontSize: '22px', fontWeight: 400, maxWidth: credHover ? '90px' : '0px', overflow: 'hidden', opacity: credHover ? 0.8 : 0, transition: 'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, color 0.4s ease', display: 'inline-block', whiteSpace: 'nowrap' }}>ibility</span>
        <span style={{ color: C.accent, transform: credHover ? 'translateX(2px)' : 'translateX(0)', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', display: 'inline-block' }}>Shield</span>
      </div>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <span className="nav-link-item" onClick={() => onEnterApp('dashboard')} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: 500, color: 'rgba(245, 240, 235, 0.7)', cursor: 'pointer', transition: 'color 0.4s ease' }}>Dashboard</span>
        <button onClick={() => onEnterApp('wizard')} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: 600, color: '#FFFFFF', background: C.accent, border: 'none', borderRadius: '6px', padding: '10px 24px', cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.target.style.background = '#0d5e4d'; e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.target.style.background = C.accent; e.target.style.transform = 'translateY(0)'; }}>
          Start Analysis →
        </button>
      </div>
    </nav>
  );
}

export default function LandingPage({ onEnterApp }) {
  return (
    <div style={{ background: C.dark, overflowX: 'hidden' }}>
      <NavBar onEnterApp={onEnterApp} />
      <StorySection />
      <ClickRevealSection />
      <NodeGraphSection />
      <footer style={{ background: C.bg, padding: '120px 48px', textAlign: 'center', borderTop: `1px solid ${C.ink}15` }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.inkMuted, marginBottom: '24px' }}>
          Built for B2B Enterprise Growth
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: '40px', lineHeight: 1.1 }}>
          Stop reacting to default risk.<br />
          <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.accent }}>Start predicting it.</span>
        </h2>
        <button onClick={() => onEnterApp('wizard')} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '16px', fontWeight: 700, color: C.surface, background: C.accent, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '18px 44px', cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.25s ease' }}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-3px)'; e.target.style.background = '#0d5e4d'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.background = C.accent; }}>
          Start Analysis →
        </button>
        <p style={{ marginTop: '64px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: C.inkMuted }}>
          © 2026 CredShield · Predict, Protect, Prevent
        </p>
      </footer>
    </div>
  );
}
