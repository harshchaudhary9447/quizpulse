import { generateQuestions } from '@/server/services/ai.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function POST(request) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { topic = 'General', difficulty = 'MEDIUM', count = 2 } = body;
    const generated = await generateQuestions({ topic, difficulty, count });
    return successResponse(generated);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
