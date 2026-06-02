import { Router } from "express";
import { compCtrl } from "../controller/complementary.controller.js";
import { complementaryVali } from "../validations/complementary.validation.js";

const {
  validateExistCatalog,
  validateHeaders,
  validateSendCode,
  validateVerifyCode,
  validateRegisterRequest,
  validateExistRequest,
  validateUpdateRequest,
  validateResubmitRequest,
  validateInstructorRequests,
  validateApprove,
  validateReject,
  validateAssignFicha,
  validateChangeState,
  validateCloseFicha,
  validateScheduleComplementary,
  validateReportQuery,
  validateReschedule,
} = complementaryVali;

const {
  sendCode,
  verifyCode,
  getCatalogs,
  getCatalogId,
  uploadExcel,
  getComplementaryCoordinator,
  registerRequest,
  getRequests,
  getRequestId,
  getInstructorRequests,
  updateRequest,
  resubmitRequest,
  approveRequest,
  rejectRequest,
  assignFicha,
  changeState,
  closeFicha,
  scheduleComplementary,
  getFichasSinRuta,
  getProyeccionMensual,
  getFichasPorEstado,
  getHorasPorMes,
  rescheduleFicha,
} = compCtrl;

const routerComplementary = Router();

// ==================== RF-01: Acceso con código ====================

/**
 * @swagger
 * /api/complementary/access/send-code:
 *   post:
 *     summary: Envía código de verificación al correo del instructor
 *     tags: [Complementarias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "instructor@sena.edu.co"
 *     responses:
 *       200:
 *         description: Código enviado correctamente
 *       401:
 *         description: Instructor no encontrado
 */
routerComplementary.post("/access/send-code", validateSendCode, sendCode);

/**
 * @swagger
 * /api/complementary/access/verify-code:
 *   post:
 *     summary: Verifica código y devuelve token de acceso a complementarias
 *     tags: [Complementarias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "384729"
 *     responses:
 *       200:
 *         description: Acceso concedido, retorna token JWT
 */
routerComplementary.post("/access/verify-code", validateVerifyCode, verifyCode);

// ==================== RF-02: Catálogo de cursos ====================

/**
 * @swagger
 * /api/complementary/catalog:
 *   get:
 *     summary: Obtiene todos los cursos del catalogo de complementarias
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *         description: "Filtrar por estado (0=activo, 1=inactivo)"
 *       - in: query
 *         name: prfDenominacion
 *         schema:
 *           type: string
 *         description: Buscar por nombre del curso
 *       - in: query
 *         name: prfCodigo
 *         schema:
 *           type: number
 *         description: Buscar por codigo del programa
 *       - in: query
 *         name: lineaTecnologica
 *         schema:
 *           type: string
 *         description: Filtrar por linea tecnologica
 *       - in: query
 *         name: redConocimiento
 *         schema:
 *           type: string
 *         description: Filtrar por red de conocimiento
 *     responses:
 *       200:
 *         description: Lista de cursos del catalogo
 */
routerComplementary.get("/catalog", validateHeaders, getCatalogs);

/**
 * @swagger
 * /api/complementary/catalog/{id}:
 *   get:
 *     summary: Obtiene un curso del catalogo por ID
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso encontrado
 */
routerComplementary.get("/catalog/:id", validateExistCatalog, getCatalogId);

/**
 * @swagger
 * /api/complementary/catalog/upload:
 *   post:
 *     summary: Carga masiva de cursos desde Excel (reemplazo completo del catalogo)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Carga masiva completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: number
 *                     skippedVirtual:
 *                       type: number
 *                     errors:
 *                       type: number
 *                     total:
 *                       type: number
 */
routerComplementary.post("/catalog/upload", validateHeaders, uploadExcel);

// ==================== Coordinador de complementarias ====================

routerComplementary.get("/coordinator", validateHeaders, getComplementaryCoordinator);

// ==================== RF-03: Solicitudes de complementarias ====================

/**
 * @swagger
 * /api/complementary/requests/register:
 *   post:
 *     summary: Registra una nueva solicitud de complementaria
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalogCourse
 *             properties:
 *               catalogCourse:
 *                 type: string
 *                 description: ID del curso del catalogo
 *               environment:
 *                 type: string
 *               formationDocument:
 *                 type: string
 *               competencies:
 *                 type: array
 *                 items:
 *                   type: string
 *               outcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *               learningActivity:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               fechaFin:
 *                 type: string
 *                 format: date
 *               fechaInscripcion:
 *                 type: string
 *                 format: date
 *               fechaMatriculaInicio:
 *                 type: string
 *                 format: date
 *               fechaMatriculaFin:
 *                 type: string
 *                 format: date
 *               municipio:
 *                 type: string
 *               vereda:
 *                 type: string
 *               direccion:
 *                 type: string
 *               nombreEmpresa:
 *                 type: string
 *               nitEmpresa:
 *                 type: string
 *               contactoEmpresa:
 *                 type: string
 *               telefonoEmpresa:
 *                 type: string
 *               numAprendices:
 *                 type: number
 *               tipoPrograma:
 *                 type: string
 *               tipoPoblacion:
 *                 type: string
 *               requisitosIngreso:
 *                 type: string
 *               recursosNecesarios:
 *                 type: string
 *               proyectoAsociado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitud registrada correctamente
 */
routerComplementary.post("/requests/register", validateRegisterRequest, registerRequest);

/**
 * @swagger
 * /api/complementary/requests:
 *   get:
 *     summary: Obtiene todas las solicitudes de complementarias (admin ve todo, instructor solo las suyas)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: "Filtrar por estado (PENDIENTE, APROBADA, RECHAZADA, FICHA_ASIGNADA, etc.)"
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *         description: Filtrar por ID de instructor
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 */
routerComplementary.get("/requests", validateHeaders, getRequests);

/**
 * @swagger
 * /api/complementary/requests/{id}:
 *   get:
 *     summary: Obtiene una solicitud por ID
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Solicitud encontrada
 */
routerComplementary.get("/requests/:id", validateExistRequest, getRequestId);

/**
 * @swagger
 * /api/complementary/instructor/requests:
 *   get:
 *     summary: Obtiene las solicitudes del instructor autenticado
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes del instructor
 */
routerComplementary.get("/instructor/requests", validateInstructorRequests, getInstructorRequests);

/**
 * @swagger
 * /api/complementary/requests/{id}:
 *   put:
 *     summary: Edita una solicitud rechazada (solo instructor dueno)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Solicitud actualizada correctamente
 *       401:
 *         description: No autorizado o solicitud no pertenece al instructor
 */
routerComplementary.put("/requests/:id", validateUpdateRequest, updateRequest);

/**
 * @swagger
 * /api/complementary/requests/{id}/resubmit:
 *   put:
 *     summary: Reenvia una solicitud rechazada (estado -> PENDIENTE)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Solicitud reenviada correctamente
 */
routerComplementary.put("/requests/:id/resubmit", validateResubmitRequest, resubmitRequest);

// ==================== RF-04: Aprobacion de solicitudes ====================

/**
 * @swagger
 * /api/complementary/approvals/{id}/approve:
 *   put:
 *     summary: Aprueba una solicitud pendiente (solo coordinador/admin)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Solicitud aprobada correctamente
 *       400:
 *         description: Solicitud no existe o no esta en PENDIENTE
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/approvals/:id/approve", validateApprove, approveRequest);

/**
 * @swagger
 * /api/complementary/approvals/{id}/reject:
 *   put:
 *     summary: Rechaza una solicitud pendiente (solo coordinador/admin)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - observations
 *             properties:
 *               observations:
 *                 type: string
 *                 example: "Faltan documentos requeridos"
 *     responses:
 *       200:
 *         description: Solicitud rechazada correctamente
 *       400:
 *         description: Solicitud no existe o faltan observaciones
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/approvals/:id/reject", validateReject, rejectRequest);

// ==================== RF-05: Asignación de ficha y gestión de estados ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/assign-ficha:
 *   put:
 *     summary: Asigna número de ficha a una solicitud aprobada (solo admin)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fichaNumber
 *               - fechaInicio
 *               - fechaFin
 *               - fechaInscripcion
 *               - fechaMatriculaInicio
 *               - fechaMatriculaFin
 *             properties:
 *               fichaNumber:
 *                 type: string
 *                 example: "2845123"
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *               fechaInscripcion:
 *                 type: string
 *                 format: date-time
 *               fechaMatriculaInicio:
 *                 type: string
 *                 format: date-time
 *               fechaMatriculaFin:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Ficha asignada correctamente
 *       400:
 *         description: Solicitud no existe o no está en APROBADA
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/requests/:id/assign-ficha", validateAssignFicha, assignFicha);

/**
 * @swagger
 * /api/complementary/requests/{id}/state:
 *   put:
 *     summary: Cambia el estado de una solicitud manualmente (solo admin)
 *     description: Avanza estados (FICHA_ASIGNADA → INSCRIPCION → PROGRAMADA) o cancela (→ CANCELADA)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newState
 *             properties:
 *               newState:
 *                 type: string
 *                 enum: [FICHA_ASIGNADA, INSCRIPCION, PROGRAMADA, CANCELADA]
 *                 example: "INSCRIPCION"
 *               observations:
 *                 type: string
 *                 description: Obligatorias si newState es CANCELADA
 *                 example: "Ficha cancelada por falta de inscripciones"
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Transición no válida o solicitud no existe
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/requests/:id/state", validateChangeState, changeState);

// ==================== RF-12: Cierre de ficha complementaria ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/close:
 *   put:
 *     summary: Cierra una ficha complementaria (solo admin/coordinador)
 *     description: Valida que todos los resultados de aprendizaje esten evaluados antes de cerrar
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ficha cerrada correctamente
 *       400:
 *         description: Solicitud no existe, no esta en PROGRAMADA, o hay outcomes sin evaluar
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/requests/:id/close", validateCloseFicha, closeFicha);

// ==================== RF-08: Programación horaria complementaria ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/schedule:
 *   put:
 *     summary: Programa el horario de una solicitud complementaria (solo admin/programador)
 *     description: Crea un Schedule con scheduleType COMPLEMENTARIA, valida disponibilidad del instructor y ambiente contra TODA la colección Schedule
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructor
 *               - days
 *               - fstart
 *               - fend
 *               - tstart
 *               - tend
 *               - events
 *             properties:
 *               instructor:
 *                 type: string
 *                 description: ID del instructor
 *               environment:
 *                 type: string
 *                 description: ID del ambiente (opcional)
 *               days:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "Dias de la semana [0=Dom, 1=Lun, ..., 6=Sab]"
 *                 example: [1, 2, 3]
 *               fstart:
 *                 type: string
 *                 format: date-time
 *               fend:
 *                 type: string
 *                 format: date-time
 *               tstart:
 *                 type: string
 *                 example: "07:00"
 *               tend:
 *                 type: string
 *                 example: "12:00"
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                     idInstructor:
 *                       type: string
 *                     autogenerated:
 *                       type: boolean
 *               supporttext:
 *                 type: string
 *               observation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Horario programado correctamente
 *       400:
 *         description: Error de validación (conflictos, solicitud no válida, límite de horas)
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/requests/:id/schedule", validateScheduleComplementary, scheduleComplementary);

// ==================== RF-10: Reportes ====================

/**
 * @swagger
 * /api/complementary/reports/fichas-sin-ruta:
 *   get:
 *     summary: Fichas asignadas sin Schedule creado
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte generado correctamente
 */
routerComplementary.get("/reports/fichas-sin-ruta", validateReportQuery, getFichasSinRuta);

/**
 * @swagger
 * /api/complementary/reports/proyeccion-mensual:
 *   get:
 *     summary: Proyeccion de fichas complementarias por mes
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: number
 *       - in: query
 *         name: anio
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Reporte generado correctamente
 */
routerComplementary.get("/reports/proyeccion-mensual", validateReportQuery, getProyeccionMensual);

/**
 * @swagger
 * /api/complementary/reports/fichas-estado:
 *   get:
 *     summary: Fichas agrupadas por estado
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reporte generado correctamente
 */
routerComplementary.get("/reports/fichas-estado", validateReportQuery, getFichasPorEstado);

/**
 * @swagger
 * /api/complementary/reports/horas-por-mes:
 *   get:
 *     summary: Horas complementarias por mes, restantes, comparativo por instructor
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *       - in: query
 *         name: mes
 *         schema:
 *           type: number
 *       - in: query
 *         name: anio
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Reporte generado correctamente
 */
routerComplementary.get("/reports/horas-por-mes", validateReportQuery, getHorasPorMes);

// ==================== RF-10: Reprogramacion ====================

/**
 * @swagger
 * /api/complementary/schedule/{id}/reschedule:
 *   put:
 *     summary: Reprograma fechas de un Schedule complementario (solo admin/coordinador)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fstart
 *               - fend
 *               - tstart
 *               - tend
 *               - days
 *               - events
 *             properties:
 *               fstart:
 *                 type: string
 *                 format: date-time
 *               fend:
 *                 type: string
 *                 format: date-time
 *               tstart:
 *                 type: string
 *               tend:
 *                 type: string
 *               days:
 *                 type: array
 *                 items:
 *                   type: number
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Horario reprogramado correctamente
 *       400:
 *         description: Error de validacion
 */
routerComplementary.put("/schedule/:id/reschedule", validateReschedule, rescheduleFicha);

export { routerComplementary };
