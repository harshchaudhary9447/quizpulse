const { z } = require('zod');

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text cannot be empty'),
  isCorrect: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
});

const baseQuestionSchema = z.object({
  text: z.string().min(3, 'Question text must be at least 3 characters'),
  explanation: z.string().optional().nullable(),
  type: z.enum(['SINGLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER']).default('SINGLE_CHOICE'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  category: z.string().min(1, 'Category is required').default('General'),
  tags: z.array(z.string()).optional().default([]),
  options: z.array(optionSchema).min(1, 'At least one option or answer is required'),
});

const createQuestionSchema = baseQuestionSchema.refine((data) => {
  if (data.type === 'SINGLE_CHOICE' || data.type === 'TRUE_FALSE') {
    const correctCount = data.options.filter((o) => o.isCorrect).length;
    return correctCount === 1;
  }
  if (data.type === 'MULTI_SELECT') {
    const correctCount = data.options.filter((o) => o.isCorrect).length;
    return correctCount >= 1;
  }
  return true;
}, {
  message: 'Single choice & True/False questions must have exactly one correct option; Multi-select must have at least one.',
  path: ['options'],
});

const updateQuestionSchema = baseQuestionSchema.partial();

const aiGenerateSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().default('MEDIUM'),
  count: z.number().int().min(1).max(10).optional().default(3),
  type: z.enum(['SINGLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER']).optional(),
});

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
  aiGenerateSchema,
};
