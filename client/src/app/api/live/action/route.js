import { dispatchLiveAction } from '@/server/services/live.service';
import { getAuthenticatedUser, successResponse, errorResponse } from '@/server/auth';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const { joinCode, action, payload } = body;

    if (!joinCode || !action) {
      return errorResponse('joinCode and action are required', 400, 'VALIDATION_ERROR');
    }

    const state = await dispatchLiveAction(joinCode, {
      action,
      payload,
      userId: user?.id || null,
    });

    return successResponse(state);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
