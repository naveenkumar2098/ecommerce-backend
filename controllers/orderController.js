const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 
 * @desc    Create Order
 * @route   POST api/orders/
 * @access  Private
 */
exports.createOrder = async (req, res) => {
    logger.info(`Create order controller called!`);

    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validations failed during order creation`, { errors: errors.array() });
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      // Create order
      const order = await Order.create({ ...req.body, user: req.user._id });
      logger.info(`New order created: ${order.id}`);
      res.status(201).json(order);
    } catch (error) {
      logger.error(`Error encountered during order creation`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Get all Orders
 * @route   GET api/orders/:id/allOrders
 * @access  Customer, Admin
 */
exports.getAllOrdersForUser = async (req, res) => {
    logger.info(`Get all orders controller called!`);

    const { id } = req.params;
    try {
      // Find all orders
      const orders = await Order.find({ user: id });
      logger.info(`Fetched all orders: ${orders.length}`);
      res.status(200).json(orders);
    } catch (error) {
      logger.error(`Error encountered during fetching orders list`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Get Order
 * @route   GET api/orders/:id
 * @access  Customer, Admin
 */
exports.getOrder = async (req, res) => {
    logger.info(`Get order controller called!`);

    const { id } = req.params;
    try {
      // Find order
      const order = await Order.findById(id).populate('products.product');
      if (!order) {
        logger.warn(`Get order failed - Order not found: ${id}`);
        return res.status(404).json({ message: 'Order not found' });
      }
      logger.info(`Fetched order with id: ${id}`);
      res.status(200).json(order);
    } catch (error) {
      logger.error(`Error encountered while fetching order details`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Update Order
 * @route   PUT api/orders/:id
 * @access  Admin
 */
exports.updateOrder = async (req, res) => {
    logger.info(`Update order controller called!`);

    // Validation check
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      logger.warn(`Validations failed during order updation`, { errors: errors.array() });
      return res.send(422).json({ errors: errors.array() });
    }

    const { id } = req.params;
    try {
      // Find order and update
      const order = await Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!order) {
        logger.warn(`Update order failed - Order not found: ${id}`);
        return res.status(404).json({ message: 'Order not found' });
      }
      logger.info(`Updated order successfully: ${id}`);
      res.status(200).json(order);
    } catch (error) {
      logger.error(`Error encountered while updating order`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Delete Order
 * @route   DELETE api/orders/:id
 * @access  Admin
 */
exports.deleteOrder = async (req, res) => {
    logger.info(`Delete order controller called!`);

    const { id } = req.params;
    try {
      // Delete order
      const order = await Order.findByIdAndDelete(id);
      if (!order) {
        logger.warn(`Delete order failed - Order not found: ${id}`);
        return res.status(404).json({ message: 'Order not found' });
      }
      logger.info(`Deleted order successfully: ${id}`);
      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
      logger.error(`Error encountered while deleting order`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};