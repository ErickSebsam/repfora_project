import cron from 'node-cron';
import { reviewJudgment } from '../cron/def-value-judgment.js';
import { runDf14aReport } from '../cron/df14a-report.js';
import { runSofiaSync } from '../cron/sofia-sync.js';
import AppSettings from '../models/AppSettings.js';

let auditCronTask = null;
let df14aCronTask = null;
let sofiaSyncCronTask = null;
let cronEnabled = process.env.CRON_ENABLED === 'true';

// Calcula días de diferencia entre dos fechas
function daysBetween(date1, date2) {
  const d1 = new Date(date1).setHours(0, 0, 0, 0);
  const d2 = new Date(date2).setHours(0, 0, 0, 0);
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
}


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
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();

      // Filtro: No ejecutar en fines de semana (0 = domingo, 6 = sábado)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log('[CRON_AUDIT] Fin de semana — sin ejecución.');
        return;
      }

      // Obtener última fecha de ejecución desde la base de datos
      const settings = await AppSettings.findOne().lean();
      const lastExecution = settings?.lastJudgmentAuditDate;
      const shouldExecute = !lastExecution || daysBetween(now, lastExecution) >= 3;

      if (shouldExecute) {
        console.log('[CRON_AUDIT] Iniciando auditoría programada...');
        await reviewJudgment({ maxFiches: parseInt(process.env.MAX_GROUPS_TO_PROCESS, 10) || 3 });

        // Actualizar fecha de última ejecución
        await AppSettings.findOneAndUpdate(
          {},
          { $set: { lastJudgmentAuditDate: now } },
          { upsert: true }
        );
        console.log('[CRON_AUDIT] Auditoría completada exitosamente.');
      } else {
        console.log('[CRON_AUDIT] No se cumple el intervalo mínimo de 3 días.');
      }
    } catch (error) {
      console.error('[CRON_AUDIT] Error fatal:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });
  cronEnabled = true;
  AppSettings.findOneAndUpdate({}, { cronEnabled: true }, { upsert: true }).catch(e =>
    console.error('[CRON] Error guardando estado en BD:', e.message)
  );
  console.log('[CRON] Auditoría automática ACTIVADA (1 AM hora Colombia, cada 3 días hábiles)');
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
/**
 * Inicia el cron mensual del reporte DF-14A (día 1, 3:00 AM hora Colombia).
 * Descarga y procesa el DF-14A de SOFIA Plus y notifica rutas/juicios pendientes a instructores.
 * No persiste estado propio: se rige por el flag global cronEnabled (igual que el arranque del cron de auditoría).
 */
export function startDf14aCron() {
  if (df14aCronTask) {
    console.log('[CRON] El cron DF-14A ya está activo');
    return false;
  }
  df14aCronTask = cron.schedule('0 3 1 * *', async () => {
    console.log('🕒 Iniciando cron mensual DF-14A (Hora Colombia)...');
    try {
      await runDf14aReport({ source: 'cron' });
    } catch (error) {
      console.error('❌ Error fatal en el cron DF-14A:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });
  console.log('[CRON] Reporte DF-14A mensual ACTIVADO (día 1, 3 AM hora Colombia)');
  return true;
}

/**
 * Detiene el cron mensual del reporte DF-14A.
 */
export function stopDf14aCron() {
  if (df14aCronTask) {
    df14aCronTask.stop();
    df14aCronTask = null;
    console.log('[CRON] Reporte DF-14A mensual DESACTIVADO');
    return true;
  }
  return false;
}

/**
 * Inicia el cron de sincronización de eventos con SOFIA Plus (cada 5 minutos).
 * Registra en SOFIA los "schedules" del mes actual que aún no tengan su evento
 * de ambiente creado. No persiste estado propio: se rige por el flag global
 * cronEnabled (igual que el resto de los cron de este proyecto).
 *
 * ⚠️ Requiere Chromium disponible (Playwright). Ver nota en cron/sofia-sync.js:
 * hoy sigue deshabilitado en el build de Docker de este proyecto.
 */
export function startSofiaSyncCron() {
  if (sofiaSyncCronTask) {
    console.log('[CRON] El cron de sincronización SOFIA ya está activo');
    return false;
  }
  sofiaSyncCronTask = cron.schedule('*/5 * * * *', async () => {
    try {
      await runSofiaSync({ source: 'cron' });
    } catch (error) {
      console.error('[CRON_SOFIA_SYNC] Error fatal:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });
  console.log('[CRON] Sincronización SOFIA ACTIVADA (cada 5 minutos)');
  return true;
}

/**
 * Detiene el cron de sincronización de eventos con SOFIA Plus.
 */
export function stopSofiaSyncCron() {
  if (sofiaSyncCronTask) {
    sofiaSyncCronTask.stop();
    sofiaSyncCronTask = null;
    console.log('[CRON] Sincronización SOFIA DESACTIVADA');
    return true;
  }
  return false;
}

export function getCronStatus() {
  return {
    enabled: cronEnabled,
    active: auditCronTask !== null,
    schedule: "0 1 * * * (1 AM hora Colombia, cada 3 días hábiles)",
    description: "Cron de auditoría de juicios evaluativos (ejecuta cada 3 días hábiles, excluye fines de semana)"
  };
}

export async function initCron() {
  await initCronSettings();
  if (cronEnabled) {
    startAuditCron();
    startDf14aCron();
    startSofiaSyncCron();
  } else {
    console.log('[CRON] Auditoría automática DESHABILITADA');
  }
}
