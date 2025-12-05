const User = require('../models/UserModel');
const FlightModel = require('../models/FlightModel');
const HotelModel = require('../models/HotelModel');
const HolidayModel = require('../models/HolidayModel');
const ShopModel = require('../models/ShopsModel');
const GuideModel = require('../models/GuideModel');
const CurrencyModel = require('../models/CurrencyModel');
const EventModel = require('../models/EventsModel');
const bcrypt = require('bcryptjs');
const generateToken = require('../middleware/Token');

// User registration
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// User login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id , user.role);
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all flights with search and sort
exports.getAllFlights = async (req, res) => {
  try {
    const { from, to, date, sortBy = 'price', sortOrder = 'asc' } = req.query;
    
    // Build query
    let query = {};
    
    // Search by origin
    if (from) {
      query.from = { $regex: from, $options: 'i' };
    }
    
    // Search by destination
    if (to) {
      query.to = { $regex: to, $options: 'i' };
    }
    
    // Search by date (check if date matches runDays or specificDates)
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const dayName = searchDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Check if date matches runDays or specificDates
      query.$or = [
        { runDays: dayName },
        { 
          specificDates: { 
            $elemMatch: { 
              $gte: new Date(searchDate),
              $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
            } 
          } 
        }
      ];
    }
    
    // Only show flights with available seats
    query.availableSeats = { $gt: 0 };
    
    // Build sort object
    const sortObj = {};
    if (sortBy === 'price') {
      sortObj.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'date') {
      sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'seats') {
      sortObj.availableSeats = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1; // Default: newest first
    }
    
    const flights = await FlightModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(flights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book a flight
exports.bookFlight = async (req, res) => {
  try {
    const { flightId, seatsBooked } = req.body;
    const userId = req.user._id;
    
    if (!flightId || !seatsBooked || seatsBooked <= 0) {
      return res.status(400).json({ message: 'Flight ID and number of seats are required' });
    }
    
    // Find the flight
    const flight = await FlightModel.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    
    // Check if enough seats are available
    if (flight.availableSeats < seatsBooked) {
      return res.status(400).json({ 
        message: `Only ${flight.availableSeats} seats available` 
      });
    }
    
    // Update flight: reduce available seats and add booking
    flight.availableSeats -= seatsBooked;
    flight.bookings.push({
      userId: userId,
      seatsBooked: seatsBooked
    });
    
    await flight.save();
    
    // Update user bookings (optional - if you want to track user bookings)
    const user = await User.findById(userId);
    if (user) {
      // You can add booking reference here if you have a Booking model
    }
    
    res.status(200).json({ 
      message: 'Flight booked successfully',
      booking: {
        flightId: flight._id,
        flightName: flight.flightName,
        from: flight.from,
        to: flight.to,
        seatsBooked: seatsBooked,
        totalPrice: flight.price * seatsBooked,
        availableSeats: flight.availableSeats
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user bookings
// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const userBookings = [];
    
    // 1. Get Flight Bookings
    const flights = await FlightModel.find({
      'bookings.userId': userId
    }).populate('vendorId', 'name orgName');
    
    for (const flight of flights) {
      if (flight.bookings && flight.bookings.length > 0) {
        const userFlightBookings = flight.bookings.filter(
          booking => booking.userId && booking.userId.toString() === userId.toString()
        );
        
        userFlightBookings.forEach(booking => {
          userBookings.push({
            type: 'flight',
            bookingId: booking._id,
            flightId: flight._id,
            flightName: flight.flightName,
            from: flight.from,
            to: flight.to,
            pilotName: flight.pilotName,
            price: flight.price,
            vendorName: flight.vendorId?.orgName || flight.vendorId?.name || 'N/A',
            seatsBooked: booking.seatsBooked,
            totalPrice: flight.price * booking.seatsBooked,
            bookedAt: booking.createdAt || flight.createdAt
          });
        });
      }
    }

    // 2. Get Hotel Bookings
    const hotels = await HotelModel.find({
      'bookings.userId': userId
    }).populate('vendorId', 'name orgName');

    for (const hotel of hotels) {
      if (hotel.bookings && hotel.bookings.length > 0) {
        const userHotelBookings = hotel.bookings.filter(
          booking => booking.userId && booking.userId.toString() === userId.toString()
        );

        userHotelBookings.forEach(booking => {
          userBookings.push({
            type: 'hotel',
            bookingId: booking._id,
            hotelId: hotel._id,
            hotelName: hotel.hotelName,
            location: hotel.location,
            costPerNight: hotel.costPerNight,
            vendorName: hotel.vendorId?.orgName || hotel.vendorId?.name || 'N/A',
            roomsBooked: booking.roomsBooked,
            totalPrice: hotel.costPerNight * booking.roomsBooked,
            bookedAt: booking.createdAt || hotel.createdAt
          });
        });
      }
    }
    // 3. Get Holiday Bookings
    const holidays = await HolidayModel.find({
      'bookings.userId': userId
    }).populate('vendorId', 'name orgName');

    for (const holiday of holidays) {
      if (holiday.bookings && holiday.bookings.length > 0) {
        const userHolidayBookings = holiday.bookings.filter(
          booking => booking.userId && booking.userId.toString() === userId.toString()
        );

        userHolidayBookings.forEach(booking => {
          userBookings.push({
            type: 'holiday',
            bookingId: booking._id,
            holidayId: holiday._id,
            packageName: holiday.packageName,
            location: holiday.location,
            travelers: booking.travelers,
            date: booking.date,
            totalPrice: holiday.cost * booking.travelers,
            vendorName: holiday.vendorId?.orgName || holiday.vendorId?.name || 'N/A',
            bookedAt: booking.createdAt || holiday.createdAt
          });
        });
      }
    }

    // 4. Get Guide Bookings
    const guides = await GuideModel.find({
      'bookings.userId': userId
    }).populate('vendorId', 'name orgName');

    for (const guide of guides) {
      if (guide.bookings && guide.bookings.length > 0) {
        const userGuideBookings = guide.bookings.filter(
          booking => booking.userId && booking.userId.toString() === userId.toString()
        );

        userGuideBookings.forEach(booking => {
          userBookings.push({
            type: 'guide',
            bookingId: booking._id,
            guideId: guide._id,
            guideName: guide.name,
            location: guide.location,
            date: booking.date,
            hours: booking.hours,
            totalPrice: guide.pricePerHour * booking.hours,
            vendorName: guide.vendorId?.orgName || guide.vendorId?.name || 'N/A',
            bookedAt: booking.createdAt || guide.createdAt
          });
        });
      }
    }

    // 5. Get Currency Bookings
    const currencies = await CurrencyModel.find({
      'bookings.userId': userId
    }).populate('vendorId', 'name orgName');

    for (const currency of currencies) {
      if (currency.bookings && currency.bookings.length > 0) {
        const userCurrencyBookings = currency.bookings.filter(
          booking => booking.userId && booking.userId.toString() === userId.toString()
        );

        userCurrencyBookings.forEach(booking => {
          userBookings.push({
            type: 'currency',
            bookingId: booking._id,
            currencyId: currency._id,
            currencyType: currency.currencyType,
            location: currency.location,
            amount: booking.amount,
            rate: currency.rate,
            totalCost: booking.amount * currency.rate,
            vendorName: currency.vendorId?.orgName || currency.vendorId?.name || 'N/A',
            bookedAt: booking.createdAt || currency.createdAt
          });
        });
      }
    }

    // 6. Get Event Bookings
    const events = await EventModel.find({
      'bookings.userId': userId
    }).populate('vendorId', 'name orgName');

    for (const event of events) {
      if (event.bookings && event.bookings.length > 0) {
        const userEventBookings = event.bookings.filter(
          booking => booking.userId && booking.userId.toString() === userId.toString()
        );

        userEventBookings.forEach(booking => {
          userBookings.push({
            type: 'event',
            bookingId: booking._id,
            eventId: event._id,
            eventName: event.eventName,
            location: event.location,
            eventDate: event.eventDate,
            ticketsBooked: booking.ticketsBooked,
            totalPrice: event.price * booking.ticketsBooked,
            vendorName: event.vendorId?.orgName || event.vendorId?.name || 'N/A',
            bookedAt: booking.createdAt || event.createdAt
          });
        });
      }
    }
    
    // Sort by booking date (newest first)
    userBookings.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
    
    res.status(200).json(userBookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book a hotel
exports.bookHotel = async (req, res) => {
  try {
    const { hotelId, roomsBooked } = req.body;
    const userId = req.user._id;
    
    if (!hotelId || !roomsBooked || roomsBooked <= 0) {
      return res.status(400).json({ message: 'Hotel ID and number of rooms are required' });
    }
    
    const hotel = await HotelModel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    if (hotel.availableRooms < roomsBooked) {
      return res.status(400).json({ 
        message: `Only ${hotel.availableRooms} rooms available` 
      });
    }
    
    hotel.availableRooms -= roomsBooked;
    hotel.bookings.push({
      userId: userId,
      roomsBooked: roomsBooked
    });
    
    await hotel.save();
    
    res.status(200).json({ 
      message: 'Hotel booked successfully',
      booking: {
        hotelId: hotel._id,
        hotelName: hotel.hotelName,
        location: hotel.location,
        roomsBooked: roomsBooked,
        totalPrice: hotel.costPerNight * roomsBooked,
        availableRooms: hotel.availableRooms
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all hotels
exports.getAllHotels = async (req, res) => {
  try {
    const { location, sortBy = 'costPerNight', sortOrder = 'asc' } = req.query;
    
    let query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    query.availableRooms = { $gt: 0 };
    
    const sortObj = {};
    if (sortBy === 'costPerNight') {
      sortObj.costPerNight = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }
    
    const hotels = await HotelModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book a holiday package
exports.bookHoliday = async (req, res) => {
  try {
    const { holidayId, travelers, date } = req.body;
    const userId = req.user._id;
    
    if (!holidayId || !travelers || !date) {
      return res.status(400).json({ message: 'Holiday ID, travelers, and date are required' });
    }
    
    const holiday = await HolidayModel.findById(holidayId);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday package not found' });
    }
    
    if (holiday.status !== 'available') {
      return res.status(400).json({ message: 'This package is not available' });
    }
    
    holiday.bookings.push({
      userId: userId,
      travelers: travelers,
      date: new Date(date)
    });
    
    await holiday.save();
    
    res.status(200).json({ 
      message: 'Holiday package booked successfully',
      booking: {
        holidayId: holiday._id,
        packageName: holiday.packageName,
        location: holiday.location,
        travelers: travelers,
        date: date,
        totalPrice: holiday.cost * travelers
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all holidays
exports.getAllHolidays = async (req, res) => {
  try {
    const { location, sortBy = 'cost', sortOrder = 'asc' } = req.query;
    
    let query = { status: 'available' };
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    const sortObj = {};
    if (sortBy === 'cost') {
      sortObj.cost = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }
    
    const holidays = await HolidayModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(holidays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const { location, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const shops = await ShopModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book a guide
exports.bookGuide = async (req, res) => {
  try {
    const { guideId, date, hours } = req.body;
    const userId = req.user._id;
    
    if (!guideId || !date || !hours) {
      return res.status(400).json({ message: 'Guide ID, date, and hours are required' });
    }
    
    const guide = await GuideModel.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    
    if (guide.status !== 'free') {
      return res.status(400).json({ message: 'Guide is currently occupied' });
    }
    
    guide.bookings.push({
      userId: userId,
      date: new Date(date),
      hours: hours
    });
    
    // Optional: Update status if needed, but for now we allow multiple bookings on different dates
    // guide.status = 'occupied'; 
    
    await guide.save();
    
    res.status(200).json({ 
      message: 'Guide booked successfully',
      booking: {
        guideId: guide._id,
        guideName: guide.name,
        location: guide.location,
        date: date,
        hours: hours,
        totalPrice: guide.pricePerHour * hours
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all guides
exports.getAllGuides = async (req, res) => {
  try {
    const { location, expertiseLocation, status = 'free', sortBy = 'pricePerHour', sortOrder = 'asc' } = req.query;
    
    let query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (expertiseLocation) {
      query.expertiseLocation = { $regex: expertiseLocation, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    
    const sortObj = {};
    if (sortBy === 'pricePerHour') {
      sortObj.pricePerHour = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }
    
    const guides = await GuideModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(guides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book currency
exports.bookCurrency = async (req, res) => {
  try {
    const { currencyId, amount } = req.body;
    const userId = req.user._id;
    
    if (!currencyId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Currency ID and amount are required' });
    }
    
    const currency = await CurrencyModel.findById(currencyId);
    if (!currency) {
      return res.status(404).json({ message: 'Currency exchange not found' });
    }
    
    if (currency.status !== 'in stock') {
      return res.status(400).json({ message: 'Currency is currently out of stock' });
    }
    
    currency.bookings.push({
      userId: userId,
      amount: amount
    });
    
    await currency.save();
    
    res.status(200).json({ 
      message: 'Currency reserved successfully',
      booking: {
        currencyId: currency._id,
        currencyType: currency.currencyType,
        location: currency.location,
        amount: amount,
        rate: currency.rate,
        totalCost: amount * currency.rate
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all currency exchanges
exports.getAllCurrency = async (req, res) => {
  try {
    const { location, currencyType, status = 'in stock', sortBy = 'rate', sortOrder = 'asc' } = req.query;
    
    let query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (currencyType) {
      query.currencyType = { $regex: currencyType, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    
    const sortObj = {};
    if (sortBy === 'rate') {
      sortObj.rate = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }
    
    const currencies = await CurrencyModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(currencies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book an event
exports.bookEvent = async (req, res) => {
  try {
    const { eventId, ticketsBooked } = req.body;
    const userId = req.user._id;
    
    if (!eventId || !ticketsBooked || ticketsBooked <= 0) {
      return res.status(400).json({ message: 'Event ID and number of tickets are required' });
    }
    
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.availableTickets < ticketsBooked) {
      return res.status(400).json({ 
        message: `Only ${event.availableTickets} tickets available` 
      });
    }
    
    event.availableTickets -= ticketsBooked;
    event.bookings.push({
      userId: userId,
      ticketsBooked: ticketsBooked
    });
    
    await event.save();
    
    res.status(200).json({ 
      message: 'Event booked successfully',
      booking: {
        eventId: event._id,
        eventName: event.eventName,
        location: event.location,
        eventDate: event.eventDate,
        ticketsBooked: ticketsBooked,
        totalPrice: event.price * ticketsBooked
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const { location, eventDate, sortBy = 'eventDate', sortOrder = 'asc' } = req.query;
    
    let query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (eventDate) {
      const searchDate = new Date(eventDate);
      searchDate.setHours(0, 0, 0, 0);
      query.eventDate = {
        $gte: searchDate,
        $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }
    query.availableTickets = { $gt: 0 };
    
    const sortObj = {};
    if (sortBy === 'eventDate') {
      sortObj.eventDate = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sortObj.price = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }
    
    const events = await EventModel.find(query)
      .populate('vendorId', 'name orgName')
      .sort(sortObj);
    
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Chatbot response handler
exports.chatbotResponse = async (req, res) => {
  try {
    const { question, location, destination, city, hotelName, from, to } = req.body;
    
    const questionLower = question.toLowerCase();
    let response = { message: '', data: [], type: 'info', route: null };
    
    // Hotels related queries
    if (questionLower.includes('hotel') || questionLower.includes('resort') || questionLower.includes('accommodation')) {
      let query = { availableRooms: { $gt: 0 } };
      
      if (location || city || destination) {
        const searchLocation = location || city || destination;
        query.location = { $regex: searchLocation, $options: 'i' };
      }
      
      if (questionLower.includes('pool') || questionLower.includes('swimming')) {
        // Note: You might want to add amenities field to hotel model later
        // For now, we'll just search by location
      }
      
      if (hotelName) {
        query.hotelName = { $regex: hotelName, $options: 'i' };
      }
      
      const hotels = await HotelModel.find(query)
        .populate('vendorId', 'name orgName')
        .sort({ costPerNight: 1 })
        .limit(10);
      
      if (hotels.length > 0) {
        response = {
          message: hotelName 
            ? `Here are hotels matching "${hotelName}":`
            : location || city || destination
            ? `Here are available hotels in ${location || city || destination}:`
            : 'Here are some available hotels:',
          data: hotels,
          type: 'hotels',
          route: '/services/hotels'
        };
      } else {
        response = {
          message: 'Sorry, no hotels found matching your criteria. Try searching with a different location.',
          data: [],
          type: 'info',
          route: '/services/hotels'
        };
      }
    }
    // Flights related queries
    else if (questionLower.includes('flight') || questionLower.includes('cheapest flight') || questionLower.includes('cheap flight')) {
      let query = { availableSeats: { $gt: 0 } };
      
      if (to || destination) {
        query.to = { $regex: to || destination, $options: 'i' };
      }
      if (from) {
        query.from = { $regex: from, $options: 'i' };
      }
      
      const flights = await FlightModel.find(query)
        .populate('vendorId', 'name orgName')
        .sort({ price: 1 }) // Cheapest first
        .limit(10);
      
      if (flights.length > 0) {
        response = {
          message: from && to
            ? `Here are the cheapest flights from ${from} to ${to || destination}:`
            : to || destination
            ? `Here are the cheapest flights to ${to || destination}:`
            : 'Here are some available flights:',
          data: flights,
          type: 'flights',
          route: '/services/flights'
        };
      } else {
        response = {
          message: 'Sorry, no flights found matching your criteria.',
          data: [],
          type: 'info',
          route: '/services/flights'
        };
      }
    }
    // Holiday packages related queries
    else if (questionLower.includes('holiday') || questionLower.includes('package') || questionLower.includes('vacation') || 
             questionLower.includes('family-friendly') || questionLower.includes('adventure') || 
             questionLower.includes('beach') || questionLower.includes('tropical') || 
             questionLower.includes('budget') || questionLower.includes('weekend') ||
             questionLower.includes('hidden gem') || questionLower.includes('food') || questionLower.includes('culture') ||
             questionLower.includes('destination') || questionLower.includes('spot')) {
      
      let query = { status: 'available' };
      
      if (location || city || destination) {
        query.location = { $regex: location || city || destination, $options: 'i' };
      }
      
      // Filter by type if mentioned
      if (questionLower.includes('budget') || questionLower.includes('cheap')) {
        // Sort by cost ascending for budget-friendly
      }
      
      let sortObj = {};
      if (questionLower.includes('budget') || questionLower.includes('cheap')) {
        sortObj.cost = 1; // Ascending for cheapest
      } else {
        sortObj.cost = 1; // Default to cheapest first
      }
      
      const holidays = await HolidayModel.find(query)
        .populate('vendorId', 'name orgName')
        .sort(sortObj)
        .limit(10);
      
      if (holidays.length > 0) {
        let message = 'Here are some holiday packages:';
        if (questionLower.includes('family-friendly')) {
          message = 'Here are family-friendly vacation packages:';
        } else if (questionLower.includes('adventure')) {
          message = 'Here are adventure travel packages:';
        } else if (questionLower.includes('beach') || questionLower.includes('tropical')) {
          message = 'Here are beach and tropical getaway packages:';
        } else if (questionLower.includes('budget')) {
          message = 'Here are budget-friendly vacation packages:';
        } else if (questionLower.includes('weekend')) {
          message = `Here are weekend packages for ${city || location || 'your destination'}:`;
        } else if (location || city || destination) {
          message = `Here are vacation packages for ${location || city || destination}:`;
        }
        
        response = {
          message,
          data: holidays,
          type: 'holidays',
          route: '/services/holidays'
        };
      } else {
        response = {
          message: 'Sorry, no holiday packages found matching your criteria.',
          data: [],
          type: 'info',
          route: '/services/holidays'
        };
      }
    }
    // Guides/Tours related queries
    else if (questionLower.includes('guide') || questionLower.includes('tour') || questionLower.includes('historical') || 
             questionLower.includes('attraction') || questionLower.includes('must-see')) {
      
      let query = { status: 'free' };
      
      if (location || city || destination) {
        query.location = { $regex: location || city || destination, $options: 'i' };
        query.expertiseLocation = { $regex: location || city || destination, $options: 'i' };
      }
      
      const guides = await GuideModel.find(query)
        .populate('vendorId', 'name orgName')
        .sort({ pricePerHour: 1 })
        .limit(10);
      
      if (guides.length > 0) {
        let message = 'Here are available tour guides:';
        if (questionLower.includes('historical')) {
          message = `Here are guides for historical tours in ${location || city || destination || 'your area'}:`;
        } else if (questionLower.includes('attraction') || questionLower.includes('must-see')) {
          message = `Here are guides who can show you the must-see attractions in ${location || city || destination || 'your destination'}:`;
        }
        
        response = {
          message,
          data: guides,
          type: 'guides',
          route: '/services/guides'
        };
      } else {
        response = {
          message: 'Sorry, no guides found matching your criteria.',
          data: [],
          type: 'info',
          route: '/services/guides'
        };
      }
    }
    // Events related queries
    else if (questionLower.includes('event') || questionLower.includes('attraction')) {
      let query = { availableTickets: { $gt: 0 } };
      
      if (location || city || destination) {
        query.location = { $regex: location || city || destination, $options: 'i' };
      }
      
      const events = await EventModel.find(query)
        .populate('vendorId', 'name orgName')
        .sort({ eventDate: 1 })
        .limit(10);
      
      if (events.length > 0) {
        response = {
          message: `Here are events and attractions in ${location || city || destination || 'your area'}:`,
          data: events,
          type: 'events',
          route: '/services/events'
        };
      } else {
        response = {
          message: 'Sorry, no events found matching your criteria.',
          data: [],
          type: 'info',
          route: '/services/events'
        };
      }
    }
    // Default response
    else {
      response = {
        message: 'I can help you with hotels, flights, holiday packages, guides, and events. Please ask me about any of these services!',
        data: [],
        type: 'info',
        route: null
      };
    }
    
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
