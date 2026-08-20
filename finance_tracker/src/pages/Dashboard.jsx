import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Award, 
  Lightbulb,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const SAVING_TIPS = [
  { title: "UPI Payment cashback", tip: "Scan code on checkout on merchants to save flat ₹10 on your purchase!" },
  { title: "Zomato/Swiggy Billing Hacks", tip: "Pay using card promos to save flat ₹30-50 on dining orders." },
  { title: "Annual billing perk", tip: "Billing annually for streaming services like Spotify saves up to 30% over monthly payments." },
  { title: "Store-Brand Grocery Bargains", tip: "Buying local store-brand essentials instead of premium brands saves ₹100+ weekly." },
  { title: "Local farmer markets", tip: "Shop fresh produce at local farmer markets rather than supermarkets to save 15-20%." },
  { title: "The 48-Hour Cart Rule", tip: "Leave e-commerce items in your cart for 48 hours. If you still want them then, purchase. Saves ₹500/mo." }
];
const ENCOURAGEMENTS = [
  "Fantastic job! Your variable spending is 12% lower than last week! Keep it up!",
  "You are on track to meet your savings goals early this month!",
  "Aura is proud of you! You avoided unnecessary spending for 3 consecutive days.",
  "Keep going! Small adjustments today create massive wealth compounding tomorrow."
];

const Dashboard = ({ setActiveTab }) => {
  const { user, updateProfile } = useAuth();
  const { 
    transactions, 
    goals, 
    budget, 
    insights, 
    editGoal, 
    subscriptions, 
    editSubscription, 
    fetchAllFinanceData 
  } = useFinance();

  const [totalSalary, setTotalSalary] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  
  const [savingsTotalTarget, setSavingsTotalTarget] = useState(0);
  const [savingsTotalSaved, setSavingsTotalSaved] = useState(0);
  
  const [areaData, setAreaData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);

  // Tips & Encouragement State
  const [savingTip, setSavingTip] = useState(SAVING_TIPS[0]);
  const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS[0]);

  // Live clock and mini calendar states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Prev month overlap
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        day: prevLastDay - i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevLastDay - i + 1)
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // Next month overlap
    const totalDaysSoFar = days.length;
    const remainingDays = 42 - totalDaysSoFar;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  const getEventsForDate = (dateObj) => {
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const dateEvents = [];
    
    // 1. Salary Credit Day
    if (user && user.salaryDate === day) {
      dateEvents.push({
        type: 'salary',
        title: 'Salary Credit Day 💰',
        details: `Monthly salary of ₹${(user.salary || 50000).toLocaleString()} is credited.`
      });
    }
    
    // 2. Subscriptions Due
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.filter(s => s.isActive).forEach(sub => {
        if (sub.dueDate === day) {
          dateEvents.push({
            type: 'subscription',
            title: `Bill Due: ${sub.name} 💳`,
            details: `Subscription charge of ₹${sub.amount.toLocaleString()} is billed.`
          });
        }
      });
    }
    
    // 3. Goal Deadlines
    if (goals && goals.length > 0) {
      goals.forEach(goal => {
        if (goal.targetDate) {
          const gDate = new Date(goal.targetDate);
          if (gDate.getDate() === day && gDate.getMonth() === month && gDate.getFullYear() === year) {
            dateEvents.push({
              type: 'goal',
              title: `Goal Deadline: ${goal.name} 🎯`,
              details: `Target: ₹${goal.targetAmount.toLocaleString()} | Current Saved: ₹${goal.currentSaved.toLocaleString()}`
            });
          }
        }
      });
    }
    
    // 4. Logged Transactions
    if (transactions && transactions.length > 0) {
      transactions.forEach(tx => {
        if (tx.date) {
          const txDate = new Date(tx.date);
          if (txDate.getDate() === day && txDate.getMonth() === month && txDate.getFullYear() === year) {
            dateEvents.push({
              type: tx.type,
              title: `${tx.notes || tx.category} ${tx.type === 'income' ? '📈' : '📉'}`,
              details: `${tx.type === 'income' ? '+' : '-'}₹${tx.amount.toLocaleString()} (${tx.category}) via ${tx.paymentMethod}`
            });
          }
        }
      });
    }
    
    return dateEvents;
  };

  // Calendar & Schedule Configurations States
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTab, setCalendarTab] = useState('logs'); // 'logs' or 'configure'
  const [localSalaryDate, setLocalSalaryDate] = useState('');
  const [localGoalDates, setLocalGoalDates] = useState({});
  const [localSubDates, setLocalSubDates] = useState({});


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const day = new Date().getDate();
    setSavingTip(SAVING_TIPS[day % SAVING_TIPS.length]);
    setEncouragement(ENCOURAGEMENTS[day % ENCOURAGEMENTS.length]);
  }, []);

  useEffect(() => {
    if (user) {
      setLocalSalaryDate(String(user.salaryDate || 1));
    }
  }, [user]);

  useEffect(() => {
    if (goals) {
      const dates = {};
      goals.forEach(g => {
        dates[g._id] = g.targetDate ? formatDate(g.targetDate) : '';
      });
      setLocalGoalDates(dates);
    }
  }, [goals]);

  useEffect(() => {
    if (subscriptions) {
      const dates = {};
      subscriptions.forEach(s => {
        dates[s._id] = String(s.dueDate || 1);
      });
      setLocalSubDates(dates);
    }
  }, [subscriptions]);

  const handleSaveSalaryDate = async () => {
    const day = Number(localSalaryDate);
    if (isNaN(day) || day < 1 || day > 31) {
      alert("Please enter a valid day between 1 and 31.");
      return;
    }
    const res = await updateProfile({ salaryDate: day });
    if (res.success) {
      alert("Salary credit day updated successfully!");
      fetchAllFinanceData();
    }
  };

  const handleSaveGoalDate = async (goalId) => {
    const dateStr = localGoalDates[goalId];
    const parsedDate = parseDateString(dateStr);
    if (!parsedDate) {
      alert("Please enter a valid date in DD/MM/YYYY format.");
      return;
    }
    const res = await editGoal(goalId, { targetDate: parsedDate.toISOString() });
    if (res.success) {
      alert("Goal deadline updated!");
      fetchAllFinanceData();
    }
  };

  const handleSaveSubDate = async (subId) => {
    const day = Number(localSubDates[subId]);
    if (isNaN(day) || day < 1 || day > 31) {
      alert("Please enter a valid billing day between 1 and 31.");
      return;
    }
    const res = await editSubscription(subId, { dueDate: day });
    if (res.success) {
      alert("Subscription due day updated!");
      fetchAllFinanceData();
    }
  };


  // Process data for widgets and charts
  useEffect(() => {
    // 1. Calculate Widgets
    const salary = user?.salary || 0;
    setTotalSalary(salary);

    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    setTotalExpenses(currentMonthExpenses);
    
    setRemainingBalance(salary - currentMonthExpenses);

    // 2. Savings Progress
    if (goals && goals.length > 0) {
      const targetSum = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
      const savedSum = goals.reduce((sum, g) => sum + Number(g.currentSaved), 0);
      setSavingsTotalTarget(targetSum);
      setSavingsTotalSaved(savedSum);
    } else {
      setSavingsTotalTarget(0);
      setSavingsTotalSaved(0);
    }

    // 3. Category Breakdown (Pie Data)
    const categoriesMap = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoriesMap[t.category] = (categoriesMap[t.category] || 0) + Number(t.amount);
      });

    const pieTemp = Object.keys(categoriesMap).map(cat => ({
      name: cat,
      value: categoriesMap[cat]
    }));
    setPieData(pieTemp.length > 0 ? pieTemp : [{ name: 'No Expenses', value: 1 }]);

    // 4. Spending Trend (Area Data - Last 7 unique days of transactions)
    const dailyMap = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const dateLabel = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap[dateLabel] = (dailyMap[dateLabel] || 0) + Number(t.amount);
      });

    const sortedDays = Object.keys(dailyMap).reverse().slice(-7);
    const areaTemp = sortedDays.map(day => ({
      name: day,
      amount: dailyMap[day]
    }));
    setAreaData(areaTemp.length > 0 ? areaTemp : [{ name: 'No Data', amount: 0 }]);

    // 5. Target Compliance (Bar Data)
    if (budget) {
      // Map actual expenses to budget categories:
      // essentials = Rent + Bills + Food + Travel + Healthcare + Others
      // entertainment = Shopping + Entertainment
      // investments = Investments
      // savings = Savings
      
      let actualEssentials = 0;
      let actualEntertainment = 0;
      let actualInvestments = 0;
      
      transactions.filter(t => t.type === 'expense').forEach(t => {
        if (t.category === 'Food' || t.category === 'Travel' || t.category === 'Bills' || t.category === 'Healthcare' || t.category === 'Others') {
          actualEssentials += Number(t.amount);
        } else if (t.category === 'Shopping' || t.category === 'Entertainment') {
          actualEntertainment += Number(t.amount);
        } else if (t.category === 'Investments') {
          actualInvestments += Number(t.amount);
        }
      });

      const barTemp = [
        { name: 'Essentials', Target: budget.allocated.essentials, Spent: actualEssentials },
        { name: 'Investments', Target: budget.allocated.investments, Spent: actualInvestments },
        { name: 'Entertainment', Target: budget.allocated.entertainment, Spent: actualEntertainment }
      ];
      setBarData(barTemp);
    } else {
      setBarData([]);
    }

  }, [transactions, goals, budget, user]);

  const COLORS = ['#7c3aed', '#3b82f6', '#14b8a6', '#f43f5e', '#f59e0b', '#ec4899', '#8b5cf6'];
  const EMPTY_COLORS = ['#1e293b'];

  const getSavingsPercent = () => {
    if (savingsTotalTarget === 0) return 0;
    return Math.min(100, Math.round((savingsTotalSaved / savingsTotalTarget) * 100));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER SECTION WITH CALENDAR TRIGGER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Welcome Back,</span> 
            <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.username || 'Ganesh'}!
            </span>
            <span>✨</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Occupation: <strong style={{ color: 'var(--text-secondary)' }}>{user?.occupation || 'Finance Enthusiast'}</strong> | Place: <strong style={{ color: 'var(--text-secondary)' }}>{user?.place || 'Earth'}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Live Clock — shows to the left of Manage Dates */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              background: 'var(--grad-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.02em',
              lineHeight: 1
            }}>
              {currentTime.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '36px', background: 'var(--border-glass)' }} />

          {/* Manage Dates / Calendar Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                background: showCalendar ? 'var(--bg-glass-active)' : 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
            >
              <CalendarDays size={16} style={{ color: 'var(--accent-purple)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Event Calendar & Clock Widget — only visible when Manage Dates is open */}
      {showCalendar && (
      <div className="glass-panel animate-fade-in" style={{
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '30px',
        textAlign: 'left'
      }}>
        {/* Left Column: Digital Clock & Event details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Financial Ledger System</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-purple)', boxShadow: '0 0 6px var(--accent-purple)' }} />
            </div>
            
            {/* Clock display */}
            <div style={{
              fontSize: '36px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              background: 'var(--grad-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.02em',
              margin: '4px 0'
            }}>
              {currentTime.toLocaleTimeString()}
            </div>
            
            {/* Tab Segment Control */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              marginBottom: '16px',
              gap: '4px'
            }}>
              <button
                onClick={() => setCalendarTab('logs')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: calendarTab === 'logs' ? 'var(--accent-purple)' : 'transparent',
                  color: calendarTab === 'logs' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                📋 Ledger Logs
              </button>
              <button
                onClick={() => setCalendarTab('configure')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: calendarTab === 'configure' ? 'var(--accent-purple)' : 'transparent',
                  color: calendarTab === 'configure' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ⚙️ Configure Dates
              </button>
            </div>
          </div>

          {/* Conditional rendering based on tab selection */}
          {calendarTab === 'logs' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>
                Selected Ledger Date: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(selectedDate)}</span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px', margin: 0 }}>
                📅 Schedule & Logs for this Day
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((evt, idx) => {
                    let badgeColor = 'rgba(255, 255, 255, 0.02)';
                    let textColor = 'var(--text-primary)';
                    let borderColor = 'var(--border-glass)';
                    
                    if (evt.type === 'salary') {
                      badgeColor = 'rgba(16, 185, 129, 0.06)';
                      textColor = 'var(--accent-teal)';
                      borderColor = 'rgba(16, 185, 129, 0.15)';
                    } else if (evt.type === 'subscription') {
                      badgeColor = 'rgba(245, 158, 11, 0.06)';
                      textColor = 'var(--accent-amber)';
                      borderColor = 'rgba(245, 158, 11, 0.15)';
                    } else if (evt.type === 'goal') {
                      badgeColor = 'rgba(124, 58, 237, 0.06)';
                      textColor = 'var(--accent-purple)';
                      borderColor = 'rgba(124, 58, 237, 0.15)';
                    } else if (evt.type === 'expense') {
                      badgeColor = 'rgba(244, 63, 94, 0.06)';
                      textColor = 'var(--accent-rose)';
                      borderColor = 'rgba(244, 63, 94, 0.15)';
                    } else if (evt.type === 'income') {
                      badgeColor = 'rgba(59, 130, 246, 0.06)';
                      textColor = 'var(--accent-blue)';
                      borderColor = 'rgba(59, 130, 246, 0.15)';
                    }

                    return (
                      <div 
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          background: badgeColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: textColor }}>
                          {evt.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {evt.details}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                    No scheduled credits, subscriptions, deadlines, or expense transactions recorded on this day.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px', margin: 0 }}>
                ⚙️ Configure Schedule & Credit Dates
              </h4>
              
              {/* Salary Credit Date Input */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Salary Credit Day of Month (1-31)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    value={localSalaryDate}
                    onChange={(e) => setLocalSalaryDate(e.target.value)}
                    className="form-input"
                    style={{ padding: '6px 12px', fontSize: '13px', flex: 1, height: '32px' }}
                  />
                  <button 
                    onClick={handleSaveSalaryDate}
                    style={{
                      background: 'var(--accent-purple)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={14} style={{ color: '#fff' }} />
                  </button>
                </div>
              </div>

              {/* Goal Deadlines list */}
              {goals && goals.length > 0 && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    Goal Deadlines (dd/mm/yyyy)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {goals.map(goal => (
                      <div key={goal._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-glass)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          🎯 {goal.name}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text"
                            value={localGoalDates[goal._id] || ''}
                            onChange={(e) => setLocalGoalDates({ ...localGoalDates, [goal._id]: e.target.value })}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px', flex: 1, height: '28px' }}
                            placeholder="dd/mm/yyyy"
                          />
                          <button 
                            onClick={() => handleSaveGoalDate(goal._id)}
                            style={{
                              background: 'var(--accent-teal)',
                              border: 'none',
                              borderRadius: '4px',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={12} style={{ color: '#fff' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription Due Days */}
              {subscriptions && subscriptions.length > 0 && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    Subscription Billing Days (1-31)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {subscriptions.map(sub => (
                      <div key={sub._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-glass)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          💳 {sub.name} (₹{sub.amount})
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text"
                            value={localSubDates[sub._id] || ''}
                            onChange={(e) => setLocalSubDates({ ...localSubDates, [sub._id]: e.target.value })}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px', flex: 1, height: '28px' }}
                          />
                          <button 
                            onClick={() => handleSaveSubDate(sub._id)}
                            style={{
                              background: 'var(--accent-amber)',
                              border: 'none',
                              borderRadius: '4px',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={12} style={{ color: '#fff' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Month Calendar grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Calendar Header selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                &larr;
              </button>
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
            {/* Sun-Sat Headers */}
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dHeader, idx) => (
              <span key={idx} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', paddingBottom: '4px' }}>
                {dHeader}
              </span>
            ))}

            {/* Days list */}
            {getDaysInMonth(calendarDate).map((dObj, idx) => {
              const isSelected = selectedDate.getDate() === dObj.date.getDate() && selectedDate.getMonth() === dObj.date.getMonth() && selectedDate.getFullYear() === dObj.date.getFullYear();
              const dateEvents = getEventsForDate(dObj.date);
              
              // Event types detection for dot indicators
              const hasSalary = dateEvents.some(e => e.type === 'salary');
              const hasSub = dateEvents.some(e => e.type === 'subscription');
              const hasGoal = dateEvents.some(e => e.type === 'goal');
              const hasExpense = dateEvents.some(e => e.type === 'expense');
              const hasIncome = dateEvents.some(e => e.type === 'income');

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(dObj.date)}
                  className="glass-panel-interactive"
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: dObj.isCurrentMonth ? 500 : 400,
                    color: isSelected 
                      ? '#fff' 
                      : (dObj.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                    background: isSelected 
                      ? 'var(--grad-primary)' 
                      : (dObj.isCurrentMonth ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.005)'),
                    border: isSelected 
                      ? '1px solid var(--accent-purple)' 
                      : (hasSalary ? '1px solid var(--accent-teal)' : '1px solid var(--border-glass)'),
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '38px',
                    transform: 'none',
                    boxShadow: isSelected ? 'var(--shadow-glow)' : 'none'
                  }}
                >
                  <span>{dObj.day}</span>
                  
                  {/* Event indicators dot bar */}
                  <div style={{ display: 'flex', gap: '2px', marginTop: '2px', position: 'absolute', bottom: '3px' }}>
                    {hasSalary && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-teal)' }} />}
                    {hasSub && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-amber)' }} />}
                    {hasGoal && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-purple)' }} />}
                    {hasExpense && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-rose)' }} />}
                    {hasIncome && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-blue)' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Aura Smart Modules: Budget Allocation Board & Tips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '30px'
      }}>
        {/* Module 1: AI Budget Board */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Award size={18} style={{ color: 'var(--accent-purple)' }} />
            AI Budget Allocation Board
          </h3>
          {budget ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Your current monthly salary allocations to remember and respect:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600, textTransform: 'uppercase' }}>Essentials (50%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>₹{budget.allocated.essentials.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase' }}>Savings (20%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>₹{budget.allocated.savings.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600, textTransform: 'uppercase' }}>Investments (15%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>₹{budget.allocated.investments.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-amber)', fontWeight: 600, textTransform: 'uppercase' }}>Emergency (5%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>₹{budget.allocated.emergency.toLocaleString()}</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.15)', padding: '10px 12px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 600, textTransform: 'uppercase' }}>Entertainment (10%)</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>₹{budget.allocated.entertainment.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '160px', textAlign: 'center' }}>
              <span style={{ fontSize: '28px' }}>📊</span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', margin: 0 }}>
                No active budget setup yet. Set up your monthly goals to view the AI budget board!
              </p>
              <button 
                onClick={() => setActiveTab('budget')}
                className="btn btn-primary"
                style={{ fontSize: '11px', padding: '6px 14px' }}
              >
                Set Up Budget
              </button>
            </div>
          )}
        </div>

        {/* Module 2: Aura's Encouragement & Saving Tips */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between', textAlign: 'left' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Lightbulb size={18} style={{ color: 'var(--accent-amber)' }} />
              Aura's Saving Tip
            </h3>
            <div style={{
              background: 'rgba(245, 158, 11, 0.03)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginTop: '10px'
            }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-amber)', margin: '0 0 4px 0' }}>
                💡 {savingTip.title}
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {savingTip.tip}
              </p>
            </div>
          </div>
          
          <div style={{
            background: 'var(--grad-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-glow)',
            marginTop: 'auto'
          }}>
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Coach Encouragement</div>
              <p style={{ fontSize: '11px', fontWeight: 500, margin: '2px 0 0 0', lineHeight: 1.3 }}>
                "{encouragement}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Dashboard Row: Balance Cards */}
      <div className="dashboard-grid">
        {/* Salary */}
        <div className="glass-panel glow-purple" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(124, 58, 237, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}>
            <Wallet size={20} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Monthly Budget Salary</p>
            <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>₹{totalSalary.toLocaleString()}</h3>
          </div>
        </div>

        {/* Expenses */}
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
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Expenses Logged</p>
            <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>₹{totalExpenses.toLocaleString()}</h3>
          </div>
        </div>

        {/* Balance */}
        <div className="glass-panel glow-teal" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(20, 184, 166, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(20, 184, 166, 0.2)'
          }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-teal)' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Remaining Balance</p>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginTop: '4px',
              color: remainingBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-rose)'
            }}>
              ₹{remainingBalance.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Savings Goal progress card */}
        <div className="glass-panel glow-amber" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justify: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={16} style={{ color: 'var(--accent-amber)' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Savings Progress</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-amber)', marginLeft: 'auto' }}>
              {getSavingsPercent()}%
            </span>
          </div>

          {/* Custom progress track */}
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div style={{
              width: `${getSavingsPercent()}%`,
              height: '100%',
              background: 'var(--grad-gold)',
              borderRadius: '4px',
              transition: 'width 0.5s ease-out'
            }} />
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ₹{savingsTotalSaved.toLocaleString()} of ₹{savingsTotalTarget.toLocaleString()} saved
          </p>
        </div>
      </div>

      {/* 2. AI Budget recommendations block */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)', background: 'rgba(124, 58, 237, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Aura AI Financial Insights</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights && insights.length > 0 ? (
            insights.slice(0, 2).map((ins, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left' }}>
                <Lightbulb size={16} style={{ 
                  color: ins.type === 'danger' ? 'var(--accent-rose)' : ins.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-teal)',
                  marginTop: '3px',
                  flexShrink: 0
                }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{ins.title}:</strong> {ins.text.replace(/\*\*/g, '')}
                </p>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Lightbulb size={16} style={{ color: 'var(--accent-teal)', marginTop: '3px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Your financial profile looks stable! Log more expenses in the **Expenses** tab to trigger deeper AI optimizations and warnings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recharts Section Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.8fr 1.2fr',
        gap: '30px'
      }}>
        {/* Left Side: Expense Trend Area Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 Weekly Spending Trend
          </h3>
          
          <div style={{ width: '100%', height: '300px' }}>
            {transactions.filter(t => t.type === 'expense').length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No expense logged yet. Your trend chart will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Category Breakdown Doughnut Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
            🍕 Category Share
          </h3>
          
          <div style={{ width: '100%', height: '240px', position: 'relative' }}>
            {transactions.filter(t => t.type === 'expense').length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    dataKey="value"
                  >
                    <Cell fill={EMPTY_COLORS[0]} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expenses</p>
              <h4 style={{ fontSize: '18px', fontWeight: 700 }}>₹{totalExpenses.toLocaleString()}</h4>
            </div>
          </div>
          
          {/* Custom legend list */}
          {transactions.filter(t => t.type === 'expense').length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              {pieData.slice(0, 4).map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}: ₹{entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Target Compliance Comparison Bar Chart */}
      {budget ? (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Budget Target vs Actual Expenses
            </h3>
            <button
              onClick={() => setActiveTab('budget')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-purple)',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              Adjust Allocations <ArrowRight size={13} />
            </button>
          </div>
          
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                  }} 
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Target" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', border: '1px dashed var(--border-glass)' }}>
          <Sparkles size={28} style={{ color: 'var(--accent-purple)' }} />
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Generate Your AI Budget Plan</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              You haven't generated an AI-powered budget plan yet. Let our AI distribute your salary securely!
            </p>
          </div>
          <button
            onClick={() => setActiveTab('budget')}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Configure AI Budget
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
