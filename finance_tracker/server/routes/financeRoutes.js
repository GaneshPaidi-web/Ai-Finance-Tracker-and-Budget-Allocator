import express from 'express';
import {
  fetchTransactions,
  createTransaction,
  editTransaction,
  removeTransaction,
  fetchGoals,
  createGoal,
  editGoal,
  removeGoal,
  fetchSubscriptions,
  createSubscription,
  editSubscription,
  removeSubscription,
  fetchBudget,
  editBudget
} from '../controllers/financeController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware globally to all finance routes
router.use(auth);

// Transactions CRUD
router.get('/transactions', fetchTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', editTransaction);
router.delete('/transactions/:id', removeTransaction);

// Savings Goals CRUD
router.get('/goals', fetchGoals);
router.post('/goals', createGoal);
router.put('/goals/:id', editGoal);
router.delete('/goals/:id', removeGoal);

// Subscriptions CRUD
router.get('/subscriptions', fetchSubscriptions);
router.post('/subscriptions', createSubscription);
router.put('/subscriptions/:id', editSubscription);
router.delete('/subscriptions/:id', removeSubscription);

// Budgets CRUD
router.get('/budget', fetchBudget);
router.post('/budget', editBudget);

export default router;
