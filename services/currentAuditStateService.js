import CurrentAuditState from '../models/CurrentAuditState.js';
import LearnerOmission from '../models/LearnerOmission.js';

const MAX_RUNS = 2;

/**
 * Construye un objeto de resultado pendiente/vencido para el estado actual
 */
export function buildOutcomeState({
  scheduleId,
  ficheNumber,
  ficheId,
  outcomeText,
  fend,
  missingLearners,
  totalLearners,
  isTotalMissing,
  daysOverdue,
  instructorName,
  instructorEmail,
  ficheOwnerName,
  ficheOwnerEmail,
  isVencido
}) {
  return {
    scheduleId,
    ficheNumber,
    ficheId,
    outcomeText,
    fend,
    missingLearners: missingLearners || [],
    totalLearners,
    isTotalMissing,
    daysOverdue,
    missingCount: missingLearners?.length || 0,
    instructorName,
    instructorEmail,
    ficheOwnerName,
    ficheOwnerEmail,
    isVencido
  };
}

/**
 * Filtra los aprendices omitidos de la lista de missingLearners
 */
export function filterOmittedLearners(missingLearners, omittedDocuments) {
  if (!omittedDocuments || omittedDocuments.length === 0) {
    return missingLearners;
  }
  return missingLearners.filter(l => !omittedDocuments.includes(l.document));
}

/**
 * Guarda una nueva ejecución de auditoría manteniendo solo las últimas MAX_RUNS.
 * Reemplaza el registro único anterior (upsert).
 *
 * @param {Array} pendientes - Resultados pendientes
 * @param {Array} vencidos - Resultados vencidos
 * @param {Array} fichesSummary - Resumen por ficha con las nuevas categorías
 */
export async function updateCurrentAuditState(pendientes = [], vencidos = [], fichesSummary = []) {
  const totalAprendicesSinNota = pendientes.reduce((sum, p) => sum + (p.missingCount || 0), 0);

  const newRun = {
    executionDate: new Date(),
    fichesSummary,
    pendientes,
    vencidos,
    estadisticas: {
      totalPendientes: pendientes.length,
      totalVencidos: vencidos.length,
      totalAprendicesSinNota
    }
  };

  // Obtener el documento actual para mantener el historial
  let doc = await CurrentAuditState.findOne();

  if (!doc) {
    doc = new CurrentAuditState({ runs: [] });
  }

  // Agregar el nuevo run al inicio y conservar solo los últimos MAX_RUNS
  doc.runs.unshift(newRun);
  if (doc.runs.length > MAX_RUNS) {
    doc.runs = doc.runs.slice(0, MAX_RUNS);
  }
  doc.ultimaActualizacion = new Date();

  await doc.save();

  console.log(`[AUDIT_STATE] Ejecución guardada. Total runs: ${doc.runs.length}/${MAX_RUNS}. Pendientes: ${pendientes.length}, Vencidos: ${vencidos.length}, Fichas resumidas: ${fichesSummary.length}`);

  return newRun.estadisticas;
}

/**
 * Obtiene el estado actual (run más reciente)
 */
export async function getCurrentAuditState() {
  const doc = await CurrentAuditState.findOne();
  if (!doc || !doc.runs.length) {
    return {
      runs: [],
      pendientes: [],
      vencidos: [],
      fichesSummary: [],
      ultimaActualizacion: null,
      estadisticas: { totalPendientes: 0, totalVencidos: 0, totalAprendicesSinNota: 0 }
    };
  }
  const latest = doc.runs[0];
  return {
    runs: doc.runs,
    pendientes: latest.pendientes,
    vencidos: latest.vencidos,
    fichesSummary: latest.fichesSummary,
    ultimaActualizacion: doc.ultimaActualizacion,
    estadisticas: latest.estadisticas
  };
}

/**
 * Elimina un resultado del estado actual (cuando se califica manualmente)
 */
export async function removeOutcomeFromState(scheduleId) {
  const doc = await CurrentAuditState.findOne();
  if (!doc || !doc.runs.length) return null;

  const latest = doc.runs[0];
  const prevPendientes = latest.pendientes.length;
  const prevVencidos = latest.vencidos.length;

  latest.pendientes = latest.pendientes.filter(p => p.scheduleId?.toString() !== scheduleId?.toString());
  latest.vencidos = latest.vencidos.filter(v => v.scheduleId?.toString() !== scheduleId?.toString());

  const removed = (prevPendientes - latest.pendientes.length) + (prevVencidos - latest.vencidos.length);
  if (removed > 0) {
    latest.estadisticas.totalPendientes = latest.pendientes.length;
    latest.estadisticas.totalVencidos = latest.vencidos.length;
    doc.ultimaActualizacion = new Date();
    await doc.save();
  }

  return doc;
}
