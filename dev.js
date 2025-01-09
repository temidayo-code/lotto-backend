const app = require("./api/send-email");
const visitorApp = require("./api/visitor");

app.listen(3000, () => {
  console.log("Email server running on port 3000");
});

visitorApp.listen(3001, () => {
  console.log("Visitor tracking server running on port 3001");
});
