import { Router } from "express";
import { newCtrl } from "../controller/new.controller.js";
import { newVali } from "../validations/new.validation.js";

const {
  validateRegisterNew,
  validateFormPublic,
  validateUpdateNew,
  validateExistInst,
  validateFiche,
  validateUpdateByInst,
  validateImprovement,
  validateUpdateImprovement,
  validateUpdateAdvancedNew,
  validateUpdateMultiples,
  validateUpgradePostpone,
  validateExistNew,
  validateExistImprovement,
  validateHeaders,
} = newVali;

const {
  registerNew,
  registerNewPublic,
  registerImprovement,
  updateNew,
  getNewsNotProcessed,
  getNewsNotProcessedActaNull,
  getImprovement,
  getNewsByInstructor,
  updateAdvancedNew,
  updateMultiplesNew,
  upgradePostponeNews,
  updateImprovement,
  getNewId,
  getNews,
  getItemsByFiche,
  inactiveNew,
  activeNew,
  aproveNew,
  notAproveNew,
  sendEmailNew
} = newCtrl;

const routerNew = Router();

/**
 * @swagger
 * /api/news/onlyprocessedactanull:
 *   get:
 *     summary: Obtiene novedades procesadas sin acta
 *     description: Retorna lista de novedades procesadas que no tienen acta asociada.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de novedades procesadas sin acta
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/New'
 */
routerNew.get("/onlyprocessedactanull", validateHeaders, getNewsNotProcessedActaNull);

/**
 * @swagger
 * /api/news/onlyprocessed:
 *   get:
 *     summary: Obtiene novedades procesadas
 *     description: Retorna lista de todas las novedades que han sido procesadas.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de novedades procesadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/New'
 */
routerNew.get("/onlyprocessed", validateHeaders, getNewsNotProcessed);

/**
 * @swagger
 * /api/news/onlyimprovement:
 *   get:
 *     summary: Obtiene mejoras registradas
 *     description: Retorna lista de todas las mejoras registradas en el sistema.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mejoras
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/New'
 */
routerNew.get("/onlyimprovement", validateHeaders, getImprovement);

/**
 * @swagger
 * /api/news/newbyinstructor/{id}:
 *   get:
 *     summary: Obtiene novedades por instructor
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instructor
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de novedades del instructor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/New'
 */
routerNew.get("/newbyinstructor/:id", validateExistInst, getNewsByInstructor);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Obtiene una novedad por ID
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la novedad
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Novedad encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/New'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerNew.get("/:id", validateExistNew, getNewId);

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Obtiene todas las novedades
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las novedades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/New'
 */
routerNew.get("/", validateHeaders, getNews);

/**
 * @swagger
 * /api/news/fiche/{fiche}/items:
 *   get:
 *     summary: Obtiene items de novedades por ficha
 *     description: Retorna los items de novedades asociados a una ficha específica.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiche
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ficha
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lista de items de novedades de la ficha
 */
routerNew.get("/fiche/:fiche/items", validateFiche, getItemsByFiche);

/**
 * @swagger
 * /api/news/register:
 *   post:
 *     summary: Registra una nueva novedad
 *     description: "Crea un registro de novedad para one o más fichas. Tipos: INCAPACIDAD, PERMISO, VACACIONES, OTRO."
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/New'
 *               - type: object
 *                 required:
 *                   - fiches
 *                   - instructor
 *                   - description
 *                   - date
 *                   - type
 *           example:
 *             fiches: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *             instructor: "507f1f77bcf86cd799439015"
 *             description: "Instructor incapacitado por enfermedad"
 *             date: "2024-02-10T00:00:00.000Z"
 *             type: "INCAPACIDAD"
 *             document: "https://drive.google.com/file/d/abc123"
 *     responses:
 *       200:
 *         description: Novedad registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Novedad registrada correctamente"
 */
routerNew.post("/register", validateRegisterNew, registerNew);

/**
 * @swagger
 * /api/news/registerimprovement:
 *   post:
 *     summary: Registra una mejora
 *     description: Crea un registro de mejora para una o más fichas.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/New'
 *               - type: object
 *                 required:
 *                   - fiches
 *                   - instructor
 *                   - description
 *                   - date
 *           example:
 *             fiches: ["507f1f77bcf86cd799439011"]
 *             instructor: "507f1f77bcf86cd799439015"
 *             description: "Actividad de mejora pendiente por completar"
 *             date: "2024-02-10T00:00:00.000Z"
 *             document: "https://drive.google.com/file/d/xyz789"
 *     responses:
 *       200:
 *         description: Mejora registrada correctamente
 */
routerNew.post("/registerimprovement", validateImprovement, registerImprovement);

/**
 * @swagger
 * /api/news/registerpublic:
 *   post:
 *     summary: Registra una novedad públicamente
 *     description: Crea un registro de novedad sin autenticación. Útil para que instructores reporten ausencias directamente.
 *     tags: [Novedades]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tpnew
 *               - tpdocument
 *               - document
 *               - name
 *               - email
 *               - phone
 *               - fiche
 *               - datesofia
 *               - file
 *             properties:
 *               tpnew:
 *                 type: string
 *                 description: Tipo de novedad (TRASLADO, RETIRO VOLUNTARIO, REINGRESO, REINGRESO ESPECIAL, APLAZAMIENTO, DESERCIÓN)
 *                 enum: ["TRASLADO", "RETIRO VOLUNTARIO", "REINGRESO", "REINGRESO ESPECIAL", "APLAZAMIENTO", "DESERCIÓN"]
 *               tpdocument:
 *                 type: string
 *                 description: Tipo de documento (CC, TI, CE, PASAPORTE)
 *                 enum: ["CC", "TI", "CE", "PASAPORTE"]
 *               document:
 *                 type: string
 *                 description: Número de documento
 *               name:
 *                 type: string
 *                 description: Nombre completo
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *               phone:
 *                 type: string
 *                 description: Teléfono (10 dígitos)
 *                 minLength: 10
 *                 maxLength: 10
 *               fiche:
 *                 type: string
 *                 description: ID de la ficha (MongoDB ObjectId)
 *               datesofia:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de registro en SOFIA
 *               cause:
 *                 type: string
 *                 description: Causa de la novedad (opcional)
 *               typetransfer:
 *                 type: string
 *                 description: Tipo de traslado (requerido si tpnew es TRASLADO)
 *               subtype:
 *                 type: string
 *                 description: Subtipo (requerido según tpnew)
 *               workingday:
 *                 type: string
 *                 description: Jornada (requerido si typetransfer es JORANDA)
 *               center:
 *                 type: string
 *                 description: Centro (requerido si typetransfer es CENTRO)
 *               city:
 *                 type: string
 *                 description: Ciudad (requerido si typetransfer es CENTRO)
 *               duration:
 *                 type: number
 *                 description: Duración (requerido si tpnew es APLAZAMIENTO)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen soporte (jpg, jpeg, png)
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF adicional (opcional)
 *           example:
 *             tpnew: "DESERCIÓN"
 *             tpdocument: "CC"
 *             document: "1234567890"
 *             name: "Juan Pérez"
 *             email: "juan@example.com"
 *             phone: "3101234567"
 *             fiche: "64a48f2362abd793f5ce7e5b"
 *             datesofia: "2024-02-10T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Novedad pública registrada correctamente
 *       400:
 *         description: Error de validación
 */
routerNew.post("/registerpublic", validateFormPublic, registerNewPublic);

/**
 * @swagger
 * /api/news/active/{id}:
 *   put:
 *     summary: Activa una novedad
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la novedad
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Novedad activada correctamente
 */
routerNew.put("/active/:id", validateExistNew, activeNew);

/**
 * @swagger
 * /api/news/inactive/{id}:
 *   put:
 *     summary: Inactiva una novedad
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la novedad
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Novedad desactivada correctamente
 */
routerNew.put("/inactive/:id", validateExistNew, inactiveNew);

/**
 * @swagger
 * /api/news/update/{id}:
 *   put:
 *     summary: Actualiza una novedad
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la novedad
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/New'
 *           example:
 *             fiches: ["507f1f77bcf86cd799439011"]
 *             instructor: "507f1f77bcf86cd799439015"
 *             description: "Descripción actualizada de la novedad"
 *             date: "2024-02-10T00:00:00.000Z"
 *             type: "INCAPACIDAD"
 *     responses:
 *       200:
 *         description: Novedad actualizada correctamente
 */
routerNew.put("/update/:id", validateUpdateNew, updateNew);

/**
 * @swagger
 * /api/news/updateadvanced/{id}:
 *   put:
 *     summary: Actualiza estado avanzado de una novedad
 *     description: Permite actualizar el estado, respuesta, prioridad y otros campos avanzados de una novedad.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la novedad
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["PENDIENTE", "PROCESADA", "RESUELTA", "RECHAZADA"]
 *                 example: "RESUELTA"
 *               response:
 *                 type: string
 *                 example: "Novedad resuelta satisfactoriamente"
 *               statusAudit:
 *                 type: string
 *                 example: "COMPLETADO"
 *               priority:
 *                 type: string
 *                 enum: ["BAJA", "MEDIA", "ALTA", "URGENTE"]
 *                 example: "ALTA"
 *     responses:
 *       200:
 *         description: Novedad actualizada correctamente
 */
routerNew.put("/updateadvanced/:id", validateUpdateAdvancedNew, updateAdvancedNew);

/**
 * @swagger
 * /api/news/updatemultiple:
 *   put:
 *     summary: Actualiza múltiples novedades
 *     description: Permite actualizar el estado de varias novedades simultáneamente.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - news
 *             properties:
 *               news:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de las novedades a actualizar
 *               status:
 *                 type: string
 *                 example: "PROCESADA"
 *           example:
 *             news: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *             status: "PROCESADA"
 *     responses:
 *       200:
 *         description: Novedades actualizadas correctamente
 */
routerNew.put("/updatemultiple", validateUpdateMultiples, updateMultiplesNew);

/**
 * @swagger
 * /api/news/upgradepostpone:
 *   put:
 *     summary: Mejora o pospone múltiples novedades
 *     description: Marca novedades para mejora o posposición según la acción especificada.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - news
 *               - action
 *             properties:
 *               news:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de las novedades
 *               action:
 *                 type: string
 *                 enum: ["MEJORAR", "POSPONER"]
 *                 description: "Acción a realizar"
 *               observation:
 *                 type: string
 *                 description: "Observación adicional"
 *           example:
 *             news: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *             action: "MEJORAR"
 *             observation: "Se debe mejorar la documentación"
 *     responses:
 *       200:
 *         description: Acción aplicada correctamente
 */
routerNew.put("/upgradepostpone", validateUpgradePostpone, upgradePostponeNews);

/**
 * @swagger
 * /api/news/updateimprovement/{id}:
 *   put:
 *     summary: Actualiza una mejora existente
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la mejora
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fiches:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructor:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mejora actualizada correctamente
 */
routerNew.put("/updateimprovement/:id", validateUpdateImprovement, updateImprovement);

/**
 * @swagger
 * /api/news/aprovenew:
 *   put:
 *     summary: Aprueba una novedad
 *     description: Marca una novedad como aprobada y registra la respuesta.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - response
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de la novedad
 *               response:
 *                 type: string
 *                 description: "Respuesta de aprobación"
 *           example:
 *             id: "507f1f77bcf86cd799439011"
 *             response: "Novedad aprobada correctamente"
 *     responses:
 *       200:
 *         description: Novedad aprobada correctamente
 */
routerNew.put("/aprovenew", validateUpdateByInst, aproveNew);

/**
 * @swagger
 * /api/news/notaprovenew:
 *   put:
 *     summary: Rechaza una novedad
 *     description: Marca una novedad como rechazada y registra la razón.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - response
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de la novedad
 *               response:
 *                 type: string
 *                 description: "Razón del rechazo"
 *           example:
 *             id: "507f1f77bcf86cd799439011"
 *             response: "Novedad rechazada por documentación incompleta"
 *     responses:
 *       200:
 *         description: Novedad rechazada correctamente
 */
routerNew.put("/notaprovenew", validateUpdateByInst, notAproveNew);

/**
 * @swagger
 * /api/news/sendemail/{id}:
 *   put:
 *     summary: Envía email de mejora al instructor
 *     description: Envía un email de notificación al instructor sobre la mejora pendiente.
 *     tags: [Novedades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la mejora
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Email enviado correctamente"
 */
routerNew.put("/sendemail/:id", validateExistImprovement, sendEmailNew);

export { routerNew };
