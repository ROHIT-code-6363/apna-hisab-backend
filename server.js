require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const router = require("./router/auth-router");
const connectDB = require("./utils/db");

app.use(cors());
app.use(express.json());
app.use("/api", router);

const Port = process.env.PORT || 5000;

connectDB().then(() => {
app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
  });
});