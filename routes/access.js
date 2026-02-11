const express = require('express');
const router = express.Router();
const authorize = require('../config/authorize')
const accessController = require('../controllers/accessController');

// Registrar entrada
router.post('/entry', authorize(['admin', 'gda', 'rp', 'em']), accessController.registerEntry);


// Registrar saída
router.post('/exit', authorize(['admin', 'gda', 'rp', 'em']), accessController.registerExit);

// Registrar automaticamente (entrada ou saída)
router.post(
  '/auto',
  authorize(['admin', 'gda', 'rp', 'em']),
  accessController.registerAccess
);

module.exports = router;
