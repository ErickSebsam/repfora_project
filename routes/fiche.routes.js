import { Router } from "express";
import { ficheCtrl } from "../controller/fiche.controller.js";
import { ficheVali } from "../validations/fiche.validation.js";

const {
  validateRegisterFiche,
  validateExistFiche,
  validateUpdateFiche,
  validateHeaders,
  validateActiveFiche
} = ficheVali;

const {
  getFicheId,
  registerFiche,
  getFichesPublic,
  getFiches,
  getFichesCoordination,
  updateFiche,
  activeFiche,
  inactiveFiche,
} = ficheCtrl;

const routerFiche = Router();

/**
 * @swagger
 * /api/fiches/public:
 *   get:
 *     summary: Obtiene todas las fichas públicas
 *     description: Retorna lista de fichas sin requerir autenticación. Incluye información básica del programa e instructor.
 *     tags: [Fichas]
 *     responses:
 *       200:
 *         description: Lista de fichas públicas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fiche'
 */
routerFiche.get("/public", getFichesPublic);

/**
 * @swagger
 * /api/fiches/coordination:
 *   get:
 *     summary: Obtiene fichas filtradas por coordinación
 *     description: Retorna las fichas asociadas a la coordinación del usuario autenticado.
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fichas de la coordinación
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fiche'
 */
routerFiche.get("/coordination", validateHeaders, getFichesCoordination);

/**
 * @swagger
 * /api/fiches/{id}:
 *   get:
 *     summary: Obtiene una ficha por ID
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ficha
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ficha encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fiche'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerFiche.get("/:id", validateExistFiche, getFicheId);

/**
 * @swagger
 * /api/fiches:
 *   get:
 *     summary: Obtiene todas las fichas
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las fichas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fiche'
 */
routerFiche.get("/", validateHeaders, getFiches);

/**
 * @swagger
 * /api/fiches/register:
 *   post:
 *     summary: Registra una nueva ficha
 *     description: Crea una nueva ficha de formación en el sistema.
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Fiche'
 *               - type: object
 *                 required:
 *                   - number
 *                   - program
 *                   - owner
 *                   - coordination
 *                   - fstart
 *                   - fend
 *           example:
 *             number: "2281001"
 *             program: "507f1f77bcf86cd799439012"
 *             owner: "507f1f77bcf86cd799439015"
 *             coordination: "507f1f77bcf86cd799439017"
 *             fstart: "2024-01-15T00:00:00.000Z"
 *             fend: "2024-12-15T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Ficha registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Ficha registrada correctamente"
 *                 fiche:
 *                   $ref: '#/components/schemas/Fiche'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerFiche.post("/register", validateRegisterFiche, registerFiche);

/**
 * @swagger
 * /api/fiches/active/{id}:
 *   put:
 *     summary: Activa una ficha
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ficha
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ficha activada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Ficha activada correctamente"
 */
routerFiche.put("/active/:id", validateActiveFiche, activeFiche);

/**
 * @swagger
 * /api/fiches/inactive/{id}:
 *   put:
 *     summary: Inactiva una ficha
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ficha
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ficha desactivada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Ficha desactivada correctamente"
 */
routerFiche.put("/inactive/:id", validateExistFiche, inactiveFiche);

/**
 * @swagger
 * /api/fiches/update/{id}:
 *   put:
 *     summary: Actualiza una ficha existente
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ficha a actualizar
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fiche'
 *           example:
 *             number: "2281001"
 *             program: "507f1f77bcf86cd799439012"
 *             owner: "507f1f77bcf86cd799439015"
 *             coordination: "507f1f77bcf86cd799439017"
 *             fstart: "2024-01-15T00:00:00.000Z"
 *             fend: "2024-12-15T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Ficha actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Ficha actualizada correctamente"
 *                 fiche:
 *                   $ref: '#/components/schemas/Fiche'
 */
routerFiche.put("/update/:id", validateUpdateFiche, updateFiche);

export { routerFiche };
