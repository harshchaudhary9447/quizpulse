const express = require('express');
const liveController = require('../controllers/live.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Public: verify PIN & retrieve live session info (Incognito students / players)
router.get('/session/:joinCode', liveController.getSessionByCode);

// Protected: Only authenticated TEACHER or ADMIN can create a live session
router.post('/create', authenticate, requireRole(['TEACHER', 'ADMIN']), liveController.createLiveSession);

module.exports = router;
