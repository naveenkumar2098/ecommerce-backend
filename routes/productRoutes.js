const express = require('express');
const { check } = require("express-validator");
const { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct, toggleProductStatus } = require('../controllers/productController');
const { isAuthenticated } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/role');

const router = express.Router();

// Routes list with methods
router.post(
    '/',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    [
        check('name', 'Name is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('price', 'Price is required').isNumeric(),
        check('stock', 'Stock is required').isNumeric(),
        check('category', 'Category is required').not().isEmpty(),
    ],
    createProduct
);
router.get('/', getAllProducts);
router.post('/:id', getProduct);
router.put(
    '/:id',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    [
        check('name', 'Name is required').optional().not().isEmpty(),
        check('description', 'Description is required').optional().not().isEmpty(),
        check('price', 'Price is required').optional().isNumeric(),
        check('stock', 'Stock is required').optional().isNumeric(),
        check('category', 'Category is required').optional().not().isEmpty(),
    ],
    updateProduct
);
router.delete(
    '/:id',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    deleteProduct
);
router.patch(
    '/:id/toggle',
    isAuthenticated,
    authorizeRoles('admin', 'supplier'),
    toggleProductStatus
);

module.exports = router;