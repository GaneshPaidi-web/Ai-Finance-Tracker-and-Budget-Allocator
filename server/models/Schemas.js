import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salary: { type: Number, default: 0 },
  salaryDate: { type: Number, default: 1 },
  lastSavingsCreditMonth: { type: String, default: '' },
  avatar: { type: String, default: 'avatar1' },
  occupation: { type: String, default: '' },
  place: { type: String, default: '' },
  securityQuestion: { type: String, default: 'What is your pet name?' },
  securityAnswer: { type: String, default: 'buddy' },
  createdAt: { type: Date, default: Date.now }
});

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true }, // Food, Travel, Shopping, Bills, Healthcare, Entertainment, Salary, Investments, Others
  paymentMethod: { type: String, default: 'Cash' }, // Cash, Card, UPI, Bank Transfer
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false }
});

// Goal Schema
const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentSaved: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Subscription Schema (Recurring Expenses)
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g. Netflix, Rent, EMI, Spotify
  amount: { type: Number, required: true },
  category: { type: String, default: 'Bills' },
  dueDate: { type: Number, required: true }, // Day of the month (1-31)
  frequency: { type: String, default: 'monthly' },
  isActive: { type: Boolean, default: true }
});

// Budget Allocation Schema (AI / Custom targets)
const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salary: { type: Number, required: true },
  allocated: {
    essentials: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    investments: { type: Number, default: 0 },
    emergency: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 }
  },
  customBreakdown: {
    rent: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    bills: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    others: { type: Number, default: 0 }
  },
  updatedAt: { type: Date, default: Date.now }
});

// Compile and export Mongoose Models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
export const Budget = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);

const ChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
