import { dateFormater } from "../utils/functions/dates.js";
import Schedule from "../models/Schedule.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";
import ComplementaryCatalog from "../models/ComplementaryCatalog.js";
import Instructor from "../models/Instructor.js";

const complementaryScheduleHelper = {};

complementaryScheduleHelper.validateRequestProgrammable = async (requestId) => {
  const request = await ComplementaryRequest.findById(requestId);
  if (!request) {
    throw new Error("La solicitud no existe");
  }
  if (request.status !== 0) {
    throw new Error("La solicitud está inactiva");
  }
  const validStates = ["FICHA_ASIGNADA", "INSCRIPCION", "PROGRAMADA"];
  if (!validStates.includes(request.state)) {
    throw new Error(
      `La solicitud debe estar en estado FICHA_ASIGNADA, INSCRIPCION o PROGRAMADA para poder programarla. Estado actual: ${request.state}`
    );
  }
  return request;
};

complementaryScheduleHelper.validateInstructorAvailability = async (
  instructor,
  fstart,
  fend,
  tstart,
  tend,
  days,
  excludeScheduleId = null
) => {
  const currentDate = new Date();
  const fstartShe = dateFormater(fstart);
  const fendShe = dateFormater(fend);
  const tStartToDateClient = dateFormater(currentDate, tstart);
  const tEndToDateClient = dateFormater(currentDate, tend);

  const query = {
    instructor,
    status: 0,
  };
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const schedules = await Schedule.find(query).populate(
    "fiche instructor environment"
  );

  const conflicts = [];

  for (const schedule of schedules) {
    const tStartToDate = dateFormater(currentDate, schedule.tstart);
    const tEndToDate = dateFormater(currentDate, schedule.tend);

    if (
      schedule.fstart <= fendShe &&
      schedule.fend >= fstartShe &&
      tStartToDate <= tEndToDateClient &&
      tEndToDate >= tStartToDateClient
    ) {
      for (const event of schedule.events) {
        if (event >= fstartShe && event <= fendShe) {
          const getDay = event.getUTCDay();
          if (days.includes(getDay)) {
            const ficheLabel =
              schedule.fiche?.number ||
              `Complementaria (${schedule.scheduleType})`;
            conflicts.push({
              date: event.toISOString().split("T")[0],
              fiche: ficheLabel,
              type: schedule.scheduleType,
            });
          }
        }
      }
    }
  }

  if (conflicts.length > 0) {
    const uniqueDates = [...new Set(conflicts.map((c) => c.date))];
    const uniqueFiches = [...new Set(conflicts.map((c) => c.fiche))];
    throw new Error(
      `El instructor tiene programación en las fechas: ${uniqueDates.join(
        ", "
      )} con las fichas: ${uniqueFiches.join(", ")}`
    );
  }
};

complementaryScheduleHelper.validateEnvironmentAvailability = async (
  environment,
  fstart,
  fend,
  tstart,
  tend,
  days,
  excludeScheduleId = null
) => {
  if (!environment) return;

  const currentDate = new Date();
  const fstartShe = dateFormater(fstart);
  const fendShe = dateFormater(fend);
  const tStartToDateClient = dateFormater(currentDate, tstart);
  const tEndToDateClient = dateFormater(currentDate, tend);

  const query = {
    environment,
    status: 0,
  };
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const schedules = await Schedule.find(query).populate(
    "fiche instructor environment"
  );

  const conflicts = [];

  for (const schedule of schedules) {
    const tStartToDate = dateFormater(currentDate, schedule.tstart);
    const tEndToDate = dateFormater(currentDate, schedule.tend);

    if (
      schedule.fstart <= fendShe &&
      schedule.fend >= fstartShe &&
      tStartToDate <= tEndToDateClient &&
      tEndToDate >= tStartToDateClient
    ) {
      for (const event of schedule.events) {
        if (event >= fstartShe && event <= fendShe) {
          const getDay = event.getUTCDay();
          if (days.includes(getDay)) {
            const ficheLabel =
              schedule.fiche?.number ||
              `Complementaria (${schedule.scheduleType})`;
            conflicts.push({
              date: event.toISOString().split("T")[0],
              fiche: ficheLabel,
            });
          }
        }
      }
    }
  }

  if (conflicts.length > 0) {
    const uniqueDates = [...new Set(conflicts.map((c) => c.date))];
    const uniqueFiches = [...new Set(conflicts.map((c) => c.fiche))];
    throw new Error(
      `El ambiente ya está programado en las fechas: ${uniqueDates.join(
        ", "
      )} con las fichas: ${uniqueFiches.join(", ")}`
    );
  }
};

complementaryScheduleHelper.validateHoursLimit = async (
  requestId,
  instructorId,
  newHours
) => {
  const request = await ComplementaryRequest.findById(requestId).populate(
    "catalogCourse"
  );
  if (!request || !request.catalogCourse) return;

  const maxHours = request.catalogCourse.prfDuracionMaxima;
  if (!maxHours) return;

  const instructor = await Instructor.findById(instructorId);
  const existingSchedules = await Schedule.find({
    complementaryRequest: requestId,
    status: 0,
  });

  const currentHours = existingSchedules.reduce(
    (sum, s) => sum + (s.hourswork || 0),
    0
  );
  const totalHours = currentHours + newHours;

  if (totalHours > maxHours) {
    throw new Error(
      `Las horas totales (${totalHours}) exceden la duración máxima del curso (${maxHours} horas). Horas ya programadas: ${currentHours}`
    );
  }
};

complementaryScheduleHelper.validateNoDuplicateSchedule = async (
  requestId
) => {
  const existing = await Schedule.findOne({
    complementaryRequest: requestId,
    status: 0,
  });
  if (existing) {
    throw new Error(
      "Ya existe una programación activa para esta solicitud complementaria"
    );
  }
};

export { complementaryScheduleHelper };
