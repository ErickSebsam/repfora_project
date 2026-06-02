# 📚 Documentación de la API - Postman

## Colección de Postman

La colección de Postman para el Sistema de Horarios SENA se encuentra en:
```
postman-collection/SENA_Horarios_API.postman_collection.json
```

## 🔄 Cómo mantener la documentación actualizada

### Opción 1: Script Automático (Recomendado)

Después de agregar nuevos endpoints a tu proyecto, ejecuta:

```bash
npm run docs:generate
```

Esto escaneará automáticamente los archivos en `/routes` y actualizará la colección de Postman.

### Opción 2: Modo Watch (Desarrollo)

Para que la documentación se actualice automáticamente cada vez que modifies una ruta:

```bash
npm run docs:watch
```

Deja este comando corriendo en una terminal separada mientras desarrollas.

### Opción 3: Git Hook (Automático al commitear)

Instala husky para ejecutar el script antes de cada commit:

```bash
npm install -D husky
npx husky install
npx husky add .husky/pre-commit "npm run docs:generate"
git add postman-collection/SENA_Horarios_API.postman_collection.json
```

### Opción 4: Integración con Swagger/OpenAPI (Recomendado para producción)

Para tener documentación interactiva en el navegador, puedes integrar Swagger:

1. Instala las dependencias:
```bash
npm install swagger-jsdoc swagger-ui-express
```

2. Agrega esto a tu `server.js`:

```javascript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SENA Horarios API',
      version: '1.0.0',
      description: 'Documentación de la API del Sistema de Horarios SENA',
    },
    servers: [
      {
        url: process.env.URL_SERVER || 'http://localhost:4500',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './models/*.js'], // Archivos a escanear
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

3. Agrega comentarios JSDoc a tus rutas:

```javascript
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
routerUsers.post("/login", validateLoginUser, loginUser);
```

4. Accede a la documentación en: `http://localhost:4500/api-docs`

## 📁 Estructura de la Colección

| Carpeta | Descripción |
|---------|-------------|
| Auth - Usuarios | Login, registro, reset de contraseña |
| Instructores | Gestión de instructores |
| Programas | Programas de formación |
| Competencias | Competencias de aprendizaje |
| Resultados | Resultados de aprendizaje |
| Ambientes | Ambientes de formación |
| Fichas | Fichas de formación |
| Horarios | Programación de horarios |
| Novedades | Gestión de novedades |
| Reportes | Generación de reportes |
| Auditoría | Sistema de auditoría |

## 🔐 Autenticación

La API usa tokens JWT. Configura la variable `token` en Postman:

1. Haz login y copia el token de la respuesta
2. Actualiza la variable `token` en la colección
3. Los endpoints usarán automáticamente el token

## 🌍 Variables de Entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| baseUrl | http://localhost:4500 | URL base de la API |
| token | - | Token JWT de autenticación |

## 📝 Convenciones

- **IDs**: Los parámetros de ruta como `:id` deben reemplazarse por IDs reales de MongoDB
- **Fechas**: Formato ISO 8601: `2024-01-15T00:00:00.000Z`
- **Horas**: Formato 24h: `07:00`
- **Días**: Array [0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb]

## 🚀 Exportar a otros formatos

Desde Postman puedes exportar la colección a:
- OpenAPI 3.0
- RAML
- API Blueprint

Botón derecho sobre la colección → Exportar → Seleccionar formato
