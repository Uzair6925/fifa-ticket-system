const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const matchRoutes = require('./routes/match.routes');
const stadiumRoutes = require('./routes/stadium.routes');
const seatRoutes = require('./routes/seat.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50000,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FIFA Ticket Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

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

app.use(notFound);
app.use(errorHandler);

module.exports = app;
