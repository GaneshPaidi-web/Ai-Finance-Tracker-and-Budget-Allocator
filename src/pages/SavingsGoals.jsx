import { useState } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar,
  Sparkles,
  Award,
  CircleDollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';

const SavingsGoals = () => {
  const { goals, addGoal, editGoal, deleteGoal } = useFinance();

  // Create Goal Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSaved, setCurrentSaved] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('General');

  // Custom date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  const [loading, setLoading] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [saveAmountInput, setSaveAmountInput] = useState('');

  // Date utilities
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateString = (str) => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const d = new Date(year, month, day);
        if (d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) {
          return d;
        }
      }
    }
    return null;
  };

  const getDaysInPickerMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };


  const categories = ['General', 'Home', 'Vehicle', 'Travel', 'Retirement', 'Emergency Fund', 'Gadgets'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || Number(targetAmount) <= 0) {
      alert('Please fill out the savings goal requirements');
      return;
    }

    setLoading(true);
    let parsedDate = parseDateString(targetDate);
    if (targetDate && !parsedDate) {
      alert('Please enter a valid date in dd/mm/yyyy format.');
      setLoading(false);
      return;
    }

    const goalData = {
      name,
      targetAmount: Number(targetAmount),
      currentSaved: Number(currentSaved) || 0,
      targetDate: parsedDate ? parsedDate.toISOString() : new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      category
    };

    const res = await addGoal(goalData);

    setLoading(false);

    if (res.success) {
      // Clear form
      setName('');
      setTargetAmount('');
      setCurrentSaved('0');
      setTargetDate('');
      setCategory('General');
      
      // If initially complete, launch confetti
      if (goalData.currentSaved >= goalData.targetAmount) {
        triggerConfetti();
      }
    } else {
      alert(res.error || 'Failed to save savings goal');
    }
  };

  const handleAddFunds = async (goal) => {
    if (!saveAmountInput || Number(saveAmountInput) <= 0) return;
    
    setLoading(true);
    const newSaved = Number(goal.currentSaved) + Number(saveAmountInput);
    
    const res = await editGoal(goal._id, {
      ...goal,
      currentSaved: newSaved
    });
    setLoading(false);

    if (res.success) {
      setSaveAmountInput('');
      setActiveGoalId(null);
      
      // Trigger confetti if goal gets completed
      if (newSaved >= goal.targetAmount && goal.currentSaved < goal.targetAmount) {
        triggerConfetti();
      }
    } else {
      alert(res.error || 'Failed to update goal funds');
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '30px'
      }}>
        {/* Left Side: Create Goal Form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
            🎯 Set Savings Goal
          </h3>

          {/* Goal Name */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Electric Scooter, Europe Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
              required
            />
          </div>

          {/* Target Amount */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Target Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 150000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
              required
            />
          </div>

          {/* Initial Saved */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Currently Saved (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={currentSaved}
              onChange={(e) => setCurrentSaved(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Target Date with Custom Picker */}
          <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
            <label className="input-label">Target Date (dd/mm/yyyy)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '12px', paddingRight: '38px', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={() => { setShowDatePicker(!showDatePicker); setPickerMonth(parseDateString(targetDate) || new Date()); }}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: 'var(--accent-purple)', display: 'flex', alignItems: 'center'
                }}
              >
                <Calendar size={15} />
              </button>
            </div>

            {/* Inline Calendar Picker Dropdown */}
            {showDatePicker && (
              <div style={{
                position: 'absolute', top: '68px', left: 0, zIndex: 200,
                background: 'var(--bg-deep)', border: '1px solid var(--border-glass-highlight)',
                borderRadius: 'var(--radius-lg)', padding: '14px', width: '240px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <button type="button" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {pickerMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button type="button" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                  {['S','M','T','W','T','F','S'].map((h, i) => (
                    <span key={i} style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 0', fontWeight: 600 }}>{h}</span>
                  ))}
                  {getDaysInPickerMonth(pickerMonth).map((d, i) => (
                    d ? (
                      <button
                        key={i} type="button"
                        onClick={() => { setTargetDate(formatDate(d)); setShowDatePicker(false); }}
                        style={{
                          background: formatDate(d) === targetDate ? 'var(--accent-purple)' : 'none',
                          border: 'none', borderRadius: '6px', color: formatDate(d) === targetDate ? '#fff' : 'var(--text-primary)',
                          fontSize: '11px', padding: '5px 2px', cursor: 'pointer', fontWeight: 500
                        }}
                      >{d.getDate()}</button>
                    ) : <span key={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Category Group</label>
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', gap: '8px', marginTop: '10px' }}
            disabled={loading}
          >
            <Plus size={16} />
            Start Savings Tracker
          </button>
        </form>

        {/* Right Side: Goals Active List */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
            🏁 Active Wealth Accumulators
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {goals && goals.length > 0 ? (
              goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentSaved / goal.targetAmount) * 100));
                const isCompleted = goal.currentSaved >= goal.targetAmount;
                const isAdding = activeGoalId === goal._id;

                return (
                  <div
                    key={goal._id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      borderLeft: isCompleted ? '4px solid var(--accent-teal)' : '4px solid var(--accent-amber)',
                      background: isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255, 255, 255, 0.01)'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{goal.name}</h4>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {goal.category}
                        </span>
                        {goal.targetDate && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} />
                            Deadline: {formatDate(goal.targetDate)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteGoal(goal._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', hover: { color: 'var(--accent-rose)' } }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Progress Track */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', width: '100%' }}>
                        <span>Target Progress</span>
                        <span style={{ fontWeight: 600, color: isCompleted ? 'var(--accent-teal)' : 'var(--accent-amber)', marginLeft: 'auto' }}>
                          {percent}%
                        </span>
                      </div>
                      
                      <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: isCompleted ? 'var(--grad-success)' : 'var(--grad-gold)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease-out'
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Saved: ₹{goal.currentSaved.toLocaleString()}</span>
                        <span>Goal: ₹{goal.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Add Funds Panel */}
                    {isAdding ? (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="number"
                          placeholder="₹ Amount"
                          value={saveAmountInput}
                          onChange={(e) => setSaveAmountInput(e.target.value)}
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          required
                        />
                        <button
                          onClick={() => handleAddFunds(goal)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setActiveGoalId(null); setSaveAmountInput(''); }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      !isCompleted && (
                        <button
                          onClick={() => setActiveGoalId(goal._id)}
                          className="btn btn-secondary"
                          style={{ width: '100%', padding: '8px 0', fontSize: '12px', gap: '4px', marginTop: '6px' }}
                        >
                          <CircleDollarSign size={13} />
                          Add Goal Funds
                        </button>
                      )
                    )}

                    {/* Completed Banner */}
                    {isCompleted && (
                      <div style={{
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--accent-teal)',
                        fontWeight: 600
                      }}>
                        <Award size={14} /> Goal Achieved! 🎉
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                No active savings goals tracked. Formulate one on the left to start!
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SavingsGoals;
