require('dotenv').config();
const { sendOtpEmail } = require('./utils/sendOtp');

async function test() {
  try {
    console.log('Sending test email to chaithanya3021@gmail.com...');
    await sendOtpEmail('chaithanya3021@gmail.com', '123456', 'Tester');
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

test();
