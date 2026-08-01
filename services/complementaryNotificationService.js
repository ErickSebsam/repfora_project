import sendEmail from "../utils/emails/sendEmail.js";
import Instructor from "../models/Instructor.js";
import { complementaryHelper } from "../helpers/complementary.helper.js";

const FROM_EMAIL = () => process.env.FROM_EMAIL;
const FROM_PASS = () => process.env.SECURY_EMAIL;

function formatDate(date) {
  if (!date) return "Pendiente";
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getInstructorEmails(instructorId) {
  const instructor = await Instructor.findById(instructorId);
  if (!instructor) return [];
  return [instructor.email, instructor.emailpersonal].filter(Boolean);
}

async function sendComplementaryEmail(emails, subject, payload, template) {
  if (!emails || emails.length === 0) return;
  const from = FROM_EMAIL();
  const pass = FROM_PASS();
  if (!from || !pass) {
    console.log("[COMPLEMENTARY-EMAIL] Credenciales de email no configuradas");
    return;
  }
  for (const email of emails) {
    try {
      await sendEmail(from, pass, [email], subject, payload, template);
    } catch (err) {
      console.log(`[COMPLEMENTARY-EMAIL] Error enviando a ${email}:`, err.message);
    }
  }
}

export async function notifyApproval(request) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Solicitud Aprobada - ${request.catalogCourseName}`;
  const payload = {
    numeroSolicitud: request.numeroSolicitud || "",
    instructorName: request.instructorName || "Instructor",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    approvalDate: formatDate(new Date()),
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/solicitudAprobada.hbs"
  );
}

export async function notifyRejection(request, observations) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Solicitud Rechazada - ${request.catalogCourseName}`;
  const payload = {
    numeroSolicitud: request.numeroSolicitud || "",
    instructorName: request.instructorName || "Instructor",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    rejectionDate: formatDate(new Date()),
    observations: observations || "Sin observaciones",
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/solicitudRechazada.hbs"
  );
}

export async function notifyNewRequest(request, instructorName) {
  const coordinator = await complementaryHelper.findComplementaryCoordinator();
  const programmers = await complementaryHelper.findComplementaryProgrammers();

  if (!coordinator && programmers.length === 0) {
    console.log("[COMPLEMENTARY-EMAIL] Ni coordinador ni programadores de complementarias encontrados en BD");
    return;
  }

  const recipientEmails = [
    coordinator?.email,
    ...programmers.map((p) => p.email),
  ].filter(Boolean);

  const subject = `Nueva Solicitud de Complementaria - ${request.catalogCourseName}`;
  const payload = {
    coordinatorName: coordinator?.name || "Coordinador",
    instructorName: instructorName || "Instructor",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    requestDate: formatDate(new Date()),
    municipio: request.municipio || "",
    numAprendices: request.numAprendices || 0,
  };
  await sendComplementaryEmail(
    recipientEmails,
    subject,
    payload,
    "./template/nuevaSolicitudComplementaria.hbs"
  );
}

export async function notifyFichaAssigned(request) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Ficha Asignada - ${request.numeroSolicitud} - ${request.catalogCourseName}`;
  const payload = {
    instructorName: request.instructorName || "Instructor",
    numeroSolicitud: request.numeroSolicitud || "",
    fichaCaracterizacion: request.fichaCaracterizacion || "",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    fechaInicio: formatDate(request.fechaInicio),
    fechaFin: formatDate(request.fechaFin),
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/fichaComplementariaAsignada.hbs"
  );
}

export async function notifyCancellation(request, previousState, observations) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Ficha Cancelada - ${request.fichaNumber || request.numeroSolicitud} - ${request.catalogCourseName}`;
  const payload = {
    numeroSolicitud: request.numeroSolicitud || "",
    instructorName: request.instructorName || "Instructor",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    fichaNumber: request.fichaNumber || "",
    previousState: previousState || "",
    cancellationDate: formatDate(new Date()),
    observations: observations || "",
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/fichaComplementariaCancelada.hbs"
  );
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export async function notifyResubmit(request, instructorName) {
  const coordinator = await complementaryHelper.findComplementaryCoordinator();
  const programmers = await complementaryHelper.findComplementaryProgrammers();

  if (!coordinator && programmers.length === 0) {
    console.log("[COMPLEMENTARY-EMAIL] Ni coordinador ni programadores de complementarias encontrados para notificar resubmit");
    return;
  }

  const recipientEmails = [
    coordinator?.email,
    ...programmers.map((p) => p.email),
  ].filter(Boolean);

  const subject = `Solicitud Modificada y Reenviada - ${request.catalogCourseName}`;
  const payload = {
    numeroSolicitud: request.numeroSolicitud || "",
    instructorName: instructorName || "Instructor",
    resubmitDate: formatDate(new Date()),
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    prfDuracionMaxima: request.prfDuracionMaxima || 0,
    tipoPrograma: request.tipoPrograma || "",
    tipoPoblacion: request.tipoPoblacion || "",
    fechaInicio: formatDate(request.fechaInicio),
    fechaFin: formatDate(request.fechaFin),
    fechaInscripcion: formatDate(request.fechaInscripcion),
    fechaMatriculaInicio: formatDate(request.fechaMatriculaInicio),
    fechaMatriculaFin: formatDate(request.fechaMatriculaFin),
    municipio: request.municipio || "",
    vereda: request.vereda || "",
    direccion: request.direccion || "",
    ambienteNombre: request.ambienteNombre || "",
    ambienteDireccion: request.ambienteDireccion || "",
    nombreEmpresa: request.nombreEmpresa || "",
    nitEmpresa: request.nitEmpresa || "",
    contactoEmpresa: request.contactoEmpresa || "",
    telefonoEmpresa: request.telefonoEmpresa || "",
    numAprendices: request.numAprendices || 0,
    requisitosIngreso: request.requisitosIngreso || "",
    recursosNecesarios: request.recursosNecesarios || "",
    proyectoAsociado: request.proyectoAsociado || "",
    competencias: Array.isArray(request.competencies) && request.competencies.length > 0
      ? request.competencies.map((c) => {
          if (typeof c === "string") {
            return { nombre: c, codigo: "", horas: 0, criterios: [] };
          }
          return {
            nombre: c.nombre || "",
            codigo: c.codigo || "",
            horas: c.horas || 0,
            criterios: Array.isArray(c.criterios) ? c.criterios : [],
          };
        })
      : null,
    resultados: Array.isArray(request.outcomes) && request.outcomes.length > 0 ? request.outcomes : null,
    supervisorNombre: request.supervisorNombre || "",
  };
  await sendComplementaryEmail(
    recipientEmails,
    subject,
    payload,
    "./template/solicitudResubmit.hbs"
  );
}

export async function notifyScheduled(request, schedule) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Complementaria Programada - ${request.numeroSolicitud} - ${request.catalogCourseName}`;
  const payload = {
    instructorName: request.instructorName || "Instructor",
    numeroSolicitud: request.numeroSolicitud || "",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    fechaInicio: formatDate(schedule.fstart),
    fechaFin: formatDate(schedule.fend),
    horaInicio: schedule.tstart || "",
    horaFin: schedule.tend || "",
    dias: Array.isArray(schedule.days) ? schedule.days.map((d) => DIAS_SEMANA[d] || d).join(", ") : "",
    totalHoras: schedule.hourswork || 0,
    ambienteNombre: schedule.environment?.name || request.ambienteNombre || "",
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/complementariaProgramada.hbs"
  );
}

export async function notifyExecution(request) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Ficha en Ejecución - ${request.fichaNumber || request.numeroSolicitud} - ${request.catalogCourseName}`;
  const payload = {
    instructorName: request.instructorName || "Instructor",
    fichaNumber: request.fichaNumber || "",
    numeroSolicitud: request.numeroSolicitud || "",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    fechaInicio: formatDate(request.fechaInicio),
    fechaFin: formatDate(request.fechaFin),
    executionDate: formatDate(new Date()),
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/fichaEnEjecucion.hbs"
  );
}

// Notifica al coordinador y programadores cuando un instructor solicita ampliacion de su ficha.
export async function notifyExtensionRequest(request, instructorName) {
  const coordinator = await complementaryHelper.findComplementaryCoordinator();
  const programmers = await complementaryHelper.findComplementaryProgrammers();

  if (!coordinator && programmers.length === 0) {
    console.log("[COMPLEMENTARY-EMAIL] Ni coordinador ni programadores encontrados para notificar ampliacion");
    return;
  }

  const recipientEmails = [
    coordinator?.email,
    ...programmers.map((p) => p.email),
  ].filter(Boolean);

  const subject = `Solicitud de Ampliacion - ${request.fichaNumber || request.numeroSolicitud} - ${request.catalogCourseName}`;
  const payload = {
    coordinatorName: coordinator?.name || "Coordinador",
    instructorName: instructorName || "Instructor",
    fichaNumber: request.fichaNumber || "",
    numeroSolicitud: request.numeroSolicitud || "",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    requestDate: formatDate(new Date()),
    fechaFinActual: formatDate(request.fechaFin),
  };
  await sendComplementaryEmail(
    recipientEmails,
    subject,
    payload,
    "./template/ampliacionSolicitada.hbs"
  );
}

// Notifica al instructor cuando el coordinador/admin resuelve su solicitud de ampliacion.
// Si fue aprobada, le indica que debe reprogramar los horarios.
// Si fue rechazada, le muestra el motivo del rechazo.
export async function notifyExtensionResolved(request, extension) {
  const emails = await getInstructorEmails(request.instructor);
  const aprobada = extension.status === "APROBADA";
  const subject = aprobada
    ? `Ampliacion Aprobada - ${request.fichaNumber || request.numeroSolicitud} - ${request.catalogCourseName}`
    : `Ampliacion Rechazada - ${request.fichaNumber || request.numeroSolicitud} - ${request.catalogCourseName}`;
  const payload = {
    aprobada,
    fichaNumber: request.fichaNumber || "",
    numeroSolicitud: request.numeroSolicitud || "",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    resolutionDate: formatDate(extension.resolvedDate || new Date()),
    observations: extension.resolvedObservations || "",
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./template/ampliacionResuelta.hbs"
  );
}
