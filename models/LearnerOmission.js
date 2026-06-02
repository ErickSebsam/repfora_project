import { Schema, model } from "mongoose";

const LearnerOmissionSchema = new Schema(
  {
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedules", // Referencia a tu modelo de programaciones
      required: true,
    },
    documentNumber: {
      type: String, // El dato contra el que comparamos en el Excel
      required: true,
    },
    learnerName: {
      type: String, // Nombre del aprendiz (para mostrar en la interfaz)
    },
    ficheNumber: {
      type: String, // Número de ficha (para agrupar en la interfaz)
    },
    outcomeText: {
      type: String, // Texto del resultado (para mostrar contexto)
    },
    justification: {
      type: String, // Justificación de por qué se omitió este aprendiz
      required: true,
      default: 'Sin justificación'
    },
    createdBy: {
      type: String, // Usuario que creó la omisión (opcional)
    },
  },
  {
    timestamps: true, // Útil para saber cuándo se omitió
  }
);

// Índice compuesto para evitar duplicar la misma omisión
LearnerOmissionSchema.index({ schedule: 1, documentNumber: 1 }, { unique: true });

export default model("LearnerOmission", LearnerOmissionSchema);