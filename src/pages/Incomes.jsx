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
  TrendingUp
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const Incomes = () => {
  const { 
    transactions, 
    addTransaction, 
    editTransaction, 
    deleteTransaction,
    autoCategorizeDescription 
  } = useFinance();

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  // Custom date picker state — use dd/mm/yyyy format
  const today = new Date();
  const todayFormatted = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
  const [date, setDate] = useState(todayFormatted);

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
  
  // AI NLP Quick Bar State
  const [aiText, setAiText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);

  // Filters State
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Salary', 'Bonus', 'Freelance / Side Gig', 'Investments / Dividends', 'Gifts', 'Refunds', 'Others'];
  const paymentMethods = ['Bank Transfer', 'UPI', 'Cash', 'Card'];

  // Handle Quick AI Auto Categorization
  const handleAIParse = async (e) => {
    e.preventDefault();
    if (!aiText || aiText.trim() === '') return;

    setAiParsing(true);
    setAiFeedback('');

    const res = await autoCategorizeDescription(aiText);
    setAiParsing(false);

    if (res.success) {
      const { amount: extractedAmt, category: extractedCat, notes: extractedNotes } = res.data;
      
      setAmount(extractedAmt || '');
      setCategory(extractedCat || 'Others');
      setNotes(extractedNotes || '');
      
      setAiFeedback(`✨ AI Extracted: Category: ${extractedCat} | Amount: ₹${extractedAmt} | Note: "${extractedNotes}"! Review and save below.`);
      setAiText('');
    } else {
      setAiFeedback('❌ Failed to parse. Try e.g. "Received bonus ₹5000"');
    }
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const parsedDate = parseDateString(date);
    if (!parsedDate) {
      alert('Please enter a valid date in dd/mm/yyyy format.');
      return;
    }

    const txData = {
      amount: Number(amount),
      type: 'income',
      category,
      paymentMethod,
      notes: notes || `${category} income`,
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
      setAmount('');
      setNotes('');
      setEditingId(null);
      setAiFeedback('');
      setDate(todayFormatted);
    } else {
      alert(res.error || 'Failed to save transaction');
    }
  };

  const handleEditClick = (tx) => {
    setEditingId(tx._id);
    setAmount(tx.amount);
    setCategory(tx.category);
    setPaymentMethod(tx.paymentMethod);
    setNotes(tx.notes);
    setDate(formatDate(tx.date));
    setAiFeedback('✏️ Editing mode enabled.');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setNotes('');
    setAiFeedback('');
    setDate(todayFormatted);
  };

  // Process filters (only show income type transactions)
  const filteredTransactions = transactions.filter(t => {
    const isIncome = t.type === 'income';
    const matchCat = filterCategory === 'All' || t.category === filterCategory;
    const matchPay = filterPayment === 'All' || t.paymentMethod === filterPayment;
    const matchSearch = searchTerm === '' || 
      t.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    return isIncome && matchCat && matchPay && matchSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '30px',
        marginTop: '10px'
      }}>
        {/* Left Side: Create / Edit Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick NLP Box */}
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-blue)' }}>
              <Sparkles size={18} /> Quick AI Income Entry
            </h3>
            <form onSubmit={handleAIParse} style={{ display: 'flex', gap: '10px' }}>
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
                style={{ padding: '0 20px', height: '40px', background: 'var(--accent-blue)' }}
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

          {/* Detailed Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-teal)' }} />
              {editingId ? 'Edit Income Transaction' : 'Record New Income'}
            </h3>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: 'var(--text-primary)' }}>Amount (₹)</label>
                  <input 
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                    placeholder="5000"
                  />
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <label className="input-label" style={{ color: 'var(--text-primary)' }}>Date (dd/mm/yyyy)</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="form-input"
                      style={{ paddingLeft: '38px', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: 'var(--text-primary)' }}>Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: 'var(--text-primary)' }}>Received Via</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-select"
                  >
                    {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: 'var(--text-primary)' }}>Description / Notes</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Diwali Bonus"
                  maxLength={50}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: editingId ? 'var(--accent-amber)' : 'var(--accent-teal)' }}>
                  {editingId ? 'Update Income' : 'Add Income'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ flex: 1 }}>
                    <Undo size={16} /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: List & Filters */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Income History</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Search incomes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '12px', height: '32px', width: '160px' }}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Filter by Category</label>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="form-select"
                style={{ fontSize: '12px', padding: '6px 12px', height: '32px' }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Filter by Received Via</label>
              <select 
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="form-select"
                style={{ fontSize: '12px', padding: '6px 12px', height: '32px' }}
              >
                <option value="All">All Methods</option>
                {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            overflowY: 'auto',
            maxHeight: '500px',
            paddingRight: '6px'
          }}>
            {filteredTransactions.length === 0 ? (
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
              filteredTransactions.map(tx => (
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
                        onClick={() => handleEditClick(tx)}
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
    </div>
  );
};

export default Incomes;
