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
    check('products', 'Products are required').isArray(),
    check('totalPrice', 'Total price is required').isNumeric(),
  ],
  createOrder
);
router.get('/:id/allOrders', isAuthenticated, authorizeRoles('customer', 'admin'), getAllOrdersForUser);
router.get('/:id', isAuthenticated, authorizeRoles('customer', 'admin'), getOrder);
router.put('/:id', isAuthenticated, authorizeRoles('admin'), updateOrder);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), deleteOrder);

module.exports = router;