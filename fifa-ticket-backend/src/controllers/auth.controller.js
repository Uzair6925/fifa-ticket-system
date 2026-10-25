const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fifa_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id, region, role) => {
  return jwt.sign({ id, region, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { user, region: savedRegion } = await UserModel.create(
      {
        full_name,
        email,
        password: hashedPassword,
        phone,
      },
      targetRegion
    );

    const token = generateToken(user.id, savedRegion, user.role);
    logger.info(`New user registered in [${savedRegion}]: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
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

    const userRecord = await UserModel.findByEmail(email);
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const { user, region } = userRecord;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user.id, region, user.role);
    logger.info(`User logged in [${region}]: ${email}`);

    const { password: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        ...safeUser,
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

exports.updateProfile = async (req, res, next) => {
  try {
    const { id, region } = req.user;
    const {
      full_name,
      phone,
      nationality,
      passport_number,
      billing_address,
      payment_methods,
      preferences,
    } = req.body;

    if (full_name !== undefined && String(full_name).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 3 characters long.',
      });
    }

    const updatedUser = await UserModel.updateProfile(id, region, {
      full_name: full_name ? String(full_name).trim() : undefined,
      phone: phone !== undefined ? String(phone).trim() : undefined,
      nationality,
      passport_number,
      billing_address,
      payment_methods,
      preferences,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account settings updated successfully.',
      user: {
        ...updatedUser,
        home_region: region,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { id, region } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const userWithPass = await UserModel.findByIdWithPassword(id, region);
    if (!userWithPass) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, userWithPass.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    await UserModel.updatePassword(id, region, hashedNewPassword);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
