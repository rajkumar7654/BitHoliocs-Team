const express = require('express');
const router = express.Router();
const FIR = require('../models/FIR');
const { isAuthenticated } = require('../config/middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to check authentication
const checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login?returnTo=' + req.originalUrl);
    }
    next();
};

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/evidence';
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images, videos, documents, and audio
    const allowedTypes = {
        'image/jpeg': 'Image',
        'image/png': 'Image',
        'image/gif': 'Image',
        'video/mp4': 'Video',
        'video/mpeg': 'Video',
        'video/quicktime': 'Video',
        'application/pdf': 'Document',
        'application/msword': 'Document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document',
        'audio/mpeg': 'Audio',
        'audio/wav': 'Audio'
    };

    if (allowedTypes[file.mimetype]) {
        file.evidenceType = allowedTypes[file.mimetype];
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, documents, and audio files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// GET route for new FIR form
router.get('/new', isAuthenticated, (req, res) => {
    res.render('fir/new', {
        user: req.user,
        title: 'File New FIR'
    });
});

// POST route for submitting new FIR
router.post('/new', isAuthenticated, upload.array('evidence', 5), async (req, res) => {
    try {
        const {
            firType,
            isAnonymous,
            complainantDetails,
            incidentDetails,
            witnesses,
            evidenceDescriptions
        } = req.body;

        // Generate FIR number
        const date = new Date();
        const year = date.getFullYear();
        const count = await FIR.countDocuments();
        const firNumber = `FIR${year}${(count + 1).toString().padStart(6, '0')}`;

        // Process uploaded files
        const evidence = req.files ? req.files.map((file, index) => ({
            type: file.evidenceType,
            path: file.path.replace('public', ''), // Store relative path
            description: evidenceDescriptions ? evidenceDescriptions[index] : '',
            uploadedAt: new Date()
        })) : [];

        const newFIR = new FIR({
            userId: req.user._id,
            firNumber,
            firType,
            isAnonymous: isAnonymous === 'true',
            complainantDetails: {
                name: complainantDetails.name,
                phone: complainantDetails.phone,
                address: {
                    street: complainantDetails.street,
                    city: complainantDetails.city,
                    state: complainantDetails.state,
                    pincode: complainantDetails.pincode
                }
            },
            incidentDetails: {
                date: new Date(incidentDetails.date),
                time: incidentDetails.time,
                location: {
                    type: 'Point',
                    coordinates: [
                        // Ensure coordinates are within valid ranges
                        Math.min(Math.max(parseFloat(incidentDetails.longitude) || 0, -180), 180),
                        Math.min(Math.max(parseFloat(incidentDetails.latitude) || 0, -90), 90)
                    ],
                    address: incidentDetails.address
                },
                description: incidentDetails.description
            },
            evidence,
            witnesses: witnesses ? witnesses.map(w => ({
                name: w.name,
                phone: w.phone,
                statement: w.statement
            })) : []
        });

        await newFIR.save();
        res.redirect(`/fir/${newFIR._id}`);
    } catch (error) {
        // If there's an error, delete any uploaded files
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, err => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }
        
        console.error('Error creating FIR:', error);
        res.render('fir/new', {
            user: req.user,
            title: 'File New FIR',
            error: error.message || 'Failed to create FIR. Please try again.'
        });
    }
});

// GET route for FIR tracking form
router.get('/track', isAuthenticated, (req, res) => {
    res.render('fir/track', {
        user: req.user,
        title: 'Track FIR Status'
    });
});

// POST route for tracking FIR
router.post('/track', isAuthenticated, async (req, res) => {
    try {
        const { firNumber } = req.body;
        if (!firNumber) {
            return res.render('fir/track', {
                user: req.user,
                title: 'Track FIR Status',
                error: 'Please provide an FIR number'
            });
        }

        const fir = await FIR.findOne({ firNumber })
            .populate('userId', 'name phone')
            .populate('assignedOfficer', 'name badge');

        if (!fir) {
            return res.render('fir/track', {
                user: req.user,
                title: 'Track FIR Status',
                error: 'FIR not found with the given number'
            });
        }

        res.render('fir/view', {
            user: req.user,
            title: `FIR Details - ${fir.firNumber}`,
            fir
        });
    } catch (error) {
        console.error('Error tracking FIR:', error);
        res.render('fir/track', {
            user: req.user,
            title: 'Track FIR Status',
            error: 'Error tracking FIR. Please try again.'
        });
    }
});

// GET route for viewing FIR details by ID (This must be the last route)
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        // Check if the ID is a valid ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).render('error', {
                title: 'FIR Not Found',
                message: 'Invalid FIR ID',
                error: { status: 404 }
            });
        }

        const fir = await FIR.findById(req.params.id)
            .populate('userId', 'name phone')
            .populate('assignedOfficer', 'name badge');
        
        if (!fir) {
            return res.status(404).render('error', {
                title: 'FIR Not Found',
                message: 'FIR not found',
                error: { status: 404 }
            });
        }

        res.render('fir/view', {
            user: req.user,
            title: `FIR Details - ${fir.firNumber}`,
            fir
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error retrieving FIR',
            error
        });
    }
});

module.exports = router; 