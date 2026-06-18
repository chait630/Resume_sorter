const path = require('path');
// Load .env in development; on Render env vars are injected directly
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Hard fallback so JWT never crashes — Render dashboard should override this
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not in environment — using fallback. Set it in Render dashboard!');
  process.env.JWT_SECRET = 'resumesort_secret_2024';
}

// Log env var status at startup for easy Render log debugging
console.log('🔑 ENV CHECK:', {
  JWT_SECRET:  process.env.JWT_SECRET  ? '✅ set' : '❌ MISSING',
  MONGO_URI:   process.env.MONGO_URI   ? '✅ set' : '❌ MISSING',
  EMAIL_USER:  process.env.EMAIL_USER  ? '✅ set' : '❌ MISSING',
  EMAIL_PASS:  process.env.EMAIL_PASS  ? '✅ set' : '❌ MISSING',
  NODE_ENV:    process.env.NODE_ENV    || 'not set',
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Debugging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

const resumeRoutes      = require('./routes/resumeRoutes');
const authRoutes        = require('./routes/authRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const emailRoutes       = require('./routes/emailRoutes');

app.use('/api/resumes',      resumeRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/email',        emailRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chaithanya3021_db_user:chaithanya3021@cluster0.irvxemb.mongodb.net/Resume_sorter?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all route to serve the React index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('❌ Error Details:', {
    message: err.message,
    name: err.name,
    stack: err.stack
  });
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));