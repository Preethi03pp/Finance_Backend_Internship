// Email format validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Amount validation
const isValidAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
};

// Date validation
const isValidDate = (date) => {
  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed);
};

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};

// Role validation
const isValidRole = (role) => {
  return ['viewer', 'analyst', 'admin'].includes(role);
};

// Transaction type validation
const isValidType = (type) => {
  return ['income', 'expense'].includes(type);
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidAmount,
  isValidDate,
  isValidObjectId,
  isValidRole,
  isValidType
};