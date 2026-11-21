import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';

// ─── Placeholder Components (replaced in later phases) ──────────────────────

function LandingPage({ onEnterApp }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B0907',
      color: '#F5F0EB',
      fontFamily: "'Playfair Display', Georgia, serif",
    }}>
      <h1 style={{ fontSize: 48, marginBottom: 8 }}>CredShield</h1>
      <p style={{ fontSize: 18, color: '#A89E92', marginBottom: 32 }}>
        Predict, Protect, Prevent
      </p>
      <button
        onClick={() => onEnterApp('wizard')}
        style={{
          padding: '12px 32px',
          background: '#0F6F5C',
          color: '#F5F0EB',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Get Started
      </button>
      <button
        onClick={() => onEnterApp('dashboard')}
        style={{
          marginTop: 12,
          padding: '10px 24px',
          background: 'transparent',
          color: '#A89E92',
          border: '1px solid #A89E92',
          borderRadius: 8,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Enter Dashboard
      </button>
    </div>
  );
}

function OnboardingWizard({ onComplete, onSkip, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F0EB',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #1A1612',
        borderRadius: 16,
        padding: 40,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, marginBottom: 8 }}>
          Onboarding Wizard
        </h2>
        <p style={{ color: '#6B635A', marginBottom: 24 }}>
          This will be the full onboarding flow in Phase 9.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onBack} style={{ padding: '8px 20px', border: '1px solid #1A1612', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}>
            Back
          </button>
          <button onClick={onSkip} style={{ padding: '8px 20px', border: '1px solid #A89E92', borderRadius: 8, background: 'transparent', color: '#6B635A', cursor: 'pointer' }}>
            Skip
          </button>
          <button onClick={() => onComplete(null)} style={{ padding: '8px 20px', background: '#0F6F5C', color: '#F5F0EB', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function App({ initialPage = 'dashboard', initialBuyerName = null, onGoToLanding = null }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F0EB',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, marginBottom: 8 }}>
          CredShield Dashboard
        </h1>
        <p style={{ color: '#6B635A', marginBottom: 24 }}>
          Current page: <strong>{initialPage}</strong>
        </p>
        <p style={{ color: '#A89E92', marginBottom: 24 }}>
          The full app shell with sidebar, header, and views will be built in Phase 3.
        </p>
        {onGoToLanding && (
          <button onClick={onGoToLanding} style={{ padding: '8px 20px', border: '1px solid #1A1612', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}>
            Back to Landing
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stage Controller ────────────────────────────────────────────────────────

function Root() {
  const [stage, setStage] = useState(() => {
    return localStorage.getItem('credshield_stage') || 'landing';
  });
  const [initialPage, setInitialPage] = useState(() => {
    return localStorage.getItem('credshield_page') || 'dashboard';
  });
  const [wizardBuyerName, setWizardBuyerName] = useState(null);

  useEffect(() => {
    localStorage.setItem('credshield_stage', stage);
  }, [stage]);

  useEffect(() => {
    localStorage.setItem('credshield_page', initialPage);
  }, [initialPage]);

  const handleEnterApp = (target) => {
    if (target === 'wizard') {
      setStage('wizard');
    } else {
      setInitialPage(target || 'dashboard');
      setStage('app');
    }
  };

  const handleWizardComplete = (buyerName) => {
    setWizardBuyerName(buyerName);
    setInitialPage('risk_analysis');
    setStage('app');
  };

  const handleWizardSkip = () => {
    setInitialPage('dashboard');
    setStage('app');
  };

  const handleGoToLanding = () => {
    setStage('landing');
  };

  if (stage === 'wizard') {
    return (
      <OnboardingWizard
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
        onBack={handleGoToLanding}
      />
    );
  }

  if (stage === 'app') {
    return (
      <App
        initialPage={initialPage}
        initialBuyerName={wizardBuyerName}
        onGoToLanding={handleGoToLanding}
      />
    );
  }

  return <LandingPage onEnterApp={handleEnterApp} />;
}

// ─── Mount ───────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
