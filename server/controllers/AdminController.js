const Admin = require('../models/AdminModel');
const Vendor = require('../models/VendorModel');
const bcrypt = require('bcryptjs');
const generateToken = require('../middleware/Token');


//add admin registration
exports.registerAdmin = async (req, res) => {
    try {
    const { name, email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' }); 
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hashed });
    res.status(201).json({ message: 'Admin registered successfully', admin });
  }
    catch (err) {
    res.status(500).json({ message: err.message });
  }
};






// Admin login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
   const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(admin._id , admin.role);
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add vendor (only admin)
exports.addVendor = async (req, res) => {
  try {
    const { name, email, password, phone, orgName, location, type } = req.body;
    const existing = await Vendor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Vendor already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const vendor = await Vendor.create({ name, email, password: hashed, phone, orgName, location, type });

    res.status(201).json({ message: 'Vendor added successfully', vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
