import { getMe } from '@/server/services/auth.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const profile = await getMe(user.id);
    return successResponse({ user: profile }, 200);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
