import { Router } from "express";
import { scheduleCtrl } from "../controller/schedule.controller.js";
import { scheduleVali } from "../validations/schedule.validation.js";

const {
  validateRegisterSchedule,
  validateExistSchedule,
  validateUpdateSchedule,
  validateScheduleEdit,
  validateFiche,
  validateSchedule,
  validateHeaders,
  validateActiveSchedule,
} = scheduleVali;

const {
  getScheduleId,
  registerSchedule,
  getSchedules,
  getDataValidateSchedule,
  getScheduleFiche,
  getDataValidateEditSchedule,
  getSchedulesLimit,
  updateSchedule,
  activeSchedule,
  inactiveSchedule,
  deleteEventSchedule,
} = scheduleCtrl;

const routerSchedule = Router();

/**
 * @swagger
 * /api/schedules/getthundredschedules:
 *   get:
 *     summary: Obtiene los últimos 100 horarios
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de los últimos 100 horarios registrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
routerSchedule.get("/getthundredschedules", validateHeaders, getSchedulesLimit);

/**
 * @swagger
 * /api/schedules/fiche/{id}:
 *   get:
 *     summary: Obtiene todos los horarios de una ficha
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ficha
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de horarios de la ficha
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
routerSchedule.get("/fiche/:id", validateFiche, getScheduleFiche);

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Obtiene un horario por ID
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Horario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerSchedule.get("/:id", validateExistSchedule, getScheduleId);

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Obtiene todos los horarios
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los horarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
routerSchedule.get("/", validateHeaders, getSchedules);

/**
 * @swagger
 * /api/schedules/validateschedule:
 *   post:
 *     summary: Valida un horario antes de registrarlo
 *     description: Genera los eventos del horario sin guardarlo en la base de datos. Útil para verificar disponibilidad antes de crear el horario.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *           example:
 *             fiche: "507f1f77bcf86cd799439011"
 *             program: "507f1f77bcf86cd799439012"
 *             competence: "507f1f77bcf86cd799439013"
 *             outcome: "507f1f77bcf86cd799439014"
 *             instructor: "507f1f77bcf86cd799439015"
 *             environment: "507f1f77bcf86cd799439016"
 *             days: [1, 3, 5]
 *             fstart: "2024-02-01T00:00:00.000Z"
 *             fend: "2024-03-01T00:00:00.000Z"
 *             tstart: "07:00"
 *             tend: "10:00"
 *     responses:
 *       200:
 *         description: Horario validado con eventos generados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   description: "Eventos generados para las fechas especificadas"
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       idInstructor:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439015"
 *                       title:
 *                         type: string
 *                         example: "Carlos Instructor"
 *                       start:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-05T07:00:00.000Z"
 *                       autogenerated:
 *                         type: boolean
 *                         example: true
 */
routerSchedule.post(
  "/validateschedule",
  validateSchedule,
  getDataValidateSchedule
);

/**
 * @swagger
 * /api/schedules/validateeditschedule/{id}:
 *   post:
 *     summary: Valida la edición de un horario existente
 *     description: Genera los eventos del horario modificado sin guardarlo. Útil para verificar disponibilidad antes de actualizar.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario a editar
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Horario validado con eventos generados
 */
routerSchedule.post(
  "/validateeditschedule/:id",
  validateScheduleEdit,
  getDataValidateEditSchedule
);

/**
 * @swagger
 * /api/schedules/register:
 *   post:
 *     summary: Registra un nuevo horario
 *     description: Crea un nuevo horario en el sistema. Los eventos deben generarse previamente con el endpoint de validación.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Schedule'
 *               - type: object
 *                 required:
 *                   - fiche
 *                   - program
 *                   - competence
 *                   - outcome
 *                   - instructor
 *                   - environment
 *                   - days
 *                   - fstart
 *                   - fend
 *                   - tstart
 *                   - tend
 *                   - events
 *                 properties:
 *                   events:
 *                     type: array
 *                     description: "Eventos generados por la validación. Cada evento representa una fecha específica de clase."
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                           example: 1
 *                         idInstructor:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439015"
 *                         title:
 *                           type: string
 *                           example: "Carlos Instructor"
 *                         start:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-02-05T07:00:00.000Z"
 *                         autogenerated:
 *                           type: boolean
 *                           example: true
 *           example:
 *             fiche: "507f1f77bcf86cd799439011"
 *             program: "507f1f77bcf86cd799439012"
 *             competence: "507f1f77bcf86cd799439013"
 *             outcome: "507f1f77bcf86cd799439014"
 *             instructor: "507f1f77bcf86cd799439015"
 *             environment: "507f1f77bcf86cd799439016"
 *             days: [1, 3, 5]
 *             fstart: "2024-02-01T00:00:00.000Z"
 *             fend: "2024-03-01T00:00:00.000Z"
 *             tstart: "07:00"
 *             tend: "10:00"
 *             supporttext: "APOYO DIDÁCTICO"
 *             observation: "HORARIO REGULAR"
 *             events:
 *               - id: 1
 *                 idInstructor: "507f1f77bcf86cd799439015"
 *                 title: "Carlos Instructor"
 *                 start: "2024-02-05T07:00:00.000Z"
 *                 autogenerated: true
 *               - id: 2
 *                 idInstructor: "507f1f77bcf86cd799439015"
 *                 title: "Carlos Instructor"
 *                 start: "2024-02-07T07:00:00.000Z"
 *                 autogenerated: true
 *     responses:
 *       200:
 *         description: Horario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Horario registrado correctamente"
 *                 schedule:
 *                   $ref: '#/components/schemas/Schedule'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerSchedule.post("/register", validateRegisterSchedule, registerSchedule);

/**
 * @swagger
 * /api/schedules/active/{id}:
 *   put:
 *     summary: Activa un horario
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Horario activado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Horario activado correctamente"
 */
routerSchedule.put("/active/:id", validateActiveSchedule, activeSchedule);

/**
 * @swagger
 * /api/schedules/inactive/{id}:
 *   put:
 *     summary: Inactiva un horario
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Horario desactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Horario desactivado correctamente"
 */
routerSchedule.put("/inactive/:id", validateExistSchedule, inactiveSchedule);

/**
 * @swagger
 * /api/schedules/update/{id}:
 *   put:
 *     summary: Actualiza un horario existente
 *     description: Modifica un horario. Los eventos deben validarse previamente con el endpoint de validación de edición.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario a actualizar
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Schedule'
 *               - type: object
 *                 properties:
 *                   events:
 *                     type: array
 *                     description: "Eventos generados por la validación de edición"
 *                     items:
 *                       type: object
 *           example:
 *             competence: "507f1f77bcf86cd799439013"
 *             outcome: "507f1f77bcf86cd799439014"
 *             instructor: "507f1f77bcf86cd799439015"
 *             environment: "507f1f77bcf86cd799439016"
 *             days: [1, 3, 5]
 *             tstart: "07:00"
 *             tend: "10:00"
 *             supporttext: "APOYO DIDÁCTICO ACTUALIZADO"
 *             observation: "HORARIO MODIFICADO"
 *             events:
 *               - id: 1
 *                 idInstructor: "507f1f77bcf86cd799439015"
 *                 title: "Carlos Instructor"
 *                 start: "2024-02-05T07:00:00.000Z"
 *                 autogenerated: true
 *     responses:
 *       200:
 *         description: Horario actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Horario actualizado correctamente"
 *                 schedule:
 *                   $ref: '#/components/schemas/Schedule'
 */
routerSchedule.put("/update/:id", validateUpdateSchedule, updateSchedule);

/**
 * @swagger
 * /api/schedules/deleteevent/{id}:
 *   put:
 *     summary: Elimina un evento específico del horario
 *     description: Elimina una fecha específica de un horario. Si el horario tiene solo un evento, no se puede eliminar.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario
 *         example: "507f1f77bcf86cd799439011"
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
 *                 description: "Fecha del evento a eliminar en formato YYYY-MM-DD"
 *                 example: "2024-02-05"
 *     responses:
 *       200:
 *         description: Evento eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Evento eliminado correctamente"
 *       400:
 *         description: No se puede eliminar el último evento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No se puede eliminar el último evento del horario"
 */
routerSchedule.put(
  "/deleteevent/:id",
  validateExistSchedule,
  deleteEventSchedule
);

export { routerSchedule };
