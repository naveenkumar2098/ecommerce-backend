const express = require('express');
const { check } = require('express-validator');
const { getAllUsers, updateUser, deleteUser, updateOwnProfile } = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');

const router = express.Router();

// Routes list with http methods
router.get('/', isAuthenticated, authorizeRoles('admin'), getAllUsers);
router.put(
  '/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
  ],
  updateUser
);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), deleteUser);
router.put(
  '/me/update',
  isAuthenticated,
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
  ],
  updateOwnProfile
);


module.exports = router;