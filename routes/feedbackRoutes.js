const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/submit', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Create new feedback
        const feedback = new Feedback({
            name,
            email,
            subject,
            message
        });

        // Save feedback to database
        await feedback.save();

        // Send success response
        res.json({ success: true, message: 'Feedback submitted successfully!' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Error submitting feedback. Please try again.' });
    }
});

module.exports = router; 