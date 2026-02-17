const mongoose = require('mongoose');
const { getMongoUri } = require('./env');

const logAuthTroubleshooting = () => {
  console.error('MongoDB auth troubleshooting:');
  console.error('1) Verify username/password in Atlas Database Access.');
  console.error('2) If password has special chars, URL-encode it in MONGO_URI.');
  console.error('3) Re-copy the connection string from Atlas and replace MONGO_URI.');
  console.error('4) Ensure your current IP is allowed in Atlas Network Access.');
};

const connectDB = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in .env');
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (error.code === 8000 || /bad auth/i.test(error.message)) {
      logAuthTroubleshooting();
    }
    process.exit(1);
  }
};

module.exports = connectDB;
