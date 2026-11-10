import { listQuestions, createQuestion } from '@/server/services/question.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 50;

    const data = await listQuestions({ search, category, type, difficulty, page, limit });
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
    const created = await createQuestion(body, user.id);
    return successResponse(created, 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
