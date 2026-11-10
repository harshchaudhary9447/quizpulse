import { getAttemptById } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { attemptId } = params;
    const attempt = await getAttemptById(attemptId, user);
    return successResponse(attempt);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 404, err.code || 'NOT_FOUND');
  }
}
