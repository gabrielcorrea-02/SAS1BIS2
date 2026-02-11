const express = require('express');
const router = express.Router();
const cpController = require('../controllers/cpController');
const uploadPhoto = require('../middleware/uploadPhoto'); // multer
const authorize = require('../config/authorize');

// Página principal do Corpo Permanente
router.get('/', cpController.list);

// Lookup individual (detalhes do membro)
router.get('/lookup', cpController.info);

// Adicionar novo membro
router.post('/add', authorize(['em', 'admin']), uploadPhoto.single("foto"), cpController.add);

// Registrar entrada (via fetch/json)
router.post('/entry', authorize(['gda', 'admin']), cpController.entry);

// Registrar saída
router.post('/exit/:id', authorize(['gda', 'admin']), cpController.exit);

// Excluir membro
router.post('/delete/:id', authorize(['em', 'admin']), cpController.delete);

// Upload de foto (form-data: foto)
router.post('/photo/:id', authorize(['em', 'admin']), uploadPhoto.single('foto'), cpController.uploadPhoto);

// Exibir foto
router.get('/photo/:id', cpController.getPhoto);

// ATUALIZAR NO BANCO
router.post('/update/:id', authorize(['em', 'admin']), uploadPhoto.single("foto"), cpController.update);


module.exports = router;
