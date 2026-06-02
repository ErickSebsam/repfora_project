import { Router } from "express";
import { coordinationCtrl } from "../controller/coordination.controller.js";
import { coordinationVali } from "../validations/coordination.validation.js";

/**
 * Controller functions containing validation functions for coordination registration, existence, update, and headers.
 * @typedef {Object} CoordinationValidation
 * @property {Function} validateRegisterCoordination - Validates coordination registration credentials.
 * @property {Function} validateExistCoordination - Validates coordination existence.
 * @property {Function} validateUpdateCoordination - Validates coordination update credentials.
 * @property {Function} validateHeadersSuper - Validates coordination headers.
 */
const {
  validateRegisterCoordination,
  validateExistCoordination,
  validateUpdateCoordination,
  validateHeadersSuper,
  validateActiveCoordination,
} = coordinationVali;

/**
 * Validation functions functions for getting coordination ID, registering, getting coordinations, updating, activating, and deactivating.
 * @typedef {Object} CoordinationController
 * @property {Function} getCoordinationId - Gets coordination ID.
 * @property {Function} registerCoordination - Registers coordination.
 * @property {Function} getCoordinations - Gets coordinations.
 * @property {Function} updateCoordination - Updates coordination.
 * @property {Function} activeCoordination - Activates coordination.
 * @property {Function} inactiveCoordination - Deactivates coordination.
 */

const {
  getCoordinationId,
  registerCoordination,
  getCoordinations,
  updateCoordination,
  activeCoordination,
  inactiveCoordination,
} = coordinationCtrl;

const routerCoordination = Router();

/**
 * @swagger
 * /api/coordinations/{id}:
 *   get:
 *     summary: Obtiene una coordinación por ID
 *     tags: [Coordinaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la coordinación (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Coordinación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "COORDINACIÓN DE FORMACIÓN PROFESIONAL"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerCoordination.get("/:id", validateExistCoordination, getCoordinationId);

/**
 * @swagger
 * /api/coordinations:
 *   get:
 *     summary: Obtiene todas las coordinaciones
 *     tags: [Coordinaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de coordinaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "COORDINACIÓN DE FORMACIÓN PROFESIONAL"
 */
routerCoordination.get("/", validateHeadersSuper, getCoordinations);

/**
 * @swagger
 * /api/coordinations/register:
 *   post:
 *     summary: Registra una nueva coordinación
 *     tags: [Coordinaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinator
 *               - modality
 *               - email
 *               - passapp
 *               - namefoldernew
 *               - programmers
 *             properties:
 *               name:
 *                 type: string
 *                 example: "COORDINACIÓN DE FORMACIÓN PROFESIONAL"
 *               coordinator:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               modality:
 *                 type: string
 *                 enum: ["PROGRAMAS ESPECIALES", "VIRTUAL", "TITULADA"]
 *                 example: "TITULADA"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "coordinacion@example.com"
 *               passapp:
 *                 type: string
 *                 example: "password123"
 *               namefoldernew:
 *                 type: string
 *                 example: "folder_name"
 *               programmers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *               emailsupervisor:
 *                 type: string
 *                 format: email
 *                 example: "supervisor1@example.com, supervisor2@example.com"
 *     responses:
 *       200:
 *         description: Coordinación registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Coordinación registrada correctamente"
 */
routerCoordination.post(
  "/register",
  validateRegisterCoordination,
  registerCoordination
);

/**
 * @swagger
 * /api/coordinations/active/{id}:
 *   put:
 *     summary: Activa una coordinación
 *     tags: [Coordinaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la coordinación
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Coordinación activada correctamente
 */
routerCoordination.put(
  "/active/:id",
  validateActiveCoordination,
  activeCoordination
);

/**
 * @swagger
 * /api/coordinations/inactive/{id}:
 *   put:
 *     summary: Inactiva una coordinación
 *     tags: [Coordinaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la coordinación
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Coordinación desactivada correctamente
 */
routerCoordination.put(
  "/inactive/:id",
  validateExistCoordination,
  inactiveCoordination
);

/**
 * @swagger
 * /api/coordinations/update/{id}:
 *   put:
 *     summary: Actualiza una coordinación
 *     tags: [Coordinaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la coordinación
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinator
 *               - modality
 *               - email
 *               - passapp
 *               - namefoldernew
 *               - programmers
 *             properties:
 *               name:
 *                 type: string
 *                 example: "COORDINACIÓN DE FORMACIÓN PROFESIONAL ACTUALIZADA"
 *               coordinator:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               modality:
 *                 type: string
 *                 enum: ["PROGRAMAS ESPECIALES", "VIRTUAL", "TITULADA"]
 *                 example: "TITULADA"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "coordinacion@example.com"
 *               passapp:
 *                 type: string
 *                 example: "password123"
 *               namefoldernew:
 *                 type: string
 *                 example: "folder_name"
 *               programmers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *               emailsupervisor:
 *                 type: string
 *                 format: email
 *                 example: "supervisor@example.com"
 *     responses:
 *       200:
 *         description: Coordinación actualizada correctamente
 */
routerCoordination.put(
  "/update/:id",
  validateUpdateCoordination,
  updateCoordination
);

export { routerCoordination };
