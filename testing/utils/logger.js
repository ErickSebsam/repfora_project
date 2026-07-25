import EventLog from '../models/EventLog.js';

const logEvent = async ({ jobName, status, message = '', details = null, executionTimeMs = 0 }) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${jobName}] [${status}] ${message}`);

    await EventLog.create({
      jobName,
      status,
      message,
      details,
      executionTimeMs,
    });
  } catch (err) {
    console.error(`[Logger Error] No se pudo persistir el evento en la DB: ${err.message}`);
  }
};

export default logEvent;    