const express = require("express");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");
const axios = require("axios");
require("dotenv").config();

router.use(
  cors({
    origin: "https://lotto-orpin.vercel.app",
    methods: ["GET", "POST"],
  })
);

// New endpoint to fetch IP info
router.get("/get-ip-info", async (req, res) => {
  try {
    const response = await axios.get(
      `https://ipinfo.io/json?token=${process.env.IPINFO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching IP info:", error);
    res.status(500).json({ error: "Failed to fetch IP information" });
  }
});

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

// Improved email notification function with better error handling
async function sendEmailNotification(visitorInfo) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "New Website Visitor",
    text: `A visitor just accessed your website. Details:\n\n${visitorInfo}`,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email configuration is missing");
    }
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Propagate error for handling in route
  }
}

// Improved visitor logging handler
router.post("/", async (req, res) => {
  try {
    const {
      ipAddress,
      ipLocation,
      isp,
      platform,
      browser,
      screenWidth,
      screenHeight,
      javascriptEnabled,
      cookiesEnabled,
    } = req.body;

    // Validate required fields
    if (!ipAddress || !browser) {
      return res
        .status(400)
        .json({ error: "Missing required visitor information" });
    }

    const visitorInfo = `
    IP Address: ${ipAddress || "N/A"}\n
    Location: ${ipLocation || "N/A"}\n
    ISP: ${isp || "N/A"}\n
    Platform: ${platform || "N/A"}\n
    Browser: ${browser || "N/A"}\n
    Screen Size: ${screenWidth || 0}x${screenHeight || 0}\n
    JavaScript Enabled: ${javascriptEnabled}\n
    Cookies Enabled: ${cookiesEnabled}\n
    Time: ${new Date().toLocaleString()}
  `;

    // Log visitor info
    console.log("Visitor info:", visitorInfo);

    // Send email notification asynchronously
    setImmediate(async () => {
      try {
        await sendEmailNotification(visitorInfo);
        console.log("Email sent successfully!");
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }
    });

    res.status(200).json({ message: "Visitor logged successfully" });
  } catch (error) {
    console.error("Error processing visitor:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
