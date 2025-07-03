const mongoose = require('mongoose');

const SellerSchema = new mongoose.Schema({
  name: String,
  rating: Number,
  reviews: Number
}, { _id: false });

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  price: Number,
  originalPrice: Number,
  condition: String,
  location: String,
  distance: String,
  description: String,
  cover: String,
  genre: String,
  format: String,
  language: String,
  isbn: String,
  publisher: String,
  year: Number,
  seller: SellerSchema,
  badges: [String],
  exchangeAvailable: Boolean,
  dateAdded: Date
});

module.exports = mongoose.model('Book', BookSchema);