const express = require('express');
const router = express.Router();
const User = require('../models/User');
const otpService = require('../config/otpService');
const { isAuthenticated } = require('../config/middleware');

// GET /auth/register - Show registration form
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

// POST /auth/register - Handle registration
router.post('/register', async (req, res) => {
  try {
    const { name, aadhaar, phone } = req.body;

    // Validate input
    if (!name || !aadhaar || !phone) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'All fields are required'
      });
    }

    // Validate Aadhaar
    if (!/^\d{12}$/.test(aadhaar)) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Aadhaar must be 12 digits'
      });
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Phone number must be 10 digits'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ aadhaar }, { phone }] });
    if (user) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'User with this Aadhaar or phone number already exists'
      });
    }

    // Create new user
    user = new User({
      name,
      aadhaar,
      phone
    });

    // Generate and save OTP
    const otpData = otpService.createOTPObject();
    user.otp = otpData;
    await user.save();

    // Send OTP (mock implementation - just logs to console)
    await otpService.sendOTPSMS(phone, otpData.code);
    console.log(`[REGISTRATION] OTP ${otpData.code} sent to ${phone}`);

    // Store user ID and OTP in session for demo purposes
    req.session.userId = user._id;
    req.session.demoOtp = otpData.code;
    req.session.phone = phone;

    res.redirect('/auth/verify-otp');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register',
      error: 'Registration failed. Please try again.'
    });
  }
});

// GET /auth/login - Show login form
router.get('/login', (req, res) => {
  const returnTo = req.query.returnTo || req.session.returnTo;
  res.render('auth/login', { 
    title: 'Login',
    returnTo: returnTo 
  });
});

// POST /auth/login - Handle login
router.post('/login', async (req, res) => {
  try {
    const { loginType, aadhaar, phone } = req.body;
    console.log('Login attempt:', { loginType, aadhaar, phone });

    // Validate input based on login type
    let searchQuery = {};
    let searchValue = '';
    
    if (loginType === 'aadhaar') {
      if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
        return res.render('auth/login', {
          title: 'Login',
          error: 'Please enter a valid 12-digit Aadhaar number'
        });
      }
      searchQuery = { aadhaar };
      searchValue = aadhaar;
    } else if (loginType === 'phone') {
      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.render('auth/login', {
          title: 'Login',
          error: 'Please enter a valid 10-digit phone number'
        });
      }
      searchQuery = { phone };
      searchValue = phone;
    } else {
      console.error('Invalid login type:', loginType);
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid login type'
      });
    }

    console.log('Searching user with query:', searchQuery);

    // Find user
    const user = await User.findOne(searchQuery);
    if (!user) {
      console.log('User not found with:', searchQuery);
      return res.render('auth/login', {
        title: 'Login',
        error: `No user found with the provided ${loginType === 'aadhaar' ? 'Aadhaar number' : 'phone number'}`,
        loginType // Pass back the login type to maintain tab state
      });
    }

    // Generate and save new OTP
    const otpData = otpService.createOTPObject();
    user.otp = otpData;
    await user.save();

    // Send OTP (mock implementation - just logs to console)
    await otpService.sendOTPSMS(user.phone, otpData.code);
    console.log(`[LOGIN] OTP ${otpData.code} sent to ${user.phone} for ${loginType} login with ${searchValue}`);

    // Store user ID, login type, and OTP in session for demo purposes
    req.session.userId = user._id;
    req.session.loginType = loginType;
    req.session.demoOtp = otpData.code;
    req.session.phone = user.phone;
    // Store return URL in session if it exists
    if (req.body.returnTo) {
      req.session.returnTo = req.body.returnTo;
    }

    res.redirect('/auth/verify-otp');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login',
      error: 'Login failed. Please try again.',
      loginType: req.body.loginType // Pass back the login type to maintain tab state
    });
  }
});

// GET /auth/verify-otp - Show OTP verification form
router.get('/verify-otp', (req, res) => {
  if (!req.session.userId || !req.session.demoOtp) {
    console.log('No session data for OTP verification, redirecting to login');
    return res.redirect('/auth/login');
  }
  
  res.render('auth/verify-otp', { 
    title: 'Verify OTP',
    demoOtp: req.session.demoOtp,
    phone: req.session.phone,
    loginType: req.session.loginType
  });
});

// POST /auth/verify-otp - Handle OTP verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    
    console.log('OTP verification attempt:', { 
      submittedOtp: otp, 
      expectedOtp: req.session.demoOtp,
      userId: req.session.userId,
      loginType: req.session.loginType
    });

    if (!req.session.userId || !req.session.demoOtp) {
      console.log('No session data found, redirecting to login');
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('User not found:', req.session.userId);
      return res.redirect('/auth/login');
    }

    // For demo purposes, directly compare with the session OTP
    if (!otp || otp !== req.session.demoOtp) {
      console.log('Invalid OTP:', { submitted: otp, expected: req.session.demoOtp });
      return res.render('auth/verify-otp', {
        title: 'Verify OTP',
        error: 'Invalid OTP. Please try again.',
        demoOtp: req.session.demoOtp,
        phone: req.session.phone,
        loginType: req.session.loginType
      });
    }

    // Mark user as verified and update session
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Store authenticated user in session
    req.session.isAuthenticated = true;
    req.session.user = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      aadhaar: user.aadhaar
    };

    // Clear sensitive data from session
    req.session.demoOtp = null;
    req.session.loginType = null;
    
    console.log('User verified successfully:', user._id);
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('OTP verification error:', error);
    res.render('auth/verify-otp', {
      title: 'Verify OTP',
      error: 'OTP verification failed. Please try again.',
      demoOtp: req.session.demoOtp,
      phone: req.session.phone,
      loginType: req.session.loginType
    });
  }
});

// POST /auth/resend-otp - Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/auth/login');
    }

    // Generate and save new OTP
    const otpData = otpService.createOTPObject();
    user.otp = otpData;
    await user.save();

    // Send OTP (mock implementation - just logs to console)
    await otpService.sendOTPSMS(user.phone, otpData.code);
    console.log(`[RESEND] OTP ${otpData.code} sent to ${user.phone}`);

    // Update session with new OTP for demo
    req.session.demoOtp = otpData.code;

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// POST /auth/logout - Handle logout
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router; 