import { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errMessage, setErrMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !securityAnswer || !newPassword) {
      setErrMessage('Please fill in all fields to recover your account');
      return;
    }

    if (newPassword.length < 6) {
      setErrMessage('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setErrMessage('');
    setSuccessMessage('');

    const res = await resetPassword(email, securityAnswer, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Password successfully reset! Redirection to login...');
      setTimeout(() => {
        onNavigate('login');
      }, 3000);
    } else {
      setErrMessage(res.error || 'Password recovery failed. Check email or answer.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      background: 'var(--bg-deep)'
    }}>
      {/* Background Neon Orbs */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(244, 63, 94, 0.08)',
        filter: 'blur(80px)',
        top: '15%',
        left: '20%',
        borderRadius: '50%'
      }} />

      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px',
        background: 'rgba(18, 22, 33, 0.65)',
        border: '1px solid var(--border-glass-highlight)',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '10px',
          background: 'var(--grad-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 15px rgba(244, 63, 94, 0.2)'
        }}>
          <ShieldAlert size={22} style={{ color: '#fff' }} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>Reset Password</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Recover your secure financial wallet profile
        </p>

        {/* Error Alert Box */}
        {errMessage && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--accent-rose)',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            ⚠️ {errMessage}
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--accent-teal)',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            ✅ {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Input */}
          <div className="input-group">
            <label className="input-label">Registered Email</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {/* Security Answer Input */}
          <div className="input-group">
            <label className="input-label">Your Security Recovery Answer</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <KeyRound size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Security answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {/* New Password Input */}
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-danger"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Validating credentials...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login link */}
        <button
          onClick={() => onNavigate('login')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
