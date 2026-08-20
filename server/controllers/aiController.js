import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getUserById,
  getTransactions,
  getGoals,
  getSubscriptions,
  getBudget,
  getChatHistory as dbGetChatHistory,
  saveChatMessage
} from '../utils/dbClient.js';

// Initialize Gemini if API key is present
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`[Gemini Client Config] Checking API Key... Found: ${apiKey ? 'YES (' + apiKey.substring(0, 8) + '...)' : 'NO'}`);
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini')) {
    console.warn('⚠️ Gemini API key is missing, empty, or placeholder. Falling back to local AI models.');
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('❌ Failed to initialize Gemini Client:', err.message);
    return null;
  }
};

// ==========================================
// 1. AUTO CATEGORIZE (NLP Parser)
// ==========================================
export const autoCategorize = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Input prompt text is empty' });
    }

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const prompt = `
          You are an AI assistant for a finance tracker.
          Analyze this transaction input text: "${text}"
          Extract:
          1. The transaction amount (number only)
          2. The note/description (e.g. "Swiggy order" or "Got pocket money")
          3. The category. You MUST choose ONLY from these categories:
             - Food
             - Travel
             - Shopping
             - Bills
             - Healthcare
             - Entertainment
             - Salary
             - Investments
             - Others
          4. The transaction type: "income" or "expense". (e.g., Salary is income, buying food is expense)

          Return ONLY a JSON object in this format. No explanation, no markdown blocks.
          {
            "amount": 0,
            "category": "categoryName",
            "notes": "description text",
            "type": "income" or "expense"
          }
        `;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean JSON formatting if Gemini wrapped it in markdown
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return res.json(parsed);
      } catch (geminiErr) {
        console.warn('Gemini Auto-Categorize failed, falling back to Local NLP:', geminiErr.message);
      }
    }

    // LOCAL NLP FALLBACK (Highly robust regex and keyword matcher)
    const lowerText = text.toLowerCase().trim();

    // 1. Extract Amount (detect numbers, support commas/decimals, optionally prefixed by currency symbol)
    const amountRegex = /(?:₹|rs\.?|inr|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i;
    const matchAmount = lowerText.match(amountRegex);
    let amount = 0;
    if (matchAmount && matchAmount[1]) {
      amount = parseFloat(matchAmount[1].replace(/,/g, ''));
    }

    // 2. Extract Category and Notes by parsing keywords
    let category = 'Others';
    let type = 'expense';
    let notes = text.trim();

    const categoryKeywords = {
      Food: ['swiggy', 'zomato', 'restaurant', 'pizza', 'burger', 'food', 'cafe', 'dmart', 'grocery', 'groceries', 'lunch', 'dinner', 'starbucks', 'eat', 'maggi', 'mcdonalds', 'kfc'],
      Travel: ['uber', 'ola', 'cab', 'taxi', 'metro', 'fuel', 'petrol', 'diesel', 'train', 'flight', 'ticket', 'bus', 'travel', 'auto', 'rapido'],
      Shopping: ['amazon', 'myntra', 'flipkart', 'zara', 'clothing', 'clothes', 'shoes', 'shopping', 'bought', 'mall', 'gear', 'tshirt', 'jeans'],
      Bills: ['rent', 'electricity', 'electric', 'power', 'wifi', 'broadband', 'internet', 'water', 'gas', 'bill', 'recharge', 'mobile', 'phone', 'dth', 'tv', 'broadband', 'house rent', 'landlord'],
      Healthcare: ['doctor', 'hospital', 'clinic', 'pharmacy', 'medicine', 'medicines', 'health', 'dentist', 'checkup', 'test', 'pharmeasy', 'meds'],
      Entertainment: ['netflix', 'spotify', 'youtube', 'icloud', 'sub', 'subscription', 'movie', 'multiplex', 'popcorn', 'concert', 'gaming', 'pub', 'club', 'party', 'beer', 'wine'],
      Salary: ['salary', 'paycheck', 'credit', 'got paid', 'bonus', 'dividend', 'deposit', 'received salary', 'stipend', 'income'],
      Investments: ['stock', 'stocks', 'mutual fund', 'crypto', 'gold', 'invest', 'investment', 'sip', 'groww', 'zerodha', 'upstox', 'coin', 'etf']
    };

    // Find first matching category
    for (const [catName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        category = catName;
        break;
      }
    }

    // If category is Salary, check if it's income
    if (category === 'Salary' || lowerText.includes('received') || lowerText.includes('credited')) {
      type = 'income';
    }

    // Clean description: strip the amount out of the text to make a nice description
    let cleanNote = text.replace(amountRegex, '').replace(/(?:for|at|on|spent|paid)\s*$/i, '').trim();
    // Capitalize first letter
    if (cleanNote) {
      cleanNote = cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1);
      notes = cleanNote;
    } else {
      notes = `${category} ${type === 'income' ? 'Income' : 'Expense'}`;
    }

    res.json({
      amount,
      category,
      notes,
      type
    });
  } catch (err) {
    console.error('Auto Categorize Error:', err);
    res.status(500).json({ message: 'Server error parsing auto categorization' });
  }
};

// ==========================================
// 2. AI BUDGET ALLOCATION
// ==========================================
export const allocateBudget = async (req, res) => {
  try {
    const { salary, rent, bills, lifestyle, savingsGoals } = req.body;
    const baseSalary = Number(salary) || 0;
    const baseRent = Number(rent) || 0;
    const baseBills = Number(bills) || 0;
    const baseLifestyle = Number(lifestyle) || 0;
    const baseGoals = Number(savingsGoals) || 0;

    if (baseSalary <= 0) {
      return res.status(400).json({ message: 'Salary must be a positive number to allocate a budget' });
    }

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const prompt = `
          You are an AI financial planning expert.
          User wants to allocate their monthly salary of ₹${baseSalary}.
          Monthly fixed constraints:
          - Rent: ₹${baseRent}
          - Utility Bills: ₹${baseBills}
          - Current Lifestyle Expenses: ₹${baseLifestyle}
          - Monthly Savings Goals Target: ₹${baseGoals}

          Please analyze their financial profile and automatically distribute their salary into these 5 standard categories:
          1. Essentials (Rent, bills, groceries, core medical - MUST cover rent of ₹${baseRent} + bills of ₹${baseBills} as base)
          2. Savings (Cash savings, liquid deposits)
          3. Investments (Stocks, mutual funds, gold, long-term retirement)
          4. Emergency funds (Short term backup)
          5. Entertainment (Dining out, shopping, hobbies, movies)

          The sum of these 5 categories MUST be EXACTLY ₹${baseSalary}.
          Also, suggest specific sub-allocations like Rent, Groceries, Transport, Stocks, SIP, Movies, Shopping, emergency buffer.

          Return ONLY a JSON response matching this EXACT format (no markdown blocks, no text):
          {
            "allocated": {
              "essentials": 0,
              "savings": 0,
              "investments": 0,
              "emergency": 0,
              "entertainment": 0
            },
            "customBreakdown": {
              "rent": ${baseRent},
              "food": 0,
              "transport": 0,
              "bills": ${baseBills},
              "shopping": 0,
              "others": 0
            },
            "justification": "Direct recommendations and action plan text here."
          }
        `;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return res.json(parsed);
      } catch (geminiErr) {
        console.warn('Gemini Budget Allocation failed, falling back to Local Calculator:', geminiErr.message);
      }
    }

    // LOCAL BUDGET CALCULATOR FALLBACK
    // 50/30/20 Rule customized by user inputs
    const essentialsBase = baseRent + baseBills;

    // Default allocations
    let essentials = Math.max(essentialsBase, Math.round(baseSalary * 0.5));
    let savings = Math.max(baseGoals, Math.round(baseSalary * 0.15));
    let investments = Math.round(baseSalary * 0.15);
    let emergency = Math.round(baseSalary * 0.10);
    let entertainment = Math.max(0, Math.round(baseSalary * 0.10));

    // Calculate sum and adjust dynamically
    let totalAllocated = essentials + savings + investments + emergency + entertainment;

    if (totalAllocated > baseSalary) {
      // Scale down discretionary values first
      const excess = totalAllocated - baseSalary;

      // Reduce entertainment first
      const reduceEnt = Math.min(entertainment, excess * 0.4);
      entertainment -= Math.round(reduceEnt);

      // Reduce investments
      const reduceInv = Math.min(investments, (excess - reduceEnt) * 0.5);
      investments -= Math.round(reduceInv);

      // Reduce emergency
      const reduceEmg = Math.min(emergency, (excess - reduceEnt - reduceInv));
      emergency -= Math.round(reduceEmg);

      // Recalculate
      totalAllocated = essentials + savings + investments + emergency + entertainment;
      if (totalAllocated > baseSalary) {
        // Force balance essentials and savings to fit salary
        const remain = baseSalary - (investments + emergency + entertainment);
        essentials = Math.round(remain * (essentials / (essentials + savings)));
        savings = baseSalary - (essentials + investments + emergency + entertainment);
      }
    } else if (totalAllocated < baseSalary) {
      // Add surplus to savings/investments
      const surplus = baseSalary - totalAllocated;
      savings += Math.round(surplus * 0.5);
      investments += Math.round(surplus * 0.5);
    }

    // Generate Custom Breakdown
    const food = Math.round((essentials - baseRent - baseBills) * 0.5) || Math.round(baseSalary * 0.12);
    const transport = Math.round((essentials - baseRent - baseBills) * 0.3) || Math.round(baseSalary * 0.05);
    const others = essentials - baseRent - baseBills - food - transport;

    const shopping = Math.round(entertainment * 0.6);
    const customBreakdown = {
      rent: baseRent || Math.round(baseSalary * 0.3),
      food: Math.max(1000, food),
      transport: Math.max(500, transport),
      bills: baseBills || Math.round(baseSalary * 0.08),
      shopping: shopping,
      others: Math.max(0, others + (entertainment - shopping))
    };

    const justification = `### AuraFinance AI Custom Plan:
Your fixed costs (Rent + Bills) consume **${Math.round((essentialsBase / baseSalary) * 100)}%** of your monthly income. 
* **Essentials (₹${essentials})**: Adjusted to safely cover rent (₹${customBreakdown.rent}) and utility bills (₹${customBreakdown.bills}), with ₹${customBreakdown.food} budgeted for food and groceries.
* **Savings & Buffer (₹${savings})**: Meets your custom goal target of ₹${baseGoals}. We suggest parking this in high-yield liquid accounts.
* **Investments (₹${investments})**: Allocated ₹${investments} (approx ${Math.round((investments / baseSalary) * 100)}%) for stocks/SIP mutual funds to secure long-term compounding growth.
* **Emergency Buffer (₹${emergency})**: Added ₹${emergency} to safeguard against unexpected bill pressure or medical needs.
* **Entertainment & Lifestyle (₹${entertainment})**: Limited to ₹${entertainment} (${Math.round((entertainment / baseSalary) * 100)}%) to keep your finances fully balanced!`;

    res.json({
      allocated: { essentials, savings, investments, emergency, entertainment },
      customBreakdown,
      justification
    });
  } catch (err) {
    console.error('AI Budgeting Error:', err);
    res.status(500).json({ message: 'Server error generating budget allocation' });
  }
};

// ==========================================
// 3. EXPENSE PREDICTIONS (Linear Regression & Analytics)
// ==========================================
export const getPredictions = async (req, res) => {
  try {
    const transactions = await getTransactions(req.userId);
    const user = await getUserById(req.userId);
    const subscriptions = await getSubscriptions(req.userId);

    const expensesOnly = transactions.filter(t => t.type === 'expense');

    // Group expenses by Month (e.g. "2026-03")
    const monthlyTotals = {};
    const categoryTotalsByMonth = {}; // category -> month -> amount

    expensesOnly.forEach(t => {
      const month = new Date(t.date).toISOString().substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(t.amount);

      if (!categoryTotalsByMonth[t.category]) {
        categoryTotalsByMonth[t.category] = {};
      }
      categoryTotalsByMonth[t.category][month] = (categoryTotalsByMonth[t.category][month] || 0) + Number(t.amount);
    });

    const months = Object.keys(monthlyTotals).sort(); // Sorted chronologically

    // LINEAR REGRESSION PREDICTION MODEL
    const predictions = [];
    let slope = 0;
    let intercept = 0;

    if (months.length >= 2) {
      // Compute regression line
      const n = months.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      months.forEach((m, idx) => {
        const x = idx + 1; // Month index starts at 1
        const y = monthlyTotals[m];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      const denominator = (n * sumX2) - (sumX * sumX);
      if (denominator !== 0) {
        slope = ((n * sumXY) - (sumX * sumY)) / denominator;
        intercept = (sumY - (slope * sumX)) / n;
      } else {
        slope = 0;
        intercept = sumY / n;
      }

      // Project next 2 months
      for (let i = 1; i <= 2; i++) {
        const nextX = n + i;
        const nextY = Math.max(0, Math.round(slope * nextX + intercept));

        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const monthLabel = date.toISOString().substring(0, 7);

        predictions.push({
          month: monthLabel,
          predictedAmount: nextY,
          confidence: Math.max(50, Math.round(100 - Math.abs(slope / 100))) // Simple confidence score
        });
      }
    } else {
      // History insufficient (<2 months)
      // Estimate based on current expenses, subscriptions and standard 3% growth
      const currentMonthExpenses = expensesOnly
        .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);

      const baseValue = currentMonthExpenses || (user?.salary * 0.4) || 20000;

      for (let i = 1; i <= 2; i++) {
        const nextY = Math.round(baseValue * Math.pow(1.03, i));
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const monthLabel = date.toISOString().substring(0, 7);

        predictions.push({
          month: monthLabel,
          predictedAmount: nextY,
          confidence: 60 // Lower confidence due to lack of historical data
        });
      }
    }

    // OVERSPENDING RISKS DETECTION
    const overspendingCategories = [];
    if (months.length >= 2) {
      const lastMonth = months[months.length - 2];
      const currentMonth = months[months.length - 1];

      Object.keys(categoryTotalsByMonth).forEach(cat => {
        const lastAmt = categoryTotalsByMonth[cat][lastMonth] || 0;
        const currAmt = categoryTotalsByMonth[cat][currentMonth] || 0;

        if (lastAmt > 0 && currAmt > lastAmt) {
          const increasePct = Math.round(((currAmt - lastAmt) / lastAmt) * 100);
          if (increasePct >= 15) { // Flags growth > 15%
            overspendingCategories.push({
              category: cat,
              increasePercentage: increasePct,
              lastMonthAmount: lastAmt,
              currentMonthAmount: currAmt,
              severity: increasePct > 35 ? 'High' : 'Medium'
            });
          }
        }
      });
    }

    // UPCOMING BILL PRESSURE
    let activeSubCommitments = subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + s.amount, 0);
    const balance = (user?.salary || 0) - (monthlyTotals[months[months.length - 1]] || 0);

    let billPressure = 'Low';
    if (activeSubCommitments > 0) {
      const pressureRatio = activeSubCommitments / (balance > 0 ? balance : 1);
      if (pressureRatio > 0.4 || balance <= 0) {
        billPressure = 'High';
      } else if (pressureRatio > 0.15) {
        billPressure = 'Medium';
      }
    }

    // SPENDING ANALYTICS (Weekend vs Weekday ratio)
    let weekdaySpent = 0;
    let weekendSpent = 0;
    expensesOnly.forEach(t => {
      const day = new Date(t.date).getDay();
      if (day === 0 || day === 5 || day === 6) { // Fri, Sat, Sun counts as weekend
        weekendSpent += Number(t.amount);
      } else {
        weekdaySpent += Number(t.amount);
      }
    });

    const weekendPercentage = Math.round((weekendSpent / ((weekendSpent + weekdaySpent) || 1)) * 100);
    const weekendOverspendingAlert = weekendPercentage > 45; // Flags weekend spending > 45%

    // Format history points for Recharts
    const history = months.map(m => {
      const monthNum = parseInt(m.substring(5), 10);
      return {
        month: monthNum,
        amount: monthlyTotals[m]
      };
    });
    if (history.length === 0) {
      const currentMonthNum = new Date().getMonth() + 1;
      const currentMonthExpenses = expensesOnly
        .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + Number(t.amount), 0);
      history.push({
        month: currentMonthNum,
        amount: currentMonthExpenses
      });
    }

    // Format projection target point
    const firstProjection = predictions[0];
    const projMonthNum = firstProjection ? parseInt(firstProjection.month.substring(5), 10) : new Date().getMonth() + 2;
    const projection = {
      month: projMonthNum === 0 ? 12 : projMonthNum,
      amount: firstProjection ? firstProjection.predictedAmount : 0
    };

    // Calculate category spending averages for overspending alarms
    const categoryAverages = {};
    Object.keys(categoryTotalsByMonth).forEach(cat => {
      const total = Object.values(categoryTotalsByMonth[cat]).reduce((s, a) => s + a, 0);
      categoryAverages[cat] = Math.round(total / (months.length || 1));
    });

    // MoM spending acceleration growth rate
    const averageSpend = months.length > 0 ? (months.reduce((sum, m) => sum + monthlyTotals[m], 0) / months.length) : 20000;
    const growthRate = averageSpend > 0 ? (slope / averageSpend) : 0;

    res.json({
      history,
      projection,
      categoryAverages,
      slope,
      growthRate,
      predictions,
      overspendingCategories,
      billPressure,
      analytics: {
        weekendSpent,
        weekdaySpent,
        weekendPercentage,
        weekendOverspendingAlert
      }
    });
  } catch (err) {
    console.error('Forecaster AI Error:', err);
    res.status(500).json({ message: 'Server error generating predictions' });
  }
};

// ==========================================
// 4. SMART SPENDING INSIGHTS (Dashboard Recommendations)
// ==========================================
export const getInsights = async (req, res) => {
  try {
    const transactions = await getTransactions(req.userId);
    const subscriptions = await getSubscriptions(req.userId);
    const user = await getUserById(req.userId);

    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const recommendations = [];

    // 1. Alert: Expenses > 70% of Salary
    if (user?.salary > 0) {
      const burnRate = totalExpenses / user.salary;
      if (burnRate > 0.8) {
        recommendations.push({
          type: 'danger',
          title: 'Critical Spending Alert',
          text: `You have spent **${Math.round(burnRate * 100)}%** of your salary! Remaining cash is extremely low. Stop all discretionary spending immediately.`
        });
      } else if (burnRate > 0.6) {
        recommendations.push({
          type: 'warning',
          title: 'High Burn Rate',
          text: `You have spent **${Math.round(burnRate * 100)}%** of your salary. Consider delaying major shopping purchases until next month.`
        });
      } else if (totalExpenses > 0) {
        recommendations.push({
          type: 'success',
          title: 'Healthy Budget Control',
          text: `Awesome! You have only spent **${Math.round(burnRate * 100)}%** of your budget. Keep it up to meet your savings goals!`
        });
      }
    }

    // 2. Alert: Subscription Waste
    const activeSubs = subscriptions.filter(s => s.isActive);
    const totalSubsCost = activeSubs.reduce((sum, s) => sum + s.amount, 0);
    if (activeSubs.length >= 3) {
      recommendations.push({
        type: 'info',
        title: 'Subscription Audit',
        text: `You have **${activeSubs.length} active recurring subscriptions** costing **₹${totalSubsCost}/month**. Review if any of Netflix, Spotify or iCloud could be canceled.`
      });
    }

    // 3. Category High Expense
    const catTotals = {};
    expenses.forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });

    let topCategory = null;
    let maxAmount = 0;
    Object.keys(catTotals).forEach(cat => {
      if (catTotals[cat] > maxAmount) {
        maxAmount = catTotals[cat];
        topCategory = cat;
      }
    });

    if (topCategory && maxAmount > 0 && totalExpenses > 0) {
      const topPct = Math.round((maxAmount / totalExpenses) * 100);
      if (topPct > 30 && topCategory !== 'Bills') {
        recommendations.push({
          type: 'warning',
          title: `Heavy ${topCategory} Spending`,
          text: `Your spending in **${topCategory}** represents **${topPct}%** of your total monthly expenses. Look into reducing this next week.`
        });
      }
    }

    // 4. General saving advice if no recommendation is generated
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Ready for Investing',
        text: 'Your spending habits look incredible. You have strong remaining margins. It is the perfect time to set up a SIP or invest in low-cost mutual funds.'
      });
    }

    res.json(recommendations);
  } catch (err) {
    console.error('Insights AI Error:', err);
    res.status(500).json({ message: 'Server error loading smart recommendations' });
  }
};

// ==========================================
// 5. AI FINANCIAL ADVISOR CHATBOT
// ==========================================
export const chatAdvisor = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Chat message cannot be empty' });
    }

    const user = await getUserById(req.userId);
    const transactions = await getTransactions(req.userId);
    const goals = await getGoals(req.userId);
    const subscriptions = await getSubscriptions(req.userId);
    const budget = await getBudget(req.userId);

    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncomes = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    const activeSubs = subscriptions.filter(s => s.isActive);
    const subCost = activeSubs.reduce((sum, s) => sum + s.amount, 0);

    const budgetStats = budget ? `
      - Essentials Target: ₹${budget.allocated.essentials}
      - Savings Target: ₹${budget.allocated.savings}
      - Investments Target: ₹${budget.allocated.investments}
    ` : 'No custom budget allocated yet.';

    const goalsList = goals.map(g => `- ${g.name}: Target ₹${g.targetAmount}, Saved ₹${g.currentSaved} (Due ${g.targetDate ? new Date(g.targetDate).toISOString().substring(0, 10) : 'N/A'})`).join('\n');
    const subsList = activeSubs.map(s => `- ${s.name}: ₹${s.amount}/mo (Due day ${s.dueDate})`).join('\n');

    // Compile Context
    const financeContext = `
      You are Aura, a friendly, professional personal finance coach.
      User Profile:
      - Name: ${user?.username}
      - Occupation: ${user?.occupation || 'N/A'}
      - Location/Place: ${user?.place || 'N/A'}
      - Base Monthly Salary: ₹${user?.salary}
      - Current Month Total Income: ₹${totalIncomes}
      - Current Month Total Expenses: ₹${totalExpenses}
      - Remaining Balance: ₹${(user?.salary || 0) - totalExpenses}
      
      Custom Budget Allocated:
      ${budgetStats}

      Savings Goals:
      ${goalsList || 'None created yet'}

      Active Recurring Subscriptions:
      ${subsList || 'None detected yet'}
      - Monthly recurring cost: ₹${subCost}

      Recent Expenses:
      ${expenses.slice(0, 6).map(t => `- [${t.date ? new Date(t.date).toISOString().substring(0, 10) : 'N/A'}] ${t.category}: ₹${t.amount} (${t.notes})`).join('\n')}
    `;

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-3.5-flash' });

        // Map history to Gemini format
        const contents = [];
        // System context injected as system instruction or prepended
        contents.push({
          role: 'user',
          parts: [{ text: `SYSTEM INSTRUCTION: You are Aura, an expert AI Personal Finance advisor. You must answer the user based on their actual financial situation. Here is their context:\n${financeContext}\n\nInitialize chat conversation.` }]
        });
        contents.push({
          role: 'model',
          parts: [{ text: `Hello ${user?.username || 'friend'}! I am Aura, your personal AI Financial Coach. I've audited your transactions, active subscriptions, and savings goals. How can I help you improve your financial wellness today?` }]
        });

        // Add history
        if (history && history.length > 0) {
          history.forEach(h => {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          });
        }

        // Add latest message
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const result = await model.generateContent({ contents });
        const responseText = result.response.text();
        await saveChatMessage(req.userId, 'user', message);
        await saveChatMessage(req.userId, 'model', responseText);
        return res.json({ response: responseText });
      } catch (geminiErr) {
        console.warn('Gemini chatAdvisor failed, falling back to Local Conversational Agent:', geminiErr.message);
      }
    }

    // LOCAL EXPERT CHATBOT FALLBACK (Keyword & Context Aware Parser)
    const query = message.toLowerCase().trim();
    let reply = '';

    if (query.includes('save') || query.includes('saving') || query.includes('more')) {
      const savingTarget = budget ? budget.allocated.savings : Math.round((user?.salary || 50000) * 0.2);
      const goalsText = goals.length > 0
        ? `I see you are working towards **${goals.length} goals**: \n${goals.map(g => `* **${g.name}** (₹${g.currentSaved} saved of ₹${g.targetAmount})`).join('\n')}`
        : "You haven't set up any savings goals yet! Head over to the **Savings Goals** tab to set some up.";

      reply = `Hello ${user?.username}! Saving more starts with small structural shifts. 

Here is an analysis of your numbers:
1. **Target Savings**: Your recommended savings allocation is **₹${savingTarget}/month** (${Math.round((savingTarget / (user?.salary || 1)) * 100)}% of your salary).
2. **Current Margin**: Your remaining balance right now is **₹${(user?.salary || 0) - totalExpenses}**.
3. **Active Goals**:
${goalsText}

**Aura's Save-More Recommendations:**
* **Cut Variable Leakages**: You spent money in variable categories recently. By trimming just 10% of shopping, you could add ₹1,500/mo to your goals.
* **Audit Subscriptions**: You pay **₹${subCost}/month** across subscriptions. Canceling one dormant service would accelerate your progress instantly.
* **Auto-Save**: Transfer ₹${savingTarget} straight to a separate savings account on the day your salary is credited. Don't leave it in your primary card!`;

    } else if (query.includes('high') || query.includes('expense') || query.includes('why')) {
      // Find highest category
      const catTotals = {};
      expenses.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      });

      let topCat = 'None';
      let topAmt = 0;
      Object.keys(catTotals).forEach(c => {
        if (catTotals[c] > topAmt) {
          topAmt = catTotals[c];
          topCat = c;
        }
      });

      if (topAmt > 0) {
        const pct = Math.round((topAmt / totalExpenses) * 100);
        reply = `I audited your transactions, ${user?.username}. Your total expenses this month are **₹${totalExpenses}**.

The main driver behind your high expenses is **${topCat}**, where you spent **₹${topAmt}** (${pct}% of all expenses).

**Here is where your money is draining:**
* **${topCat}**: ₹${topAmt} (${pct}%)
* **Active Subscriptions**: ₹${subCost} per month (Netflix, Spotify, etc.)
* **Recent transaction**: You spent ₹${expenses[0]?.amount || 0} in *${expenses[0]?.category || 'Others'}* recently.

**My Recommendations to Cool Down Spending:**
1. Try putting a **₹${Math.round(topAmt * 0.75)} category cap** on *${topCat}* next month.
2. Cook at home on weekends! Weekend leaks account for a noticeable share of variable drains.
3. Review your **AI Budget Plan** to see if your targets match your actual spending!`;
      } else {
        reply = `You haven't logged any expenses yet this month, ${user?.username}! That's why your spending is 0. Once you add transactions in the **Expenses** tab, I'll audit them and show you exactly where leaks are occurring!`;
      }

    } else if (query.includes('invest') || query.includes('investment') || query.includes('stock') || query.includes('sip')) {
      const investTarget = budget ? budget.allocated.investments : Math.round((user?.salary || 50000) * 0.15);
      reply = `Hello ${user?.username}! Investing is the single best way to beat inflation and compound your wealth.

Based on your base income (₹${user?.salary}), you should aim to invest **₹${investTarget}/month** (approx 15%).

**Aura's Smart Investment Blueprint:**
1. **Emergency Shield First**: Never invest money you'll need in 6 months. Maintain a **₹${Math.round((user?.salary || 50000) * 3)} emergency fund** in a liquid savings account first.
2. **Mutual Funds SIP (Core Portfolio)**: Set up a recurring Monthly SIP:
   * **70% in Low-Cost Index Funds** (e.g. Nifty 50 Index Fund) for robust, diversified market returns.
   * **30% in Active Mid-cap / Small-cap funds** for alpha growth.
3. **Tax-Savers (PPF / ELSS)**: Allocate a portion to tax-saving schemes to double your returns.

Would you like me to help calculate how much a monthly SIP of ₹5,000 would grow in 10 years at a standard 12% compounding interest?`;

    } else if (query.includes('budget') || query.includes('plan') || query.includes('allocate')) {
      reply = `Setting up a budget budget is like mapping out a roadmap before a roadtrip!

Right now, your actual expenses are **₹${totalExpenses}** against your salary of **₹${user?.salary || 0}**. 

I highly recommend visiting the **AI Budget Allocator** tab on the sidebar. By plugging in your Rent, Bills, and Lifestyle costs, our AI Allocator will instantly distribute your cash into:
* **Essentials (50%)**: Groceries, transport, shelter.
* **Savings & Investments (30%)**: Goals, retirement, stocks.
* **Entertainment (20%)**: Shopping, dining, hobbies.

Once applied, your Dashboard will visually track your spending progress against these exact AI targets in real-time!`;

    } else {
      reply = `Hello ${user?.username || 'there'}! I am Aura, your personal AI Financial Coach. 

I've audited your active goals, subscriptions, and recent expenses. Here is a quick snapshot:
* **Balance Shield**: Your remaining cash buffer is **₹${(user?.salary || 0) - totalExpenses}**.
* **Recurring Bill Pressure**: Subscriptions consume **₹${subCost}/month**.

Ask me anything like:
* *"Can I save more this month?"*
* *"Why are my expenses high?"*
* *"How should I invest ₹5,000/month?"*
* *"Tell me my weekend spending habits."*

What's on your mind today? Let's get your money working for you!`;
    }

    await saveChatMessage(req.userId, 'user', message);
    await saveChatMessage(req.userId, 'model', reply);
    res.json({ response: reply });
  } catch (err) {
    console.error('Advisor Chat Error:', err);
    res.status(500).json({ message: 'Server error processing AI chatbot consultation' });
  }
};

export const fetchChatHistory = async (req, res) => {
  try {
    const history = await dbGetChatHistory(req.userId);
    res.json(history);
  } catch (err) {
    console.error('Fetch Chat History Error:', err);
    res.status(500).json({ message: 'Server error retrieving chat history' });
  }
};
