const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Clean up test users before creating fresh ones
  await User.deleteMany({
    email: { $in: ['testadmin@gmail.com', 'testanalyst@gmail.com', 'testviewer@gmail.com'] }
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  await User.create({ name: 'Admin User',   email: 'testadmin@gmail.com',   password: hashedPassword, role: 'admin' });
  await User.create({ name: 'Analyst User', email: 'testanalyst@gmail.com', password: hashedPassword, role: 'analyst' });
  await User.create({ name: 'Viewer User',  email: 'testviewer@gmail.com',  password: hashedPassword, role: 'viewer' });
});

afterAll(async () => {
  await User.deleteMany({
    email: { $in: ['testadmin@gmail.com', 'testanalyst@gmail.com', 'testviewer@gmail.com'] }
  });
  await mongoose.connection.close();
});