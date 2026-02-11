const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authorize = require('../config/authorize'); 
const controller = require('../controllers/adminController');
const reportController = require('../controllers/reportController');


// ===== Usuários =====
router.get('/users', authorize(['admin']), controller.listUsers);

router.post('/users/add', authorize(['admin']), controller.addUser);

router.get('/users/delete/:id', authorize(['admin']), controller.deleteUser);

// ===== Relatórios =====
router.get('/reports', authorize(['admin']), reportController.generateReports);

router.post('/reports', authorize(['admin']), reportController.exportReport);

module.exports = router;