require('dotenv').config();
const mongoose = require('mongoose');
const Resume = require('./models/Resume');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chaithanya3021_db_user:chaithanya3021@cluster0.irvxemb.mongodb.net/Resume_sorter?retryWrites=true&w=majority';

async function checkDB() {
  try {
    await mongoose.connect(MONGO_URI);
    const count = await Resume.countDocuments();
    console.log(`TOTAL RESUMES IN DB: ${count}`);
    const latest = await Resume.findOne().sort({ createdAt: -1 });
    if (latest) {
      console.log('--- LATEST RECORD ---');
      console.log('ID:', latest._id);
      console.log('Name:', latest.name);
      console.log('Skills:', latest.skills);
      console.log('Email:', latest.email);
      console.log('State:', latest.state);
      console.log('Score:', latest.score);
    } else {
      console.log('No resumes found.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDB();
