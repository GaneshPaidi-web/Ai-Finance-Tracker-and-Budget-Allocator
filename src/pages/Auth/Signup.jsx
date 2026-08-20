import { useState } from 'react';
import { User, Mail, Lock, FileQuestion, KeyRound, Sparkles, Briefcase, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Signup = ({ onNavigate, authParams }) => {
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(authParams?.email || '');
  const [password, setPassword] = useState('');
  const [occupation, setOccupation] = useState('');
  const [place, setPlace] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What is your pet name?');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [loading, setLoading] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  const questions = [
    'What is your pet name?',
    'What was the name of your first school?',
    'In what city were you born?',
    'What is your mother\'s maiden name?',
    'What was your first car model?'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !securityAnswer) {
      setErrMessage('Please enter all required signup fields');
      return;
    }

    if (password.length < 6) {
      setErrMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setErrMessage('');

    try {
      const res = await register(username, email, password, securityQuestion, securityAnswer, occupation, place);
      if (!res.success) {
        setErrMessage(res.error || 'Registration failed');
      }
    } catch (err) {
      setErrMessage('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
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
        background: 'rgba(124, 58, 237, 0.15)',
        filter: 'blur(80px)',
        top: '10%',
        right: '20%',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(59, 130, 246, 0.12)',
        filter: 'blur(80px)',
        bottom: '10%',
        left: '20%',
        borderRadius: '50%'
      }} />

      {/* Main glass card container */}
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '36px',
        textAlign: 'center',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass-highlight)',
        margin: '20px 0',
        color: 'var(--text-primary)'
      }}>
        {/* Logo */}
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '10px',
          background: 'var(--grad-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Sparkles size={22} style={{ color: '#fff' }} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>Create Account</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Kickstart your wealth-building journey today
        </p>

        {/* Smart Notification Bar for Account Already Exists */}
        {errMessage && errMessage.toLowerCase().includes('already exists') ? (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            color: '#facc15',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Account Already Exists
            </div>
            <div>
              An account with <strong style={{ color: '#fff' }}>{email}</strong> is already registered on AuraFinance.
            </div>
            <button
              type="button"
              onClick={() => onNavigate('login', { email, message: 'Your account is already created! Please enter your password to sign in.' })}
              style={{
                alignSelf: 'flex-start',
                background: 'var(--grad-primary)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '2px'
              }}
            >
              ⚡ Sign In to Account
            </button>
          </div>
        ) : errMessage ? (
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
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username Input */}
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <User size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

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
            <label className="input-label">Password (Min 6 chars)</label>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {/* Occupation Input */}
          <div className="input-group">
            <label className="input-label">Occupation (e.g. Engineer, Student)</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Briefcase size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Software Engineer"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          {/* Place Input */}
          <div className="input-group">
            <label className="input-label">Location / City</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <MapPin size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Mumbai, India"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          {/* Security Question Selector */}
          <div className="input-group">
            <label className="input-label">Password Recovery Question</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <FileQuestion size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                zIndex: 1
              }} />
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="form-select"
                style={{ paddingLeft: '42px' }}
              >
                {questions.map((q, idx) => (
                  <option key={idx} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Security Answer Input */}
          <div className="input-group">
            <label className="input-label">Security Answer</label>
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
                placeholder="Your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating secure wallet...' : 'Create Account'}
          </button>
        </form>

        {/* Login routing link */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '24px' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: 'var(--accent-purple)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
