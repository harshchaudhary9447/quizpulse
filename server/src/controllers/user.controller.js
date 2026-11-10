const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

async function listUsers(req, res, next) {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              quizzes: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, {
      users,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return sendError(res, 'Invalid role specified', 400, 'INVALID_ROLE');
    }

    if (id === req.user.id) {
      return sendError(res, 'Cannot change your own administrative role', 400, 'CANNOT_MODIFY_SELF');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return sendError(res, 'Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    await prisma.user.delete({ where: { id } });
    return sendSuccess(res, { message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  deleteUser,
};
