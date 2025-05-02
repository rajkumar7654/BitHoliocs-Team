const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'answered', 'closed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Question', questionSchema); 