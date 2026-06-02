import { Router } from "express";
import { townsCtrl } from "../controller/towns.controller.js";
import { townsVali } from "../validations/towns.validation.js";


const routerTowns = Router();

const { getTowns,
    registerTown,
    getDepartaments,
    getTownsByDepartament
 } = townsCtrl;

const { validateHeaders } = townsVali;

/**
 * @swagger
 * /api/towns:
 *   get:
 *     summary: Obtiene todos los municipios
 *     tags: [Municipios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de municipios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Bogotá"
 *                   departament:
 *                     type: string
 *                     example: "Cundinamarca"
 */
routerTowns.get("/", validateHeaders, getTowns);

/**
 * @swagger
 * /api/towns/towns/{departament}:
 *   get:
 *     summary: Obtiene los municipios de un departamento
 *     tags: [Municipios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departament
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del departamento
 *         example: "Cundinamarca"
 *     responses:
 *       200:
 *         description: Lista de municipios del departamento
 */
routerTowns.get("/towns/:departament", validateHeaders, getTownsByDepartament);

/**
 * @swagger
 * /api/towns/departaments:
 *   get:
 *     summary: Obtiene todos los departamentos
 *     tags: [Municipios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de departamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "Cundinamarca"
 */
routerTowns.get("/departaments", validateHeaders, getDepartaments);

/**
 * @swagger
 * /api/towns/register:
 *   post:
 *     summary: Registra un nuevo municipio
 *     tags: [Municipios]
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
 *               - departament
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bogotá"
 *               departament:
 *                 type: string
 *                 example: "Cundinamarca"
 *     responses:
 *       200:
 *         description: Municipio registrado correctamente
 */
routerTowns.post("/register", validateHeaders, registerTown);

export { routerTowns };
