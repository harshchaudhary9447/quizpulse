import { saveDraft } from '@/server/services/attempt.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function PATCH(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { attemptId } = params;
    const body = await request.json();
    const result = await saveDraft(attemptId, user, body?.answers || []);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}

export async function POST(request, { params }) {
  return PATCH(request, { params });
}
