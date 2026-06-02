import { Router } from "express";
import { competenceCtrl } from "../controller/competence.controller.js";
import { competenceVali } from "../validations/competence.validation.js";

/**
 * Controller functions containing validation functions for competence registration, existence, update, and headers.
 * @typedef {Object} CompetenceValidation
 * @property {Function} validateRegisterCompetence - Validates competence registration credentials.
 * @property {Function} validateExistCompetence - Validates competence existence.
 * @property {Function} validateUpdateCompetence - Validates competence update credentials.
 * @property {Function} validateHeaders - Validates competence headers.
 */

const {
  validateRegisterCompetence,
  validateExistProgram,
  validateExistCompetence,
  validateUpdateCompetence,
  validateHeaders,
  validateActiveCompetence
} = competenceVali;

/**
 * Validation functions functions for getting competence ID, registering, getting competences, updating, activating, and deactivating.
 * @typedef {Object} CompetenceController
 * @property {Function} getCompetenceId - Gets competence ID.
 * @property {Function} registerCompetence - Registers competence.
 * @property {Function} getCompetences - Gets competences.
 * @property {Function} updateCompetence - Updates competence.
 * @property {Function} activeCompetence - Activates competence.
 * @property {Function} inactiveCompetence - Deactivates competence.
 */

const {
  getCompetenceId,
  getProgramCompetence,
  registerCompetence,
  getCompetences,
  updateCompetence,
  activeCompetence,
  inactiveCompetence,

  deleteFichas
} = competenceCtrl;

const routerCompetence = Router();

/**
 * @swagger
 * /api/competences/program/{id}:
 *   get:
 *     summary: Obtiene todas las competencias de un programa
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del programa
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de competencias del programa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Competence'
 */
routerCompetence.get(
  "/program/:id",
  validateExistProgram,
  getProgramCompetence
);

/**
 * @swagger
 * /api/competences/{id}:
 *   get:
 *     summary: Obtiene una competencia por ID
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la competencia (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Competencia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Competence'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerCompetence.get("/:id", validateExistCompetence, getCompetenceId);

/**
 * @swagger
 * /api/competences:
 *   get:
 *     summary: Obtiene todas las competencias
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de competencias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Competence'
 */
routerCompetence.get("/", validateHeaders, getCompetences);

/**
 * @swagger
 * /api/competences/register:
 *   post:
 *     summary: Registra una nueva competencia
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Competence'
 *               - type: object
 *                 required:
 *                   - name
 *                   - code
 *                   - program
 *           example:
 *             name: "CONSTRUIR SITIOS WEB"
 *             code: "C1"
 *             program: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Competencia registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Competencia registrada correctamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerCompetence.post(
  "/register",
  validateRegisterCompetence,
  registerCompetence
);

/**
 * @swagger
 * /api/competences/active/{id}:
 *   put:
 *     summary: Activa una competencia
 *     tags: [Competencias]
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
 *         description: Competencia activada correctamente
 */
routerCompetence.put("/active/:id", validateActiveCompetence, activeCompetence);

/**
 * @swagger
 * /api/competences/inactive/{id}:
 *   put:
 *     summary: Inactiva una competencia
 *     tags: [Competencias]
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
 *         description: Competencia desactivada correctamente
 */
routerCompetence.put(
  "/inactive/:id",
  validateExistCompetence,
  inactiveCompetence
);

/**
 * @swagger
 * /api/competences/update/{id}:
 *   put:
 *     summary: Actualiza una competencia
 *     tags: [Competencias]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Competence'
 *           example:
 *             name: "CONSTRUIR SITIOS WEB ACTUALIZADO"
 *             code: "C1"
 *             program: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Competencia actualizada correctamente
 */
routerCompetence.put("/update/:id", validateUpdateCompetence, updateCompetence);

export { routerCompetence };
