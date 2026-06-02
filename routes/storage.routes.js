import { Router } from "express";
import { storageCtrl } from "../controller/storage.controller.js";
import { storageVali } from "../validations/storage.validation.js";

const { validateToken } = storageVali;

const routerStorage = Router();

/**
 * @swagger
 * tags:
 *   name: Storage
 *   description: Monitoreo de almacenamiento de Google Drive (Solo Super Admin)
 */

/**
 * @swagger
 * /api-storage:
 *   get:
 *     summary: Obtiene información de almacenamiento de todas las sedes
 *     description: Requiere permisos de Super Admin (super=1). Obtiene información completa de almacenamiento de todas las sedes incluyendo cuotas, porcentajes de uso y archivos más grandes. Este endpoint consulta todas las sedes automáticamente usando configuración interna.
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de almacenamiento de todas las sedes
 *       401:
 *         description: No autorizado - Token inválido o expirado
 *       403:
 *         description: Prohibido - Se requieren permisos de Super Admin
 */
routerStorage.get("/", validateToken, storageCtrl.getAllStorage);

/**
 * @swagger
 * /api-storage/summary:
 *   get:
 *     summary: Obtiene un resumen ejecutivo del almacenamiento
 *     description: Requiere permisos de Super Admin (super=1). Obtiene resumen ejecutivo con estado de todas las sedes y recomendaciones automáticas cuando el almacenamiento supera el 75%.
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen ejecutivo con recomendaciones
 *       401:
 *         description: No autorizado - Token inválido o expirado
 *       403:
 *         description: Prohibido - Se requieren permisos de Super Admin
 */
routerStorage.get("/summary", validateToken, storageCtrl.getSummary);

/**
 * @swagger
 * /api-storage/check:
 *   post:
 *     summary: Verifica una credencial específica y devuelve advertencias
 *     description: Requiere permisos de Super Admin (super=1). Verifica cualquier credencial de Google Drive sin cambiar el .env y devuelve advertencias si el almacenamiento se está llenando. Ideal para verificar múltiples credenciales rápidamente.
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credentialFile
 *             properties:
 *               credentialFile:
 *                 type: string
 *                 description: Nombre del archivo JSON de credenciales
 *                 example: repfora-411414-2b1a696cee9c.json
 *                 pattern: ^.*\.json$
 *     responses:
 *       200:
 *         description: Información de almacenamiento con advertencias
 *       400:
 *         description: Error en el formato del archivo o parámetro faltante
 *       401:
 *         description: No autorizado - Token inválido o expirado
 *       403:
 *         description: Prohibido - Se requieren permisos de Super Admin
 *       500:
 *         description: Error al verificar la credencial
 */
routerStorage.post("/check", validateToken, storageCtrl.checkCredentialStorage);

/**
 * @swagger
 * /api-storage/{sede}:
 *   get:
 *     summary: Obtiene información de almacenamiento usando GOOGLE_DRIVE_API_KEY del .env
 *     description: Requiere permisos de Super Admin (super=1). Obtiene información detallada usando la variable de entorno GOOGLE_DRIVE_API_KEY. IMPORTANTE - El parámetro sede es IGNORADO y solo se usa para fines informativos. Siempre usa GOOGLE_DRIVE_API_KEY del .env. Para cambiar de sede, edita el .env y reinicia el servidor.
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sede
 *         required: true
 *         schema:
 *           type: string
 *           enum: [florida, sangel, bucaramanga, cucuta]
 *         description: Código de la sede (IGNORADO - uso informativo. Siempre usa GOOGLE_DRIVE_API_KEY del .env)
 *         example: florida
 *     responses:
 *       200:
 *         description: Información de almacenamiento usando GOOGLE_DRIVE_API_KEY
 *       400:
 *         description: Error de configuración - GOOGLE_DRIVE_API_KEY no está definido
 *       401:
 *         description: No autorizado - Token inválido o expirado
 *       403:
 *         description: Prohibido - Se requieren permisos de Super Admin
 */
routerStorage.get("/:sede", validateToken, storageCtrl.getSedeStorage);

/**
 * @swagger
 * /api-storage/{sede}/files:
 *   get:
 *     summary: Obtiene los archivos más grandes usando GOOGLE_DRIVE_API_KEY del .env
 *     description: Requiere permisos de Super Admin (super=1). Obtiene la lista de archivos más grandes usando la variable de entorno GOOGLE_DRIVE_API_KEY. IMPORTANTE - El parámetro sede es IGNORADO. Siempre usa GOOGLE_DRIVE_API_KEY del .env. Para cambiar de sede, edita el .env y reinicia el servidor.
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sede
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la sede (IGNORADO - uso informativo)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de archivos a retornar
 *     responses:
 *       200:
 *         description: Lista de archivos más grandes
 *       400:
 *         description: Error de configuración - GOOGLE_DRIVE_API_KEY no está definido
 *       401:
 *         description: No autorizado - Token inválido o expirado
 *       403:
 *         description: Prohibido - Se requieren permisos de Super Admin
 */
routerStorage.get("/:sede/files", validateToken, storageCtrl.getLargestFiles);

export { routerStorage };
