const VendorRoute = require('express').Router();
const {protect} = require('../middleware/authMiddleware');
const { 
  addFlights, getFlights, 
  addHotels, getHotels,
  addHolidays, getHolidays,
  addShops, getShops,
  addGuides, getGuides,
  addCurrency, getCurrency,
  addEvents, getEvents,
  updateVendor, loginVendor, getVendorProfile 
} = require('../controllers/VendorController');

// Vendor registration
VendorRoute.post('/login', loginVendor);

// Get vendor profile
VendorRoute.get('/profile', protect, getVendorProfile);
// Update vendor info
VendorRoute.put('/update', protect, updateVendor);

// Flights
VendorRoute.post('/flights', protect, addFlights);
VendorRoute.get('/flights', protect, getFlights);

// Hotels
VendorRoute.post('/hotels', protect, addHotels);
VendorRoute.get('/hotels', protect, getHotels);

// Holidays
VendorRoute.post('/holidays', protect, addHolidays);
VendorRoute.get('/holidays', protect, getHolidays);

// Shops
VendorRoute.post('/shops', protect, addShops);
VendorRoute.get('/shops', protect, getShops);

// Guides
VendorRoute.post('/guides', protect, addGuides);
VendorRoute.get('/guides', protect, getGuides);

// Currency
VendorRoute.post('/currency', protect, addCurrency);
VendorRoute.get('/currency', protect, getCurrency);

// Events
VendorRoute.post('/events', protect, addEvents);
VendorRoute.get('/events', protect, getEvents);

module.exports = VendorRoute;
