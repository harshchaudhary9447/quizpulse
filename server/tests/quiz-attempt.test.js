import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

describe('Quiz & Attempt Flow (/api/v1/quizzes & /api/v1/attempts)', () => {
  let studentToken = '';
  let openQuiz = null;

  beforeAll(async () => {
    // Clean up test student attempts to ensure test idempotency across multiple runs
    const testUser = await prisma.user.findUnique({ where: { email: 'student4@quizpulse.com' } });
    if (testUser) {
      await prisma.answer.deleteMany({ where: { attempt: { studentId: testUser.id } } });
      await prisma.proctorEvent.deleteMany({ where: { attempt: { studentId: testUser.id } } });
      await prisma.attempt.deleteMany({ where: { studentId: testUser.id } });
    }

    // Log in as student
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student4@quizpulse.com',
        password: 'Student123!',
      });
    studentToken = loginRes.body.data.accessToken;

    // Get list of published quizzes and pick one without access code
    const quizListRes = await request(app)
      .get('/api/v1/quizzes')
      .set('Authorization', `Bearer ${studentToken}`);
    
    openQuiz = quizListRes.body.data.quizzes.find((q) => !q.requiresAccessCode) || quizListRes.body.data.quizzes[0];
  });

  it('should NOT leak isCorrect or explanation in quiz details for students', async () => {
    const res = await request(app)
      .get(`/api/v1/quizzes/${openQuiz.id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const questions = res.body.data.questions;
    expect(questions.length).toBeGreaterThan(0);

    for (const q of questions) {
      expect(q.explanation).toBeNull();
      for (const opt of q.options) {
        expect(opt.isCorrect).toBeUndefined();
      }
    }
  });

  it('should start a quiz attempt and return sanitized questions', async () => {
    const res = await request(app)
      .post(`/api/v1/attempts/start/${openQuiz.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attemptId).toBeDefined();
    expect(res.body.data.questions.length).toBeGreaterThan(0);

    const firstQuestion = res.body.data.questions[0];
    expect(firstQuestion.options[0].isCorrect).toBeUndefined();
  });

  it('should log a proctor event (tab-switch)', async () => {
    const startRes = await request(app)
      .post(`/api/v1/attempts/start/${openQuiz.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    const attemptId = startRes.body.data.attemptId;

    const proctorRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/proctor-event`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        type: 'TAB_SWITCH',
        metadata: { timestamp: new Date().toISOString() },
      });

    expect(proctorRes.status).toBe(201);
    expect(proctorRes.body.success).toBe(true);
  });

  it('should submit attempt and perform strict server-side grading', async () => {
    const startRes = await request(app)
      .post(`/api/v1/attempts/start/${openQuiz.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    const attemptId = startRes.body.data.attemptId;

    const submitRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [],
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.score).toBeDefined();
    expect(submitRes.body.data.percentage).toBeDefined();
    expect(submitRes.body.data.isPassed).toBeDefined();
    expect(submitRes.body.data.review.length).toBeGreaterThan(0);
    // Review now contains explanations and isCorrect values
    expect(submitRes.body.data.review[0].explanation).toBeDefined();
  });
});
