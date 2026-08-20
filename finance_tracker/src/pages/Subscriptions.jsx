import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingDown
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const Subscriptions = () => {
  const { subscriptions, addSubscription, editSubscription, deleteSubscription } = useFinance();

  // Subscriptions Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Bills');

  const [loading, setLoading] = useState(false);
  const [totalObligations, setTotalObligations] = useState(0);

  const categories = ['Bills', 'Entertainment', 'Healthcare', 'Others'];

  // Aggregate monthly total
  useEffect(() => {
    if (!subscriptions || subscriptions.length === 0) {
      setTotalObligations(0);
      return;
    }

    const activeSubs = subscriptions.filter(s => s.isActive);
    const sum = activeSubs.reduce((total, sub) => {
      const amt = Number(sub.amount);
      if (sub.billingCycle === 'yearly') {
        return total + Math.round(amt / 12);
      }
      return total + amt;
    }, 0);

    setTotalObligations(sum);
  }, [subscriptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || Number(amount) <= 0 || !dueDate) {
      alert('Please fill out the recurring bill details');
      return;
    }

    setLoading(true);
    const subData = {
      name,
      amount: Number(amount),
      billingCycle,
      dueDate: Number(dueDate),
      category,
      isActive: true
    };

    const res = await addSubscription(subData);
    setLoading(false);

    if (res.success) {
      // Clear form
      setName('');
      setAmount('');
      setBillingCycle('monthly');
      setDueDate('');
      setCategory('Bills');
    } else {
      alert(res.error || 'Failed to save recurring bill');
    }
  };

  const handleToggleActive = async (sub) => {
    setLoading(true);
    await editSubscription(sub._id, {
      ...sub,
      isActive: !sub.isActive
    });
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '30px'
      }}>
        {/* Left Side: Create Subscription Form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
            💳 Add Recurring Bill
          </h3>

          {/* Bill Name */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Subscription Name</label>
            <input
              type="text"
              placeholder="e.g. Broadband, Netflix Premium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
              required
            />
          </div>

          {/* Amount */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Billing Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 999"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
              required
            />
          </div>

          {/* Billing Cycle & Category Group */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="form-select"
                style={{ fontSize: '13px' }}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                style={{ fontSize: '13px' }}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Day of Month */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Due Date (Day of Month: 1 - 31)</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 5"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', gap: '8px', marginTop: '10px' }}
            disabled={loading}
          >
            <Plus size={16} />
            Track Subscription
          </button>
        </form>

        {/* Right Side: Active Commitments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Aggregated Cost Card */}
          <div className="glass-panel glow-rose" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(244, 63, 94, 0.2)'
            }}>
              <TrendingDown size={20} style={{ color: 'var(--accent-rose)' }} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aggregate Monthly Subscription Obligation</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>₹{totalObligations.toLocaleString()}/mo</h3>
            </div>
          </div>

          {/* List panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
              📜 Subscriptions Audit Sheet
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                  <div
                    key={sub._id}
                    className="glass-panel animate-fade-in"
                    style={{
                      padding: '16px',
                      background: sub.isActive ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.002)',
                      border: sub.isActive ? '1px solid var(--border-glass)' : '1px solid rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: sub.isActive ? 1 : 0.6
                    }}
                  >
                    {/* Bill Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: sub.isActive ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CreditCard size={16} style={{ color: sub.isActive ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{sub.name}</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Calendar size={11} /> Day {sub.dueDate} of month
                        </p>
                      </div>
                    </div>

                    {/* Right side: Amount, Status toggle, and Trash */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <h5 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{sub.amount.toLocaleString()}
                        </h5>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {sub.billingCycle}
                        </span>
                      </div>

                      {/* Status Toggle Button */}
                      <button
                        onClick={() => handleToggleActive(sub)}
                        style={{ background: 'none', border: 'none', color: sub.isActive ? 'var(--accent-teal)' : 'var(--text-muted)', cursor: 'pointer' }}
                        disabled={loading}
                      >
                        {sub.isActive ? (
                          <ToggleRight size={24} style={{ filter: 'drop-shadow(0 0 4px #14b8a6)' }} />
                        ) : (
                          <ToggleLeft size={24} />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteSubscription(sub._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', hover: { color: 'var(--accent-rose)' } }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '60px 0' }}>
                  No active or paused subscriptions logged. Begin adding them on the left!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Subscriptions;
