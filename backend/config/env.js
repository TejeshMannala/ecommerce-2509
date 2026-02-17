const isProduction = () => process.env.NODE_ENV === 'production';
const getJwtSecret = () => String(process.env.JWT_SECRET || '').trim();
const getMongoUri = () => String(process.env.MONGO_URI || '').trim();

const assertRequiredEnv = () => {
  const missing = [];
  const mongoUri = getMongoUri();
  const jwtSecret = getJwtSecret();

  if (!mongoUri) {
    missing.push('MONGO_URI');
  }

  if (!jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (isProduction() && jwtSecret === 'dev-secret-change-me') {
    throw new Error('JWT_SECRET cannot use the development default in production');
  }
};

module.exports = {
  isProduction,
  getJwtSecret,
  getMongoUri,
  assertRequiredEnv,
};
