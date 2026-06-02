import { Router } from "express";
import { reportNewCtrl } from "../controller/reportnews.controller.js";
import { reportNewVali } from "../validations/reportnew.validation.js";

const {
  validateBasic,
  validateActa,
  validateTypeNew,
  validateImprovement,
  validateStatus,
  validateFiche,
  validateStudent
} = reportNewVali;

const {
  getReportBasic,
  getReportActa,
  getReportTypeNew,
  getReportImprovement,
  getReportStatus,
  getReportFiche,
  getReportStudent
} = reportNewCtrl;

const routerReportNew = Router();

/**
 * @swagger
 * /api/reportnew/statistics:
 *   post:
 *     summary: Genera un reporte estadístico de novedades
 *     description: Genera estadísticas generales sobre las novedades del sistema
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *         description: Reporte estadístico generado
 */
routerReportNew.post("/statistics", validateBasic, getReportBasic);

/**
 * @swagger
 * /api/reportnew/acta:
 *   post:
 *     summary: Genera un acta de novedades
 *     description: Genera un acta con las novedades reportadas
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Acta generada correctamente
 */
routerReportNew.post("/acta", validateActa, getReportActa);

/**
 * @swagger
 * /api/reportnew/typenew:
 *   post:
 *     summary: Genera un reporte por tipo de novedad
 *     description: Genera un reporte agrupando por el tipo de novedad
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ["INCAPACIDAD", "PERMISO", "VACACIONES", "OTRO"]
 *                 example: "INCAPACIDAD"
 *     responses:
 *       200:
 *         description: Reporte por tipo generado
 */
routerReportNew.post("/typenew", validateTypeNew, getReportTypeNew);

/**
 * @swagger
 * /api/reportnew/typenew/improvement:
 *   post:
 *     summary: Genera un reporte de mejoras por tipo de novedad
 *     description: Genera un reporte de acciones de mejora agrupadas por tipo de novedad
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ["INCAPACIDAD", "PERMISO", "VACACIONES", "OTRO"]
 *                 example: "INCAPACIDAD"
 *     responses:
 *       200:
 *         description: Reporte de mejoras generado
 */
routerReportNew.post("/typenew/improvement", validateImprovement, getReportImprovement);

/**
 * @swagger
 * /api/reportnew/status:
 *   post:
 *     summary: Genera un reporte por estado de novedad
 *     description: Genera un reporte agrupando por el estado de las novedades
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["PENDIENTE", "EN PROCESO", "RESUELTA"]
 *                 example: "PENDIENTE"
 *     responses:
 *       200:
 *         description: Reporte por estado generado
 */
routerReportNew.post("/status", validateStatus, getReportStatus);

/**
 * @swagger
 * /api/reportnew/fiche:
 *   post:
 *     summary: Genera un reporte de novedades por ficha
 *     description: Genera un reporte con todas las novedades asociadas a una ficha
 *     tags: [Novedades]
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
 *         description: Reporte por ficha generado
 */
routerReportNew.post("/fiche", validateFiche, getReportFiche);

/**
 * @swagger
 * /api/reportnew/student:
 *   post:
 *     summary: Genera un reporte de novedades por aprendiz
 *     description: Genera un reporte con todas las novedades asociadas a un aprendiz
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student
 *             properties:
 *               student:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Reporte por aprendiz generado
 */
routerReportNew.post("/student", validateStudent, getReportStudent);

export { routerReportNew };
