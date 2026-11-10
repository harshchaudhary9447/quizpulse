import { startAttempt } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function POST(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { quizId } = params;
    let accessCode = null;
    try {
      const body = await request.json();
      accessCode = body?.accessCode || null;
    } catch (e) {}

    const attempt = await startAttempt(quizId, user, accessCode);
    return successResponse(attempt, 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
