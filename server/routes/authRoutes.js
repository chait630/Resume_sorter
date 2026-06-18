const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOtpEmail } = require('../utils/sendOtp');

// REGISTER
router.post('/register', async (req, res) => {
  console.log('--- Register Attempt Start ---');
  try {
    const { name, email, password } = req.body;
    console.log('Data:', { name, email });
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    console.log('Checking existing user...');
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already registered. Please sign in.' });

    console.log('Generating OTP...');
    const otp      = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user     = new User({ name, email, password, otp, otpExpiry, isVerified: false });
    
    console.log('Saving user (this triggers pre-save hook)...');
    await user.save();

    console.log('Sending OTP email...');
    await sendOtpEmail(email, otp, name);
    console.log(`OTP sent to ${email}: ${otp}`);

    res.status(201).json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// VERIFY OTP — after register
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)                       return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp)            return res.status(400).json({ message: 'Invalid OTP. Try again.' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired. Please register again.' });

    user.isVerified = true;
    user.otp        = null;
    user.otpExpiry  = null;
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('VERIFY OTP ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)            return res.status(404).json({ message: 'Email not registered. Please sign up first.' });
    if (!user.isVerified) return res.status(401).json({ message: 'Email not verified. Please complete sign up.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    // Success - Skip OTP and return token immediately
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// VERIFY LOGIN OTP
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)                       return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp)            return res.status(400).json({ message: 'Invalid OTP. Try again.' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired. Please login again.' });

    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('VERIFY LOGIN OTP ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// RESEND OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp      = generateOTP();
    user.otp       = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp, user.name);
    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    console.error('RESEND OTP ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not registered.' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp, user.name);
    console.log(`Reset OTP sent to ${email}: ${otp}`);

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// VERIFY RESET OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)                       return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp)            return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('VERIFY RESET OTP ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;