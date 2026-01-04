const multer = require("multer");

// Storage Configuration
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Yahan se hum 'upload' variable ko bahar bhej rahe hain
module.exports = upload;