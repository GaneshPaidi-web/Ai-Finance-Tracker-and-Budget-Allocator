import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [budget, setBudget] = useState(null);
  
  // AI Derived States
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: 'Hello! I am Aura, your personal AI Financial Coach. I\'ve analyzed your profile and spend behaviors. Ask me anything about saving, investments, or how to optimize your budget!' }
  ]);

  const [financeLoading, setFinanceLoading] = useState(false);

  // Helper headers configuration
  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  // FETCH ALL DATA (snappy parallel processing)
  const fetchAllFinanceData = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    setFinanceLoading(true);
    try {
      const headers = getHeaders();
      
      // Load core endpoints concurrently
      const [txRes, goalsRes, subsRes, budgetRes, predRes, insRes, chatRes] = await Promise.all([
        fetch('/api/finance/transactions', { headers }),
        fetch('/api/finance/goals', { headers }),
        fetch('/api/finance/subscriptions', { headers }),
        fetch('/api/finance/budget', { headers }),
        fetch('/api/ai/predictions', { headers }),
        fetch('/api/ai/insights', { headers }),
        fetch('/api/ai/chat', { headers })
      ]);

      if (txRes.ok) setTransactions(await txRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
      if (budgetRes.ok) setBudget(await budgetRes.json());
      if (predRes.ok) setPredictions(await predRes.json());
      if (insRes.ok) setInsights(await insRes.json());
      if (chatRes.ok) {
        const historyData = await chatRes.json();
        if (historyData && historyData.length > 0) {
          setChatHistory(historyData);
        } else {
          setChatHistory([
            { role: 'model', text: 'Hello! I am Aura, your personal AI Financial Coach. Ask me anything about saving, investments, or how to optimize your budget!' }
          ]);
        }
      }
      
    } catch (err) {
      console.error('Error fetching financial dashboard data:', err);
    } finally {
      setFinanceLoading(false);
    }
  }, [token, isAuthenticated, getHeaders]);

  // Refresh AI derived modules (e.g. after adding an expense)
  const refreshAIData = async () => {
    if (!token) return;
    try {
      const headers = getHeaders();
      const [predRes, insRes] = await Promise.all([
        fetch('/api/ai/predictions', { headers }),
        fetch('/api/ai/insights', { headers })
      ]);
      if (predRes.ok) setPredictions(await predRes.json());
      if (insRes.ok) setInsights(await insRes.json());
    } catch (err) {
      console.error('Error refreshing AI analytics:', err);
    }
  };

  // Trigger loading when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllFinanceData();
    } else {
      // Clear data on logout
      setTransactions([]);
      setGoals([]);
      setSubscriptions([]);
      setBudget(null);
      setPredictions(null);
      setInsights([]);
      setChatHistory([
        { role: 'model', text: 'Hello! I am Aura, your personal AI Financial Coach. I\'ve analyzed your profile and spend behaviors. Ask me anything about saving, investments, or how to optimize your budget!' }
      ]);
    }
  }, [isAuthenticated, token, fetchAllFinanceData]);

  // ==========================================
  // TRANSACTIONS CRUD
  // ==========================================
  const addTransaction = async (data) => {
    try {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setTransactions(prev => [result.transaction, ...prev]);
        refreshAIData();
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const editTransaction = async (id, data) => {
    try {
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setTransactions(prev => prev.map(t => t._id === id ? result.transaction : t));
        refreshAIData();
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t._id !== id));
        refreshAIData();
        return { success: true };
      }
      const result = await res.json();
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==========================================
  // SAVINGS GOALS CRUD
  // ==========================================
  const addGoal = async (data) => {
    try {
      const res = await fetch('/api/finance/goals', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setGoals(prev => [result.goal, ...prev]);
        refreshAIData();
        return { success: true, goal: result.goal };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const editGoal = async (id, data) => {
    try {
      const res = await fetch(`/api/finance/goals/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setGoals(prev => prev.map(g => g._id === id ? result.goal : g));
        refreshAIData();
        return { success: true, goal: result.goal };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteGoal = async (id) => {
    try {
      const res = await fetch(`/api/finance/goals/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setGoals(prev => prev.filter(g => g._id !== id));
        refreshAIData();
        return { success: true };
      }
      const result = await res.json();
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==========================================
  // SUBSCRIPTIONS CRUD
  // ==========================================
  const addSubscription = async (data) => {
    try {
      const res = await fetch('/api/finance/subscriptions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setSubscriptions(prev => [...prev, result.subscription]);
        refreshAIData();
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const editSubscription = async (id, data) => {
    try {
      const res = await fetch(`/api/finance/subscriptions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setSubscriptions(prev => prev.map(s => s._id === id ? result.subscription : s));
        refreshAIData();
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteSubscription = async (id) => {
    try {
      const res = await fetch(`/api/finance/subscriptions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s._id !== id));
        refreshAIData();
        return { success: true };
      }
      const result = await res.json();
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==========================================
  // BUDGET & AI OPERATIONS
  // ==========================================
  const updateBudget = async (data) => {
    try {
      const res = await fetch('/api/finance/budget', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setBudget(result.budget);
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Natural Language Auto Categorization "Swiggy order ₹450"
  const autoCategorizeDescription = async (text) => {
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      const result = await res.json();
      if (res.ok) {
        return { success: true, data: result };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // AI Allocation Generator
  const generateAIBudget = async (allocInput) => {
    try {
      const res = await fetch('/api/ai/budget-allocate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(allocInput)
      });
      const result = await res.json();
      if (res.ok) {
        return { success: true, data: result };
      }
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Chatbot financial Coach Messenger
  const sendChatAdvisorMessage = async (message) => {
    try {
      // Optimistically append user message to local state
      const userMsg = { role: 'user', text: message };
      setChatHistory(prev => [...prev, userMsg]);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message,
          // Extract last 10 messages from current state to prevent payload bloat
          history: chatHistory.slice(-10)
        })
      });

      const result = await res.json();
      if (res.ok) {
        const advisorMsg = { role: 'model', text: result.response };
        setChatHistory(prev => [...prev, advisorMsg]);
        return { success: true };
      }
      
      const errorMsg = { role: 'model', text: 'I apologize, but I\'m having trouble connecting to my cognitive services right now. Let\'s check your connection or try again shortly!' };
      setChatHistory(prev => [...prev, errorMsg]);
      return { success: false, error: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    transactions,
    goals,
    subscriptions,
    budget,
    predictions,
    insights,
    chatHistory,
    financeLoading,
    fetchAllFinanceData,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addGoal,
    editGoal,
    deleteGoal,
    addSubscription,
    editSubscription,
    deleteSubscription,
    updateBudget,
    autoCategorizeDescription,
    generateAIBudget,
    sendChatAdvisorMessage
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
