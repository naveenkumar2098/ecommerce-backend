const express = require('express');
const { check } = require('express-validator');
const { register, login, forgotPassword, resetPassword, getCurrentUser , logout} = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

// Routes list with methods
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  register
);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.get('/me', isAuthenticated, getCurrentUser);
router.post('/logout', isAuthenticated, logout);

module.exports = router;