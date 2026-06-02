import { Router } from "express";
import { userCtrl } from "../controller/users.controller.js";
import { usersVali } from "../validations/users.validation.js";

const {
  validateLoginUser,
  validateRegisterUser,
  validateExistUser,
  validateUpdateUser,
  validateEmail,
  validateChangePassword,
  validateHeaders,
  validateHeadersSuper,
  validatetokenloginuser,
  validateActiveUser,
} = usersVali;

const {
  getUserId,
  getCoodinators,
  getPogrammers,
  loginUser,
  validateTokenLogin,
  registerUser,
  getUsers,
  updateUser,
  activeUser,
  inactiveUser,
  logoutUser,
  resetPassword,
  changePassword,
} = userCtrl;

const routerUsers = Router();

/**
 * @swagger
 * /api/users/logout:
 *   get:
 *     summary: Cierra la sesión del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario deslogueado correctamente"
 */
routerUsers.get("/logout", validateHeaders, logoutUser);

/**
 * @swagger
 * /api/users/onlycoordinator:
 *   get:
 *     summary: Obtiene lista de coordinadores
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de coordinadores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
routerUsers.get("/onlycoordinator", validateHeadersSuper, getCoodinators);

/**
 * @swagger
 * /api/users/onlyprogrammers:
 *   get:
 *     summary: Obtiene lista de programadores
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de programadores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
routerUsers.get("/onlyprogrammers", validateHeadersSuper, getPogrammers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
routerUsers.get("/:id", validateExistUser, getUserId);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
routerUsers.get("/", validateHeadersSuper, getUsers);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     description: "Autentica un usuario y retorna un token JWT. Los roles válidos son: ADMIN, ETAPA PRODUCTIVA"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Login como administrador
 *               value:
 *                 role: "ADMIN"
 *                 email: "admin@sena.edu.co"
 *                 password: "password123"
 *             etapa:
 *               summary: Login como etapa productiva
 *               value:
 *                 role: "ETAPA PRODUCTIVA"
 *                 email: "usuario@sena.edu.co"
 *                 password: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
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
routerUsers.post("/login", validateLoginUser, loginUser);

/**
 * @swagger
 * /api/users/token/productive/stages:
 *   post:
 *     summary: Valida token de etapa productiva
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: boolean
 *                   example: true
 */
routerUsers.post("/token/productive/stages", validatetokenloginuser, validateTokenLogin);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/User'
 *               - type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - password
 *                   - role
 *                 properties:
 *                   password:
 *                     type: string
 *                     format: password
 *                     minLength: 8
 *                     example: "password123"
 *           examples:
 *             coordinador:
 *               summary: Registro de coordinador
 *               value:
 *                 name: "Juan Pérez"
 *                 email: "juanperez@sena.edu.co"
 *                 password: "password123"
 *                 role: "COORDINADOR"
 *             novedades:
 *               summary: Registro de usuario de novedades con coordinaciones
 *               value:
 *                 name: "María González"
 *                 email: "mariagonzalez@sena.edu.co"
 *                 password: "password123"
 *                 role: "NOVEDADES"
 *                 coordinations: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario registrado correctamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
routerUsers.post("/register", validateRegisterUser, registerUser);

/**
 * @swagger
 * /api/users/resetpassword:
 *   post:
 *     summary: Solicita restablecimiento de contraseña
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
 *                 example: "usuario@sena.edu.co"
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
 *       400:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario no encontrado"
 */
routerUsers.post("/resetpassword", validateEmail, resetPassword);

/**
 * @swagger
 * /api/users/active/{id}:
 *   put:
 *     summary: Activa un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Usuario activado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario activado correctamente"
 */
routerUsers.put("/active/:id", validateActiveUser, activeUser);

/**
 * @swagger
 * /api/users/inactive/{id}:
 *   put:
 *     summary: Inactiva un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Usuario desactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario desactivado correctamente"
 */
routerUsers.put("/inactive/:id", validateExistUser, inactiveUser);

/**
 * @swagger
 * /api/users/update/{id}:
 *   put:
 *     summary: Actualiza un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/User'
 *               - type: object
 *                 properties:
 *                   password:
 *                     type: string
 *                     format: password
 *                     example: "newpassword123"
 *           example:
 *             name: "Juan Pérez Actualizado"
 *             email: "juanperez@sena.edu.co"
 *             password: "newpassword123"
 *             role: "COORDINADOR"
 *             coordinations: ["507f1f77bcf86cd799439011"]
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Usuario actualizado correctamente"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
routerUsers.put("/update/:id", validateUpdateUser, updateUser);

/**
 * @swagger
 * /api/users/changepassword/{token}:
 *   put:
 *     summary: Cambia la contraseña con token de restablecimiento
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de restablecimiento recibido por email
 *         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Contraseña cambiada correctamente"
 *       400:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Token invalido"
 */
routerUsers.put(
  "/changepassword/:token",
  validateChangePassword,
  changePassword
);

export { routerUsers };
