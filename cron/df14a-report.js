/**
 * cron/df14a-report.js
 *
 * Ejecuta el reporte DF-14A de SOFIA Plus (matriculados detallados de "curso especial")
 * de forma automática: descarga el reporte vía Playwright (SofiaDetailedEnrollmentClient),
 * separa fichas sin ruta de aprendizaje y fichas con juicios pendientes, y notifica por
 * correo a los instructores correspondientes.
 *
 * Se invoca desde dos lugares:
 *   - El cron mensual (services/cronService.js → startDf14aCron, día 1 a las 3 AM hora Colombia).
 *   - El endpoint de prueba (controller/complementaryAudit.controller.js → runDf14aTest),
 *     que dispara el mismo flujo manualmente para validación/demostración.
 *
 * Guard de concurrencia (df14aRunning): evita ejecuciones solapadas del DF-14A, que son
 * costosas (Playwright + scraping) y podrían duplicar notificaciones a instructores.
 *
 * Creado: 2026-06-15
 * Impacto: Solo lectura de SOFIA Plus + envío de correos. No modifica documentos de la BD.
 * Los archivos temporales (ZIP + archivo extraído) y el proceso del navegador se limpian
 * dentro del propio startDetailedEnrollmentSession (try/finally + close()).
 */
import { SofiaDetailedEnrollmentClient } from "../clients/sofiaDetailedEnrollmentClient.js";
import Fiche from "../models/Fiche.js";
import Df14aReportHistory from "../models/Df14aReportHistory.js";

// Guard de concurrencia compartido entre el cron y el endpoint de prueba.
let df14aRunning = false;

/**
 * Ejecuta el reporte DF-14A completo (login + descarga + procesamiento + notificaciones).
 *
 * @param {Object} [options] - Opciones de ejecución.
 * @param {string} [options.source='cron'] - Origen de la ejecución ('cron' | 'endpoint'),
 *   únicamente para trazabilidad en logs.
 * @param {string} [options.triggeredBy='System (Cron)'] - Email del ejecutor.
 * @returns {Promise<Object>} Resultado de startDetailedEnrollmentSession
 *   ({ zipPath, extractedPath, content, sinRuta, sinJuicios, notificationRutas, notificationJuicios })
 *   o { skipped: true, reason: 'already_running' } si ya hay una ejecución en curso.
 * @throws {Error} Si faltan credenciales SOFIA (SOFIA_USER/SOFIA_PASS) o falla el scraping.
 */
export async function runDf14aReport({ source = "cron", triggeredBy = "System (Cron)" } = {}) {
  if (df14aRunning) {
    console.warn(`[DF14A] Ya hay una ejecución en curso (source=${source}), se omite.`);
    return { skipped: true, reason: "already_running" };
  }

  // Validar credenciales ANTES de instanciar el cliente: evita ~7 minutos de reintentos
  // inútiles (withRetry: 3 reintentos × backoff 60/120/240s) si SOFIA_USER/SOFIA_PASS faltan.
  if (!process.env.SOFIA_USER || !process.env.SOFIA_PASS) {
    throw new Error("Faltan credenciales SOFIA (SOFIA_USER/SOFIA_PASS) en variables de entorno.");
  }

  df14aRunning = true;
  console.log(`[DF14A] Iniciando ejecución (source=${source})...`);

  try {
    // El cliente lee HEADLESS, SOFIA_URL, OUTPUTDIR, etc. del env en su constructor.
    // La limpieza de archivos (ZIP + extraído) y el cierre del navegador se garantizan
    // dentro de startDetailedEnrollmentSession (try/finally + close()).
    const client = new SofiaDetailedEnrollmentClient();
    const result = await client.startDetailedEnrollmentSession("Gestión Desarrollo Curricular", { notify: true });
    
    console.log(
      `[DF14A] Ejecución finalizada. sinRuta=${result.sinRuta?.length || 0}, ` +
        `sinJuicios=${result.sinJuicios?.length || 0}`
    );

    // Resolver instructores y cursos para el historial
    const resolvedSinRuta = [];
    const resolvedSinJuicios = [];
    const fichasNoEncontradas = [];

    if (result.sinRuta) {
      for (const record of result.sinRuta) {
        const fiche = await Fiche.findOne({ number: record.fichaNumber, status: 0 })
          .populate("owner", "name email")
          .populate("program", "name");
        if (fiche && fiche.owner) {
          resolvedSinRuta.push({
            fichaNumber: record.fichaNumber,
            courseName: fiche.program?.name || "Programa complementario",
            instructorName: fiche.owner.name || "Instructor",
            instructorEmail: fiche.owner.email,
            pendientes: record.enTransito || 0
          });
        } else {
          fichasNoEncontradas.push({
            fichaNumber: record.fichaNumber,
            enTransito: record.enTransito || 0,
            enFormacion: 0
          });
        }
      }
    }

    if (result.sinJuicios) {
      for (const record of result.sinJuicios) {
        const fiche = await Fiche.findOne({ number: record.fichaNumber, status: 0 })
          .populate("owner", "name email")
          .populate("program", "name");
        if (fiche && fiche.owner) {
          resolvedSinJuicios.push({
            fichaNumber: record.fichaNumber,
            courseName: fiche.program?.name || "Programa complementario",
            instructorName: fiche.owner.name || "Instructor",
            instructorEmail: fiche.owner.email,
            pendientes: record.enFormacion || 0
          });
        } else {
          const existing = fichasNoEncontradas.find(f => f.fichaNumber === record.fichaNumber);
          if (existing) {
            existing.enFormacion = record.enFormacion || 0;
          } else {
            fichasNoEncontradas.push({
              fichaNumber: record.fichaNumber,
              enTransito: 0,
              enFormacion: record.enFormacion || 0
            });
          }
        }
      }
    }

    // Registrar historial en la BD
    const historyType = source === "cron" ? "cron_scraper" : "manual_scraper";
    await Df14aReportHistory.create({
      type: historyType,
      triggeredBy,
      totalProcessed: result.totalProcessed || 0,
      fichesNotFound: fichasNoEncontradas.length,
      totalSinRuta: resolvedSinRuta.length,
      totalSinJuicios: resolvedSinJuicios.length,
      sinRuta: resolvedSinRuta,
      sinJuicios: resolvedSinJuicios,
      fichasNoEncontradas,
      notificacionRutas: result.notificationRutas ? {
        enviados: result.notificationRutas.sent || 0,
        fallidos: result.notificationRutas.failed || 0,
        noEncontrados: result.notificationRutas.notFound?.length || 0
      } : { enviados: 0, fallidos: 0, noEncontrados: 0 },
      notificacionJuicios: result.notificationJuicios ? {
        enviados: result.notificationJuicios.sent || 0,
        fallidos: result.notificationJuicios.failed || 0,
        noEncontrados: result.notificationJuicios.notFound?.length || 0
      } : { enviados: 0, fallidos: 0, noEncontrados: 0 },
      summary: `Matriculados detallados procesados automáticamente. ${resolvedSinRuta.length} sin ruta, ${resolvedSinJuicios.length} con juicios pendientes.`
    });

    return { skipped: false, source, ...result };
  } catch (error) {
    console.error(`[DF14A] Error en la ejecución (source=${source}):`, error.message);
    throw error;
  } finally {
    df14aRunning = false;
  }
}

export default runDf14aReport;
