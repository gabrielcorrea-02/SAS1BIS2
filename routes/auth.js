const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', (req, res) => res.render('login'));
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/dashboard', (req, res) => res.render('dashboard', { user: req.session.user }));

module.exports = router;
