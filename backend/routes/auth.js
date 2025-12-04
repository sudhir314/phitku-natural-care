const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// --- 1. EMAIL CONFIGURATION (UPDATED: SSL PORT 465) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // Changed from 587 to 465
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Debug logs to help if it fails again
  logger: true,
  debug: true 
});

// --- 2. HELPER FUNCTIONS ---
const generateAccessToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const setRefreshTokenCookie = (res, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

// --- ROUTES ---

// REGISTER STEP 1
router.post('/register-init', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and Email required' });

    const emailLower = email.toLowerCase().trim();
    let user = await User.findOne({ email: emailLower });
    
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists. Please Login.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (user) {
      user.name = name;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = new User({ name, email: emailLower, isVerified: false, otp, otpExpires });
      await user.save();
    }

    // Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailLower,
      subject: 'Phitku - Verify Your Email',
      text: `Hi ${name}, your verification code is: ${otp}`
    });

    res.status(200).json({ message: 'OTP sent successfully' });

  } catch (err) {
    console.error("Register Init Error:", err); // Check Render Logs for details
    res.status(500).json({ message: 'Server Error: Could not send OTP. Check email settings.' });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP Verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// FINALIZE REGISTRATION
router.post('/register-finalize', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const emailLower = email.toLowerCase().trim();
    
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({ message: 'Password too weak' });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Session expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id, user.isAdmin);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Registration Complete!',
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, addresses: user.addresses }
    });

  } catch (err) {
    res.status(500).json({ message: 'Finalization failed' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ message: 'Account not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user._id, user.isAdmin);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, addresses: user.addresses } });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; 

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailLower,
        subject: 'Phitku - Reset Your Password',
        text: `Hi ${user.name}, your password reset code is: ${otp}`
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error("Forgot Pass Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/verify-forgot-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        res.json({ message: 'OTP Verified' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) return res.status(400).json({ message: 'Session expired' });
        
        const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!strongPasswordRegex.test(password)) return res.status(400).json({ message: 'Password too weak' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successful' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out' });
});

router.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No Token' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      res.json(user);
    } catch (error) { res.status(500).json({ message: 'Invalid Token' }); }
});

router.post('/save-address', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No Token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        user.addresses.push(req.body.address);
        await user.save();
        res.json({ id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, addresses: user.addresses });
    } catch (error) { res.status(500).json({ message: 'Error saving address' }); }
});

module.exports = router;