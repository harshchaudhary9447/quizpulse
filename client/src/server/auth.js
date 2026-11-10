import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'quizpulse_super_secret_access_key_2026_jwt';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'quizpulse_super_secret_refresh_key_2026_jwt';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export function generateTokens(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });

  return { accessToken, refreshToken };
}

export async function getAuthenticatedUser(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    return user;
  } catch (err) {
    return null;
  }
}

export async function requireAuth(request, allowedRoles = []) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      user: null,
      errorResponse: errorResponse('Unauthorized: Please log in', 401, 'UNAUTHORIZED'),
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: errorResponse('Forbidden: Insufficient permissions', 403, 'FORBIDDEN'),
    };
  }

  return { user, errorResponse: null };
}

export function errorResponse(message, status = 400, code = 'BAD_REQUEST', details = null) {
  return Response.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  );
}

export function successResponse(data, status = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status }
  );
}
