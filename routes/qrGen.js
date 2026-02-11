const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrGenController');

router.get('/', qrController.renderQRPage);

router.get('/create', qrController.generateQR);
router.get('/createcp/', qrController.generateCpQR);

module.exports = router;
