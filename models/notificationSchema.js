const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ["admin_message", "offer", "exchange_request", "listing_update"],
    default: "admin_message"
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);