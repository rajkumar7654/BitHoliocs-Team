const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Render contact page
router.get('/', (req, res) => {
    res.render('contact', {
        title: 'Contact Us',
        user: req.user
    });
});

// Handle contact form submission
router.post('/submit', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create new contact submission
        const contact = new Contact({
            name,
            email,
            phone,
            subject,
            message
        });

        // Save to database
        await contact.save();

        res.json({
            success: true,
            message: 'Thank you for contacting us. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your message. Please try again.'
        });
    }
});

module.exports = router; 