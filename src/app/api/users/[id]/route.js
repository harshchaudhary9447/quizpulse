import prisma from '@/lib/prisma';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function DELETE(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['ADMIN']);
  if (authError) return authError;

  try {
    const { id } = params;
    if (id === user.id) {
      return errorResponse('You cannot delete your own admin account', 400, 'CANNOT_DELETE_SELF');
    }

    await prisma.user.delete({ where: { id } });
    return successResponse({ message: 'User deleted successfully' });
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
