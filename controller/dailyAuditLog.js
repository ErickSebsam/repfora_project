import DailyAuditLog from '../models/DailyAuditLog.js';

export async function getAuditLog(req, res) {
  
  try {

    const dailyAuditLogs=await DailyAuditLog.find( );

    return res.json({dailyAuditLogs});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

