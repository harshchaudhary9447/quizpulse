import { getStudentHistory } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const history = await getStudentHistory(user.id);
    return successResponse(history);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
