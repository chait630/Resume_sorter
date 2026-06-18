const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, default: '' },
  phone:      { type: String, default: '' },
  country:    { type: String, default: 'India' },
  state:      { type: String, default: 'Unknown' },
  district:   { type: String, default: 'Unknown' },
  skills:     { type: String, default: '' },
  resumeFile: { type: String, default: '' },
  status:     { type: String, enum: ['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Rejected'], default: 'New' },
  score:      { type: Number, default: 0 },
  rawText:    { type: String, default: '' },
  comments:   [{
    user:     { type: String },
    text:     { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);