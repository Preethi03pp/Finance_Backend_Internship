const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes.js');
const protectedRoutes = require('./routes/protectedRoutes.js');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes.js');
const errorHandler = require('./middleware/errorMiddleware.js');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use('/api/protected', protectedRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.send("API Running");
});
app.use(errorHandler);

module.exports = app;