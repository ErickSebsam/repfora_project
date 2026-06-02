import { Router } from "express";
import { getAuditLog } from "../controller/dailyAuditLog.js";

const routerAuditLog = Router();

/**
 * @swagger
 * /api/auditlog:
 *   get:
 *     summary: Obtiene el registro de auditoría diaria
 *     description: Obtiene los logs de auditoría del sistema
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de logs de auditoría
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     example: "Verificación de juicio"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-02-07T10:30:00.000Z"
 *                   user:
 *                     type: string
 *                     example: "admin@sena.edu.co"
 */
routerAuditLog.get("/",  getAuditLog);

export { routerAuditLog };
