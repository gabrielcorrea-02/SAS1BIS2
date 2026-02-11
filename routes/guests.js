const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestsController');
const authorize = require('../config/authorize'); 

// Listar visitantes
router.get('/', controller.list);

// Detalhes do visitante via query string ?id=UUID
router.get('/lookup', controller.info);

// Adicionar visitante
router.post('/add', authorize(['admin', 'gda', 'rp']), controller.add);

// Ler Crachá
router.get('/infocracha/:num', controller.infoCracha);

module.exports = router;
