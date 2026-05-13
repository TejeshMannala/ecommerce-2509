const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await User.countDocuments();
    const latestUsers = await User.find().select('+password').sort({ createdAt: -1 }).limit(5);
    console.log(`Total users: ${count}`);
    console.log('Latest 5 users:', JSON.stringify(latestUsers, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
};

checkUsers();
