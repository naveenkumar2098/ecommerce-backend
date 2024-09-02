const Issue = require('../models/Issue');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

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
      // Create issue
      const issue = await Issue.create({ ...req.body, userId: req.user._id });
      logger.info(`New Issue created: ${issue.id}`);
      res.status(201).json(issue);
    } catch (error) {
      logger.error(`Error encountered during issue creation`, { error });
      res.status(500).json({ message: 'Server error', error });
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
    try {
      // Find all issues for the user
      const issues = await Issue.find({ userId: id });
      logger.info(`Fetched all issues: ${issues.length}`);
      res.status(200).json(issues);
    } catch (error) {
      logger.error(`Error encountered during fetching issues list`, { error });
      res.status(500).json({ message: 'Server error', error });
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
      logger.info(`Fetched issue with id: ${id}`);
      res.status(200).json(issue);
    } catch (error) {
      logger.error(`Error encountered while fetching issue details`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Update Issue
 * @route   PUT api/issues/:id
 * @access  Admin, Support
 */
exports.updateIssue = async (req, res) => {
    logger.info(`Update order controller called!`);

    // Validation check
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      logger.warn(`Validations failed during issue updation`, { errors: errors.array() });
      return res.send(422).json({ errors: errors.array() });
    }

    const { id } = req.params;
    try {
      // Find issue and update
      const issue = await Issue.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!issue) {
        logger.warn(`Update issue failed - Issue not found: ${id}`);
        return res.status(404).json({ message: 'Issue not found' });
      }
      logger.info(`Updated issue successfully: ${id}`);
      res.status(200).json(issue);
    } catch (error) {
      logger.error(`Error encountered while updating issue`, { error });
      res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Delete Issue
 * @route   DELETE api/issues/:id
 * @access  Admin, Support
 */
exports.deleteIssue = async (req, res) => {
    logger.info(`Delete order controller called!`);

    const { id } = req.params;
    try {
      // Delete issue
      const issue = await Issue.findByIdAndDelete(id);
      if (!issue) {
        logger.warn(`Delete issue failed - Issue not found: ${id}`);
        return res.status(404).json({ message: 'Issue not found' });
      }
      logger.info(`Deleted order successfully: ${id}`);
      res.status(200).json({ message: 'Issue deleted successfully' });
    } catch (error) {
      logger.error(`Error encountered while deleting issue`, { error });
      res.status(500).json({ message: 'Server error', error });
  }
};