const express = require('express');
const questionController = require('../controllers/question.controller');
const validate = require('../middleware/validate');
const { createQuestionSchema, updateQuestionSchema, aiGenerateSchema } = require('../validations/question.validation');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// All question management routes require TEACHER or ADMIN
router.use(authenticate, requireRole(['TEACHER', 'ADMIN']));

router.get('/categories', questionController.getCategories);
router.post('/ai-generate', validate(aiGenerateSchema), questionController.aiGenerate);

router.get('/', questionController.listQuestions);
router.post('/', validate(createQuestionSchema), questionController.createQuestion);
router.get('/:id', questionController.getQuestionById);
router.put('/:id', validate(updateQuestionSchema), questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
