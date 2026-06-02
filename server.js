// process.env.TZ = 'America/Bogota';
import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import dbConnection from "./database.js";
import morgan from "morgan";
import fileUpload from "express-fileupload";



import { routerUsers } from "./routes/users.routes.js";
import { routerInstructor } from "./routes/instructor.routes.js";
import { routerProgram } from "./routes/programs.routes.js";
import { routerCompetence } from "./routes/competences.routes.js";
import { routerEnvironment } from "./routes/environments.routes.js";
import { routerFiche } from "./routes/fiche.routes.js";
import { routerOutcome } from "./routes/outcomes.routes.js";
import { routerSchedule } from "./routes/schedules.routes.js";
import { routerReports } from "./routes/reports.routes.js";
import { routerTowns } from "./routes/towns.routes.js";
import { routerCoordination } from "./routes/coordinations.routes.js";
import { routerOtherSchedule } from "./routes/otherschedules.routes.js";
import { routerUploads } from "./routes/uploadfiles.routes.js";
import { routerBackupDatabase } from "./routes/backupdatabase.routes.js";
import { routerBinnacle } from "./routes/binnacle.routes.js";
import { routerNew } from "./routes/new.routes.js";
import { routerReportNew } from "./routes/reportnews.routes.js";
import { routerStorage } from "./routes/storage.routes.js";
import { cronDatabaseBackup, deleteOldBackups } from "./cron/database-backup.js";
import { reviewJudgment, reviewJudgmentDebug } from "./cron/def-value-judgment.js";
import { routerOmit } from "./routes/learnOmission.routes.js";
import { routerAuditLog } from "./routes/dailyAuditLogs.js"
import routerAuditoria from "./routes/auditoria.routes.js"
import routerAdminAudit from "./routes/adminAudit.routes.js"
import { initCron } from "./services/cronService.js"
import { initEmailSettings } from "./services/notificationService.js"
import { routerComplementary } from "./routes/complementary.routes.js"
import { routerPlanning } from "./routes/planning.routes.js";

dotenv.config();

/**
 * Represents a server.
 * @class
 */
class Server {

  /**
   * Setup Swagger configuration
   * @returns {Object} Swagger options
   */
  setupSwagger() {
    return {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'SENA Horarios API',
          version: '1.0.0',
          description: `
            Documentación de la API del Sistema de Horarios SENA.

            ## Autenticación

            La API utiliza tokens JWT. Para usar los endpoints protegidos:
            1. Haz login en \`/api/users/login\` o \`/api/instructors/login\`
            2. Copia el token de la respuesta
            3. Haz clic en el botón "Authorize" arriba y pega el token con el formato \`Bearer YOUR_TOKEN\`

            ## Roles Disponibles

            - **ADMIN**: Administrador del sistema
            - **COORDINADOR**: Coordinador de formación
            - **PROGRAMADOR**: Programador del sistema
            - **INSTRUCTOR**: Instructor del SENA
            - **EVALUADOR**: Evaluador de horarios
            - **NOVEDADES**: Gestión de novedades
            - **ETAPA PRODUCTIVA**: Etapa productiva

            ## Formatos

            - **Fechas**: ISO 8601 (ej: \`2024-01-15T00:00:00.000Z\`)
            - **Horas**: Formato 24h (ej: \`07:00\`)
            - **Días**: Array [0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb]

            ## Respuestas

            - **Éxito**: \`{ msg: "mensaje", data: ... }\`
            - **Error**: \`{ msg: "No fue posible terminar la operacion" }\` (status 400)
          `,
          contact: {
            name: 'SENA - Soporte',
            email: 'soporte@sena.edu.co'
          },
          license: {
            name: 'ISC'
          }
        },
        servers: [
          {
            url: process.env.URL_SERVER || `http://localhost:${process.env.PORT || 4500}`,
            description: 'Servidor de desarrollo',
          },
          {
            url: 'https://produccion-url.com',
            description: 'Servidor de producción',
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Token JWT obtenido al hacer login'
            }
          },
          schemas: {
            User: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Juan Pérez' },
                email: { type: 'string', format: 'email', example: 'usuario@sena.edu.co' },
                role: {
                  type: 'string',
                  enum: ['ADMIN', 'COORDINADOR', 'PROGRAMADOR', 'EVALUADOR', 'NOVEDADES', 'USER'],
                  example: 'COORDINADOR'
                },
                coordinations: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'IDs de coordinaciones (solo para rol NOVEDADES)'
                }
              }
            },
            Instructor: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Carlos Instructor' },
                tpdocument: { type: 'string', example: 'CC', description: 'Tipo de documento' },
                numdocument: { type: 'string', example: '12345678' },
                email: { type: 'string', format: 'email', example: 'instructor@sena.edu.co' },
                emailpersonal: { type: 'string', format: 'email', example: 'personal@email.com' },
                phone: { type: 'string', example: '3001234567' },
                knowledge: { type: 'string', example: 'DESARROLLO DE SOFTWARE' },
                thematicarea: { type: 'string', example: 'ADSO' },
                bindingtype: { type: 'string', example: 'PLANTA' },
                caphour: { type: 'number', example: 40, description: 'Capacidad de horas mensual' }
              }
            },
            Program: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'ANÁLISIS Y DESARROLLO DE SOFTWARE' },
                code: { type: 'string', example: '228100' }
              }
            },
            Competence: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'CONSTRUIR SITIOS WEB' },
                code: { type: 'string', example: 'C1' },
                program: { type: 'string', description: 'ID del programa' }
              }
            },
            Outcome: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Elaborar sitios web aplicando mejores prácticas' },
                code: { type: 'string', example: 'R1' },
                competence: { type: 'string', description: 'ID de la competencia' }
              }
            },
            Environment: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'LABORATORIO DE INFORMÁTICA 1' },
                code: { type: 'string', example: 'AMB-LI-001' }
              }
            },
            Fiche: {
              type: 'object',
              properties: {
                number: { type: 'string', example: '2281001', description: 'Número de ficha' },
                program: { type: 'string', description: 'ID del programa' },
                owner: { type: 'string', description: 'ID del instructor titular' },
                coordination: { type: 'string', description: 'ID de la coordinación' },
                fstart: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
                fend: { type: 'string', format: 'date-time', example: '2024-12-15T00:00:00.000Z' }
              }
            },
            Schedule: {
              type: 'object',
              properties: {
                fiche: { type: 'string', description: 'ID de la ficha' },
                program: { type: 'string', description: 'ID del programa' },
                competence: { type: 'string', description: 'ID de la competencia' },
                outcome: { type: 'string', description: 'ID del resultado de aprendizaje' },
                instructor: { type: 'string', description: 'ID del instructor' },
                environment: { type: 'string', description: 'ID del ambiente' },
                days: {
                  type: 'array',
                  items: { type: 'number' },
                  description: '[0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb]',
                  example: [1, 3, 5]
                },
                fstart: { type: 'string', format: 'date-time' },
                fend: { type: 'string', format: 'date-time' },
                tstart: { type: 'string', example: '07:00', description: 'Hora inicio (HH:mm)' },
                tend: { type: 'string', example: '10:00', description: 'Hora fin (HH:mm)' },
                supporttext: { type: 'string', example: 'APOYO DIDÁCTICO' },
                observation: { type: 'string', example: 'HORARIO REGULAR' }
              }
            },
            New: {
              type: 'object',
              properties: {
                fiches: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'IDs de las fichas afectadas'
                },
                instructor: { type: 'string', description: 'ID del instructor' },
                description: { type: 'string', example: 'Instructor incapacitado por enfermedad' },
                date: { type: 'string', format: 'date-time' },
                type: {
                  type: 'string',
                  enum: ['INCAPACIDAD', 'PERMISO', 'VACACIONES', 'OTRO'],
                  example: 'INCAPACIDAD'
                },
                document: { type: 'string', description: 'URL del documento soporte' }
              }
            },
            Error: {
              type: 'object',
              properties: {
                msg: { type: 'string', example: 'No fue posible terminar la operacion' }
              }
            },
            LoginRequest: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                role: { type: 'string', description: 'Rol del usuario (solo para usuarios)' },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password' }
              }
            },
            LoginResponse: {
              type: 'object',
              properties: {
                msg: { type: 'string', example: 'Usuario logueado correctamente' },
                token: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                name: { type: 'string' }
              }
            }
          },
          responses: {
            Unauthorized: {
              description: 'No autorizado - Token inválido o expirado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            NotFound: {
              description: 'Recurso no encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            BadRequest: {
              description: 'Solicitud inválida',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        tags: [
          { name: 'Auth', description: 'Autenticación y autorización' },
          { name: 'Usuarios', description: 'Gestión de usuarios del sistema' },
          { name: 'Instructores', description: 'Gestión de instructores' },
          { name: 'Programas', description: 'Programas de formación' },
          { name: 'Competencias', description: 'Competencias de aprendizaje' },
          { name: 'Resultados', description: 'Resultados de aprendizaje (Outcomes)' },
          { name: 'Ambientes', description: 'Ambientes de formación' },
          { name: 'Fichas', description: 'Fichas de formación' },
          { name: 'Horarios', description: 'Programación de horarios' },
          { name: 'Otros Horarios', description: 'Horarios especiales (seguimiento, reuniones)' },
          { name: 'Coordinaciones', description: 'Coordinaciones regionales' },
          { name: 'Novedades', description: 'Gestión de novedades y ausencias' },
          { name: 'Reportes', description: 'Generación de reportes' },
          { name: 'Auditoría', description: 'Sistema de auditoría y control' },
          { name: 'Archivos', description: 'Carga de archivos (Excel, imágenes)' },
          { name: 'Backup', description: 'Respaldo de base de datos' },
          { name: 'Bitácora', description: 'Registro de acciones del sistema' },
          { name: 'Cron', description: 'Tareas programadas' },
          { name: 'Storage', description: 'Monitoreo de almacenamiento' },
          { name: 'Health', description: 'Verificación de estado del servidor' },
          { name: 'Municipios', description: 'Gestión de municipios y departamentos' },
          { name: 'Omisiones', description: 'Registro de omisiones de aprendices' },
          { name: 'Complementarias', description: 'Acceso al modulo de Formacion Complementaria' }
        ]
      },
      apis: ['./routes/*.js', './controller/*.js']
    };
  }

  /**
   * Creates an instance of Server.
   * @constructor
   */
  /**
   * Creates an instance of Server.
   * @constructor
   */
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.swaggerOptions = this.setupSwagger();
    this.middlewares();
    this.routes();
    this.conexionBd();
    // this.interval();
    cronDatabaseBackup();
    deleteOldBackups();

    // initCron se llama desde conexionBd() para garantizar BD conectada
  }

  /**
   * Adds middlewares to the server.
   */
  middlewares() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(morgan("dev"));
    this.app.use(express.static("public"));
    this.app.use(
      fileUpload({
        createParentPath: true,
        useTempFiles: true,
      })
    );
  }

  /**
   * Adds routes to the server.
   */
  routes() {
    // this.app.use((req, res, next) => {
    //   const originalJson = res.json.bind(res);
    //   res.json = (data) => {
    //     const converted = convertDates(data); // función recursiva que ajusta fechas
    //     originalJson(converted);
    //   };
    //   next();
    // });
    
    // Swagger Documentation
    const swaggerDocs = swaggerJsdoc(this.swaggerOptions);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SENA Horarios API - Documentación',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        }
      }
    }));

    // Swagger JSON endpoint (para exportar)
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerDocs);
    });

    // Guard: evita ejecuciones concurrentes del cron
    let cronRunning = false;

    // Debug va ANTES y con app.get para match exacto
    this.app.get("/api/cron/debug", async (req, res) => {
      if (cronRunning) {
        return res.status(409).json({ msg: "Ya hay un proceso de auditoría en ejecución. Espere a que termine." });
      }
      cronRunning = true;
      try {
        const { skipEmail = true, skipMarkRated = true, skipSaveLog = true, maxFiches, ficheId, localReportPath } = req.query;
        const result = await reviewJudgmentDebug({
          skipEmail: skipEmail !== 'false',
          skipMarkRated: skipMarkRated !== 'false',
          skipSaveLog: skipSaveLog !== 'false',
          maxFiches: maxFiches ? parseInt(maxFiches, 10) : undefined,
          ficheId: ficheId || null,
          localReportPath: localReportPath || null  // Usar archivo local si se proporciona
        });
        res.json({
          msg: "Debug completado",
          summary: result.summary,
          reportFile: result.steps.find(s => s.step === 'REPORT')?.data || 'Ver carpeta OUTPUTDIR',
          errors: result.errors,
          groupsProcessed: result.groups.map(g => ({
            ficheNumber: g.ficheNumber,
            reportDownloaded: g.reportDownloaded,
            outcomesCount: g.outcomes?.length || 0,
            pendingCount: g.pendingItems?.length || 0,
            error: g.error
          }))
        });
      } catch (error) {
        console.error('Error en debug:', error);
        res.status(500).json({ msg: "Error en debug", error: error.message });
      } finally {
        cronRunning = false;
      }
    });

    this.app.get("/api/cron", async (req, res) => {
      if (cronRunning) {
        return res.status(409).json({ msg: "Ya hay un proceso de auditoría en ejecución. Espere a que termine." });
      }
      cronRunning = true;
      const maxFiches = req.query.maxFiches ? parseInt(req.query.maxFiches, 10) : undefined;
      try {
        await reviewJudgment({ maxFiches });
        res.json({ msg: "ok" });
      } catch (error) {
        console.error('Error en cron:', error);
        res.status(500).json({ msg: "Error en cron", error: error.message });
      } finally {
        cronRunning = false;
      }
    });

    

    this.app.use("/api/users", routerUsers);
    this.app.use("/api/instructors", routerInstructor);
    this.app.use("/api/programs", routerProgram);
    this.app.use("/api/competences", routerCompetence);
    this.app.use("/api/environments", routerEnvironment);
    this.app.use("/api/fiches", routerFiche);
    this.app.use("/api/outcomes", routerOutcome);
    this.app.use("/api/schedules", routerSchedule);
    this.app.use("/api/reports", routerReports);
    this.app.use("/api/towns", routerTowns);
    this.app.use("/api/coordinations", routerCoordination);
    this.app.use("/api/othersschedules", routerOtherSchedule);
    this.app.use("/api/uploads", routerUploads);
    this.app.use("/api/backupdatabase", routerBackupDatabase);
    this.app.use("/api/binnacle", routerBinnacle);
    this.app.use("/api/news", routerNew);
    this.app.use("/api/reportnew", routerReportNew);
    this.app.use("/api/learneromission", routerOmit);
    this.app.use("/api/auditlog", routerAuditLog);
    this.app.use("/api/auditoria", routerAuditoria);
    this.app.use("/api/storage", routerStorage);
    this.app.use("/api/complementary", routerComplementary);
    this.app.use("/api/planning", routerPlanning);
    this.app.use("/admin/audit", routerAdminAudit);
    this.app.use("/life", (req, res) => {
      res.send("life server");
    });
    this.app.use("*", (req, res) => {
      res.status(404).json({
        msg: "Page not found",
      });
    });
  }

  /**
   * Establishes a connection to the database.
   */
  async conexionBd() {
    await dbConnection();
    await initEmailSettings();
    await initCron();
  }

  /**
   * Sets an interval to execute a request to the server every 25 minutes.
   */
  // async interval() {
  //   if (process.env.URL_SERVER) {
  //     //ejecutar una petición http cada 25 minutos mientras la hora sea mayor a las 5:00 am y menor a las 11:00 pm hora colombiana,
  //     //teniendo en cuenta que heroku tiene la hora de estados unidos
  //     setInterval(async () => {
  //       const date = new Date();
  //       const hour = date.getUTCHours() - 5; //restar 5 horas para que quede en hora colombiana

  //       if (hour >= 5 && hour <= 23) {
  //         try {
  //           //peticion get a la ruta /life del servidor
  //           await axios.get(`${process.env.URL_SERVER}/life`);
  //         } catch (err) {}
  //       }
  //     }, 1500000); //1500000 milisegundos = 25 minutos
  //   }
  // }



  /**
   * Starts the server.
   */
  listen() {
    this.app.listen(this.port, () => {
      console.log(`Servidor en http://localhost:${this.port}`);
    });
  }
}

export default Server;
