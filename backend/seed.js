const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const Admin = require('./admin/models/Admin');

const DEFAULT_ADMIN = {
  loginUserName: String(process.env.ADMIN_LOGIN || 'admin').trim(),
  name: 'Admin',
  password: String(process.env.ADMIN_PASSWORD || 'admin123').trim(),
};

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
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

    const existing = await Admin.findOne({ loginUserName: DEFAULT_ADMIN.loginUserName }).select('+password');
    if (existing) {
      const isHashed = existing.password && (existing.password.startsWith('$2b$') || existing.password.startsWith('$2a$'));
      if (!isHashed) {
        const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);
        await Admin.updateOne({ _id: existing._id }, { password: hashedPassword });
        console.log('Admin password re-hashed (was plain text).');
      }
      console.log('Default admin already exists:');
      console.log(`  Login: ${DEFAULT_ADMIN.loginUserName}`);
      console.log(`  Password: ${DEFAULT_ADMIN.password}`);
    } else {
      const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);
      await Admin.create({ ...DEFAULT_ADMIN, password: hashedPassword });
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
