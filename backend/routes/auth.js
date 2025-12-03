const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// --- 1. EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

// --- 3. AUTHENTICATION ROUTES ---

// ==========================================
//  SECTION A: REGISTRATION & LOGIN
// ==========================================

// --- REGISTER INITIATE (Send OTP) ---
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
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    if (user) {
      user.name = name;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = new User({ 
        name, 
        email: emailLower, 
        isVerified: false, 
        otp, 
        otpExpires 
      });
      await user.save();
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailLower,
      subject: 'Phitku - Verify Your Email',
      text: `Hi ${name}, your verification code is: ${otp}. It allows you to set your password.`
    });

    res.status(200).json({ message: 'OTP sent successfully' });

  } catch (err) {
    console.error("Register Init Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- VERIFY OTP (Check Code) ---
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(400).json({ message: 'User not found. Please register again.' });

    if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP Verified' });

  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ message: 'Server Error during verification' });
  }
});

// --- FINALIZE (Set Password & Login) ---
router.post('/register-finalize', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const emailLower = email.toLowerCase().trim();
    
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({ message: 'Password too weak (Min 8 chars, letter & number required)' });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Session expired. Please restart.' });
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
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        addresses: user.addresses 
      }
    });

  } catch (err) {
    console.error("Finalize Error:", err);
    res.status(500).json({ message: 'Finalization failed' });
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ message: 'Account not verified. Please register again.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user._id, user.isAdmin);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.json({ 
      accessToken, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        addresses: user.addresses 
      } 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================================
//  SECTION B: FORGOT PASSWORD (NEW)
// ==========================================

// 1. Forgot Password - Initiate (Send OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send Email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailLower,
        subject: 'Phitku - Reset Your Password',
        text: `Hi ${user.name}, your password reset code is: ${otp}. It expires in 10 minutes.`
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. Verify Forgot Password OTP
router.post('/verify-forgot-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP Verified' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 3. Reset Password (Final Step)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Security Check: OTP must match again
        if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Session expired. Please try again.' });
        }
        
        // Password Strength Check
        const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            return res.status(400).json({ message: 'Password too weak (Min 8 chars, letter & number required)' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. Please login.' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// ==========================================
//  SECTION C: UTILS
// ==========================================

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
    } catch (error) {
      res.status(500).json({ message: 'Invalid Token' });
    }
});

router.post('/save-address', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No Token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.addresses.push(req.body.address);
        await user.save();
        
        res.json({ 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            isAdmin: user.isAdmin, 
            addresses: user.addresses 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error saving address' });
    }
});

module.exports = router;