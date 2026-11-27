const express = require('express');
const { check } = require('express-validator');
const { getAllUsers, updateUser, deleteUser, updateOwnProfile } = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');
const validateObjectId = require('../utils/validateObjectId');

const router = express.Router();

// Routes list with http methods
router.get('/', isAuthenticated, authorizeRoles('admin'), getAllUsers);
// Registered before '/:id' routes so the literal path is matched first
router.put(
  '/me/update',
  isAuthenticated,
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
  ],
  updateOwnProfile
);
router.put(
  '/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  validateObjectId(),
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('role', 'Invalid role').optional().isIn(['admin', 'supplier', 'customer', 'support']),
  ],
  updateUser
);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), validateObjectId(), deleteUser);

module.exports = router;
