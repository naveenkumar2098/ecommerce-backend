const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const pick = require('../utils/pick');
const { isOwnerOrRole } = require('../utils/access');

// Return reserved stock to the products ([{ product, quantity }])
const restockItems = async (items) => {
    for (const item of items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
};

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

    // Merge duplicate product lines by summing their quantities
    const merged = new Map();
    for (const line of req.body.products) {
      const productId = String(line.product);
      merged.set(productId, (merged.get(productId) || 0) + Number(line.quantity));
    }
    const ids = [...merged.keys()];

    // Stock decrements applied so far, kept so they can be rolled back
    const reserved = [];

    try {
      // Load the products; every one must exist and be active
      const products = await Product.find({ _id: { $in: ids }, isActive: true });
      const byId = new Map(products.map((p) => [String(p._id), p]));
      for (const id of ids) {
        if (!byId.has(id)) {
          logger.warn(`Create order failed - Product unavailable: ${id}`);
          return res.status(400).json({ message: `Product unavailable: ${id}` });
        }
      }

      // Reserve stock atomically per item (no transactions on a standalone mongod)
      for (const id of ids) {
        const quantity = merged.get(id);
        const result = await Product.updateOne(
          { _id: id, isActive: true, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } }
        );
        if (result.modifiedCount === 0) {
          await restockItems(reserved);
          const name = byId.get(id).name;
          logger.warn(`Create order failed - Insufficient stock for ${name} (${id})`);
          return res.status(409).json({ message: `Insufficient stock for ${name}` });
        }
        reserved.push({ product: id, quantity });
      }

      // Compute the total on the server
      const totalPrice = Math.round(
        ids.reduce((sum, id) => sum + byId.get(id).price * merged.get(id), 0) * 100
      ) / 100;

      // Create order
      const lines = ids.map((id) => ({ product: id, quantity: merged.get(id) }));
      const order = await Order.create({ user: req.user._id, products: lines, totalPrice });
      logger.info(`New order created: ${order.id}`);
      res.status(201).json(order);
    } catch (error) {
      try {
        await restockItems(reserved);
      } catch (rollbackError) {
        logger.error(`Failed to roll back stock reservation`, { error: rollbackError });
      }
      logger.error(`Error encountered during order creation`, { error });
      res.status(500).json({ message: 'Server error' });
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
    if (!isOwnerOrRole(req, id, 'admin')) {
      logger.warn(`Get all orders denied - user ${req.user._id} requested orders of ${id}`);
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      // Find all orders
      const orders = await Order.find({ user: id });
      logger.info(`Fetched all orders: ${orders.length}`);
      res.status(200).json(orders);
    } catch (error) {
      logger.error(`Error encountered during fetching orders list`, { error });
      res.status(500).json({ message: 'Server error' });
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
      if (!isOwnerOrRole(req, order.user, 'admin')) {
        // Respond as not found so the existence of the order is not revealed
        logger.warn(`Get order denied - user ${req.user._id} requested order ${id}`);
        return res.status(404).json({ message: 'Order not found' });
      }
      logger.info(`Fetched order with id: ${id}`);
      res.status(200).json(order);
    } catch (error) {
      logger.error(`Error encountered while fetching order details`, { error });
      res.status(500).json({ message: 'Server error' });
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
      return res.status(422).json({ errors: errors.array() });
    }

    const { id } = req.params;
    try {
      const { status } = pick(req.body, ['status']);
      const existing = await Order.findById(id);
      if (!existing) {
        logger.warn(`Update order failed - Order not found: ${id}`);
        return res.status(404).json({ message: 'Order not found' });
      }
      if (existing.status === 'cancelled' && status !== 'cancelled') {
        logger.warn(`Update order failed - Order already cancelled: ${id}`);
        return res.status(400).json({ message: 'Cancelled orders cannot be reopened' });
      }

      let order;
      if (status === 'cancelled') {
        // Atomically claim the transition so stock is restocked exactly once
        order = await Order.findOneAndUpdate(
          { _id: id, status: { $ne: 'cancelled' } },
          { status: 'cancelled' },
          { new: true, runValidators: true }
        );
        if (order) {
          await restockItems(order.products);
        } else {
          order = await Order.findById(id);
        }
      } else {
        order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
      }
      if (!order) {
        logger.warn(`Update order failed - Order not found: ${id}`);
        return res.status(404).json({ message: 'Order not found' });
      }
      logger.info(`Updated order successfully: ${id}`);
      res.status(200).json(order);
    } catch (error) {
      logger.error(`Error encountered while updating order`, { error });
      res.status(500).json({ message: 'Server error' });
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
      res.status(500).json({ message: 'Server error' });
    }
};