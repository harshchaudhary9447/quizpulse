const prisma = require('../config/db');

async function getQuizAnalytics(quizId, user) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      quizQuestions: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  if (quiz.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only view analytics for your own quizzes');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const attempts = await prisma.attempt.findMany({
    where: {
      quizId,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] },
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      answers: true,
      proctorEvents: true,
    },
    orderBy: { submittedAt: 'desc' },
  });

  const totalAttempts = attempts.length;
  if (totalAttempts === 0) {
    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      passPercentage: quiz.passPercentage,
      totalAttempts: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
      averageScore: 0,
      averagePercentage: 0,
      averageDurationMinutes: 0,
      scoreDistribution: [
        { range: '0-20%', count: 0 },
        { range: '21-40%', count: 0 },
        { range: '41-60%', count: 0 },
        { range: '61-80%', count: 0 },
        { range: '81-100%', count: 0 },
      ],
      hardestQuestions: [],
      recentAttempts: [],
    };
  }

  const passedCount = attempts.filter((a) => a.isPassed).length;
  const failedCount = totalAttempts - passedCount;
  const passRate = Math.round((passedCount / totalAttempts) * 100);

  const totalScoreSum = attempts.reduce((acc, a) => acc + a.score, 0);
  const totalPercentageSum = attempts.reduce((acc, a) => acc + a.percentage, 0);
  const averageScore = Math.round((totalScoreSum / totalAttempts) * 10) / 10;
  const averagePercentage = Math.round((totalPercentageSum / totalAttempts) * 10) / 10;

  // Duration in minutes
  const totalDurationMinutes = attempts.reduce((acc, a) => {
    if (!a.submittedAt) return acc;
    const mins = (new Date(a.submittedAt).getTime() - new Date(a.startTime).getTime()) / (1000 * 60);
    return acc + Math.max(0, mins);
  }, 0);
  const averageDurationMinutes = Math.round((totalDurationMinutes / totalAttempts) * 10) / 10;

  // Score distribution for Recharts
  const distribution = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ];

  for (const a of attempts) {
    const p = a.percentage;
    if (p <= 20) distribution[0].count++;
    else if (p <= 40) distribution[1].count++;
    else if (p <= 60) distribution[2].count++;
    else if (p <= 80) distribution[3].count++;
    else distribution[4].count++;
  }

  // Hardest questions analysis
  const questionPerformance = {};
  for (const qq of quiz.quizQuestions) {
    questionPerformance[qq.question.id] = {
      id: qq.question.id,
      text: qq.question.text,
      type: qq.question.type,
      difficulty: qq.question.difficulty,
      totalAnswered: 0,
      correctCount: 0,
    };
  }

  for (const a of attempts) {
    for (const ans of a.answers) {
      if (questionPerformance[ans.questionId]) {
        questionPerformance[ans.questionId].totalAnswered++;
        if (ans.isCorrect) {
          questionPerformance[ans.questionId].correctCount++;
        }
      }
    }
  }

  const hardestQuestions = Object.values(questionPerformance)
    .map((q) => {
      const accuracy = q.totalAnswered > 0 ? Math.round((q.correctCount / q.totalAnswered) * 100) : 0;
      return {
        ...q,
        accuracy,
        incorrectCount: q.totalAnswered - q.correctCount,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5); // Top 5 hardest

  // Recent attempts list
  const recentAttempts = attempts.map((a) => ({
    id: a.id,
    studentName: a.student.name,
    studentEmail: a.student.email,
    score: a.score,
    totalPoints: a.totalPoints,
    percentage: a.percentage,
    isPassed: a.isPassed,
    status: a.status,
    submittedAt: a.submittedAt,
    proctorViolationsCount: a.proctorEvents.length,
  }));

  return {
    quizId: quiz.id,
    quizTitle: quiz.title,
    passPercentage: quiz.passPercentage,
    totalAttempts,
    passedCount,
    failedCount,
    passRate,
    averageScore,
    averagePercentage,
    averageDurationMinutes,
    scoreDistribution: distribution,
    hardestQuestions,
    recentAttempts,
  };
}

async function exportQuizCsv(quizId, user) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
  });

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  if (quiz.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: Access denied');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const attempts = await prisma.attempt.findMany({
    where: {
      quizId,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] },
    },
    include: {
      student: { select: { name: true, email: true } },
      proctorEvents: true,
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Generate CSV Header
  const headers = [
    'Student Name',
    'Student Email',
    'Score',
    'Total Points',
    'Percentage',
    'Pass / Fail',
    'Status',
    'Submitted At',
    'Proctor Violations Count',
  ];

  const rows = attempts.map((a) => [
    `"${a.student.name.replace(/"/g, '""')}"`,
    `"${a.student.email}"`,
    a.score,
    a.totalPoints,
    `${a.percentage}%`,
    a.isPassed ? 'PASSED' : 'FAILED',
    a.status,
    a.submittedAt ? `"${new Date(a.submittedAt).toISOString()}"` : 'N/A',
    a.proctorEvents.length,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

async function getPlatformAnalytics(user) {
  if (user.role !== 'ADMIN') {
    const error = new Error('Forbidden: Admin access required');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalQuizzes,
    publishedQuizzes,
    totalAttempts,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.quiz.count(),
    prisma.quiz.count({ where: { isPublished: true } }),
    prisma.attempt.count({ where: { status: { in: ['SUBMITTED', 'TIMED_OUT'] } } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      students: totalStudents,
      teachers: totalTeachers,
      admins: totalAdmins,
    },
    quizzes: {
      total: totalQuizzes,
      published: publishedQuizzes,
      drafts: totalQuizzes - publishedQuizzes,
    },
    attempts: {
      total: totalAttempts,
    },
    recentUsers,
  };
}

module.exports = {
  getQuizAnalytics,
  exportQuizCsv,
  getPlatformAnalytics,
};
