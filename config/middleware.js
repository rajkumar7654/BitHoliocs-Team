const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Middleware to check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    // Check for session
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }
    
    // Get user from database
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/auth/login');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/auth/login');
  }
};

// Middleware to check if admin is authenticated
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.session.adminId) {
      return res.redirect('/admin/login');
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.redirect('/admin/login');
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.redirect('/admin/login');
  }
};

// Middleware to check specific admin permissions
exports.hasPermission = (permission) => {
  return async (req, res, next) => {
    if (!req.admin || !req.admin.hasPermission(permission)) {
      return res.status(403).render('error', {
        error: { message: 'You do not have permission to access this resource' }
      });
    }
    next();
  };
};

// Middleware to handle OTP verification
exports.requireOTPVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.isVerified) {
      return res.redirect('/auth/verify-otp');
    }
    next();
  } catch (error) {
    console.error('OTP verification error:', error);
    res.redirect('/auth/login');
  }
}; 