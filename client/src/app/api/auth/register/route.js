import { register } from '@/server/services/auth.service';
import { successResponse, errorResponse } from '@/server/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return errorResponse('Email, password, and name are required', 400, 'VALIDATION_ERROR');
    }

    const result = await register({ email, password, name, role });
    return successResponse(result, 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
