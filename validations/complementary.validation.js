import { check } from "express-validator";
import jwt from "jsonwebtoken";
import webToken from "../middlewares/webToken.js";
import { validateFields } from "../middlewares/validateFields.js";
import {
  complementaryHelper,
  complementaryScheduleHelper,
  complementaryParametroHelper,
} from "../helpers/complementary.helper.js";
import { ficheHelper } from "../helpers/fiche.helper.js";
import { instrHelper } from "../helpers/instructor.helper.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";

const {
  validateExistCatalogById,
  validateExistRequestById,
  validateRequestOwner,
  validateRequestRejected,
  validateRequestPending,
  validateRequestApproved,
  validateFichaNumberUnique,
  validateStateTransition,
  validateFormationDataEditable,
  validateRequestInExecution,
  validateScheduleBelongsToRequest,
} = complementaryHelper;

const { validateToken, validateTokenComplementaria } = webToken;

const validateFechaInicioMin7Days = (getCompareDate) => {
  return async (fechaInicio, { req }) => {
    if (!fechaInicio) return true;
    const compareDate = await getCompareDate(req);
    if (!compareDate) return true;

    const generatedDate = new Date(compareDate);
    generatedDate.setUTCHours(0, 0, 0, 0);

    const startDate = new Date(fechaInicio);
    startDate.setUTCHours(0, 0, 0, 0);

    const diffTime = startDate.getTime() - generatedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      throw new Error("La fecha de inicio de la ficha debe ser al menos 7 días después de generar la solicitud");
    }
    return true;
  };
};

const complementaryVali = {};

complementaryVali.validateHeaders = [
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

// Validador para GET /catalog con params de paginado/filtrado opcionales (modo paginado).
// Compatible hacia atras: si no llegan page/limit, el controlador responde como hoy.
const ORDEN_CATALOGO = ["nombre_asc", "nombre_desc", "horas_asc", "horas_desc"];
complementaryVali.validateCatalogQuery = [
  check("page").optional().isInt({ min: 1 }).withMessage("page debe ser un entero mayor o igual a 1"),
  check("limit").optional().isInt({ min: 1 }).withMessage("limit debe ser un entero mayor o igual a 1"),
  check("q").optional().isString().withMessage("q debe ser una cadena"),
  check("orden").optional().isIn(ORDEN_CATALOGO).withMessage("orden no valido"),
  check("horasMin").optional().isInt({ min: 0 }).withMessage("horasMin debe ser un entero mayor o igual a 0"),
  check("horasMax").optional().isInt({ min: 0 }).withMessage("horasMax debe ser un entero mayor o igual a 0"),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

// Validador para GET /requests con params de paginado opcionales (solo admin).
const ORDEN_SOLICITUDES = ["inicio_asc", "inicio_desc"];
complementaryVali.validateRequestsQuery = [
  check("page").optional().isInt({ min: 1 }).withMessage("page debe ser un entero mayor o igual a 1"),
  check("limit").optional().isInt({ min: 1 }).withMessage("limit debe ser un entero mayor o igual a 1"),
  check("q").optional().isString().withMessage("q debe ser una cadena"),
  check("orden").optional().isIn(ORDEN_SOLICITUDES).withMessage("orden no valido"),
  check("token").custom(async (token) => {
    await validateToken(token, false);
  }),
  validateFields,
];

// Validador para GET /requests/counts (contadores por estado para tabs del listado).
complementaryVali.validateRequestCounts = [
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

complementaryVali.validateSendCode = [
  check("email", "El email es obligatorio").notEmpty(),
  check("email", "El email no es valido").isEmail(),
  check("email").custom(async (email) => {
    const instructor = await complementaryHelper.findInstructorByEmail(email);
    if (!instructor) throw new Error("Instructor no encontrado");
  }),
  validateFields,
];

complementaryVali.validateVerifyCode = [
  check("email", "El email es obligatorio").notEmpty(),
  check("email", "El email no es valido").isEmail(),
  check("code", "El codigo es obligatorio").notEmpty(),
  check("code", "El codigo debe tener 6 digitos").isLength({ min: 6, max: 6 }),
  check("code", "El codigo debe ser numerico").isNumeric(),
  validateFields,
];

complementaryVali.validateExistCatalog = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistCatalogById(id);
  }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token);
    }
  }),
  validateFields,
];

complementaryVali.validateRegisterRequest = [
  check("catalogCourse", "El curso del catálogo es obligatorio").notEmpty(),
  check("catalogCourse", "El curso del catálogo no es valido").isMongoId(),
  check("catalogCourse").custom(async (catalogCourse) => {
    await validateExistCatalogById(catalogCourse);
    return true;
  }),

  check("instructores").optional().isArray().withMessage("Los instructores deben ser un array"),
  check("instructores.*").optional().isMongoId().withMessage("Cada instructor debe ser un ID válido"),
  check("instructores").custom(async (instructores) => {
    if (!Array.isArray(instructores)) return true;
    for (const instId of instructores) {
      await complementaryHelper.findInstructorById(instId);
    }
    return true;
  }),

  check("supervisor", "El supervisor no es valido").optional().isMongoId(),
  check("prfDuracionMaxima")
    .optional({ values: "falsy" })
    .isNumeric()
    .withMessage("La duración máxima del curso debe ser un número válido"),
  check("competencies").optional().isArray().withMessage("Las competencias deben ser un array"),
  check("outcomes").optional().isArray().withMessage("Los resultados deben ser un array"),
  check("sesiones").optional().isArray().withMessage("Las sesiones deben ser un array"),
  check("departamento").optional().isString().withMessage("El departamento debe ser un texto"),
  // RF-03: fechaInicio es OBLIGATORIA al registrar y debe ser de mínimo
  // 7 días posterior al día actual (comparación por día calendario).
  check("fechaInicio", "La fecha de inicio es obligatoria").notEmpty(),
  check("fechaInicio", "La fecha de inicio no es válida").isISO8601(),
  check("fechaInicio").custom((fechaInicio) => {
    complementaryHelper.validateFechaInicioMinima(fechaInicio);
    return true;
  }),
  check("fechaFin").optional().isISO8601().withMessage("La fecha de fin no es válida"),
  // RF-03: tipoPrograma y tipoPoblacion son OBLIGATORIOS al registrar la
  // solicitud. El instructor/admin debe elegir 1 valor de cada lista
  // (dropdown desde GET /parametros). El valor debe existir en el catálogo
  // activo de parámetros del tipo correspondiente.
  check("tipoPrograma", "El tipo de programa es obligatorio").notEmpty(),
  check("tipoPrograma", "El tipo de programa debe ser un texto").isString(),
  check("tipoPrograma").custom(async (tipoPrograma) => {
    await complementaryParametroHelper.validateParametroExiste("programa", tipoPrograma);
    return true;
  }),
  check("tipoPoblacion", "El tipo de población es obligatorio").notEmpty(),
  check("tipoPoblacion", "El tipo de población debe ser un texto").isString(),
  check("tipoPoblacion").custom(async (tipoPoblacion) => {
    await complementaryParametroHelper.validateParametroExiste("poblacion", tipoPoblacion);
    return true;
  }),
  check("token").custom(async (token) => {
    await validateTokenComplementaria(token);
    return true;
  }),
  validateFields,
];

complementaryVali.validateExistRequest = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token);
    }
  }),
  validateFields,
];

complementaryVali.validateUpdateRequest = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token, { req }) => {
    const decoded = await validateTokenComplementaria(token);
    await validateRequestOwner(req.params.id, decoded.email);
  }),
  check("id").custom(async (id) => {
    await validateRequestRejected(id);
  }),
  // Si el instructor edita tipoPrograma/tipoPoblacion al reenviar la solicitud,
  // el valor debe seguir siendo válido dentro del catálogo de parámetros.
  check("tipoPrograma")
    .optional()
    .custom(async (tipoPrograma) => {
      await complementaryParametroHelper.validateParametroExiste("programa", tipoPrograma);
    }),
  check("tipoPoblacion")
    .optional()
    .custom(async (tipoPoblacion) => {
      await complementaryParametroHelper.validateParametroExiste("poblacion", tipoPoblacion);
    }),
  check("fechaInicio").optional().isISO8601().withMessage("La fecha de inicio no es válida")
    .custom(validateFechaInicioMin7Days(async (req) => {
      const request = await ComplementaryRequest.findById(req.params.id);
      return request ? request.createdAt : null;
    })),
  check("fechaFin").optional().isISO8601().withMessage("La fecha de fin no es válida"),
  check("fechaInicio").custom((fechaInicio, { req }) => {
    if (fechaInicio && req.body.fechaFin) {
      if (new Date(fechaInicio) > new Date(req.body.fechaFin)) {
        throw new Error("La fecha de inicio no puede ser mayor a la fecha de finalización");
      }
    }
    return true;
  }),
  validateFields,
];

complementaryVali.validateResubmitRequest = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token, { req }) => {
    const decoded = await validateTokenComplementaria(token);
    await validateRequestOwner(req.params.id, decoded.email);
  }),
  check("id").custom(async (id) => {
    await validateRequestRejected(id);
  }),
  validateFields,
];

complementaryVali.validateInstructorRequests = [
  check("token").custom(async (token) => {
    await validateTokenComplementaria(token);
  }),
  validateFields,
];

// ==================== RF-04: Aprobación de solicitudes ====================

complementaryVali.validateApprove = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("id").custom(async (id) => {
    await validateRequestPending(id);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (decoded?.rol !== "COORDINADOR" && decoded?.rol !== "PROGRAMADOR") {
      throw new Error("Solo un coordinador o programador puede realizar esta acción");
    }
  }),
  validateFields,
];

complementaryVali.validateReject = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("id").custom(async (id) => {
    await validateRequestPending(id);
  }),
  check("observations", "Las observaciones son obligatorias").notEmpty(),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (decoded?.rol !== "COORDINADOR" && decoded?.rol !== "PROGRAMADOR") {
      throw new Error("Solo un coordinador o programador puede realizar esta acción");
    }
  }),
  validateFields,
];

// ==================== RF-05: Asignación de ficha ====================

complementaryVali.validateAssignFicha = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("id").custom(async (id) => {
    await validateRequestApproved(id);
  }),
  // FIX: faltaba abrir el check() de "fichaCaracterizacion" antes del custom().
  // Ajusta el nombre del campo si en tu req.body se llama distinto
  // (ej. "numeroFicha"), pero la estructura debe ser esta.
  check("fichaCaracterizacion", "El número de ficha es obligatorio").notEmpty(),
  check("fichaCaracterizacion").custom(async (fichaCaracterizacion) => {
    await ficheHelper.uniqueNumberFiche(String(fichaCaracterizacion).toUpperCase().trim());
  }),
  check("fechaInicio", "La fecha de inicio es obligatoria").notEmpty(),
  check("fechaInicio", "La fecha de inicio no es valida").isISO8601(),
  check("fechaFin", "La fecha de finalización no es valida").isISO8601(),
  check("fechaInscripcion", "La fecha de inscripción es obligatoria").notEmpty(),
  check("fechaInscripcion", "La fecha de inscripción no es valida").isISO8601(),
  check("fechaMatriculaInicio", "La fecha de inicio de matrícula es obligatoria").notEmpty(),
  check("fechaMatriculaInicio", "La fecha de inicio de matrícula no es valida").isISO8601(),
  check("fechaMatriculaFin", "La fecha de fin de matrícula es obligatoria").notEmpty(),
  check("fechaMatriculaFin", "La fecha de fin de matrícula no es valida").isISO8601(),
  check("fechaInicio").custom(async (fechaInicio, { req }) => {
    if (fechaInicio && req.body.fechaFin) {
      if (new Date(fechaInicio) > new Date(req.body.fechaFin)) {
        throw new Error("La fecha de inicio no puede ser mayor a la fecha de finalización");
      }
    }
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "PROGRAMADOR", "COORDINADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, programador o coordinador puede asignar fichas");
    }
  }),
  validateFields,
];

// ==================== RF-04 extendido: Coordinador completa datos de formación ====================

complementaryVali.validateFormationData = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("id").custom(async (id) => {
    await validateFormationDataEditable(id);
  }),
  check("competencies", "Las competencias son obligatorias").notEmpty(),
  check("competencies", "Las competencias deben ser un array").isArray({ min: 1 }),
  check("competencies").custom((competencies) => {
    if (!Array.isArray(competencies)) return true; // ya validado arriba
    for (let i = 0; i < competencies.length; i++) {
      const c = competencies[i];
      // Aceptar strings legacy para retrocompatibilidad
      if (typeof c === "string") continue;
      if (typeof c !== "object" || c === null) {
        throw new Error(`La competencia ${i + 1} debe ser un objeto o un texto`);
      }
      const tieneNombre = c.name || c.nombre;
      if (!tieneNombre) {
        throw new Error(`La competencia ${i + 1} debe tener un nombre (name o nombre)`);
      }
    }
    return true;
  }),
  check("outcomes", "Los resultados de aprendizaje son obligatorios").notEmpty(),
  check("outcomes", "Los resultados de aprendizaje deben ser un array").isArray({ min: 1 }),
  check("sesiones").optional().isArray().withMessage("Las sesiones deben ser un array"),
  check("sesiones").custom(async (sesiones, { req }) => {
    if (!Array.isArray(sesiones)) return true;
    const request = await ComplementaryRequest.findById(req.params.id);
    if (!request) return true;
    for (let i = 0; i < sesiones.length; i++) {
      const s = sesiones[i];
      if (s.instructor) {
        const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(s.instructor);
        if (!isValidMongoId) {
          throw new Error(`El instructor de la sesión ${i + 1} no es un ID válido`);
        }
        const belongs = complementaryHelper.isInstructorInRequest(request, s.instructor);
        if (!belongs) {
          throw new Error(`El instructor de la sesión ${i + 1} no pertenece a esta solicitud`);
        }
      }
    }
  }),
  check("learningActivity").optional().isString(),
  // tipoPrograma/tipoPoblacion son opcionales aquí (el admin puede dejarlos
  // como están o cambiarlos), PERO si se envían deben ser valores válidos del
  // catálogo activo de parámetros.
  check("tipoPrograma")
    .optional()
    .custom(async (tipoPrograma) => {
      await complementaryParametroHelper.validateParametroExiste("programa", tipoPrograma);
    }),
  check("tipoPoblacion")
    .optional()
    .custom(async (tipoPoblacion) => {
      await complementaryParametroHelper.validateParametroExiste("poblacion", tipoPoblacion);
    }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (decoded?.rol !== "COORDINADOR" && decoded?.rol !== "ADMIN" && decoded?.rol !== "PROGRAMADOR") {
      throw new Error("Solo un coordinador, administrador o programador puede completar datos de formación");
    }
  }),
  validateFields,
];

complementaryVali.validateChangeState = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("newState", "El nuevo estado es obligatorio").notEmpty(),
  check("newState", "El estado no es valido").isIn([
    "FICHA_ASIGNADA",
    "INSCRIPCION",
    "MATRICULADA",
    "PROGRAMADA",
    "EJECUCION",
    "CANCELADA",
  ]),
  check("id").custom(async (id, { req }) => {
    await validateStateTransition(id, req.body.newState);
  }),
  check("observations")
    .if((value, { req }) => req.body.newState === "CANCELADA")
    .notEmpty()
    .withMessage("Las observaciones son obligatorias al cancelar"),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (decoded?.rol !== "ADMIN" && decoded?.rol !== "PROGRAMADOR") {
      throw new Error("Solo un administrador o programador puede cambiar el estado");
    }
  }),
  validateFields,
];

complementaryVali.validateCloseFicha = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador o coordinador puede cerrar una ficha");
    }
  }),
  validateFields,
];

// ==================== RF-08: Programación horaria complementaria ====================

const daysValid = [0, 1, 2, 3, 4, 5, 6];

complementaryVali.validateScheduleComplementary = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await complementaryScheduleHelper.validateRequestProgrammable(id);
  }),
  check("instructor", "El instructor es obligatorio").notEmpty(),
  check("instructor", "El instructor no es valido").isMongoId(),
  check("instructor").custom(async (instructor, { req }) => {
    await complementaryHelper.validateInstructorBelongsToRequest(req.params.id, instructor);
  }),
  check("environment")
    .optional()
    .isMongoId()
    .withMessage("El ambiente no es valido"),
  check("days", "Los dias son obligatorios").notEmpty(),
  check("days", "Los dias no son validos").isArray(),
  check("days").custom(async (days) => {
    days.forEach((day) => {
      if (!daysValid.includes(day)) {
        throw new Error("Los dias no son validos");
      }
    });
  }),
  check("fstart", "La fecha de inicio no es valida").optional().isISO8601(),
  check("fend", "La fecha de fin no es valida").optional().isISO8601(),
  check("fstart").custom(async (fstart, { req }) => {
    if (fstart && req.body.fend) {
      if (new Date(fstart) > new Date(req.body.fend)) {
        throw new Error("La fecha de inicio no puede ser mayor a la fecha de fin");
      }
    }
  }),
  check("tstart", "La hora de inicio es obligatoria").notEmpty(),
  check("tend", "La hora de fin es obligatoria").notEmpty(),
  check("events", "Los eventos son obligatorios").notEmpty(),
  check("events", "Los eventos no son validos").isArray(),
  check("events").custom(async (events) => {
    if (Array.isArray(events)) {
      events.forEach((event) => {
        if (event.start) {
          const date = new Date(event.start);
          if (date == "Invalid Date") {
            throw new Error("Los eventos no son validos");
          }
        }
      });
    }
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (decoded?.rol !== "ADMIN" && decoded?.rol !== "PROGRAMADOR") {
      throw new Error("Solo un administrador o programador puede programar horarios complementarios");
    }
  }),
  validateFields,
];

// ==================== RF-10: Reportes ====================

complementaryVali.validateReportQuery = [
  check("token").custom(async (token) => {
    await validateToken(token);
  }),
  validateFields,
];

complementaryVali.validateReportComplementariasFecha = [
  check("town", "El municipio es obligatorio").notEmpty(),
  check("town", "El municipio no es valido").isMongoId(),
  check("fecha", "La fecha es obligatoria").notEmpty(),
  check("fecha", "La fecha no es valida").isISO8601(),
  check("token").custom(async (token) => {
    await validateToken(token);
  }),
  validateFields,
];

complementaryVali.validateDashboardSummary = [
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede ver el resumen del dashboard");
    }
  }),
  validateFields,
];

// ==================== Progreso de carga masiva ====================

complementaryVali.validateUploadStatus = [
  check("jobId", "El jobId es obligatorio").notEmpty(),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

// ==================== RF-10: Reprogramacion de ficha ====================

complementaryVali.validateReschedule = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("fstart", "La fecha de inicio es obligatoria").notEmpty(),
  check("fstart", "La fecha de inicio no es valida").isISO8601(),
  check("fend", "La fecha de fin es obligatoria").notEmpty(),
  check("fend", "La fecha de fin no es valida").isISO8601(),
  check("tstart", "La hora de inicio es obligatoria").notEmpty(),
  check("tend", "La hora de fin es obligatoria").notEmpty(),
  check("days", "Los dias son obligatorios").notEmpty(),
  check("days", "Los dias no son validos").isArray(),
  check("events", "Los eventos son obligatorios").notEmpty(),
  check("events", "Los eventos no son validos").isArray(),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("No tienes permisos para realizar esta accion");
    }
  }),
  validateFields,
];

// ==================== RF-12: Evaluación de resultados (rated) ====================

complementaryVali.validateGetSchedules = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

complementaryVali.validateRateSchedule = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateRequestInExecution(id);
  }),
  check("scheduleId", "El scheduleId es obligatorio").notEmpty(),
  check("scheduleId", "El scheduleId no es valido").isMongoId(),
  check("scheduleId").custom(async (scheduleId, { req }) => {
    await validateScheduleBelongsToRequest(req.params.id, scheduleId);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede evaluar resultados");
    }
  }),
  validateFields,
];

complementaryVali.validateRateAllSchedules = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateRequestInExecution(id);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede evaluar resultados");
    }
  }),
  validateFields,
];

// ==================== RF-12: Subida de eventos mensuales ====================

complementaryVali.validateAddEvents = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await complementaryScheduleHelper.validateRequestInExecutionForEvents(id);
  }),
  check("eventos", "Los eventos son obligatorios").notEmpty(),
  check("eventos", "Los eventos deben ser un array").isArray({ min: 1 }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token);
    }
  }),
  validateFields,
];

complementaryVali.validateEventsSummary = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

// ==================== RF-12: Solicitud de ampliación de ficha ====================

complementaryVali.validateRequestExtension = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  // Bloquear si ya existe una solicitud de ampliación PENDIENTE para esta ficha,
  // y verificar que la ficha esté en un estado válido para pedir ampliación.
  check("id").custom(async (id) => {
    const request = await ComplementaryRequest.findById(id);
    if (!request) throw new Error("Solicitud no encontrada");
    const pendiente = request.extensionRequests.find((e) => e.status === "PENDIENTE");
    if (pendiente) {
      throw new Error("Ya existe una solicitud de ampliación pendiente para esta ficha");
    }
    if (!["EJECUCION", "PROGRAMADA"].includes(request.state)) {
      throw new Error("Solo se puede solicitar ampliación en fichas en ejecución o programación");
    }
  }),
  check("observaciones", "Las observaciones son obligatorias").notEmpty(),
  check("observaciones", "Las observaciones deben ser texto").isString(),
  check("token").custom(async (token) => {
    await validateTokenComplementaria(token);
  }),
  validateFields,
];

complementaryVali.validateResolveExtension = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("extId", "El extId es obligatorio").notEmpty(),
  check("extId", "El extId no es valido").isMongoId(),
  check("status", "El estado es obligatorio").notEmpty(),
  check("status", "El estado no es valido").isIn(["APROBADA", "RECHAZADA"]),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede resolver solicitudes de ampliación");
    }
  }),
  validateFields,
];

complementaryVali.validateGetExtensionRequests = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await validateExistRequestById(id);
  }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

// ==================== CRUD Parámetros (Tipos de Programa / Población) ====================

const tiposParametro = ["programa", "poblacion"];
// Solo ADMIN puede hacer CRUD de parámetros (crear/editar/activar/desactivar
// los valores de las listas de tipo de programa y tipo de población).
// Coordinadores y programadores ya NO tienen este permiso.
const rolesPermitidosParametro = ["ADMIN"];

complementaryVali.validateExistParametro = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await complementaryParametroHelper.validateExistParametroById(id);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
  }),
  validateFields,
];

complementaryVali.validateRegisterParametro = [
  check("nombre", "El nombre es obligatorio").notEmpty(),
  check("nombre", "El nombre debe ser string").isString(),
  check("tipo", "El tipo es obligatorio").notEmpty(),
  check("tipo", "El tipo no es valido").isIn(tiposParametro),
  check("nombre").custom(async (nombre, { req }) => {
    await complementaryParametroHelper.validateNombreUniqueByTipo(
      nombre,
      req.body.tipo
    );
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!rolesPermitidosParametro.includes(decoded?.rol)) {
      throw new Error("No tiene permisos para crear parametros");
    }
  }),
  validateFields,
];

complementaryVali.validateUpdateParametro = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await complementaryParametroHelper.validateExistParametroById(id);
  }),
  check("nombre", "El nombre es obligatorio").notEmpty(),
  check("nombre", "El nombre debe ser string").isString(),
  check("tipo", "El tipo es obligatorio").notEmpty(),
  check("tipo", "El tipo no es valido").isIn(tiposParametro),
  check("nombre").custom(async (nombre, { req }) => {
    await complementaryParametroHelper.validateNombreUniqueByTipo(
      nombre,
      req.body.tipo,
      req.params.id
    );
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!rolesPermitidosParametro.includes(decoded?.rol)) {
      throw new Error("No tiene permisos para editar parametros");
    }
  }),
  validateFields,
];

complementaryVali.validateDeactivateParametro = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await complementaryParametroHelper.validateExistParametroById(id);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!rolesPermitidosParametro.includes(decoded?.rol)) {
      throw new Error("No tiene permisos para desactivar parametros");
    }
  }),
  validateFields,
];

complementaryVali.validateActivateParametro = [
  check("id", "El id es obligatorio").notEmpty(),
  check("id", "El id no es valido").isMongoId(),
  check("id").custom(async (id) => {
    await complementaryParametroHelper.validateExistParametroById(id);
  }),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!rolesPermitidosParametro.includes(decoded?.rol)) {
      throw new Error("No tiene permisos para activar parametros");
    }
  }),
  validateFields,
];

// ==================== Horarios consolidados por instructor ====================

complementaryVali.validateInstructorAllSchedules = [
  check("instructorId", "El instructor es obligatorio").notEmpty(),
  check("instructorId", "El instructor no es valido").isMongoId(),
  check("instructorId").custom(async (instructorId) => {
    await instrHelper.validateExistInstrById(instructorId);
  }),
  // Ventana de fechas opcional (YYYY-MM-DD). Si solo llega uno de los dos, se
  // ignoran ambos (comportamiento compatible hacia atras: trae todo el historico).
  check("desde")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("desde debe ser una fecha valida (YYYY-MM-DD)"),
  check("hasta")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("hasta debe ser una fecha valida (YYYY-MM-DD)"),
  check("desde").custom((desde, { req }) => {
    // Si llega uno sin el otro, se ignoran ambos (no hay error, solo no se filtra).
    if ((desde && !req.query.hasta) || (!desde && req.query.hasta)) {
      return true;
    }
    if (desde && req.query.hasta && new Date(desde) > new Date(req.query.hasta)) {
      throw new Error("desde no puede ser mayor que hasta");
    }
    return true;
  }),
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "VERIFY") {
      await validateTokenComplementaria(token);
    } else {
      await validateToken(token, false);
    }
  }),
  validateFields,
];

// ==================== Auditoría DF-14 (antes complementaryAudit.validation.js) ====================

complementaryVali.validateAuditDF14 = [
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede auditar archivos DF14");
    }
  }),
  validateFields,
];

// Validación del endpoint de prueba/demo del DF-14A automático (scraping manual).
// Roles restringidos a ADMIN y PROGRAMADOR: el endpoint corre Playwright y usa
// credenciales SOFIA sensibles (SOFIA_USER/SOFIA_PASS).
complementaryVali.validateAuditDF14Test = [
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador o programador puede ejecutar el reporte DF-14A");
    }
  }),
  validateFields,
];

// Validación del polling de estado de la auditoría DF14 (GET /reports/audit-df14/status/:jobId).
// Mismos roles que validateAuditDF14: ADMIN, COORDINADOR, PROGRAMADOR.
complementaryVali.validateAuditDF14Status = [
  check("jobId", "El jobId es obligatorio").notEmpty(),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede consultar la auditoría DF14");
    }
  }),
  validateFields,
];

// Validación para listar el historial de reportes DF14A.
// Roles permitidos: ADMIN, COORDINADOR, PROGRAMADOR.
complementaryVali.validateDf14aHistory = [
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede consultar el historial de reportes DF14A");
    }
    return true;
  }),
  check("page").optional().isInt({ min: 1 }).withMessage("page debe ser un número entero mayor a 0"),
  check("limit").optional().isInt({ min: 1 }).withMessage("limit debe ser un número entero mayor a 0"),
  check("type").optional().isIn(["cron_scraper", "manual_scraper", "manual_upload"]).withMessage("El tipo de reporte no es válido"),
  validateFields,
];

// Validación para ver el detalle de un reporte DF14A.
// Roles permitidos: ADMIN, COORDINADOR, PROGRAMADOR.
complementaryVali.validateDf14aHistoryById = [
  check("id", "El ID es obligatorio").notEmpty(),
  check("id", "El ID no es válido").isMongoId(),
  check("token").custom(async (token) => {
    await validateToken(token);
    const decoded = jwt.decode(token);
    if (!["ADMIN", "COORDINADOR", "PROGRAMADOR"].includes(decoded?.rol)) {
      throw new Error("Solo un administrador, coordinador o programador puede ver los detalles del reporte DF14A");
    }
    return true;
  }),
  validateFields,
];

export { complementaryVali };