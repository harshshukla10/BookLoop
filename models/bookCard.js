const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  // Section A: Book Details
  title: { type: String, required: true },
  authors: { type: String, required: true },
  genre: { type: String, enum: ['Academic', 'Fiction', 'Non-Fiction', 'Mystery'], default: 'Academic' },
  isbn: { type: String },
  publisher: { type: String },
  yearOfPublication: { type: Number },
  edition: { type: String },
  language: { type: String, enum: ['English', 'Hindi', 'Other'], default: 'English' },
  format: { type: String, enum: ['Paperback', 'Hardcover', 'eBook', 'Audiobook'], default: 'Paperback' },
  description: { type: String, required: true },

  // Section B: Book Condition & Pricing
  condition: { type: String, enum: ['New', 'Like New', 'Good', 'Acceptable'], default: 'Good' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  exchangeAvailable: { type: Boolean, default: false },
  negotiablePrice: { type: Boolean, default: false },

  // Section C: Photos
  bookCoverPhoto: { type: String, required: true }, // store image URL or file path
  additionalPhotos: [{ type: String }],

  // Section D: Location & Contact
  location: { type: String },
  deliveryDistanceKm: { type: Number },
  contactPreference: { type: String, enum: ['Email', 'Phone', 'In-app Chat'], default: 'Email' },
  contactDetails: { type: String, required: true },

  // Section E: Seller Info
  seller: {
    name: { type: String, required: true },
    userRating: { type: String, default: '5.0 ★' } // or Number if you prefer
  },

  // Meta
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', BookSchema);