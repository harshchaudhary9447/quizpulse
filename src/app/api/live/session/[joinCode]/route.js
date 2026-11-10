import { getSessionByCode, joinLivePlayer } from '@/server/services/live.service';
import { successResponse, errorResponse } from '@/server/auth';

export async function GET(request, { params }) {
  try {
    const { joinCode } = params;
    const session = await getSessionByCode(joinCode);
    return successResponse(session);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 404, err.code || 'NOT_FOUND');
  }
}

export async function POST(request, { params }) {
  try {
    const { joinCode } = params;
    const body = await request.json();
    const { playerId, name } = body;

    if (!playerId || !name) {
      return errorResponse('Player ID and name are required', 400, 'VALIDATION_ERROR');
    }

    const player = await joinLivePlayer(joinCode, playerId, name);
    return successResponse(player);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
