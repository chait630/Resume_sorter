const express = require('express');
const router = express.Router();
const JobRequirement = require('../models/JobRequirement');
const auth = require('../utils/authMiddleware');

router.use(auth);

// GET all requirements
router.get('/', async (req, res) => {
  try {
    const reqs = await JobRequirement.find().sort({ createdAt: -1 });
    res.json(reqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new requirement
router.post('/', async (req, res) => {
  try {
    const { title, targetSkills, minExperience, targetState } = req.body;
    const newReq = new JobRequirement({ 
      title, 
      targetSkills: Array.isArray(targetSkills) ? targetSkills : targetSkills.split(',').map(s => s.trim()), 
      minExperience, 
      targetState 
    });
    await newReq.save();
    res.status(201).json(newReq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await JobRequirement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Requirement deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
