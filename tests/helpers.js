const jwt = require('jsonwebtoken');
const User = require('../models/User');

let counter = 0;

exports.createUser = async ({ role = 'customer', name, email, password = 'password123' } = {}) => {
  counter += 1;
  const user = await User.create({
    name: name || `User ${counter}`,
    email: email || `user${counter}_${Date.now()}@example.com`,
    password,
    role,
  });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return { user, token, password };
};

exports.authHeader = (token) => ({ Authorization: `Bearer ${token}` });
