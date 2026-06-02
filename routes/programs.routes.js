import { Router } from "express";
import { programCtrl } from "../controller/program.controller.js";
import { programVali } from "../validations/program.validation.js";

/**
 * Controller functions containing validation functions for program registration, existence, update, and headers.
 * @typedef {Object} ProgramValidation
 * @property {Function} validateRegisterProgram - Validates program registration credentials.
 * @property {Function} validateExistProgram - Validates program existence.
 * @property {Function} validateUpdateProgram - Validates program update credentials.
 * @property {Function} validateHeaders - Validates program headers.
 */

const {
  validateRegisterProgram,
  validateExistProgram,
  validateUpdateProgram,
  validateHeaders,
  validateActiveProgram,
} = programVali;

/**
 * Validation functions functions for getting program ID, registering, getting programs, updating, activating, and deactivating.
 * @typedef {Object} ProgramController
 * @property {Function} getProgramId - Gets program ID.
 * @property {Function} registerProgram - Registers program.
 * @property {Function} getPrograms - Gets programs.
 * @property {Function} updateProgram - Updates program.
 * @property {Function} activeProgram - Activates program.
 * @property {Function} inactiveProgram - Deactivates program.
 */

const {
  getProgramId,
  registerProgram,
  getPrograms,
  updateProgram,
  activeProgram,
  inactiveProgram,
} = programCtrl;

const routerProgram = Router();

/**
 * @swagger
 * /api/programs/{id}:
 *   get:
 *     summary: Obtiene un programa por ID
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del programa (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Programa encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Program'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerProgram.get("/:id", validateExistProgram, getProgramId);

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Obtiene todos los programas
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de programas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Program'
 */
routerProgram.get("/", validateHeaders, getPrograms);

/**
 * @swagger
 * /api/programs/register:
 *   post:
 *     summary: Registra un nuevo programa
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Program'
 *               - type: object
 *                 required:
 *                   - name
 *                   - code
 *           example:
 *             name: "ANÁLISIS Y DESARROLLO DE SOFTWARE"
 *             code: "228100"
 *     responses:
 *       200:
 *         description: Programa registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Programa registrado correctamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerProgram.post("/register", validateRegisterProgram, registerProgram);

/**
 * @swagger
 * /api/programs/active/{id}:
 *   put:
 *     summary: Activa un programa
 *     tags: [Programas]
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
 *         description: Programa activado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Programa activado correctamente"
 */
routerProgram.put("/active/:id", validateActiveProgram, activeProgram);

/**
 * @swagger
 * /api/programs/inactive/{id}:
 *   put:
 *     summary: Inactiva un programa
 *     tags: [Programas]
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
 *         description: Programa desactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Programa desactivado correctamente"
 */
routerProgram.put("/inactive/:id", validateExistProgram, inactiveProgram);

/**
 * @swagger
 * /api/programs/update/{id}:
 *   put:
 *     summary: Actualiza un programa
 *     tags: [Programas]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Program'
 *           example:
 *             name: "ANÁLISIS Y DESARROLLO DE SOFTWARE ACTUALIZADO"
 *             code: "228100"
 *     responses:
 *       200:
 *         description: Programa actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Programa actualizado correctamente"
 */
routerProgram.put("/update/:id", validateUpdateProgram, updateProgram);

export { routerProgram };
