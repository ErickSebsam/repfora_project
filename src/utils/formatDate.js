/**
 * Formatea una fecha del servidor a formato local (DD/MM/AAAA) sin horas.
 * @param {string|Date} date - La fecha recibida del servidor.
 * @returns {string} - Ejemplo: "30/04/2026"
 */
export const formatToLocalDate = (date) => {
  if (!date) return '';

  const options = {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  return new Date(date).toLocaleDateString('es-CO', options);
};