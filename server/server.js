import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './utils/dbClient.js';
import authRoutes from './routes/authRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// API Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AuraFinance AI Backend'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Boot Server & Initialize DB
const startServer = async () => {
  try {
    console.log('🚀 Booting AuraFinance AI backend...');
    await initDb();
    
    app.listen(PORT, () => {
      console.log(`📡 Server running in development mode on: http://localhost:${PORT}`);
      console.log('⭐️ Ready to handle smart personal finance tracking!');
    });
  } catch (err) {
    console.error('❌ Failed to boot Express Server:', err.message);
    process.exit(1);
  }
};

startServer();
