const { z } = require('zod');

const quizQuestionInputSchema = z.object({
  questionId: z.string().uuid().or(z.string().min(1)),
  order: z.number().int().nonnegative().optional(),
  points: z.number().positive().default(1.0),
});

const createQuizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().nullable(),
  timeLimitMinutes: z.number().int().min(0, 'Time limit cannot be negative').default(15),
  passPercentage: z.number().min(0).max(100).default(60.0),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  scheduledStartTime: z.string().datetime().optional().nullable(),
  scheduledEndTime: z.string().datetime().optional().nullable(),
  accessCode: z.string().trim().optional().nullable(),
  maxAttempts: z.number().int().min(1).default(1),
  questions: z.array(quizQuestionInputSchema).min(1, 'A quiz must contain at least one question'),
});

const updateQuizSchema = createQuizSchema.partial();

const verifyAccessCodeSchema = z.object({
  accessCode: z.string().min(1, 'Access code is required'),
});

module.exports = {
  createQuizSchema,
  updateQuizSchema,
  verifyAccessCodeSchema,
};
