const mongoose = require('mongoose');
const User = require('./models/User.js').default;

const MONGO_URL = 'mongodb://127.0.0.1:27017/Horarios_SENA';

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
