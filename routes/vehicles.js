const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehiclesController');
const authorize = require('../config/authorize'); 

router.get('/', authorize(['admin']), controller.list);
router.get('/member/:memberId', authorize(['admin']), controller.listByMember);
router.post('/add', authorize(['admin']), controller.add);
router.post('/delete/:id', authorize(['admin']), controller.delete);
router.get('/guest/:guestId', authorize(['admin']), controller.listByGuest);
router.post('/add_guest', authorize(['admin']), controller.add_guest);
router.post('/delete_guest/:id', authorize(['admin']), controller.delete_guest);


module.exports = router;
