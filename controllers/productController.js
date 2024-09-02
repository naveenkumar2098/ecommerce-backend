const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 
 * @desc    Create Product
 * @route   POST api/products/
 * @access  Admin, Supplier
 */
exports.createProduct = async (req, res) => {
    logger.info(`Create product controller called!`);

    // Validation check
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        logger.warn(`Validations failed during product creation`, { errors: errors.array() });
        return res.send(422).json({ errors: errors.array() });
    }

    try {
        // Create product
        const product = await Product.create({ ...req.body, createdBy: req.user._id });
        logger.info(`New product created: ${product.id}`);
        res.status(201).json(product);
    } catch (error) {
        logger.error(`Error encountered during product creation`, { error });
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Get All Products
 * @route   GET api/products/
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
    logger.info(`Get all products controller called!`);

    try {
        // Get all products from database
        const products = await Product.find();
        logger.info(`Fetched all products: ${products.length}`);
        res.status(200).json(products);
    } catch (error) {
        logger.error(`Error encountered during fetching products list`, { error });
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * 
 * @desc    Get a product
 * @route   POST api/products/:id
 * @access  Public
 */
exports.getProduct = async (req, res) => {
    logger.info(`Get product controller called!`);
    const { id } = req.params;
    try {
        // Find product
        const product = await Product.findById(id);
        if (!product) {
            logger.warn(`Get product failed - Product not found: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        logger.info(`Fetched product with id: ${id}`);
        res.status(200).json(product);
    } catch (error) {
        logger.error(`Error encountered while fetching product details`, { error });
        res.status(500).json({ message: 'Server error', error });
    }
};


/**
 * 
 * @desc    Update product
 * @route   PUT api/products/:id
 * @access  Admin, Supplier
 */
exports.updateProduct = async (req, res) => {
    logger.info(`Update product controller called!`);

    // Validation check
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        logger.warn(`Validations failed during product updation`, { errors: errors.array() });
        return res.send(422).json({ errors: errors.array() });
    }

    const { id } = req.params;
    // Update product details
    try {
        const product = await Product.findOneAndUpdate({ _id: id }, req.body, {new: true, runValidators: true});
        if(!product) {
            logger.warn(`Update product failed - Product not found: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        logger.info(`Updated product successfully: ${id}`);
        res.status(200).json(product);
    } catch (error) {
        logger.error(`Error encountered while updating product`, { error });
        res.status(500).json({ message: 'Server error', error });
    }
};


/**
 * 
 * @desc    Delete product
 * @route   DELETE api/products/:id
 * @access  Admin, Supplier
 */
exports.deleteProduct = async (req, res) => {
    logger.info(`Delete product controller called!`);

    // Delete product
    const { id } = req.params;
    try {
        const product = await Product.findByIdAndDelete(id);
        if(!product) {
            logger.warn(`Delete product failed - Product not found: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        logger.info(`Deleted product successfully: ${id}`);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        logger.error(`Error encountered while deleting product`, { error });
        res.status(500).json({ message: 'Server error', error });
    }
};


/**
 * 
 * @desc    Enable/Disable product
 * @route   Patch api/products/:id/toggle
 * @access  Admin, Supplier
 */
exports.toggleProductStatus = async (req, res) => {
    logger.info(`Toggle product status controller called!`);

    // Toggle status
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            logger.warn(`Toggle product failed - Product not found: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        // Update status
        product.isActive = !product.isActive;
        await product.save();
        res.status(200).json(product);
    } catch (error) {
        logger.error(`Error encountered while toggling product status`, { error });
        res.status(500).json({ message: 'Server error', error });
    }
};