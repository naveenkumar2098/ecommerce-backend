const express = require('express');
const { check } = require('express-validator');
const { createIssue, getAllIssues, getIssue, updateIssue, deleteIssue } = require('../controllers/issueController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');

const validateObjectId = require('../utils/validateObjectId');
const router = express.Router();

// Routes list with http methods
router.post(
  '/',
  isAuthenticated,
  authorizeRoles('customer'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('orderId', 'A valid order ID is required').isMongoId(),
  ],
  createIssue
);
router.get('/:id/allIssues', isAuthenticated, authorizeRoles('support', 'admin', 'customer'), validateObjectId(), getAllIssues);
router.get('/:id', isAuthenticated, authorizeRoles('support', 'admin', 'customer'), validateObjectId(), getIssue);
router.put(
  '/:id',
  isAuthenticated,
  authorizeRoles('support', 'admin'),
  validateObjectId(),
  [check('status', 'Invalid status').isIn(['open', 'in-progress', 'resolved', 'closed'])],
  updateIssue
);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), validateObjectId(), deleteIssue);

module.exports = router;