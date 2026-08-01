const mongoose = require('mongoose');
const User = require('./models/User.js').default;

require('dotenv').config();
const MONGO_URL = process.env.MONGO_URL || 'mongodb://deivibogoya_db_user:planeaciones2026@ac-5b945qk-shard-00-00.kqqzr6f.mongodb.net:27017,ac-5b945qk-shard-00-01.kqqzr6f.mongodb.net:27017,ac-5b945qk-shard-00-02.kqqzr6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-4xahgw-shard-0&authSource=admin';

async function check() {
  await mongoose.connect(MONGO_URL);
  const user = await User.findOne({ email: 'juancamiloalvarezsarmiento22@gmail.com' });
  if (user) {
    console.log('User found:', {
      _id: user._id,
      id_type: typeof user._id,
      email: user.email,
      role: user.role
    });
  } else {
    console.log('User not found!');
  }
  process.exit(0);
}

check();
