import sendEmail from "../utils/emails/sendEmail.js";
import Instructor from "../models/Instructor.js";

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
    "./utils/emails/template/solicitudAprobada.hbs"
  );
}

export async function notifyRejection(request, observations) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Solicitud Rechazada - ${request.catalogCourseName}`;
  const payload = {
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
    "./utils/emails/template/solicitudRechazada.hbs"
  );
}

const COMPLEMENTARY_COORDINATOR_EMAIL = "overgarar@sena.edu.co";

export async function notifyNewRequest(request, instructorName) {
  const subject = `Nueva Solicitud de Complementaria - ${request.catalogCourseName}`;
  const payload = {
    coordinatorName: "OSCAR WILLIAM VERGARA ROMERO",
    instructorName: instructorName || "Instructor",
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    requestDate: formatDate(new Date()),
    municipio: request.municipio || "",
    numAprendices: request.numAprendices || 0,
  };
  await sendComplementaryEmail(
    [COMPLEMENTARY_COORDINATOR_EMAIL],
    subject,
    payload,
    "./utils/emails/template/nuevaSolicitudComplementaria.hbs"
  );
}

export async function notifyFichaAssigned(request) {
  const emails = await getInstructorEmails(request.instructor);
  const subject = `Ficha Asignada - ${request.fichaNumber} - ${request.catalogCourseName}`;
  const payload = {
    instructorName: request.instructorName || "Instructor",
    fichaNumber: request.fichaNumber,
    courseName: request.catalogCourseName,
    courseCode: request.catalogCourseCode,
    courseVersion: request.catalogCourseVersion,
    fechaInicio: formatDate(request.fechaInicio),
    fechaFin: formatDate(request.fechaFin),
    fechaInscripcion: formatDate(request.fechaInscripcion),
    fechaMatriculaInicio: formatDate(request.fechaMatriculaInicio),
    fechaMatriculaFin: formatDate(request.fechaMatriculaFin),
  };
  await sendComplementaryEmail(
    emails,
    subject,
    payload,
    "./utils/emails/template/fichaComplementariaAsignada.hbs"
  );
}
