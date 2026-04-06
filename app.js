const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes.js');
const errorHandler = require('./middleware/errorMiddleware.js');

dotenv.config();

const app = express();
app.use(express.json());

// =======================
// 🔒 RATE LIMITING
// =======================

// Global limit — 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  }
});

// Strict limit for login — 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  }
});

// Apply global limiter to all routes
app.use(globalLimiter);

// Apply strict limiter to login only
app.use('/api/auth/login', loginLimiter);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.send("API Running");
});
app.use(errorHandler);

module.exports = app;