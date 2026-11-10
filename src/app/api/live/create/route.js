import { createLiveSession } from '@/server/services/live.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function POST(request) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { quizId } = body;
    if (!quizId) {
      return errorResponse('Quiz ID is required', 400, 'VALIDATION_ERROR');
    }

    const session = await createLiveSession(quizId, user.id);
    return successResponse(session, 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
