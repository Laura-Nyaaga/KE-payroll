const nodemailer = require("nodemailer");
const { Company } = require("../models");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 15000,
  socketTimeout: 20000,
});

exports.sendWelcomeEmail = async ({ user }) => {
  const company = await Company.findByPk(user.companyId);

  const logoUrl = company?.companyLogo || "";
  const loginUrl = process.env.LOGIN_URL;

  const message = {
    from: `"Payroll System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Welcome to the Payroll System",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 80px; margin-bottom: 20px;" />`
            : ""
        }
        
        <h2>Welcome, ${user.firstName} ${user.lastName}!</h2>
        <p>Your account has been successfully created under <strong>${
          company?.name || "your company"
        }</strong>.</p>
        
        <p><strong>Login Email:</strong> ${user.email}</p>

        <p>You can access the system at: 
        <a href="${loginUrl}">payroll dashboard.</a>
        </p>

        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #777;">This email was sent by ${
          company?.name
        }.</p>
      </div>
    `,
  };
  await transporter.sendMail(message);
};
