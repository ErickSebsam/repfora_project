import Schedule from '../models/Schedule.js';
import Fiche from '../models/Fiche.js';
import Instructor from '../models/Instructor.js';
import LearnerOmission from '../models/LearnerOmission.js';
import FicheOmission from '../models/FicheOmission.js';
// import Outcome from '../models/Outcomes.js';

const PROCESS_NAME = 'audit_outcomes_process';

/**
 * Calcula la fecha límite (Hoy - 5 días)
 */
const getLimitDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Obtiene y agrupa los horarios que deben ser auditados.
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.ficheId - ID de ficha específica para filtrar en la query
 */
export async function getAuditableGroups({ ficheId } = {}) {
  const limitDate = getLimitDate();
  console.log(limitDate);

  const query = {
    fend: { $lt: limitDate },
    rated: { $ne: true },
    qualifiable: { $ne: false },
  };

  if (ficheId) {
    query.fiche = ficheId;
  }

  const candidates = await Schedule.find(query)
    .populate('outcome')
    .populate({
      path: 'fiche',
      populate: [
        { path: 'owner' },
        { path: 'coordination', populate: { path: 'coordinator' } },
        { path: 'program', select: 'name' }
      ]
    })
    .populate('instructor')
    .lean();


  if (!candidates.length) return [];

  const candidateIds = candidates.map(c => c._id);
  const allOmissions = await LearnerOmission.find({
    schedule: { $in: candidateIds }
  }).lean();

  // --- PASO 1: Agrupar por fiche + outcome para detectar duplicados ---
  const groupsByKey = {};

  for (const schedule of candidates) {
    if (!schedule.outcome || !schedule.fiche) continue;

    const outcomeId = schedule.outcome._id.toString();
    const ficheId = schedule.fiche._id.toString();
    const key = `${ficheId}|${outcomeId}`;

    if (!groupsByKey[key]) {
      groupsByKey[key] = [];
    }

    groupsByKey[key].push(schedule);
  }

  // --- PASO 2: Buscar en BATCH todas las programaciones más recientes (fuera de la fecha límite) ---
  // Recopilar todas las combinaciones fiche+outcome únicas para una sola consulta
  const ficheOutcomePairs = Object.entries(groupsByKey).map(([key]) => {
    const [fId, oId] = key.split('|');
    return { fiche: fId, outcome: oId };
  });

  // Una sola consulta para TODOS los schedules más recientes (en lugar de N consultas individuales)
  const orConditions = ficheOutcomePairs.map(p => ({ fiche: p.fiche, outcome: p.outcome }));
  const allNewerSchedules = orConditions.length > 0
    ? await Schedule.find({
        $or: orConditions,
        rated: { $ne: true },
        qualifiable: { $ne: false },
        fend: { $gte: limitDate }
      })
      .select('_id fend fiche outcome')
      .lean()
    : [];

  // Indexar por fiche|outcome para acceso rápido
  const newerByKey = {};
  for (const s of allNewerSchedules) {
    const key = `${s.fiche.toString()}|${s.outcome.toString()}`;
    if (!newerByKey[key]) newerByKey[key] = [];
    newerByKey[key].push(s);
  }

  console.log(`[DEDUP] ${Object.keys(groupsByKey).length} grupos, ${allNewerSchedules.length} schedules más recientes encontrados (1 consulta batch)`);

  const latestScheduleIds = new Set();
  const schedulesToDisable = [];

  for (const [key, schedules] of Object.entries(groupsByKey)) {
    // Ordenar por fend descendente
    schedules.sort((a, b) => new Date(b.fend).getTime() - new Date(a.fend).getTime());

    const newerSchedules = newerByKey[key] || [];

    if (newerSchedules.length === 0) {
      // No hay programaciones más recientes, usar el más reciente del query
      latestScheduleIds.add(schedules[0]._id.toString());

      for (let i = 1; i < schedules.length; i++) {
        schedulesToDisable.push(schedules[i]._id);
        console.log(`Schedule ${schedules[i]._id} (${new Date(schedules[i].fend).toISOString().split('T')[0]}) marcado como no calificable: existe uno más reciente en query (${schedules[0]._id}, ${new Date(schedules[0].fend).toISOString().split('T')[0]})`);
      }
    } else {
      // Hay programaciones más recientes, encontrar la verdadera más reciente entre todas
      const allSchedules = [...schedules, ...newerSchedules];
      allSchedules.sort((a, b) => new Date(b.fend).getTime() - new Date(a.fend).getTime());

      const latest = allSchedules[0];
      latestScheduleIds.add(latest._id.toString());

      // Marcar los del query original que no son el más reciente
      schedules.forEach(s => {
        if (s._id.toString() !== latest._id.toString()) {
          schedulesToDisable.push(s._id);
          console.log(`Schedule ${s._id} (${new Date(s.fend).toISOString().split('T')[0]}) marcado como no calificable: existe uno más reciente (${latest._id}, ${new Date(latest.fend).toISOString().split('T')[0]})`);
        }
      });
    }
  }

  // --- PASO 3: Desactivar en BD los schedules antiguos ---
  if (schedulesToDisable.length > 0) {
    await Schedule.updateMany(
      { _id: { $in: schedulesToDisable } },
      { $set: { qualifiable: false } }
    );
    console.log(`[UNIFICACION] ${schedulesToDisable.length} schedules marcados como no calificables por duplicidad.`);
  }

  // --- PASO 4: Excluir fichas omitidas manualmente ---
  const omittedFiches = await FicheOmission.find().select('ficheNumber').lean();
  const omittedFicheNumbers = new Set(omittedFiches.map(o => o.ficheNumber));
  if (omittedFicheNumbers.size > 0) {
    console.log(`[FICHE_OMISSION] ${omittedFicheNumbers.size} fichas omitidas: ${[...omittedFicheNumbers].join(', ')}`);
  }

  // --- PASO 5: Construir grupos válidos solo con los schedules más recientes ---
  const validGroups = {};

  for (const schedule of candidates) {
    // Solo procesar si es uno de los schedules más recientes
    if (!latestScheduleIds.has(schedule._id.toString())) {
      continue;
    }

    if (!schedule.outcome || !schedule.fiche) continue;

    const ficheNum = schedule.fiche.number;

    // Saltar fichas omitidas manualmente
    if (omittedFicheNumbers.has(ficheNum)) continue;

    const omissionsForThisSchedule = allOmissions
      .filter(o => o.schedule.toString() === schedule._id.toString())
      .map(o => o.documentNumber);

    if (!validGroups[ficheNum]) {
      validGroups[ficheNum] = {
        ficheNumber: ficheNum,
        ficheId: schedule.fiche._id,
        instructor: schedule.instructor,
        ficheOwner: schedule.fiche?.owner || null,
        coordination: schedule.fiche?.coordination || null,
        programName: schedule.fiche?.program?.name || '',
        schedules: []
      };
    }

    validGroups[ficheNum].schedules.push({
      scheduleId: schedule._id,
      outcomeText: schedule.outcome.outcomes,
      fend: schedule.fend,
      omittedLearners: omissionsForThisSchedule,
      instructor: schedule.instructor
    });
  }

  return Object.values(validGroups);
}

/**
 * Marca una programación como calificada (Rated).
 * También elimina las omisiones de aprendices asociadas ya que no volverán a ser auditadas.
 */
export async function markAsRated(scheduleId, dateRating) {
  // Primero eliminar las omisiones asociadas a este schedule
  try {
    const deleteResult = await LearnerOmission.deleteMany({ schedule: scheduleId });
    if (deleteResult.deletedCount > 0) {
      console.log(`[CLEAN_OMISSIONS] Eliminadas ${deleteResult.deletedCount} omisiones del schedule ${scheduleId} (marcado como calificado)`);
    }
  } catch (error) {
    console.error(`[CLEAN_OMISSIONS] Error eliminando omisiones del schedule ${scheduleId}:`, error.message);
  }

  // Luego marcar el schedule como calificado
  return Schedule.updateOne(
    { _id: scheduleId },
    {
      $set: {
        rated: true,
        // Al marcarlo como rated, también aseguramos que qualifiable quede explícito en true
        // (aunque ya no importa mucho porque rated=true lo saca del query inicial)
        qualifiable: true,
        dateRating: dateRating || new Date(),
        ratedByProcess: PROCESS_NAME,
        statusRating: 'Calificado'
      }
    }
  );
}

/**
 * Obtiene estadísticas de los schedules de una ficha para calcular las categorías del resumen.
 * @param {string|ObjectId} ficheId - ID de la ficha
 * @param {Date} now - Fecha de referencia (default: ahora)
 * @returns {{ alDia, aunNoVence, allScheduleOutcomeTexts }}
 */
export async function getFicheScheduleSummary(ficheId, now = new Date()) {
  const [alDia, aunNoVence, allSchedules] = await Promise.all([
    Schedule.countDocuments({ fiche: ficheId, rated: true }),
    Schedule.countDocuments({ fiche: ficheId, rated: { $ne: true }, qualifiable: { $ne: false }, fend: { $gt: now } }),
    Schedule.find({ fiche: ficheId, qualifiable: { $ne: false } })
      .populate('outcome', 'outcomes')
      .select('outcome rated fend')
      .lean()
  ]);

  return { alDia, aunNoVence, allSchedules };
}