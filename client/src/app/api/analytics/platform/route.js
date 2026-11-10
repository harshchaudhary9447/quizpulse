import { getPlatformAnalytics } from '@/server/services/analytics.service';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function GET(request) {
  const { user, errorResponse: authError } = await requireAuth(request, ['ADMIN']);
  if (authError) return authError;

  try {
    const stats = await getPlatformAnalytics(user);
    return successResponse(stats);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500, err.code || 'SERVER_ERROR');
  }
}
