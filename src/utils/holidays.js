/**
 * Festivos oficiales de Colombia — Ley 51 de 1983 (Ley Emiliani)
 *
 * Tipos de festivo:
 *   FIJO      → Se celebra siempre en la fecha exacta.
 *   EMILIANI  → Se traslada al lunes siguiente si no cae en lunes.
 *   RELIGIOSO → Calculado respecto a la Pascua (Easter).
 *
 * Exporta:
 *   • COLOMBIAN_HOLIDAYS       – Mapa { año: [ 'YYYY-MM-DD', … ] }
 *   • isHoliday(dateStr)       – true si la fecha es festivo.
 *   • getHolidaysForYear(year) – Lista de { date, name } del año.
 *   • getHolidayName(dateStr)  – Nombre del festivo o null.
 *   • filterBusinessDays(dates)– Filtra solo días hábiles.
 */

// ────────────────────────────────────────────────────────────
// 1. Algoritmo de Pascua (Anonymous Gregorian)
// ────────────────────────────────────────────────────────────
const computeEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

// ────────────────────────────────────────────────────────────
// 2. Helpers internos
// ────────────────────────────────────────────────────────────
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/** Traslada al lunes siguiente (Ley Emiliani) */
const moveToNextMonday = (date) => {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Dom, 1=Lun, …, 6=Sab
  if (dow === 1) return d;
  const diff = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + diff);
  return d;
};

const fmt = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ────────────────────────────────────────────────────────────
// 3. Generador de festivos para un año dado
// ────────────────────────────────────────────────────────────
const generateHolidays = (year) => {
  const easter = computeEasterSunday(year);
  const holidays = [];

  const addFixed = (month, day, name) => {
    holidays.push({ date: fmt(new Date(year, month - 1, day)), name });
  };

  const addEmiliani = (month, day, name) => {
    holidays.push({ date: fmt(moveToNextMonday(new Date(year, month - 1, day))), name });
  };

  const addEasterRelative = (offset, name, emiliani = false) => {
    const d = addDays(easter, offset);
    holidays.push({
      date: fmt(emiliani ? moveToNextMonday(d) : d),
      name,
    });
  };

  // ── Festivos FIJOS ──
  addFixed(1, 1, 'Año Nuevo');
  addFixed(5, 1, 'Día del Trabajo');
  addFixed(7, 20, 'Grito de Independencia');
  addFixed(8, 7, 'Batalla de Boyacá');
  addFixed(12, 8, 'Inmaculada Concepción');
  addFixed(12, 25, 'Navidad');

  // ── Festivos EMILIANI (se trasladan al lunes siguiente) ──
  addEmiliani(1, 6, 'Reyes Magos');
  addEmiliani(3, 19, 'San José');
  addEmiliani(6, 29, 'San Pedro y San Pablo');
  addEmiliani(8, 15, 'Asunción de la Virgen');
  addEmiliani(10, 12, 'Día de la Raza');
  addEmiliani(11, 1, 'Todos los Santos');
  addEmiliani(11, 11, 'Independencia de Cartagena');

  // ── Festivos RELIGIOSOS basados en Pascua ──
  addEasterRelative(-3, 'Jueves Santo');
  addEasterRelative(-2, 'Viernes Santo');
  addEasterRelative(39, 'Ascensión del Señor', true);
  addEasterRelative(60, 'Corpus Christi', true);
  addEasterRelative(68, 'Sagrado Corazón', true);

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
};

// ────────────────────────────────────────────────────────────
// 4. Cache + Set para lookup O(1)
// ────────────────────────────────────────────────────────────
const _cache = {};
const _dateSetCache = {};

/**
 * Retorna todos los festivos de un año como [ { date, name }, … ].
 * @param {number} year
 * @returns {Array<{date: string, name: string}>}
 */
export const getHolidaysForYear = (year) => {
  if (!_cache[year]) {
    _cache[year] = generateHolidays(year);
    _dateSetCache[year] = new Set(_cache[year].map((h) => h.date));
  }
  return _cache[year];
};

// Pre-popular 2025-2027
[2025, 2026, 2027].forEach(getHolidaysForYear);

// ────────────────────────────────────────────────────────────
// 5. API pública
// ────────────────────────────────────────────────────────────

/**
 * Mapa { año: ['YYYY-MM-DD', …] } para consulta directa.
 */
export const COLOMBIAN_HOLIDAYS = Object.fromEntries(
  [2025, 2026, 2027].map((y) => [y, getHolidaysForYear(y).map((h) => h.date)])
);

/**
 * Verifica si una fecha es festivo colombiano.
 * @param {string|Date} dateInput - 'YYYY-MM-DD' o Date
 * @returns {boolean}
 */
export const isHoliday = (dateInput) => {
  const dateStr = typeof dateInput === 'string' ? dateInput.slice(0, 10) : fmt(dateInput);
  const year = parseInt(dateStr.slice(0, 4), 10);
  getHolidaysForYear(year); // asegurar cache
  return _dateSetCache[year].has(dateStr);
};

/**
 * Obtiene el nombre del festivo, o null si no es festivo.
 * @param {string|Date} dateInput
 * @returns {string|null}
 */
export const getHolidayName = (dateInput) => {
  const dateStr = typeof dateInput === 'string' ? dateInput.slice(0, 10) : fmt(dateInput);
  const year = parseInt(dateStr.slice(0, 4), 10);
  const holidays = getHolidaysForYear(year);
  const found = holidays.find((h) => h.date === dateStr);
  return found ? found.name : null;
};

/**
 * Filtra una lista de fechas dejando solo días hábiles (no festivos, no fines de semana).
 * @param {Array<string>} dates - ['YYYY-MM-DD', …]
 * @returns {Array<string>}
 */
export const filterBusinessDays = (dates) => {
  return dates.filter((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    if (day === 0 || day === 6) return false;
    return !isHoliday(dateStr);
  });
};

export default {
  COLOMBIAN_HOLIDAYS,
  isHoliday,
  getHolidayName,
  getHolidaysForYear,
  filterBusinessDays,
};
