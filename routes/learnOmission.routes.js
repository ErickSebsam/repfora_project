import { Router } from "express";
import { omitLearner } from "../controller/LearnerOmission.js";

const routerOmit = Router();

/**
 * @swagger
 * /api/learneromission/omit:
 *   put:
 *     summary: Registra la omisión de un aprendiz
 *     description: Registra cuando un aprendiz no asiste a una clase
 *     tags: [Omisiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learner
 *               - schedule
 *               - date
 *             properties:
 *               learner:
 *                 type: string
 *                 description: ID del aprendiz
 *                 example: "507f1f77bcf86cd799439011"
 *               schedule:
 *                 type: string
 *                 description: ID del horario
 *                 example: "507f1f77bcf86cd799439012"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-07"
 *               observation:
 *                 type: string
 *                 example: "El aprendiz no se presentó a clase"
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
routerOmit.put("/omit",  omitLearner);

export { routerOmit };
