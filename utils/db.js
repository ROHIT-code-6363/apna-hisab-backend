const mongoose = require("mongoose");

const URI = process.env.MONGODB_URI;
// mongoose.connect(URI)

const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = connectDB;