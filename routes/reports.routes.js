import { Router } from "express";
import { reportsCtrl } from "../controller/reports.controller.js";
import { reportsVali } from "../validations/reports.validation.js";

/**
 * Controller functions containing validation functions for report registration, existence, update, and headers.
 * @typedef {Object} ReportsValidation
 * @property {Function} validateReport - Validates report registration credentials.
 * @property {Function} validateReportInstr - Validates report registration credentials.
 * @property {Function} validateInstr - Validates report registration credentials for instructor.
 * @property {Function} validateFiche - Validates report registration credentials for fiche.
 * @property {Function} validateReportTemp - Validates report registration credentials.

 */

const {
  validateReport,
  validateReportInstr,
  validateInstr,
  validateFiche,
  validateReportTemp,
  validateReporEnvironment,
  validateReportHours
} = reportsVali;

/**
 * Validation functions functions for getting report ID, registering, getting reports, getting report data, getting report fiche, getting report data for editing, getting reports with limit, updating, activating, deactivating, and deleting event.
 * @typedef {Object} ReportsController
 * @property {Function} newReport - Registers report.
 * @property {Function} newReportInstructor - Registers report for instructor.
 * @property {Function} responseInstr - Validates report registration credentials for instructor.
 * @property {Function} responseFiche - Validates report registration credentials for fiche.
 * @property {Function} sendReport - Validates report before sending.
 * @property {Function} testEmail - test send report.
 * @property {Function} testEmailMicrosoft - test send report microsoft.
 */
const {
  newReport,
  newReportInstructor,
  responseInstr,
  responseFiche,
  sendReport,
  testEmail,
  testEmailMicrosoft,
  newReportEnvironment,
  reportHoursInstructors
} = reportsCtrl;

const routerReports = Router();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Genera un nuevo reporte
 *     description: Genera un reporte del sistema de horarios
 *     tags: [Reportes]
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
 *         description: Reporte generado correctamente
 */
routerReports.post("/", validateReport, newReport);

/**
 * @swagger
 * /api/reports/testemail:
 *   get:
 *     summary: Envía un email de prueba
 *     description: Prueba la configuración de correo
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email de prueba enviado
 */
routerReports.get("/testemail", testEmail);

/**
 * @swagger
 * /api/reports/testemailmicrosoft:
 *   get:
 *     summary: Envía un email de prueba con Microsoft
 *     description: Prueba la configuración de correo Microsoft
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email de prueba enviado mediante Microsoft
 */
routerReports.get("/testemailmicrosoft", testEmailMicrosoft);

/**
 * @swagger
 * /api/reports/validateinst:
 *   post:
 *     summary: Valida un instructor para reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructor
 *             properties:
 *               instructor:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Instructor validado
 */
routerReports.post("/validateinst", validateInstr, responseInstr);

/**
 * @swagger
 * /api/reports/validatefiche:
 *   post:
 *     summary: Valida una ficha para reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fiche
 *             properties:
 *               fiche:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ficha validada
 */
routerReports.post("/validatefiche", validateFiche, responseFiche);

/**
 * @swagger
 * /api/reports/sendreport:
 *   post:
 *     summary: Envía un reporte por email
 *     description: Genera y envía un reporte al correo especificado
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
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
 *                 format: email
 *                 example: "usuario@sena.edu.co"
 *               reportType:
 *                 type: string
 *                 example: "horario"
 *     responses:
 *       200:
 *         description: Reporte enviado correctamente
 */
routerReports.post("/sendreport", validateReport, sendReport);

/**
 * @swagger
 * /api/reports/reporttemp:
 *   post:
 *     summary: Genera un reporte temporal
 *     tags: [Reportes]
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
 *         description: Reporte temporal generado
 */
routerReports.post("/reporttemp", validateReportTemp, newReport);

/**
 * @swagger
 * /api/reports/instructor:
 *   post:
 *     summary: Genera un reporte por instructor
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructor
 *             properties:
 *               instructor:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Reporte de instructor generado
 */
routerReports.post("/instructor", validateReportInstr, newReportInstructor);

/**
 * @swagger
 * /api/reports/environment:
 *   post:
 *     summary: Genera un reporte por ambiente
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - environment
 *             properties:
 *               environment:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Reporte de ambiente generado
 */
routerReports.post("/environment", validateReporEnvironment, newReportEnvironment);

/**
 * @swagger
 * /api/reports/hoursinstructors:
 *   post:
 *     summary: Genera un reporte de horas de instructores
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-01T00:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-28T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: Reporte de horas generado
 */
routerReports.post("/hoursinstructors", validateReportHours, reportHoursInstructors);

export { routerReports };
