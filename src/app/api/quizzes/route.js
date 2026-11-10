import { listQuizzes, createQuiz } from '@/server/services/quiz.service';
import { getAuthenticatedUser, requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || undefined;
    const isPublished = searchParams.get('isPublished') || undefined;
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 20;

    const data = await listQuizzes(user, { search, isPublished, page, limit });
    return successResponse(data);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}

export async function POST(request) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const quiz = await createQuiz(body, user.id);
    return successResponse(quiz, 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
