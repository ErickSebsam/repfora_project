import { Router } from "express";
import { instrCtrl } from "../controller/instructor.controller.js";
import { instructorVali } from "../validations/instructor.validation.js";
import { compCtrl } from "../controller/complementary.controller.js";
import { complementaryVali } from "../validations/complementary.validation.js";

const {
  validateEmail,
  validateRegisterInstr,
  validateExistInstr,
  validateUpdateInstr,
  validateHeaders,
  validateActiveInstr,
  validatetokenloginInstru,
} = instructorVali;

const {
  validateSendCode,
  validateVerifyCode,
} = complementaryVali;

const {
  getInstrId,
  registerInstr,
  getInstrs,
  loginUser,
  updateInstr,
  activeInstr,
  inactiveInstr,
  changePasswordInst,
  resetPassword,
  validateTokenLogin,
  checkInstructorAvailability
} = instrCtrl;

const {
  sendCode,
  verifyCode,
} = compCtrl;

const routerInstructor = Router();

/**
 * @swagger
 * /api/instructors/{id}:
 *   get:
 *     summary: Obtiene un instructor por ID
 *     tags: [Instructores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instructor (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Instructor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Instructor'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerInstructor.get("/:id", validateExistInstr, getInstrId);
routerInstructor.get("/:id/availability", [], checkInstructorAvailability);

/**
 * @swagger
 * /api/instructors:
 *   get:
 *     summary: Obtiene todos los instructores
 *     tags: [Instructores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *           enum: [0, 1]
 *         description: Filtrar por estado (0=activo, 1=inactivo)
 *     responses:
 *       200:
 *         description: Lista de instructores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Instructor'
 */
routerInstructor.get("/", validateHeaders, getInstrs);

/**
 * @swagger
 * /api/instructors/login:
 *   post:
 *     summary: Inicia sesión de instructor
 *     description: Autentica un instructor y retorna un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "instructor@sena.edu.co"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario logueado correctamente"
 *                 token:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Credenciales incorrectas"
 */
routerInstructor.post("/login", [], loginUser);

/**
 * @swagger
 * /api/instructors/register:
 *   post:
 *     summary: Registra un nuevo instructor
 *     tags: [Instructores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/Instructor'
 *               - type: object
 *                 required:
 *                   - name
 *                   - tpdocument
 *                   - numdocument
 *                   - email
 *                   - phone
 *                 properties:
 *                   password:
 *                     type: string
 *                     format: password
 *                     description: "Contraseña del instructor (por defecto: 12345678)"
 *                     example: "12345678"
 *           example:
 *             name: "Carlos Instructor"
 *             tpdocument: "CC"
 *             numdocument: "12345678"
 *             emailpersonal: "personal@email.com"
 *             email: "instructor@sena.edu.co"
 *             phone: "3001234567"
 *             knowledge: "DESARROLLO DE SOFTWARE"
 *             thematicarea: "ADSO"
 *             bindingtype: "PLANTA"
 *             caphour: 40
 *     responses:
 *       200:
 *         description: Instructor registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Instructor registrado correctamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerInstructor.post("/register", validateRegisterInstr, registerInstr);

/**
 * @swagger
 * /api/instructors/resetpassword:
 *   post:
 *     summary: Solicita restablecimiento de contraseña del instructor
 *     description: Envía un email con el enlace para restablecer la contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "instructor@sena.edu.co"
 *     responses:
 *       200:
 *         description: Email enviado correctamente
 */
routerInstructor.post("/resetpassword", validateEmail, resetPassword);

/**
 * @swagger
 * /api/instructors/changepassword:
 *   post:
 *     summary: Cambia la contraseña del instructor
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de restablecimiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "nuevaPassword123"
 *     responses:
 *       200:
 *         description: Contraseña cambiada correctamente
 */
routerInstructor.post("/changepassword", validateEmail, changePasswordInst);

/**
 * @swagger
 * /api/instructors/active/{id}:
 *   put:
 *     summary: Activa un instructor
 *     tags: [Instructores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instructor
 *     responses:
 *       200:
 *         description: Instructor activado correctamente
 */
routerInstructor.put("/active/:id", validateActiveInstr, activeInstr);

/**
 * @swagger
 * /api/instructors/inactive/{id}:
 *   put:
 *     summary: Inactiva un instructor
 *     tags: [Instructores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instructor
 *     responses:
 *       200:
 *         description: Instructor desactivado correctamente
 */
routerInstructor.put("/inactive/:id", validateExistInstr, inactiveInstr);

/**
 * @swagger
 * /api/instructors/update/{id}:
 *   put:
 *     summary: Actualiza un instructor
 *     tags: [Instructores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instructor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Instructor'
 *           example:
 *             name: "Carlos Instructor Actualizado"
 *             tpdocument: "CC"
 *             numdocument: "12345678"
 *             emailpersonal: "personal@email.com"
 *             email: "instructor@sena.edu.co"
 *             phone: "3001234567"
 *             knowledge: "DESARROLLO DE SOFTWARE ACTUALIZADO"
 *             thematicarea: "ADSO"
 *             bindingtype: "PLANTA"
 *             caphour: 40
 *     responses:
 *       200:
 *         description: Instructor actualizado correctamente
 */
routerInstructor.put("/update/:id", validateUpdateInstr, updateInstr);

// ==================== Complementarias: Acceso con código (RF-01) ====================

/**
 * @swagger
 * /api/instructors/complementary/access/send-code:
 *   post:
 *     summary: Enviar codigo de verificacion a los correos del instructor (email y emailpersonal)
 *     description: Identifica al instructor desde el token JWT, genera un codigo de 6 digitos y lo envia a ambos correos por separado
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Codigo enviado correctamente a uno o ambos correos
 *       400:
 *         description: No se pudo enviar el codigo a ningun correo
 *       401:
 *         description: Token invalido o instructor no encontrado
 */
routerInstructor.post("/complementary/access/send-code", validateSendCode, sendCode);

/**
 * @swagger
 * /api/instructors/complementary/access/verify-code:
 *   post:
 *     summary: Verificar codigo y obtener acceso a complementarias
 *     description: Identifica al instructor desde el token JWT, valida el codigo de 6 digitos y retorna un token de acceso
 *     tags: [Complementarias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "384729"
 *     responses:
 *       200:
 *         description: Acceso concedido, retorna token de complementarias
 *       401:
 *         description: Codigo incorrecto, expirado o token invalido
 */
routerInstructor.post("/complementary/access/verify-code", validateVerifyCode, verifyCode);

export { routerInstructor };
