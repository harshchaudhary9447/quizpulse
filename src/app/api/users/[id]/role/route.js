import prisma from '@/lib/prisma';
import { requireAuth, successResponse, errorResponse } from '@/server/auth';

export async function PATCH(request, { params }) {
  const { user, errorResponse: authError } = await requireAuth(request, ['ADMIN']);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      return errorResponse('Invalid role specified', 400, 'INVALID_ROLE');
    }

    if (id === user.id && role !== 'ADMIN') {
      return errorResponse('You cannot demote yourself from admin', 400, 'CANNOT_DEMOTE_SELF');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return successResponse(updated);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 400, err.code || 'BAD_REQUEST');
  }
}
