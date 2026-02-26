const isProduction = () => process.env.NODE_ENV === 'production';
const getJwtSecret = () => String(process.env.JWT_SECRET || '').trim();
const getMongoUri = () => String(process.env.MONGO_URI || '').trim();

const validateMongoUri = (mongoUri) => {
  if (!mongoUri) return 'MONGO_URI is missing';

  const isSrv = mongoUri.startsWith('mongodb+srv://');
  const isStandard = mongoUri.startsWith('mongodb://');
  if (!isSrv && !isStandard) {
    return 'MONGO_URI must start with mongodb:// or mongodb+srv://';
  }

  if (mongoUri.includes('@cluster.mongodb.net')) {
    return 'MONGO_URI uses placeholder host "cluster.mongodb.net". Use your real Atlas host (example: cluster0.abcde.mongodb.net).';
  }

  return '';
};

const assertRequiredEnv = () => {
  const missing = [];
  const mongoUri = getMongoUri();
  const jwtSecret = getJwtSecret();
  const mongoUriError = validateMongoUri(mongoUri);

  if (!mongoUri) {
    missing.push('MONGO_URI');
  }

  if (!jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (mongoUriError) {
    throw new Error(`Invalid MONGO_URI: ${mongoUriError}`);
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
