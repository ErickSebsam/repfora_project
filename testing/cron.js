import { iniciarCronServices } from './services/cronService.js';
import { ejecutarSincronizacionEvento } from './jobs/syncJob.js';
import { logger } from './utils/logger.js';

async function main() {
  logger.info("=== INICIANDO ORQUESTADOR CRON ===");

  const ejecutarInmediato = process.argv.includes('--now');

  if (ejecutarInmediato) {
    logger.info("Modo inmediato activado (--now)");
    await ejecutarSincronizacionEvento();
  } else {
    iniciarCronServices();
  }
}

main().catch((err) => logger.error("Error en main cron execution:", err));