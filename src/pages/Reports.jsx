import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  AlertTriangle,
  Info,
  TrendingUp, 
  TrendingDown,
  Coins,
  ShieldCheck,
  Calendar,
  BarChart as BarChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import Forecaster from './Forecaster';

const Reports = () => {
  const [subTab, setSubTab] = useState('reports'); // 'reports' or 'forecast'

  const { user } = useAuth();
  const { transactions, goals, subscriptions, budget, insights } = useFinance();
  
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [salaryUtil, setSalaryUtil] = useState({ spent: 0, saved: 0, remaining: 0, spentPct: 0, savedPct: 0, remPct: 0 });
  const [catSummary, setCatSummary] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [savingsTrend, setSavingsTrend] = useState([]);
  const [healthScore, setHealthScore] = useState(50);
  
  const reportRef = useRef(null);
  const printableRef = useRef(null);

  const getSavingsPercent = () => {
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentSaved), 0);
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    if (totalTarget === 0) return 0;
    return Math.min(100, Math.round((totalSaved / totalTarget) * 100));
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  useEffect(() => {
    if (!user) return;

    const salary = user.salary || 50000;

    // 1. Calculate Salary Utilization
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentSaved), 0);
    const totalRemaining = salary - currentMonthExpenses;

    const spentPct = Math.round((currentMonthExpenses / salary) * 100);
    const savedPct = Math.min(100, Math.round((totalSaved / salary) * 100));
    const remPct = Math.max(0, 100 - spentPct);

    setSalaryUtil({
      spent: currentMonthExpenses,
      saved: totalSaved,
      remaining: totalRemaining,
      spentPct,
      savedPct,
      remPct
    });

    // 2. Spending by Category Summary
    const catMap = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
      });
    
    const catArray = Object.keys(catMap).map(cat => ({
      name: cat,
      Spent: catMap[cat]
    }));
    setCatSummary(catArray.length > 0 ? catArray : [{ name: 'No Expenses', Spent: 0 }]);

    // 3. Process Savings Goals Trend
    const trendTemp = goals.map((g, idx) => ({
      name: g.name.substring(0, 12),
      Target: g.targetAmount,
      Saved: g.currentSaved
    }));
    setSavingsTrend(trendTemp.length > 0 ? trendTemp : [{ name: 'Starter Goal', Target: 10000, Saved: 0 }]);

    // 4. SMART ALERTS COMPILATION
    const systemAlerts = [];

    // Alert A: Low Balance Alert
    if (totalRemaining < salary * 0.15 || totalRemaining < 5000) {
      systemAlerts.push({
        id: 'low-balance',
        type: 'danger',
        title: 'Low Balance Warning',
        description: `Your remaining liquid balance (₹${totalRemaining.toLocaleString()}) is below 15% of your salary. We recommend pausing non-essential shopping.`
      });
    }

    // Alert B: Budget Cap Exceeded Alerts
    if (budget) {
      let actualEssentials = 0;
      let actualEntertainment = 0;

      transactions.filter(t => t.type === 'expense').forEach(t => {
        if (t.category === 'Food' || t.category === 'Travel' || t.category === 'Bills' || t.category === 'Healthcare' || t.category === 'Others') {
          actualEssentials += Number(t.amount);
        } else if (t.category === 'Shopping' || t.category === 'Entertainment') {
          actualEntertainment += Number(t.amount);
        }
      });

      if (actualEssentials > budget.allocated.essentials) {
        systemAlerts.push({
          id: 'cap-essentials',
          type: 'danger',
          title: 'Essentials Budget Cap Exceeded',
          description: `You've spent ₹${actualEssentials.toLocaleString()} on essentials, exceeding your AI allocation target of ₹${budget.allocated.essentials.toLocaleString()}.`
        });
      }

      if (actualEntertainment > budget.allocated.entertainment) {
        systemAlerts.push({
          id: 'cap-entertainment',
          type: 'warning',
          title: 'Entertainment Budget Overspent',
          description: `Lifestyle & Shopping spending is ₹${actualEntertainment.toLocaleString()}, surpassing the AI allowance of ₹${budget.allocated.entertainment.toLocaleString()}.`
        });
      }
    }

    // Alert C: Bill Reminders
    const currentDay = new Date().getDate();
    subscriptions.filter(s => s.isActive).forEach(sub => {
      const diff = sub.dueDate - currentDay;
      if (diff >= 0 && diff <= 5) {
        systemAlerts.push({
          id: `bill-${sub._id}`,
          type: 'warning',
          title: `Upcoming Bill Due: ${sub.name}`,
          description: `Your recurring bill of ₹${sub.amount.toLocaleString()} is due in ${diff} days (Day ${sub.dueDate} of the month).`
        });
      }
    });

    // Alert D: Savings Goals reminders
    goals.forEach(goal => {
      const gap = goal.targetAmount - goal.currentSaved;
      if (gap > 0) {
        const timeDiff = new Date(goal.targetDate).getTime() - Date.now();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysLeft > 0 && daysLeft <= 30) {
          systemAlerts.push({
            id: `goal-${goal._id}`,
            type: 'info',
            title: `Savings Deadline: ${goal.name}`,
            description: `You need ₹${gap.toLocaleString()} more in the next ${daysLeft} days to achieve your savings goal.`
          });
        }
      }
    });

    setAlerts(systemAlerts);

    // 5. Calculate Financial Health Score (0-100)
    let score = 50;
    if (remPct >= 30) score += 20;
    else if (remPct >= 20) score += 15;
    else if (remPct >= 10) score += 5;
    else score -= 10;

    let overspentCount = 0;
    if (budget) {
      let actEss = 0;
      let actEnt = 0;
      transactions.filter(t => t.type === 'expense').forEach(t => {
        if (t.category === 'Food' || t.category === 'Travel' || t.category === 'Bills' || t.category === 'Healthcare' || t.category === 'Others') {
          actEss += Number(t.amount);
        } else if (t.category === 'Shopping' || t.category === 'Entertainment') {
          actEnt += Number(t.amount);
        }
      });
      if (actEss > budget.allocated.essentials) overspentCount++;
      if (actEnt > budget.allocated.entertainment) overspentCount++;
    }
    if (overspentCount === 0) score += 20;
    else if (overspentCount === 1) score += 10;

    if (goals && goals.length > 0) {
      score += 10;
      const savPct = getSavingsPercent();
      if (savPct > 50) score += 10;
    }

    if (totalRemaining > 0) score += 10;
    setHealthScore(Math.max(0, Math.min(100, score)));

  }, [transactions, goals, subscriptions, budget, user]);

  const generatePDFReport = async () => {
    setLoadingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = printableRef.current.children;
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        
        // Compile high-fidelity canvas snapshot
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0a0c10',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }
      
      pdf.save(`AuraFinance_Audit_Report_${new Date().toLocaleString('en-US', { month: 'short' })}_${new Date().getFullYear()}.pdf`);
    } catch (err) {
      console.error('Error compiling PDF file:', err);
      alert('Error compiling report PDF. Try again shortly.');
    } finally {
      setLoadingPdf(false);
    }
  };

  const pdfPageStyle = {
    width: '794px',
    height: '1122px',
    padding: '60px 50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    background: '#0a0c10',
    color: '#f8fafc',
    position: 'relative',
    textAlign: 'left'
  };

  const renderPdfHeader = (title, chapter) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', fontWeight: 600 }}>
      <span>{title}</span>
      <span style={{ color: 'var(--text-muted)' }}>{chapter}</span>
    </div>
  );

  const renderPdfFooter = (pageNum) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>
      <span>Aura Intelligent Coach Wealth Audit Report</span>
      <span>Page {pageNum} of 10</span>
    </div>
  );

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
          onClick={() => setSubTab('reports')}
          className="glass-panel-interactive"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: subTab === 'reports' ? '1px solid var(--border-glass-highlight)' : '1px solid transparent',
            background: subTab === 'reports' ? 'var(--bg-glass-hover)' : 'transparent',
            color: subTab === 'reports' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <BarChartIcon size={16} style={{ color: subTab === 'reports' ? 'var(--accent-purple)' : 'inherit' }} />
          Reports & Alerts
        </button>
        <button
          onClick={() => setSubTab('forecast')}
          className="glass-panel-interactive"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: subTab === 'forecast' ? '1px solid var(--border-glass-highlight)' : '1px solid transparent',
            background: subTab === 'forecast' ? 'var(--bg-glass-hover)' : 'transparent',
            color: subTab === 'forecast' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <Sparkles size={16} style={{ color: subTab === 'forecast' ? 'var(--accent-purple)' : 'inherit' }} />
          AI Projections
        </button>
      </div>

      {subTab === 'reports' ? (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Top Banner Control */}
          <div className="glass-panel" style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-purple)' }} />
                Monthly Wealth Auditor & Exports
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generate formal accounting summaries & track warning meters</p>
            </div>

            <button
              onClick={generatePDFReport}
              className="btn btn-primary animate-fade-in"
              style={{ gap: '8px', padding: '10px 20px', fontSize: '13px' }}
              disabled={loadingPdf}
            >
              <Download size={14} />
              {loadingPdf ? 'Compiling PDF...' : 'Export Financial PDF'}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1.2fr',
            gap: '30px'
          }}>
            {/* Left Column: Visual Analytics Sheet */}
            <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px', background: 'transparent', borderRadius: 'var(--radius-lg)' }}>
              
              {/* Printable Report Header */}
              <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700 }}>AuraFinance AI Monthly Statement</h3>
                    <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Wealth & Budget Auditor Report
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <p>Prepared for: {user?.username}</p>
                    <p>Date: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inflow (Salary)</span>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-teal)', marginTop: '2px' }}>₹{user?.salary?.toLocaleString() || '0'}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Outflow (Expenses)</span>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '2px' }}>₹{salaryUtil.spent.toLocaleString()}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accumulated (Liquid)</span>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '2px' }}>₹{salaryUtil.remaining.toLocaleString()}</h4>
                  </div>
                </div>
              </div>

              {/* Salary Utilization progress metrics */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={15} style={{ color: 'var(--accent-teal)' }} />
                  Salary Utilization Ratios
                </h4>

                {/* Split progression bar */}
                <div style={{
                  width: '100%',
                  height: '24px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  overflow: 'hidden',
                  marginTop: '10px'
                }}>
                  {/* Spent Portion */}
                  <div style={{ width: `${salaryUtil.spentPct}%`, height: '100%', background: 'var(--grad-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                    {salaryUtil.spentPct > 10 ? `${salaryUtil.spentPct}% spent` : ''}
                  </div>
                  {/* Remaining Portion */}
                  <div style={{ flex: 1, height: '100%', background: 'var(--grad-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                    {salaryUtil.remPct > 10 ? `${salaryUtil.remPct}% saved` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>🚨 Outflow Ratio: {salaryUtil.spentPct}%</span>
                  <span>💰 Retained Ratio: {salaryUtil.remPct}%</span>
                </div>
              </div>

              {/* Category Expenditure Bar Chart */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>
                  🍕 Spend Categories Breakdown
                </h4>

                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={catSummary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="Spent" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Savings Trend Line Chart */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>
                  📈 Savings Progress Trend
                </h4>

                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={savingsTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="Target" name="Goal Cap" stroke="var(--accent-amber)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Saved" name="Accumulated" stroke="var(--accent-teal)" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic AI Statement justification */}
              <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)', background: 'rgba(124, 58, 237, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 600 }}>AI Wealth Assessment Summary</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.6 }}>
                  {insights && insights.length > 0 ? (
                    insights.map((ins, idx) => (
                      <p key={idx}>
                        <strong style={{ color: 'var(--text-primary)' }}>• {ins.title}:</strong> {ins.text.replace(/\*\*/g, '')}
                      </p>
                    ))
                  ) : (
                    <p>No active spend behaviors detected. Add daily outflows in the Expenses tab to enable Aura's automated micro-auditor insights.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Smart Alerts center */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--accent-rose)' }} />
                  Smart Alerts Dashboard
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="glass-panel animate-fade-in"
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: alert.type === 'danger' ? 'rgba(244, 63, 94, 0.04)' : alert.type === 'warning' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(59, 130, 246, 0.04)',
                          border: alert.type === 'danger' ? '1px solid rgba(244, 63, 94, 0.25)' : alert.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <AlertTriangle size={14} style={{ color: alert.type === 'danger' ? 'var(--accent-rose)' : alert.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)' }} />
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: alert.type === 'danger' ? 'var(--accent-rose)' : alert.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)'
                          }}>
                            {alert.title}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          {alert.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '30px 0',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <ShieldCheck size={28} style={{ color: 'var(--accent-teal)', filter: 'drop-shadow(0 0 6px #10b981)' }} />
                      <div>
                        <h5 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>All Systems Secure</h5>
                        <p style={{ fontSize: '11px', marginTop: '3px' }}>Your targets, balances, and payments are perfectly healthy!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick FAQ / Audit Check List */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={14} style={{ color: 'var(--accent-purple)' }} />
                  Audit Compliance Check
                </h4>
                
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <li>Rent allocation complies with standard 30% thresholds.</li>
                  <li>Liquid savings maintain essential 3-month survival reserves.</li>
                  <li>Subscriptions checked and paused for inactive memberships.</li>
                  <li>Weekly spend trend fits linear slope projections.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <Forecaster />
        </div>
      )}

      {/* Hidden high-fidelity 10-page printable PDF layout */}
      <div id="printable-pdf-report" ref={printableRef} style={{ position: 'absolute', left: '-9999px', top: '0', width: '794px', background: '#0a0c10' }}>
        
        {/* PAGE 1: COVER PAGE */}
        <div style={{ ...pdfPageStyle, background: 'radial-gradient(circle at top right, #2e0854, #0a0c10)' }}>
          <div style={{ borderLeft: '4px solid var(--accent-purple)', paddingLeft: '20px', marginTop: '60px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Aura AI Coaching Audits</span>
            <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '10px 0 0 0', lineHeight: 1.1, color: '#fff' }}>PERSONAL FINANCIAL<br/>HEALTH REPORT</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '10px' }}>An Intelligent, Automated Multi-Tiered Asset & Budget Audit Statement</p>
          </div>

          <div style={{ margin: '80px 0', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', padding: '30px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Performance Auditor Index</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent-teal)' }}>{healthScore}</span>
              <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>/ 100 Health Score</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginTop: '14px', overflow: 'hidden' }}>
              <div style={{ width: `${healthScore}%`, height: '100%', background: 'var(--grad-success)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PREPARED FOR:</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{user?.username}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.occupation || 'Finance Tracker Member'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AUDITED DATE:</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{formatDate(new Date())}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Engine: Aura Coach v2.4 (Stable)</div>
            </div>
          </div>
        </div>

        {/* PAGE 2: MONTHLY SUMMARY */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "1. EXECUTIVE SUMMARY")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              This audit statement evaluates the aggregate financial health, budget performance, and wealth accumulation ratios of <strong>{user?.username}</strong> for the current billing month. Utilizing intelligent automated ledger queries, the report analyzes net inflows, outflows, and goals compliance to generate strategic savings directives.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aggregate Inflow</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-teal)', marginTop: '6px' }}>₹{user?.salary?.toLocaleString() || '0'}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Base monthly configured income</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aggregate Outflow</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '6px' }}>₹{salaryUtil.spent.toLocaleString()}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Logged expenses in current statement</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Liquid Balance (Net Retained)</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '6px' }}>₹{salaryUtil.remaining.toLocaleString()}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Remaining unspent salary balance</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Retained Ratio</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '6px' }}>{salaryUtil.remPct}%</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Salary portion converted to savings</p>
              </div>
            </div>

            <div style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: '14px', marginTop: '20px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: '0 0 6px 0' }}>Narrative Auditor Finding</h5>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {salaryUtil.remPct >= 20 
                  ? "Outstanding! You are operating above the baseline threshold of 20% savings. Your retained assets are highly optimized for investment vehicle growth."
                  : "Caution. Your savings rate is below the ideal 20% mark. Check page 4 for categorized details on leaks and unnecessary outflow trends."
                }
              </p>
            </div>
          </div>

          {renderPdfFooter(2)}
        </div>

        {/* PAGE 3: INCOME ANALYSIS */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "2. INCOME DISTRIBUTION ANALYSIS")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Income Parameters & Allocation</h4>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '10px 0', fontWeight: 600 }}>Active Profession / Occupation</td><td style={{ textAlign: 'right', color: '#fff' }}>{user?.occupation || 'N/A'}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '10px 0', fontWeight: 600 }}>Configured Location</td><td style={{ textAlign: 'right', color: '#fff' }}>{user?.place || 'N/A'}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '10px 0', fontWeight: 600 }}>Monthly Base Income (Salary)</td><td style={{ textAlign: 'right', color: '#fff' }}>₹{user?.salary?.toLocaleString() || '0'}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '10px 0', fontWeight: 600 }}>Configured Salary Date</td><td style={{ textAlign: 'right', color: '#fff' }}>Day {user?.salaryDate || 1} of month</td></tr>
              </tbody>
            </table>

            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginTop: '20px' }}>AI Recommended Allocations (50/30/20 Blueprint)</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>🏠 Needs / Essentials (50%):</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{budget ? budget.allocated.essentials.toLocaleString() : (user?.salary * 0.5).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>📈 Savings & Goals (20%):</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{budget ? budget.allocated.savings.toLocaleString() : (user?.salary * 0.2).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>💼 Investments (15%):</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{budget ? budget.allocated.investments.toLocaleString() : (user?.salary * 0.15).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>🛡️ Emergency Reserves (5%):</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{budget ? budget.allocated.emergency.toLocaleString() : (user?.salary * 0.05).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>🍿 Wants / Entertainment (10%):</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{budget ? budget.allocated.entertainment.toLocaleString() : (user?.salary * 0.1).toLocaleString()}</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '10px' }}>
              <em>Note:</em> The AI Finance Coach automatically allocates your Monthly Salary into separate accounts on your salary date (Day {user?.salaryDate || 1}). Keep your variable expense cards tied specifically to Wants and Essentials cards.
            </p>
          </div>

          {renderPdfFooter(3)}
        </div>

        {/* PAGE 4: EXPENSE BREAKDOWN */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "3. CATEGORIZED EXPENSE BREAKDOWN")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Spending by Categories</h4>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Category</th>
                  <th style={{ textAlign: 'right' }}>Spent Amount</th>
                  <th style={{ textAlign: 'right' }}>Percentage of Spent</th>
                </tr>
              </thead>
              <tbody>
                {catSummary.map((cat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#fff' }}>
                    <td style={{ padding: '10px 0' }}>{cat.name}</td>
                    <td style={{ textAlign: 'right' }}>₹{cat.Spent.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {salaryUtil.spent > 0 ? Math.round((cat.Spent / salaryUtil.spent) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginTop: '20px' }}>Critical Expense High Outflows</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {transactions.filter(t => t.type === 'expense').sort((a,b) => b.amount - a.amount).slice(0, 3).map((t, idx) => (
                <div key={idx} style={{ border: '1px solid rgba(244,63,94,0.15)', background: 'rgba(244,63,94,0.02)', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{t.description}</span>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Category: {t.category} | Date: {new Date(t.date).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-rose)' }}>₹{Number(t.amount).toLocaleString()}</span>
                </div>
              ))}
              {transactions.filter(t => t.type === 'expense').length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No outflows logged in this billing month.</p>
              )}
            </div>
          </div>

          {renderPdfFooter(4)}
        </div>

        {/* PAGE 5: AI RECOMMENDATIONS */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "4. AURA AI COACHING INSIGHTS")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Aura's Automated Recommendations</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {insights && insights.length > 0 ? (
                insights.map((ins, idx) => (
                  <div key={idx} style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: '14px', background: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: '0 6px 6px 0' }}>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-purple)', margin: '0 0 4px 0' }}>💡 {ins.title}</h5>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {ins.text.replace(/\*\*/g, '')}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Aura AI Financial Coach needs more logged transactions to generate personalized savings insights.
                  </p>
                </div>
              )}
            </div>

            <div style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)', padding: '16px', borderRadius: '6px', marginTop: '20px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-amber)', margin: '0 0 6px 0' }}>⚠️ Risk Mitigation Advice</h5>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Ensure subscription cards are canceled for streaming/SaaS apps you haven't logged onto in the past 14 days. These micro-payments erode liquid wealth over time.
              </p>
            </div>
          </div>

          {renderPdfFooter(5)}
        </div>

        {/* PAGE 6: SAVINGS & BUDGET INSIGHTS */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "5. SAVINGS PERFORMANCE & BUDGETS")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Active Savings Goals Target Comparison</h4>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Savings Goal Name</th>
                  <th style={{ textAlign: 'right' }}>Target Amount</th>
                  <th style={{ textAlign: 'right' }}>Current Saved</th>
                  <th style={{ textAlign: 'right' }}>Progress (%)</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g, idx) => {
                  const goalPct = Math.min(100, Math.round((g.currentSaved / g.targetAmount) * 100));
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#fff' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600 }}>{g.name}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(g.targetAmount).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-teal)' }}>₹{Number(g.currentSaved).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{goalPct}%</td>
                    </tr>
                  );
                })}
                {goals.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No savings goals defined in profile.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginTop: '20px' }}>Automated Salary Credit Log</h4>
            <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Your Aura account checks for salary date credit automation on Day <strong>{user?.salaryDate || 1}</strong> of each month. Upon credit detection, savings allocations are distributed to active goal funds automatically.
              </p>
            </div>
          </div>

          {renderPdfFooter(6)}
        </div>

        {/* PAGE 7: TRANSACTION HISTORY */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "6. DETAILED TRANSACTION LEDGER")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Recent Outflows Statement (Last 12)</h4>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 0' }}>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 12).map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#fff' }}>
                    <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{formatDate(t.date)}</td>
                    <td style={{ fontWeight: 600 }}>{t.category}</td>
                    <td>{t.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'expense' ? 'var(--accent-rose)' : 'var(--accent-teal)' }}>
                      {t.type === 'expense' ? '-' : '+'}₹{Number(t.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPdfFooter(7)}
        </div>

        {/* PAGE 8: CHARTS & GRAPHS */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "7. VISUAL ANALYTICAL REPRESENTATIONS")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, marginTop: '20px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '14px', borderLeft: '3px solid var(--accent-purple)', paddingLeft: '10px' }}>
                Category Breakdown Analysis
              </h4>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '6px' }}>
                <BarChart width={650} height={200} data={catSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Bar dataKey="Spent" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '14px', borderLeft: '3px solid var(--accent-teal)', paddingLeft: '10px' }}>
                Savings Target Progress Graph
              </h4>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '6px' }}>
                <LineChart width={650} height={200} data={savingsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Line type="monotone" dataKey="Target" name="Target Cap" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="Saved" name="Accumulated" stroke="#14b8a6" strokeWidth={3} />
                </LineChart>
              </div>
            </div>
          </div>

          {renderPdfFooter(8)}
        </div>

        {/* PAGE 9: HEALTH SCORE & RATIOS */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "8. FINANCIAL HEALTH METRIC & RATIOS")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Health Score Diagnostic</h4>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '30px', borderRadius: '8px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, #2e0854, #0a0c10)', border: '6px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(124,58,237,0.3)' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{healthScore}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: healthScore >= 80 ? 'var(--accent-teal)' : healthScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                  {healthScore >= 80 ? 'Excellent Status ✨' : healthScore >= 60 ? 'Moderate Alert Status ⚠️' : 'Critical Outflow Warning 🚨'}
                </h5>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  This health score is generated by calculating savings percentage, budget overruns, active goal targets, and remaining liquid base balance.
                </p>
              </div>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginTop: '20px' }}>Compliance Summary Check</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>Budget Adherence Status:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>PASS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>Savings Target Compliance (20% Baseline):</span>
                <span style={{ fontWeight: 600, color: salaryUtil.remPct >= 20 ? 'var(--accent-teal)' : 'var(--accent-rose)' }}>
                  {salaryUtil.remPct >= 20 ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span>Emergency Fund Buffer (5% Threshold):</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>ACTIVE</span>
              </div>
            </div>
          </div>

          {renderPdfFooter(9)}
        </div>

        {/* PAGE 10: CONCLUSION & NEXT STEPS */}
        <div style={pdfPageStyle}>
          {renderPdfHeader("Monthly Wealth Audit", "9. REPORT CONCLUSION & SIGN-OFF")}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Strategic Action Checklist</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-purple)' }}>✔</span>
                <span>Confirm automated savings credit transfer on salary credit day (Day {user?.salaryDate || 1}).</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-purple)' }}>✔</span>
                <span>Maintain essentials monthly limit under ₹{budget ? budget.allocated.essentials.toLocaleString() : (user?.salary * 0.5).toLocaleString()}.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-purple)' }}>✔</span>
                <span>Log variable transactions regularly inside the Aura Finance ledger tab.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-purple)' }}>✔</span>
                <span>Deactivate unused subscription cards to seal outflow leaks.</span>
              </div>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginTop: '20px' }}>Declaration & Verification Signatures</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This audit report is dynamically compiled through cryptographically secure API hooks. The calculations represent the accurate mathematical ledger balances matching User database logs.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', gap: '40px' }}>
              <div style={{ width: '45%' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', height: '40px' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>CLIENT SIGNATURE</div>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{user?.username}</div>
              </div>
              <div style={{ width: '45%' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <span style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--accent-purple)' }}>Aura AI Coach</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>SYSTEM AUDITOR</div>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>Aura intelligent FinTech Engine</div>
              </div>
            </div>
          </div>

          {renderPdfFooter(10)}
        </div>

      </div>

    </div>
  );
};

export default Reports;
