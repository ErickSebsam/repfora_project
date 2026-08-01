/**
 * @typedef {Object} ComplementaryRequest
 * @property {string} numeroSolicitud - Consecutivo automático (0000001-YYYYMMDD)
 * @property {Schema.Types.ObjectId} catalogCourse - Referencia al curso del catálogo
 * @property {string} catalogCourseName - Nombre del curso denormalizado
 * @property {string} catalogCourseCode - Código del curso denormalizado
 * @property {string} catalogCourseVersion - Versión del curso denormalizada
 * @property {number} prfDuracionMaxima - Duración máxima en horas del programa
 * @property {Schema.Types.ObjectId} instructor - Referencia al instructor principal solicitante
 * @property {Array<{instructor: Schema.Types.ObjectId, nombre: string, documento: string, email: string, esPrincipal: boolean}>} instructores - Instructores de la solicitud (incluye al principal)
 * @property {string} supervisorNombre - Nombre del supervisor (denormalizado)
 * @property {Schema.Types.ObjectId} supervisor - Referencia al coordinador supervisor
 * @property {string} ambienteNombre - Nombre del ambiente de formación
 * @property {string} ambienteDireccion - Dirección del ambiente de formación
 * @property {string} formationDocument - Ruta del documento de formación subido
 * @property {Array<{nombre: string, codigo: string, horas: number, criterios: string[]}>} competencies - Competencias de formación con datos completos del extractor PDF (llenado por coordinador post-aprobación)
 * @property {string[]} outcomes - Resultados de aprendizaje (llenado por coordinador post-aprobación)
 * @property {string} learningActivity - Actividad de aprendizaje (llenado por coordinador post-aprobación)
 * @property {Array<{fecha: string, horaInicio: string, horaFin: string, totalHoras: number, instructor: Schema.Types.ObjectId, competencia: string, resultados: string[], actividadAprendizaje: string}>} sesiones - Sesiones vinculadas a un instructor específico
 * @property {Date} fechaInicio - Fecha de inicio del programa (asignado en assign-ficha)
 * @property {Date} fechaFin - Fecha de finalización del programa (asignado en assign-ficha)
 * @property {Date} fechaInscripcion - Fecha de apertura de inscripciones (asignado en assign-ficha)
 * @property {Date} fechaMatriculaInicio - Fecha inicio de matrícula (asignado en assign-ficha)
 * @property {Date} fechaMatriculaFin - Fecha fin de matrícula (asignado en assign-ficha)
 * @property {string} municipio - Municipio de ubicación
 * @property {string} vereda - Vereda de ubicación
 * @property {string} direccion - Dirección de ubicación
 * @property {string} nombreEmpresa - Nombre de la empresa asociada
 * @property {string} nitEmpresa - NIT de la empresa
 * @property {string} contactoEmpresa - Contacto de la empresa
 * @property {string} telefonoEmpresa - Teléfono de la empresa
 * @property {number} numAprendices - Número de aprendices (required)
 * @property {string} tipoPrograma - Tipo de programa (gestionado dinámicamente en ComplementaryParametro)
 * @property {string} tipoPoblacion - Tipo de población (gestionado dinámicamente en ComplementaryParametro)
 * @property {string} requisitosIngreso - Requisitos de ingreso
 * @property {string} recursosNecesarios - Recursos necesarios
 * @property {string} state - Estado de la solicitud (incluye EJECUCION)
 * @property {Array} history - Historial de cambios de estado
 * @property {boolean} formationDataCompleted - Si el coordinador completó datos de formación
 * @property {string} fichaNumber - Número de ficha asignado
 * @property {string} codigoSolicitud - Código de solicitud SOFIA PLUS
 * @property {string} fichaCaracterizacion - Ficha de caracterización SOFIA PLUS
 * @property {string} proyectoAsociado - Proyecto asociado
 * @property {number} status - Estado del registro
 * @property {Array<{requestedBy: Schema.Types.ObjectId, requestDate: Date, observaciones: string, status: string, resolvedBy: Schema.Types.ObjectId, resolvedDate: Date, resolvedObservations: string}>} extensionRequests - Solicitudes de ampliación de fecha fin (el instructor describe el motivo; la nueva fecha la define el coordinador en reprogramación)
 */
import { Schema, model } from "mongoose";

const ComplementaryRequestSquema = new Schema(
  {
    catalogCourse: {
      type: Schema.Types.ObjectId,
      ref: "ComplementaryCatalog",
      required: true,
    },
    catalogCourseName: {
      type: String,
      required: true,
    },
    catalogCourseCode: {
      type: String,
      required: true,
    },
    catalogCourseVersion: {
      type: String,
      required: true,
    },
    prfDuracionMaxima: {
      type: Number,
      default: 0,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    environment: {
      type: Schema.Types.ObjectId,
      ref: "Environment",
    },
    numeroSolicitud: {
      type: String,
      unique: true,
      sparse: true,
    },
    supervisorNombre: {
      type: String,
      default: "",
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ambienteNombre: {
      type: String,
      default: "",
    },
    ambienteDireccion: {
      type: String,
      default: "",
    },
    formationDocument: {
      type: String,
      default: "",
    },
    competencies: [
      {
        nombre: { type: String, default: "" },
        codigo: { type: String, default: "" },
        horas: { type: Number, default: 0 },
        criterios: [{ type: String }],
      },
    ],
    outcomes: [
      {
        type: String,
      },
    ],
    learningActivity: {
      type: String,
      default: "",
    },
    sesiones: [
      {
        fecha: { type: String },
        horaInicio: { type: String },
        horaFin: { type: String },
        totalHoras: { type: Number },
        instructor: { type: Schema.Types.ObjectId, ref: "Instructor" },
        competencia: { type: String, default: "" },
        resultados: [{ type: String }],
        actividadAprendizaje: { type: String, default: "" },
      },
    ],
    fechaInicio: {
      type: Date,
    },
    fechaFin: {
      type: Date,
    },
    fechaInscripcion: {
      type: Date,
    },
    fechaMatriculaInicio: {
      type: Date,
    },
    fechaMatriculaFin: {
      type: Date,
    },
    departamento: {
      type: String,
      default: "",
    },
    municipio: {
      type: String,
      default: "",
    },
    vereda: {
      type: String,
      default: "",
    },
    direccion: {
      type: String,
      default: "",
    },
    nombreEmpresa: {
      type: String,
      default: "",
    },
    nitEmpresa: {
      type: String,
      default: "",
    },
    contactoEmpresa: {
      type: String,
      default: "",
    },
    telefonoEmpresa: {
      type: String,
      default: "",
    },
    numAprendices: {
      type: Number,
      required: true,
    },
    // Valores gestionados dinámicamente en la colección ComplementaryParametro
    // (CRUD de parámetros tipo "programa"/"poblacion"). Sin enum hardcodeado:
    // el catálogo viviente es la fuente de verdad y los coordinadores pueden
    // crear nuevos valores sin requerir cambios en el modelo.
    tipoPrograma: {
      type: String,
    },
    tipoPoblacion: {
      type: String,
    },
    requisitosIngreso: {
      type: String,
      default: "",
    },
    recursosNecesarios: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      enum: [
        "PENDIENTE",
        "APROBADA",
        "RECHAZADA",
        "FICHA_ASIGNADA",
        "INSCRIPCION",
        "MATRICULADA",
        "PROGRAMADA",
        "EJECUCION",
        "CANCELADA",
        "CERRADA",
      ],
      default: "PENDIENTE",
    },
    history: [
      {
        previousState: { type: String },
        newState: { type: String },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        changedByRole: { type: String },
        timestamp: { type: Date, default: Date.now },
        observations: { type: String, default: "" },
      },
    ],
    formationDataCompleted: {
      type: Boolean,
      default: false,
    },
    instructores: [
      {
        instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
        nombre: { type: String, default: "" },
        documento: { type: String, default: "" },
        email: { type: String, default: "" },
        esPrincipal: { type: Boolean, default: false },
      },
    ],
    fichaNumber: {
      type: String,
      default: "",
    },
    codigoSolicitud: {
      type: String,
      default: "",
    },
    fichaCaracterizacion: {
      type: String,
      default: "",
    },
    proyectoAsociado: {
      type: String,
      default: "",
    },
    status: {
      type: Number,
      default: 0,
    },
    visto: {
      type: Boolean,
      default: false,
    },
    // Solicitudes de ampliación de fecha fin.
    // El instructor solo describe el motivo (observaciones libres);
    // la nueva fechaFin la define el coordinador/programador en el paso de reprogramación.
    // Una solicitud muere al resolverse (APROBADA/RECHAZADA); si el instructor
    // quiere volver a pedir, crea una nueva entrada (no reutiliza la anterior).
    extensionRequests: [
      {
        requestedBy: { type: Schema.Types.ObjectId, ref: "Instructor" },
        requestDate: { type: Date, default: Date.now },
        observaciones: { type: String, required: true },
        status: {
          type: String,
          enum: ["PENDIENTE", "APROBADA", "RECHAZADA"],
          default: "PENDIENTE",
        },
        resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        resolvedDate: { type: Date },
        resolvedObservations: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model("ComplementaryRequest", ComplementaryRequestSquema);
