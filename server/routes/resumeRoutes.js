const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Resume = require('../models/Resume');
const auth = require('../utils/authMiddleware');

router.use(auth);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
const { parseResumeFull } = require('../utils/parseResume');

// POST — upload resume
router.post('/', upload.single('resumeFile'), async (req, res) => {
  try {
    const { name, email, phone, country, skills, state, district } = req.body;
    const resumeFile = req.file ? req.file.filename : '';
    
    let finalName = name || 'Candidate';
    let finalState = state || 'Unknown';
    let finalDistrict = district || 'Unknown';
    let finalEmail = email || '';
    let finalPhone = phone || '';
    let finalSkills = skills || '';
    let rawText = '';

    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      const extractedData = await parseResumeFull(filePath);
      
      finalName = extractedData.name || finalName;
      finalState = extractedData.state !== 'Unknown' ? extractedData.state : finalState;
      finalDistrict = extractedData.district !== 'Unknown' ? extractedData.district : finalDistrict;
      finalEmail = extractedData.email || finalEmail;
      finalPhone = extractedData.phone || finalPhone;
      finalSkills = extractedData.skills || finalSkills;
      rawText = extractedData.rawText || '';
    }

    const score = finalSkills ? Math.min(100, finalSkills.split(',').length * 15 + Math.floor(Math.random() * 20)) : 0;

    const resume = new Resume({
      name:     finalName, 
      email:    finalEmail,
      phone:    finalPhone,
      country:  country  || 'India',
      state:    finalState,
      district: finalDistrict,
      skills:   finalSkills,
      resumeFile,
      score,
      rawText
    });
    
    await resume.save();
    res.status(201).json({ message: 'Resume uploaded successfully', resume });
  } catch (err) {
    console.error('SAVE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET — fetch with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { state, district, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (state)    filter.state    = new RegExp(state, 'i');
    if (district) filter.district = new RegExp(district, 'i');
    if (status)   filter.status   = status;

    const resumes = await Resume.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Resume.countDocuments(filter);

    res.json({
      resumes,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalCount: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH — update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const resume = await Resume.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { checkRole } = require('../utils/authMiddleware');

// POST — add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const user = req.user.name || 'Anonymous';
    const resume = await Resume.findById(req.params.id);
    resume.comments.push({ user, text });
    await resume.save();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — Admin Only
router.delete('/:id', checkRole(['Admin']), async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;