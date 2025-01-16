const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to send email notification
async function sendEmailNotification(visitorInfo) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "New Website Visitor",
    text: `A visitor just accessed your website. Details:\n\n${visitorInfo}`,
  };

  try {
    console.log("Sending email to:", mailOptions.to);
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Handler for visitor logging
router.get("/", (req, res) => {
  const visitorInfo = `
    IP Address: ${req.ip}\nTime: ${new Date().toLocaleString()}
  `;

  // Immediately respond to the client
  res.status(200).send("Visitor logged and email sent!");

  // Log visitor info
  console.log("Visitor info:", visitorInfo);

  // Send email notification in a separate process
  setImmediate(async () => {
    try {
      console.log("Sending email for visitor info...");
      await sendEmailNotification(visitorInfo);
      console.log("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  });
});

module.exports = router;
