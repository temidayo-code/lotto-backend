const express = require("express");
const nodemailer = require("nodemailer");
const axios = require("axios"); // To get IP geolocation
const cors = require("cors");
require("dotenv").config();
const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 3000;
const app = express();
const router = express.Router();

// Middleware setup
router.use(
  cors({
    origin: "https://lotto-orpin.vercel.app", // Adjust based on your frontend URL
  })
);
router.use(express.static("public"));
router.use(express.json());

// Create rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all requests
router.use(limiter);

// Root route
router.get("/", async (req, res) => {
  // Track visitor data here
  try {
    const visitorInfo = await collectVisitorInfo(req);
    await sendEmailNotification(visitorInfo);
    res.sendFile(__dirname + "/public/index.html");
  } catch (error) {
    console.error("Error tracking visitor:", error);
    res.sendFile(__dirname + "/public/index.html");
  }
});

// Test route
router.get("/home", (req, res) => {
  res.status(200).json("Powerball Backend Server is Running on Vercel!!!");
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

// Test email configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email server error:", error);
  } else {
    console.log("Email server is ready");
  }
});

// Add simple caching
const geoCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Function to get visitor's IP geolocation
async function getIPLocation(ip) {
  // Check cache first
  if (geoCache.has(ip)) {
    const cached = geoCache.get(ip);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    // Store in cache
    geoCache.set(ip, {
      data: response.data,
      timestamp: Date.now(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching IP location:", error);
    return null;
  }
}

// Function to send email notification
async function sendEmailNotification(visitorInfo) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Notify yourself
    subject: "New Website Visitor",
    html: `
      <h2>New Website Visitor Details</h2>
      <p><strong>IP Address (IPv4):</strong> ${visitorInfo.ipv4}</p>
      <p><strong>IP Address (IPv6):</strong> ${visitorInfo.ipv6}</p>
      <p><strong>Location:</strong> ${visitorInfo.location.city}, ${visitorInfo.location.country} (${visitorInfo.location.region})</p>
      <p><strong>Host Name:</strong> ${visitorInfo.hostname}</p>
      <p><strong>ISP:</strong> ${visitorInfo.isp}</p>
      <p><strong>Platform:</strong> ${visitorInfo.platform}</p>
      <p><strong>Browser:</strong> ${visitorInfo.browser}</p>
      <p><strong>Screen Size:</strong> ${visitorInfo.screenSize}</p>
      <p><strong>JavaScript Enabled:</strong> ${visitorInfo.jsEnabled}</p>
      <p><strong>Cookies Enabled:</strong> ${visitorInfo.cookiesEnabled}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Helper function to collect visitor info
async function collectVisitorInfo(req) {
  const ipv4 = req.ip;
  const ipv6 = req.headers["x-forwarded-for"] || req.ip; // Get the correct IP if behind a proxy
  const userAgent = req.get("User-Agent");
  const platform = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac")
    ? "Mac"
    : "Other";
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([\d.]+)/);
  const browserName = browser ? browser[1] : "Unknown";

  // Get screen size, JavaScript enabled, and cookies from client (via query params)
  const screenSize = req.query.screenSize || "Unknown";
  const jsEnabled = req.query.jsEnabled || "Unknown";
  const cookiesEnabled = req.query.cookiesEnabled || "Unknown";

  // Fetch location based on IP address
  const location = await getIPLocation(ipv4);

  // Construct visitor info
  const visitorInfo = {
    ipv4,
    ipv6,
    location: location || {
      city: "Unknown",
      country: "Unknown",
      region: "Unknown",
    },
    hostname: req.headers.host || "Unknown",
    isp: location ? location.isp : "Unknown",
    platform,
    browser: browserName,
    screenSize,
    jsEnabled,
    cookiesEnabled,
  };

  return visitorInfo;
}

module.exports = router;
