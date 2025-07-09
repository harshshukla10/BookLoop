// middlewares/validateBook.js
const Joi = require('joi');

module.exports.bookSchema = Joi.object({
  title: Joi.string().required(),
  authors: Joi.string().required(),
  genre: Joi.string().valid('Academic', 'Fiction', 'Non-Fiction', 'Mystery').default('Academic'),
  isbn: Joi.number().optional(),
  publisher: Joi.string().optional(),
  yearOfPublication: Joi.number().optional(),
  edition: Joi.string().optional(),
  language: Joi.string().valid('English', 'Hindi', 'Other').default('English'),
  format: Joi.string().valid('Paperback', 'Hardcover', 'eBook', 'Audiobook').default('Paperback'),
  description: Joi.string().required(),

  condition: Joi.string().valid('New', 'Like New', 'Good', 'Acceptable').default('Good'),
  price: Joi.number().required(),
  originalPrice: Joi.number().optional(),
  exchangeAvailable: Joi.boolean().default(false),
  negotiablePrice: Joi.boolean().default(false),

  location: Joi.string().optional(),
  deliveryDistanceKm: Joi.number().optional(),
  contactPreference: Joi.string().valid('Email', 'Phone', 'In-app Chat').default('Email'),
  contactDetails: Joi.string().required(),

  seller: Joi.object({
    name: Joi.string().required(),
    userRating: Joi.string().optional()
  }).required(),
});