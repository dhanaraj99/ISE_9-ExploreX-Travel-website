const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  packageName: String,
  location: String,
  totalDays: Number,
  cost: Number,
  status: { type: String, enum: ['available', 'expired'], default: 'available' },
  bookings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    travelers: Number,
    date: Date,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('HolidayPackage', packageSchema);
