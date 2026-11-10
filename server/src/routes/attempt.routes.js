const express = require('express');
const attemptController = require('../controllers/attempt.controller');
const validate = require('../middleware/validate');
const {
  startAttemptSchema,
  saveDraftSchema,
  submitAttemptSchema,
  proctorEventSchema,
} = require('../validations/attempt.validation');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Student History
router.get('/history', attemptController.getStudentHistory);

// Start attempt on a quiz
router.post('/start/:quizId', validate(startAttemptSchema), attemptController.startAttempt);

// Resume / Get attempt details
router.get('/:id', attemptController.getAttemptById);

// Auto-save draft answers
router.patch('/:id/save-draft', validate(saveDraftSchema), attemptController.saveDraft);

// Submit attempt for server-side grading
router.post('/:id/submit', validate(submitAttemptSchema), attemptController.submitAttempt);

// Log proctor anti-cheating event (tab-switch, blur)
router.post('/:id/proctor-event', validate(proctorEventSchema), attemptController.logProctorEvent);

// Get post-grading review & explanation
router.get('/:id/review', attemptController.getAttemptReview);

module.exports = router;
