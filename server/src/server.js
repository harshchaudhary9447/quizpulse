const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PORT, CORS_ORIGIN } = require('./config');
const { initLiveQuizSockets } = require('./sockets/liveQuiz.handler');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost') || origin === CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket.IO events for live quizzes
initLiveQuizSockets(io);

server.listen(PORT, () => {
  console.log(`🚀 QuizPulse Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO Real-Time Engine initialized`);
  console.log(`📖 API Base URL: http://localhost:${PORT}/api/v1`);
});

module.exports = { app, server, io };
