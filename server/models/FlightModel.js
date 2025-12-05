const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  flightName: String,
  from: String,
  to: String,
  pilotName: String,
  price: Number,
  totalSeats: Number,
  availableSeats: Number,
  runDays: [String], // e.g. ['Mon', 'Wed', 'Fri']
  specificDates: [Date],
  bookings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seatsBooked: Number,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
