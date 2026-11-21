import { useState, useEffect, useRef, useCallback } from 'react';
import { FONT_MONO } from './ui';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function useScrambleWord(word, active) {
  const [display, setDisplay] = useState(word);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setDisplay(word);
      return;
    }

    const upper = word.toUpperCase();
    const len = upper.length;
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const totalDuration = 1200; // ms for full word to settle
      const perChar = totalDuration / len;

      let result = '';
      for (let i = 0; i < len; i++) {
        const charStart = i * perChar * 0.5;
        const charEnd = charStart + perChar * 1.5;

        if (elapsed >= charEnd) {
          // Settled
          result += upper[i];
        } else if (elapsed >= charStart) {
          // Scrambling
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      setDisplay(result);

      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(upper);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [word, active]);

  return display;
}

export default function LoadingOverlay({ label = 'Loading', visible }) {
  const scrambled = useScrambleWord(label, visible);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: '#E4E4E4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      {/* Scrambling text */}
      <div
        style={{
          ...FONT_MONO,
          fontSize: 24,
          fontWeight: 600,
          color: '#3F3F46',
          letterSpacing: '0.15em',
          minHeight: 36,
        }}
      >
        {scrambled}
      </div>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#71717A',
              animation: `csLoadingDot 0.6s ${i * 0.15}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes csLoadingDot {
          from { transform: scale(0.8); opacity: 0.5; }
          to { transform: scale(1.0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
