import { Router } from "express";
import { outcomeCtrl } from "../controller/outcome.controller.js";
import { outcomeVali } from "../validations/outcome.validation.js";

/**
 * Controller functions containing validation functions for outcome registration, existence, update, and headers.
 * @typedef {Object} OutcomeValidation
 * @property {Function} validateRegisterOutcome - Validates outcome registration credentials.
 * @property {Function} validateExistOutcome - Validates outcome existence.
 * @property {Function} validateUpdateOutcome - Validates outcome update credentials.
 * @property {Function} validateHeaders - Validates outcome headers.
 */

const {
  validateRegisterOutcome,
  validateExistOutcome,
  validateUpdateOutcome,
  validateCompOut,
  validateHeaders,
  validateActiveOutcome,
} = outcomeVali;

/**
 * Validation functions functions for getting outcome ID, registering, getting outcomes, getting outcomes by competence, updating, activating, and deactivating.
 * @typedef {Object} OutcomeController
 * @property {Function} getOutcomeId - Gets outcome ID.
 * @property {Function} registerOutcome - Registers outcome.
 * @property {Function} getOutcomes - Gets outcomes.
 * @property {Function} getOutcomesByComp - Gets outcomes by competence.
 * @property {Function} updateOutcome - Updates outcome.
 * @property {Function} activeOutcome - Activates outcome.
 * @property {Function} inactiveOutcome - Deactivates outcome.
 * @property {Function} getOutcomesLimit - Gets outcomes with limit.
 */

const {
  getOutcomeId,
  registerOutcome,
  getOutcomes,
  getOutcomesByComp,
  updateOutcome,
  activeOutcome,
  inactiveOutcome,
  getOutcomesLimit,
} = outcomeCtrl;

const routerOutcome = Router();

/**
 * @swagger
 * /api/outcomes/getthundredoutcomes:
 *   get:
 *     summary: Obtiene los últimos 100 resultados de aprendizaje
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de los últimos 100 resultados registrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Outcome'
 */
routerOutcome.get("/getthundredoutcomes", validateHeaders, getOutcomesLimit);

/**
 * @swagger
 * /api/outcomes/competence/{id}:
 *   get:
 *     summary: Obtiene todos los resultados de aprendizaje de una competencia
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la competencia
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de resultados de aprendizaje de la competencia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Outcome'
 */
routerOutcome.get("/competence/:id", validateCompOut, getOutcomesByComp);

/**
 * @swagger
 * /api/outcomes/{id}:
 *   get:
 *     summary: Obtiene un resultado de aprendizaje por ID
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del resultado (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resultado de aprendizaje encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Outcome'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerOutcome.get("/:id", validateExistOutcome, getOutcomeId);

/**
 * @swagger
 * /api/outcomes:
 *   get:
 *     summary: Obtiene todos los resultados de aprendizaje
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de resultados de aprendizaje
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Outcome'
 */
routerOutcome.get("/", validateHeaders, getOutcomes);

/**
 * @swagger
 * /api/outcomes/register:
 *   post:
 *     summary: Registra un nuevo resultado de aprendizaje
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Outcome'
 *               - type: object
 *                 required:
 *                   - name
 *                   - code
 *                   - competence
 *           example:
 *             name: "Elaborar sitios web aplicando mejores prácticas"
 *             code: "R1"
 *             competence: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resultado de aprendizaje registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Resultado de aprendizaje registrado correctamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerOutcome.post("/register", validateRegisterOutcome, registerOutcome);

/**
 * @swagger
 * /api/outcomes/active/{id}:
 *   put:
 *     summary: Activa un resultado de aprendizaje
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del resultado
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resultado activado correctamente
 */
routerOutcome.put("/active/:id", validateActiveOutcome, activeOutcome);

/**
 * @swagger
 * /api/outcomes/inactive/{id}:
 *   put:
 *     summary: Inactiva un resultado de aprendizaje
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del resultado
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resultado desactivado correctamente
 */
routerOutcome.put("/inactive/:id", validateExistOutcome, inactiveOutcome);

/**
 * @swagger
 * /api/outcomes/update:
 *   put:
 *     summary: Actualiza un resultado de aprendizaje
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Outcome'
 *               - type: object
 *                 required:
 *                   - id
 *             example:
 *               id: "507f1f77bcf86cd799439011"
 *               name: "Elaborar sitios web aplicando mejores prácticas actualizado"
 *               code: "R1"
 *               competence: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resultado actualizado correctamente
 */
routerOutcome.put("/update", validateUpdateOutcome, updateOutcome);

export { routerOutcome };
