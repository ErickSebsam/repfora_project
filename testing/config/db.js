import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/repfora');
    console.log(`[DB] MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB Error] Error de conexión: ${error.message}`);
    process.exit(1);
  }
};



export default connectDB;