const express = require('express');
const authRoutes = require('./auth.routes');
const questionRoutes = require('./question.routes');
const quizRoutes = require('./quiz.routes');
const attemptRoutes = require('./attempt.routes');
const analyticsRoutes = require('./analytics.routes');
const userRoutes = require('./user.routes');
const liveRoutes = require('./live.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/attempts', attemptRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/live', liveRoutes);

module.exports = router;
