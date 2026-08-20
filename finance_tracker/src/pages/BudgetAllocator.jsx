import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb,
  CheckCircle,
  Sliders,
  Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import SavingsGoals from './SavingsGoals';

const BudgetAllocator = () => {
  const [subTab, setSubTab] = useState('allocate'); // 'allocate' or 'goals'
  
  const { user } = useAuth();
  const { budget, updateBudget, generateAIBudget } = useFinance();

  // Inputs State
  const [salary, setSalary] = useState('');
  const [rent, setRent] = useState('');
  const [bills, setBills] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [savingsGoals, setSavingsGoals] = useState('');

  const [loading, setLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [applied, setApplied] = useState(false);

  // Sync with current user salary on load
  useEffect(() => {
    if (user) {
      setSalary(user.salary || 50000);
      setRent(Math.round((user.salary || 50000) * 0.25));
      setBills(Math.round((user.salary || 50000) * 0.08));
      setLifestyle(Math.round((user.salary || 50000) * 0.15));
      setSavingsGoals(Math.round((user.salary || 50000) * 0.12));
    }
  }, [user]);

  // Sync if a budget already exists in DB
  useEffect(() => {
    if (budget) {
      setSalary(budget.salary);
      setRent(budget.customBreakdown?.rent || '');
      setBills(budget.customBreakdown?.bills || '');
      setLifestyle(budget.customBreakdown?.shopping || '');
    }
  }, [budget]);

  const COLORS = ['#7c3aed', '#3b82f6', '#14b8a6', '#f43f5e', '#f59e0b'];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApplied(false);

    const allocInput = {
      salary: Number(salary),
      rent: Number(rent),
      bills: Number(bills),
      lifestyle: Number(lifestyle),
      savingsGoals: Number(savingsGoals)
    };

    const res = await generateAIBudget(allocInput);
    setLoading(false);

    if (res.success) {
      setAiPlan(res.data);
    } else {
      alert(res.error || 'Failed to generate budget allocation');
    }
  };

  const handleApply = async () => {
    if (!aiPlan) return;
    setLoading(true);
    
    const budgetData = {
      salary: Number(salary),
      allocated: aiPlan.allocated,
      customBreakdown: aiPlan.customBreakdown
    };

    const res = await updateBudget(budgetData);
    setLoading(false);

    if (res.success) {
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } else {
      alert(res.error || 'Failed to apply budget allocations');
    }
  };

  // Convert AI plan allocated counts to Pie data
  const getPieData = () => {
    if (!aiPlan) return [];
    return [
      { name: 'Essentials', value: aiPlan.allocated.essentials },
      { name: 'Savings', value: aiPlan.allocated.savings },
      { name: 'Investments', value: aiPlan.allocated.investments },
      { name: 'Emergency Fund', value: aiPlan.allocated.emergency },
      { name: 'Entertainment', value: aiPlan.allocated.entertainment }
    ];
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub-tab navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        borderBottom: '1px solid var(--border-glass)', 
        paddingBottom: '16px'
      }}>
        <button
          onClick={() => setSubTab('allocate')}
          className="glass-panel-interactive"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: subTab === 'allocate' ? '1px solid var(--border-glass-highlight)' : '1px solid transparent',
            background: subTab === 'allocate' ? 'var(--bg-glass-hover)' : 'transparent',
            color: subTab === 'allocate' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <Sliders size={16} style={{ color: subTab === 'allocate' ? 'var(--accent-purple)' : 'inherit' }} />
          AI Budget Allocator
        </button>
        <button
          onClick={() => setSubTab('goals')}
          className="glass-panel-interactive"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: subTab === 'goals' ? '1px solid var(--border-glass-highlight)' : '1px solid transparent',
            background: subTab === 'goals' ? 'var(--bg-glass-hover)' : 'transparent',
            color: subTab === 'goals' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <Target size={16} style={{ color: subTab === 'goals' ? 'var(--accent-purple)' : 'inherit' }} />
          Savings Goals
        </button>
      </div>

      {subTab === 'allocate' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr',
          gap: '30px',
          marginTop: '10px'
        }}>
          {/* Left Side: Parameters Slider Panel */}
          <form onSubmit={handleGenerate} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
              ⚙️ Budget Parameters
            </h3>

            {/* Salary Input */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Your Monthly Salary (₹)</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="form-input"
                style={{ fontSize: '14px' }}
                required
              />
            </div>

            {/* Rent Slider */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Rent Target</label>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-purple)' }}>₹{Number(rent || 0).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={salary ? Math.round(salary * 0.6) : 30000}
                step="500"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                className="custom-slider"
              />
            </div>

            {/* Bills Slider */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Utility Bills Target</label>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-purple)' }}>₹{Number(bills || 0).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={salary ? Math.round(salary * 0.3) : 15000}
                step="200"
                value={bills}
                onChange={(e) => setBills(e.target.value)}
                className="custom-slider"
              />
            </div>

            {/* Lifestyle Slider */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Lifestyle Expenses Target</label>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-purple)' }}>₹{Number(lifestyle || 0).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={salary ? Math.round(salary * 0.4) : 20000}
                step="500"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                className="custom-slider"
              />
            </div>

            {/* Savings Target Slider */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Savings Goal Commitment</label>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-purple)' }}>₹{Number(savingsGoals || 0).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={salary ? Math.round(salary * 0.4) : 20000}
                step="200"
                value={savingsGoals}
                onChange={(e) => setSavingsGoals(e.target.value)}
                className="custom-slider"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', gap: '10px', marginTop: '10px' }}
              disabled={loading}
            >
              <Sparkles size={16} />
              {loading ? 'AI Allocating...' : 'Generate AI Allocation'}
            </button>
          </form>

          {/* Right Side: AI Budget Output Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {aiPlan ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>✨ Custom AI Budget Allocation</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Fully optimized 5-tier cash distribution plan</p>
                  </div>
                  <button
                    onClick={handleApply}
                    className={applied ? 'btn btn-success' : 'btn btn-primary'}
                    style={{ padding: '8px 20px', fontSize: '13px', marginLeft: 'auto' }}
                    disabled={loading}
                  >
                    {applied ? (
                      <>
                        <CheckCircle size={14} /> Applied!
                      </>
                    ) : (
                      'Apply AI Budget'
                    )}
                  </button>
                </div>

                {/* Justification Text Block */}
                <div className="glass-panel" style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.01)',
                  borderLeft: '4px solid var(--accent-purple)',
                  fontSize: '13px',
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={14} style={{ color: 'var(--accent-purple)' }} /> Aura's Planning Report:
                  </div>
                  <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {aiPlan.justification.replace(/### AuraFinance AI Custom Plan:\n/g, '').replace(/\*\*/g, '')}
                  </p>
                </div>

                {/* Chart & Distribution Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                  {/* Recharts Pie Preview */}
                  <div style={{ height: '180px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Salary</p>
                      <h5 style={{ fontSize: '14px', fontWeight: 700 }}>₹{salary.toLocaleString()}</h5>
                    </div>
                  </div>

                  {/* Distribution Cards Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getPieData().map((item, idx) => (
                      <div
                        key={idx}
                        className="glass-panel"
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          ₹{item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 0',
                color: 'var(--text-muted)',
                gap: '16px'
              }}>
                <Sparkles size={38} style={{ color: 'var(--accent-purple)', opacity: 0.8 }} />
                <div>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>Aura AI Allocation System</h4>
                  <p style={{ fontSize: '12px', marginTop: '6px', maxWidth: '360px', marginInline: 'auto' }}>
                    Set your parameters on the left and generate a custom AI salary budget. Once applied, Aura tracks compliance in real-time on your dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <SavingsGoals />
        </div>
      )}

    </div>
  );
};

export default BudgetAllocator;
