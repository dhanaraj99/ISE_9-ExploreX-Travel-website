const Vendor = require('../models/VendorModel');
const bcrypt = require('bcryptjs');
const generateToken = require('../middleware/Token');
const FlightModel = require('../models/FlightModel');
const HotelModel = require('../models/HotelModel');
const HolidayModel = require('../models/HolidayModel');
const ShopModel = require('../models/ShopsModel');
const GuideModel = require('../models/GuideModel');
const CurrencyModel = require('../models/CurrencyModel');
const EventModel = require('../models/EventsModel');

// Vendor login
exports.loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(vendor._id , vendor.role);
    res.status(200).json({ 
      message: 'Login successful', 
      token,
      role: vendor.role,
      type: vendor.type
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get vendor profile
exports.getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id).select('-password');
    res.status(200).json(vendor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update vendor info (optional)
exports.updateVendor = async (req, res) => {
  try {
    const updated = await Vendor.findByIdAndUpdate(req.user._id, req.body, { new: true }).select('-password');
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addFlights = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { flightName, from, to, pilotName, totalSeats, availableSeats, price, runDays, specificDates } = req.body;

    const flight = await FlightModel.create({
      vendorId,
      flightName,
      from,
      to,
      pilotName,
      totalSeats,
      availableSeats,
      price,
      runDays,
      specificDates
    });

    res.status(201).json({ message: 'Flight added successfully', flight });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFlights = async (req, res) => {
  try {
    const flights = await FlightModel.find({ vendorId: req.user._id });
    res.status(200).json(flights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hotels
exports.addHotels = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { hotelName, totalRooms, availableRooms, costPerNight, location } = req.body;

    const hotel = await HotelModel.create({
      vendorId,
      hotelName,
      totalRooms,
      availableRooms,
      costPerNight,
      location
    });

    res.status(201).json({ message: 'Hotel added successfully', hotel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHotels = async (req, res) => {
  try {
    const hotels = await HotelModel.find({ vendorId: req.user._id });
    res.status(200).json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Holidays
exports.addHolidays = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { packageName, location, totalDays, cost, status } = req.body;

    const holiday = await HolidayModel.create({
      vendorId,
      packageName,
      location,
      totalDays,
      cost,
      status: status || 'available'
    });

    res.status(201).json({ message: 'Holiday package added successfully', holiday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await HolidayModel.find({ vendorId: req.user._id });
    res.status(200).json(holidays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shops
exports.addShops = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { shopName, location, items } = req.body;

    const shop = await ShopModel.create({
      vendorId,
      shopName,
      location,
      items: items || []
    });

    res.status(201).json({ message: 'Shop added successfully', shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShops = async (req, res) => {
  try {
    const shops = await ShopModel.find({ vendorId: req.user._id });
    res.status(200).json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Guides
exports.addGuides = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { name, location, expertiseLocation, hoursAvailable, pricePerHour, status } = req.body;

    const guide = await GuideModel.create({
      vendorId,
      name,
      location,
      expertiseLocation,
      hoursAvailable,
      pricePerHour,
      status: status || 'free'
    });

    res.status(201).json({ message: 'Guide added successfully', guide });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGuides = async (req, res) => {
  try {
    const guides = await GuideModel.find({ vendorId: req.user._id });
    res.status(200).json(guides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Currency
exports.addCurrency = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { location, currencyType, rate, status } = req.body;

    const currency = await CurrencyModel.create({
      vendorId,
      location,
      currencyType,
      rate,
      status: status || 'in stock'
    });

    res.status(201).json({ message: 'Currency exchange added successfully', currency });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCurrency = async (req, res) => {
  try {
    const currencies = await CurrencyModel.find({ vendorId: req.user._id });
    res.status(200).json(currencies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Events
exports.addEvents = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { eventName, location, eventDate, eventTime, totalTickets, availableTickets, price, description } = req.body;

    const event = await EventModel.create({
      vendorId,
      eventName,
      location,
      eventDate,
      eventTime,
      totalTickets,
      availableTickets,
      price,
      description
    });

    res.status(201).json({ message: 'Event added successfully', event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await EventModel.find({ vendorId: req.user._id });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};