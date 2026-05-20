import express from 'express';
import {
  signup,
  login,
  googleLogin,
  forgotPassword,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', signup);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);

// Protected routes (require JWT verification)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
