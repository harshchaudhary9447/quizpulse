import { togglePublish } from '@/server/services/quiz.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function PATCH(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { id } = params;
    const updated = await togglePublish(id, user);
    return successResponse(updated);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
