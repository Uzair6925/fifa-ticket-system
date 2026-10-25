const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fifa_super_secret_jwt_key_2026';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to continue.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const UserModel = require('../models/user.model');
    const userRegion = decoded.region || 'europe';
    const existingUser = await UserModel.findById(decoded.id, userRegion);

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: 'Your session is no longer valid. Please sign in again.',
      });
    }

    req.user = {
      id: decoded.id,
      region: userRegion,
      role: existingUser.role || decoded.role || 'user',
    };
    next();
  } catch (err) {
    return next(err);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

module.exports = { protect, adminOnly };
