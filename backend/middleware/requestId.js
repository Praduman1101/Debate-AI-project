const { v4: uuidv4 } = require('uuid');

/**
 * requestId middleware
 * Attaches a unique request ID to every incoming HTTP request.
 * Useful for distributed tracing and correlating logs.
 *
 * Sets:
 *   req.id          — UUID for this request
 *   res header      — X-Request-Id: <uuid>
 *
 * Usage:
 *   app.use(requestId);
 *   // Then in route handlers: req.id
 *   // Then in logs: logger.info('Processing', { requestId: req.id });
 */
const requestId = (req, res, next) => {
  // Honor upstream trace header if present (e.g. load balancer / API gateway)
  const existingId = req.headers['x-request-id'] || req.headers['x-trace-id'];
  req.id = existingId || uuidv4();

  // Echo the ID back in the response so clients can correlate
  res.setHeader('X-Request-Id', req.id);

  next();
};

module.exports = requestId;
