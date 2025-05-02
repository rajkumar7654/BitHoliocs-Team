const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { isAuthenticated } = require('../config/middleware');

// GET route for appointment booking form
router.get('/new', isAuthenticated, (req, res) => {
    res.render('appointments/new', {
        user: req.user,
        title: 'Book Appointment'
    });
});

// POST route for submitting appointment
router.post('/new', isAuthenticated, async (req, res) => {
    try {
        const {
            purpose,
            preferredDate,
            preferredTime,
            description
        } = req.body;

        // Create new appointment
        const appointment = new Appointment({
            userId: req.user._id,
            appointmentDate: new Date(preferredDate),
            timeSlot: preferredTime,
            purpose,
            description,
            status: 'Pending',
            location: 'Police Station'
        });

        await appointment.save();
        res.redirect(`/appointments/${appointment._id}`);
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.render('appointments/new', {
            user: req.user,
            title: 'Book Appointment',
            error: 'Failed to book appointment. Please try again.'
        });
    }
});

// GET route for viewing appointment details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('userId', 'name phone');

        if (!appointment) {
            return res.status(404).render('error', {
                title: 'Appointment Not Found',
                message: 'Appointment not found',
                error: { status: 404 }
            });
        }

        res.render('appointments/view', {
            user: req.user,
            title: 'Appointment Details',
            appointment
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error retrieving appointment',
            error
        });
    }
});

// GET route for user's appointments list
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        // Get appointment statistics
        const stats = {
            total: appointments.length,
            pending: appointments.filter(a => a.status === 'Pending').length,
            scheduled: appointments.filter(a => a.status === 'Scheduled').length,
            completed: appointments.filter(a => a.status === 'Completed').length,
            cancelled: appointments.filter(a => a.status === 'Cancelled').length,
            rescheduled: appointments.filter(a => a.status === 'Rescheduled').length,
            upcoming: appointments.filter(a => 
                (a.status === 'Scheduled' || a.status === 'Pending') && 
                new Date(a.appointmentDate) > new Date()
            ).length
        };

        res.render('appointments/list', {
            user: req.user,
            title: 'My Appointments',
            appointments,
            stats
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error retrieving appointments',
            error
        });
    }
});

// POST route for cancelling appointment
router.post('/:id/cancel', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.status !== 'Pending' && appointment.status !== 'Scheduled') {
            return res.status(400).json({ error: 'Cannot cancel this appointment' });
        }

        appointment.status = 'Cancelled';
        await appointment.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
});

module.exports = router; 