import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Sliders, 
  MessageSquareShare, 
  TrendingUp, 
  Target, 
  CreditCard, 
  UserCircle, 
  LogOut,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Smart Dashboard', icon: LayoutDashboard },
    { id: 'expenses', name: 'Transactions', icon: ArrowLeftRight },
    { id: 'budget', name: 'Budget & Goals', icon: Target },
    { id: 'chat', name: 'AI Finance Coach', icon: MessageSquareShare },
    { id: 'reports', name: 'Analytics & Forecast', icon: FileText },
    { id: 'profile', name: 'Profile & Settings', icon: UserCircle },
  ];

  return (
    <aside className="glass-panel" style={{
      width: '280px',
      minWidth: '280px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      borderRadius: 0,
      borderTop: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 100
    }}>
      {/* Brand Logo Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '40px',
        padding: '0 8px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--grad-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <span style={{ fontStyle: 'normal', fontWeight: 'bold', fontSize: '20px', color: '#fff' }}>A</span>
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>AuraFinance</h2>
          <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600, textTransform: 'uppercase', tracking: '0.1em' }}>AI Powered</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="glass-panel-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: isActive ? '1px solid var(--border-glass-highlight)' : '1px solid transparent',
                background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textAlign: 'left',
                boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                transform: 'none'
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-purple)' : 'inherit', transition: 'color 0.3s' }} />
              <span style={{ fontSize: '14px', fontWeight: isActive ? 500 : 400 }}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile card */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-glass)',
              fontSize: '20px'
            }}>
              {user.avatar === 'avatar_google' ? '👤' : '✨'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{user.username}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '10px 16px',
            fontSize: '13px',
            gap: '8px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
