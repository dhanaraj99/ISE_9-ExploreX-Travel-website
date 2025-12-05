const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Vendor = require('../models/VendorModel');
const Admin = require('../models/AdminModel');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find the user in all three collections
      let user =
        (await User.findById(decoded.id).select('-password')) ||
        (await Vendor.findById(decoded.id).select('-password')) ||
        (await Admin.findById(decoded.id).select('-password'));

      if (!user) {
        return res.status(401).json({ message: 'User/Vendor/Admin not found' });
      }

      req.user = user;

      // Optional: override role if token contains it
      if (decoded.role) {
        req.user.role = decoded.role;
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role (${req.user?.role || 'none'}) is not authorized to access this resource` });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
