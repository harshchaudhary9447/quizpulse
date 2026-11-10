import { logProctorEvent } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function POST(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { attemptId } = params;
    const body = await request.json();
    const event = await logProctorEvent(attemptId, user, {
      type: body?.type || 'UNKNOWN',
      metadata: body?.metadata || null,
    });
    return successResponse(event, 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
