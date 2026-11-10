import { getFullSessionState } from '@/server/services/live.service';
import { successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  try {
    const { joinCode } = params;
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId') || null;

    const state = await getFullSessionState(joinCode, playerId);
    if (!state) {
      return errorResponse('Session not found', 404, 'NOT_FOUND');
    }

    return successResponse(state);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
