const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import your routes
const emailRouter = require("./send-email");
const visitorRouter = require("./visitor");

// Use the routes
app.use("/send-email", emailRouter);
app.use("/visitor", visitorRouter);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something broke!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// For Vercel, export the app
module.exports = app;

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

app.listen(3000, () => {
  console.log("Email server running on port 3000");
});

visitorApp.listen(3001, () => {
  console.log("Visitor tracking server running on port 3001");
});
