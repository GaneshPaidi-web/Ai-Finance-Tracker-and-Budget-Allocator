import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Transaction, Goal, Subscription, Budget, ChatMessage } from '../models/Schemas.js';

// Setup file paths for local JSON database
const DATA_DIR = path.resolve('server/data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

let useLocalDb = false;

// Helper to generate custom 24-character hex MongoDB-like ObjectIDs
export const generateId = () => {
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

// Default seed demo user for local db
const createDemoUser = () => {
  const salt = bcrypt.genSaltSync(10);
  return {
    _id: '650000000000000000000001',
    username: 'Demo User',
    email: 'demo@aurafinance.com',
    password: bcrypt.hashSync('password123', salt),
    salary: 50000,
    salaryDate: 1,
    lastSavingsCreditMonth: '',
    avatar: 'avatar1',
    occupation: 'Software Engineer',
    place: 'San Francisco, CA',
    securityQuestion: 'What is your pet name?',
    securityAnswer: 'buddy',
    createdAt: new Date().toISOString()
  };
};

// Initial template for local JSON DB
const getInitialLocalDb = () => ({
  users: [createDemoUser()],
  transactions: [],
  goals: [],
  subscriptions: [],
  budgets: [],
  chatMessages: []
});

// Read local JSON DB
const readLocalDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const initialDb = getInitialLocalDb();
    if (!fs.existsSync(JSON_DB_PATH)) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
      return initialDb;
    }
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    const parsed = JSON.parse(data || '{}');
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = [createDemoUser()];
      writeLocalDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading local JSON database:', err);
    return getInitialLocalDb();
  }
};

// Write local JSON DB
const writeLocalDb = (data) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local JSON database:', err);
  }
};

// Initialize Database connection
export const initDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️ No MONGODB_URI found in environment variables.');
    console.log(`📂 Falling back to secure local JSON Database: ${JSON_DB_PATH}`);
    useLocalDb = true;
    readLocalDb(); // Ensure folder/file is created with seed user
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ Successfully connected to MongoDB database!');
    useLocalDb = false;

    // Seed Demo User into MongoDB Atlas if not present
    try {
      const existingDemo = await User.findOne({ email: 'demo@aurafinance.com' });
      if (!existingDemo) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        await User.create({
          username: 'Demo User',
          email: 'demo@aurafinance.com',
          password: passwordHash,
          salary: 50000,
          salaryDate: 1,
          avatar: 'avatar1',
          occupation: 'Software Engineer',
          place: 'San Francisco, CA',
          securityQuestion: 'What is your pet name?',
          securityAnswer: 'buddy'
        });
        console.log('🌱 Seeded Demo User (demo@aurafinance.com / password123) into MongoDB Atlas!');
      }
    } catch (seedErr) {
      console.error('Error seeding MongoDB Atlas:', seedErr.message);
    }
  } catch (err) {
    console.log('⚠️ Failed to connect to MongoDB server:', err.message);
    console.log(`📂 Falling back to secure local JSON Database: ${JSON_DB_PATH}`);
    useLocalDb = true;
    readLocalDb(); // Ensure folder/file is created with seed user
  }
};

// ==========================================
// USER DATABASE METHODS
// ==========================================
export const getUserByEmail = async (email) => {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  if (!useLocalDb) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user) return user;
    } catch (err) {
      console.error('MongoDB getUserByEmail Error, checking local DB:', err.message);
    }
    const db = readLocalDb();
    return db.users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail) || null;
  } else {
    const db = readLocalDb();
    const user = db.users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    return user || null;
  }
};

export const getUserById = async (id) => {
  if (!id) return null;
  if (!useLocalDb) {
    try {
      const user = await User.findById(id);
      if (user) return user;
    } catch (err) {
      console.error('MongoDB getUserById error, checking local DB:', err.message);
    }
    const db = readLocalDb();
    return db.users.find(u => u._id === id || String(u._id) === String(id)) || null;
  } else {
    const db = readLocalDb();
    const user = db.users.find(u => u._id === id || String(u._id) === String(id));
    return user || null;
  }
};

export const createUser = async (userData) => {
  const cleanEmail = userData.email ? userData.email.trim().toLowerCase() : '';
  if (!useLocalDb) {
    try {
      const newUser = new User({ ...userData, email: cleanEmail });
      return await newUser.save();
    } catch (err) {
      console.error('MongoDB createUser error, falling back to local DB:', err.message);
    }
  }
  const db = readLocalDb();
  const newUser = {
    _id: generateId(),
    ...userData,
    email: cleanEmail,
    salary: userData.salary || 0,
    salaryDate: userData.salaryDate || 1,
    lastSavingsCreditMonth: userData.lastSavingsCreditMonth || '',
    avatar: userData.avatar || 'avatar1',
    securityQuestion: userData.securityQuestion || 'What is your pet name?',
    securityAnswer: userData.securityAnswer || 'buddy',
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeLocalDb(db);
  return newUser;
};

export const updateUser = async (id, updates) => {
  if (!useLocalDb) {
    return await User.findByIdAndUpdate(id, { $set: updates }, { new: true });
  } else {
    const db = readLocalDb();
    const index = db.users.findIndex(u => u._id === id);
    if (index === -1) return null;
    db.users[index] = { ...db.users[index], ...updates };
    writeLocalDb(db);
    return db.users[index];
  }
};

// ==========================================
// TRANSACTION DATABASE METHODS
// ==========================================
export const getTransactions = async (userId, filters = {}) => {
  if (!useLocalDb) {
    const query = { userId };
    if (filters.category && filters.category !== 'All') {
      query.category = filters.category;
    }
    if (filters.type && filters.type !== 'All') {
      query.type = filters.type;
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'All') {
      query.paymentMethod = filters.paymentMethod;
    }

    let queryExec = Transaction.find(query);

    // Default sorting by date descending
    queryExec = queryExec.sort({ date: -1 });

    return await queryExec;
  } else {
    const db = readLocalDb();
    let txs = db.transactions.filter(t => t.userId === userId);

    if (filters.category && filters.category !== 'All') {
      txs = txs.filter(t => t.category === filters.category);
    }
    if (filters.type && filters.type !== 'All') {
      txs = txs.filter(t => t.type === filters.type);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'All') {
      txs = txs.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    // Sort descending by date
    txs.sort((a, b) => new Date(b.date) - new Date(a.date));
    return txs;
  }
};

export const addTransaction = async (userId, data) => {
  if (!useLocalDb) {
    const newTx = new Transaction({ ...data, userId });
    return await newTx.save();
  } else {
    const db = readLocalDb();
    const newTx = {
      _id: generateId(),
      userId,
      type: data.type,
      amount: Number(data.amount),
      category: data.category,
      paymentMethod: data.paymentMethod || 'Cash',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      notes: data.notes || '',
      isRecurring: !!data.isRecurring
    };
    db.transactions.push(newTx);
    writeLocalDb(db);
    return newTx;
  }
};

export const updateTransaction = async (userId, transactionId, data) => {
  if (!useLocalDb) {
    return await Transaction.findOneAndUpdate(
      { _id: transactionId, userId },
      { $set: data },
      { new: true }
    );
  } else {
    const db = readLocalDb();
    const index = db.transactions.findIndex(t => t._id === transactionId && t.userId === userId);
    if (index === -1) return null;
    db.transactions[index] = {
      ...db.transactions[index],
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : db.transactions[index].amount,
      date: data.date ? new Date(data.date).toISOString() : db.transactions[index].date
    };
    writeLocalDb(db);
    return db.transactions[index];
  }
};

export const deleteTransaction = async (userId, transactionId) => {
  if (!useLocalDb) {
    return await Transaction.findOneAndDelete({ _id: transactionId, userId });
  } else {
    const db = readLocalDb();
    const index = db.transactions.findIndex(t => t._id === transactionId && t.userId === userId);
    if (index === -1) return null;
    const deleted = db.transactions.splice(index, 1)[0];
    writeLocalDb(db);
    return deleted;
  }
};

// ==========================================
// GOALS DATABASE METHODS
// ==========================================
export const getGoals = async (userId) => {
  if (!useLocalDb) {
    return await Goal.find({ userId }).sort({ createdAt: -1 });
  } else {
    const db = readLocalDb();
    return db.goals.filter(g => g.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

export const addGoal = async (userId, data) => {
  if (!useLocalDb) {
    const newGoal = new Goal({ ...data, userId });
    return await newGoal.save();
  } else {
    const db = readLocalDb();
    const newGoal = {
      _id: generateId(),
      userId,
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentSaved: Number(data.currentSaved || 0),
      targetDate: new Date(data.targetDate).toISOString(),
      createdAt: new Date().toISOString()
    };
    db.goals.push(newGoal);
    writeLocalDb(db);
    return newGoal;
  }
};

export const updateGoal = async (userId, goalId, data) => {
  if (!useLocalDb) {
    return await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { $set: data },
      { new: true }
    );
  } else {
    const db = readLocalDb();
    const index = db.goals.findIndex(g => g._id === goalId && g.userId === userId);
    if (index === -1) return null;
    db.goals[index] = {
      ...db.goals[index],
      ...data,
      targetAmount: data.targetAmount !== undefined ? Number(data.targetAmount) : db.goals[index].targetAmount,
      currentSaved: data.currentSaved !== undefined ? Number(data.currentSaved) : db.goals[index].currentSaved,
      targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : db.goals[index].targetDate
    };
    writeLocalDb(db);
    return db.goals[index];
  }
};

export const deleteGoal = async (userId, goalId) => {
  if (!useLocalDb) {
    return await Goal.findOneAndDelete({ _id: goalId, userId });
  } else {
    const db = readLocalDb();
    const index = db.goals.findIndex(g => g._id === goalId && g.userId === userId);
    if (index === -1) return null;
    const deleted = db.goals.splice(index, 1)[0];
    writeLocalDb(db);
    return deleted;
  }
};

// ==========================================
// SUBSCRIPTION DATABASE METHODS (RECURRING EXPENSES)
// ==========================================
export const getSubscriptions = async (userId) => {
  if (!useLocalDb) {
    return await Subscription.find({ userId });
  } else {
    const db = readLocalDb();
    return db.subscriptions.filter(s => s.userId === userId);
  }
};

export const addSubscription = async (userId, data) => {
  if (!useLocalDb) {
    const newSub = new Subscription({ ...data, userId });
    return await newSub.save();
  } else {
    const db = readLocalDb();
    const newSub = {
      _id: generateId(),
      userId,
      name: data.name,
      amount: Number(data.amount),
      category: data.category || 'Bills',
      dueDate: Number(data.dueDate), // Day of month
      frequency: data.frequency || 'monthly',
      isActive: data.isActive !== undefined ? !!data.isActive : true
    };
    db.subscriptions.push(newSub);
    writeLocalDb(db);
    return newSub;
  }
};

export const updateSubscription = async (userId, subId, data) => {
  if (!useLocalDb) {
    return await Subscription.findOneAndUpdate(
      { _id: subId, userId },
      { $set: data },
      { new: true }
    );
  } else {
    const db = readLocalDb();
    const index = db.subscriptions.findIndex(s => s._id === subId && s.userId === userId);
    if (index === -1) return null;
    db.subscriptions[index] = {
      ...db.subscriptions[index],
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : db.subscriptions[index].amount,
      dueDate: data.dueDate !== undefined ? Number(data.dueDate) : db.subscriptions[index].dueDate,
      isActive: data.isActive !== undefined ? !!data.isActive : db.subscriptions[index].isActive
    };
    writeLocalDb(db);
    return db.subscriptions[index];
  }
};

export const deleteSubscription = async (userId, subId) => {
  if (!useLocalDb) {
    return await Subscription.findOneAndDelete({ _id: subId, userId });
  } else {
    const db = readLocalDb();
    const index = db.subscriptions.findIndex(s => s._id === subId && s.userId === userId);
    if (index === -1) return null;
    const deleted = db.subscriptions.splice(index, 1)[0];
    writeLocalDb(db);
    return deleted;
  }
};

// ==========================================
// BUDGET DATABASE METHODS
// ==========================================
export const getBudget = async (userId) => {
  if (!useLocalDb) {
    return await Budget.findOne({ userId });
  } else {
    const db = readLocalDb();
    const budget = db.budgets.find(b => b.userId === userId);
    return budget || null;
  }
};

export const saveBudget = async (userId, data) => {
  if (!useLocalDb) {
    return await Budget.findOneAndUpdate(
      { userId },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
  } else {
    const db = readLocalDb();
    const index = db.budgets.findIndex(b => b.userId === userId);
    const budgetData = {
      userId,
      salary: Number(data.salary),
      allocated: {
        essentials: Number(data.allocated?.essentials || 0),
        savings: Number(data.allocated?.savings || 0),
        investments: Number(data.allocated?.investments || 0),
        emergency: Number(data.allocated?.emergency || 0),
        entertainment: Number(data.allocated?.entertainment || 0)
      },
      customBreakdown: {
        rent: Number(data.customBreakdown?.rent || 0),
        food: Number(data.customBreakdown?.food || 0),
        transport: Number(data.customBreakdown?.transport || 0),
        bills: Number(data.customBreakdown?.bills || 0),
        shopping: Number(data.customBreakdown?.shopping || 0),
        others: Number(data.customBreakdown?.others || 0)
      },
      updatedAt: new Date().toISOString()
    };

    if (index === -1) {
      budgetData._id = generateId();
      db.budgets.push(budgetData);
    } else {
      budgetData._id = db.budgets[index]._id;
      db.budgets[index] = budgetData;
    }

    writeLocalDb(db);
    return budgetData;
  }
};

// ==========================================
// CHAT MESSAGES DATABASE METHODS
// ==========================================
export const getChatHistory = async (userId) => {
  if (!useLocalDb) {
    return await ChatMessage.find({ userId }).sort({ createdAt: 1 });
  } else {
    const db = readLocalDb();
    if (!db.chatMessages) db.chatMessages = [];
    return db.chatMessages
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
};

export const saveChatMessage = async (userId, role, text) => {
  if (!useLocalDb) {
    const newMsg = new ChatMessage({ userId, role, text });
    return await newMsg.save();
  } else {
    const db = readLocalDb();
    if (!db.chatMessages) db.chatMessages = [];
    const newMsg = {
      _id: generateId(),
      userId,
      role,
      text,
      createdAt: new Date().toISOString()
    };
    db.chatMessages.push(newMsg);
    writeLocalDb(db);
    return newMsg;
  }
};
