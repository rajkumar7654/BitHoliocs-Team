const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  aadhaar: {
    type: String,
    required: true,
    unique: true,
    length: 12,
    validate: {
      validator: function(v) {
        return /^\d{12}$/.test(v);
      },
      message: 'Aadhaar number must be 12 digits'
    }
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  otp: {
    code: String,
    generatedAt: Date,
    expiresAt: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  notifications: [{
    message: String,
    type: String,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Pre-save middleware to handle password hashing if needed in future
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Instance method to verify OTP
userSchema.methods.verifyOTP = function(inputOTP) {
  return this.otp &&
         this.otp.code === inputOTP &&
         this.otp.expiresAt > new Date();
};

// Static method to generate OTP
userSchema.statics.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date();
  return {
    code: otp,
    generatedAt: now,
    expiresAt: new Date(now.getTime() + 5 * 60000) // 5 minutes expiry
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User; 