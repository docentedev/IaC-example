const express = require("express");
const usersController = require("./controller/usersController");

const app = express();
const port = process.env.PORT || 4021;

app.use(express.json());

app.get("/api/users", usersController.getUsers);
app.get("/api/users/:id", usersController.getUserById);
app.post("/api/users", usersController.postUser);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "user-service" });
});

app.listen(port, () => {
  console.log(`Users service running on port ${port}`);
});
