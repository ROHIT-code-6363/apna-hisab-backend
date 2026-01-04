const mongoose = require("mongoose");

const connectDB = async () => {
  try {
        const connString =  process.env.MONGODB_URI;

        await mongoose.connect(connString);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;