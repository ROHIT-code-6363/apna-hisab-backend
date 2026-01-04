require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const authRouter = require("./router/auth-router");
const khataRouter = require("./router/khata-router");
const connectDB = require("./utils/db");

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/api", authRouter);
app.use("/api/auth", khataRouter);

// Apna Render wala URL yahan likhein
const serverUrl = "https://apna-hisab.onrender.com/api/auth/add-product"; 

// setInterval use karein taaki ye har 14 minute mein repeat ho
setInterval(() => {
    https.get(serverUrl, (res) => {
        console.log("Ping successful to keep server awake!");
    });
}, 10 * 60 * 1000); // 10 Minutes

const Port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
  });
});
