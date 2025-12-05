const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/dbConfig');

// dotenv.config();
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 👇 Base URL prefix
const baseUrl = '/api/v1';

//Import Routes
const userRoutes = require('./Routes/UserRoute');
const vendorRoutes = require('./Routes/VendorRoute');
const adminRoutes = require('./Routes/AdminRoute');
//Use Routes
app.use(`${baseUrl}/users`, userRoutes);
app.use(`${baseUrl}/vendors`, vendorRoutes);
app.use(`${baseUrl}/admins`, adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}${baseUrl}`);
});
