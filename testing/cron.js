import 'dotenv/config';
import connectDB from './config/db.js';
import { initCrons } from './services/cronService.js';

const startApp = async () => {
  try {
    await connectDB();
    initCrons();
    console.log('[App] Servicio Cron iniciado correctamente.');
  } catch (error) {
    console.error(`[App Error] Fallo al iniciar el servicio: ${error.message}`);
  }
};

startApp();