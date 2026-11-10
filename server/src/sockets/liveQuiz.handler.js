const prisma = require('../config/db');

// In-memory live session state
const activeRooms = new Map();

function initLiveQuizSockets(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // 1. Host registers as the controller for a joinCode room
    socket.on('host:register', async ({ joinCode, hostId }) => {
      try {
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
          },
        });

        if (!session) {
          return socket.emit('error', { message: 'Live session not found' });
        }

        socket.join(`room:${joinCode}`);
        socket.join(`host:${joinCode}`);

        // Initialize room state if not already set
        if (!activeRooms.has(joinCode)) {
          activeRooms.set(joinCode, {
            sessionId: session.id,
            hostId,
            quizTitle: session.quiz.title,
            questions: session.quiz.quizQuestions.map((qq) => qq.question),
            currentQuestionIndex: -1,
            players: new Map(),
            questionAnswers: new Map(),
            status: 'WAITING',
          });
        }

        const room = activeRooms.get(joinCode);
        socket.emit('host:ready', {
          joinCode,
          quizTitle: session.quiz.title,
          totalQuestions: room.questions.length,
          players: Array.from(room.players.values()),
        });
      } catch (err) {
        console.error('[Socket.IO host:register error]:', err);
        socket.emit('error', { message: 'Failed to initialize host room' });
      }
    });

    // 2. Student joins the room
    socket.on('player:join', async ({ joinCode, studentId, studentName }) => {
      let room = activeRooms.get(joinCode);
      if (!room) {
        try {
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
            },
          });
          if (session && session.status !== 'FINISHED') {
            room = {
              sessionId: session.id,
              hostId: session.hostId,
              quizTitle: session.quiz.title,
              questions: session.quiz.quizQuestions.map((qq) => qq.question),
              currentQuestionIndex: -1,
              players: new Map(),
              questionAnswers: new Map(),
              status: 'WAITING',
            };
            activeRooms.set(joinCode, room);
          }
        } catch (e) {
          console.error('[Error auto-loading session on player:join]:', e);
        }
      }

      if (!room) {
        return socket.emit('error', { message: 'Session is not active or lobby not started yet.' });
      }

      socket.join(`room:${joinCode}`);
      socket.playerId = studentId;
      socket.joinCode = joinCode;

      // Add or update player
      room.players.set(studentId, {
        id: studentId,
        name: studentName,
        score: room.players.get(studentId)?.score || 0,
        socketId: socket.id,
      });

      // Notify host and room of updated players list
      const playerList = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      }));

      io.to(`room:${joinCode}`).emit('room:players_updated', {
        playerCount: playerList.length,
        players: playerList,
      });

      socket.emit('player:joined_success', {
        joinCode,
        quizTitle: room.quizTitle,
        currentStatus: room.status,
      });
    });

    // 3. Host starts the game countdown
    socket.on('host:start_game', ({ joinCode }) => {
      const room = activeRooms.get(joinCode);
      if (!room) return;

      room.status = 'COUNTDOWN';
      io.to(`room:${joinCode}`).emit('game:starting', {
        countdownSeconds: 3,
        totalQuestions: room.questions.length,
      });
    });

    // 4. Host pushes the next question
    socket.on('host:next_question', ({ joinCode }) => {
      const room = activeRooms.get(joinCode);
      if (!room) return;

      room.currentQuestionIndex += 1;

      if (room.currentQuestionIndex >= room.questions.length) {
        // All questions completed, show final podium
        return endSession(io, joinCode, room);
      }

      const rawQuestion = room.questions[room.currentQuestionIndex];
      room.status = 'QUESTION_ACTIVE';
      room.questionAnswers.clear();

      // Sanitized question payload for all participants (NO isCorrect / NO explanation!)
      const sanitizedQuestion = {
        index: room.currentQuestionIndex,
        total: room.questions.length,
        id: rawQuestion.id,
        text: rawQuestion.text,
        type: rawQuestion.type,
        timeLimitSeconds: 20,
        options: rawQuestion.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          order: opt.order,
        })),
      };

      io.to(`room:${joinCode}`).emit('question:active', sanitizedQuestion);
    });

    // 5. Student submits live answer
    socket.on('player:submit_answer', ({ joinCode, studentId, selectedOptionIds, timeElapsedSeconds = 5 }) => {
      const room = activeRooms.get(joinCode);
      if (!room || room.status !== 'QUESTION_ACTIVE') return;

      // Robust player lookup by studentId, socket.playerId, or socket.id
      let player = room.players.get(studentId);
      if (!player && socket.playerId) {
        player = room.players.get(socket.playerId);
        if (player) studentId = socket.playerId;
      }
      if (!player) {
        for (const p of room.players.values()) {
          if (p.socketId === socket.id) {
            player = p;
            studentId = p.id;
            break;
          }
        }
      }

      const rawQuestion = room.questions[room.currentQuestionIndex];
      const correctOptionIds = rawQuestion.options.filter((o) => o.isCorrect).map((o) => o.id);

      // Evaluate correctness
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

      // Calculate speed-weighted points (max 1000 base + up to 500 speed bonus)
      let pointsEarned = 0;
      if (isCorrect) {
        const timeFactor = Math.max(0, (20 - (timeElapsedSeconds || 0)) / 20);
        pointsEarned = Math.round(1000 + timeFactor * 500);
      }

      // Record answer
      room.questionAnswers.set(studentId, {
        selectedOptionIds,
        isCorrect,
        pointsEarned,
      });

      // Update player cumulative score
      if (player) {
        player.score = (player.score || 0) + pointsEarned;
        console.log(`[Socket.IO] Live Score: Added ${pointsEarned} pts to ${player.name} (${studentId}). Total: ${player.score}`);
      }

      // Inform host of live submission progress (to host room and main room)
      io.to(`host:${joinCode}`).emit('host:answer_received', {
        answeredCount: room.questionAnswers.size,
        totalPlayers: room.players.size,
      });
      io.to(`room:${joinCode}`).emit('host:answer_received', {
        answeredCount: room.questionAnswers.size,
        totalPlayers: room.players.size,
      });

      // Acknowledge student
      socket.emit('player:answer_recorded', {
        isCorrect,
        pointsEarned,
      });
    });

    // 6. Host reveals question answer & stats
    socket.on('host:reveal_answer', ({ joinCode }) => {
      const room = activeRooms.get(joinCode);
      if (!room) return;

      const rawQuestion = room.questions[room.currentQuestionIndex];
      room.status = 'REVEAL';

      const correctOptionIds = rawQuestion.options.filter((o) => o.isCorrect).map((o) => o.id);

      // Compute option selection distribution
      const distribution = {};
      for (const opt of rawQuestion.options) {
        distribution[opt.id] = 0;
      }

      for (const ans of room.questionAnswers.values()) {
        for (const optId of ans.selectedOptionIds || []) {
          if (distribution[optId] !== undefined) {
            distribution[optId]++;
          }
        }
      }

      io.to(`room:${joinCode}`).emit('question:revealed', {
        correctOptionIds,
        explanation: rawQuestion.explanation,
        distribution,
      });
    });

    // 7. Host shows current leaderboard
    socket.on('host:show_leaderboard', ({ joinCode }) => {
      const room = activeRooms.get(joinCode);
      if (!room) return;

      room.status = 'LEADERBOARD';

      const leaderboard = Array.from(room.players.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((p, idx) => ({
          rank: idx + 1,
          id: p.id,
          name: p.name,
          score: p.score,
        }));

      io.to(`room:${joinCode}`).emit('game:leaderboard', {
        leaderboard,
        isLastQuestion: room.currentQuestionIndex >= room.questions.length - 1,
      });
    });

    // 8. End session / Host ends game
    socket.on('host:end_session', ({ joinCode }) => {
      const room = activeRooms.get(joinCode);
      if (room) {
        endSession(io, joinCode, room);
      }
    });

    socket.on('disconnect', () => {
      // Clean up player reference if needed
    });
  });
}

async function endSession(io, joinCode, room) {
  room.status = 'FINISHED';

  const podium = Array.from(room.players.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.name,
      score: p.score,
    }));

  try {
    await prisma.liveSession.update({
      where: { joinCode },
      data: {
        status: 'FINISHED',
        endedAt: new Date(),
      },
    });
  } catch (e) {
    console.error('Failed to update liveSession finished state:', e);
  }

  io.to(`room:${joinCode}`).emit('game:finished', {
    podium,
    message: 'Live Quiz Completed! Congratulations to the winners!',
  });
}

module.exports = {
  initLiveQuizSockets,
};
