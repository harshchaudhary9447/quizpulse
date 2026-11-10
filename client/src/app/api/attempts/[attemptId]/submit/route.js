import { submitAttempt } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function POST(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { attemptId } = params;
    let answers = null;
    try {
      const body = await request.json();
      answers = body?.answers || null;
    } catch (e) {}

    const result = await submitAttempt(attemptId, user, answers);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
