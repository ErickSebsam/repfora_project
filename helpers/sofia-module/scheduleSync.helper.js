/**
 * Trae las series de la colección "schedules" que se solapan con el mes en curso
 * y las deja listas para registrarlas como evento en SOFIA Plus (formato de
 * fechas dd/mm/yyyy, días traducidos a los nombres que usa el checkbox de SOFIA,
 * descripción armada a partir de supporttext/observation).
 *
 * Migrado desde testing/config/db.js, adaptado para usar los modelos Mongoose
 * ya existentes en el proyecto (no abre/cierra su propia conexión: reutiliza
 * la conexión global que arranca dbConnection() en server.js).
 */
import Schedule from '../../models/Schedule.js';
import '../../models/Fiche.js';
import '../../models/Environment.js';
import '../../models/Instructor.js';
function formatearFechaSofia(fechaInput) {
  if (!fechaInput) return '';
  let fechaObj;

  if (fechaInput instanceof Date) {
    fechaObj = fechaInput;
  } else if (typeof fechaInput === 'string') {
    const parteFecha = fechaInput.split('T')[0];
    const [year, month, day] = parteFecha.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  } else {
    fechaObj = new Date(fechaInput);
  }

  const day = String(fechaObj.getUTCDate()).padStart(2, '0');
  const month = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
  const year = fechaObj.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

// SOFIA espera el checkbox de días con estos valores exactos.
// La colección "schedules" guarda los días como números (1=lunes ... 7=domingo).
const NOMBRES_DIA_ISO = {
  '1': 'lunes',
  '2': 'martes',
  '3': 'miercoles',
  '4': 'jueves',
  '5': 'viernes',
  '6': 'sabado',
  '7': 'domingo',
};

function normalizarDias(dias) {
  if (!dias) return [];
  const listaDias = Array.isArray(dias) ? dias : String(dias).split(',');
  return listaDias
    .filter(d => d !== null && d !== undefined)
    .map(d => {
      const texto = String(d).trim().toLowerCase();
      // Si ya viene como nombre de día se deja igual; si viene como número (1-7)
      // se traduce al nombre que usa SOFIA.
      return NOMBRES_DIA_ISO[texto] || texto;
    });
}

// El schedule no tiene un campo único de descripción; se arma a partir de
// supporttext (ej. "INDUCCION") y observation (ej. "JORNADA NOCHE").
function construirDescripcion(schedule, fiche) {
  const partes = [schedule.supporttext, schedule.observation]
    .map(p => (p || '').trim())
    .filter(Boolean);

  if (partes.length > 0) return partes.join(' - ');
  return `Formación Ficha ${fiche?.number}`;
}

function obtenerLimitesMesActual() {
  const ahora = new Date();
  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1, 0, 0, 0, 0));
  const finMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { inicioMes, finMes };
}

// Una serie de schedules puede empezar en un mes y terminar en otro, y no
// necesariamente ocurre todos los días entre fstart y fend. Por eso se usan
// las fechas reales de "events" (las sesiones puntuales) para recortar al
// mes actual; si "events" no trae nada de este mes, se cae al rango fstart/fend.
function obtenerLimitesDesdeEventos(events, fstart, fend) {
  const { inicioMes, finMes } = obtenerLimitesMesActual();

  if (events && Array.isArray(events) && events.length > 0) {
    const eventosDelMes = events
      .map(e => new Date(e))
      .filter(d => d >= inicioMes && d <= finMes)
      .sort((a, b) => a - b);

    if (eventosDelMes.length > 0) {
      return {
        inicioRecortado: eventosDelMes[0],
        finRecortado: eventosDelMes[eventosDelMes.length - 1],
      };
    }
  }

  const inicioEvento = new Date(fstart);
  const finEvento = new Date(fend);

  const seSuperponeConElMes = inicioEvento <= finMes && finEvento >= inicioMes;
  if (!seSuperponeConElMes) return null;

  return {
    inicioRecortado: inicioEvento < inicioMes ? inicioMes : inicioEvento,
    finRecortado: finEvento > finMes ? finMes : finEvento,
  };
}

/**
 * Trae todas las series de "schedules" que se solapan con el mes actual,
 * ya listas (fechas recortadas y formateadas, días traducidos, descripción
 * armada) para registrarlas en SOFIA.
 * @returns {Promise<Array>} Eventos del mes; arreglo vacío si no hay ninguno.
 */
export async function obtenerProgramacionesMesActual() {
  const todosLosSchedules = await Schedule.find({})
    .populate('fiche')
    .populate('environment')
    .populate('instructor')
    .lean();

  const eventosDelMes = [];

  for (const schedule of todosLosSchedules) {
    const rango = obtenerLimitesDesdeEventos(schedule.events, schedule.fstart, schedule.fend);
    if (!rango) continue;

    const fiche = schedule.fiche;
    const instructor = schedule.instructor;

    eventosDelMes.push({
      idSchedule: schedule._id,
      ficha: fiche?.number || process.env.SOFIA_FICHA,
      ambiente: schedule.environment?.name || '',
      fechaInicio: formatearFechaSofia(rango.inicioRecortado),
      fechaFin: formatearFechaSofia(rango.finRecortado),
      horaInicio: schedule.tstart,
      horaFin: schedule.tend,
      dias: normalizarDias(schedule.days),
      descripcion: construirDescripcion(schedule, fiche),
      instructor: instructor
        ? {
            nombre: instructor.name,
            documento: instructor.numdocument,
            email: instructor.email,
          }
        : null,
    });
  }

  return eventosDelMes;
}
