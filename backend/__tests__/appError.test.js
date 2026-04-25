const AppError = require('../utils/AppError');

describe('AppError', () => {

  describe('constructor', () => {
    it('creates an error with message and statusCode', () => {
      const err = new AppError('Not found', 404);
      expect(err.message).toBe('Not found');
      expect(err.statusCode).toBe(404);
      expect(err.isOperational).toBe(true);
      expect(err instanceof Error).toBe(true);
    });

    it('auto-generates a code from statusCode', () => {
      expect(new AppError('msg', 404).code).toBe('NOT_FOUND');
      expect(new AppError('msg', 401).code).toBe('UNAUTHORIZED');
      expect(new AppError('msg', 403).code).toBe('FORBIDDEN');
      expect(new AppError('msg', 400).code).toBe('BAD_REQUEST');
      expect(new AppError('msg', 500).code).toBe('INTERNAL_ERROR');
      expect(new AppError('msg', 503).code).toBe('SERVICE_UNAVAILABLE');
    });

    it('accepts a custom code', () => {
      const err = new AppError('Invalid stance', 400, 'INVALID_STANCE');
      expect(err.code).toBe('INVALID_STANCE');
    });

    it('has a stack trace', () => {
      const err = new AppError('test', 400);
      expect(err.stack).toBeDefined();
    });
  });

  describe('toJSON()', () => {
    it('returns a JSON-safe object', () => {
      const err  = new AppError('Resource not found', 404);
      const json = err.toJSON();
      expect(json.error).toBe('Resource not found');
      expect(json.code).toBe('NOT_FOUND');
      expect(json.statusCode).toBe(404);
    });
  });

  describe('factory helpers', () => {
    it('AppError.notFound() creates a 404', () => {
      const err = AppError.notFound('Topic');
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('Topic');
    });

    it('AppError.unauthorized() creates a 401', () => {
      expect(AppError.unauthorized().statusCode).toBe(401);
    });

    it('AppError.forbidden() creates a 403', () => {
      expect(AppError.forbidden().statusCode).toBe(403);
    });

    it('AppError.badRequest() creates a 400', () => {
      const err = AppError.badRequest('Invalid email format');
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Invalid email format');
    });

    it('AppError.conflict() creates a 409', () => {
      expect(AppError.conflict('Username taken').statusCode).toBe(409);
    });

    it('AppError.unavailable() creates a 503', () => {
      expect(AppError.unavailable('AI service down').statusCode).toBe(503);
    });
  });
});
