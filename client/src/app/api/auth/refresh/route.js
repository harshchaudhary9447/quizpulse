import { refresh } from '@/server/services/auth.service';
import { successResponse, errorResponse } from '@/server/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    const result = await refresh(refreshToken);
    return successResponse(result, 200);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 401, err.code || 'UNAUTHORIZED');
  }
}
