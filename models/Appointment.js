const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FIR',
    required: false
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: [
      'Statement Recording',
      'Evidence Submission',
      'Case Discussion',
      'Document Verification',
      'General Inquiry',
      'Other'
    ]
  },
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Pending'
  },
  location: {
    type: String,
    enum: ['Police Station', 'Complainant Location', 'Other'],
    default: 'Police Station'
  },
  locationDetails: {
    address: String,
    landmark: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  description: String,
  notes: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: Date
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a geospatial index on the location coordinates
appointmentSchema.index({ 'locationDetails.coordinates': '2dsphere' });

// Pre-save middleware
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Add status history entry if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date(),
      remarks: 'Status updated'
    });
  }
  
  next();
});

// Static method to check slot availability
appointmentSchema.statics.isSlotAvailable = async function(officerId, appointmentDate, timeSlot) {
  const count = await this.countDocuments({
    officerId,
    appointmentDate,
    timeSlot,
    status: { $nin: ['Cancelled', 'Completed'] }
  });
  return count === 0;
};

// Instance method to reschedule appointment
appointmentSchema.methods.reschedule = async function(newDate, newTimeSlot, remarks) {
  const oldStatus = this.status;
  this.appointmentDate = newDate;
  this.timeSlot = newTimeSlot;
  this.status = 'Rescheduled';
  this.statusHistory.push({
    status: 'Rescheduled',
    updatedAt: new Date(),
    remarks: remarks || 'Appointment rescheduled'
  });
  await this.save();
  return this;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 