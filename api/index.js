const express = require("express");
const app = express();

// Import your routes
const emailRouter = require("./send-email");
const visitorRouter = require("./visitor");

// Use the routes
app.use("/api/send-email", emailRouter);
app.use("/api/visitor", visitorRouter);

// For Vercel, export the app
module.exports = app;

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
