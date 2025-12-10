const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- 1. BREVO (SENDINBLUE) CONFIGURATION ---
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API Key (We will add this to Render in Step 4)
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// --- 2. HELPER: Send Email Function ---
const sendEmail = async (to, subject, textContent) => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2E8B57;">Phitku Natural Care</h2>
      <p style="font-size: 16px;">${textContent}</p>
      <br>
      <p style="font-size: 12px; color: #777;">Thank you for trusting nature!</p>
    </div>`;
  
  // SENDER SETTINGS
  // Note: Until you verify a domain, this might show as "via sendinblue.com"
  sendSmtpEmail.sender = { "name": "Natural Living Team", "email": "sahilsaini314on@gmail.com" }; 
  sendSmtpEmail.to = [{ "email": to }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email API Error:", error);
    // We don't throw error here to prevent crashing the registration if email fails
  }
};

// --- 3. AUTH HELPER FUNCTIONS ---
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

// --- 4. ROUTES ---

// REGISTER STEP 1: Send OTP
router.post('/register-init', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and Email required' });

    const emailLower = email.toLowerCase().trim();
    let user = await User.findOne({ email: emailLower });
    
    // Check if user exists and is already verified
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists. Please Login.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes

    if (user) {
      user.name = name;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = new User({ name, email: emailLower, isVerified: false, otp, otpExpires });
      await user.save();
    }

    // Send Email using Brevo
    await sendEmail(
      emailLower, 
      'Your Phitku Verification Code', 
      `Hi ${name},<br><br>Your OTP code is: <b>${otp}</b>`
    );

    res.status(200).json({ message: 'OTP sent to your email!' });

  } catch (err) {
    console.error("Register Error:", err); 
    res.status(500).json({ message: 'Server Error. Could not send OTP.' });
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
    
    // Simple password check
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({ message: 'Password must include letters, numbers & symbols.' });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Double check OTP
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

    // Send Real Email
    await sendEmail(
      emailLower, 
      'Reset Password - Phitku', 
      `Hi ${user.name},<br><br>Your reset code is: <b>${otp}</b>`
    );

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error("Forgot Pass Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// OTHER ROUTES (No changes needed, but keeping for completeness)
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