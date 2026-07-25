import logEvent from '../utils/logger.js';

const runSyncJob = async () => {
  const jobName = 'SyncDataJob';
  const startTime = Date.now();

  await logEvent({
    jobName,
    status: 'STARTED',
    message: 'Iniciando proceso de sincronización...',
  });

  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const duration = Date.now() - startTime;
    await logEvent({
      jobName,
      status: 'COMPLETED',
      message: 'Sincronización completada con éxito.',
      details: { itemsProcessed: 42 },
      executionTimeMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    await logEvent({
      jobName,
      status: 'FAILED',
      message: `Error durante la sincronización: ${error.message}`,
      details: { stack: error.stack },
      executionTimeMs: duration,
    });
  }
};

export default runSyncJob;