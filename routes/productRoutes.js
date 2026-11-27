const express = require('express');
const { check } = require("express-validator");
const { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct, toggleProductStatus, getManagedProducts } = require('../controllers/productController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');

const validateObjectId = require('../utils/validateObjectId');
const router = express.Router();

// Routes list with methods
router.post(
    '/',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    [
        check('name', 'Name is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('price', 'Price must be a number >= 0').isFloat({ min: 0 }),
        check('stock', 'Stock must be an integer >= 0').isInt({ min: 0 }),
        check('category', 'Category is required').not().isEmpty(),
    ],
    createProduct
);
router.get('/', getAllProducts);
router.get('/manage', isAuthenticated, authorizeRoles('admin', 'supplier'), getManagedProducts);
router.get('/:id', validateObjectId(), getProduct);
router.put(
    '/:id',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    validateObjectId(),
    [
        check('name', 'Name is required').optional().not().isEmpty(),
        check('description', 'Description is required').optional().not().isEmpty(),
        check('price', 'Price must be a number >= 0').optional().isFloat({ min: 0 }),
        check('stock', 'Stock must be an integer >= 0').optional().isInt({ min: 0 }),
        check('category', 'Category is required').optional().not().isEmpty(),
    ],
    updateProduct
);
router.delete(
    '/:id',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    validateObjectId(),
    deleteProduct
);
router.patch(
    '/:id/toggle',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    validateObjectId(),
    toggleProductStatus
);

module.exports = router;