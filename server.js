import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import questionsRouter from './routes/questions.js';
import sessionsRouter from './routes/sessions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 λεπτά
  max: 200,
  message: { success: false, message: 'Πολλά requests, δοκίμασε αργότερα' }
});
app.use('/api', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Programming Quest API',
    version: '1.0.0',
    endpoints: {
      questions: '/api/questions',
      random: '/api/questions/random',
      sessions: '/api/sessions',
      stats: '/api/sessions/stats',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/questions', questionsRouter);
app.use('/api/sessions', sessionsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint δεν βρέθηκε' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Σφάλμα server' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
