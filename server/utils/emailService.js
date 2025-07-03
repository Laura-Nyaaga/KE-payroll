const nodemailer = require('nodemailer');
const { Company, User} = require('../models');

exports.sendResetEmail = async (account, resetUrl) => {


  const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"Payroll System" <${process.env.EMAIL_USER}>`,
    to: account.email,
    subject: 'Reset Your Password',
    html: `<p>You requested a password reset.</p>
           <p><a href="${resetUrl}">Click here to reset your password</a></p>
           <p>If you didn't request this, please ignore this email.</p>`,
  };

  await transporter.sendMail(message);
};
