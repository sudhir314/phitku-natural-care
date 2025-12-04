const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer'); 

// --- UPDATED EMAIL CONFIG FOR RENDER ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// --- 1. Subscribe Route (Sends Voucher) ---
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Phitku! Here is your 10% Discount',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #059669; text-align: center;">Welcome to the Tribe! 🌿</h1>
          <p style="font-size: 16px; color: #333;">Hi there,</p>
          <p style="font-size: 16px; color: #555;">Thank you for subscribing to Phitku. We're excited to help you start your natural skincare journey.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #059669; font-weight: bold;">Use this code at checkout:</p>
            <h2 style="margin: 10px 0; font-size: 32px; letter-spacing: 2px; color: #000;">WELCOME10</h2>
            <p style="margin: 0; font-size: 12px; color: #666;">(Valid for your first order)</p>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Shop Now</a>
          </p>
        </div>
      `
    });

    res.json({ message: 'Voucher sent successfully!' });
  } catch (error) {
    console.error("Newsletter Error:", error);
    res.status(500).json({ message: 'Failed to send email. Connection Timeout.' });
  }
});

// --- 2. Create Coupon (Admin) ---
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, discountPercentage } = req.body;
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) return res.status(400).json({ message: 'Coupon already exists' });

    const coupon = new Coupon({ code: code.toUpperCase(), discountPercentage });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 3. Get All Coupons (Admin) ---
router.get('/', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 4. Delete Coupon (Admin) ---
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 5. Verify Coupon (Cart) ---
router.post('/verify', async (req, res) => {
  const { code } = req.body;
  
  if (code.toUpperCase() === 'WELCOME10') {
      return res.json({ code: 'WELCOME10', discountPercentage: 10 });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (coupon && coupon.isActive) {
      res.json({ 
        code: coupon.code, 
        discountPercentage: coupon.discountPercentage 
      });
    } else {
      res.status(404).json({ message: 'Invalid or expired coupon' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;