const nodemailer = require('nodemailer');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Function to send OTP via email
exports.sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP for Virtual Police Station',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Virtual Police Station - OTP Verification</h2>
          <p>Your One Time Password (OTP) for verification is:</p>
          <h1 style="color: #2b6cb0; letter-spacing: 2px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p style="color: #718096; font-size: 0.9em;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Function to send OTP via SMS (mock implementation)
exports.sendOTPSMS = async (phone, otp) => {
  try {
    // Mock SMS sending - In production, integrate with actual SMS service
    console.log(`Sending OTP ${otp} to ${phone}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    return false;
  }
};

// Function to validate OTP format
exports.validateOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

// Function to generate OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to create OTP object with expiry
exports.createOTPObject = () => {
  const otp = exports.generateOTP();
  const now = new Date();
  return {
    code: otp,
    generatedAt: now,
    expiresAt: new Date(now.getTime() + 5 * 60000) // 5 minutes expiry
  };
}; 