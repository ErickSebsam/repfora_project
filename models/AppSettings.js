import mongoose from 'mongoose';

const { Schema } = mongoose;

const EmailTemplateSchema = new Schema({
  subject: { type: String, default: 'Juicios Evaluativos Pendientes - Ficha {fichaNumero} - Acción Requerida' },
  content: { type: String, default: 'Estimado(a) {nombreInstructor}:\nReciba un cordial saludo.\nTeniendo en cuenta la revisión de Juicios Evaluativos de la ficha {fichaNumero}, se encuentra por evaluar el(los) siguiente(s) resultado(s):\n{RESULTS_BLOCK}\n\nConsiderando los compromisos funcionales y/u obligaciones contractuales:\n\n7. Emitir juicio valorativo sobre el nivel de cumplimiento de los resultados de aprendizajes de las competencias del programa, adquiridos por los aprendices en el desarrollo de su formación, aplicando los procedimientos, plazos y herramientas tecnológicas que la entidad defina.\n9. Registrar, verificar y hacer seguimiento oportuno en el sistema de información que la entidad defina para la Gestión de la Formación Profesional Integral mediante las siguientes actividades:\na). Verificando que la totalidad de los aprendices seleccionados y matriculados queden en ese estado.\nb). Registrando juicios evaluativos del reconocimiento de aprendizajes previos, los juicios evaluativos, rutas de aprendizaje, para los beneficiarios nuevos, reintegrados o trasladados. c). Comunicando al Coordinador Académico oportunamente anomalías, inconsistencias, novedades de aprendices y hallazgos en el registro de la información.\n33. Atender oportunamente los requerimientos que haga el supervisor del contrato y presentar informes mensuales de la ejecución del contrato.\n34. Las demás necesarias para el cabal cumplimiento del objeto contractual.\n\nDe forma atenta y respetuosa, le solicito realizar la emisión de los correspondientes juicios evaluativos pendientes, verificando que cumplan con los criterios de calidad y pertinencia requeridos.\n\n⏱️ Plazo máximo de registro:3 días hábiles (vencimiento: {FECHA_AUTOMÁTICA})\n\nLe agradecería confirmar mediante correo electrónico una vez haya realizado esta actividad.\nPara reportar dificultades técnicas o situaciones particulares del aprendiz:\n📧 {SUPPORT_EMAILS}\n\nNOTA: Este mensaje forma parte del registro de seguimiento académico/supervisión contractual institucional.' }
}, { _id: false });

const AppSettingsSchema = new Schema({
  emailEnabled: { type: Boolean, default: true },
  cronEnabled: { type: Boolean, default: true },
  emailTemplate: { type: EmailTemplateSchema, default: () => ({}) },
  lastJudgmentAuditDate: { type: Date, default: null },
  catalogLastUploadDate: { type: Date, default: null }
}, {
  timestamps: true,
  collection: 'appsettings'  
});

// Solo debe existir un registro
AppSettingsSchema.index({}, { unique: true });

export default mongoose.models.AppSettings || mongoose.model('AppSettings', AppSettingsSchema);

// Valores por defecto para restaurar (usados en controller)
export const EMAIL_TEMPLATE_DEFAULTS = {
  subject: 'Juicios Evaluativos Pendientes - Ficha {fichaNumero} - Acción Requerida',
  content: 'Estimado(a) {nombreInstructor}:\nReciba un cordial saludo.\nTeniendo en cuenta la revisión de Juicios Evaluativos de la ficha {fichaNumero}, se encuentra por evaluar el(los) siguiente(s) resultado(s):\n{RESULTS_BLOCK}\n\nConsiderando los compromisos funcionales y/u obligaciones contractuales:\n\n7. Emitir juicio valorativo sobre el nivel de cumplimiento de los resultados de aprendizajes de las competencias del programa, adquiridos por los aprendices en el desarrollo de su formación, aplicando los procedimientos, plazos y herramientas tecnológicas que la entidad defina.\n9. Registrar, verificar y hacer seguimiento oportuno en el sistema de información que la entidad defina para la Gestión de la Formación Profesional Integral mediante las siguientes actividades:\na). Verificando que la totalidad de los aprendices seleccionados y matriculados queden en ese estado.\nb). Registrando juicios evaluativos del reconocimiento de aprendizajes previos, los juicios evaluativos, rutas de aprendizaje, para los beneficiarios nuevos, reintegrados o trasladados. c). Comunicando al Coordinador Académico oportunamente anomalías, inconsistencias, novedades de aprendices y hallazgos en el registro de la información.\n33. Atender oportunamente los requerimientos que haga el supervisor del contrato y presentar informes mensuales de la ejecución del contrato.\n34. Las demás necesarias para el cabal cumplimiento del objeto contractual.\n\nDe forma atenta y respetuosa, le solicito realizar la emisión de los correspondientes juicios evaluativos pendientes, verificando que cumplan con los criterios de calidad y pertinencia requeridos.\n\n⏱️ Plazo máximo de registro:3 días hábiles (vencimiento: {FECHA_AUTOMÁTICA})\n\nLe agradecería confirmar mediante correo electrónico una vez haya realizado esta actividad.\nPara reportar dificultades técnicas o situaciones particulares del aprendiz:\n📧 {SUPPORT_EMAILS}\n\nNOTA: Este mensaje forma parte del registro de seguimiento académico/supervisión contractual institucional.'
};
