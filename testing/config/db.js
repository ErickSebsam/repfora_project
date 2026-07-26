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

function normalizarDias(dias) {
  if (!dias) return [];
  const listaDias = Array.isArray(dias) ? dias : String(dias).split(',');
  return listaDias
    .filter(d => d !== null && d !== undefined)
    .map(d => String(d).trim().toLowerCase());
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

export async function obtenerProgramacion() {
  await conectarDB();
  const db = mongoose.connection.db;

  const schedules = db.collection('schedules');
  const fiches = db.collection('fiches');
  const environments = db.collection('environments');
  const instructors = db.collection('instructors');

  const schedule = await schedules.findOne({
    $or: [{ estado: { $exists: false } }, { estado: false }]
  });

  if (!schedule) {
    throw new Error(`No hay eventos pendientes por registrar.`);
  }

  const fiche = await fiches.findOne({ _id: schedule.fiche });
  const environment = await environments.findOne({ _id: schedule.environment });
  const instructor = await instructors.findOne({ _id: schedule.instructor });

  return {
    idSchedule: schedule._id,
    ficha: fiche?.number || process.env.SOFIA_FICHA,
    ambiente: environment?.name || '',
    fechaInicio: formatearFechaSofia(schedule.fstart),
    fechaFin: formatearFechaSofia(schedule.fend),
    horaInicio: schedule.tstart,
    horaFin: schedule.tend,
    dias: normalizarDias(schedule.days),
    descripcion: schedule.activityDescription || `Formación Ficha ${fiche?.number}`,
    instructor: instructor ? {
      nombre: instructor.name,
      documento: instructor.numdocument,
      email: instructor.email
    } : null
  };
}