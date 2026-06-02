/**
 * @typedef {Object} ComplementaryRequest
 * @property {Schema.Types.ObjectId} catalogCourse - Referencia al curso del catálogo
 * @property {string} catalogCourseName - Nombre del curso denormalizado
 * @property {string} catalogCourseCode - Código del curso denormalizado
 * @property {string} catalogCourseVersion - Versión del curso denormalizada
 * @property {Schema.Types.ObjectId} instructor - Referencia al instructor solicitante
 * @property {Schema.Types.ObjectId} environment - Referencia al ambiente de formación
 * @property {string} formationDocument - Ruta del documento de formación subido
 * @property {string[]} competencies - Competencias de formación
 * @property {string[]} outcomes - Resultados de aprendizaje
 * @property {string} learningActivity - Actividad de aprendizaje
 * @property {Date} fechaInicio - Fecha de inicio del programa
 * @property {Date} fechaFin - Fecha de finalización del programa
 * @property {Date} fechaInscripcion - Fecha de apertura de inscripciones
 * @property {Date} fechaMatriculaInicio - Fecha inicio de matrícula
 * @property {Date} fechaMatriculaFin - Fecha fin de matrícula
 * @property {string} municipio - Municipio de ubicación
 * @property {string} vereda - Vereda de ubicación
 * @property {string} direccion - Dirección de ubicación
 * @property {string} nombreEmpresa - Nombre de la empresa asociada
 * @property {string} nitEmpresa - NIT de la empresa
 * @property {string} contactoEmpresa - Contacto de la empresa
 * @property {string} telefonoEmpresa - Teléfono de la empresa
 * @property {number} numAprendices - Número de aprendices
 * @property {string} tipoPrograma - Tipo de programa
 * @property {string} tipoPoblacion - Tipo de población
 * @property {string} requisitosIngreso - Requisitos de ingreso
 * @property {string} recursosNecesarios - Recursos necesarios
 * @property {string} state - Estado de la solicitud
 * @property {Array} history - Historial de cambios de estado
 * @property {string} fichaNumber - Número de ficha asignado
 * @property {string} proyectoAsociado - Proyecto asociado
 * @property {number} status - Estado del registro
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
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    environment: {
      type: Schema.Types.ObjectId,
      ref: "Environment",
    },
    formationDocument: {
      type: String,
      default: "",
    },
    competencies: [
      {
        type: String,
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
      default: 0,
    },
    tipoPrograma: {
      type: String,
      default: "",
    },
    tipoPoblacion: {
      type: String,
      default: "",
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
        "PROGRAMADA",
        "CANCELADA",
        "CERRADA",
      ],
      default: "PENDIENTE",
    },
    history: [
      {
        previousState: { type: String },
        newState: { type: String },
        changedBy: { type: String },
        changedByRole: { type: String },
        timestamp: { type: Date, default: Date.now },
        observations: { type: String, default: "" },
      },
    ],
    fichaNumber: {
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
  },
  {
    timestamps: true,
  }
);

export default model("ComplementaryRequest", ComplementaryRequestSquema);
