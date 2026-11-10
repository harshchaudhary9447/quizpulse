import { getQuizAnalytics } from '@/server/services/analytics.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { quizId } = params;
    const analytics = await getQuizAnalytics(quizId, user);
    return successResponse(analytics);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
