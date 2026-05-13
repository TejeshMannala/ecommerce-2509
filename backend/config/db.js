const mongoose = require('mongoose');

const logAuthTroubleshooting = () => {
  console.error('MongoDB auth troubleshooting:');
  console.error('1) Verify username/password in Atlas Database Access.');
  console.error('2) If password has special chars, URL-encode it in MONGO_URI.');
  console.error('3) Re-copy the connection string from Atlas and replace MONGO_URI.');
  console.error('4) Ensure your current IP is allowed in Atlas Network Access.');
};

const logNetworkTroubleshooting = () => {
  console.error('MongoDB network troubleshooting:');
  console.error('1) Your mongodb+srv URI requires Node to resolve Atlas SRV DNS records.');
  console.error('2) Check that your DNS server can resolve _mongodb._tcp.<cluster>.mongodb.net.');
  console.error('3) Ensure your current IP is allowed in Atlas Network Access.');
  console.error('4) Ensure your firewall/VPN/ISP allows outbound TCP traffic on port 27017.');
};

const connectDB = async () => {
  const mongoUri = String(process.env.MONGO_URI || '').trim();

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
    if (/querySrv|ETIMEOUT|ECONNREFUSED|ENOTFOUND|server selection/i.test(error.message)) {
      logNetworkTroubleshooting();
    }
    console.error('Proceeding with server startup despite MongoDB connection error...');
  }
};

module.exports = connectDB;
