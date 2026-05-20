import { useState, useEffect } from 'react';
import { User, Wallet, ShieldAlert, KeyRound, Check, Briefcase, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [username, setUsername] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryDate, setSalaryDate] = useState(1);
  const [avatar, setAvatar] = useState('avatar1');
  const [occupation, setOccupation] = useState('');
  const [place, setPlace] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What is your pet name?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setSalary(user.salary || '');
      setSalaryDate(user.salaryDate || 1);
      setAvatar(user.avatar || 'avatar1');
      setOccupation(user.occupation || '');
      setPlace(user.place || '');
      setSecurityQuestion(user.securityQuestion || 'What is your pet name?');
    }
  }, [user]);

  const avatarsList = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrMessage('');

    const updates = {
      username,
      salary: Number(salary) || 0,
      salaryDate: Number(salaryDate) || 1,
      avatar,
      occupation,
      place,
      securityQuestion
    };

    if (securityAnswer) {
      updates.securityAnswer = securityAnswer;
    }

    if (password) {
      if (password.length < 6) {
        setErrMessage('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
      updates.password = password;
    }

    const res = await updateProfile(updates);
    setLoading(false);

    if (res.success) {
      setMessage('Profile settings saved successfully! ✨');
      setSecurityAnswer('');
      setPassword('');
    } else {
      setErrMessage(res.error || 'Failed to update profile settings');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Alert Boxes */}
      {message && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-teal)',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {errMessage && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px'
        }}>
          {errMessage}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '30px'
      }}>
        {/* Left Card: Avatar Selection & Overview */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-glow)',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            {avatar === 'avatar_google' ? '👤' : '✨'}
          </div>
          
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px' }}>{user?.username}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '30px' }}>{user?.email}</p>

          <div style={{ width: '100%' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', textAlign: 'left' }}>
              Choose Avatar Preset
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {avatarsList.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  style={{
                    padding: '12px 0',
                    borderRadius: 'var(--radius-md)',
                    border: avatar === av ? '2px solid var(--accent-purple)' : '1px solid var(--border-glass)',
                    background: avatar === av ? 'var(--bg-glass-active)' : 'rgba(255,255,255,0.02)',
                    fontSize: '20px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  ✨
                  {avatar === av && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      background: 'var(--accent-purple)',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={8} style={{ color: '#fff' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Settings form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
            ⚙️ Account Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* Username */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">User Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  required
                />
              </div>
            </div>

            {/* Base Salary */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Monthly Base Salary (₹)</label>
              <div style={{ position: 'relative' }}>
                <Wallet size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  required
                />
              </div>
            </div>

            {/* Salary Date */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Salary Credit Date</label>
              <select
                value={salaryDate}
                onChange={(e) => setSalaryDate(Number(e.target.value))}
                className="form-input"
                style={{ paddingLeft: '14px', height: '46px' }}
              >
                {Array.from({ length: 31 }, (_, idx) => idx + 1).map((day) => (
                  <option key={day} value={day} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    Day {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Occupation */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Occupation</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {/* Place */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Location / City</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. Bangalore, India"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Security Question */}
            <div className="input-group">
              <label className="input-label">Security Question</label>
              <div style={{ position: 'relative' }}>
                <ShieldAlert size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  required
                />
              </div>
            </div>

            {/* Security Answer */}
            <div className="input-group">
              <label className="input-label">Change Security Answer (Optional)</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Enter new answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="input-group">
            <label className="input-label">Change Password (Optional)</label>
            <input
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', padding: '12px 30px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Saving settings...' : 'Save Settings'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
