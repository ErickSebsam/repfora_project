import fs from 'fs';
import * as XLSX from 'xlsx/xlsx.mjs';

XLSX.set_fs(fs);

export const PASS_KEYWORDS = 'aprobado';
const ACTIVE_STATE_KEYWORD = 'formacion';
export const PENDING_KEYWORD = 'por evaluar';
export const ETAPA_PRACTICA_KEYWORD = 'etapa practica';

// --- FUNCIONES DE LIMPIEZA Y SIMILITUD (IGUAL QUE ANTES) ---

export function cleanStringForComparison(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .toLowerCase()
    .replace(/[^a-zñ]/g, ""); 
}

function getSimilarity(s1, s2) {
  const a = cleanStringForComparison(s1);
  const b = cleanStringForComparison(s2);

  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;

  const bigramsA = new Set();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    if (bigramsA.has(bigram)) intersection++;
  }

  const totalBigrams = (a.length - 1) + (b.length - 1);
  return (2 * intersection) / totalBigrams;
}

// --- NUEVA LÓGICA DE PROCESAMIENTO ---

export function parseReportFile(reportPath) {
  // Leemos el workbook y contamos el total de filas de datos
  const workbook = XLSX.readFile(reportPath, { cellDates: true });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Contar filas con datos (excluyendo filas vacías)
  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const totalRows = allRows.filter(row =>
    row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
  ).length;

  return { workbook, totalRows };
}

/**
 * Indexa el workbook por resultado de aprendizaje para búsquedas eficientes
 * Retorna un objeto con los resultados indexados y el total de filas EN FORMACION
 */
export function indexWorkbookByOutcome(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Encontrar fila de encabezados
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(allRows.length, 30); i++) {
    const row = allRows[i];
    if (!Array.isArray(row)) continue;

    const rowStr = row.map(c => cleanStringForComparison(c)).join(' ');
    if (rowStr.includes('resultadodeaprendizaje') && rowStr.includes('juicio')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn("No se encontraron los encabezados esperados en el Excel.");
    return { indexedResults: {}, totalEnFormacion: 0 };
  }

  const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

  if (data.length === 0) {
    return { indexedResults: {}, totalEnFormacion: 0 };
  }

  // Identificar columnas
  const firstRow = data[0];
  const keyOutcome = findKeyInObject(firstRow, "resultado de aprendizaje");
  const keyState = findKeyInObject(firstRow, "estado");
  const keyGrade = findKeyInObject(firstRow, "juicio");
  const keyCompetencia = findKeyInObject(firstRow, "competencia");
  const keyDocType = findKeyInObject(firstRow, "tipo de documento");
  const keyDoc = findKeyInObject(firstRow, "numero de documento") || findKeyInObject(firstRow, "documento") || findKeyInObject(firstRow, "identificacion");
  const keyName = findKeyInObject(firstRow, "nombre");
  const keySurname = findKeyInObject(firstRow, "apellido") || findKeyInObject(firstRow, "apellidos");

  if (!keyOutcome || !keyGrade) {
    console.warn("Columnas no identificadas correctamente en el JSON.");
    return { indexedResults: {}, totalEnFormacion: 0, columnKeys: {} };
  }

  // Contar filas EN FORMACION y crear índice
  const uniqueLearnersEnFormacion = new Set(); // documentos únicos en toda la ficha
  const indexedResults = {};

  data.forEach(row => {
    const stateVal = keyState ? cleanStringForComparison(row[keyState]) : '';
    const isEnFormacion = keyState && stateVal.includes(ACTIVE_STATE_KEYWORD);

    const outcomeText = String(row[keyOutcome] || '');
    const outcomeKey = cleanStringForComparison(outcomeText);

    if (!indexedResults[outcomeKey]) {
      indexedResults[outcomeKey] = {
        originalText: outcomeText,
        rows: [],
        totalLearners: 0,
        totalEnFormacion: 0,
        missingLearners: [],
        isRated: false,
        competencia: ''
      };
    }

    // Poblar competencia desde la primera fila del outcome
    if (!indexedResults[outcomeKey].competencia && keyCompetencia) {
      indexedResults[outcomeKey].competencia = String(row[keyCompetencia] || '');
    }

    indexedResults[outcomeKey].rows.push(row);
    indexedResults[outcomeKey].totalLearners++;

    // Contar aprendices EN FORMACION por resultado
    if (isEnFormacion) {
      indexedResults[outcomeKey].totalEnFormacion++;
      // Acumular documento único para el conteo global de la ficha
      const docId = keyDoc ? String(row[keyDoc] || '').trim() : '';
      if (docId) uniqueLearnersEnFormacion.add(docId);
    }

    // Verificar si está calificado
    const gradeVal = row[keyGrade] ? String(row[keyGrade]).toLowerCase() : "";
    const isApproved = PASS_KEYWORDS == gradeVal;

    if (!isApproved && isEnFormacion) {
      // Combinar nombre y apellido
      const firstName = keyName ? (row[keyName] || '').trim() : '';
      const lastName = keySurname ? (row[keySurname] || '').trim() : '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');

      indexedResults[outcomeKey].missingLearners.push({
        name: fullName || "Desconocido",
        documentType: keyDocType ? (row[keyDocType] || 'CC') : 'CC',
        document: keyDoc ? row[keyDoc] : "---"
      });
    }
  });

  // Calcular isRated para cada resultado
  Object.values(indexedResults).forEach(result => {
    result.isRated = result.missingLearners.length === 0 && result.totalEnFormacion > 0;
  });

  return {
    indexedResults,
    totalEnFormacion: uniqueLearnersEnFormacion.size,
    columnKeys: { keyState, keyGrade, keyCompetencia, keyDoc }
  };
}

/**
 * Extrae la fecha final del programa desde la celda C9 del Excel de Sofía Plus.
 * @param {Object} workbook - Workbook parseado con XLSX
 * @returns {Date|null}
 */
export function extractSofiaEndDate(workbook) {
  try {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const cell = sheet['C9'];
    if (!cell) return null;

    // cellDates: true → tipo 'd', valor Date
    if (cell.t === 'd' && cell.v instanceof Date) return cell.v;

    // Número serial de Excel (base 1900)
    if (cell.t === 'n' && cell.v > 0) {
      const d = new Date(Math.round((cell.v - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? null : d;
    }

    // Texto: intentar parsear
    if (cell.v) {
      const parsed = new Date(String(cell.v));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Busca un resultado en el índice usando similitud de texto
 */
export function findOutcomeInIndex(indexedResults, outcomeText) {
  const searchText = cleanStringForComparison(outcomeText);

  // Primero buscar coincidencia exacta
  if (indexedResults[searchText]) {
    const result = indexedResults[searchText];
    return {
      foundColumn: true,
      isRated: result.isRated,
      gradeDate: new Date(),
      missingLearners: result.missingLearners,
      totalLearners: result.totalLearners,
      totalEnFormacion: result.totalEnFormacion || 0
    };
  }

  // Si no hay exacta, buscar por similitud
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const [key, result] of Object.entries(indexedResults)) {
    const similarity = calculateSimilarity(searchText, key);
    if (similarity > bestSimilarity && similarity >= 0.9) {
      bestSimilarity = similarity;
      bestMatch = result;
    }
  }

  if (bestMatch) {
    return {
      foundColumn: true,
      isRated: bestMatch.isRated,
      gradeDate: new Date(),
      missingLearners: bestMatch.missingLearners,
      totalLearners: bestMatch.totalLearners,
      totalEnFormacion: bestMatch.totalEnFormacion || 0
    };
  }

  return {
    foundColumn: false,
    isRated: false,
    missingLearners: [],
    totalLearners: 0,
    totalEnFormacion: 0
  };
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.95;

  const bigrams1 = new Set();
  for (let i = 0; i < str1.length - 1; i++) {
    bigrams1.add(str1.substring(i, i + 2));
  }

  let intersection = 0;
  for (let i = 0; i < str2.length - 1; i++) {
    if (bigrams1.has(str2.substring(i, i + 2))) {
      intersection++;
    }
  }

  const totalBigrams = (str1.length - 1) + (str2.length - 1);
  return totalBigrams > 0 ? (2 * intersection) / totalBigrams : 0;
}

/**
 * Encuentra el nombre real de la propiedad en el objeto JSON que corresponde a una columna esperada.
 * Ej: Buscamos "resultado de aprendizaje", pero en el objeto la llave es "Resultado de Aprendizaje " (con espacio).
 */
function findKeyInObject(obj, keyword) {
  const keys = Object.keys(obj);
  return keys.find(k => cleanStringForComparison(k).includes(cleanStringForComparison(keyword)));
}

export function analyzeOutcomeInReport(workbook, outcomeText, omittedLearners = []) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  let headerRowIndex = -1;
  
  for (let i = 0; i < Math.min(allRows.length, 30); i++) {
    const row = allRows[i];
    if (!Array.isArray(row)) continue;
    
    const rowStr = row.map(c => cleanStringForComparison(c)).join(' ');
    
    if (rowStr.includes('resultadodeaprendizaje') && rowStr.includes('juicio')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn("No se encontraron los encabezados esperados en el Excel.");
    return { foundColumn: false, isRated: false, missingLearners: [], totalLearners: 0 };
  }

  const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

  if (data.length === 0) {
    return { foundColumn: true, isRated: false, missingLearners: [], totalLearners: 0 };
  }

  // Identificar los nombres exactos de las llaves en el objeto (por si hay espacios o tildes)
  const firstRow = data[0];
  const keyOutcome = findKeyInObject(firstRow, "resultado de aprendizaje");
  const keyState = findKeyInObject(firstRow, "estado"); // "Estado"
  const keyGrade = findKeyInObject(firstRow, "juicio"); // "Juicio de Evaluación"
  const keyDocType = findKeyInObject(firstRow, "tipo de documento");
  const keyDoc = findKeyInObject(firstRow, "numero de documento") || findKeyInObject(firstRow, "documento") || findKeyInObject(firstRow, "identificacion");
  const keyName = findKeyInObject(firstRow, "nombre");
  const keySurname = findKeyInObject(firstRow, "apellido") || findKeyInObject(firstRow, "apellidos");

  // DEBUG: Mostrar columnas encontradas
  // console.log('[ANALYZER_DEBUG] Columnas identificadas:', {
  //   keyOutcome,
  //   keyState,
  //   keyGrade,
  //   keyDoc,
  //   keyName,
  //   keySurname,
  //   todasLasKeys: Object.keys(firstRow)
  // });

  if (!keyOutcome || !keyGrade) {
     console.warn("Columnas no identificadas correctamente en el JSON.");
     return { foundColumn: false, isRated: false, missingLearners: [], totalLearners: 0 };
  }

  // DEBUG: Mostrar algunos valores de estado de las primeras filas
  if (keyState) {
    const sampleStates = data.slice(0, 5).map(row => row[keyState]);
 //   console.log('[ANALYZER_DEBUG] Muestra de estados en el archivo:', sampleStates);
  } else {
 //   console.warn('[ANALYZER_DEBUG] ¡COLUMNA "Estado" NO ENCONTRADA! No se filtrará por estado.');
  }

  // Contar filas totales "EN FORMACION" antes de filtrar por resultado
  let totalEnFormacion = 0;
  if (keyState) {
    totalEnFormacion = data.filter(row => {
      const stateVal = cleanStringForComparison(row[keyState]);
      return stateVal.includes(ACTIVE_STATE_KEYWORD);
    }).length;
  }

  const relevantRows = data.filter(row => {

    const rowOutcomeText = row[keyOutcome];
    const similarity = getSimilarity(String(rowOutcomeText), outcomeText);
    if (similarity < 0.9) return false; // No es este resultado


    // B. Filtro por Estado ("EN FORMACION")
    if (keyState) {
        const stateVal = cleanStringForComparison(row[keyState]);
        if (!stateVal.includes(ACTIVE_STATE_KEYWORD)) return false;
    }

    // C. Filtro por Omisión Manual (Lista negra)
    if (keyDoc) {
        const docVal = String(row[keyDoc]).trim();
        if (omittedLearners.includes(docVal)) return false;
    }

    return true;
  });

  // 4. VERIFICACIÓN DE NOTAS EN LOS FILTRADOS
  const missingLearners = [];

  relevantRows.forEach(row => {
    const gradeVal = row[keyGrade] ? String(row[keyGrade]).toLowerCase() : "";
    const isApproved = PASS_KEYWORDS == gradeVal;
    if (!isApproved) {
      // Combinar nombre y apellido
      const firstName = keyName ? (row[keyName] || '').trim() : '';
      const lastName = keySurname ? (row[keySurname] || '').trim() : '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');

      missingLearners.push({
        name: fullName || "Desconocido",
        documentType: keyDocType ? (row[keyDocType] || 'CC') : 'CC',
        document: keyDoc ? row[keyDoc] : "---"
      });
    }
  });
  
  const totalRelevant = relevantRows.length;
  // Si filtramos y encontramos gente, y nadie falta -> Rated = True
  // Si filtramos y NO encontramos a nadie (0 relevantes) -> Rated = False (o True? Depende. Asumo False para seguridad)
  const isRated = (missingLearners.length === 0) && (totalRelevant > 0 || omittedLearners.length > 0);

  return {
    foundColumn: true,
    isRated,
    gradeDate: new Date(),
    missingLearners,
    totalLearners: totalRelevant,
    totalEnFormacion
  };
}