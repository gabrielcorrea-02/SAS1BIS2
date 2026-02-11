const multer = require("multer");

const storage = multer.memoryStorage(); // salva temporariamente em memória

module.exports = multer({ storage });
