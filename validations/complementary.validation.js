import { check } from "express-validator";
import jwt from "jsonwebtoken";
import webToken from "../middlewares/webToken.js";
import { validateFields } from "../middlewares/validateFields.js";
import { complementaryHelper } from "../helpers/complementary.helper.js";
import { complementaryScheduleHelper } from "../helpers/complementarySchedule.helper.js";

const {
  validateExistCatalogById,
  validateExistRequestById,
  validateRequestOwner,
  validateRequestRejected,
  validateRequestPending,
  validateRequestApproved,
  validateFichaNumberUnique,
  validateStateTransition,
} = complementaryHelper;

const { validateToken, validateTokenComplementaria } = webToken;

const complementaryVali = {};

complementaryVali.validateHeaders = [
  check("token").custom(async (token) => {
    const decoded = jwt.decode(token);
    if (decoded?.scope === "COMPLEMENTARIA") {
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
    await validateToken(token);
  }),
  validateFields,
];

complementaryVali.validateRegisterRequest = [
  check("catalogCourse", "El curso del catálogo es obligatorio").notEmpty(),
  check("catalogCourse", "El curso del catálogo no es valido").isMongoId(),
  check("catalogCourse").custom(async (catalogCourse) => {
    await validateExistCatalogById(catalogCourse);
  }),
  check("token").custom(async (token) => {
    await validateTokenComplementaria(token);
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
    await validateToken(token);
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
  check("fichaNumber", "El número de ficha es obligatorio").notEmpty(),
  check("fichaNumber").custom(async (fichaNumber, { req }) => {
    await validateFichaNumberUnique(fichaNumber, req.params.id);
  }),
  check("fechaInicio", "La fecha de inicio es obligatoria").notEmpty(),
  check("fechaInicio", "La fecha de inicio no es valida").isISO8601(),
  check("fechaFin", "La fecha de fin es obligatoria").notEmpty(),
  check("fechaFin", "La fecha de fin no es valida").isISO8601(),
  check("fechaInscripcion", "La fecha de inscripcion es obligatoria").notEmpty(),
  check("fechaInscripcion", "La fecha de inscripcion no es valida").isISO8601(),
  check("fechaMatriculaInicio", "La fecha de inicio de matrícula es obligatoria").notEmpty(),
  check("fechaMatriculaInicio", "La fecha de inicio de matrícula no es valida").isISO8601(),
  check("fechaMatriculaFin", "La fecha de fin de matrícula es obligatoria").notEmpty(),
  check("fechaMatriculaFin", "La fecha de fin de matrícula no es valida").isISO8601(),
  check("token").custom(async (token) => {
    await validateToken(token, true);
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
    "PROGRAMADA",
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
    await validateToken(token, true);
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
    await validateToken(token, true);
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
  check("fstart", "La fecha de inicio es obligatoria").notEmpty(),
  check("fstart", "La fecha de inicio no es valida").isISO8601(),
  check("fend", "La fecha de fin es obligatoria").notEmpty(),
  check("fend", "La fecha de fin no es valida").isISO8601(),
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
    await validateToken(token, true);
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
  }),
  validateFields,
];

export { complementaryVali };
