import { Router } from "express";
import { environmentCtrl } from "../controller/environment.controller.js";
import { environmentVali } from "../validations/environment.validation.js";

/**
 * Controller functions containing validation functions for environment registration, existence, update, and headers.
 * @typedef {Object} EnvironmentValidation
 * @property {Function} validateRegisterEnvironment - Validates environment registration credentials.
 * @property {Function} validateExistEnvironment - Validates environment existence.
 * @property {Function} validateUpdateEnvironment - Validates environment update credentials.
 * @property {Function} validateHeaders - Validates environment headers.
 */

const {
  validateRegisterEnvironment,
  validateExistEnvironment,
  validateUpdateEnvironment,
  validateHeaders,
} = environmentVali;

/**
 * Validation functions functions for getting environment ID, registering, getting environments, updating, activating, and deactivating.
 * @typedef {Object} EnvironmentController
 * @property {Function} getEnvironmentId - Gets environment ID.
 * @property {Function} registerEnvironment - Registers environment.
 * @property {Function} getEnvironments - Gets environments.
 * @property {Function} updateEnvironment - Updates environment.
 * @property {Function} activeEnvironment - Activates environment.
 * @property {Function} inactiveEnvironment - Deactivates environment.
 */

const {
  getEnvironmentId,
  registerEnvironment,
  getEnvironments,
  updateEnvironment,
  activeEnvironment,
  inactiveEnvironment,
} = environmentCtrl;

const routerEnvironment = Router();

/**
 * @swagger
 * /api/environments/{id}:
 *   get:
 *     summary: Obtiene un ambiente por ID
 *     tags: [Ambientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ambiente (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ambiente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Environment'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerEnvironment.get("/:id", validateExistEnvironment, getEnvironmentId);

/**
 * @swagger
 * /api/environments:
 *   get:
 *     summary: Obtiene todos los ambientes
 *     tags: [Ambientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ambientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Environment'
 */
routerEnvironment.get("/", validateHeaders, getEnvironments);

/**
 * @swagger
 * /api/environments/register:
 *   post:
 *     summary: Registra un nuevo ambiente
 *     tags: [Ambientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Environment'
 *               - type: object
 *                 required:
 *                   - name
 *                   - code
 *           example:
 *             name: "LABORATORIO DE INFORMÁTICA 1"
 *             code: "AMB-LI-001"
 *     responses:
 *       200:
 *         description: Ambiente registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Ambiente registrado correctamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerEnvironment.post(
  "/register",
  validateRegisterEnvironment,
  registerEnvironment
);

/**
 * @swagger
 * /api/environments/active/{id}:
 *   put:
 *     summary: Activa un ambiente
 *     tags: [Ambientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ambiente
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ambiente activado correctamente
 */
routerEnvironment.put(
  "/active/:id",
  validateExistEnvironment,
  activeEnvironment
);

/**
 * @swagger
 * /api/environments/inactive/{id}:
 *   put:
 *     summary: Inactiva un ambiente
 *     tags: [Ambientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ambiente
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ambiente desactivado correctamente
 */
routerEnvironment.put(
  "/inactive/:id",
  validateExistEnvironment,
  inactiveEnvironment
);

/**
 * @swagger
 * /api/environments/update/{id}:
 *   put:
 *     summary: Actualiza un ambiente
 *     tags: [Ambientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ambiente
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Environment'
 *           example:
 *             name: "LABORATORIO DE INFORMÁTICA 1 ACTUALIZADO"
 *             code: "AMB-LI-001"
 *     responses:
 *       200:
 *         description: Ambiente actualizado correctamente
 */
routerEnvironment.put(
  "/update/:id",
  validateUpdateEnvironment,
  updateEnvironment
);

export { routerEnvironment };
