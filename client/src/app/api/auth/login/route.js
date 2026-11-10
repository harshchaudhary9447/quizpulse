import { login } from '@/server/services/auth.service';
import { successResponse, errorResponse } from '@/server/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const result = await login({ email, password });
    return successResponse(result, 200);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
