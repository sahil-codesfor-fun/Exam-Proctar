import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

/**
 * Enhanced sendEmail function for diagnostics
 */
export const sendEmail = async () => {
  try {
    console.log("🔍 Verifying SMTP Connection...");
    await transporter.verify();
    console.log("✅ SMTP READY");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "himangshukumardas75695@gmail.com", // Self-test
      subject: "SMTP TEST",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4B775E;">SMTP WORKING SUCCESSFULLY</h2>
          <p>Your Gmail SMTP setup is working correctly for Nexus Proctor.</p>
          <hr />
          <p style="font-size: 0.8em; color: #666;">Sent from your local development server.</p>
        </div>
      `,
    });

    console.log("✅ MAIL SENT:", info);
    return info;
  } catch (err) {
    console.error("❌ MAIL ERROR:", err);
    throw err;
  }
};

/**
 * Dynamic Test Email function (Restored for Admin Controller)
 */
export const sendTestEmail = async (to) => {
  try {
    await transporter.verify();
    console.log(`🧪 Sending dynamic test to: ${to}...`);
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "NEXUS: SMTP Diagnostic Test",
      text: "Your SMTP configuration is working perfectly! 🚀",
      html: "<b>Your SMTP configuration is working perfectly! 🚀</b>"
    });
  } catch (err) {
    console.error("❌ DYNAMIC TEST ERROR:", err);
    throw err;
  }
};

/**
 * Standard faculty credential dispatch
 */
export const sendFacultyCredentials = async (faculty) => {
  const user = (process.env.EMAIL_USER || "").trim();
  
  try {
    await transporter.verify();
    
    const mailOptions = {
      from: user,
      to: faculty.email,
      subject: "Faculty Portal Credentials",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eef2f3; border-radius: 20px;">
          <h2 style="color: #4B775E;">Faculty Portal Access</h2>
          <p>Your faculty account has been created.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px dashed #cbd5e1;">
            <p><b>Faculty ID:</b> ${faculty.facultyId}</p>
            <p><b>Password:</b> ${faculty.tempPassword}</p>
          </div>
          
          <p>
            <b>Portal URL:</b><br/>
            <a href="http://localhost:5173/faculty/login" style="color: #4B775E; font-weight: bold;">http://localhost:5173/faculty/login</a>
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #ef4444; font-weight: bold;">
            🛡️ Security Notice: Please change your password immediately after logging in.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ MAIL SENT");
    return info;
  } catch (err) {
    console.error("❌ SMTP ERROR:", err);
    throw err;
  }
};
