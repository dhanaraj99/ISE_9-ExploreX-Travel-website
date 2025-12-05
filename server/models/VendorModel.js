const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  orgName: String,
  location: String,
  type: { 
    type: String, 
    required: true,
    enum: ['flight', 'hotel', 'holiday', 'shop', 'guide', 'currency', 'event']
  },
  role: { type: String, enum: ['vendor', 'premium_vendor'], default: 'vendor' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
