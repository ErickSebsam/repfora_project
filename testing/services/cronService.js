import cron from 'node-cron';
import runSofiaJob from '../jobs/sofiaJob.js';

export const initCrons = () => {
  console.log('[Cron Service] Inicializando tareas programadas...');

  // OPCIÓN 1: Para pruebas inmediatas (Ejecutar cada 2 minutos)
  cron.schedule('*/2 * * * *', async () => {
    console.log('[Cron] Disparando automatización de SOFIA Plus...');
    await runSofiaJob();
  });

  // OPCIÓN 2: Ejemplo real para Producción (Ejecutarse todos los días a las 6:00 AM)
  // cron.schedule('0 6 * * *', async () => {
  //   await runSofiaJob();
  // });
};