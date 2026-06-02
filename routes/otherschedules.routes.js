import { Router } from "express";
import { otherScheduleCtrl } from "../controller/otherschedule.controller.js";
import { otherScheduleVali } from "../validations/otherschedule.validation.js";

/**
 * Controller functions containing validation functions for other schedule registration, existence, update, and headers.
 * @typedef {Object} OtherScheduleValidation
 * @property {Function} validateRegisterOtherSchedule - Validates other schedule registration credentials.
 * @property {Function} validateExistOtherSchedule - Validates other schedule existence.
 * @property {Function} validateUpdateOtherSchedule - Validates other schedule update credentials.
 * @property {Function} validateOtherScheduleEdit - Validates other schedule edit credentials.
 * @property {Function} validateOtherSchedule - Validates other schedule credentials.
 * @property {Function} validateHeaders - Validates other schedule headers.
 */

const {
  validateRegisterOtherSchedule,
  validateExistOtherSchedule,
  validateUpdateOtherSchedule,
  validateOtherScheduleEdit,
  validateOtherSchedule,
  validateInstructor,
  validateHeaders,
  validateActiveOtherSchedule,
} = otherScheduleVali;

/**
 * Validation functions functions for getting other schedule ID, registering, getting other schedules, getting other schedules by instructor, getting other schedule data, getting other schedule data for editing, getting other schedules with limit, updating, activating, deactivating, and deleting event.
 * @typedef {Object} OtherScheduleController
 * @property {Function} getOtherScheduleId - Gets other schedule ID.
 * @property {Function} registerOtherSchedule - Registers other schedule.
 * @property {Function} getOthersSchedules - Gets other schedules.
 * @property {Function} getOthersSchedulesInstructor - Gets other schedules by instructor.
 * @property {Function} getDataValidateOtherSchedule - Gets other schedule data.
 * @property {Function} getDataValidateEditOtherSchedule - Gets other schedule data for editing.
 * @property {Function} getOtherSchedulesLimit - Gets other schedules with limit.
 * @property {Function} updateOtherSchedule - Updates other schedule.
 * @property {Function} activeOtherSchedule - Activates other schedule.
 * @property {Function} inactiveOtherSchedule - Deactivates other schedule.
 * @property {Function} deleteEventOtherSchedule - Deletes event.
 */

const {
  getOtherScheduleId,
  registerOtherSchedule,
  getOthersSchedules,
  getOthersSchedulesInstructor,
  getDataValidateOtherSchedule,
  getDataValidateEditOtherSchedule,
  getOtherSchedulesLimit,
  updateOtherSchedule,
  activeOtherSchedule,
  inactiveOtherSchedule,
  deleteEventOtherSchedule,
} = otherScheduleCtrl;

const routerOtherSchedule = Router();

/**
 * @swagger
 * /api/othersschedules/getthundredschedules:
 *   get:
 *     summary: Obtiene los últimos 100 horarios especiales
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de los últimos 100 horarios especiales registrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
routerOtherSchedule.get(
  "/getthundredschedules",
  validateHeaders,
  getOtherSchedulesLimit
);

/**
 * @swagger
 * /api/othersschedules/instructor/{id}:
 *   get:
 *     summary: Obtiene todos los horarios especiales de un instructor
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instructor
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de horarios especiales del instructor
 */
routerOtherSchedule.get(
  "/instructor/:id",
  validateInstructor,
  getOthersSchedulesInstructor
);

/**
 * @swagger
 * /api/othersschedules/{id}:
 *   get:
 *     summary: Obtiene un horario especial por ID
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario especial
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Horario especial encontrado
 */
routerOtherSchedule.get("/:id", validateExistOtherSchedule, getOtherScheduleId);

/**
 * @swagger
 * /api/othersschedules:
 *   get:
 *     summary: Obtiene todos los horarios especiales
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de horarios especiales
 */
routerOtherSchedule.get("/", validateHeaders, getOthersSchedules);

/**
 * @swagger
 * /api/othersschedules/validateschedule:
 *   post:
 *     summary: Valida un horario especial antes de registrarlo
 *     description: Genera los eventos del horario especial sin guardarlo
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Horario validado con eventos generados
 */
routerOtherSchedule.post(
  "/validateschedule",
  validateOtherSchedule,
  getDataValidateOtherSchedule
);

/**
 * @swagger
 * /api/othersschedules/validateeditschedule/{id}:
 *   post:
 *     summary: Valida la edición de un horario especial
 *     description: Genera los eventos del horario especial modificado sin guardarlo
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario especial a editar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Horario validado con eventos generados
 */
routerOtherSchedule.post(
  "/validateeditschedule/:id",
  validateOtherScheduleEdit,
  getDataValidateEditOtherSchedule
);

/**
 * @swagger
 * /api/othersschedules/register:
 *   post:
 *     summary: Registra un nuevo horario especial
 *     description: Crea un nuevo horario especial (seguimiento, reuniones, etc)
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Horario especial registrado correctamente
 */
routerOtherSchedule.post(
  "/register",
  validateRegisterOtherSchedule,
  registerOtherSchedule
);

/**
 * @swagger
 * /api/othersschedules/active/{id}:
 *   put:
 *     summary: Activa un horario especial
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario especial
 *     responses:
 *       200:
 *         description: Horario activado correctamente
 */
routerOtherSchedule.put(
  "/active/:id",
  validateActiveOtherSchedule,
  activeOtherSchedule
);

/**
 * @swagger
 * /api/othersschedules/inactive/{id}:
 *   put:
 *     summary: Inactiva un horario especial
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario especial
 *     responses:
 *       200:
 *         description: Horario desactivado correctamente
 */
routerOtherSchedule.put(
  "/inactive/:id",
  validateExistOtherSchedule,
  inactiveOtherSchedule
);

/**
 * @swagger
 * /api/othersschedules/update/{id}:
 *   put:
 *     summary: Actualiza un horario especial
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario especial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Horario actualizado correctamente
 */
routerOtherSchedule.put(
  "/update/:id",
  validateUpdateOtherSchedule,
  updateOtherSchedule
);

/**
 * @swagger
 * /api/othersschedules/deleteevent/{id}:
 *   put:
 *     summary: Elimina un evento específico del horario especial
 *     tags: [Otros Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario especial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-05"
 *     responses:
 *       200:
 *         description: Evento eliminado correctamente
 */
routerOtherSchedule.put(
  "/deleteevent/:id",
  validateExistOtherSchedule,
  deleteEventOtherSchedule
);

export { routerOtherSchedule };
