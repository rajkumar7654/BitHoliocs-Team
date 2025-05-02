const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const FIR = require('../models/FIR');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    if (!req.session.adminId) {
        return res.redirect('/auth/admin/login');
    }
    try {
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) {
            return res.redirect('/auth/admin/login');
        }
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.redirect('/auth/admin/login');
    }
};

// Admin Login Page
router.get('/login', (req, res) => {
    if (req.session.adminId) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', {
        title: 'Admin Login',
        error: req.query.error
    });
});

// Admin Login Process
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find admin by username
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.render('admin/login', {
                title: 'Admin Login',
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        
        if (!isMatch) {
            return res.render('admin/login', {
                title: 'Admin Login',
                error: 'Invalid credentials'
            });
        }

        // Set admin session
        req.session.adminId = admin._id;
        req.session.isAdmin = true;
        
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        
        // Redirect to admin dashboard
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Admin login error:', error);
        res.render('admin/login', {
            title: 'Admin Login',
            error: 'An error occurred during login'
        });
    }
});

// Admin Dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        // Fetch statistics
        const stats = {
            totalUsers: await User.countDocuments(),
            activeFIRs: await FIR.countDocuments({ status: { $ne: 'Closed' } }),
            pendingAppointments: await Appointment.countDocuments({ status: 'Pending' }),
            totalCases: await FIR.countDocuments()
        };

        // Fetch recent FIRs
        const recentFIRs = await FIR.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firNumber complainantName status createdAt');

        // Fetch today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.find({
            appointmentDate: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort('appointmentTime');

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            admin: req.admin,
            stats,
            recentFIRs,
            todayAppointments
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('error', {
            title: 'Error',
            message: 'Error loading dashboard',
            error
        });
    }
});

// Admin Logout
router.get('/logout', (req, res) => {
    req.session.adminId = null;
    req.session.isAdmin = false;
    res.redirect('/');
});

module.exports = router; 