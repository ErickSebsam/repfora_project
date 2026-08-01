import Instructor from "../models/Instructor.js";
import { Types } from "mongoose";
import ComplementaryCatalog from "../models/ComplementaryCatalog.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";
import Schedule from "../models/Schedule.js";
import User from "../models/User.js";
import { coordinationHelper } from "./coordination.helper.js";
// Imports de las secciones unificadas (antes en archivos separados):
import ComplementaryParametro from "../models/ComplementaryParametro.js";
import { dateFormater } from "../utils/functions/dates.js";
import fs from "fs";
import * as XLSX from "xlsx/xlsx.mjs";
import { PDFParse } from "pdf-parse";

// xlsx (usado por parseDF14) requiere vincular fs explícitamente en ESM.
XLSX.set_fs(fs);

// ============================================================================
// Este archivo concentra TODOS los helpers del módulo de Complementarias
// (convención del proyecto: "1 módulo = 1 archivo de helpers", igual que el
// controller y las rutas). Secciones:
//   1) complementaryHelper           — validaciones generales / acceso / estados
//   2) complementaryScheduleHelper   — horarios y programación
//   3) complementaryAuditHelper      — auditoría DF-14 (parseo Excel)
//   4) complementaryParametroHelper  — parámetros (tipos de programa/población)
//   5) complementaryExtractor        — extracción de competencias desde PDF PRF
// ============================================================================

const complementaryHelper = {};

complementaryHelper.findInstructorByEmail = async (emailOrId) => {
  try {
    let query;
    if (Types.ObjectId.isValid(emailOrId)) {
      query = { _id: emailOrId, status: 0 };
    } else {
      query = {
        $or: [
          { email: { $regex: `^${emailOrId}$`, $options: "i" } },
          { emailpersonal: { $regex: `^${emailOrId}$`, $options: "i" } },
        ],
        status: 0,
      };
    }
    const instructor = await Instructor.findOne(query);
    return instructor;
  } catch (error) {
    throw new Error("Error al buscar instructor");
  }
};

complementaryHelper.generateSixDigitCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

complementaryHelper.validateCodeMatch = (accessCode, accessCodeCreatedAt, inputCode) => {
  if (!accessCode) {
    throw new Error("No tiene codigo de verificacion activo");
  }
  if (accessCode !== inputCode) {
    throw new Error("Codigo de verificacion incorrecto");
  }
  const now = new Date();
  const expiration = new Date(accessCodeCreatedAt.getTime() + 5 * 60 * 1000);
  if (now > expiration) {
    throw new Error("El codigo de verificacion ha expirado");
  }
};

complementaryHelper.clearAccessCode = async (instructor) => {
  try {
    instructor.accessCode = null;
    instructor.accessCodeCreatedAt = null;
    await instructor.save();
  } catch (error) {
    throw new Error("Error al limpiar codigo de acceso");
  }
};

complementaryHelper.validateExistCatalogById = async (id) => {
  try {
    const catalog = await ComplementaryCatalog.findById(id, { status: 0 });
    if (!catalog) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("El curso del catálogo no existe");
  }
};

complementaryHelper.validateExistRequestById = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La solicitud no existe");
  }
};

complementaryHelper.validateRequestOwner = async (id, instructorEmail) => {
  try {
    const instructor = await complementaryHelper.findInstructorByEmail(
      instructorEmail
    );
    if (!instructor) {
      throw new Error();
    }
    const request = await ComplementaryRequest.findById(id);
    if (!request) {
      throw new Error();
    }
    // Verificar si el instructor es el principal o está en el array de instructores
    const esPrincipal = request.instructor.toString() === instructor._id.toString();
    const enArray = request.instructores.some(
      (i) => i.instructor.toString() === instructor._id.toString()
    );
    if (!esPrincipal && !enArray) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La solicitud no pertenece al instructor");
  }
};

complementaryHelper.validateRequestRejected = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id);
    if (!request || request.state !== "RECHAZADA") {
      throw new Error();
    }
  } catch (error) {
    throw new Error("La solicitud no está en estado RECHAZADA");
  }
};

complementaryHelper.validateRequestPending = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    if (request.state !== "PENDIENTE") throw new Error();
  } catch (error) {
    throw new Error("La solicitud no existe o no está en estado PENDIENTE");
  }
};

// ==================== RF-05: Asignación de ficha ====================

complementaryHelper.validateRequestApproved = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    if (request.state !== "APROBADA") throw new Error();
  } catch (error) {
    throw new Error("La solicitud no existe o no está en estado APROBADA");
  }
};

complementaryHelper.validateFichaNumberUnique = async (fichaNumber, excludeId = "") => {
  try {
    const existing = await ComplementaryRequest.findOne({
      fichaNumber: fichaNumber.toUpperCase().trim(),
      status: 0,
      state: { $nin: ["CANCELADA"] },
    });
    if (existing) {
      if (excludeId && existing._id.toString() === excludeId) return;
      throw new Error();
    }
  } catch (error) {
    throw new Error("El número de ficha ya está asignado a otra solicitud activa");
  }
};

complementaryHelper.validateStateTransition = async (id, newState) => {
  const validTransitions = {
    PENDIENTE: ["CANCELADA"],
    RECHAZADA: ["CANCELADA"],
    APROBADA: ["FICHA_ASIGNADA", "CANCELADA"],
    FICHA_ASIGNADA: ["INSCRIPCION", "CANCELADA"],
    INSCRIPCION: ["MATRICULADA", "CANCELADA"],
    MATRICULADA: ["PROGRAMADA", "CANCELADA"],
    PROGRAMADA: ["EJECUCION", "CANCELADA"],
    EJECUCION: ["CERRADA", "CANCELADA"],
  };
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    const allowed = validTransitions[request.state];
    if (!allowed || !allowed.includes(newState)) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("Transición de estado no válida");
  }
};

// ==================== Normalización y decodificación ====================

complementaryHelper.findComplementaryCoordinator = async () => {
  try {
    const coordination = await coordinationHelper.findCoordinationByName(
      "PROGRAMAS ESPECIALES",
      "coordinator"
    );
    return coordination?.coordinator || null;
  } catch (error) {
    throw new Error("Error al buscar coordinador de complementarias");
  }
};

complementaryHelper.findComplementaryProgrammers = async () => {
  try {
    const coordination = await coordinationHelper.findCoordinationByName(
      "PROGRAMAS ESPECIALES",
      "programmers"
    );
    return coordination?.programmers || [];
  } catch (error) {
    throw new Error("Error al buscar programadores de complementarias");
  }
};

// ==================== Coordinadores (desplegable supervisor) ====================

complementaryHelper.findAllCoordinators = async () => {
  try {
    return await User.find({ role: "COORDINADOR", status: 0 })
      .select("_id name email role")
      .sort({ name: 1 });
  } catch (error) {
    throw new Error("Error al buscar coordinadores");
  }
};

// ==================== Datos de formación (coordinador post-aprobación) ====================

complementaryHelper.validateFormationDataEditable = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) {
      throw new Error("La solicitud no existe");
    }
    if (request.state !== "APROBADA" && request.state !== "FICHA_ASIGNADA") {
      throw new Error("La solicitud debe estar en estado APROBADA o FICHA_ASIGNADA para agregar datos de formación");
    }
    if (request.formationDataCompleted) {
      throw new Error("Los datos de formación ya fueron completados para esta solicitud");
    }
  } catch (error) {
    if (
      error.message.includes("APROBADA") ||
      error.message.includes("completados") ||
      error.message.includes("no existe")
    ) {
      throw error;
    }
    throw new Error("Error al validar datos de formación");
  }
};

complementaryHelper.normalizeRequestFields = (body) => {
  const textFields = [
    "supervisorNombre",
    "ambienteNombre", "ambienteDireccion", "departamento", "municipio",
    "vereda", "direccion", "nombreEmpresa", "nitEmpresa",
    "contactoEmpresa", "telefonoEmpresa",
    "requisitosIngreso", "recursosNecesarios",
  ];
  // Campos con enum definido — solo trim, sin toUpperCase (ya vienen con el formato del enum)
  const enumFields = ["tipoPrograma", "tipoPoblacion"];
  const normalized = {};
  for (const field of textFields) {
    normalized[field] = (body[field] || "").toUpperCase().trim();
  }
  for (const field of enumFields) {
    if (body[field]) {
      normalized[field] = String(body[field]).trim();
    }
  }
  return normalized;
};

/**
 * Valida que la fecha de inicio de una solicitud sea de mínimo 7 días
 * posteriores al día en que se crea. Se compara por DÍA CALENDARIO
 * (normalizando ambas fechas a medianoche local) para que el resultado no
 * dependa de la hora del día ni de la zona horaria y sea predecible para
 * el usuario.
 *
 * Regla: fechaInicio >= (hoy a medianoche + 7 días).
 * Ej.: si hoy es 26-jun, la fecha mínima permitida es 03-jul (el día 7).
 *
 * @param {string|Date} fechaInicio - Fecha enviada en la solicitud (ISO 8601)
 * @throws {Error} si la fecha no cumple el mínimo de 7 días o no es válida
 */
complementaryHelper.validateFechaInicioMinima = (fechaInicio) => {
  const inicio = new Date(fechaInicio);
  if (isNaN(inicio.getTime())) {
    throw new Error("La fecha de inicio no es una fecha válida");
  }
  // Normalizar ambas a medianoche local para comparar solo día calendario
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioNormalizada = new Date(inicio);
  inicioNormalizada.setHours(0, 0, 0, 0);
  // Fecha mínima permitida = hoy + 7 días exactos
  const fechaMinima = new Date(hoy);
  fechaMinima.setDate(hoy.getDate() + 7);
  if (inicioNormalizada < fechaMinima) {
    throw new Error(
      "La fecha de inicio debe ser mínimo 7 días posterior a la fecha actual"
    );
  }
};

// ==================== Normalización de competencias (formato objeto rico) ====================

/**
 * Normaliza un array de competencias al formato de objeto rico del esquema.
 * Soporta formato legacy (string plano) y formato del extractor PDF (objetos con claves en inglés o español).
 * @param {Array} competencies - Array de competencias (strings u objetos)
 * @returns {Array} Array normalizado de objetos { nombre, codigo, horas, criterios }
 */
complementaryHelper.normalizeCompetencies = (competencies) => {
  if (!Array.isArray(competencies)) return [];
  return competencies.map((c) => {
    if (typeof c === "string") {
      return { nombre: c.toUpperCase().trim(), codigo: "", horas: 0, criterios: [] };
    }
    return {
      nombre: (c.name || c.nombre || "").toUpperCase().trim(),
      codigo: (c.code || c.codigo || "").toUpperCase().trim(),
      horas: Number(c.totalCompetenceHours || c.horas) || 0,
      criterios: Array.isArray(c.criteria || c.criterios)
        ? (c.criteria || c.criterios).map((cr) => String(cr).toUpperCase().trim())
        : [],
    };
  });
};

complementaryHelper.validateSesionesHours = (sesiones, prfDuracionMaxima) => {
  if (!sesiones || !sesiones.length) return;
  const total = sesiones.reduce((sum, s) => sum + (s.totalHoras || 0), 0);
  if (prfDuracionMaxima && total > prfDuracionMaxima) {
    throw new Error(`Las sesiones suman ${total} horas, pero la duracion maxima es ${prfDuracionMaxima}`);
  }
};

// ==================== RF-12: Evaluación de resultados (rated) ====================

complementaryHelper.validateRequestInExecution = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    if (request.state !== "EJECUCION" && request.state !== "PROGRAMADA") throw new Error();
    return request;
  } catch (error) {
    throw new Error("La solicitud no existe o no está en estado EJECUCION o PROGRAMADA");
  }
};

complementaryHelper.validateScheduleBelongsToRequest = async (requestId, scheduleId) => {
  try {
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      complementaryRequest: requestId,
      status: 0,
    });
    if (!schedule) throw new Error();
    if (schedule.rated) throw new Error("El resultado ya fue evaluado");
    return schedule;
  } catch (error) {
    if (error.message === "El resultado ya fue evaluado") throw error;
    throw new Error("El horario no existe o no pertenece a esta solicitud");
  }
};

// ==================== RF-12: Solicitud de ampliación de ficha ====================

complementaryHelper.validateNoPendingExtension = async (id) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    const hasPending = request.extensionRequests.some(
      (ext) => ext.status === "PENDIENTE"
    );
    if (hasPending) throw new Error();
  } catch (error) {
    if (error.message === "Ya existe una solicitud de ampliación pendiente para esta ficha") throw error;
    throw new Error("Ya existe una solicitud de ampliación pendiente para esta ficha");
  }
};

complementaryHelper.validateExtensionBelongsToRequest = async (id, extId) => {
  try {
    const request = await ComplementaryRequest.findById(id, { status: 0 });
    if (!request) throw new Error();
    const extension = request.extensionRequests.id(extId);
    if (!extension) throw new Error();
    if (extension.status !== "PENDIENTE") throw new Error("La solicitud de ampliación ya fue resuelta");
    return { request, extension };
  } catch (error) {
    if (error.message === "La solicitud de ampliación ya fue resuelta") throw error;
    throw new Error("La solicitud de ampliación no existe");
  }
};

// ==================== Múltiples instructores ====================

complementaryHelper.findInstructorById = async (id) => {
  try {
    const instructor = await Instructor.findById(id, { status: 0 });
    if (!instructor) {
      throw new Error();
    }
    return instructor;
  } catch (error) {
    throw new Error("El instructor no existe");
  }
};

complementaryHelper.validateInstructorBelongsToRequest = async (requestId, instructorId) => {
  try {
    const request = await ComplementaryRequest.findById(requestId);
    if (!request) {
      throw new Error("La solicitud no existe");
    }
    const esPrincipal = request.instructor.toString() === instructorId.toString();
    const enArray = request.instructores.some(
      (i) => i.instructor.toString() === instructorId.toString()
    );
    if (!esPrincipal && !enArray) {
      throw new Error("El instructor no pertenece a esta solicitud complementaria");
    }
  } catch (error) {
    if (
      error.message.includes("no pertenece") ||
      error.message.includes("no existe")
    ) {
      throw error;
    }
    throw new Error("Error al validar instructor en la solicitud");
  }
};

complementaryHelper.isInstructorInRequest = (request, instructorId) => {
  // Normaliza la referencia al instructor para soportar tanto refs SIN populate
  // (ObjectId) como refs CON populate (documento Mongoose). Antes se llamaba
  // .toString() directo sobre el ref, lo cual sobre un documento populateado NO
  // devuelve el _id y hacía fallar la comparación (bug: instructor dueño legítimo
  // recibía 401 en GET /requests/:id porque la solicitud venía populateada).
  const getInstructorId = (ref) => {
    if (!ref) return null;
    if (typeof ref === "string") return ref;
    return ref._id ? ref._id.toString() : ref.toString();
  };
  const targetId = instructorId ? instructorId.toString() : null;
  const principalId = getInstructorId(request.instructor);
  const esPrincipal = Boolean(principalId && principalId === targetId);
  const enArray = (request.instructores || []).some((i) => {
    const arrId = getInstructorId(i.instructor);
    return Boolean(arrId && arrId === targetId);
  });
  return esPrincipal || enArray;
};

// ============================================================================
// Sección 2: Horarios / programación de complementarias
// (antes helpers/complementarySchedule.helper.js)
// ============================================================================
const complementaryScheduleHelper = {};

complementaryScheduleHelper.validateRequestProgrammable = async (requestId) => {
  const request = await ComplementaryRequest.findById(requestId);
  if (!request) {
    throw new Error("La solicitud no existe");
  }
  if (request.status !== 0) {
    throw new Error("La solicitud está inactiva");
  }
  // MATRICULADA se incluye porque la programación/reprogramación del horario
  // es el paso que avanza MATRICULADA → PROGRAMADA (ver scheduleComplementary,
  // paso "Avanzar estado si es necesario (solo desde MATRICULADA)").
  const validStates = [
    "FICHA_ASIGNADA",
    "INSCRIPCION",
    "MATRICULADA",
    "PROGRAMADA",
  ];
  if (!validStates.includes(request.state)) {
    throw new Error(
      `La solicitud debe estar en estado FICHA_ASIGNADA, INSCRIPCION, MATRICULADA o PROGRAMADA para poder programarla. Estado actual: ${request.state}`
    );
  }
  return request;
};

complementaryScheduleHelper.validateInstructorAvailability = async (
  instructor,
  fstart,
  fend,
  tstart,
  tend,
  days,
  excludeScheduleId = null
) => {
  const currentDate = new Date();
  const fstartShe = dateFormater(fstart);
  const fendShe = dateFormater(fend);
  const tStartToDateClient = dateFormater(currentDate, tstart);
  const tEndToDateClient = dateFormater(currentDate, tend);

  const query = {
    instructor,
    status: 0,
  };
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const schedules = await Schedule.find(query).populate(
    "fiche instructor environment"
  );

  const conflicts = [];

  for (const schedule of schedules) {
    const tStartToDate = dateFormater(currentDate, schedule.tstart);
    const tEndToDate = dateFormater(currentDate, schedule.tend);

    if (
      schedule.fstart <= fendShe &&
      schedule.fend >= fstartShe &&
      tStartToDate <= tEndToDateClient &&
      tEndToDate >= tStartToDateClient
    ) {
      for (const event of schedule.events) {
        if (event >= fstartShe && event <= fendShe) {
          const getDay = event.getUTCDay();
          if (days.includes(getDay)) {
            const ficheLabel =
              schedule.fiche?.number ||
              `Complementaria (${schedule.scheduleType})`;
            conflicts.push({
              date: event.toISOString().split("T")[0],
              fiche: ficheLabel,
              type: schedule.scheduleType,
            });
          }
        }
      }
    }
  }

  if (conflicts.length > 0) {
    const uniqueDates = [...new Set(conflicts.map((c) => c.date))];
    const uniqueFiches = [...new Set(conflicts.map((c) => c.fiche))];
    throw new Error(
      `El instructor tiene programación en las fechas: ${uniqueDates.join(
        ", "
      )} con las fichas: ${uniqueFiches.join(", ")}`
    );
  }
};

complementaryScheduleHelper.validateEnvironmentAvailability = async (
  environment,
  fstart,
  fend,
  tstart,
  tend,
  days,
  excludeScheduleId = null
) => {
  if (!environment) return;

  const currentDate = new Date();
  const fstartShe = dateFormater(fstart);
  const fendShe = dateFormater(fend);
  const tStartToDateClient = dateFormater(currentDate, tstart);
  const tEndToDateClient = dateFormater(currentDate, tend);

  const query = {
    environment,
    status: 0,
  };
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const schedules = await Schedule.find(query).populate(
    "fiche instructor environment"
  );

  const conflicts = [];

  for (const schedule of schedules) {
    const tStartToDate = dateFormater(currentDate, schedule.tstart);
    const tEndToDate = dateFormater(currentDate, schedule.tend);

    if (
      schedule.fstart <= fendShe &&
      schedule.fend >= fstartShe &&
      tStartToDate <= tEndToDateClient &&
      tEndToDate >= tStartToDateClient
    ) {
      for (const event of schedule.events) {
        if (event >= fstartShe && event <= fendShe) {
          const getDay = event.getUTCDay();
          if (days.includes(getDay)) {
            const ficheLabel =
              schedule.fiche?.number ||
              `Complementaria (${schedule.scheduleType})`;
            conflicts.push({
              date: event.toISOString().split("T")[0],
              fiche: ficheLabel,
            });
          }
        }
      }
    }
  }

  if (conflicts.length > 0) {
    const uniqueDates = [...new Set(conflicts.map((c) => c.date))];
    const uniqueFiches = [...new Set(conflicts.map((c) => c.fiche))];
    throw new Error(
      `El ambiente ya está programado en las fechas: ${uniqueDates.join(
        ", "
      )} con las fichas: ${uniqueFiches.join(", ")}`
    );
  }
};

complementaryScheduleHelper.validateHoursLimit = async (
  requestId,
  instructorId,
  newHours,
  excludeScheduleId = null
) => {
  const request = await ComplementaryRequest.findById(requestId).populate(
    "catalogCourse"
  );
  if (!request || !request.catalogCourse) return;

  const maxHours = request.catalogCourse.prfDuracionMaxima;
  if (!maxHours) return;

  const instructor = await Instructor.findById(instructorId);
  // Si se está reprogramando un schedule (reschedule), se excluye el propio
  // schedule del cómputo para no duplicar sus horas: currentHours = horas del
  // resto + newHours. Al crear (scheduleComplementary) no se pasa y se suma todo.
  const query = {
    complementaryRequest: requestId,
    status: 0,
  };
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }
  const existingSchedules = await Schedule.find(query);

  const currentHours = existingSchedules.reduce(
    (sum, s) => sum + (s.hourswork || 0),
    0
  );
  const totalHours = currentHours + newHours;

  if (totalHours > maxHours) {
    throw new Error(
      `Las horas totales (${totalHours}) exceden la duración máxima del curso (${maxHours} horas). Horas ya programadas: ${currentHours}`
    );
  }
};

complementaryScheduleHelper.validateNoDuplicateInstructorSchedule = async (
  requestId,
  instructorId
) => {
  const existing = await Schedule.findOne({
    complementaryRequest: requestId,
    instructor: instructorId,
    status: 0,
  });
  if (existing) {
    throw new Error(
      "Ya existe una programación activa para este instructor en esta solicitud complementaria"
    );
  }
};

// ==================== RF-12: Subida de eventos mensuales ====================

complementaryScheduleHelper.validateRequestInExecutionForEvents = async (requestId) => {
  const request = await ComplementaryRequest.findById(requestId);
  if (!request) {
    throw new Error("La solicitud no existe");
  }
  if (request.status !== 0) {
    throw new Error("La solicitud está inactiva");
  }
  if (request.state !== "EJECUCION") {
    throw new Error(
      `La solicitud debe estar en estado EJECUCION para agregar eventos. Estado actual: ${request.state}`
    );
  }
  return request;
};

complementaryScheduleHelper.validateEventDates = (eventos, schedule) => {
  const fstart = new Date(schedule.fstart);
  fstart.setUTCHours(0, 0, 0, 0);
  const fend = new Date(schedule.fend);
  fend.setUTCHours(23, 59, 59, 999);

  const invalidDates = [];
  for (const ev of eventos) {
    const d = new Date(ev);
    if (isNaN(d.getTime())) {
      invalidDates.push({ date: ev, reason: "Fecha inválida" });
      continue;
    }
    if (d < fstart || d > fend) {
      invalidDates.push({
        date: ev,
        reason: `Fuera del rango del schedule (${schedule.fstart.toISOString().split("T")[0]} a ${schedule.fend.toISOString().split("T")[0]})`,
      });
    }
  }

  if (invalidDates.length > 0) {
    const details = invalidDates.map((i) => `${i.date}: ${i.reason}`).join("; ");
    throw new Error(`Fechas inválidas: ${details}`);
  }
};

complementaryScheduleHelper.findActiveScheduleForRequest = async (requestId) => {
  const schedule = await Schedule.findOne({
    complementaryRequest: requestId,
    status: 0,
  });
  if (!schedule) {
    throw new Error("No se encontró un horario activo para esta solicitud");
  }
  return schedule;
};

// ============================================================================
// Sección 3: Auditoría DF-14 (parseo de Excel)
// (antes helpers/complementaryAudit.helper.js)
// ============================================================================
function normalizeKey(str) {
  if (!str || typeof str !== 'string') return '';
  // Convert to lowercase, remove accents, trim, and replace spaces with underscores
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, '_');
}

const complementaryAuditHelper = {
  parseDF14: async (filePath) => {
    try {
      // Read file. xlsx handles both true .xlsx and XML Spreadsheet (.xls)
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Get raw data as array of arrays to find headers
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let headerRowIndex = -1;
      let headers = [];

      // Find the header row by looking for key columns
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowString = row.join("").toLowerCase();

        // Typical DF14 headers
        if (rowString.includes("ficha") && rowString.includes("nivel")) {
          headerRowIndex = i;
          headers = row.map(normalizeKey);
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("No se pudo identificar la cabecera de la tabla en el archivo Excel. Asegúrese de que es un reporte válido (DF14).");
      }

      // Process data rows
      const data = [];
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        // Skip empty rows
        if (!row || row.length === 0 || !row.some(val => val !== "")) continue;

        const rowObj = {};
        headers.forEach((header, index) => {
          if (header) {
            rowObj[header] = row[index];
          }
        });

        // Filter only "curso especial" (complementarias)
        const nivel = (rowObj["nivel_de_formacion"] || rowObj["nivel_formacion"] || "").toString().toLowerCase();
        if (nivel.includes("curso especial")) {

          const ficha = (rowObj["ficha"] || "").toString().trim();
          const estado = (rowObj["estado_de_ficha"] || rowObj["estado_ficha"] || rowObj["estado"] || "").toString().toLowerCase().trim();

          // Parse numbers safely
          const enTransito = parseInt(rowObj["aprendices_en_transito"] || rowObj["en_transito"] || rowObj["transito"] || 0, 10) || 0;
          const enFormacion = parseInt(rowObj["en_formacion"] || rowObj["aprendices_en_formacion"] || rowObj["formacion"] || 0, 10) || 0;

          if (ficha) {
            data.push({
              fichaNumber: ficha,
              estado,
              enTransito,
              enFormacion
            });
          }
        }
      }

      return data;

    } catch (error) {
      console.error("[AUDIT-HELPER] Error parseando DF14:", error);
      throw error;
    }
  }
};

// ============================================================================
// Sección 4: Parámetros (tipos de programa / población)
// (antes helpers/complementaryParametro.helper.js)
// ============================================================================
const complementaryParametroHelper = {};

complementaryParametroHelper.validateExistParametroById = async (id) => {
  try {
    const parametro = await ComplementaryParametro.findById(id);
    if (!parametro) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("El parametro no existe");
  }
};

complementaryParametroHelper.validateNombreUniqueByTipo = async (
  nombre,
  tipo,
  currentId = null
) => {
  try {
    const parametro = await ComplementaryParametro.findOne({
      nombre: nombre.toUpperCase().trim(),
      tipo,
      status: 0,
    });
    if (parametro && currentId && parametro._id.toString() !== currentId) {
      throw new Error();
    } else if (parametro && !currentId) {
      throw new Error();
    }
  } catch (error) {
    throw new Error(
      `El nombre '${nombre}' ya existe para el tipo '${tipo}'`
    );
  }
};

/**
 * Valida que un valor enviado en una solicitud (tipoPrograma / tipoPoblacion)
 * exista realmente en el catálogo de parámetros activos (status: 0) del tipo
 * correspondiente. El catálogo es la fuente de verdad: si el instructor/admin
 * elige un valor, debe ser uno creado por el admin en el CRUD de parámetros.
 *
 * Se compara en mayúsculas porque los parámetros se guardan con
 * nombre.toUpperCase().trim() al crearse (ver registerParametro).
 *
 * @param {string} tipo - "programa" o "poblacion"
 * @param {string} valor - texto del valor enviado en la solicitud
 * @throws {Error} si el valor no existe en el catálogo activo del tipo dado
 */
complementaryParametroHelper.validateParametroExiste = async (tipo, valor) => {
  const etiqueta =
    tipo === "poblacion" ? "tipo de población" : "tipo de programa";
  try {
    const existe = await ComplementaryParametro.findOne({
      nombre: String(valor).toUpperCase().trim(),
      tipo,
      status: 0,
    });
    if (!existe) {
      throw new Error();
    }
  } catch (error) {
    throw new Error(
      `El valor '${valor}' no es válido para el ${etiqueta}`
    );
  }
};

// ============================================================================
// Sección 5: Extractor de competencias desde PDF PRF del SENA (pdfjs-dist)
// (antes helpers/complementaryExtractor.helper.js)
// Estructura del PRF: COMPETENCIA → 2. RESULTADOS → 3. CONOCIMIENTOS
// (3.1 conceptos, 3.2 proceso) → 4. CRITERIOS → 5. PERFIL.
// Salida por competencia: { code, name, totalCompetenceHours, resultados[],
// conocimientos{conceptos[],proceso[]}, criteria[] }.
// ============================================================================
const CONNECTORS = new Set([
  "DE", "DEL", "Y", "EN", "CON", "PARA", "A", "AL", "O", "U", "NI", "QUE",
  "LOS", "LAS", "EL", "LA", "E", "SEGÚN", "COMO", "ENTRE", "SOBRE", "TRAVÉS",
]);

function _reconstructLines(items) {
  const filtered = items.filter((it) => it.str && it.str.trim().length > 0);
  filtered.sort((a, b) => {
    const ya = a.transform[5];
    const yb = b.transform[5];
    if (Math.abs(ya - yb) > 2) return yb - ya; // mayor Y primero (arriba)
    return a.transform[4] - b.transform[4]; // misma fila: menor X primero (izq)
  });
  const lines = [];
  let cur = null;
  let curY = null;
  for (const it of filtered) {
    const y = it.transform[5];
    if (curY === null || Math.abs(y - curY) > 2) {
      if (cur) lines.push(cur);
      cur = it.str;
      curY = y;
    } else {
      cur += (it.str.startsWith(" ") || cur.endsWith(" ") ? "" : " ") + it.str;
    }
  }
  if (cur !== null) lines.push(cur);
  return lines;
}

function _cleanPageNoise(text) {
  let out = text;
  // Artefactos CID que a veces produce pdfjs.
  out = out.replace(/\(cid:\d+\)/g, " ");
  // Encabezado repetido (5 líneas): "LÍNEA TECNOLÓGICA DEL PROGRAMA ... Mejora Continua"
  out = out.replace(/LÍNEA TECNOLÓGICA DEL PROGRAMA[\s\S]*?Mejora Continua/g, " ");
  // Pie de página: "6/17/26 8:12 PM Página 1 de 6"
  out = out.replace(
    /\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}\s*[AP]M\s+Página \d+ de \d+/g,
    " "
  );
  return out;
}

function _norm(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function _between(text, startPattern, endPattern) {
  const re = new RegExp(startPattern + "([\\s\\S]*?)" + endPattern, "i");
  const m = text.match(re);
  return m ? m[1] : "";
}

function _parseProgramData(text) {
  // Código + nombre: la fila bajo "CÓDIGO: DENOMINACIÓN DEL PROGRAMA", hasta "VERSIÓN:"
  const cn = text.match(
    /CÓDIGO:\s*DENOMINACIÓN DEL PROGRAMA\s+(\d+)\s+([\s\S]*?)\s+VERSIÓN:/i
  );
  const programCode = cn ? cn[1] : "";
  const programName = cn ? _norm(cn[2]) : "";

  const v = text.match(/VERSIÓN:\s*SECTOR DEL PROGRAMA:\s+(\d+)/i);
  const version = v ? v[1] : "";

  const d = text.match(/DURACI[OÓ]N\s+(\d+)\s+horas\s+M[AÁ]XIMA/i);
  const totalProgramHours = d ? parseInt(d[1], 10) : 0;

  return { programName, programCode, version, totalProgramHours };
}

function _splitCompetenceBlocks(text) {
  const parts = text.split(/COMPETENCIA\s+CÓDIGO:\s*DENOMINACIÓN\s+/i);
  return parts.slice(1);
}

function _splitResultados(seg) {
  // Buscar DESCRIPCIÓN (caso insensitivo) para descartar los elementos de competencia y quedarnos sólo con resultados
  const descMatch = seg.match(/DESCRIPCI[OÓ]N/i);
  let content = seg;
  if (descMatch) {
    content = seg.slice(descMatch.index + descMatch[0].length);
  }

  const normalized = _norm(content);

  // 1. Intentar dividir por numeración estilo "01.", "02."
  let parts = normalized.split(/\b\d{2}\.\s*/);
  
  // Si no se dividió por numeración, dividimos por punto final seguido de espacio/fin de línea
  if (parts.length <= 1) {
    parts = normalized
      .split(/\.(?:\s+|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
  } else {
    parts = parts.map((s) => s.trim()).filter((s) => s.length > 3);
  }

  return parts.map((s) => s.toUpperCase());
}

function _splitConceptos(seg) {
  return _norm(seg)
    .split(/\.\s+/)
    .map((s) => s.replace(/^[\s.•\-]+|[\s.•\-]+$/g, "").trim())
    .filter((s) => s.length > 3)
    .map((s) => s.toUpperCase());
}

function _splitConnectorMerge(seg) {
  const lines = seg
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const out = [];
  for (const line of lines) {
    if (out.length > 0) {
      const prev = out[out.length - 1];
      const lastWord = prev
        .split(/\s+/)
        .pop()
        .replace(/[.;:,]+$/g, "")
        .toUpperCase();
      if (CONNECTORS.has(lastWord)) {
        out[out.length - 1] = (prev + " " + line).trim();
        continue;
      }
    }
    out.push(line);
  }
  return out
    .map((s) => _norm(s).toUpperCase())
    .filter((s) => s.length > 3);
}

function _parseCompetenceBlock(block) {
  try {
    // Encabezado del bloque: todo hasta "2. RESULTADOS" (contiene código + nombre).
    const headEnd = block.search(/2\.\s+RESULTADOS/i);
    const head = headEnd >= 0 ? block.slice(0, headEnd) : block;
    const codeMatch = head.match(/\b(\d{9})\b/);
    const code = codeMatch ? codeMatch[1] : "";
    if (!code) return null;
    const name = _norm(head.replace(/\b\d{9}\b/g, " ")).toUpperCase();

    const resultados = _splitResultados(
      _between(block, "2\\.\\s+RESULTADOS\\s+DE\\s+APRENDIZAJE", "3\\.\\s+CONOCIMIENTOS")
    );
    const conceptos = _splitConceptos(
      _between(
        block,
        "3\\.1\\.?\\s*CONOCIMIENTOS\\s+DE\\s+CONCEPTOS\\s+Y\\s+PRINCIPIOS",
        "3\\.2"
      )
    );
    const proceso = _splitConnectorMerge(
      _between(block, "3\\.2\\.?\\s*CONOCIMIENTOS\\s+DE\\s+PROCESO", "4\\.\\s+CRITERIOS")
    );
    const criteria = _splitConnectorMerge(
      _between(block, "4\\.\\s+CRITERIOS\\s+DE\\s+EVALUACI[OÓ]N", "5\\.\\s+PERFIL")
    );

    // El PRF no trae horas por competencia (solo a nivel programa) → 0.
    return {
      code,
      name,
      totalCompetenceHours: 0,
      resultados,
      conocimientos: { conceptos, proceso },
      criteria,
    };
  } catch (_) {
    return null;
  }
}

const complementaryExtractor = {};

complementaryExtractor.extractRawText = async (pdfPath) => {
  const data = await fs.promises.readFile(pdfPath);
  const parser = new PDFParse({ data });
  const doc = await parser.load();
  try {
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(_reconstructLines(content.items).join("\n"));
      page.cleanup();
    }
    return pages.join("\n");
  } finally {
    try {
      await parser.destroy();
    } catch (_) {
      // destroy no es letal.
    }
  }
};

complementaryExtractor.extractFromPdf = async (pdfPath) => {
  const result = {
    programName: "",
    programCode: "",
    version: "",
    totalProgramHours: 0,
    competencies: [],
  };
  try {
    const raw = await complementaryExtractor.extractRawText(pdfPath);
    const text = _cleanPageNoise(raw);

    // PDF sin texto seleccionable (escaneado / imagen).
    if (!text || text.replace(/\s/g, "").length < 30) {
      return { ...result, _error: "PDF sin texto seleccionable (¿escaneado?)" };
    }

    Object.assign(result, _parseProgramData(text));

    const blocks = _splitCompetenceBlocks(text);
    result.competencies = blocks.map(_parseCompetenceBlock).filter(Boolean);

    console.log(
      `[EXTRACT-COMP] Texto limpio: ${text.length} chars | bloques competencia: ${blocks.length} | extraídas: ${result.competencies.length}`
    );
  } catch (e) {
    result._error = String((e && e.message) || e);
    console.error("[EXTRACT-COMP] Error en extracción Node:", result._error);
  }
  return result;
};

export {
  complementaryHelper,
  complementaryScheduleHelper,
  complementaryAuditHelper,
  complementaryParametroHelper,
  complementaryExtractor,
};