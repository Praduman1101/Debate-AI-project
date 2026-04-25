const { validationResult } = require('express-validator');

/**
 * validate — wraps express-validator chain results into a consistent error response.
 *
 * Usage:
 *   router.post('/register', [...validators], validate, async (req, res) => { ... });
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    error:  'Validation failed',
    fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
  });
};

/**
 * asyncHandler — wraps async route handlers to catch rejected promises.
 * Eliminates repetitive try/catch boilerplate.
 *
 * Usage:
 *   router.get('/topics', asyncHandler(async (req, res) => {
 *     const topics = await Topic.find();
 *     res.json({ topics });
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { validate, asyncHandler };
