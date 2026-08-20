import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, User, Settings, Sun, Moon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { subscriptions, transactions, budget } = useFinance();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const dropdownRef = useRef(null);

  // Compile active system alerts in real-time
  useEffect(() => {
    const list = [];
    if (!user) return;

    const salary = user.salary || 50000;

    // 1. Bill Reminders
    const currentDay = new Date().getDate();
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.filter(s => s.isActive).forEach(sub => {
        const diff = sub.dueDate - currentDay;
        if (diff >= 0 && diff <= 7) {
          list.push({
            id: `bill-${sub._id}`,
            title: `Bill Due: ${sub.name}`,
            text: `₹${sub.amount} is due in ${diff} days.`,
            type: 'bill'
          });
        }
      });
    }

    // 2. Budget limits
    if (budget && transactions && transactions.length > 0) {
      let actualEssentials = 0;
      let actualEntertainment = 0;

      transactions.filter(t => t.type === 'expense').forEach(t => {
        if (t.category === 'Food' || t.category === 'Travel' || t.category === 'Bills' || t.category === 'Healthcare' || t.category === 'Others') {
          actualEssentials += Number(t.amount);
        } else if (t.category === 'Shopping' || t.category === 'Entertainment') {
          actualEntertainment += Number(t.amount);
        }
      });

      if (actualEssentials > budget.allocated.essentials) {
        list.push({
          id: 'budget-essentials',
          title: 'Essentials Overspent!',
          text: `Exceeded target by ₹${(actualEssentials - budget.allocated.essentials).toLocaleString()}`,
          type: 'budget'
        });
      }
      if (actualEntertainment > budget.allocated.entertainment) {
        list.push({
          id: 'budget-ent',
          title: 'Entertainment Overspent!',
          text: `Exceeded target by ₹${(actualEntertainment - budget.allocated.entertainment).toLocaleString()}`,
          type: 'budget'
        });
      }
    }

    // 3. Low Balance
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = salary - currentMonthExpenses;

    if (balance < salary * 0.15 || balance < 5000) {
      list.push({
        id: 'low-bal',
        title: 'Low Balance Alarm!',
        text: `Liquid reserves down to ₹${balance.toLocaleString()}`,
        type: 'balance'
      });
    }

    setActiveAlerts(list);

  }, [subscriptions, transactions, budget, user]);

  // Click outside handler for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Financial Overview';
      case 'expenses': return 'Expense Manager';
      case 'budget': return 'Budget & Goals';
      case 'chat': return 'AI Financial Coach';
      case 'reports': return 'Analytics & Forecast';
      case 'profile': return 'Profile Settings';
      default: return 'AuraFinance AI';
    }
  };

  return (
    <header style={{
      height: '80px',
      borderBottom: '1px solid var(--border-glass)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      background: 'rgba(10, 12, 16, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)'
    }}>
      {/* Title */}
      <div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 600,
          margin: 0,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em'
        }}>
          {getPageTitle()}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Real-time AI insights & wealth analytics
        </p>
      </div>

      {/* Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="glass-panel-interactive"
          style={{
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-glass)',
            transform: 'none',
            cursor: 'pointer'
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <Sun size={18} style={{ color: 'var(--accent-amber)' }} />
          ) : (
            <Moon size={18} style={{ color: 'var(--accent-purple)' }} />
          )}
        </button>

        {/* Notification Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="glass-panel-interactive"
            style={{
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-glass)',
              background: showNotifications ? 'var(--bg-glass-active)' : 'var(--bg-glass)',
              transform: 'none'
            }}
          >
            <Bell size={18} style={{
              color: activeAlerts.length > 0 
                ? (activeAlerts.some(a => a.id === 'low-bal' || a.id === 'budget-essentials') ? 'var(--accent-rose)' : 'var(--accent-amber)') 
                : 'var(--text-secondary)'
            }} />
            {activeAlerts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeAlerts.some(a => a.id === 'low-bal' || a.id === 'budget-essentials') ? 'var(--accent-rose)' : 'var(--accent-amber)',
                boxShadow: activeAlerts.some(a => a.id === 'low-bal' || a.id === 'budget-essentials') ? '0 0 8px #f43f5e' : '0 0 8px #f59e0b'
              }} />
            )}
          </button>

          {/* Dropdown panel */}
          {showNotifications && (
            <div className="glass-panel animate-fade-in" style={{
              position: 'absolute',
              top: '55px',
              right: 0,
              width: '320px',
              padding: '16px',
              zIndex: 110,
              background: 'var(--bg-glass-active)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--border-glass-highlight)',
              boxShadow: 'var(--shadow-glow), var(--shadow-card)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-primary)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔔 Smart Alerts
              </h3>
              
              {activeAlerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    You have {activeAlerts.length} notifications:
                  </p>
                  
                  {activeAlerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        if (alert.type === 'bill') setActiveTab('expenses');
                        else if (alert.type === 'budget') setActiveTab('budget');
                        else if (alert.type === 'balance') setActiveTab('expenses');
                        setShowNotifications(false);
                      }}
                      className="glass-panel-interactive"
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: alert.id === 'low-bal' || alert.id === 'budget-essentials' 
                          ? '1px solid rgba(244, 63, 94, 0.2)' 
                          : '1px solid rgba(245, 158, 11, 0.2)',
                        background: alert.id === 'low-bal' || alert.id === 'budget-essentials' 
                          ? 'rgba(244, 63, 94, 0.03)' 
                          : 'rgba(245, 158, 11, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transform: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: alert.id === 'low-bal' || alert.id === 'budget-essentials' ? 'var(--accent-rose)' : 'var(--accent-amber)' 
                        }}>
                          {alert.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        {alert.text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '13px' }}>All caught up! 🎉</p>
                  <p style={{ fontSize: '11px', marginTop: '4px' }}>No active balance or budget alert warnings.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Card Shortcut */}
        {user && (
          <div
            onClick={() => setActiveTab('profile')}
            className="glass-panel-interactive"
            style={{
              padding: '6px 12px',
              borderRadius: '24px',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transform: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
