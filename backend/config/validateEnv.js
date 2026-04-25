const validateEnv = () => {
  if (process.env.NODE_ENV === 'test') return;

  const REQUIRED = [
    { key: 'MONGODB_URI',    hint: 'MongoDB Atlas connection string' },
    { key: 'JWT_SECRET',     hint: 'Random string for tokens' },
    { key: 'GOOGLE_API_KEY', hint: 'Google AI Studio key' },
  ];

  const missing = REQUIRED.filter(v => !process.env[v.key]);

  if (missing.length > 0) {
    console.error('\n❌ Missing environment variables:\n');
    missing.forEach(v => {
      console.error(`  ${v.key} → ${v.hint}\n`);
    });
    process.exit(1);
  }

  console.log('✅ Environment variables OK');
};

module.exports = validateEnv;