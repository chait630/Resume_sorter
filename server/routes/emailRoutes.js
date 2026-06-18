const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const auth = require('../utils/authMiddleware');

router.use(auth);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST — send email to candidate
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, candidateName, company } = req.body;
    const hrName  = req.user.name  || 'HR';
    const hrEmail = req.user.email || process.env.EMAIL_USER;
    const companyName = company || 'HR Team';

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Recipient, subject, and body are required.' });
    }

    const mailOptions = {
      from:    `"${hrName} - ${companyName}" <${process.env.EMAIL_USER}>`,
      replyTo: hrEmail,
      to,
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 32px 40px;">
            <h1 style="color: #c28e5e; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">${companyName}</h1>
            <p style="color: #808070; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Human Resources</p>
          </div>

          <!-- Body -->
          <div style="padding: 40px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 24px;">Dear <strong>${candidateName || 'Candidate'}</strong>,</p>
            <div style="color: #444; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${body}</div>
          </div>

          <!-- Signature -->
          <div style="background: #f9f9f9; padding: 24px 40px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #555; font-size: 14px; font-weight: 600;">${hrName}</p>
            <p style="margin: 2px 0; color: #888; font-size: 13px;">HR Department — ${companyName}</p>
            <p style="margin: 2px 0; color: #aaa; font-size: 12px;">${hrEmail}</p>
            <p style="margin: 16px 0 0; color: #ccc; font-size: 11px; border-top: 1px solid #eee; padding-top: 12px;">
              You are receiving this email because you applied for a position at ${companyName}. Reply directly to contact ${hrName}.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error('EMAIL SEND ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET — read incoming emails
router.get('/read', async (req, res) => {
  const config = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: [''], markSeen: false };

    const messages = await connection.search(searchCriteria, fetchOptions);
    // get the latest 30 messages, sorted newest first
    const latestMessages = messages.slice(-30).reverse();

    const emails = await Promise.all(latestMessages.map(async (msg) => {
      const all = msg.parts.find(part => part.which === '');
      const parsed = await simpleParser(all.body);
      return {
        id: msg.attributes.uid,
        from: parsed.from.text,
        subject: parsed.subject,
        date: parsed.date,
        text: parsed.text,
        html: parsed.html || parsed.textAsHtml
      };
    }));

    connection.end();
    res.json({ success: true, emails });
  } catch (err) {
    console.error('EMAIL READ ERROR:', err.message);
    res.status(500).json({ message: 'Failed to fetch emails: ' + err.message });
  }
});

module.exports = router;
