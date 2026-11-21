import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { COLORS } from './components/ui';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingOverlay from './components/Loadingoverlay';
import DashboardView from './components/DashboardView';
import CustomersView from './components/CustomersView';
import InvoicesView from './components/InvoicesView';
import RiskAnalysisView from './components/RiskAnalysisView';
import ReportsView from './components/ReportsView';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const PAGE_LABELS = {
  dashboard: 'Loading Dashboard',
  invoices: 'Loading Invoices',
  customers: 'Loading Buyers',
  risk_analysis: 'Loading Risk Analysis',
  reports: 'Loading Reports',
};

const PAGE_TRANSITION_MS = 1400;

// ─── Recommendation Generator ────────────────────────────────────────────────

function generateRecommendations(customers, invoices) {
  const recs = [];

  // Rule 1: Top HIGH-risk customer by exposure
  const highRisk = customers
    .filter((c) => (c.riskLevel || c.risk_level) === 'HIGH')
    .sort((a, b) => Number(b.exposure) - Number(a.exposure));
  if (highRisk.length > 0) {
    recs.push({
      id: 'advance-payment',
      icon: '🛡️',
      title: 'Require advance payment',
      description: `Require advance payment from ${highRisk[0].name} — highest exposure among high-risk buyers.`,
      buyerName: highRisk[0].name,
    });
  }

  // Rule 2: Invoice with delayProbability > 50 closest to due date
  const riskyInvoices = invoices
    .filter((i) => Number(i.delayProbability || i.delay_probability || 0) > 50 && i.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date));
  if (riskyInvoices.length > 0) {
    const inv = riskyInvoices[0];
    recs.push({
      id: 'send-reminder',
      icon: '📧',
      title: 'Send payment reminder',
      description: `Send payment reminder for ${inv.invoiceNumber || inv.invoice_number} — high delay risk.`,
      invoiceNumber: inv.invoiceNumber || inv.invoice_number,
    });
  }

  // Rule 3: LOW-risk customer with no overdue invoices
  const lowRisk = customers.filter(
    (c) =>
      (c.riskLevel || c.risk_level) === 'LOW' &&
      !invoices.some(
        (i) => (i.buyerName || i.buyer_name) === c.name && i.status === 'Overdue'
      )
  );
  if (lowRisk.length > 0) {
    recs.push({
      id: 'extend-credit',
      icon: '📈',
      title: 'Extend credit terms',
      description: `Extend credit terms for ${lowRisk[0].name} — consistently reliable.`,
      buyerName: lowRisk[0].name,
    });
  }

  return recs;
}

// ─── App Shell ───────────────────────────────────────────────────────────────

export default function App({ initialPage = 'dashboard', initialBuyerName = null, onGoToLanding = null }) {
  // Navigation
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // UI
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [pageLoading, setPageLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [fadingOut, setFadingOut] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);

  const fileInputRef = useRef(null);

  // ── Data Fetching ──

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      setCustomers(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      return [];
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/invoices`);
      const data = await res.json();
      setInvoices(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        await Promise.all([fetchCustomers(), fetchInvoices()]);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [fetchCustomers, fetchInvoices]);

  // ── Navigation ──

  const goToPage = useCallback((pageId) => {
    setLoadingLabel(PAGE_LABELS[pageId] || 'Loading');
    setPageLoading(true);
    setTimeout(() => {
      setCurrentPage(pageId);
      setPageLoading(false);
      setSearchQuery('');
    }, PAGE_TRANSITION_MS);
  }, []);

  // ── Event Handlers ──

  const handleAddCustomer = useCallback(async (customerData) => {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) throw new Error('Failed to create customer');
      await fetchCustomers();
      return await res.json();
    } catch (err) {
      console.error('handleAddCustomer error:', err);
      throw err;
    }
  }, [fetchCustomers]);

  const handleAddInvoice = useCallback(async (invoiceData) => {
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      const result = await res.json();
      await Promise.all([fetchCustomers(), fetchInvoices()]);
      return result;
    } catch (err) {
      console.error('handleAddInvoice error:', err);
      throw err;
    }
  }, [fetchCustomers, fetchInvoices]);

  const handleUpdateNotes = useCallback(async (customerId, notes) => {
    try {
      await fetch(`${API_BASE}/customers/${customerId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      await fetchCustomers();
    } catch (err) {
      console.error('handleUpdateNotes error:', err);
    }
  }, [fetchCustomers]);

  const handleDeleteCustomer = useCallback(async (customerId) => {
    try {
      await fetch(`${API_BASE}/customers/${customerId}`, { method: 'DELETE' });
      await Promise.all([fetchCustomers(), fetchInvoices()]);
    } catch (err) {
      console.error('handleDeleteCustomer error:', err);
    }
  }, [fetchCustomers, fetchInvoices]);

  const handleDeleteInvoice = useCallback(async (invoiceId) => {
    try {
      await fetch(`${API_BASE}/invoices/${invoiceId}`, { method: 'DELETE' });
      await Promise.all([fetchCustomers(), fetchInvoices()]);
    } catch (err) {
      console.error('handleDeleteInvoice error:', err);
    }
  }, [fetchCustomers, fetchInvoices]);

  const handleMarkInvoicePaid = useCallback(async (invoiceId) => {
    try {
      await fetch(`${API_BASE}/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' }),
      });
      await Promise.all([fetchCustomers(), fetchInvoices()]);
    } catch (err) {
      console.error('handleMarkInvoicePaid error:', err);
    }
  }, [fetchCustomers, fetchInvoices]);

  const handleFileUpload = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      await Promise.all([fetchCustomers(), fetchInvoices()]);
      return result;
    } catch (err) {
      console.error('handleFileUpload error:', err);
      throw err;
    }
  }, [fetchCustomers, fetchInvoices]);

  const handleSelectCustomer = useCallback((name) => {
    setSelectedCustomerName(name);
    if (currentPage !== 'customers') {
      goToPage('customers');
    }
  }, [currentPage, goToPage]);

  const handleSelectInvoice = useCallback((invoiceId) => {
    if (currentPage !== 'invoices') {
      goToPage('invoices');
    }
  }, [currentPage, goToPage]);

  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleExecuteRecommendation = useCallback((rec) => {
    if (rec.buyerName) {
      handleSelectCustomer(rec.buyerName);
    } else if (rec.invoiceNumber) {
      goToPage('invoices');
    }
  }, [handleSelectCustomer, goToPage]);

  // ── Derived Data ──

  const recommendations = generateRecommendations(customers, invoices);

  // ── Render ──

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLORS.bg,
          color: COLORS.inkSoft,
          fontSize: 16,
        }}
      >
        Loading CredShield...
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLORS.bg,
          color: COLORS.high,
          gap: 12,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600 }}>Failed to load data</p>
        <p style={{ fontSize: 14, color: COLORS.inkSoft }}>{loadError}</p>
        <p style={{ fontSize: 13, color: COLORS.inkMuted }}>
          Make sure the backend is running on localhost:3000
        </p>
      </div>
    );
  }

  // Page content (placeholder views — built in Phases 4–8)
  const renderPage = () => {
    const pageStyle = {
      padding: '24px 0',
      minHeight: 'calc(100vh - 80px)',
    };

    const placeholderStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      color: COLORS.inkSoft,
      gap: 8,
    };

    switch (currentPage) {
      case 'dashboard':
        return (
          <div style={pageStyle}>
            <DashboardView
              customers={customers}
              invoices={invoices}
              recommendations={recommendations}
              onSelectCustomer={handleSelectCustomer}
              onExecuteRecommendation={handleExecuteRecommendation}
            />
          </div>
        );
      case 'invoices':
        return (
          <div style={pageStyle}>
            <InvoicesView
              invoices={invoices}
              customers={customers}
              onAddInvoice={handleAddInvoice}
              onMarkPaid={handleMarkInvoicePaid}
              onDeleteInvoice={handleDeleteInvoice}
              onFileUpload={handleFileUpload}
              isLoading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectCustomer={handleSelectCustomer}
            />
          </div>
        );
      case 'customers':
        return (
          <div style={pageStyle}>
            <CustomersView
              customers={customers}
              invoices={invoices}
              onAddCustomer={handleAddCustomer}
              onUpdateNotes={handleUpdateNotes}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={loading}
              selectedCustomerName={selectedCustomerName}
              setSelectedCustomerName={setSelectedCustomerName}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectInvoice={handleSelectInvoice}
            />
          </div>
        );
      case 'risk_analysis':
        return (
          <div style={pageStyle}>
            <RiskAnalysisView
              customers={customers}
              invoices={invoices}
              initialBuyerName={initialBuyerName}
            />
          </div>
        );
      case 'reports':
        return (
          <div style={pageStyle}>
            <ReportsView
              customers={customers}
              invoices={invoices}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
      className="grain-overlay"
    >
      {/* Page transition overlay */}
      <LoadingOverlay label={loadingLabel} visible={pageLoading} />

      {/* Hidden file input for CSV upload */}
      <input
        ref={fileInputRef}
        type="file"
        id="csv-upload-input"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
            e.target.value = '';
          }
        }}
      />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={goToPage}
        onUploadClick={handleUploadClick}
        onCollapseChange={setSidebarWidth}
        onGoToLanding={onGoToLanding}
      />

      {/* Header */}
      <Header
        currentPage={currentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        customers={customers}
        invoices={invoices}
        sidebarWidth={sidebarWidth}
      />

      {/* Main Content */}
      <main
        style={{
          marginLeft: sidebarWidth,
          paddingTop: 80,
          paddingLeft: 32,
          paddingRight: 32,
          paddingBottom: 32,
          transition: 'margin-left 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: '100vh',
        }}
      >
        {renderPage()}
      </main>
    </div>
  );
}
