import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, HelpCircle, Command } from 'lucide-react';
import { COLORS, FONT_DISPLAY } from './ui';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  customers: 'Buyer portfolio',
  risk_analysis: 'Risk analysis',
  reports: 'Reports',
};

function CrossfadeTitle({ currentPage }) {
  const [displayedPage, setDisplayedPage] = useState(currentPage);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (currentPage !== displayedPage) {
      setFading(true);
      const timer = setTimeout(() => {
        setDisplayedPage(currentPage);
        setFading(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentPage, displayedPage]);

  return (
    <h1
      style={{
        ...FONT_DISPLAY,
        fontSize: 20,
        fontWeight: 700,
        color: COLORS.ink,
        margin: 0,
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(4px)' : 'translateY(0)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
    >
      {PAGE_TITLES[displayedPage] || 'Dashboard'}
    </h1>
  );
}

export default function Header({
  currentPage,
  searchQuery,
  setSearchQuery,
  customers = [],
  invoices = [],
  sidebarWidth = 260,
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (cmdOpen) {
          setCmdOpen(false);
        } else {
          setCmdOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen]);

  // Close notif on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Generate dynamic alerts
  const alerts = [];
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  if (overdueInvoices.length > 0) {
    const worst = overdueInvoices.reduce((a, b) => (Number(a.amount) > Number(b.amount) ? a : b));
    alerts.push({
      type: 'warning',
      text: `Overdue: ${worst.invoiceNumber || worst.invoice_number} (₹${Number(worst.amount).toLocaleString('en-IN')})`,
    });
  }
  const highRisk = customers.filter((c) => c.riskLevel === 'HIGH' || c.risk_level === 'HIGH');
  if (highRisk.length > 0) {
    const worstCustomer = highRisk.reduce((a, b) =>
      Number(a.avgDelay || a.avg_delay || 0) > Number(b.avgDelay || b.avg_delay || 0) ? a : b
    );
    alerts.push({
      type: 'danger',
      text: `${worstCustomer.name}: avg delay ${worstCustomer.avgDelay || worstCustomer.avg_delay} days`,
    });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'info', text: 'No active alerts right now.' });
  }

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: sidebarWidth,
          height: 64,
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 90,
          transition: 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Left: Page Title */}
        <CrossfadeTitle currentPage={currentPage} />

        {/* Right: Search + Notif + Help + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search Bar */}
          <div
            style={{
              position: 'relative',
              width: searchFocused ? 320 : 220,
              transition: 'width 0.3s ease',
            }}
          >
            <Search
              size={16}
              color={COLORS.inkMuted}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: `1px solid ${COLORS.inkMuted}40`,
                borderRadius: 999,
                fontSize: 13,
                color: COLORS.ink,
                background: COLORS.bg,
                outline: 'none',
              }}
            />
            {!searchFocused && !searchQuery && (
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11,
                  color: COLORS.inkMuted,
                  background: COLORS.surface,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: `1px solid ${COLORS.inkMuted}30`,
                }}
              >
                ⌘K
              </span>
            )}
          </div>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                padding: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 8,
                position: 'relative',
              }}
            >
              <Bell size={20} color={COLORS.inkSoft} />
              {alerts.length > 0 && alerts[0].type !== 'info' && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: COLORS.high,
                  }}
                />
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 300,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: 16,
                  zIndex: 200,
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: COLORS.ink }}>
                  Alerts
                </h3>
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background:
                        alert.type === 'danger'
                          ? `${COLORS.high}10`
                          : alert.type === 'warning'
                          ? `${COLORS.medium}10`
                          : `${COLORS.accent}10`,
                      marginBottom: 8,
                      fontSize: 13,
                      color: COLORS.ink,
                    }}
                  >
                    {alert.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <button
            style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
          >
            <HelpCircle size={20} color={COLORS.inkSoft} />
          </button>

          {/* User Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.surface,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            DM
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      {cmdOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 120,
          }}
          onClick={() => setCmdOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 480,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Command size={16} color={COLORS.inkMuted} />
                <span style={{ fontSize: 14, color: COLORS.inkSoft }}>Quick actions</span>
              </div>
            </div>
            <div style={{ padding: 8 }}>
              {[
                { keys: 'G D', label: 'Go to Dashboard' },
                { keys: 'G I', label: 'Go to Invoices' },
                { keys: 'G R', label: 'Go to Risk Analysis' },
              ].map((cmd) => (
                <div
                  key={cmd.keys}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: COLORS.ink,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{cmd.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: COLORS.inkMuted,
                      background: COLORS.bg,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {cmd.keys}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
