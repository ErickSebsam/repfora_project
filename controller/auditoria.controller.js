import fs from 'fs/promises';
import path from 'path';
import LearnerOmission from '../models/LearnerOmission.js';
import DailyAuditLog from '../models/DailyAuditLog.js';
import CurrentAuditState from '../models/CurrentAuditState.js';
import Fiche from '../models/Fiche.js';
import Coordination from '../models/Coordination.js';
import FicheOmission from '../models/FicheOmission.js';
import FailedFiche from '../models/FailedFiche.js';
import { getCurrentAuditState } from '../services/currentAuditStateService.js';
import { generateResumenSedeXLSX, generateResumenPorCoordinacionZIP } from '../services/excelExportService.js';

const OUTPUTDIR = process.env.OUTPUTDIR || './downloads';

/**
 * Obtiene el estado actual de auditoría (pendientes + vencidos)
 */
export async function getCurrentState(req, res) {
  try {
    const state = await getCurrentAuditState();

    res.json({
      data: {
        pendientes: state.pendientes || [],
        vencidos: state.vencidos || []
      },
      ultimaActualizacion: state.ultimaActualizacion,
      estadisticas: state.estadisticas || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Limpia el estado actual de auditoría (para forzar recarga)
 */
export async function clearCurrentState(req, res) {
  try {
    await CurrentAuditState.deleteMany({});
    res.json({
      success: true,
      message: 'Estado actual limpiado. Ejecuta una auditoría para regenerar los datos.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene solo los vencidos (para compatibilidad con la interfaz anterior)
 */
export async function getVencidosReport(req, res) {
  try {
    const state = await getCurrentAuditState();

    res.json({
      data: state.vencidos || [],
      ultimaActualizacion: state.ultimaActualizacion,
      total: (state.vencidos || []).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene los vencidos agrupados por ficha
 */
export async function getVencidosGrouped(req, res) {
  try {
    const state = await getCurrentAuditState();
    const vencidos = state.vencidos || [];

    // Agrupar por ficha
    const grouped = {};
    vencidos.forEach(v => {
      if (!grouped[v.ficheNumber]) {
        grouped[v.ficheNumber] = {
          ficheNumber: v.ficheNumber,
          ficheId: v.ficheId,
          // Usar el líder de la ficha (fiche owner) en lugar del instructor del schedule
          instructorName: v.ficheOwnerName || v.instructorName || 'Sin líder',
          instructorEmail: v.ficheOwnerEmail || v.instructorEmail || '',
          outcomes: []
        };
      }
      grouped[v.ficheNumber].outcomes.push(v);
    });

    // Convertir a array y ordenar por cantidad de outcomes vencidos (descendente)
    const result = Object.values(grouped)
      .sort((a, b) => b.outcomes.length - a.outcomes.length);

    res.json({
      data: result,
      ultimaActualizacion: state.ultimaActualizacion,
      total: vencidos.length,
      totalFiches: result.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Agrega una omisión de aprendiz
 */
export async function addLearnerOmission(req, res) {
  const { scheduleId, learnerDocument, learnerName, ficheNumber, outcomeText, justification, omitEverywhere } = req.body;

  if (!scheduleId || !learnerDocument) {
    return res.status(400).json({ error: 'Faltan datos requeridos: scheduleId y learnerDocument' });
  }

  if (!justification || justification.trim() === '') {
    return res.status(400).json({ error: 'La justificación es obligatoria' });
  }

  try {
    // Si se marca omitEverywhere, buscar todos los resultados donde aparece este aprendiz
    if (omitEverywhere) {
      const currentState = await getCurrentAuditState();
      const allOutcomes = [...(currentState.pendientes || []), ...(currentState.vencidos || [])];

      // Encontrar todos los schedules donde este aprendiz aparece
      const schedulesToOmit = allOutcomes.filter(outcome =>
        outcome.missingLearners?.some(l => l.document === learnerDocument)
      );

      let createdCount = 0;
      let skippedCount = 0;

      // Crear omisiones para todos los schedules encontrados
      for (const outcome of schedulesToOmit) {
        try {
          await LearnerOmission.findOneAndUpdate(
            { schedule: outcome.scheduleId, documentNumber: learnerDocument },
            {
              schedule: outcome.scheduleId,
              documentNumber: learnerDocument,
              learnerName: learnerName || 'Aprendiz',
              ficheNumber: outcome.ficheNumber,
              outcomeText: outcome.outcomeText,
              justification: justification.trim(),
              createdBy: req.headers['x-user-id'] || 'sistema'
            },
            { upsert: true, new: true }
          );
          createdCount++;
        } catch (err) {
          if (err.code === 11000) {
            skippedCount++; // Ya existía
          } else {
            console.error(`Error creando omisión para schedule ${outcome.scheduleId}:`, err);
          }
        }
      }

      return res.json({
        success: true,
        message: `Aprendiz omitido en ${createdCount} resultado(s)${skippedCount > 0 ? ` (${skippedCount} ya existían)` : ''}`,
        data: { createdCount, skippedCount, total: schedulesToOmit.length }
      });
    }

    // Omisión normal (solo este schedule)
    const omission = await LearnerOmission.findOneAndUpdate(
      { schedule: scheduleId, documentNumber: learnerDocument },
      {
        schedule: scheduleId,
        documentNumber: learnerDocument,
        learnerName,
        ficheNumber,
        outcomeText,
        justification: justification.trim(),
        createdBy: req.headers['x-user-id'] || 'sistema'
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Aprendiz omitido correctamente',
      data: omission
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El aprendiz ya está omitido en esta programación' });
    }
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene todas las omisiones agrupadas por ficha
 */
export async function getOmissionsGrouped(req, res) {
  try {
    const omissions = await LearnerOmission.find()
      .select('schedule documentNumber learnerName ficheNumber outcomeText justification createdAt createdBy')
      .sort({ createdAt: -1 })
      .lean();

    // Agrupar por ficha
    const grouped = {};
    omissions.forEach(o => {
      const key = o.ficheNumber || 'Sin ficha';
      if (!grouped[key]) {
        grouped[key] = {
          ficheNumber: key,
          omissions: []
        };
      }
      grouped[key].omissions.push(o);
    });

    // Convertir a array y ordenar por cantidad de omisiones (descendente)
    const result = Object.values(grouped)
      .sort((a, b) => b.omissions.length - a.omissions.length);

    res.json({
      data: result,
      total: omissions.length,
      totalFiches: result.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene las omisiones de un schedule
 */
export async function getScheduleOmissions(req, res) {
  const { scheduleId } = req.params;

  try {
    const omissions = await LearnerOmission.find({ schedule: scheduleId })
      .select('documentNumber learnerName justification createdAt createdBy')
      .lean();

    res.json({ data: omissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Elimina una omisión de aprendiz (desomitir)
 */
export async function removeLearnerOmission(req, res) {
  const { scheduleId, learnerDocument } = req.params;

  try {
    const result = await LearnerOmission.findOneAndDelete({
      schedule: scheduleId,
      documentNumber: learnerDocument
    });

    if (!result) {
      return res.status(404).json({ error: 'Omisión no encontrada' });
    }

    return res.json({
      success: true,
      message: 'Omisión eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene el historial de auditorías (DailyAuditLog)
 */
export async function getAuditHistory(req, res) {
  try {
    const { limit = 20 } = req.query;

    const logs = await DailyAuditLog.find()
      .sort({ executionDate: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      data: logs,
      total: logs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene las coordinaciones disponibles para filtrar
 */
export async function getCoordinations(req, res) {
  try {
    const coordinations = await Coordination.find({ status: 0 })
      .select('_id name email')
      .sort({ name: 1 })
      .lean();

    res.json({
      data: coordinations,
      total: coordinations.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene los vencidos agrupados por ficha, filtrados por coordinación
 */
export async function getVencidosGroupedByCoordination(req, res) {
  try {
    const { coordinationId } = req.params;
    const state = await getCurrentAuditState();
    const vencidos = state.vencidos || [];

    // Obtener las fichas de esta coordinación
    const fiches = await Fiche.find({ coordination: coordinationId })
      .select('_id number')
      .lean();
    const ficheIds = fiches.map(f => f._id.toString());
    const ficheNumbers = fiches.map(f => f.number);

    // Filtrar vencidos que pertenezcan a esta coordinación
    const filteredVencidos = vencidos.filter(v =>
      ficheIds.includes(v.ficheId?.toString()) || ficheNumbers.includes(v.ficheNumber)
    );

    // Agrupar por ficha
    const grouped = {};
    filteredVencidos.forEach(v => {
      if (!grouped[v.ficheNumber]) {
        grouped[v.ficheNumber] = {
          ficheNumber: v.ficheNumber,
          ficheId: v.ficheId,
          instructorName: v.ficheOwnerName || v.instructorName || 'Sin líder',
          instructorEmail: v.ficheOwnerEmail || v.instructorEmail || '',
          outcomes: []
        };
      }
      grouped[v.ficheNumber].outcomes.push(v);
    });

    // Convertir a array y ordenar por cantidad de outcomes vencidos (descendente)
    const result = Object.values(grouped)
      .sort((a, b) => b.outcomes.length - a.outcomes.length);

    res.json({
      data: result,
      ultimaActualizacion: state.ultimaActualizacion,
      total: filteredVencidos.length,
      totalFiches: result.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Importar funciones del servicio de cron
import { getCronStatus, startAuditCron, stopAuditCron } from '../services/cronService.js';
import { getEmailStatus, setEmailEnabled } from '../services/notificationService.js';
import AppSettings, { EMAIL_TEMPLATE_DEFAULTS } from '../models/AppSettings.js';
import { reviewJudgment } from '../cron/def-value-judgment.js';

/**
 * Obtiene el estado del cron de auditoría
 */
export async function getCronStatusController(req, res) {
  try {
    const status = getCronStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Activa o desactiva el cron de auditoría
 */
export async function toggleCronController(req, res) {
  try {
    const { enabled } = req.body;

    // Si no se envía el parámetro, solo retorna el estado actual
    if (enabled === undefined) {
      const status = getCronStatus();
      return res.json({
        enabled: status.enabled,
        message: status.enabled ? "Cron ACTIVADO" : "Cron DESACTIVADO"
      });
    }

    // Activar
    if (enabled === true) {
      const started = startAuditCron();
      if (started) {
        res.json({ enabled: true, message: "Cron ACTIVADO" });
      } else {
        res.json({ enabled: true, message: "Cron ya estaba ACTIVADO" });
      }
    }
    // Desactivar
    else if (enabled === false) {
      const stopped = stopAuditCron();
      if (stopped) {
        res.json({ enabled: false, message: "Cron DESACTIVADO" });
      } else {
        res.json({ enabled: false, message: "Cron ya estaba DESACTIVADO" });
      }
    }
    else {
      res.status(400).json({ error: "Parámetro 'enabled' debe ser true o false" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEmailStatusController(req, res) {
  try {
    res.json(getEmailStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function toggleEmailController(req, res) {
  try {
    const { enabled } = req.body;

    if (enabled === undefined) {
      const status = getEmailStatus();
      return res.json({
        enabled: status.enabled,
        message: status.enabled ? "Notificaciones por email ACTIVADAS" : "Notificaciones por email DESACTIVADAS"
      });
    }

    if (enabled === true) {
      await setEmailEnabled(true);
      res.json({ enabled: true, message: "Notificaciones por email ACTIVADAS" });
    } else if (enabled === false) {
      await setEmailEnabled(false);
      res.json({ enabled: false, message: "Notificaciones por email DESACTIVADAS" });
    } else {
      res.status(400).json({ error: "Parámetro 'enabled' debe ser true o false" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

let auditRunning = false;

export async function runAuditController(req, res) {
  if (auditRunning) {
    return res.status(409).json({ error: "Ya hay una auditoría en ejecución" });
  }

  const maxFiches = req.body?.maxFiches ? parseInt(req.body.maxFiches, 10) : undefined;
  const ficheId = req.body?.ficheId || undefined;

  auditRunning = true;
  res.json({
    message: "Auditoría iniciada manualmente. Revisa los logs del servidor para ver el progreso.",
    ...(maxFiches !== undefined && { maxFiches }),
    ...(ficheId !== undefined && { ficheId })
  });

  try {
    await reviewJudgment({ maxFiches, ficheId });
  } catch (error) {
    console.error('[AUDIT] Error en ejecución manual:', error);
  } finally {
    auditRunning = false;
  }
}

export async function excludeFicheController(req, res) {
  try {
    const { ficheNumber, reason } = req.body;
    if (!ficheNumber) {
      return res.status(400).json({ error: "Se requiere ficheNumber" });
    }

    const existing = await FicheOmission.findOne({ ficheNumber });
    if (existing) {
      return res.json({ message: `Ficha ${ficheNumber} ya estaba excluida`, alreadyExcluded: true });
    }

    await FicheOmission.create({ ficheNumber, reason: reason || 'Sin justificación' });

    // También eliminar de FailedFiche si existe
    await FailedFiche.deleteOne({ ficheNumber });

    res.json({ message: `Ficha ${ficheNumber} excluida de auditoría` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function includeFicheController(req, res) {
  try {
    const { ficheNumber } = req.body;
    if (!ficheNumber) {
      return res.status(400).json({ error: "Se requiere ficheNumber" });
    }

    const result = await FicheOmission.deleteOne({ ficheNumber });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: `Ficha ${ficheNumber} no estaba excluida` });
    }

    res.json({ message: `Ficha ${ficheNumber} reincluida en auditoría` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getExcludedFichesController(req, res) {
  try {
    const excluded = await FicheOmission.find().sort({ createdAt: -1 }).lean();
    res.json({ data: excluded, total: excluded.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEmailTemplateController(req, res) {
  try {
    let settings = await AppSettings.findOne().lean();
    if (!settings) {
      settings = await AppSettings.create({});
      settings = settings.toObject();
    }
    res.json({ data: settings.emailTemplate || EMAIL_TEMPLATE_DEFAULTS, defaults: EMAIL_TEMPLATE_DEFAULTS });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateEmailTemplateController(req, res) {
  try {
    const template = req.body;
    if (!template || Object.keys(template).length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un campo de la plantilla' });
    }

    // Construir solo los campos enviados bajo emailTemplate
    const updateFields = {};
    const allowedKeys = Object.keys(EMAIL_TEMPLATE_DEFAULTS);
    for (const key of allowedKeys) {
      if (template[key] !== undefined) {
        updateFields[`emailTemplate.${key}`] = template[key];
      }
    }

    const settings = await AppSettings.findOneAndUpdate(
      {},
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean();

    res.json({ message: 'Plantilla actualizada', data: settings.emailTemplate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene las fichas que fallaron al descargar
 */
export async function getFailedFichesController(req, res) {
  try {
    const failedFiches = await FailedFiche.find()
      .sort({ lastAttemptAt: -1 })
      .lean();

    res.json({ data: failedFiches, total: failedFiches.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Elimina una ficha de la lista de fallidas y la agrega a FicheOmission
 */
export async function omitFailedFicheController(req, res) {
  try {
    const { ficheNumber } = req.params;

    const deleted = await FailedFiche.findOneAndDelete({ ficheNumber });

    if (!deleted) {
      return res.status(404).json({ error: `Ficha ${ficheNumber} no estaba en la lista de fallidas` });
    }

    // Verificar si ya está excluida
    const existing = await FicheOmission.findOne({ ficheNumber });
    if (!existing) {
      // Agregar a FicheOmission con el error como razón
      await FicheOmission.create({
        ficheNumber,
        reason: `Falla al descargar: ${deleted.error || 'Error desconocido'}`
      });
    }

    res.json({
      success: true,
      message: `Ficha ${ficheNumber} omitida y agregada a fichas excluidas`,
      data: deleted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/auditoria/resumen-sede
 * Devuelve el resumen de fichas del run más reciente (categorías AL DÍA, SNC, SIN PROGRAMAR, etc.)
 */
export async function getResumenSede(req, res) {
  try {
    const state = await getCurrentAuditState();

    if (!state.runs || !state.runs.length) {
      return res.json({
        msg: 'No hay ejecuciones registradas todavía',
        data: { fichas: [], estadisticas: {} },
        executionDate: null
      });
    }

    const latest = state.runs[0];
    const fichas = latest.fichesSummary || [];

    const estadisticas = {
      totalFichas: fichas.length,
      fichasConSnc: fichas.filter(f => f.estadoGeneral !== 'AL DÍA').length,
      fichasAlDia: fichas.filter(f => f.estadoGeneral === 'AL DÍA').length,
      rapsTotal: fichas.reduce((s, f) => s + (f.rapsTotal || 0), 0),
      rapsAlDia: fichas.reduce((s, f) => s + (f.alDia || 0), 0),
      rapsAunNoVence: fichas.reduce((s, f) => s + (f.aunNoVence || 0), 0),
      rapsSncParcial: fichas.reduce((s, f) => s + (f.sncParcial || 0), 0),
      rapsSncCritico: fichas.reduce((s, f) => s + (f.sncCritico || 0), 0),
      rapsSinProgramar: fichas.reduce((s, f) => s + (f.sinProgramar || 0), 0)
    };

    res.json({
      msg: 'Resumen sede obtenido correctamente',
      data: { fichas, estadisticas },
      executionDate: latest.executionDate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo resumen sede', error: error.message });
  }
}

/**
 * GET /api/auditoria/resumen-sede/excel
 * Descarga el resumen de fichas como archivo XLSX
 */
export async function getResumenSedeExcel(req, res) {
  try {
    const state = await getCurrentAuditState();

    if (!state.runs || !state.runs.length) {
      return res.status(404).json({ msg: 'No hay ejecuciones registradas todavía' });
    }

    const latest = state.runs[0];
    const runNumber = state.runs.length; // 1 o 2 según cuántos runs hay

    const buffer = await generateResumenSedeXLSX({
      fichesSummary: latest.fichesSummary || [],
      executionDate: latest.executionDate,
      runNumber,
      pendientes: latest.pendientes || [],
      vencidos:   latest.vencidos   || [],
    });

    const fechaStr = new Date(latest.executionDate).toISOString().split('T')[0];
    const filename = `resumen-sede-${fechaStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ msg: 'Error generando Excel', error: error.message });
  }
}

/**
 * GET /api/auditoria/excel/zip
 * Descarga ZIP con un XLSX por coordinación + el archivo general
 */
export async function getResumenPorCoordinacionZIP(req, res) {
  try {
    const state = await getCurrentAuditState();

    if (!state.runs || !state.runs.length) {
      return res.status(404).json({ msg: 'No hay ejecuciones registradas todavía' });
    }

    const latest = state.runs[0];
    const zipBuffer = await generateResumenPorCoordinacionZIP({
      fichesSummary: latest.fichesSummary || [],
      executionDate: latest.executionDate,
      runNumber:     state.runs.length,
      pendientes:    latest.pendientes || [],
      vencidos:      latest.vencidos   || [],
    });

    const fechaStr = new Date(latest.executionDate).toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="resumen-coordinaciones-${fechaStr}.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).json({ msg: 'Error generando ZIP', error: error.message });
  }
}

/**
 * GET /api/auditoria/comparacion
 * Compara los 2 últimos runs: fichas mejoradas, empeoradas y sin cambio
 */
export async function getComparacion(req, res) {
  try {
    const doc = await (await import('../models/CurrentAuditState.js')).default.findOne();

    if (!doc || doc.runs.length < 2) {
      return res.json({
        msg: doc?.runs?.length === 1
          ? 'Solo hay una ejecución registrada. Se necesitan al menos 2 para comparar.'
          : 'No hay ejecuciones registradas todavía',
        data: null
      });
    }

    const [latest, previous] = doc.runs;
    const latestMap = new Map((latest.fichesSummary || []).map(f => [f.ficheNumber, f]));
    const previousMap = new Map((previous.fichesSummary || []).map(f => [f.ficheNumber, f]));

    const allFicheNumbers = new Set([...latestMap.keys(), ...previousMap.keys()]);
    const comparison = [];

    for (const ficheNumber of allFicheNumbers) {
      const curr = latestMap.get(ficheNumber);
      const prev = previousMap.get(ficheNumber);

      if (!curr) {
        comparison.push({ ficheNumber, cambio: 'RESUELTA', anterior: prev, actual: null });
        continue;
      }
      if (!prev) {
        comparison.push({ ficheNumber, cambio: 'NUEVA', anterior: null, actual: curr });
        continue;
      }

      const snc_curr = (curr.sncParcial || 0) + (curr.sncCritico || 0);
      const snc_prev = (prev.sncParcial || 0) + (prev.sncCritico || 0);
      const delta = snc_prev - snc_curr;

      let cambio = 'SIN CAMBIO';
      if (delta > 0) cambio = 'MEJORÓ';
      else if (delta < 0) cambio = 'EMPEORÓ';

      comparison.push({ ficheNumber, cambio, delta, anterior: prev, actual: curr });
    }

    const resumen = {
      mejoraron: comparison.filter(c => c.cambio === 'MEJORÓ').length,
      empeoraron: comparison.filter(c => c.cambio === 'EMPEORÓ').length,
      sinCambio: comparison.filter(c => c.cambio === 'SIN CAMBIO').length,
      resueltas: comparison.filter(c => c.cambio === 'RESUELTA').length,
      nuevas: comparison.filter(c => c.cambio === 'NUEVA').length
    };

    res.json({
      msg: 'Comparación generada correctamente',
      data: {
        fechaAnterior: previous.executionDate,
        fechaActual: latest.executionDate,
        resumen,
        detalle: comparison
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error generando comparación', error: error.message });
  }
}
