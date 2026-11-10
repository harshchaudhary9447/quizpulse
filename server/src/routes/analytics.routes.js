const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Platform stats for Admin
router.get('/platform', requireRole(['ADMIN']), analyticsController.getPlatformAnalytics);

// Quiz stats and CSV export for Teacher & Admin
router.get('/quiz/:quizId', requireRole(['TEACHER', 'ADMIN']), analyticsController.getQuizAnalytics);
router.get('/quiz/:quizId/export-csv', requireRole(['TEACHER', 'ADMIN']), analyticsController.exportQuizCsv);

module.exports = router;
