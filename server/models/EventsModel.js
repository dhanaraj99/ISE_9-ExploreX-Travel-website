const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  eventName: String,
  location: String,
  eventDate: Date,
  eventTime: String,
  totalTickets: Number,
  availableTickets: Number,
  price: Number,
  description: String,
  bookings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketsBooked: Number,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);




