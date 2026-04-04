const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await connectDB();

  await User.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  await User.create({
    name: 'Admin User', 
    email: 'admin@gmail.com',
    password: hashedPassword,
    role: 'admin'
  });

  await User.create({
    name: 'Analyst User', 
    email: 'analyst@gmail.com',
    password: hashedPassword,
    role: 'analyst'
  });

  await User.create({
    name: 'Viewer User', 
    email: 'viewer@gmail.com',
    password: hashedPassword,
    role: 'viewer'
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});