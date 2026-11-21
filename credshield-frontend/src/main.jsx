import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage';
import OnboardingWizard from './components/OnboardingWizard';
import './index.css';
import './App.css';

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
