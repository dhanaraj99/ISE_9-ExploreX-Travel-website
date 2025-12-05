const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  shopName: String,
  location: String,
  items: [{
    name: String,
    image: String,
    price: Number,
    status: { type: String, enum: ['available', 'out of stock'], default: 'available' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
