/**
 * @typedef {Object} ComplementaryCatalog
 * @property {number} prfCodigo - Código del programa
 * @property {number} prfVersion - Versión del programa
 * @property {string} codVer - Código versión compuesto
 * @property {string} tipoFormacion - Tipo de formación
 * @property {string} prfDenominacion - Nombre del curso
 * @property {string} nivelFormacion - Nivel de formación
 * @property {number} prfDuracionMaxima - Duración máxima en horas
 * @property {number} prfDurEtapaLectiva - Duración etapa lectiva
 * @property {number} prfDurEtapaProd - Duración etapa productiva
 * @property {Date} prfFchRegistro - Fecha de registro
 * @property {Date} fechaActivoEnEjecucion - Fecha activo en ejecución
 * @property {number} prfEdadMinRequerida - Edad mínima requerida
 * @property {string} prfGradoMinRequerido - Grado mínimo requerido
 * @property {string} prfDescripcionRequisito - Descripción de requisitos
 * @property {string} prfResolucion - Resolución
 * @property {Date} prfFechaResolucion - Fecha resolución
 * @property {string} prfApoyoFic - Apoyo FIC
 * @property {number} prfCreditos - Créditos
 * @property {string} prfAlamedida - A la medida
 * @property {string} lineaTecnologica - Línea tecnológica
 * @property {string} redTecnologica - Red tecnológica
 * @property {string} redConocimiento - Red de conocimiento
 * @property {string} modalidad - Modalidad (Presencial/Virtual)
 * @property {string} apuestasPrioritarias - Apuestas prioritarias
 * @property {string} fic - FIC (Sí/No)
 * @property {number} status - Estado (0=activo, 1=inactivo)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */
import { Schema, model } from "mongoose";

const ComplementaryCatalogSquema = new Schema(
  {
    prfCodigo: {
      type: Number,
      unique: true,
      required: true,
    },
    prfVersion: {
      type: Number,
      required: true,
    },
    codVer: {
      type: String,
      required: true,
    },
    tipoFormacion: {
      type: String,
    },
    prfDenominacion: {
      type: String,
      required: true,
    },
    nivelFormacion: {
      type: String,
    },
    prfDuracionMaxima: {
      type: Number,
    },
    prfDurEtapaLectiva: {
      type: Number,
    },
    prfDurEtapaProd: {
      type: Number,
    },
    prfFchRegistro: {
      type: Date,
    },
    fechaActivoEnEjecucion: {
      type: Date,
    },
    prfEdadMinRequerida: {
      type: Number,
    },
    prfGradoMinRequerido: {
      type: String,
    },
    prfDescripcionRequisito: {
      type: String,
    },
    prfResolucion: {
      type: String,
    },
    prfFechaResolucion: {
      type: Date,
    },
    prfApoyoFic: {
      type: String,
    },
    prfCreditos: {
      type: Number,
    },
    prfAlamedida: {
      type: String,
    },
    lineaTecnologica: {
      type: String,
    },
    redTecnologica: {
      type: String,
    },
    redConocimiento: {
      type: String,
    },
    modalidad: {
      type: String,
    },
    apuestasPrioritarias: {
      type: String,
    },
    fic: {
      type: String,
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

export default model("ComplementaryCatalog", ComplementaryCatalogSquema);
