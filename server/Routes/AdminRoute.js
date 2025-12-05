const adminRoutes = require('express').Router();
const {protect} = require('../middleware/authMiddleware');
const { registerAdmin, loginAdmin, getAllVendors , addVendor} = require('../controllers/AdminController');
// Admin registration
adminRoutes.post('/register', registerAdmin);
// Admin login
adminRoutes.post('/login', loginAdmin);
// Get all vendors
adminRoutes.get('/vendors',protect, getAllVendors);
module.exports = adminRoutes;
// Add vendor
adminRoutes.post('/vendor',protect, addVendor);