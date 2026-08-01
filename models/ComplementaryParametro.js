/**
 * @typedef {Object} ComplementaryParametro
 * @property {string} nombre - Nombre del parámetro (único por tipo)
 * @property {string} tipo - Tipo de parámetro: "programa" o "poblacion"
 * @property {number} status - Estado del registro (0=activo, 1=inactivo)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
import { Schema, model } from "mongoose";

const ComplementaryParametroSquema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ["programa", "poblacion"],
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

// Índice único compuesto: nombre + tipo (permite mismo nombre en distinto tipo)
ComplementaryParametroSquema.index({ nombre: 1, tipo: 1 }, { unique: true });

export default model("ComplementaryParametro", ComplementaryParametroSquema);
