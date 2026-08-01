import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
      return NOMBRES_DIA_ISO[texto] || texto;
    });
}

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

// 🟢 NUEVA LÓGICA: Extrae los límites de fechas filtrando las sesiones reales del array `events`
function obtenerLimitesDesdeEventos(events, fstart, fend) {
  const { inicioMes, finMes } = obtenerLimitesMesActual();

  // 1. Intentar filtrar fechas reales dentro de Julio desde 'events'
  if (events && Array.isArray(events) && events.length > 0) {
    const eventosDelMes = events
      .map(e => new Date(e.$date || e))
      .filter(d => d >= inicioMes && d <= finMes)
      .sort((a, b) => a - b);

    if (eventosDelMes.length > 0) {
      return {
        inicioRecortado: eventosDelMes[0],                   // Primer martes del mes (ej. 07/07/2026)
        finRecortado: eventosDelMes[eventosDelMes.length - 1] // Último martes del mes
      };
    }
  }

  // 2. Fallback de respaldo si 'events' no traía fechas en este mes
  const inicioEvento = new Date(fstart);
  const finEvento = new Date(fend);

  const seSuperponeConElMes = inicioEvento <= finMes && finEvento >= inicioMes;
  if (!seSuperponeConElMes) return null;

  return {
    inicioRecortado: inicioEvento < inicioMes ? inicioMes : inicioEvento,
    finRecortado: finEvento > finMes ? finMes : finEvento
  };
}

export async function conectarDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URL, { dbName: 'Horarios_SENA' });
  }
}

export async function desconectarDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function obtenerProgramacionesMesActual() {
  await conectarDB();
  const db = mongoose.connection.db;

  const schedules = db.collection('schedules');
  const fiches = db.collection('fiches');
  const environments = db.collection('environments');
  const instructors = db.collection('instructors');

  const todosLosSchedules = await schedules.find({}).toArray();

  const eventosDelMes = [];

  for (const schedule of todosLosSchedules) {
    // 🟢 Pasamos schedule.events junto con fstart y fend
    const rango = obtenerLimitesDesdeEventos(schedule.events, schedule.fstart, schedule.fend);
    if (!rango) continue; 

    const fiche = await fiches.findOne({ _id: schedule.fiche });
    const environment = await environments.findOne({ _id: schedule.environment });
    const instructor = await instructors.findOne({ _id: schedule.instructor });

    eventosDelMes.push({
      idSchedule: schedule._id,
      ficha: fiche?.number || process.env.SOFIA_FICHA,
      ambiente: environment?.name || '',
      fechaInicio: formatearFechaSofia(rango.inicioRecortado),
      fechaFin: formatearFechaSofia(rango.finRecortado),
      horaInicio: schedule.tstart,
      horaFin: schedule.tend,
      dias: normalizarDias(schedule.days),
      descripcion: construirDescripcion(schedule, fiche),
      instructor: instructor ? {
        nombre: instructor.name,
        documento: instructor.numdocument,
        email: instructor.email
      } : null
    });
  }

  if (eventosDelMes.length === 0) {
    throw new Error('No hay eventos del mes actual por registrar.');
  }

  return eventosDelMes;
}