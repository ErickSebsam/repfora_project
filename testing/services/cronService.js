import cron from 'node-cron';
import { ejecutarSincronizacionEvento } from '../jobs/syncJob.js';
import { logger } from '../utils/logger.js';

export function iniciarCronServices() {
  logger.info("Servicio de tareas Cron inicializado.");

  // Ejemplo: Ejecutar cada 5 minutos (ajustable según la necesidad)
  cron.schedule('*/5 * * * *', async () => {
    logger.info("Ejecutando syncJob desde Cron...");
    try {
      await ejecutarSincronizacionEvento();
    } catch (error) {
      logger.error("Fallo la ejecución del Cron Job.", error);
    }
  });
}