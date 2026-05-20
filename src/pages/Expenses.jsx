import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Search, 
  Calendar,
  Wallet,
  Tag,
  Undo,
  Receipt,
  CreditCard,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import Subscriptions from './Subscriptions';

const Expenses = () => {
  const [subTab, setSubTab] = useState('daily'); // 'daily', 'income', or 'recurring'

  const { 
    transactions, 
    addTransaction, 
    editTransaction, 
    deleteTransaction,
    autoCategorizeDescription 
  } = useFinance();

  // ─── Expense Form State ───
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expPaymentMethod, setExpPaymentMethod] = useState('Cash');
  const [expNotes, setExpNotes] = useState('');

  // ─── Income Form State ───
  const [incAmount, setIncAmount] = useState('');
  const [incCategory, setIncCategory] = useState('Salary');
  const [incPaymentMethod, setIncPaymentMethod] = useState('Bank Transfer');
  const [incNotes, setIncNotes] = useState('');

  // ─── Shared Date State ───
  const today = new Date();
  const todayFormatted = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
  const [date, setDate] = useState(todayFormatted);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
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
        if (d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return d;
      }
    }
    return null;
  };

  const getDaysInPickerMonth = (d) => {
    const year = d.getFullYear(), month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
    return days;
  };
  
  // ─── AI NLP Quick Bar State ───
  const [aiText, setAiText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  // ─── Editing state ───
  const [editingId, setEditingId] = useState(null);

  // ─── Expense Filters ───
  const [expFilterCategory, setExpFilterCategory] = useState('All');
  const [expFilterPayment, setExpFilterPayment] = useState('All');
  const [expSearchTerm, setExpSearchTerm] = useState('');

  // ─── Income Filters ───
  const [incFilterCategory, setIncFilterCategory] = useState('All');
  const [incFilterPayment, setIncFilterPayment] = useState('All');
  const [incSearchTerm, setIncSearchTerm] = useState('');

  const expenseCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Investments', 'Others'];
  const expensePaymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

  const incomeCategories = ['Salary', 'Bonus', 'Freelance / Side Gig', 'Investments / Dividends', 'Gifts', 'Refunds', 'Others'];
  const incomePaymentMethods = ['Bank Transfer', 'UPI', 'Cash', 'Card'];

  // ─── Expense AI Parse ───
  const handleExpenseAIParse = async (e) => {
    e.preventDefault();
    if (!aiText || aiText.trim() === '') return;
    setAiParsing(true);
    setAiFeedback('');
    const res = await autoCategorizeDescription(aiText);
    setAiParsing(false);
    if (res.success) {
      const { amount: extractedAmt, category: extractedCat, notes: extractedNotes } = res.data;
      setExpAmount(extractedAmt || '');
      setExpCategory(extractedCat || 'Others');
      setExpNotes(extractedNotes || '');
      setAiFeedback(`✨ AI Extracted: Category: ${extractedCat} | Amount: ₹${extractedAmt} | Note: "${extractedNotes}"! Review and save below.`);
      setAiText('');
    } else {
      setAiFeedback('❌ Failed to parse. Try e.g. "Swiggy order ₹450"');
    }
  };

  // ─── Income AI Parse ───
  const handleIncomeAIParse = async (e) => {
    e.preventDefault();
    if (!aiText || aiText.trim() === '') return;
    setAiParsing(true);
    setAiFeedback('');
    const res = await autoCategorizeDescription(aiText);
    setAiParsing(false);
    if (res.success) {
      const { amount: extractedAmt, category: extractedCat, notes: extractedNotes } = res.data;
      setIncAmount(extractedAmt || '');
      setIncCategory(extractedCat || 'Others');
      setIncNotes(extractedNotes || '');
      setAiFeedback(`✨ AI Extracted: Category: ${extractedCat} | Amount: ₹${extractedAmt} | Note: "${extractedNotes}"! Review and save below.`);
      setAiText('');
    } else {
      setAiFeedback('❌ Failed to parse. Try e.g. "Received bonus ₹5000"');
    }
  };

  // ─── Expense Form Submit ───
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const parsedDate = parseDateString(date);
    if (!parsedDate) {
      alert('Please enter a valid date in dd/mm/yyyy format.');
      return;
    }
    const txData = {
      amount: Number(expAmount),
      type: 'expense',
      category: expCategory,
      paymentMethod: expPaymentMethod,
      notes: expNotes || `${expCategory} expense`,
      date: parsedDate.toISOString(),
      isRecurring: false
    };
    let res;
    if (editingId) {
      res = await editTransaction(editingId, txData);
    } else {
      res = await addTransaction(txData);
    }
    if (res.success) {
      setExpAmount('');
      setExpNotes('');
      setEditingId(null);
      setAiFeedback('');
      setDate(todayFormatted);
    } else {
      alert(res.error || 'Failed to save transaction');
    }
  };

  // ─── Income Form Submit ───
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incAmount || Number(incAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const parsedDate = parseDateString(date);
    if (!parsedDate) {
      alert('Please enter a valid date in dd/mm/yyyy format.');
      return;
    }
    const txData = {
      amount: Number(incAmount),
      type: 'income',
      category: incCategory,
      paymentMethod: incPaymentMethod,
      notes: incNotes || `${incCategory} income`,
      date: parsedDate.toISOString(),
      isRecurring: false
    };
    let res;
    if (editingId) {
      res = await editTransaction(editingId, txData);
    } else {
      res = await addTransaction(txData);
    }
    if (res.success) {
      setIncAmount('');
      setIncNotes('');
      setEditingId(null);
      setAiFeedback('');
      setDate(todayFormatted);
    } else {
      alert(res.error || 'Failed to save transaction');
    }
  };

  // ─── Edit handlers ───
  const handleExpenseEditClick = (tx) => {
    setEditingId(tx._id);
    setExpAmount(tx.amount);
    setExpCategory(tx.category);
    setExpPaymentMethod(tx.paymentMethod);
    setExpNotes(tx.notes);
    setDate(formatDate(tx.date));
    setAiFeedback('✏️ Editing mode enabled.');
  };

  const handleIncomeEditClick = (tx) => {
    setEditingId(tx._id);
    setIncAmount(tx.amount);
    setIncCategory(tx.category);
    setIncPaymentMethod(tx.paymentMethod);
    setIncNotes(tx.notes);
    setDate(formatDate(tx.date));
    setAiFeedback('✏️ Editing mode enabled.');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setExpAmount('');
    setExpNotes('');
    setIncAmount('');
    setIncNotes('');
    setAiFeedback('');
    setDate(todayFormatted);
  };

  // ─── Filtered transactions ───
  const filteredExpenses = transactions.filter(t => {
    const isExpense = t.type === 'expense';
    const matchCat = expFilterCategory === 'All' || t.category === expFilterCategory;
    const matchPay = expFilterPayment === 'All' || t.paymentMethod === expFilterPayment;
    const matchSearch = expSearchTerm === '' || 
      t.notes.toLowerCase().includes(expSearchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(expSearchTerm.toLowerCase());
    return isExpense && matchCat && matchPay && matchSearch;
  });

  const filteredIncomes = transactions.filter(t => {
    const isIncome = t.type === 'income';
    const matchCat = incFilterCategory === 'All' || t.category === incFilterCategory;
    const matchPay = incFilterPayment === 'All' || t.paymentMethod === incFilterPayment;
    const matchSearch = incSearchTerm === '' || 
      t.notes.toLowerCase().includes(incSearchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(incSearchTerm.toLowerCase());
    return isIncome && matchCat && matchPay && matchSearch;
  });

  // ─── Summary Stats ───
  const totalExpenses = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncomes = filteredIncomes.reduce((sum, t) => sum + t.amount, 0);

  // ─── Shared Calendar Picker Component ───
  const renderDatePicker = () => (
    <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
      <label className="input-label">Transaction Date (dd/mm/yyyy)</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="dd/mm/yyyy"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '12px', paddingRight: '38px', fontSize: '13px' }}
          required
        />
        <button
          type="button"
          onClick={() => { setShowDatePicker(!showDatePicker); setPickerMonth(parseDateString(date) || new Date()); }}
          style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: 'var(--accent-purple)', display: 'flex', alignItems: 'center'
          }}
        >
          <Calendar size={15} />
        </button>
      </div>
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
                  onClick={() => { setDate(formatDate(d)); setShowDatePicker(false); }}
                  style={{
                    background: formatDate(d) === date ? 'var(--accent-purple)' : 'none',
                    border: 'none', borderRadius: '6px',
                    color: formatDate(d) === date ? '#fff' : 'var(--text-primary)',
                    fontSize: '11px', padding: '5px 2px', cursor: 'pointer', fontWeight: 500
                  }}
                >{d.getDate()}</button>
              ) : <span key={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub-tab navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        padding: '6px',
        background: 'var(--bg-glass)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        width: 'fit-content'
      }}>
        {[
          { id: 'daily', label: 'Expenses', icon: ArrowUpRight, color: 'var(--accent-rose)' },
          { id: 'income', label: 'Income', icon: ArrowDownLeft, color: 'var(--accent-teal)' },
          { id: 'recurring', label: 'Subscriptions', icon: CreditCard, color: 'var(--accent-purple)' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setSubTab(tab.id); setEditingId(null); setAiFeedback(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={15} style={{ color: isActive ? tab.color : 'inherit' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* EXPENSES TAB */}
      {/* ═══════════════════════════════════════ */}
      {subTab === 'daily' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr',
          gap: '30px',
          marginTop: '10px'
        }}>
          {/* Left Side: Create / Edit Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick NLP Box */}
            {!editingId && (
              <form onSubmit={handleExpenseAIParse} className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-rose)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-rose)' }} />
                  Quick AI Expense Entry
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy order ₹450 or Uber ride Rs 350"
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '13px', padding: '10px 14px' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    disabled={aiParsing}
                  >
                    {aiParsing ? 'Extracting...' : 'Parse'}
                  </button>
                </div>
              </form>
            )}

            {/* Core Expense Form */}
            <form onSubmit={handleExpenseSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                <ArrowUpRight size={18} style={{ color: 'var(--accent-rose)' }} />
                {editingId ? 'Edit Expense' : 'Add Expense'}
              </h3>

              {/* AI Feedback Tag */}
              {aiFeedback && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  {aiFeedback}
                </div>
              )}

              {/* Amount */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <Wallet size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', fontSize: '14px' }}
                    required
                  />
                </div>
              </div>

              {/* Category & Payment Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="form-select"
                      style={{ paddingLeft: '38px', fontSize: '13px' }}
                    >
                      {expenseCategories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Payment Method</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '13px' }}
                  >
                    {expensePaymentMethods.map((pm, idx) => (
                      <option key={idx} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              {renderDatePicker()}

              {/* Notes */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. DMart grocery purchase"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: '14px' }}>
                  {editingId ? 'Save Edits' : 'Save Expense'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '13px' }}>
                    <Undo size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Side: Filters & Transaction History Table */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
            
            {/* Summary card */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.15)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Expenses (filtered)</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-rose)' }}>₹{totalExpenses.toLocaleString()}</p>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Header Search bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={expSearchTerm}
                  onChange={(e) => setExpSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px', fontSize: '13px', padding: '10px 14px 10px 38px' }}
                />
              </div>
            </div>

            {/* Quick Filter buttons */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-glass)'
            }}>
              <select
                value={expFilterCategory}
                onChange={(e) => setExpFilterCategory(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '6px 24px 6px 12px', fontSize: '12px', height: '32px', borderRadius: '16px' }}
              >
                <option value="All">All Categories</option>
                {expenseCategories.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
              </select>

              <select
                value={expFilterPayment}
                onChange={(e) => setExpFilterPayment(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '6px 24px 6px 12px', fontSize: '12px', height: '32px', borderRadius: '16px' }}
              >
                <option value="All">All Payments</option>
                {expensePaymentMethods.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
              </select>
            </div>

            {/* History Table */}
            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {filteredExpenses.length > 0 ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Notes</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((tx) => (
                      <tr key={tx._id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {formatDate(tx.date)}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-glass)'
                          }}>
                            {tx.category}
                          </span>
                        </td>
                        <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.notes}
                        </td>
                        <td style={{ fontSize: '12px' }}>{tx.paymentMethod}</td>
                        <td>
                          <span className="badge badge-expense">
                            -₹{tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleExpenseEditClick(tx)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => deleteTransaction(tx._id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  No expense records found matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* INCOME TAB */}
      {/* ═══════════════════════════════════════ */}
      {subTab === 'income' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr',
          gap: '30px',
          marginTop: '10px'
        }}>
          {/* Left Side: Income Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick NLP Box */}
            {!editingId && (
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-teal)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-teal)' }}>
                  <Sparkles size={16} />
                  Quick AI Income Entry
                </h3>
                <form onSubmit={handleIncomeAIParse} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text"
                    placeholder="e.g. Received freelance payment ₹15000"
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '0 18px', fontSize: '13px', whiteSpace: 'nowrap', background: 'var(--accent-teal)' }}
                    disabled={aiParsing || !aiText}
                  >
                    {aiParsing ? 'Parsing...' : 'Auto-Fill'}
                  </button>
                </form>
                {aiFeedback && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: aiFeedback.includes('❌') ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                    {aiFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Income Form */}
            <form onSubmit={handleIncomeSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                <ArrowDownLeft size={18} style={{ color: 'var(--accent-teal)' }} />
                {editingId ? 'Edit Income' : 'Record New Income'}
              </h3>

              {/* AI Feedback */}
              {aiFeedback && editingId && (
                <div style={{
                  background: 'rgba(20, 184, 166, 0.08)',
                  border: '1px solid rgba(20, 184, 166, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}>
                  {aiFeedback}
                </div>
              )}

              {/* Amount & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Amount (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <Wallet size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="5000"
                      value={incAmount}
                      onChange={(e) => setIncAmount(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '38px', fontSize: '14px' }}
                      required
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <select
                      value={incCategory}
                      onChange={(e) => setIncCategory(e.target.value)}
                      className="form-select"
                      style={{ paddingLeft: '38px', fontSize: '13px' }}
                    >
                      {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Received Via</label>
                  <select
                    value={incPaymentMethod}
                    onChange={(e) => setIncPaymentMethod(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '13px' }}
                  >
                    {incomePaymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {renderDatePicker()}
              </div>

              {/* Notes */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Bonus, Freelance project"
                  value={incNotes}
                  onChange={(e) => setIncNotes(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                  maxLength={50}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: '14px', background: editingId ? 'var(--accent-amber)' : 'var(--accent-teal)' }}>
                  {editingId ? 'Update Income' : 'Add Income'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '13px' }}>
                    <Undo size={14} /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Side: Income History */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
            
            {/* Summary card */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'rgba(20, 184, 166, 0.06)',
              border: '1px solid rgba(20, 184, 166, 0.15)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Income (filtered)</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-teal)' }}>₹{totalIncomes.toLocaleString()}</p>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {filteredIncomes.length} transaction{filteredIncomes.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search incomes..."
                  value={incSearchTerm}
                  onChange={(e) => setIncSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px', fontSize: '13px', padding: '10px 14px 10px 38px' }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-glass)'
            }}>
              <select
                value={incFilterCategory}
                onChange={(e) => setIncFilterCategory(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '6px 24px 6px 12px', fontSize: '12px', height: '32px', borderRadius: '16px' }}
              >
                <option value="All">All Categories</option>
                {incomeCategories.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
              </select>

              <select
                value={incFilterPayment}
                onChange={(e) => setIncFilterPayment(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '6px 24px 6px 12px', fontSize: '12px', height: '32px', borderRadius: '16px' }}
              >
                <option value="All">All Methods</option>
                {incomePaymentMethods.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Income Cards */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              overflowY: 'auto',
              maxHeight: '380px',
              paddingRight: '6px'
            }}>
              {filteredIncomes.length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Wallet size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>No incomes found</p>
                  <p style={{ fontSize: '13px' }}>Try adjusting your filters or record a new income.</p>
                </div>
              ) : (
                filteredIncomes.map(tx => (
                  <div key={tx._id} className="glass-panel-interactive" style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-glass)'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(20, 184, 166, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-teal)'
                      }}>
                        <Wallet size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                          {tx.notes || tx.category}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {formatDate(tx.date)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Tag size={12} /> {tx.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-teal)' }}>
                        +₹{tx.amount?.toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleIncomeEditClick(tx)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this income?')) {
                              deleteTransaction(tx._id);
                            }
                          }}
                          style={{
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '6px',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* SUBSCRIPTIONS TAB */}
      {/* ═══════════════════════════════════════ */}
      {subTab === 'recurring' && (
        <div style={{ marginTop: '10px' }}>
          <Subscriptions />
        </div>
      )}

    </div>
  );
};

export default Expenses;
