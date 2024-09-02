const express = require('express');
const { check } = require('express-validator');
const { createIssue, getAllIssues, getIssue, updateIssue, deleteIssue } = require('../controllers/issueController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');

const router = express.Router();

// Routes list with http methods
router.post(
  '/',
  isAuthenticated,
  authorizeRoles('customer'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('orderId', 'Order ID is required').not().isEmpty(),
  ],
  createIssue
);
router.get('/:id/allIssues', isAuthenticated, authorizeRoles('support', 'admin', 'customer'), getAllIssues);
router.get('/:id', isAuthenticated, authorizeRoles('support', 'admin', 'customer'), getIssue);
router.put('/:id', isAuthenticated, authorizeRoles('support', 'admin'), updateIssue);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), deleteIssue);

module.exports = router;