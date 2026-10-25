const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.path === 'password' ? '***' : err.value,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message,
      errors: formattedErrors,
    });
  }
  next();
};

const validateRegister = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .isLength({ max: 150 }).withMessage('Email cannot exceed 150 characters.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters long.')
    .matches(/[0-9]/).withMessage('Password must contain at least one numeric digit (0-9).')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter (a-z).')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter (A-Z).')
    .matches(/[@$!%*?&#^()_\-+={}[\]:;"'<>,./~`|\\]/).withMessage(
      'Password must contain at least one special character.'
    ),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/)
    .withMessage('Please provide a valid phone number.'),

  body('region')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((val) => {
      if (!val) return 'europe';
      const norm = val.toLowerCase().replace(/ /g, '_');
      if (norm === 'north_am') return 'north_america';
      if (norm === 'south_am') return 'south_america';
      return norm;
    })
    .isIn(['europe', 'asia', 'north_america', 'south_america'])
    .withMessage('Invalid region selected.'),

  validate,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validate,
};
