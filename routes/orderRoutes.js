const express = require('express');
const { check } = require('express-validator');
const { createOrder, getAllOrdersForUser, getOrder, updateOrder, deleteOrder } = require('../controllers/orderController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');

const router = express.Router();

// Routes list with http methods
router.post(
  '/',
  isAuthenticated,
  [
    check('products', 'Products are required').isArray({ min: 1 }),
    check('products.*.product', 'A valid product ID is required').isMongoId(),
    check('products.*.quantity', 'Quantity must be an integer >= 1').isInt({ min: 1 }),
  ],
  createOrder
);
router.get('/:id/allOrders', isAuthenticated, authorizeRoles('customer', 'admin'), getAllOrdersForUser);
router.get('/:id', isAuthenticated, authorizeRoles('customer', 'admin'), getOrder);
router.put(
  '/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  [check('status', 'Invalid status').isIn(['processing', 'shipped', 'delivered', 'cancelled'])],
  updateOrder
);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), deleteOrder);

module.exports = router;