const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, requireRole(['ADMIN']));

router.get('/', userController.listUsers);
router.patch('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
