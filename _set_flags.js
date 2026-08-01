/**
 * Script temporal: activa emailEnabled=true y cronEnabled=true en AppSettings (BD).
 * La app lee estos flags de la BD (no solo del .env), así que son los que gobiernan
 * el envío de correos y el arranque del cron en producción.
 * ELIMINAR tras su uso.
 */
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import AppSettings from "./models/AppSettings.js";

await mongoose.connect(process.env.MONGO_URL);
const antes = await AppSettings.findOne();
console.log("[FLAGS] Antes:", { emailEnabled: antes.emailEnabled, cronEnabled: antes.cronEnabled });
const res = await AppSettings.findOneAndUpdate(
  {},
  { emailEnabled: true, cronEnabled: true },
  { upsert: true, new: true }
);
console.log("[FLAGS] Después:", { emailEnabled: res.emailEnabled, cronEnabled: res.cronEnabled });
await mongoose.disconnect();
process.exit(0);
