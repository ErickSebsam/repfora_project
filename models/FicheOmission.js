import { Schema, model } from "mongoose";

const FicheOmissionSchema = new Schema(
  {
    ficheNumber: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: 'Sin justificación'
    },
    createdBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

FicheOmissionSchema.index({ ficheNumber: 1 }, { unique: true });

export default model("FicheOmission", FicheOmissionSchema);
