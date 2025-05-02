const mongoose = require('mongoose');

const firSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Nullable for anonymous FIRs
  },
  firNumber: {
    type: String,
    unique: true,
    required: true
  },
  firType: {
    type: String,
    required: true,
    enum: ['Theft', 'Harassment', 'Cybercrime', 'Assault', 'Property Dispute', 'Missing Person', 'Other']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  complainantDetails: {
    name: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  incidentDetails: {
    date: {
      type: Date,
      required: true
    },
    time: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        validate: {
          validator: function(coords) {
            // Validate longitude and latitude
            // longitude must be between -180 and 180
            // latitude must be between -90 and 90
            return coords.length === 2 &&
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates: longitude must be between -180 and 180, latitude must be between -90 and 90'
        }
      },
      address: String
    },
    description: {
      type: String,
      required: true
    }
  },
  evidence: [{
    type: {
      type: String,
      enum: ['Image', 'Video', 'Document', 'Audio']
    },
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  witnesses: [{
    name: String,
    phone: String,
    statement: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Investigation', 'Closed', 'Rejected'],
    default: 'Pending'
  },
  statusHistory: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    remarks: String
  }],
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create a geospatial index on the location field
firSchema.index({ 'incidentDetails.location': '2dsphere' });

// Generate FIR number before saving
firSchema.pre('save', async function(next) {
  if (!this.firNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await mongoose.model('FIR').countDocuments();
    this.firNumber = `FIR${year}${(count + 1).toString().padStart(6, '0')}`;
  }
  this.lastUpdated = new Date();
  next();
});

const FIR = mongoose.model('FIR', firSchema);

module.exports = FIR; 