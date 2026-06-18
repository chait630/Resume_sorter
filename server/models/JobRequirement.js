const mongoose = require('mongoose');

const jobRequirementSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  targetSkills: [{ type: String }],
  minExperience: { type: Number, default: 0 },
  targetState:  { type: String, default: '' },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('JobRequirement', jobRequirementSchema);
