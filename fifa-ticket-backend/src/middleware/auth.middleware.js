/**
 * auth.middleware.js — JWT Authentication Guard
 * ───────────────────────────────────────────────
 * Protected routes pe yeh middleware lagao
 * Token verify karta hai — valid hoga tabhi aage jao
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fifa_super_secret_jwt_key_2026';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '🔒 Unauthorized — No token provided. Please login first.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      region: decoded.region || 'europe',
      role: decoded.role || 'user',
    };
    next();
  } catch (err) {
    return next(err); // Passed to global error handler
  }
};

// ─── Admin Only Guard ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '🚫 Forbidden — Admins only.',
    });
  }
  next();
};

module.exports = { protect, adminOnly };
