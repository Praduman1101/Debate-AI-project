/**
 * Validates required environment variables at startup.
 * Exits the process with a clear error if critical vars are missing.
 *
 * Call this at the top of server.js before anything else.
 */

const REQUIRED = [
  { key: 'MONGODB_URI',        hint: 'MongoDB connection string (local or Atlas)' },
  { key: 'JWT_SECRET',         hint: 'Random 32+ character string for signing tokens' },
  { key: 'ANTHROPIC_API_KEY',  hint: 'Your Anthropic key from console.anthropic.com' },
];

const OPTIONAL = [
  { key: 'OPENAI_API_KEY',     hint: 'OpenAI key for voice transcription (optional)' },
  { key: 'PORT',               hint: 'HTTP port (defaults to 5000)' },
  { key: 'CLIENT_URL',         hint: 'CORS origin (defaults to *)' },
];

const validateEnv = () => {
  if (process.env.NODE_ENV === 'test') return; // skip in test env

  const missing = REQUIRED.filter(v => !process.env[v.key]);

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    missing.forEach(v => {
      console.error(`  ${v.key}`);
      console.error(`    → ${v.hint}\n`);
    });
    console.error('Copy backend/.env.example to backend/.env and fill in the values.\n');
    process.exit(1);
  }

  // Warn about weak JWT secret
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) {
    console.warn('⚠️  JWT_SECRET is shorter than 32 characters — use a longer, random value in production');
  }

  // Log optional missing vars in dev
  if (process.env.NODE_ENV !== 'production') {
    const missingOptional = OPTIONAL.filter(v => !process.env[v.key]);
    if (missingOptional.length > 0) {
      console.info('ℹ️  Optional env vars not set:', missingOptional.map(v => v.key).join(', '));
    }
  }
};

module.exports = validateEnv;
