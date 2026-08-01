import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    sender: {
      type: String,
      required: true,
      default: "Sistema REPFORA"
    },
    subject: {
      type: String,
      required: true,
    },
    fiche: {
      type: String,
      default: ""
    },
    recipient: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

export default model("Notification", NotificationSchema);
