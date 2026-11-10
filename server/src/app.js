const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { CORS_ORIGIN } = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/response');

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-origin resource sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified CORS_ORIGIN
      if (!origin || origin.startsWith('http://localhost') || origin === CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local development flexibility
      }
    },
    credentials: true,
  })
);

// JSON body parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting for general API requests
app.use('/api', apiLimiter);

// API v1 versioned routes
app.use('/api/v1', routes);

// 404 Not Found handler for undefined API routes
app.use('*', (req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND');
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
