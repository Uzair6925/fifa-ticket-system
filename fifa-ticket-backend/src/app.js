/**
 * app.js — Express Application Setup
 * Registers all middleware, routes, and error handlers
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ─── Route Imports ────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const matchRoutes = require('./routes/match.routes');
const stadiumRoutes = require('./routes/stadium.routes');
const seatRoutes = require('./routes/seat.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');

// ─── Middleware Imports ───────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────
app.use(helmet());                    // Sets secure HTTP headers
app.use(cors());                      // Allows cross-origin requests (frontend)
app.use(express.json());              // Parse incoming JSON body
app.use(express.urlencoded({ extended: true }));

// ─── Logging Middleware ───────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));             // Logs: GET /api/matches 200 12ms
}

// ─── Rate Limiting (Anti-DDoS / Anti-Spam, Tuned for Load Testing) ────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50000, // High ceiling for 5M load tests
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '⚽ FIFA Ticket Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);           // Register, Login, Logout
app.use('/api/matches', matchRoutes);       // Get matches, search, filter
app.use('/api/stadiums', stadiumRoutes);    // Stadium info
app.use('/api/seats', seatRoutes);          // Seat availability
app.use('/api/bookings', bookingRoutes);    // Book, cancel, history
app.use('/api/admin', adminRoutes);         // Admin panel routes

// ─── Serve Built Frontend UI (React Single-Port Mode) ─────────────
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../../fifa-ticket-frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
