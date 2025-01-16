const express = require("express");
const router = express.Router();
const cors = require("cors");
const axios = require("axios");
const sendEmailNotification = require("../email/mailer");
require("dotenv").config();

router.use(
  cors({
    origin: "https://lotto-orpin.vercel.app", // Replace with your frontend URL
    methods: ["GET", "POST"],
  })
);

// New endpoint to fetch IP info
router.get("/get-ip-info", async (req, res) => {
  try {
    const response = await axios.get(
      `https://ipinfo.io/json?token=${process.env.IPINFO_TOKEN}`
    );
    if (response.data) {
      res.json(response.data);
    } else {
      res.status(500).json({ error: "IP info data is not available" });
    }
  } catch (error) {
    console.error("Error fetching IP info:", error);
    res.status(500).json({ error: "Failed to fetch IP information" });
  }
});

// Visitor logging handler with improved email sending
router.post("/", async (req, res) => {
  try {
    // Add debug logging
    console.log("Received request body:", req.body);

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

    // Add more detailed validation logging
    if (!ipAddress) console.log("Missing ipAddress");
    if (!browser) console.log("Missing browser");

    // Validate required fields
    if (!ipAddress || !browser) {
      return res
        .status(400)
        .json({ error: "Missing required visitor information" });
    }

    const visitorInfo = `
      IP Address: ${ipAddress || "N/A"}
      Location: ${ipLocation || "N/A"}
      ISP: ${isp || "N/A"}
      Platform: ${platform || "N/A"}
      Browser: ${browser || "N/A"}
      Screen Size: ${screenWidth || 0}x${screenHeight || 0}
      JavaScript Enabled: ${javascriptEnabled}
      Cookies Enabled: ${cookiesEnabled}
      Time: ${new Date().toLocaleString()}
    `;

    // Log visitor info
    console.log("Visitor info:", visitorInfo);

    // Send email notification
    await sendEmailNotification(visitorInfo); // Wait for email to be sent

    res.status(200).json({ message: "Visitor logged successfully" });
  } catch (error) {
    console.error("Error processing visitor:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
