import { Router } from "express";
import { compCtrl } from "../controller/complementary.controller.js";
import { complementaryVali } from "../validations/complementary.validation.js";

const {
  validateExistCatalog,
  validateHeaders,
  validateCatalogQuery,
  validateRequestsQuery,
  validateRequestCounts,
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
  validateReportComplementariasFecha,
  validateReschedule,
  validateUploadStatus,
  validateFormationData,
  validateExistParametro,
  validateRegisterParametro,
  validateUpdateParametro,
  validateDeactivateParametro,
  validateActivateParametro,
  validateGetSchedules,
  validateRateSchedule,
  validateRateAllSchedules,
  validateAddEvents,
  validateEventsSummary,
  validateRequestExtension,
  validateResolveExtension,
  validateGetExtensionRequests,
  validateInstructorAllSchedules,
  validateDashboardSummary,
  validateDf14aHistory,
  validateDf14aHistoryById,
} = complementaryVali;

const { validateAuditDF14, validateAuditDF14Test, validateAuditDF14Status } = complementaryVali;

const {
  sendCode,
  verifyCode,
  getCatalogs,
  getCatalogId,
  uploadExcel,
  getUploadStatus,
  extractCompetencies,
  getComplementaryCoordinator,
  registerRequest,
  getRequests,
  getRequestCounts,
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
  getComplementariasPorFecha,
  rescheduleFicha,
  getCoordinators,
  addFormationData,
  getParametros,
  getParametroById,
  registerParametro,
  updateParametro,
  activateParametro,
  deactivateParametro,
  getRequestSchedules,
  rateSchedule,
  rateAllSchedules,
  addEvents,
  getEventsSummary,
  requestExtension,
  resolveExtension,
  getExtensionRequests,
  getInstructorAllSchedules,
  processDF14,
  runDf14aTest,
  runDf14aTestSimple,
  getDF14Status,
  getDashboardSummary,
  getDf14aHistory,
  getDf14aHistoryById,
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
routerComplementary.get("/catalog", validateCatalogQuery, getCatalogs);

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

/**
 * @swagger
 * /api/complementary/catalog/upload-status/{jobId}:
 *   get:
 *     summary: Consulta el progreso de una carga masiva de catálogo
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado actual del trabajo
 *       404:
 *         description: Trabajo no encontrado o ya expirado
 */
routerComplementary.get("/catalog/upload-status/:jobId", validateUploadStatus, getUploadStatus);

// ==================== Extracción de competencias desde PDF ====================

/**
 * @swagger
 * /api/complementary/extract-competencies:
 *   post:
 *     summary: Extrae competencias de un PDF PRF del SENA (Diseño de Acciones de Formación Complementaria)
 *     description: >
 *       Recibe un PDF (multipart/form-data, campo "pdf") y retorna las competencias extraídas como JSON.
 *       Extracción 100% Node.js (pdfjs-dist). NO guarda en base de datos: el resultado es transitorio;
 *       la persistencia ocurre después vía PUT /api/complementary/requests/:id/formation-data.
 *       Soporta PDFs con una o varias competencias. Los archivos .py del repositorio se conservan pero
 *       dejan de invocarse desde este endpoint.
 *     tags: [Complementarias]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF del PRF SENA (Diseño de Acciones de Formación Complementaria)
 *     responses:
 *       200:
 *         description: Competencias extraídas correctamente
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
 *                     programName:
 *                       type: string
 *                     programCode:
 *                       type: string
 *                     version:
 *                       type: string
 *                       description: Versión del programa
 *                     totalProgramHours:
 *                       type: number
 *                     competencies:
 *                       type: array
 *                       description: Una o varias competencias del PRF
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *                           totalCompetenceHours:
 *                             type: number
 *                             description: Horas por competencia (0 si el PRF no las trae)
 *                           resultados:
 *                             type: array
 *                             description: Resultados de aprendizaje (sección 2). Display-only al persistir.
 *                             items:
 *                               type: string
 *                           conocimientos:
 *                             type: object
 *                             description: Conocimientos (sección 3). Display-only al persistir.
 *                             properties:
 *                               conceptos:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               proceso:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                           criteria:
 *                             type: array
 *                             description: Criterios de evaluación (sección 4). Único que persiste por competencia.
 *                             items:
 *                               type: string
 *       400:
 *         description: No se subió archivo PDF
 *       500:
 *         description: Error en la extracción o PDF sin datos válidos
 */
routerComplementary.post("/extract-competencies", extractCompetencies);

// ==================== Coordinador de complementarias ====================

routerComplementary.get("/coordinator", validateHeaders, getComplementaryCoordinator);

routerComplementary.get("/coordinators", validateHeaders, getCoordinators);

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
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Nombre de la competencia
 *                     code:
 *                       type: string
 *                       description: Código de la competencia (9 dígitos)
 *                     totalCompetenceHours:
 *                       type: number
 *                       description: Duración máxima en horas de la competencia
 *                     criteria:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Criterios de evaluación de la competencia
 *               outcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *               learningActivity:
 *                 type: string
 *               supervisorNombre:
 *                 type: string
 *               ambienteNombre:
 *                 type: string
 *               ambienteDireccion:
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
routerComplementary.get("/requests", validateRequestsQuery, getRequests);

// IMPORTANTE: esta ruta va ANTES de /requests/:id para que Express no trate
// "counts" como un :id. Devuelve contadores por estado (admin: todas | instructor: las suyas).
routerComplementary.get("/requests/counts", validateRequestCounts, getRequestCounts);

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
 * /api/complementary/instructor/{instructorId}/all-schedules:
 *   get:
 *     summary: Obtiene todos los horarios de un instructor (titulada, complementaria y otros)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Horarios clasificados por tipo (titulada, complementaria, otros)
 */
routerComplementary.get("/instructor/:instructorId/all-schedules", validateInstructorAllSchedules, getInstructorAllSchedules);

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

// ==================== RF-04 extendido: Datos de formación ====================

routerComplementary.put("/requests/:id/formation-data", validateFormationData, addFormationData);

// ==================== RF-05: Asignación de ficha y gestión de estados ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/assign-ficha:
 *   put:
 *     summary: Asigna número de ficha a una solicitud aprobada y crea el Fiche en la coordinación PROGRAMAS ESPECIALES (admin, programador o coordinador)
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
 *               codigoSolicitud:
 *                 type: string
 *                 description: "Código de solicitud SOFIA PLUS (opcional)"
 *               fichaCaracterizacion:
 *                 type: string
 *                 description: "Ficha de caracterización SOFIA PLUS (opcional)"
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

// ==================== RF-12: Evaluación de resultados (rated) ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/schedules:
 *   get:
 *     summary: Obtiene los schedules de una solicitud con su estado de evaluación
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
 *         description: Lista de schedules con resumen de evaluación
 */
routerComplementary.get("/requests/:id/schedules", validateGetSchedules, getRequestSchedules);

/**
 * @swagger
 * /api/complementary/requests/{id}/schedules/rate-all:
 *   put:
 *     summary: Marca TODOS los schedules de una solicitud como evaluados (solo admin/coordinador/programador)
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
 *         description: Resultados evaluados correctamente
 *       400:
 *         description: Solicitud no existe o no está en EJECUCION/PROGRAMADA
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/requests/:id/schedules/rate-all", validateRateAllSchedules, rateAllSchedules);

/**
 * @swagger
 * /api/complementary/requests/{id}/schedules/{scheduleId}/rate:
 *   put:
 *     summary: Marca un schedule individual como evaluado (solo admin/coordinador/programador)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado evaluado correctamente
 *       400:
 *         description: Schedule no existe, ya evaluado, o solicitud no está en EJECUCION/PROGRAMADA
 *       403:
 *         description: Sin permisos
 */
routerComplementary.put("/requests/:id/schedules/:scheduleId/rate", validateRateSchedule, rateSchedule);

// ==================== RF-12: Subida de eventos mensuales ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/add-events:
 *   put:
 *     summary: Agrega eventos mensuales al schedule de una solicitud en EJECUCION
 *     description: El instructor o admin puede agregar eventos mes a mes durante la ejecución del curso
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
 *               - eventos
 *             properties:
 *               eventos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *                 description: "Fechas de los eventos a agregar (YYYY-MM-DD)"
 *                 example: ["2026-06-05", "2026-06-10", "2026-06-15", "2026-06-20"]
 *     responses:
 *       200:
 *         description: Eventos agregados correctamente
 *       400:
 *         description: Fechas inválidas, fuera de rango, o solicitud no está en EJECUCION
 *       401:
 *         description: Instructor no es dueño de la solicitud
 */
routerComplementary.put("/requests/:id/add-events", validateAddEvents, addEvents);

/**
 * @swagger
 * /api/complementary/requests/{id}/events-summary:
 *   get:
 *     summary: Resumen de eventos por mes de una solicitud
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
 *         description: Resumen de eventos con horas ejecutadas vs programadas
 */
routerComplementary.get("/requests/:id/events-summary", validateEventsSummary, getEventsSummary);

// ==================== RF-12: Solicitud de ampliación de ficha ====================

/**
 * @swagger
 * /api/complementary/requests/{id}/extension-request:
 *   post:
 *     summary: Instructor solicita ampliación de fecha fin de ficha
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
 *               - newFechaFin
 *               - reason
 *             properties:
 *               newFechaFin:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-15"
 *               reason:
 *                 type: string
 *                 example: "Se requieren más días por ajuste de horario del grupo"
 *     responses:
 *       200:
 *         description: Solicitud de ampliación registrada
 *       400:
 *         description: Ya existe una pendiente, fecha no válida, etc.
 */
routerComplementary.post("/requests/:id/extension-request", validateRequestExtension, requestExtension);

/**
 * @swagger
 * /api/complementary/requests/{id}/extension-request/{extId}/resolve:
 *   put:
 *     summary: Admin aprueba o rechaza solicitud de ampliación
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: extId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APROBADA, RECHAZADA]
 *               observations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitud resuelta correctamente
 *       400:
 *         description: Ya resuelta o no existe
 */
routerComplementary.put("/requests/:id/extension-request/:extId/resolve", validateResolveExtension, resolveExtension);

/**
 * @swagger
 * /api/complementary/requests/{id}/extension-requests:
 *   get:
 *     summary: Lista solicitudes de ampliación de una ficha
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
 *         description: Lista de solicitudes de ampliación
 */
routerComplementary.get("/requests/:id/extension-requests", validateGetExtensionRequests, getExtensionRequests);

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
 * /api/complementary/reports/dashboard-summary:
 *   get:
 *     summary: Resumen consolidado para el dashboard administrativo
 *     description: Consolida métricas clave como fichas sin ruta, juicios por evaluar, distribución por estado, horas totales y proyección mensual.
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen generado correctamente
 *       400:
 *         description: Error en la generación
 *       403:
 *         description: Token inválido o permisos insuficientes
 */
routerComplementary.get("/reports/dashboard-summary", validateDashboardSummary, getDashboardSummary);

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

/**
 * @swagger
 * /api/complementary/reports/complementarias-por-fecha:
 *   get:
 *     summary: Complementarias con clase en una fecha y municipio específicos (coordinación PROGRAMAS ESPECIALES)
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: town
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del municipio (Environment.town)
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha ISO (YYYY-MM-DD) del día a consultar
 *     responses:
 *       200:
 *         description: Reporte generado correctamente
 *       400:
 *         description: Parámetros inválidos o no existe la coordinación PROGRAMAS ESPECIALES
 */
routerComplementary.get("/reports/complementarias-por-fecha", validateReportComplementariasFecha, getComplementariasPorFecha);

// ==================== RF-10: Auditoría DF-14 / DF-14A ====================

/**
 * @swagger
 * /api/complementary/reports/audit-df14:
 *   post:
 *     summary: Procesa el archivo DF14 para auditoría masiva de Rutas y Juicios.
 *     tags: [Complementarias]
 *     security:
 *       - token: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Auditoría masiva completada exitosamente
 */
routerComplementary.post("/reports/audit-df14", validateAuditDF14, processDF14);

/**
 * @swagger
 * /api/complementary/reports/audit-df14/status/{jobId}:
 *   get:
 *     summary: Consulta el progreso/resultado de una auditoría DF14 por jobId (polling).
 *     tags: [Complementarias]
 *     security:
 *       - token: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del job retornado por POST /reports/audit-df14
 *     responses:
 *       200:
 *         description: Estado actual del job (percent, done, failed, faltanRutas, faltanJuicios, detalles...)
 *       404:
 *         description: Job no encontrado o ya expirado.
 */
routerComplementary.get("/reports/audit-df14/status/:jobId", validateAuditDF14Status, getDF14Status);

routerComplementary.get("/reports/df14a/history", validateDf14aHistory, getDf14aHistory);
routerComplementary.get("/reports/df14a/history/:id", validateDf14aHistoryById, getDf14aHistoryById);

/**
 * @swagger
 * /api/complementary/reports/df14a/run:
 *   post:
 *     summary: Ejecuta el reporte DF-14A desde SOFIA Plus (prueba/demo). Dispara el scraping automático manualmente.
 *     description: Lanza el mismo flujo del cron mensual (descarga + procesamiento + notificaciones reales). Puede tardar varios minutos. Roles ADMIN/PROGRAMADOR.
 *     tags: [Complementarias]
 *     security:
 *       - token: []
 *     responses:
 *       200:
 *         description: Reporte DF-14A procesado correctamente (incluye sinRuta, sinJuicios y resumen de notificaciones).
 *       409:
 *         description: Ya hay una ejecución DF-14A en curso.
 *       500:
 *         description: Error (incluye credenciales SOFIA faltantes).
 */
routerComplementary.post("/reports/df14a/run", validateAuditDF14Test, runDf14aTest);
routerComplementary.get("/reports/df14a/run-simple", runDf14aTestSimple);

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

// ==================== CRUD Parámetros (Tipos de Programa / Población) ====================

routerComplementary.get("/parametros", validateHeaders, getParametros);
routerComplementary.get("/parametros/:id", validateExistParametro, getParametroById);
routerComplementary.post("/parametros", validateRegisterParametro, registerParametro);
routerComplementary.put("/parametros/:id", validateUpdateParametro, updateParametro);
routerComplementary.put("/parametros/:id/activate", validateActivateParametro, activateParametro);
routerComplementary.put("/parametros/:id/deactivate", validateDeactivateParametro, deactivateParametro);

export { routerComplementary };
