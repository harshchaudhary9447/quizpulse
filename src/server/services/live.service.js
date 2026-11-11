import prisma from '../../lib/prisma';

function generateJoinCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createLiveSession(quizId, hostId) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      quizQuestions: {
        orderBy: { order: 'asc' },
        include: {
          question: {
            include: {
              options: { orderBy: { order: 'asc' } },
            },
          },
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

  if (quiz.quizQuestions.length === 0) {
    const error = new Error('Quiz has no questions');
    error.statusCode = 400;
    error.code = 'EMPTY_QUIZ';
    throw error;
  }

  let joinCode = generateJoinCode();
  let exists = await prisma.liveSession.findUnique({ where: { joinCode } });
  while (exists) {
    joinCode = generateJoinCode();
    exists = await prisma.liveSession.findUnique({ where: { joinCode } });
  }

  const initialGameState = {
    questionsCount: quiz.quizQuestions.length,
    activeQuestionIndex: -1,
    revealedData: null,
    answersCount: 0,
    version: 1,
  };

  const session = await prisma.liveSession.create({
    data: {
      quizId: quiz.id,
      hostId,
      joinCode,
      status: 'WAITING',
      currentQuestionIndex: -1,
      gameState: JSON.stringify(initialGameState),
    },
    include: {
      quiz: {
        select: { id: true, title: true, description: true },
      },
    },
  });

  return session;
}

export async function getSessionByCode(joinCode) {
  const session = await prisma.liveSession.findUnique({
    where: { joinCode },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          quizQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: {
                    orderBy: { order: 'asc' },
                    select: { id: true, text: true, order: true },
                  },
                },
              },
            },
          },
        },
      },
      host: {
        select: { id: true, name: true },
      },
      players: {
        orderBy: { score: 'desc' },
      },
    },
  });

  if (!session) {
    const error = new Error('Live session not found. Please verify the 6-digit PIN.');
    error.statusCode = 404;
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  return session;
}

export async function joinLivePlayer(joinCode, playerId, name) {
  const session = await prisma.liveSession.findUnique({
    where: { joinCode },
  });

  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  if (session.status === 'FINISHED') {
    const error = new Error('This live game has already ended');
    error.statusCode = 400;
    error.code = 'SESSION_FINISHED';
    throw error;
  }

  const player = await prisma.livePlayer.upsert({
    where: {
      sessionId_playerId: {
        sessionId: session.id,
        playerId,
      },
    },
    create: {
      sessionId: session.id,
      playerId,
      name,
      score: 0,
      answers: '{}',
    },
    update: {
      name,
      lastActiveAt: new Date(),
    },
  });

  // Increment session version so all SSE subscribers (host & players) get immediate notification
  let currentMeta = {};
  try {
    currentMeta = JSON.parse(session.gameState || '{}');
  } catch (e) {
    currentMeta = {};
  }
  currentMeta.version = (currentMeta.version || 0) + 1;

  await prisma.liveSession.update({
    where: { id: session.id },
    data: {
      gameState: JSON.stringify(currentMeta),
    },
  });

  return player;
}

export async function dispatchLiveAction(joinCode, { action, payload = {}, userId = null }) {
  const session = await prisma.liveSession.findUnique({
    where: { joinCode },
    include: {
      quiz: {
        include: {
          quizQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: { orderBy: { order: 'asc' } },
                },
              },
            },
          },
        },
      },
      players: true,
    },
  });

  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  const rawQuestions = session.quiz.quizQuestions.map((qq) => qq.question);
  let currentMeta = {};
  try {
    currentMeta = JSON.parse(session.gameState || '{}');
  } catch (e) {
    currentMeta = {};
  }

  let nextStatus = session.status;
  let nextIndex = session.currentQuestionIndex;

  switch (action) {
    case 'START_GAME': {
      nextStatus = 'COUNTDOWN';
      currentMeta.countdown = 3;
      break;
    }

    case 'NEXT_QUESTION': {
      nextIndex += 1;
      if (nextIndex >= rawQuestions.length) {
        nextStatus = 'FINISHED';
        await prisma.liveSession.update({
          where: { joinCode },
          data: {
            status: 'FINISHED',
            endedAt: new Date(),
          },
        });
        return getFullSessionState(joinCode);
      } else {
        nextStatus = 'QUESTION_ACTIVE';
        currentMeta.revealedData = null;
        currentMeta.answersCount = 0;
        currentMeta.questionStartTime = Date.now();
      }
      break;
    }

    case 'SUBMIT_ANSWER': {
      const { playerId, selectedOptionIds, timeElapsedSeconds = 5 } = payload;
      if (session.status !== 'QUESTION_ACTIVE' && nextStatus !== 'QUESTION_ACTIVE') {
        break;
      }
      const rawQuestion = rawQuestions[session.currentQuestionIndex];
      if (!rawQuestion) break;

      const correctOptionIds = rawQuestion.options.filter((o) => o.isCorrect).map((o) => o.id);
      let isCorrect = false;

      if (rawQuestion.type === 'SINGLE_CHOICE' || rawQuestion.type === 'TRUE_FALSE') {
        isCorrect = selectedOptionIds?.length === 1 && correctOptionIds.includes(selectedOptionIds[0]);
      } else if (rawQuestion.type === 'MULTI_SELECT') {
        const selSet = new Set(selectedOptionIds || []);
        const corSet = new Set(correctOptionIds);
        isCorrect = selSet.size === corSet.size && [...corSet].every((id) => selSet.has(id));
      } else if (rawQuestion.type === 'SHORT_ANSWER') {
        const submittedText = (selectedOptionIds?.[0] || '').toString().trim().toLowerCase();
        const validAnswers = rawQuestion.options.map((o) => o.text.trim().toLowerCase());
        isCorrect = validAnswers.includes(submittedText);
      }

      let pointsEarned = 0;
      if (isCorrect) {
        const timeFactor = Math.max(0, (20 - (timeElapsedSeconds || 0)) / 20);
        pointsEarned = Math.round(1000 + timeFactor * 500);
      }

      const player = session.players.find((p) => p.playerId === playerId);
      if (player) {
        let playerAnswers = {};
        try {
          playerAnswers = JSON.parse(player.answers || '{}');
        } catch (e) {
          playerAnswers = {};
        }

        playerAnswers[rawQuestion.id] = {
          selectedOptionIds,
          isCorrect,
          pointsEarned,
        };

        await prisma.livePlayer.update({
          where: { id: player.id },
          data: {
            score: (player.score || 0) + pointsEarned,
            answers: JSON.stringify(playerAnswers),
            lastActiveAt: new Date(),
          },
        });
      }

      currentMeta.answersCount = (currentMeta.answersCount || 0) + 1;
      break;
    }

    case 'REVEAL_ANSWER': {
      nextStatus = 'REVEAL';
      const rawQuestion = rawQuestions[session.currentQuestionIndex];
      if (rawQuestion) {
        const correctOptionIds = rawQuestion.options.filter((o) => o.isCorrect).map((o) => o.id);
        const distribution = {};
        for (const opt of rawQuestion.options) {
          distribution[opt.id] = 0;
        }

        const freshPlayers = await prisma.livePlayer.findMany({ where: { sessionId: session.id } });
        for (const p of freshPlayers) {
          try {
            const pa = JSON.parse(p.answers || '{}');
            const qAns = pa[rawQuestion.id];
            if (qAns && Array.isArray(qAns.selectedOptionIds)) {
              for (const optId of qAns.selectedOptionIds) {
                if (distribution[optId] !== undefined) {
                  distribution[optId]++;
                }
              }
            }
          } catch (e) {}
        }

        currentMeta.revealedData = {
          correctOptionIds,
          explanation: rawQuestion.explanation,
          distribution,
        };
      }
      break;
    }

    case 'SHOW_LEADERBOARD': {
      nextStatus = 'LEADERBOARD';
      break;
    }

    case 'END_SESSION': {
      nextStatus = 'FINISHED';
      await prisma.liveSession.update({
        where: { joinCode },
        data: {
          status: 'FINISHED',
          endedAt: new Date(),
        },
      });
      break;
    }

    default:
      break;
  }

  currentMeta.version = (currentMeta.version || 0) + 1;

  await prisma.liveSession.update({
    where: { joinCode },
    data: {
      status: nextStatus,
      currentQuestionIndex: nextIndex,
      gameState: JSON.stringify(currentMeta),
    },
  });

  return getFullSessionState(joinCode);
}

export async function getFullSessionState(joinCode, forPlayerId = null) {
  const session = await prisma.liveSession.findUnique({
    where: { joinCode },
    include: {
      quiz: {
        include: {
          quizQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: { orderBy: { order: 'asc' } },
                },
              },
            },
          },
        },
      },
      players: {
        orderBy: { score: 'desc' },
      },
    },
  });

  if (!session) return null;

  const rawQuestions = session.quiz.quizQuestions.map((qq) => qq.question);
  let meta = {};
  try {
    meta = JSON.parse(session.gameState || '{}');
  } catch (e) {
    meta = {};
  }

  const currentQ = rawQuestions[session.currentQuestionIndex];
  let currentQuestionPayload = null;
  if (currentQ) {
    currentQuestionPayload = {
      index: session.currentQuestionIndex,
      total: rawQuestions.length,
      id: currentQ.id,
      text: currentQ.text,
      type: currentQ.type,
      timeLimitSeconds: 20,
      options: currentQ.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        order: opt.order,
      })),
    };
  }

  let playerSelfResult = null;
  if (forPlayerId && currentQ) {
    const me = session.players.find((p) => p.playerId === forPlayerId);
    if (me) {
      try {
        const answersObj = JSON.parse(me.answers || '{}');
        playerSelfResult = answersObj[currentQ.id] || null;
      } catch (e) {}
    }
  }

  const leaderboard = session.players.map((p, idx) => ({
    rank: idx + 1,
    id: p.playerId,
    name: p.name,
    score: p.score,
  }));

  return {
    joinCode: session.joinCode,
    status: session.status,
    quizTitle: session.quiz.title,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: rawQuestions.length,
    currentQuestion: currentQuestionPayload,
    revealedData: meta.revealedData || null,
    leaderboard,
    players: leaderboard,
    answeredCount: meta.answersCount || 0,
    playerSelfResult,
    version: meta.version || 1,
  };
}
