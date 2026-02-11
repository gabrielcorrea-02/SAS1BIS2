const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestsController');
const authorize = require('../config/authorize'); 

// Listar visitantes
router.get('/', controller.list);

// Adicionar visitante
router.post('/add', authorize(['admin', 'em']), controller.add);


module.exports = router;
