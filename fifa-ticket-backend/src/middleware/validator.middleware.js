const dns = require('dns').promises;
const { body, validationResult } = require('express-validator');

const DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  'xyz.com',
  'xyzl.com',
  'abc.com',
  'test.com',
  'example.com',
  'fake.com',
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
]);

const COMMON_PROVIDER_TYPOS = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

const TRUSTED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'fifa.com',
]);

const verifyEmailDomain = async (email) => {
  const parts = String(email || '').toLowerCase().trim().split('@');
  if (parts.length !== 2) {
    throw new Error('Please enter a valid email address.');
  }

  const [localPart, domain] = parts;

  if (localPart.length < 2 || /^(\d+|test|abc|user|admin123)$/i.test(localPart)) {
    if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
      throw new Error(`"${domain}" is not a valid email provider. Please use a real email address.`);
    }
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    throw new Error(`"${domain}" is a blocked or placeholder domain. Please use an active email provider (e.g., gmail.com, outlook.com).`);
  }

  if (COMMON_PROVIDER_TYPOS[domain]) {
    throw new Error(`Did you mean "${localPart}@${COMMON_PROVIDER_TYPOS[domain]}"? Please check your email domain.`);
  }

  const domainLabels = domain.split('.');
  const tld = domainLabels[domainLabels.length - 1];
  if (domainLabels.length < 2 || tld.length < 2 || !/^[a-z]{2,15}$/.test(tld)) {
    throw new Error('Email domain extension is invalid.');
  }

  if (TRUSTED_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500)),
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      throw new Error(`The domain "${domain}" cannot receive emails (no mail server found).`);
    }
  } catch (err) {
    if (err.message === 'DNS_TIMEOUT') {
      throw new Error(`Unable to verify email domain "${domain}". Please use a valid email provider (e.g., gmail.com, outlook.com, yahoo.com).`);
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      throw new Error(`The email domain "${domain}" does not exist or cannot receive mail.`);
    }
    throw err;
  }

  return true;
};

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
    .isLength({ min: 3, max: 100 }).withMessage('Full name must be between 3 and 100 characters.')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail({ allow_utf8_local_part: false, require_tld: true })
    .withMessage('Please provide a valid email address.')
    .isLength({ min: 6, max: 150 }).withMessage('Email must be between 6 and 150 characters.')
    .custom(verifyEmailDomain)
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
    .isEmail({ allow_utf8_local_part: false, require_tld: true })
    .withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6, max: 64 }).withMessage('Invalid email or password.'),

  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validate,
};
