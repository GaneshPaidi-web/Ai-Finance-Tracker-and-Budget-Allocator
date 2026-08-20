import { Component, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';

// Components & Public Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Protected Pages
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';

import BudgetAllocator from './pages/BudgetAllocator';
import AdvisorChat from './pages/AdvisorChat';
import Forecaster from './pages/Forecaster';
import SavingsGoals from './pages/SavingsGoals';
import Subscriptions from './pages/Subscriptions';
import Profile from './pages/Profile';
import Reports from './pages/Reports';

// React Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Uncaught Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-deep)',
          color: 'var(--text-primary)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '36px', maxWidth: '480px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '12px' }}>
              ⚠️ Application Interface Exception
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                background: 'var(--grad-primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  // Public screens: 'login', 'signup', 'forgot-password'
  const [authScreen, setAuthScreen] = useState('login');
  const [authParams, setAuthParams] = useState({});

  // Protected tabs: 'dashboard', 'expenses', 'budget', 'chat', 'forecast', 'goals', 'subscriptions', 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigate = (screen, params = {}) => {
    setAuthScreen(screen);
    setAuthParams(params || {});
  };

  // Loading State Spinner
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-deep)',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(124, 58, 237, 0.1)',
          borderTopColor: 'var(--accent-purple)',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', letterSpacing: '0.05em' }}>
          Configuring secure financial ledger...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // PUBLIC ROUTING (Unauthenticated)
  if (!isAuthenticated) {
    switch (authScreen) {
      case 'signup':
        return <Signup onNavigate={handleNavigate} authParams={authParams} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={handleNavigate} authParams={authParams} />;
      case 'login':
      default:
        return <Login onNavigate={handleNavigate} authParams={authParams} />;
    }
  }

  // PROTECTED ROUTING (Authenticated Layout)
  const renderActiveTabContent = () => {
    switch (activeTab) {

      case 'expenses':
      case 'subscriptions':
        return <Expenses />;
      case 'budget':
      case 'goals':
        return <BudgetAllocator />;
      case 'chat':
        return <AdvisorChat />;
      case 'reports':
      case 'forecast':
        return <Reports />;
      case 'profile':
        return <Profile />;
      case 'dashboard':
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <FinanceProvider>
      <div className="app-container">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Work Area */}
        <div className="main-wrapper">
          {/* Header Navbar */}
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Dashboard Sheet content */}
          <main className="content-container">
            {renderActiveTabContent()}
          </main>
        </div>
      </div>
    </FinanceProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
