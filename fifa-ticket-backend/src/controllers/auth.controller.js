const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fifa_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT Token
const generateToken = (id, region, role) => {
  return jwt.sign(
    { id, region, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const normalizeRegion = (region) => {
  if (!region) return 'europe';
  const norm = region.toLowerCase().replace(/ /g, '_');
  if (norm === 'north_am') return 'north_america';
  if (norm === 'south_am') return 'south_america';
  return norm;
};

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone, region } = req.body;
    const targetRegion = normalizeRegion(region);

    // Check if user already exists across any shard
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered in our system.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in specified regional shard
    const { user, region: savedRegion } = await UserModel.create({
      full_name,
      email,
      password: hashedPassword,
      phone,
    }, targetRegion);

    // Generate token containing user's home region
    const token = generateToken(user.id, savedRegion, user.role);

    logger.info(`New user registered in [${savedRegion}] shard: ${email}`);

    res.status(201).json({
      success: true,
      message: `Account successfully created in ${savedRegion.toUpperCase()} shard!`,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || phone,
        role: user.role,
        home_region: savedRegion,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user across all regional shards
    const userRecord = await UserModel.findByEmail(email);
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const { user, region } = userRecord;

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user.id, region, user.role);

    logger.info(`User logged in from [${region}] shard: ${email}`);

    res.status(200).json({
      success: true,
      message: `Login successful! Located in ${region.toUpperCase()} shard.`,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        home_region: region,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { id, region } = req.user;

    const user = await UserModel.findById(id, region);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        home_region: region,
      },
    });
  } catch (error) {
    next(error);
  }
};
