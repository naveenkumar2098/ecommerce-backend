const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 
 * @desc    Register a new user
 * @route   POST api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  logger.info('Register controller called!');
  // Validation check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validations failed during register', { errors: errors.array() })
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;
  try {
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`User registration failed - Email already exists: ${email}`);
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const user = await User.create({ name, email, password, role });
    logger.info(`New user registered: ${user.id}`);

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    logger.info(`JWT token generated for user: ${user.id}`);
    res.status(201).json({ token });
  } catch (error) {
    logger.error(`Error encountered during user registration`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Login user
 * @route   POST api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  logger.info(`Login controller called!`);
  const { email, password } = req.body;
  try {
    // Check for email and password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn(`Login failed - User not found! : ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn(`Login failed - Incorrect password for user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    logger.info(`User logged in successfully: ${user.id}`);
    res.status(200).json({ token });
  } catch (error) {
    logger.error(`Error encountered during user login`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Forgot password
 * @route   POST api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  logger.info(`Forgot password controller called!`);
  const { email } = req.body;
  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Forgot password failed - User not found: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Create reset url and message for forgot password mail
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you requested a password reset. Please visit the below link to change password: \n\n ${resetUrl}`;

    try {
      // Send mail
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
      });
      logger.info(`Password reset mail sent to: ${email}`);
      res.status(200).json({ message: 'Email sent' });
    } catch (error) {
      logger.error(`Error encountered during mail sending process`, { error });
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    logger.error(`Error encountered during forgot password process`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Reset password
 * @route   POST api/auth/resetpassword/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  logger.info(`Reset password controller called!`);
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    // Check if user's reset password token is expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn(`Reset password failed - Invalid or expired token`);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password and save to database
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    logger.info(`Password reset successful for user: ${user.id}`);

    // Generate new JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.status(200).json({ token });
  } catch (error) {
    logger.error(`Error encountered during password reset`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  logger.info(`Get current logged-in user controller called!`);
  try {
    // `req.user` is populated by the isAuthenticated middleware
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error encountered during fetching current logged in user`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * 
 * @desc    Logout
 * @route   POST /api/auth/me
 * @access  Private
 */
// No server-side implementation needed for stateless JWT.
exports.logout = (req, res) => {
  res.status(200).json({ message: 'User logged out successfully' });
};