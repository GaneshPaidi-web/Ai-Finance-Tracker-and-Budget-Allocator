import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles,
  Calendar,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinance } from '../context/FinanceContext';

const Forecaster = () => {
  const { predictions, budget, subscriptions } = useFinance();

  const [lineData, setLineData] = useState([]);
  const [alarmCategories, setAlarmCategories] = useState([]);
  const [upcomingBillTotal, setUpcomingBillTotal] = useState(0);

  useEffect(() => {
    if (!predictions) return;

    // 1. Process Line Chart Data
    const { history, projection } = predictions;
    
    // Format history: array of { month: "Jan", Amount: 4000 }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const formattedHistory = history.map(h => {
      const monthLabel = `${months[h.month - 1]} ${currentYear % 100}`;
      return {
        name: monthLabel,
        Spent: h.amount,
        type: 'historical'
      };
    });

    // Append projection point
    const nextMonthIndex = projection.month - 1;
    const projectionLabel = `${months[nextMonthIndex]} ${currentYear % 100} (AI)`;

    // Connect the last historical point with the projection
    let connectedData = [...formattedHistory];
    if (formattedHistory.length > 0) {
      connectedData.push({
        name: projectionLabel,
        Spent: projection.amount,
        Projected: projection.amount,
        type: 'predicted'
      });

      // Also mark the last historical point's Spent value as the start of the Projected line
      connectedData[connectedData.length - 2].Projected = connectedData[connectedData.length - 2].Spent;
    } else {
      connectedData.push({
        name: projectionLabel,
        Projected: projection.amount,
        type: 'predicted'
      });
    }

    setLineData(connectedData);

    // 2. Process Overspending Category Alarms
    const alarms = [];
    if (budget && predictions.categoryAverages) {
      // Map budget: Rent, Bills, Food, Travel, Healthcare, Shopping, Entertainment, Investments, Others
      const actuals = predictions.categoryAverages;
      
      const checkCategoryAlarm = (catName, budgetLimit) => {
        const spent = actuals[catName] || 0;
        if (spent > budgetLimit && budgetLimit > 0) {
          const overSum = spent - budgetLimit;
          const pct = Math.round((spent / budgetLimit) * 100);
          alarms.push({ name: catName, limit: budgetLimit, actual: spent, overBy: overSum, percentage: pct });
        }
      };

      // Match targets
      const essentialsLimitPerCat = Math.round(budget.allocated.essentials / 4); // Food, Travel, Bills, Others
      checkCategoryAlarm('Food', essentialsLimitPerCat);
      checkCategoryAlarm('Travel', essentialsLimitPerCat);
      checkCategoryAlarm('Bills', essentialsLimitPerCat);
      checkCategoryAlarm('Shopping', Math.round(budget.allocated.entertainment / 2));
      checkCategoryAlarm('Entertainment', Math.round(budget.allocated.entertainment / 2));
    }
    setAlarmCategories(alarms);

    // 3. Subscription bill pressure calculations
    if (subscriptions && subscriptions.length > 0) {
      const activeSum = subscriptions
        .filter(s => s.isActive)
        .reduce((sum, s) => sum + Number(s.amount), 0);
      setUpcomingBillTotal(activeSum);
    } else {
      setUpcomingBillTotal(0);
    }

  }, [predictions, budget, subscriptions]);

  const isUpwardTrend = predictions ? predictions.slope > 0 : false;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {predictions ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* 1. Header Metrics Grid */}
          <div className="dashboard-grid">
            {/* Projected Spent */}
            <div className="glass-panel glow-purple" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(124, 58, 237, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Projected Next Month Spend</p>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>₹{Math.round(predictions.projection.amount).toLocaleString()}</h3>
              </div>
            </div>

            {/* Growth Rate / Slope */}
            <div className="glass-panel" style={{ 
              padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
              borderLeft: isUpwardTrend ? '4px solid var(--accent-rose)' : '4px solid var(--accent-teal)'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: isUpwardTrend ? 'rgba(244, 63, 94, 0.12)' : 'rgba(20, 184, 166, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isUpwardTrend ? (
                  <TrendingUp size={18} style={{ color: 'var(--accent-rose)' }} />
                ) : (
                  <TrendingDown size={18} style={{ color: 'var(--accent-teal)' }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spend Acceleration (MoM)</p>
                <h3 style={{ 
                  fontSize: '20px', fontWeight: 700, marginTop: '2px',
                  color: isUpwardTrend ? 'var(--accent-rose)' : 'var(--accent-teal)'
                }}>
                  {isUpwardTrend ? '+' : ''}{Math.round(predictions.growthRate * 100)}%
                </h3>
              </div>
            </div>

            {/* Subscriptions Pressure */}
            <div className="glass-panel glow-amber" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Calendar size={18} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recurring Bill Pressure</p>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>₹{upcomingBillTotal.toLocaleString()}/mo</h3>
              </div>
            </div>
          </div>

          {/* 2. Forecast Trend line Chart */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
              📈 Linear Regression Expense Forecasting
            </h3>
            
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                    }} 
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  {/* Historical Spent */}
                  <Line type="monotone" dataKey="Spent" name="Historic Spending" stroke="var(--accent-purple)" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                  {/* Projected Spent */}
                  <Line type="monotone" dataKey="Projected" name="Projected Spend Target" stroke="var(--accent-blue)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
              * Aura projects expenditure trends by fitting a linear least-squares model to your historic monthly aggregates.
            </p>
          </div>

          {/* 3. Bottom Alarms and Bills split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }}>
            
            {/* Category Warnings list */}
            <div className="glass-panel glow-rose" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--accent-rose)' }} />
                Overspending Warnings
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                {alarmCategories.length > 0 ? (
                  alarmCategories.map((alarm, idx) => (
                    <div key={idx} style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 500 }}>{alarm.name}</span>
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>{alarm.percentage}% of limit</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, alarm.percentage)}%`, height: '100%', background: 'var(--grad-danger)', borderRadius: '3px' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Limit: ₹{alarm.limit.toLocaleString()} | Spent: ₹{Math.round(alarm.actual).toLocaleString()} (Over by ₹{Math.round(alarm.overBy).toLocaleString()})
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '12px', padding: '30px 0' }}>
                    Great job! No category exceeds your budget limits this month. 🎉
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Bills panel */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
                📅 Upcoming Commitments Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {subscriptions && subscriptions.filter(s => s.isActive).length > 0 ? (
                  subscriptions.filter(s => s.isActive).slice(0, 3).map((bill) => (
                    <div
                      key={bill._id}
                      className="glass-panel"
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600 }}>{bill.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due on day {bill.dueDate} of month</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-amber)' }}>
                        ₹{bill.amount.toLocaleString()}/{bill.billingCycle}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '40px 0' }}>
                    No active subscriptions logged. Add recurring bills in the **Subscriptions** tab.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
          Loading predictive models and regression matrices...
        </div>
      )}

    </div>
  );
};

export default Forecaster;
