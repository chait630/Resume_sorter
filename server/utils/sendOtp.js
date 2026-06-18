const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (toEmail, otp, name) => {
  const mailOptions = {
    from: `"ResumeSort HR" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your OTP for ResumeSort Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6c63ff, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -1px;">⬡ ResumeSort</h1>
          <p style="color: #e0d9ff; margin: 8px 0 0; font-size: 14px;">HR Portal</p>
        </div>
        <div style="padding: 40px 32px; background: #fff;">
          <p style="color: #333; font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #555; font-size: 15px;">Your One-Time Password (OTP) for login is:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #6c63ff; background: #f0eeff; padding: 16px 32px; border-radius: 12px;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <div style="padding: 16px 32px; background: #f9f9f9; text-align: center;">
          <p style="color: #aaa; font-size: 12px; margin: 0;">© 2024 ResumeSort. All rights reserved.</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOtpEmail };