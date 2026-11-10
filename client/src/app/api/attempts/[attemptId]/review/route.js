import { getAttemptReview } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { attemptId } = params;
    const review = await getAttemptReview(attemptId, user);
    return successResponse(review);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 404, err.code || 'NOT_FOUND');
  }
}
