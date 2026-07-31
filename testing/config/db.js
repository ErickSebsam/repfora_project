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

// SOFIA espera el checkbox de días con estos valores exactos.
// La colección "schedules" guarda los días como números (1=lunes ... 7=domingo, ISO 8601).
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
      // Si ya viene como nombre de día (p.ej. "lunes"), se deja igual;
      // si viene como número (1-7), se traduce al nombre que usa SOFIA.
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

// Límites (UTC) del mes actual: primer y último día, ambos con hora completa.
function obtenerLimitesMesActual() {
  const ahora = new Date();
  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1, 0, 0, 0, 0));
  const finMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { inicioMes, finMes };
}

// Una serie de schedules puede empezar en un mes y terminar en otro.
// Esta función determina si la serie se solapa con el mes actual y,
// si es así, recorta fstart/fend a los límites del mes actual para
// que solo se registren en Sofia las sesiones de este mes.
function recortarAlMesActual(fstart, fend) {
  const { inicioMes, finMes } = obtenerLimitesMesActual();

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

// Trae todas las series de "schedules" que se solapan con el mes actual.
// Por cada una devuelve las fechas ya recortadas a los límites del mes,
// para que la serie que cruza de un mes a otro solo aporte las sesiones
// que corresponden al mes en curso.
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
    const rango = recortarAlMesActual(schedule.fstart, schedule.fend);
    if (!rango) continue; // La serie no toca el mes actual, se ignora

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