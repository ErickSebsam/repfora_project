import cron from 'node-cron';
import { reviewJudgment } from './def-value-judgment.js'; // Tu función de auditoría
import AppSettings from '../models/AppSettings.js';

// Calcula días de diferencia entre dos fechas
function daysBetween(date1, date2) {
  const d1 = new Date(date1).setHours(0, 0, 0, 0);
  const d2 = new Date(date2).setHours(0, 0, 0, 0);
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
}



cron.schedule('0 1 * * *', async () => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('[CRON_AUDIT] Fin de semana — sin ejecución.');
      return;
    }

    const settings = await AppSettings.findOne().lean();
    const lastExecution = settings?.lastJudgmentAuditDate;
    const shouldExecute = !lastExecution || daysBetween(now, lastExecution) >= 3;

    if (shouldExecute) {
      console.log('[CRON_AUDIT] Iniciando auditoría programada...');
      await reviewJudgment({ maxFiches: parseInt(process.env.MAX_GROUPS_TO_PROCESS, 10) || 3 });

      await AppSettings.findOneAndUpdate(
        {},
        { $set: { lastJudgmentAuditDate: now } },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('[CRON_AUDIT] Error fatal:', error);
  }
}, {
  scheduled: true,
  timezone: "America/Bogota" // <--- CLAVE: Fuerza la hora colombiana
});

console.log('✅ Sistema de auditoría programado para la 1:00 AM (Bogotá).');