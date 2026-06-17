const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const Admin = require('./admin/models/Admin');

const DEFAULT_ADMIN = {
  loginUserName: 'admin',
  name: 'Admin',
  password: 'admin123',
};

const seedAdmin = async () => {
  const mongoUri = String(process.env.MONGO_URI || '').trim();
  if (!mongoUri) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    const existing = await Admin.findOne({ loginUserName: DEFAULT_ADMIN.loginUserName });
    if (existing) {
      console.log('Default admin already exists:');
      console.log(`  Login: ${DEFAULT_ADMIN.loginUserName}`);
      console.log(`  Password: ${DEFAULT_ADMIN.password}`);
    } else {
      await Admin.create(DEFAULT_ADMIN);
      console.log('Default admin created:');
      console.log(`  Login: ${DEFAULT_ADMIN.loginUserName}`);
      console.log(`  Password: ${DEFAULT_ADMIN.password}`);
    }
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
};

seedAdmin();
