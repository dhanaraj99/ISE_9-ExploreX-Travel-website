const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: String,
  location: String,
  expertiseLocation: String,
  hoursAvailable: String,
  pricePerHour: Number,
  status: { type: String, enum: ['free', 'occupied'], default: 'free' },
  bookings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: Date,
    hours: Number,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Guide', guideSchema);
