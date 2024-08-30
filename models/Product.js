const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
  },
  description: {
    type: String,
    required: [true, 'Please add a product description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: 0,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;