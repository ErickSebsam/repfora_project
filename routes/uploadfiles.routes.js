import { Router } from "express";
import { fileCtrl } from "../controller/uploadfiles.controller.js";
import { validateFile } from "../validations/uploadfiles.validation.js";

/**
 * Controller functions for file upload and download
 * @namespace fileCtrl
 * @property {function} readExcel - Reads and processes uploaded Excel file
 * @property {function} downloadExample - Downloads an example Excel file
 * @property {function} readExcelJudgment - Reads and processes uploaded Excel file for judgment
 * @property {function} generateSummaryExcel - Generates summary Excel file of competences and outcomes
 */

const { readExcel, downloadExample, readExcelJudgment,generateSummaryExcel,getTowns,readExcelInstructor } = fileCtrl;

/**
 * Validation functions for file upload
 * @namespace validateFile
 * @property {function} validateExcel - Validates uploaded Excel file
 * @property {function} validateHeader - Validates uploaded Excel file header
 * @property {function} validateExcelJudgment - Validates uploaded Excel file for judgment
 */

const { validateExcel,validateExcelInstructor, validateHeader, validateExcelJudgment } = validateFile;

const routerUploads = Router();

/**
 * @swagger
 * /api/uploads/downloadexcel:
 *   post:
 *     summary: Descarga un archivo Excel de ejemplo
 *     description: Descarga una plantilla Excel para cargar datos masivamente
 *     tags: [Archivos]
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
 *                 example: "programs"
 *     responses:
 *       200:
 *         description: Archivo Excel de ejemplo descargado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
routerUploads.post("/downloadexcel", validateHeader, downloadExample);

/**
 * @swagger
 * /api/uploads/generatesummary:
 *   get:
 *     summary: Genera un Excel resumen de competencias y resultados
 *     description: Genera un archivo Excel con el resumen de todas las competencias y resultados de aprendizaje
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo Excel generado descargado
 */
routerUploads.get("/generatesummary", generateSummaryExcel);

/**
 * @swagger
 * /api/uploads/towns:
 *   get:
 *     summary: Obtiene los municipios disponibles
 *     description: Retorna la lista de municipios para cargar en archivos Excel
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de municipios
 */
routerUploads.get("/towns",validateHeader, getTowns);

/**
 * @swagger
 * /api/uploads/uploadexcel/{program}:
 *   post:
 *     summary: Carga un archivo Excel de programas
 *     description: Procesa un archivo Excel con datos de programas para registro masivo
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: program
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del programa
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
 *                 description: Archivo Excel a cargar
 *     responses:
 *       200:
 *         description: Archivo procesado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Archivo procesado correctamente"
 *                 records:
 *                   type: number
 *                   example: 25
 */
routerUploads.post("/uploadexcel/:program", validateExcel, readExcel);

/**
 * @swagger
 * /api/uploads/uploadexcelinstructor:
 *   post:
 *     summary: Carga un archivo Excel de instructores
 *     description: Procesa un archivo Excel con datos de instructores para registro masivo
 *     tags: [Archivos]
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
 *                 description: Archivo Excel de instructores a cargar
 *     responses:
 *       200:
 *         description: Archivo de instructores procesado correctamente
 */
routerUploads.post("/uploadexcelinstructor", validateExcelInstructor, readExcelInstructor);

/**
 * @swagger
 * /api/uploads/uploadexceljudgment:
 *   post:
 *     summary: Carga un archivo Excel de juicios
 *     description: Procesa un archivo Excel con datos de juicios para verificación
 *     tags: [Archivos]
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
 *                 description: Archivo Excel de juicios a cargar
 *     responses:
 *       200:
 *         description: Archivo de juicios procesado correctamente
 */
routerUploads.post(
  "/uploadexceljudgment",
  validateExcelJudgment,
  readExcelJudgment
);


export { routerUploads };
