const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Only clean up test users, not real ones
  await User.deleteMany({ email: { $in: ['admin1@gmail.com', 'analyst1@gmail.com', 'viewer1@gmail.com'] } });

  const hashedPassword = await bcrypt.hash('password123', 10);

  await User.create({ name: 'Admin User', email: 'admin1@gmail.com', password: hashedPassword, role: 'admin' });
  await User.create({ name: 'Analyst User', email: 'analyst1@gmail.com', password: hashedPassword, role: 'analyst' });
  await User.create({ name: 'Viewer User', email: 'viewer1@gmail.com', password: hashedPassword, role: 'viewer' });
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: ['admin1@gmail.com', 'analyst1@gmail.com', 'viewer1@gmail.com'] } });
  await mongoose.connection.close();
});