import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getBudget,
  saveBudget,
  getUserById,
  updateUser
} from '../utils/dbClient.js';

// ==========================================
// TRANSACTIONS
// ==========================================
export const fetchTransactions = async (req, res) => {
  try {
    const { category, type, paymentMethod } = req.query;
    const txs = await getTransactions(req.userId, { category, type, paymentMethod });
    res.json(txs);
  } catch (err) {
    console.error('Fetch Transactions Error:', err);
    res.status(500).json({ message: 'Server error retrieving transactions list' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const tx = await addTransaction(req.userId, req.body);
    res.status(201).json({ message: 'Transaction logged successfully!', transaction: tx });
  } catch (err) {
    console.error('Create Transaction Error:', err);
    res.status(500).json({ message: 'Server error logging transaction' });
  }
};

export const editTransaction = async (req, res) => {
  try {
    const tx = await updateTransaction(req.userId, req.params.id, req.body);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }
    res.json({ message: 'Transaction record updated!', transaction: tx });
  } catch (err) {
    console.error('Edit Transaction Error:', err);
    res.status(500).json({ message: 'Server error updating transaction record' });
  }
};

export const removeTransaction = async (req, res) => {
  try {
    const tx = await deleteTransaction(req.userId, req.params.id);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }
    res.json({ message: 'Transaction record deleted successfully!' });
  } catch (err) {
    console.error('Remove Transaction Error:', err);
    res.status(500).json({ message: 'Server error deleting transaction record' });
  }
};

// ==========================================
// SAVINGS GOALS
// ==========================================
export const fetchGoals = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await getUserById(userId);
    const budget = await getBudget(userId);
    let goals = await getGoals(userId);

    if (user && budget && budget.allocated && budget.allocated.savings > 0 && goals.length > 0) {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const salaryDate = user.salaryDate || 1;
      if (currentDay >= salaryDate && user.lastSavingsCreditMonth !== currentMonth) {
        // Trigger automated savings allocation
        const savingsToAllocate = budget.allocated.savings;
        const share = Math.round(savingsToAllocate / goals.length);

        for (let i = 0; i < goals.length; i++) {
          const goal = goals[i];
          const newSaved = goal.currentSaved + share;
          await updateGoal(userId, goal._id, { currentSaved: newSaved });

          // Log transaction for bookkeeping
          await addTransaction(userId, {
            type: 'income',
            amount: share,
            category: 'Salary',
            paymentMethod: 'Bank Transfer',
            notes: `Automated Salary Savings Credited to Goal: ${goal.name}`,
            date: today.toISOString(),
            isRecurring: false
          });
        }

        // Update user state
        await updateUser(userId, { lastSavingsCreditMonth: currentMonth });
        
        // Reload goals
        goals = await getGoals(userId);
        console.log(`[Auto Savings Credit] Credited ₹${savingsToAllocate} to ${goals.length} savings goals for ${currentMonth}`);
      }
    }

    res.json(goals);
  } catch (err) {
    console.error('Fetch Goals Error:', err);
    res.status(500).json({ message: 'Server error retrieving savings goals' });
  }
};

export const createGoal = async (req, res) => {
  try {
    const goal = await addGoal(req.userId, req.body);
    res.status(201).json({ message: 'Savings goal created successfully!', goal });
  } catch (err) {
    console.error('Create Goal Error:', err);
    res.status(500).json({ message: 'Server error creating savings goal' });
  }
};

export const editGoal = async (req, res) => {
  try {
    const goal = await updateGoal(req.userId, req.params.id, req.body);
    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }
    res.json({ message: 'Savings goal updated!', goal });
  } catch (err) {
    console.error('Edit Goal Error:', err);
    res.status(500).json({ message: 'Server error updating savings goal' });
  }
};

export const removeGoal = async (req, res) => {
  try {
    const goal = await deleteGoal(req.userId, req.params.id);
    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }
    res.json({ message: 'Savings goal deleted successfully!' });
  } catch (err) {
    console.error('Remove Goal Error:', err);
    res.status(500).json({ message: 'Server error deleting savings goal' });
  }
};

// ==========================================
// RECURRING SUBSCRIPTIONS
// ==========================================
export const fetchSubscriptions = async (req, res) => {
  try {
    const subs = await getSubscriptions(req.userId);
    res.json(subs);
  } catch (err) {
    console.error('Fetch Subscriptions Error:', err);
    res.status(500).json({ message: 'Server error retrieving recurring bills' });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const sub = await addSubscription(req.userId, req.body);
    res.status(201).json({ message: 'Recurring bill subscription added!', subscription: sub });
  } catch (err) {
    console.error('Create Subscription Error:', err);
    res.status(500).json({ message: 'Server error adding recurring subscription' });
  }
};

export const editSubscription = async (req, res) => {
  try {
    const sub = await updateSubscription(req.userId, req.params.id, req.body);
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json({ message: 'Recurring bill updated!', subscription: sub });
  } catch (err) {
    console.error('Edit Subscription Error:', err);
    res.status(500).json({ message: 'Server error updating recurring bill' });
  }
};

export const removeSubscription = async (req, res) => {
  try {
    const sub = await deleteSubscription(req.userId, req.params.id);
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json({ message: 'Recurring bill deleted successfully!' });
  } catch (err) {
    console.error('Remove Subscription Error:', err);
    res.status(500).json({ message: 'Server error deleting recurring bill' });
  }
};

// ==========================================
// BUDGET
// ==========================================
export const fetchBudget = async (req, res) => {
  try {
    const budget = await getBudget(req.userId);
    if (!budget) {
      return res.status(200).json(null); // Clear return
    }
    res.json(budget);
  } catch (err) {
    console.error('Fetch Budget Error:', err);
    res.status(500).json({ message: 'Server error retrieving budget targets' });
  }
};

export const editBudget = async (req, res) => {
  try {
    const budget = await saveBudget(req.userId, req.body);
    res.json({ message: 'Monthly budget targets updated!', budget });
  } catch (err) {
    console.error('Edit Budget Error:', err);
    res.status(500).json({ message: 'Server error saving budget targets' });
  }
};
