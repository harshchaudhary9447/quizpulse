import { exportQuizCsv } from '@/server/services/analytics.service';
import { requireAuth, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if (authError) return authError;

  try {
    const { quizId } = params;
    const csvData = await exportQuizCsv(quizId, user);
    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quiz-${quizId}-results.csv"`,
      },
    });
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
