import express from 'express';
import {
  getCurrentState,
  clearCurrentState,
  getVencidosReport,
  getVencidosGrouped,
  addLearnerOmission,
  getScheduleOmissions,
  getOmissionsGrouped,
  removeLearnerOmission,
  getAuditHistory,
  getCoordinations,
  getVencidosGroupedByCoordination,
  getCronStatusController,
  toggleCronController,
  getEmailStatusController,
  toggleEmailController,
  runAuditController,
  excludeFicheController,
  includeFicheController,
  getExcludedFichesController,
  getEmailTemplateController,
  updateEmailTemplateController,
  getFailedFichesController,
  omitFailedFicheController,
  getResumenSede,
  getResumenSedeExcel,
  getResumenPorCoordinacionZIP,
  getComparacion
} from '../controller/auditoria.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/auditoria/estado:
 *   get:
 *     summary: Obtiene el estado actual de auditoría
 *     description: Retorna información sobre pendientes y vencidos del sistema de auditoría.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Estado actual de auditoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending:
 *                   type: array
 *                   description: Items pendientes de auditoría
 *                   items:
 *                     type: object
 *                     properties:
 *                       scheduleId:
 *                         type: string
 *                       ficheNumber:
 *                         type: string
 *                       outcomeName:
 *                         type: string
 *                       dateEnd:
 *                         type: string
 *                         format: date-time
 *                 expired:
 *                   type: array
 *                   description: Items vencidos
 *                   items:
 *                     type: object
 *                     properties:
 *                       scheduleId:
 *                         type: string
 *                       ficheNumber:
 *                         type: string
 *                       outcomeName:
 *                         type: string
 *                       daysExpired:
 *                         type: number
 *                 lastUpdate:
 *                   type: string
 *                   format: date-time
 *                   description: Fecha de última actualización
 */
router.get('/estado', getCurrentState);

/**
 * @swagger
 * /api/auditoria/estado:
 *   delete:
 *     summary: Limpia el estado actual de auditoría
 *     description: Fuerza la recarga del estado de auditoría desde la base de datos.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Estado limpiado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Estado actual limpiado y recargado"
 */
router.delete('/estado', clearCurrentState);

/**
 * @swagger
 * /api/auditoria/vencidos:
 *   get:
 *     summary: Obtiene reporte de horarios vencidos
 *     description: Retorna lista de horarios que han superado la fecha fin sin ser calificados.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Lista de horarios vencidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   scheduleId:
 *                     type: string
 *                   ficheNumber:
 *                     type: string
 *                   outcomeName:
 *                     type: string
 *                   dateEnd:
 *                     type: string
 *                     format: date-time
 *                   daysExpired:
 *                     type: number
 *                     description: Días desde que venció
 */
router.get('/vencidos', getVencidosReport);

/**
 * @swagger
 * /api/auditoria/vencidos/agrupados:
 *   get:
 *     summary: Obtiene vencidos agrupados por ficha
 *     description: Retorna los horarios vencidos organizados por ficha para facilitar el análisis.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Vencidos agrupados por ficha
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ficheNumber:
 *                     type: string
 *                   ficheId:
 *                     type: string
 *                   outcomes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         outcomeName:
 *                           type: string
 *                         schedules:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               scheduleId:
 *                                 type: string
 *                               dateEnd:
 *                                 type: string
 *                                 format: date-time
 */
router.get('/vencidos/agrupados', getVencidosGrouped);

/**
 * @swagger
 * /api/auditoria/vencidos/coordinacion/{coordinationId}:
 *   get:
 *     summary: Obtiene vencidos filtrados por coordinación
 *     tags: [Auditoría]
 *     parameters:
 *       - in: path
 *         name: coordinationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la coordinación
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Vencidos de la coordinación especificada
 */
router.get('/vencidos/coordinacion/:coordinationId', getVencidosGroupedByCoordination);

/**
 * @swagger
 * /api/auditoria/omisiones:
 *   post:
 *     summary: Agrega una omisión de aprendiz
 *     description: Registra que un aprendiz no asistió a una clase programada.
 *     tags: [Auditoría]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleId
 *               - learnerDocument
 *               - learnerName
 *             properties:
 *               scheduleId:
 *                 type: string
 *                 description: ID del horario
 *               learnerDocument:
 *                 type: string
 *                 description: Documento del aprendiz
 *               learnerName:
 *                 type: string
 *                 description: Nombre del aprendiz
 *               reason:
 *                 type: string
 *                 description: Razón de la omisión (opcional)
 *           example:
 *             scheduleId: "507f1f77bcf86cd799439011"
 *             learnerDocument: "12345678"
 *             learnerName: "Juan Aprendiz"
 *             reason: "Estudiante enfermo"
 *     responses:
 *       200:
 *         description: Omisión registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Omisión registrada correctamente"
 */
router.post('/omisiones', addLearnerOmission);

/**
 * @swagger
 * /api/auditoria/omisiones/agrupadas:
 *   get:
 *     summary: Obtiene omisiones agrupadas
 *     description: Retorna las omisiones de aprendices organizadas para su análisis.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Omisiones agrupadas por horario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   scheduleId:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   instructorName:
 *                     type: string
 *                   ficheNumber:
 *                     type: string
 *                   omissions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         learnerDocument:
 *                           type: string
 *                         learnerName:
 *                           type: string
 *                         reason:
 *                           type: string
 */
router.get('/omisiones/agrupadas', getOmissionsGrouped);

/**
 * @swagger
 * /api/auditoria/omisiones/{scheduleId}:
 *   get:
 *     summary: Obtiene omisiones de un horario específico
 *     tags: [Auditoría]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de omisiones del horario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   learnerDocument:
 *                     type: string
 *                   learnerName:
 *                     type: string
 *                   reason:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/omisiones/:scheduleId', getScheduleOmissions);

/**
 * @swagger
 * /api/auditoria/omisiones/{scheduleId}/{learnerDocument}:
 *   delete:
 *     summary: Elimina una omisión de aprendiz
 *     description: Elimina el registro de omisión de un aprendiz específico en un horario.
 *     tags: [Auditoría]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del horario
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: learnerDocument
 *         required: true
 *         schema:
 *           type: string
 *         description: Documento del aprendiz
 *         example: "12345678"
 *     responses:
 *       200:
 *         description: Omisión eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Omisión eliminada correctamente"
 */
router.delete('/omisiones/:scheduleId/:learnerDocument', removeLearnerOmission);

/**
 * @swagger
 * /api/auditoria/historial:
 *   get:
 *     summary: Obtiene el historial de auditorías
 *     description: Retorna el registro de auditorías ejecutadas anteriormente.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Historial de auditorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha de ejecución
 *                   summary:
 *                     type: object
 *                     description: Resumen de la auditoría
 *                     properties:
 *                       totalFiches:
 *                         type: number
 *                       totalOutcomes:
 *                         type: number
 *                       totalPending:
 *                         type: number
 *                       totalExpired:
 *                         type: number
 *                   reportFile:
 *                     type: string
 *                     description: URL del reporte generado
 */
router.get('/historial', getAuditHistory);

/**
 * @swagger
 * /api/auditoria/coordinaciones:
 *   get:
 *     summary: Obtiene coordinaciones disponibles
 *     description: Retorna lista de coordinaciones para filtrar reportes de auditoría.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Lista de coordinaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *                   town:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 */
router.get('/coordinaciones', getCoordinations);

/**
 * @swagger
 * /api/auditoria/cron/status:
 *   get:
 *     summary: Obtiene el estado del cron de auditoría
 *     description: Retorna información sobre si el cron automático está activo o inactivo.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Estado del cron
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   description: Indica si el cron está habilitado
 *                 active:
 *                   type: boolean
 *                   description: Indica si el cron está actualmente corriendo
 *                 schedule:
 *                   type: string
 *                   description: Programación del cron
 *                   example: "0 1 * * * (1 AM hora Colombia)"
 */
router.get('/cron/status', getCronStatusController);

/**
 * @swagger
 * /api/auditoria/cron/toggle:
 *   post:
 *     summary: Activa o desactiva el cron de auditoría
 *     description: Permite encender o apagar el cron automático de auditoría.
 *     tags: [Auditoría]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: true para activar, false para desactivar
 *                 example: true
 *     responses:
 *       200:
 *         description: Estado del cron actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Cron ACTIVADO"
 */
router.post('/cron/toggle', toggleCronController);

/**
 * @swagger
 * /api/auditoria/cron/run:
 *   post:
 *     summary: Ejecuta la auditoría manualmente
 *     description: Inicia el proceso de auditoría de forma inmediata sin esperar al cron programado. Retorna 409 si ya hay una ejecución en curso.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Auditoría iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auditoría iniciada manualmente. Revisa los logs del servidor para ver el progreso."
 *       409:
 *         description: Ya hay una auditoría en ejecución
 */
router.post('/cron/run', runAuditController);

/**
 * @swagger
 * /api/auditoria/email/status:
 *   get:
 *     summary: Obtiene el estado de las notificaciones por email
 *     description: Retorna si las notificaciones por correo electrónico están activas o inactivas.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Estado de las notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   description: Indica si las notificaciones por email están habilitadas
 */
router.get('/email/status', getEmailStatusController);

/**
 * @swagger
 * /api/auditoria/email/toggle:
 *   post:
 *     summary: Activa o desactiva las notificaciones por email
 *     description: Permite encender o apagar las notificaciones por correo electrónico del proceso de auditoría.
 *     tags: [Auditoría]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: true para activar, false para desactivar
 *                 example: true
 *     responses:
 *       200:
 *         description: Estado de notificaciones actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Notificaciones por email ACTIVADAS"
 */
router.post('/email/toggle', toggleEmailController);

/**
 * @swagger
 * /api/auditoria/fiches/excluded:
 *   get:
 *     summary: Lista fichas excluidas de auditoría
 *     description: Retorna las fichas cuyos schedules están marcados como qualifiable=false.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Lista de fichas excluidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ficheNumber:
 *                         type: string
 *                       schedulesCount:
 *                         type: number
 *                 total:
 *                   type: number
 */
router.get('/fiches/excluded', getExcludedFichesController);

/**
 * @swagger
 * /api/auditoria/fiches/exclude:
 *   post:
 *     summary: Excluye una ficha de la auditoría
 *     description: Marca todos los schedules de una ficha como qualifiable=false para que no sean procesados por el cron.
 *     tags: [Auditoría]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ficheNumber
 *             properties:
 *               ficheNumber:
 *                 type: string
 *                 example: "2451837"
 *     responses:
 *       200:
 *         description: Ficha excluida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedulesUpdated:
 *                   type: number
 */
router.post('/fiches/exclude', excludeFicheController);

/**
 * @swagger
 * /api/auditoria/fiches/include:
 *   post:
 *     summary: Reincluye una ficha en la auditoría
 *     description: Marca todos los schedules de una ficha como qualifiable=true para que vuelvan a ser procesados.
 *     tags: [Auditoría]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ficheNumber
 *             properties:
 *               ficheNumber:
 *                 type: string
 *                 example: "2451837"
 *     responses:
 *       200:
 *         description: Ficha reincluida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedulesUpdated:
 *                   type: number
 */
router.post('/fiches/include', includeFicheController);

/**
 * @swagger
 * /api/auditoria/email/template:
 *   get:
 *     summary: Obtiene la plantilla de correo actual
 *     description: Retorna los campos editables de la plantilla de correo a instructores y sus valores por defecto.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Plantilla actual y valores por defecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 defaults:
 *                   type: object
 */
router.get('/email/template', getEmailTemplateController);

/**
 * @swagger
 * /api/auditoria/email/template:
 *   put:
 *     summary: Actualiza la plantilla de correo
 *     description: Modifica los campos editables de la plantilla de correo a instructores.
 *     tags: [Auditoría]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               obligations:
 *                 type: string
 *               requestText:
 *                 type: string
 *               deadlineDays:
 *                 type: number
 *               contactEmails:
 *                 type: string
 *               footerNote:
 *                 type: string
 *               signatureName:
 *                 type: string
 *               signatureRole:
 *                 type: string
 *               signatureEmail:
 *                 type: string
 *               signaturePhone:
 *                 type: string
 *               signatureAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plantilla actualizada
 */
router.put('/email/template', updateEmailTemplateController);

/**
 * @swagger
 * /api/auditoria/fiches/failed:
 *   get:
 *     summary: Obtiene fichas que fallaron al descargar
 *     description: Retorna lista de fichas que generaron errores durante el proceso de descarga del cron.
 *     tags: [Auditoría]
 *     responses:
 *       200:
 *         description: Lista de fichas fallidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ficheNumber:
 *                         type: string
 *                       error:
 *                         type: string
 *                       lastAttemptAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: number
 */
router.get('/fiches/failed', getFailedFichesController);

/**
 * @swagger
 * /api/auditoria/fiches/failed/{ficheNumber}:
 *   delete:
 *     summary: Elimina una ficha de la lista de fallidas
 *     description: Marca una ficha fallida como omitida, removiéndola de la lista de seguimiento.
 *     tags: [Auditoría]
 *     parameters:
 *       - in: path
 *         name: ficheNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de ficha
 *         example: "2451837"
 *     responses:
 *       200:
 *         description: Ficha eliminada de la lista de fallidas
 */
router.delete('/fiches/failed/:ficheNumber', omitFailedFicheController);

/**
 * @swagger
 * /api/auditoria/resumen-sede:
 *   get:
 *     summary: Resumen de auditoría por ficha (RESUMEN SEDE)
 *     description: Devuelve el resumen del run más reciente con categorías AL DÍA, AÚN NO VENCE, SNC PARCIAL, SNC CRÍTICO y SIN PROGRAMAR por ficha.
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de fichas con categorías de RAPs
 */
router.get('/resumen-sede', getResumenSede);

/**
 * @swagger
 * /api/auditoria/resumen-sede/excel:
 *   get:
 *     summary: Descarga el RESUMEN SEDE como archivo Excel
 *     description: Genera y descarga un XLSX con el resumen de fichas en el mismo formato que el reporte manual.
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo Excel descargado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/resumen-sede/excel', getResumenSedeExcel);
router.get('/resumen-sede/excel/zip', getResumenPorCoordinacionZIP);

/**
 * @swagger
 * /api/auditoria/comparacion:
 *   get:
 *     summary: Compara los 2 últimos runs de auditoría
 *     description: Muestra qué fichas mejoraron, empeoraron o se resolvieron entre los 2 últimos barridos.
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comparación entre barridos
 */
router.get('/comparacion', getComparacion);

export default router;
