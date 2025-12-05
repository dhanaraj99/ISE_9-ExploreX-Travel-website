const userRoutes = require('express').Router();
const {protect} = require('../middleware/authMiddleware');    
const {
  registerUser, loginUser, getUserProfile, getUserBookings,
  getAllFlights, bookFlight,
  getAllHotels, bookHotel,
  getAllHolidays, bookHoliday,
  getAllShops,
  getAllGuides, bookGuide,
  getAllCurrency, bookCurrency,
  getAllEvents, bookEvent,
  chatbotResponse
} = require('../controllers/UserController');

// User registration
userRoutes.post('/register', registerUser); 
// User login
userRoutes.post('/login', loginUser);
// Get user profile
userRoutes.get('/profile', protect, getUserProfile);
// Get user bookings
userRoutes.get('/bookings', protect, getUserBookings);

// Flights (public routes)
userRoutes.get('/flights', getAllFlights);
userRoutes.post('/flights/book', protect, bookFlight);

// Hotels (public route)
userRoutes.get('/hotels', getAllHotels);
userRoutes.post('/hotels/book', protect, bookHotel);

// Holidays (public route)
userRoutes.get('/holidays', getAllHolidays);
userRoutes.post('/holidays/book', protect, bookHoliday);

// Shops (public route)
userRoutes.get('/shops', getAllShops);

// Guides (public route)
userRoutes.get('/guides', getAllGuides);
userRoutes.post('/guides/book', protect, bookGuide);

// Currency (public route)
userRoutes.get('/currency', getAllCurrency);
userRoutes.post('/currency/book', protect, bookCurrency);

// Events (public route)
userRoutes.get('/events', getAllEvents);
userRoutes.post('/events/book', protect, bookEvent);

// Chatbot (public route)
userRoutes.post('/chatbot', chatbotResponse);

module.exports = userRoutes;