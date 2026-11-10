const { z } = require('zod');

const startAttemptSchema = z.object({
  accessCode: z.string().optional().nullable(),
});

const saveDraftSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOptionIds: z.array(z.string()).optional().default([]),
      textAnswer: z.string().optional().nullable(),
    })
  ),
});

const submitAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOptionIds: z.array(z.string()).optional().default([]),
      textAnswer: z.string().optional().nullable(),
    })
  ).optional(),
});

const proctorEventSchema = z.object({
  type: z.enum(['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'RESUME']),
  metadata: z.record(z.any()).optional(),
});

module.exports = {
  startAttemptSchema,
  saveDraftSchema,
  submitAttemptSchema,
  proctorEventSchema,
};
