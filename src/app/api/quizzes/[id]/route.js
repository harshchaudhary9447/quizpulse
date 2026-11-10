import { getQuizById, updateQuiz, deleteQuiz } from '@/server/services/quiz.service';
import { getAuthenticatedUser, requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    const quiz = await getQuizById(id, user);
    return successResponse(quiz);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}

export async function PUT(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json();
    const updated = await updateQuiz(id, body, user);
    return successResponse(updated);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}

export async function DELETE(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { id } = params;
    const result = await deleteQuiz(id, user);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
