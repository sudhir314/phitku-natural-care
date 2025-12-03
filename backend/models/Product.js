const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  category: { type: String, required: true },
  tag: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  description: { type: String },
  isAvailable: { type: Boolean, default: true } // NEW: For stock management
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);