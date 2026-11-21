import { useState } from 'react';
import { Info } from 'lucide-react';
import { COLORS } from './ui';

export default function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(!visible)}
    >
      <Info size={14} color={COLORS.inkMuted} style={{ cursor: 'pointer' }} />

      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            padding: '8px 12px',
            background: COLORS.ink,
            color: COLORS.surface,
            fontSize: 12,
            lineHeight: 1.5,
            borderRadius: 8,
            whiteSpace: 'normal',
            width: 220,
            zIndex: 300,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          {text}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${COLORS.ink}`,
            }}
          />
        </div>
      )}
    </span>
  );
}
