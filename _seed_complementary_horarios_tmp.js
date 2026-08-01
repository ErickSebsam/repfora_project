// CARGA DE HORARIOS COMPLEMENTARIOS (script de seeding).
// Crea: 1 Program + 2 ComplementaryRequest (una por instructor) + 14 Schedule
// (7 por instructor, 1 event c/u) entre 2026-06-22 (Lun) y 2026-06-26 (Vie).
// NO modifica instructor.hourswork. Escribe _rollback_complementary_horarios.json.
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

import Instructor from "./models/Instructor.js";
import ComplementaryCatalog from "./models/ComplementaryCatalog.js";
import ComplementaryRequest from "./models/ComplementaryRequest.js";
import Program from "./models/Program.js";
import Schedule from "./models/Schedule.js";

const MARY = "64a6da5a4ebecc9c58cf08a0";
const JORGE = "64a8279d904dc8a4b5e1f13c";
const ENV_MARY = "64b6ebdb6dad6b14a5f60b4f"; // AMBIENTE VIRTUAL 18
const ENV_JORGE = "64b6ef686dad6b14a5f60be1"; // AMBIENTE VIRTUAL 54
const CATALOG_ID = "6a3970367e996bfd9953856d"; // MARKETING DIGITAL
const FICHA_MARY = "COMP-2026-0001";
const FICHA_JORGE = "COMP-2026-0002";

const AM = { tstart: "08:00", tend: "12:00" };
const PM = { tstart: "14:00", tend: "18:00" };

// (fecha ISO, turno)
const MARY_SESIONES = [
  ["2026-06-22", AM], ["2026-06-23", AM], ["2026-06-24", AM],
  ["2026-06-25", AM], ["2026-06-26", AM],
  ["2026-06-22", PM], ["2026-06-23", PM],
];
const JORGE_SESIONES = [
  ["2026-06-22", PM], ["2026-06-23", PM], ["2026-06-24", PM],
  ["2026-06-25", PM], ["2026-06-26", PM],
  ["2026-06-24", AM], ["2026-06-25", AM],
];

const utc = (s) => new Date(s + "T00:00:00.000Z");
const weekday = (s) => utc(s).getUTCDay();

(async () => {
  const created = { programCreated: false, program: null, requests: [], schedules: [] };
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("=== CARGA DE HORARIOS COMPLEMENTARIOS ===\n");

    // Anti doble-ejecución
    const ya = await ComplementaryRequest.findOne({ fichaNumber: { $in: [FICHA_MARY, FICHA_JORGE] } });
    if (ya) {
      console.log("ABORTADO: ya existe una solicitud con fichaNumber COMP-2026-000X. Ejecuta el rollback antes de repetir.");
      return;
    }

    // 1. Curso del catálogo (denormalizado)
    const cat = await ComplementaryCatalog.findById(CATALOG_ID).lean();
    if (!cat) throw new Error("Curso de catálogo no encontrado");
    console.log("Curso:", cat.prfDenominacion, "| code", cat.prfCodigo, "| ver", cat.prfVersion, "| horas", cat.prfDuracionMaxima);

    // 2. Program (find or create)
    let program = await Program.findOne({ code: String(cat.prfCodigo), name: cat.prfDenominacion });
    if (!program) {
      program = await new Program({
        code: String(cat.prfCodigo),
        name: cat.prfDenominacion,
        version: String(cat.prfVersion),
      }).save();
      created.programCreated = true;
      console.log("Program CREADO:", program._id);
    } else {
      console.log("Program existente:", program._id);
    }
    created.program = program._id.toString();

    // Helper: crear solicitud por instructor
    async function crearRequest(instructorId, fichaNumber, numSol) {
      const ins = await Instructor.findById(instructorId);
      if (!ins) throw new Error("Instructor no encontrado: " + instructorId);
      const req = new ComplementaryRequest({
        catalogCourse: cat._id,
        catalogCourseName: cat.prfDenominacion,
        catalogCourseCode: String(cat.prfCodigo),
        catalogCourseVersion: String(cat.prfVersion),
        prfDuracionMaxima: cat.prfDuracionMaxima || 0,
        instructor: ins._id,
        instructores: [{
          instructor: ins._id,
          nombre: ins.name || "",
          documento: ins.numdocument || "",
          email: ins.email || ins.emailpersonal || "",
          esPrincipal: true,
        }],
        numAprendices: 20,
        municipio: "BUCARAMANGA",
        state: "PROGRAMADA",
        fichaNumber,
        numeroSolicitud: numSol,
        fechaInicio: utc("2026-06-22"),
        fechaFin: utc("2026-06-26"),
        formationDataCompleted: true,
        history: [{
          previousState: "",
          newState: "PROGRAMADA",
          changedByRole: "SCRIPT",
          observations: "Solicitud creada por script de carga de horarios",
        }],
        status: 0,
      });
      await req.save();
      created.requests.push(req._id.toString());
      console.log("ComplementaryRequest CREADA:", req._id, "| instructor:", ins.name, "| ficha:", fichaNumber);
      return { req, ins };
    }

    const { req: reqMary } = await crearRequest(MARY, FICHA_MARY, "0000002-20260622");
    const { req: reqJorge } = await crearRequest(JORGE, FICHA_JORGE, "0000003-20260622");

    // 3. Schedules
    async function crearSchedules(sesiones, instructorId, envId, requestId) {
      for (const [fecha, turno] of sesiones) {
        const sch = new Schedule({
          program: program._id,
          instructor: instructorId,
          environment: envId,
          days: [weekday(fecha)],
          fstart: utc(fecha),
          fend: utc(fecha),
          tstart: turno.tstart,
          tend: turno.tend,
          events: [utc(fecha)],
          hourswork: 4,
          scheduleType: "COMPLEMENTARIA",
          complementaryRequest: requestId,
          supporttext: "PLANEACIÓN COMPLEMENTARIA",
          observation: "PROGRAMADO DESDE SCRIPT DE CARGA",
          status: 0,
        });
        await sch.save();
        created.schedules.push(sch._id.toString());
        console.log("  Schedule:", sch._id, "| inst", instructorId.slice(-4), "|", fecha, turno.tstart, "-", turno.tend);
      }
    }

    console.log("\nHorarios Mary:");
    await crearSchedules(MARY_SESIONES, MARY, ENV_MARY, reqMary._id);
    console.log("Horarios Jorge:");
    await crearSchedules(JORGE_SESIONES, JORGE, ENV_JORGE, reqJorge._id);

    // Rollback
    fs.writeFileSync(
      path.resolve(__dirname, "_rollback_complementary_horarios.json"),
      JSON.stringify(created, null, 2)
    );

    console.log("\n=== RESUMEN ===");
    console.log("Program creados:", created.programCreated ? 1 : 0, "(_id " + created.program + ")");
    console.log("ComplementaryRequest creadas:", created.requests.length);
    console.log("Schedules creados:", created.schedules.length);
    console.log("Rollback guardado en: repfora/_rollback_complementary_horarios.json");
  } catch (e) {
    console.error("ERROR:", e.message);
    if (e.errors) console.error(JSON.stringify(Object.keys(e.errors), null, 2));
    console.error("\nIDs creados antes del fallo (para limpieza manual):", JSON.stringify(created));
  } finally {
    await mongoose.disconnect();
  }
})();
