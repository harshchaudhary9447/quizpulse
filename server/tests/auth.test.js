import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Authentication API (/api/v1/auth)', () => {
  it('should authenticate a seeded student user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@quizpulse.com',
        password: 'Student123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@quizpulse.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should register a new student user', async () => {
    const uniqueEmail = `newuser_${Date.now()}@quizpulse.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Password123!',
        name: 'Test Candidate',
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
