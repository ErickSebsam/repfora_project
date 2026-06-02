import { Schema, model } from "mongoose";

const FailedFicheSchema = new Schema(
  {
    ficheNumber: {
      type: String,
      required: true,
      unique: true
    },
    error: {
      type: String,
      required: true
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default model("FailedFiche", FailedFicheSchema);
