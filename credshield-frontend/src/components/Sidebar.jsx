import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldAlert,
  TrendingUp,
  Upload,
  Settings,
  HelpCircle,
  ChevronLeft,
  Home,
  Shield,
} from 'lucide-react';
import { COLORS, FONT_DISPLAY } from './ui';

const EXPANDED_W = 260;
const COLLAPSED_W = 84;
const EASE = 'power4.out';

const MENU_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'invoices', icon: FileText, label: 'Invoices' },
  { id: 'customers', icon: Users, label: 'Buyers' },
  { id: 'risk_analysis', icon: ShieldAlert, label: 'Risk analysis' },
  { id: 'reports', icon: TrendingUp, label: 'Reports' },
];

function CollapsedLabel({ label, visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: COLLAPSED_W + 8,
        top: '50%',
        transform: 'translateY(-50%)',
        background: COLORS.ink,
        color: COLORS.surface,
        padding: '4px 12px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  );
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  onUploadClick,
  onCollapseChange,
  onGoToLanding,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const sidebarRef = useRef(null);
  const chevronRef = useRef(null);
  const labelRefs = useRef({});

  const toggleCollapse = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);

    const targetW = next ? COLLAPSED_W : EXPANDED_W;

    gsap.to(sidebarRef.current, {
      width: targetW,
      duration: 0.45,
      ease: EASE,
    });

    gsap.to(chevronRef.current, {
      rotation: next ? 180 : 0,
      duration: 0.35,
      ease: EASE,
    });

    // Animate labels
    Object.values(labelRefs.current).forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        opacity: next ? 0 : 1,
        width: next ? 0 : 'auto',
        marginLeft: next ? 0 : 12,
        duration: 0.3,
        ease: EASE,
      });
    });

    if (onCollapseChange) {
      onCollapseChange(targetW);
    }
  }, [collapsed, onCollapseChange]);

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: EXPANDED_W,
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: `1px solid ${COLORS.border}`,
          minHeight: 64,
        }}
      >
        <Shield size={24} color={COLORS.accent} strokeWidth={2.5} />
        <span
          ref={(el) => (labelRefs.current['logo'] = el)}
          style={{
            ...FONT_DISPLAY,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          CredShield
        </span>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          const hovered = hoveredItem === item.id;

          return (
            <div key={item.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setCurrentPage(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 10,
                  background: hovered ? `${COLORS.accent}0D` : 'transparent',
                  borderLeft: active ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <Icon
                  size={20}
                  color={active ? COLORS.accent : COLORS.inkSoft}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  ref={(el) => (labelRefs.current[item.id] = el)}
                  style={{
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? COLORS.accent : COLORS.inkSoft,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {item.label}
                </span>
              </button>
              {collapsed && (
                <CollapsedLabel label={item.label} visible={hovered} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Upload CSV Button */}
        <button
          onClick={onUploadClick}
          onMouseEnter={() => setHoveredItem('upload')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            border: `1px solid ${COLORS.accent}`,
            borderRadius: 10,
            background: hoveredItem === 'upload' ? `${COLORS.accent}0D` : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          <Upload size={18} color={COLORS.accent} />
          <span
            ref={(el) => (labelRefs.current['upload'] = el)}
            style={{
              marginLeft: 12,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.accent,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Upload CSV
          </span>
        </button>

        {/* Settings & Help */}
        <div style={{ display: 'flex', gap: 4, justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : 8 }}>
          <button
            style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
            title="Settings"
          >
            <Settings size={18} color={COLORS.inkMuted} />
          </button>
          <button
            style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
            title="Help"
          >
            <HelpCircle size={18} color={COLORS.inkMuted} />
          </button>
        </div>

        {/* Back to Home */}
        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            onMouseEnter={() => setHoveredItem('home')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              border: 'none',
              borderRadius: 10,
              background: hoveredItem === 'home' ? `${COLORS.accent}0D` : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <Home size={18} color={COLORS.inkSoft} />
            <span
              ref={(el) => (labelRefs.current['home'] = el)}
              style={{
                marginLeft: 12,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.inkSoft,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              Back to Home
            </span>
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '10px 12px',
            border: 'none',
            borderRadius: 10,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <div ref={chevronRef}>
            <ChevronLeft size={18} color={COLORS.inkMuted} />
          </div>
          <span
            ref={(el) => (labelRefs.current['collapse'] = el)}
            style={{
              marginLeft: 12,
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.inkMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Collapse
          </span>
        </button>
      </div>
    </div>
  );
}
