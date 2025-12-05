const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  hotelName: String,
  totalRooms: Number,
  availableRooms: Number,
  costPerNight: Number,
  location: String,
  bookings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roomsBooked: Number,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
