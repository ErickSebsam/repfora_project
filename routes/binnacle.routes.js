import { Router } from "express";
import { binnacleCtrl } from "../controller/binnacle.controller.js";
import { binnacleVali } from "../validations/binnacle.validation.js";


const { listBinnacle,filterBinnacle } = binnacleCtrl;
const { validateFilter,validateToken } = binnacleVali;

const routerBinnacle = Router();

/**
 * @swagger
 * /api/binnacle:
 *   get:
 *     summary: Obtiene el listado de la bitácora
 *     description: Obtiene el registro de acciones del sistema
 *     tags: [Bitácora]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros de bitácora
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   action:
 *                     type: string
 *                     example: "Creación de horario"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-02-07T10:30:00.000Z"
 */
routerBinnacle.get("/", validateToken, listBinnacle);

/**
 * @swagger
 * /api/binnacle/filterbinnacle:
 *   post:
 *     summary: Filtra la bitácora por criterios específicos
 *     description: Permite filtrar los registros de bitácora por usuario, fecha, acción, etc.
 *     tags: [Bitácora]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-01T00:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-07T23:59:59.000Z"
 *               action:
 *                 type: string
 *                 example: "Creación"
 *     responses:
 *       200:
 *         description: Lista filtrada de registros de bitácora
 */
routerBinnacle.post("/filterbinnacle", validateFilter, filterBinnacle);

export { routerBinnacle };
