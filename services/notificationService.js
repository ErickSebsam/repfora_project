import sendEmail from '../utils/emails/sendEmail.js';
import * as fs from 'fs';
import path from 'path';
import url from 'url';
import AppSettings, { EMAIL_TEMPLATE_DEFAULTS } from '../models/AppSettings.js';
import { generateResumenSedeXLSX } from './excelExportService.js';

// Configuración de correo desde variables de entorno
let emailEnabled = process.env.EMAIL_ENABLED === 'true';
const DEFAULT_EMAIL_USER = process.env.FROM_EMAIL;
const DEFAULT_EMAIL_PASS = process.env.SECURY_EMAIL;
const USE_TEST_RECIPIENT = process.env.USE_TEST_RECIPIENT === 'true';
const TEST_MAIL_RECIPIENT = process.env.TEST_MAIL_RECIPIENT;

export async function initEmailSettings() {
  try {
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create({ emailEnabled });
      console.log(`[EMAIL] Configuración inicial guardada en BD (emailEnabled=${emailEnabled})`);
    } else {
      emailEnabled = settings.emailEnabled;
      console.log(`[EMAIL] Estado cargado desde BD (emailEnabled=${emailEnabled})`);
    }
  } catch (error) {
    console.error('[EMAIL] Error cargando configuración desde BD, usando env var:', error.message);
  }
}

export function getEmailStatus() {
  return { enabled: emailEnabled };
}

export async function setEmailEnabled(value) {
  emailEnabled = value;
  try {
    await AppSettings.findOneAndUpdate({}, { emailEnabled: value }, { upsert: true });
  } catch (error) {
    console.error('[EMAIL] Error guardando configuración en BD:', error.message);
  }
}

// BCC (copia oculta) - preparado para uso futuro
const BCC_EMAILS = process.env.BCC_EMAILS ? process.env.BCC_EMAILS.split(',').map(e => e.trim()) : [];

/**
 * Calcula una fecha sumando N días hábiles (lunes a viernes) a partir de hoy
 */
function addBusinessDays(days) {
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Genera el HTML del correo para instructores
 * fichaItems: [{ ficheNumber, items }]
 */
function generateInstructorEmailHTML({ instructorName, fichaItems, template, supportEmails = '' }) {
  const t = { ...EMAIL_TEMPLATE_DEFAULTS, ...template };

  // Generar bloque de resultados agrupado por ficha
  const fichasBlock = fichaItems.map(({ ficheNumber, items }) => {
    const outcomesList = items.map(item => {
      const missingCount = item.missingLearners?.length || 0;
      const totalCount = item.totalLearners || 0;
      const isTotalMissing = item.isTotalMissing || (totalCount > 0 && missingCount >= totalCount);

      if (isTotalMissing) {
        return `• ${item.outcomeText}`;
      } else {
        const learnersList = item.missingLearners
          .map(l => `  - ${l.name}`)
          .join('<br>');
        return `• ${item.outcomeText}<br><span style="color: #666; font-size: 14px;">Aprendices faltantes:<br>${learnersList}</span>`;
      }
    }).join('<br><br>');

    return `<strong style="color: #0056b3;">Ficha ${ficheNumber}:</strong><br>${outcomesList}`;
  }).join('<br><br><hr style="border: none; border-top: 1px solid #eee;"><br>');

  const ficheNumbers = fichaItems.map(f => f.ficheNumber).join(', ');
  const isMultiple = fichaItems.length > 1;
  const deadlineDate = addBusinessDays(t.deadlineDays || 3);

  // Reemplazar variables en el contenido (convertir saltos de línea a <br>)
  let content = t.content
    .replace(/\{nombreInstructor\}/gi, instructorName)
    .replace(/\{instructorName\}/gi, instructorName);

  // Ajustar singular/plural según cantidad de fichas antes del reemplazo genérico
  if (isMultiple) {
    content = content.replace(
      /de la ficha\s+\{fichaNumero\},?\s+se encuentra/gi,
      `de las fichas ${ficheNumbers}, se encuentran`
    );
  }

  content = content
    .replace(/\{fichaNumero\}/gi, ficheNumbers)
    .replace(/\{RESULTS_BLOCK\}/gi, fichasBlock)
    .replace(/\{FECHA_AUTOMÁTICA\}/gi, deadlineDate)
    .replace(/\{SUPPORT_EMAILS\}/gi, supportEmails)
    .replace(/\n/g, '<br>');

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
${content}
    </div>
  `;
}

/**
 * Plantilla base para handlebars (misma estructura que baseNew.hbs)
 */
function getBaseTemplate() {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Correo REPFORA</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; padding: 20px;">
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <h1 style="color: #39A900; margin: 0;">REPFORA</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            {{{html}}}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Envía correo de reporte de calificaciones pendientes a un instructor
 * fichaItems: [{ ficheNumber, items }] — una entrada por ficha con sus resultados pendientes
 */
export async function sendMissingGradesReport({ instructor, fichaItems, coordination }) {
  // Validaciones
  if (!emailEnabled) {
    console.log('[EMAIL] Envío de correos deshabilitado (emailEnabled=false)');
    return { success: false, error: 'Email disabled' };
  }

  if (!instructor?.email && !instructor?.emailpersonal) {
    console.warn('[EMAIL] Instructor sin email, omitiendo envío');
    return { success: false, error: 'No email provided' };
  }

  if (!fichaItems?.length) {
    return { success: false, error: 'No pending items' };
  }

  // Usar credenciales de la coordinación solo si AMBAS están configuradas;
  // si falta una, caer al par por defecto del env para evitar mezcla de credenciales
  const hasCoordCredentials = !!(coordination?.email && coordination?.passapp);
  const fromEmail = hasCoordCredentials ? coordination.email : DEFAULT_EMAIL_USER;
  const fromPass  = hasCoordCredentials ? coordination.passapp : DEFAULT_EMAIL_PASS;

  if (!fromEmail || !fromPass) {
    console.error('[EMAIL] Sin credenciales de correo (ni coordinación ni FROM_EMAIL/SECURY_EMAIL en .env), omitiendo envío');
    return { success: false, error: 'No email credentials' };
  }

  if (!hasCoordCredentials) {
    console.warn(`[EMAIL] Coordinación "${coordination?.name || 'desconocida'}" sin email/passapp completos — usando cuenta por defecto del env`);
  }

  try {
    // Cargar plantilla desde BD
    let template = EMAIL_TEMPLATE_DEFAULTS;
    try {
      const settings = await AppSettings.findOne().lean();
      if (settings?.emailTemplate) {
        template = { ...EMAIL_TEMPLATE_DEFAULTS, ...settings.emailTemplate };
      }
    } catch (err) {
      console.warn('[EMAIL] No se pudo cargar plantilla desde BD, usando defaults:', err.message);
    }

    const htmlContent = generateInstructorEmailHTML({
      instructorName: instructor.name,
      fichaItems,
      template,
      supportEmails: coordination?.emailsupervisor || 'tituladacat@sena.edu.co; nduartep@sena.edu.co'
    });

    // Determinar destinatarios (test mode vs production)
    let toEmails = [];
    if (USE_TEST_RECIPIENT) {
      toEmails = [TEST_MAIL_RECIPIENT];
    } else {
      if (instructor.email) toEmails.push(instructor.email);
      if (instructor.emailpersonal) toEmails.push(instructor.emailpersonal);
    }

    // Quitar el placeholder de ficha del asunto — ahora el correo cubre todas las fichas
    const subject = template.subject
      .replace(/\s*-?\s*ficha\s+\{fichaNumero\}/gi, '')
      .replace(/\{fichaNumero\}/gi, '')
      .replace(/\s+-\s*$/, '')
      .trim();

    await sendEmail(
      fromEmail,
      fromPass,
      toEmails,
      subject,
      { html: htmlContent },
      "./template/baseEmail.hbs",
      null
    );

    const ficheNumbers = fichaItems.map(f => f.ficheNumber).join(', ');
    console.log(`[EMAIL] ✓ Correo enviado a ${toEmails.join(', ')} (${instructor.name}) fichas [${ficheNumbers}] [desde: ${fromEmail}]`);
    if (USE_TEST_RECIPIENT) {
      console.log(`[EMAIL] (TEST MODE: Redirigido a ${TEST_MAIL_RECIPIENT})`);
    }

    return { success: true, error: null };

  } catch (error) {
    const emails = [instructor.email, instructor.emailpersonal].filter(Boolean).join(', ');
    console.error(`[EMAIL] ✗ Error enviando a ${emails}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envía múltiples correos en lote con resumen de resultados
 */
export async function sendBatchEmails(emailsToSend) {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const emailData of emailsToSend) {
    const fichaItems = emailData.fichaItems
      || [{ ficheNumber: emailData.ficheNumber, items: emailData.pendingItems }];
    const result = await sendMissingGradesReport({
      instructor: emailData.instructor,
      fichaItems,
      coordination: emailData.coordination
    });
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({
        instructor: emailData.instructor?.email,
        fiche: emailData.ficheNumber,
        error: result.error
      });
    }
  }

  return results;
}

/**
 * Envía un resumen al coordinador con las fichas que tuvieron problemas
 * @param {Object} coordination - La coordinación con email y supervisoremail
 * @param {Map} fichas - Map de fichas { ficheNumber -> { instructors: [], outcomes: [] } }
 * @param {Array} fichesSummary - Resumen de fichas para generar la hoja de cálculo (opcional)
 */
export async function sendCoordinatorReport(coordination, fichas, fichesSummary = [], pendientes = [], vencidos = []) {
  // Validaciones
  if (!emailEnabled) {
    console.log('[EMAIL] Envío de correos deshabilitado (emailEnabled=false)');
    return { success: false, error: 'Email disabled' };
  }

  // En modo test se puede enviar aunque el coordinador no tenga email (va a TEST_MAIL_RECIPIENT)
  if (!USE_TEST_RECIPIENT && !coordination?.coordinator?.email) {
    console.warn(`[EMAIL] Coordinación "${coordination?.name}" sin correo de coordinador, omitiendo envío`);
    return { success: false, error: 'No email provided' };
  }

  if (!fichas || fichas.size === 0) {
    console.log('[EMAIL] No hay fichas para reportar al coordinador');
    return { success: true, error: null };
  }

  // Usar credenciales de la coordinación solo si AMBAS están configuradas
  const hasCoordCredentials = !!(coordination.email && coordination.passapp);
  const fromEmail = hasCoordCredentials ? coordination.email : DEFAULT_EMAIL_USER;
  const fromPass  = hasCoordCredentials ? coordination.passapp : DEFAULT_EMAIL_PASS;

  if (!fromEmail || !fromPass) {
    console.error('[EMAIL] Sin credenciales de correo (ni coordinación ni FROM_EMAIL/SECURY_EMAIL en .env), omitiendo envío al coordinador');
    return { success: false, error: 'No email credentials' };
  }

  if (!hasCoordCredentials) {
    console.warn(`[EMAIL] Coordinación "${coordination.name}" sin email/passapp completos — usando cuenta por defecto del env para el reporte al coordinador`);
  }

  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0056b3;">Resumen de Juicios Evaluativos Pendientes</h2>
        <p>Estimado(a) Coordinador(a),</p>
        <p>A continuación se adjunta el resumen de fichas con juicios evaluativos pendientes en su coordinación.</p>
        <p style="margin-top: 20px;">Por favor revise el estado de estas fichas y gestione el seguimiento correspondiente.</p>
        <p style="color: #666; font-size: 12px;">Este mensaje fue generado automáticamente por el sistema REPFORA.</p>
      </div>
    `;

    // Generar adjunto Excel si hay fichesSummary disponible
    const attachments = [];
    if (fichesSummary.length > 0) {
      try {
        const xlsxBuffer = await generateResumenSedeXLSX({
          fichesSummary,
          executionDate: new Date(),
          runNumber: 1,
          pendientes,
          vencidos,
        });
        const fechaFile = new Date().toISOString().split('T')[0];
        const safeName = (coordination.name || 'coordinacion').replace(/[/\\?%*:|"<>]/g, '_').trim();
        attachments.push({
          filename: `resumen-snc-${safeName}-${fechaFile}.xlsx`,
          content: xlsxBuffer
        });
        console.log(`[EMAIL] Hoja de cálculo generada para ${coordination.name} (${fichesSummary.length} fichas)`);
      } catch (xlsxError) {
        console.error(`[EMAIL] Error generando Excel para coordinador:`, xlsxError.message);
      }
    }

    let toEmails;
    let ccEmails = [];
    if (USE_TEST_RECIPIENT) {
      toEmails = [TEST_MAIL_RECIPIENT];
      console.log(`[EMAIL] (TEST MODE: Reporte coordinador redirigido a ${TEST_MAIL_RECIPIENT})`);
    } else {
      toEmails = [coordination.coordinator.email];
      ccEmails = coordination.emailsupervisor ? coordination.emailsupervisor.split(',').map(e => e.trim()) : [];
    }

    await sendEmail(
      fromEmail,
      fromPass,
      toEmails,
      `Resumen de Juicios Evaluativos Pendientes - ${coordination.name}`,
      { html: htmlContent },
      "./template/baseEmail.hbs",
      ccEmails.length > 0 ? ccEmails : null,
      attachments.length > 0 ? attachments : null
    );

    console.log(`[EMAIL] ✓ Correo enviado a coordinador ${coordination.name} (${toEmails.join(', ')})`);
    if (ccEmails.length > 0) {
      console.log(`[EMAIL] CC: ${ccEmails.join(', ')}`);
    }

    return { success: true, error: null };

  } catch (error) {
    console.error(`[EMAIL] ✗ Error enviando a coordinador ${coordination.name}:`, error.message);
    return { success: false, error: error.message };
  }
}
