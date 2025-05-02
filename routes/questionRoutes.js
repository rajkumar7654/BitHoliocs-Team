const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Handle question submission
router.post('/submit', async (req, res) => {
    try {
        console.log('Received question submission:', req.body); // Add logging

        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create new question
        const question = new Question({
            name,
            email,
            subject,
            message
        });

        // Save to database
        const savedQuestion = await question.save();
        console.log('Question saved successfully:', savedQuestion); // Add logging

        res.json({
            success: true,
            message: 'Your question has been submitted successfully. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error submitting question:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your question. Please try again.'
        });
    }
});

// Get all questions (for admin use)
router.get('/', async (req, res) => {
    try {
        const questions = await Question.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching questions'
        });
    }
});

module.exports = router; 