import cron from 'node-cron';
import { reviewJudgment } from '../cron/def-value-judgment.js';
import AppSettings from '../models/AppSettings.js';

let auditCronTask = null;
let cronEnabled = process.env.CRON_ENABLED === 'true';

/**
 * Inicia el cron de auditoría
 */
export async function initCronSettings() {
  try {
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create({ cronEnabled });
      console.log(`[CRON] Configuración inicial guardada en BD (cronEnabled=${cronEnabled})`);
    } else if (settings.cronEnabled !== undefined) {
      cronEnabled = settings.cronEnabled;
      console.log(`[CRON] Estado cargado desde BD (cronEnabled=${cronEnabled})`);
    }
  } catch (error) {
    console.error('[CRON] Error cargando configuración desde BD, usando env var:', error.message);
  }
}

export function startAuditCron() {
  if (auditCronTask) {
    console.log('[CRON] El cron ya está activo');
    return false;
  }
  auditCronTask = cron.schedule('0 1 * * *', async () => {
    console.log('🕒 Iniciando cron de auditoría (Hora Colombia)...');
    try {
      await reviewJudgment({ maxFiches: parseInt(process.env.MAX_GROUPS_TO_PROCESS, 10) || 3 });
    } catch (error) {
      console.error('❌ Error fatal en el cron:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });
  cronEnabled = true;
  AppSettings.findOneAndUpdate({}, { cronEnabled: true }, { upsert: true }).catch(e =>
    console.error('[CRON] Error guardando estado en BD:', e.message)
  );
  console.log('[CRON] Auditoría automática ACTIVADA (1 AM hora Colombia)');
  return true;
}

/**
 * Detiene el cron de auditoría
 */
export function stopAuditCron() {
  if (auditCronTask) {
    auditCronTask.stop();
    auditCronTask = null;
    cronEnabled = false;
    AppSettings.findOneAndUpdate({}, { cronEnabled: false }, { upsert: true }).catch(e =>
      console.error('[CRON] Error guardando estado en BD:', e.message)
    );
    console.log('[CRON] Auditoría automática DESACTIVADA');
    return true;
  }
  return false;
}

/**
 * Obtiene el estado del cron
 */
export function getCronStatus() {
  return {
    enabled: cronEnabled,
    active: auditCronTask !== null,
    schedule: "0 1 * * * (1 AM hora Colombia)",
    description: "Cron de auditoría de juicios evaluativos"
  };
}

export async function initCron() {
  await initCronSettings();
  if (cronEnabled) {
    startAuditCron();
  } else {
    console.log('[CRON] Auditoría automática DESHABILITADA');
  }
}
