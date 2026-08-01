import { get } from "./api.js";

export const InstructorService = {
  /**
   * Obtiene la lista de instructores activos
   */
  getInstructors: () => get('/instructors'),

  /**
   * Verifica cruces de horario de un instructor
   */
  checkAvailability: (instructorId, dates, shift, currentFiche) => 
    get(`/instructors/${instructorId}/availability`, { 
      dates: dates.join(','), 
      shift, 
      currentFiche 
    })
};
