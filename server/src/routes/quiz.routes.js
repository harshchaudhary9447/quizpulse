const express = require('express');
const quizController = require('../controllers/quiz.controller');
const validate = require('../middleware/validate');
const { createQuizSchema, updateQuizSchema } = require('../validations/quiz.validation');
const { authenticate, optionalAuthenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Publicly browse published quizzes (students/guests see published, teachers see own)
router.get('/', optionalAuthenticate, quizController.listQuizzes);

// Get quiz metadata & questions (answers sanitized for students/guests)
router.get('/:id', optionalAuthenticate, quizController.getQuizById);

// Protected routes below (Teacher / Admin actions)
router.use(authenticate);

router.post('/', requireRole(['TEACHER', 'ADMIN']), validate(createQuizSchema), quizController.createQuiz);
router.put('/:id', requireRole(['TEACHER', 'ADMIN']), validate(updateQuizSchema), quizController.updateQuiz);
router.delete('/:id', requireRole(['TEACHER', 'ADMIN']), quizController.deleteQuiz);
router.patch('/:id/publish', requireRole(['TEACHER', 'ADMIN']), quizController.togglePublish);

module.exports = router;
