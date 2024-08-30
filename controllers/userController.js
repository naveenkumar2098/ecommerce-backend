const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 
 * @desc    Get all users
 * @route   GET api/users/
 * @access  Admin
 */
exports.getAllUsers = async (req, res) => {
  logger.info(`Get all users controller called!`);
  try {
    // Get users list
    const users = await User.find();
    logger.info(`Fetched list of all users`);
    res.status(200).json(users);
  } catch (error) {
    logger.error(`Error encountered during fetching all users`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Update user details
 * @route   PUT api/users/:id
 * @access  Admin
 */
exports.updateUser = async (req, res) => {
  logger.info(`Update user controller called!`);

  // Validation check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validations failed during update`, { errors: errors.array() });
    return res.status(422).json({ errors: errors.array() });
  }

  const { id } = req.params;
  try {
    // Find user and update
    const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!user) {
      logger.warn(`Update user failed - User not found: ${id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Update user details successful: ${id}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error encountered during updating user details`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Delete user
 * @route   DELETE api/users/:id
 * @access  Admin
 */
exports.deleteUser = async (req, res) => {
  logger.info(`Delete user controller callled!`);
  const { id } = req.params;
  try {
    // Find user and delete
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      logger.warn(`Delete user failed - User not found: ${id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Delete user successful: ${id}`);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    logger.error(`Error encountered during delete user process`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};


/**
 * 
 * @desc    Update own user details
 * @route   PUT api/users/me/update
 * @access  Authenticated
 */
exports.updateOwnProfile = async (req, res) => {
  logger.info(`Update own profile details controller called!`);

  // Validation check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validations failed during update own profile`, { errors: errors.array() });
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    // Find user and update
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
    if (!user) {
      logger.warn(`Update own profile failed - User not found: ${user._id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Profile updated successfully for user: ${user._id}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error encountered during updating own profile`, { error });
    res.status(500).json({ message: 'Server error', error });
  }
};