import { Router } from "express";
import { complementaryAuditController } from "../controller/complementaryAudit.controller.js";
import { complementaryAuditVali } from "../validations/complementaryAudit.validation.js";

const routerComplementaryAudit = Router();
const { processDF14 } = complementaryAuditController;
const { validateAuditDF14 } = complementaryAuditVali;

/**
 * @swagger
 * /api/complementary/reports/audit-df14:
 *   post:
 *     summary: Procesa el archivo DF14 para auditoría masiva de Rutas y Juicios.
 *     tags: [Complementary]
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
routerComplementaryAudit.post("/reports/audit-df14", validateAuditDF14, processDF14);

export { routerComplementaryAudit };
