/**
 * Script de verificación AISLADO del envío de correos.
 *
 * PROPÓSITO: probar que el transporte SMTP (Gmail) + credenciales + plantillas
 * .hbs funcionan de verdad, enviando UN solo correo de prueba a TEST_MAIL_RECIPIENT.
 *
 * SEGURIDAD: NO toca el código de producción ni la BD. NO envía a instructores reales.
 * Las notificaciones del DF-14A ignoran USE_TEST_RECIPIENT por diseño (van al email real
 * del instructor), así que para probar de forma segura usamos este envío directo al
 * destinatario de prueba, replicando exactamente el mismo `sendEmail` + plantillas que
 * usan sendMissingRouteNotification / sendMissingJudgmentsNotification.
 *
 * Archivo temporal: eliminar tras la verificación.
 */
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

// Parche DNS del entorno (127.0.0.1 no resuelve) — solo para este script.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import sendEmail from "./utils/emails/sendEmail.js";
import Coordination from "./models/Coordination.js";

async function main() {
  const TO = process.env.TEST_MAIL_RECIPIENT || "dfordonezpina@gmail.com";
  console.log(`[SMTP-TEST] Destinatario de prueba: ${TO}`);
  console.log(
    `[SMTP-TEST] FROM_EMAIL=${process.env.FROM_EMAIL ? "(presente)" : "(FALTA)"}, ` +
      `SECURY_EMAIL=${process.env.SECURY_EMAIL ? "(presente)" : "(FALTA)"}`
  );

  // Conectar a Mongo para leer credenciales de la coordinación (igual que la app real).
  if (!process.env.MONGO_URL) {
    console.error("[SMTP-TEST] Falta MONGO_URL");
    process.exit(2);
  }
  await mongoose.connect(process.env.MONGO_URL);
  console.log("[SMTP-TEST] Mongo conectado ✓");

  // Buscar credenciales de PROGRAMAS ESPECIALES (mismo flujo que la app).
  const coordination = await Coordination.findOne({
    name: "PROGRAMAS ESPECIALES",
    status: 0,
  });
  const hasCoord = !!(coordination?.email && coordination?.passapp);
  const fromEmail = hasCoord ? coordination.email : process.env.FROM_EMAIL;
  const fromPass = hasCoord ? coordination.passapp : process.env.SECURY_EMAIL;
  console.log(
    `[SMTP-TEST] Credenciales: ${hasCoord ? "coordinación PROGRAMAS ESPECIALES" : "DEFAULT (.env)"} ` +
      `→ from=${fromEmail}`
  );

  if (!fromEmail || !fromPass) {
    console.error("[SMTP-TEST] ❌ Sin credenciales de correo disponibles.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // 1) Prueba plantilla "sin ruta" (la misma que sendMissingRouteNotification).
  console.log("\n[SMTP-TEST] 1/2 Enviando prueba plantilla SIN RUTA...");
  try {
    await sendEmail(
      fromEmail,
      fromPass,
      [TO],
      `[PRUEBA SMTP] Fichas sin Ruta de Aprendizaje - 1234567`,
      {
        instructorName: "Instructor de Prueba (SMTP)",
        fichas: [
          { fichaNumber: "1234567", courseName: "Curso complementario prueba", enTransito: 5 },
        ],
        url: process.env.FRONTEND_URL || "https://repfora.sena.edu.co",
      },
      "./template/sinRutaNotification.hbs",
      null,
      null
    );
    console.log("[SMTP-TEST] ✓ Correo SIN RUTA enviado a", TO);
  } catch (e) {
    console.error("[SMTP-TEST] ✗ Falló SIN RUTA:", e.message);
  }

  // 2) Prueba plantilla "juicios pendientes" (la misma que sendMissingJudgmentsNotification).
  console.log("\n[SMTP-TEST] 2/2 Enviando prueba plantilla JUICIOS PENDIENTES...");
  try {
    await sendEmail(
      fromEmail,
      fromPass,
      [TO],
      `[PRUEBA SMTP] Juicios Evaluativos Pendientes - Ficha 1234567 - Acción Requerida`,
      {
        nombreInstructor: "Instructor de Prueba (SMTP)",
        instructorName: "Instructor de Prueba (SMTP)",
        fichaNumero: "1234567",
        RESULTS_BLOCK:
          "<strong>Ficha 1234567:</strong><br>• Resultado de aprendizaje X<br>  - Aprendiz prueba 1<br>  - Aprendiz prueba 2",
        FECHA_AUTOMÁTICA: "3 días hábiles (fecha de prueba)",
        SUPPORT_EMAILS: "tituladacat@sena.edu.co",
      },
      "./template/juiciosPendientesComplementaria.hbs",
      null,
      null
    );
    console.log("[SMTP-TEST] ✓ Correo JUICIOS enviado a", TO);
  } catch (e) {
    console.error("[SMTP-TEST] ✗ Falló JUICIOS:", e.message);
  }

  await mongoose.disconnect();
  console.log("\n[SMTP-TEST] Fin. Revisa la bandeja de", TO);
  process.exit(0);
}

main().catch((e) => {
  console.error("[SMTP-TEST] Error fatal:", e);
  process.exit(1);
});
