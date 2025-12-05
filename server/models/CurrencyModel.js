const mongoose = require('mongoose');

const currencyExchangeSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  location: String,
  currencyType: String,
  rate: Number,
  status: { type: String, enum: ['in stock', 'out of stock'], default: 'in stock' },
  bookings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('CurrencyExchange', currencyExchangeSchema);
