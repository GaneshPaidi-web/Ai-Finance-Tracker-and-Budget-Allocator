import express from 'express';
import {
  autoCategorize,
  allocateBudget,
  getPredictions,
  getInsights,
  chatAdvisor,
  fetchChatHistory
} from '../controllers/aiController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware globally to all AI endpoints
router.use(auth);

// AI Specific Endpoints
router.post('/categorize', autoCategorize);
router.post('/budget-allocate', allocateBudget);
router.get('/predictions', getPredictions);
router.get('/insights', getInsights);
router.post('/chat', chatAdvisor);
router.get('/chat', fetchChatHistory);

export default router;
