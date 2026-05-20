import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Login = ({ onNavigate }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrMessage('Please enter your email and password');
      return;
    }

    setLoading(true);
    setErrMessage('');
    
    const res = await login(email, password);
    if (!res.success) {
      setErrMessage(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        
        const res = await loginWithGoogle({
          email: userInfo.email,
          username: userInfo.name || userInfo.given_name || 'Google User',
          googleId: userInfo.sub
        });

        if (!res.success) {
          setErrMessage(res.error || 'Google login failed');
          setGoogleLoading(false);
        }
      } catch (err) {
        setErrMessage('Failed to fetch Google profile');
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setErrMessage('Google Login was unsuccessful');
      setGoogleLoading(false);
    }
  });

  const handleGoogleSignIn = () => {
    setErrMessage('');
    googleLoginAction();
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
        background: 'rgba(124, 58, 237, 0.15)',
        filter: 'blur(80px)',
        top: '15%',
        left: '20%',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(59, 130, 246, 0.12)',
        filter: 'blur(80px)',
        bottom: '15%',
        right: '20%',
        borderRadius: '50%'
      }} />

      {/* Main glass card container */}
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        textAlign: 'center',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass-highlight)',
        color: 'var(--text-primary)'
      }}>
        {/* Logo */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '12px',
          background: 'var(--grad-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Sparkles size={24} style={{ color: '#fff' }} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>Welcome Back</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Securely access your AI personal finance dashboard
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Input */}
          <div className="input-group">
            <label className="input-label">Email Address</label>
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

          {/* Password Input */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--accent-purple)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Forgot?
              </button>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading || googleLoading}
          >
            {loading ? 'Verifying profile...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          margin: '24px 0',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
          <span>Or sign in with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
        </div>

        {/* Google Mock OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          className="btn btn-secondary"
          style={{ width: '100%', gap: '10px' }}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <span>Starting secure Google OAuth...</span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Signup routing link */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '30px' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: 'var(--accent-purple)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
