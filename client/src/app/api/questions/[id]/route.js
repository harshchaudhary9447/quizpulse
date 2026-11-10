import { getQuestionById, updateQuestion, deleteQuestion } from '@/server/services/question.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { id } = params;
    const question = await getQuestionById(id);
    return successResponse(question);
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
    const updated = await updateQuestion(id, body, user);
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
    const result = await deleteQuestion(id, user);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
