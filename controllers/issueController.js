const Issue = require('../models/Issue');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const pick = require('../utils/pick');
const { isOwnerOrRole } = require('../utils/access');

/**
 * 
 * @desc    Create Issue
 * @route   POST api/issues/
 * @access  Customer
 */
exports.createIssue = async (req, res) => {
    logger.info(`Create issue controller called!`);

    // Validations check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validations failed during issue creation`, { errors: errors.array() });
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const data = pick(req.body, ['title', 'description', 'orderId']);

      // The order must belong to the requesting user
      const order = await Order.findById(data.orderId);
      if (!order || String(order.user) !== String(req.user._id)) {
        logger.warn(`Create issue failed - Order not found for user: ${data.orderId}`);
        return res.status(404).json({ message: 'Order not found' });
      }

      // Create issue
      const issue = await Issue.create({ ...data, userId: req.user._id });
      logger.info(`New Issue created: ${issue.id}`);
      res.status(201).json(issue);
    } catch (error) {
      logger.error(`Error encountered during issue creation`, { error });
      res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 
 * @desc    Get all Issues
 * @route   GET api/issues/:id/allIssues
 * @access  Customer, Admin, Support
 */
exports.getAllIssues = async (req, res) => {
    logger.info(`Get all issues controller called!`);

    const { id } = req.params;
    if (!isOwnerOrRole(req, id, 'admin', 'support')) {
      logger.warn(`Get all issues denied - user ${req.user._id} requested issues of ${id}`);
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      // Find all issues for the user
      const issues = await Issue.find({ userId: id });
      logger.info(`Fetched all issues: ${issues.length}`);
      res.status(200).json(issues);
    } catch (error) {
      logger.error(`Error encountered during fetching issues list`, { error });
      res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 
 * @desc    Get Issue
 * @route   GET api/issues/:id
 * @access  Customer, Admin, Support
 */
exports.getIssue = async (req, res) => {
    logger.info(`Get issue controller called!`);

    const { id } = req.params;
    try {
      // Find issue
      const issue = await Issue.findById(id);
      if (!issue) {
        logger.warn(`Get issue failed - Issue not found: ${id}`);
        return res.status(404).json({ message: 'Issue not found' });
      }
      if (!isOwnerOrRole(req, issue.userId, 'admin', 'support')) {
        // Respond as not found so the existence of the issue is not revealed
        logger.warn(`Get issue denied - user ${req.user._id} requested issue ${id}`);
        return res.status(404).json({ message: 'Issue not found' });
      }
      logger.info(`Fetched issue with id: ${id}`);
      res.status(200).json(issue);
    } catch (error) {
      logger.error(`Error encountered while fetching issue details`, { error });
      res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 
 * @desc    Update Issue
 * @route   PUT api/issues/:id
 * @access  Admin, Support
 */
exports.updateIssue = async (req, res) => {
    logger.info(`Update issue controller called!`);

    // Validation check
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      logger.warn(`Validations failed during issue updation`, { errors: errors.array() });
      return res.status(422).json({ errors: errors.array() });
    }

    const { id } = req.params;
    try {
      // Find issue and update
      const issue = await Issue.findByIdAndUpdate(id, pick(req.body, ['status']), { new: true, runValidators: true });
      if (!issue) {
        logger.warn(`Update issue failed - Issue not found: ${id}`);
        return res.status(404).json({ message: 'Issue not found' });
      }
      logger.info(`Updated issue successfully: ${id}`);
      res.status(200).json(issue);
    } catch (error) {
      logger.error(`Error encountered while updating issue`, { error });
      res.status(500).json({ message: 'Server error' });
    }
};

/**
 * 
 * @desc    Delete Issue
 * @route   DELETE api/issues/:id
 * @access  Admin, Support
 */
exports.deleteIssue = async (req, res) => {
    logger.info(`Delete issue controller called!`);

    const { id } = req.params;
    try {
      // Delete issue
      const issue = await Issue.findByIdAndDelete(id);
      if (!issue) {
        logger.warn(`Delete issue failed - Issue not found: ${id}`);
        return res.status(404).json({ message: 'Issue not found' });
      }
      logger.info(`Deleted issue successfully: ${id}`);
      res.status(200).json({ message: 'Issue deleted successfully' });
    } catch (error) {
      logger.error(`Error encountered while deleting issue`, { error });
      res.status(500).json({ message: 'Server error' });
  }
};

/**
 * 
 * @desc    List every issue, newest first, optionally filtered by ?status=
 * @route   GET api/issues
 * @access  Support, Admin
 */
exports.getIssueQueue = async (req, res) => {
    logger.info(`Get issue queue controller called!`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const filter = req.query.status ? { status: req.query.status } : {};
      const issues = await Issue.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
      logger.info(`Fetched issue queue: ${issues.length}`);
      res.status(200).json(issues);
    } catch (error) {
      logger.error(`Error encountered during fetching issue queue`, { error });
      res.status(500).json({ message: 'Server error' });
    }
};
