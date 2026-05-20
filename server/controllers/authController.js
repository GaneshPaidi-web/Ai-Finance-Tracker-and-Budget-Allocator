import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  getUserByEmail,
  createUser,
  getUserById,
  updateUser
} from '../utils/dbClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aurafinancedefaultsecret987654321';

// Generate Token helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Sign Up
export const signup = async (req, res) => {
  try {
    const { username, email, password, securityQuestion, securityAnswer, occupation, place } = req.body;
 
     if (!username || !email || !password) {
       return res.status(400).json({ message: 'Please enter all required fields' });
     }
 
     const existingUser = await getUserByEmail(email);
     if (existingUser) {
       return res.status(400).json({ message: 'A user with this email already exists' });
     }
 
     // Hash password
     const salt = await bcrypt.genSalt(10);
     const passwordHash = await bcrypt.hash(password, salt);
 
     // Create user
     const newUser = await createUser({
       username,
       email,
       password: passwordHash,
       salary: 0,
       avatar: `avatar${Math.floor(Math.random() * 8) + 1}`, // Random initial avatar
       occupation: occupation || '',
       place: place || '',
       securityQuestion: securityQuestion || 'What is your pet name?',
       securityAnswer: securityAnswer ? securityAnswer.toLowerCase().trim() : 'buddy'
     });
 
     const token = generateToken(newUser._id);
 
     res.status(201).json({
       token,
       user: {
         id: newUser._id,
         username: newUser.username,
         email: newUser.email,
         salary: newUser.salary,
         salaryDate: newUser.salaryDate,
         lastSavingsCreditMonth: newUser.lastSavingsCreditMonth,
         avatar: newUser.avatar,
         occupation: newUser.occupation,
         place: newUser.place,
         securityQuestion: newUser.securityQuestion
       }
     });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Log In
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        salary: user.salary,
        salaryDate: user.salaryDate,
        lastSavingsCreditMonth: user.lastSavingsCreditMonth,
        avatar: user.avatar,
        occupation: user.occupation,
        place: user.place,
        securityQuestion: user.securityQuestion
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google Login Mock Hook
export const googleLogin = async (req, res) => {
  try {
    const { email, username, googleId } = req.body;

    if (!email || !username) {
      return res.status(400).json({ message: 'Google authentication details missing' });
    }

    let user = await getUserByEmail(email);

    // If user does not exist, create a mock Google user
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + 'G!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await createUser({
        username,
        email,
        password: passwordHash,
        salary: 0,
        avatar: 'avatar_google', // Google preset avatar
        securityQuestion: 'Google login verified?',
        securityAnswer: 'yes'
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        salary: user.salary,
        salaryDate: user.salaryDate,
        lastSavingsCreditMonth: user.lastSavingsCreditMonth,
        avatar: user.avatar,
        occupation: user.occupation,
        place: user.place,
        securityQuestion: user.securityQuestion
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ message: 'Server error during Google Login authentication' });
  }
};

// Forgot Password Security Validation & Reset
export const forgotPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ message: 'Please fill out all recovery fields' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address' });
    }

    const cleanedAnswer = securityAnswer.toLowerCase().trim();
    const storedAnswer = user.securityAnswer.toLowerCase().trim();

    if (cleanedAnswer !== storedAnswer) {
      return res.status(400).json({ message: 'Incorrect answer to security recovery question' });
    }

    // Reset password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await updateUser(user._id, { password: passwordHash });

    res.json({ message: 'Password has been successfully reset! You can now log in.' });
  } catch (err) {
    console.error('Password Recovery Error:', err);
    res.status(500).json({ message: 'Server error during password recovery' });
  }
};

// Get Current User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      salary: user.salary,
      salaryDate: user.salaryDate,
      lastSavingsCreditMonth: user.lastSavingsCreditMonth,
      avatar: user.avatar,
      occupation: user.occupation,
      place: user.place,
      securityQuestion: user.securityQuestion
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    res.status(500).json({ message: 'Server error loading profile' });
  }
};

// Update Profile Settings
export const updateProfile = async (req, res) => {
  try {
    const { username, salary, salaryDate, avatar, securityQuestion, securityAnswer, password, occupation, place } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (salary !== undefined) updates.salary = Number(salary);
    if (salaryDate !== undefined) updates.salaryDate = Number(salaryDate);
    if (avatar) updates.avatar = avatar;
    if (securityQuestion) updates.securityQuestion = securityQuestion;
    if (securityAnswer) updates.securityAnswer = securityAnswer.toLowerCase().trim();
    if (occupation !== undefined) updates.occupation = occupation;
    if (place !== undefined) updates.place = place;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await updateUser(req.userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile settings updated successfully!',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        salary: updatedUser.salary,
        salaryDate: updatedUser.salaryDate,
        lastSavingsCreditMonth: updatedUser.lastSavingsCreditMonth,
        avatar: updatedUser.avatar,
        occupation: updatedUser.occupation,
        place: updatedUser.place,
        securityQuestion: updatedUser.securityQuestion
      }
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: 'Server error updating profile settings' });
  }
};
