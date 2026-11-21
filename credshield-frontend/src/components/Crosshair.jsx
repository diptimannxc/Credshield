import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { COLORS, FONT_DISPLAY } from './ui';

export default function Crosshair({ color = 'white', containerRef }) {
  const svgRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);

  useEffect(() => {
    const container = containerRef?.current || document;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onEnterLink = () => { hovering.current = true; };
    const onLeaveLink = () => { hovering.current = false; };

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;

      if (svgRef.current) {
        svgRef.current.style.left = `${pos.current.x}px`;
        svgRef.current.style.top = `${pos.current.y}px`;
        svgRef.current.style.transform = `translate(-50%, -50%) scale(${hovering.current ? 1.5 : 1})`;
        svgRef.current.style.opacity = hovering.current ? '0.6' : '0.4';
      }
      requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove);

    // Track links and buttons
    const interactives = document.querySelectorAll('a, button, [role="button"]');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnterLink);
      el.addEventListener('mouseleave', onLeaveLink);
    });

    const raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterLink);
        el.removeEventListener('mouseleave', onLeaveLink);
      });
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);

  return (
    <svg
      ref={svgRef}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 10000,
        opacity: 0.4,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        mixBlendMode: 'difference',
      }}
    >
      <circle cx="20" cy="20" r="12" fill="none" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="4" x2="20" y2="14" stroke={color} strokeWidth="1" />
      <line x1="20" y1="26" x2="20" y2="36" stroke={color} strokeWidth="1" />
      <line x1="4" y1="20" x2="14" y2="20" stroke={color} strokeWidth="1" />
      <line x1="26" y1="20" x2="36" y2="20" stroke={color} strokeWidth="1" />
      <circle cx="20" cy="20" r="2" fill={color} />
    </svg>
  );
}
