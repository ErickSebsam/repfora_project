import SofiaPlusClient from './sofiaPlusClient.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { complementaryAuditHelper } from '../helpers/complementary.helper.js';
import { sendMissingRouteNotification, sendMissingJudgmentsNotification } from '../services/notificationService.js';

/**
 * Scraper client that logs into Sofia Plus, selects the 'Instructor' role,
 * and navigates to the 'DF-14 - Matriculados Detallado' report.
 */
export class SofiaDetailedEnrollmentClient extends SofiaPlusClient {
  constructor(options = {}) {
    super(options);
  }

  /**
   * Normalizes text for robust comparisons (removes accents, trims, converts to lowercase)
   * @param {string} str - The string to normalize.
   * @returns {string} The normalized string.
   */
  normalizeText(str) {
    if (!str) return '';
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  /**
   * Finds and clicks a menu option inside the side-menu by checking text content.
   * Clicks when visible, handles stale element references with automatic retries.
   * @param {string} label - The label of the menu item to click.
   * @param {number} timeoutMs - Maximum time to wait.
   */
  async clickMenuOption(label, timeoutMs = 30000) {
    const page = this.page;
    if (!page) throw new Error('El navegador no está inicializado.');

    const normalizedLabel = this.normalizeText(label);
    const startTime = Date.now();

    console.log(`[SOFIA_NAV] Buscando opción de menú: "${label}"...`);

    while (Date.now() - startTime < timeoutMs) {
      // SOFIA Plus (JSF/PrimeFaces) dispara navegaciones asíncronas al construir el
      // menú tras seleccionar el rol. Si leemos los <a> mientras una navegación destruye
      // el contexto de ejecución del frame, page.$$ lanza "Execution context was
      // destroyed". Esperamos a que el documento se asiente y toleramos esa destrucción
      // reintentando, en lugar de dejar morir toda la navegación.
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
        const links = await page.$$('a');
        for (const link of links) {
          try {
            const text = await link.textContent();
            const isVisible = await link.isVisible();
            if (isVisible && this.normalizeText(text).includes(normalizedLabel)) {
              const box = await link.boundingBox();
              console.log(`[SOFIA_NAV] Encontrado "${label}" en posición ${JSON.stringify(box)}. Haciendo click...`);
              await link.click();
              return;
            }
          } catch (err) {
            // If the element is stale or detached, keep polling
          }
        }
      } catch (navErr) {
        // Contexto destruido por navegación (page.$$ fuera del try interno): esperar y reintentar.
        console.log(`[SOFIA_NAV] Contexto en navegación, reintentando ("${label}"): ${navErr.message}`);
      }
      await page.waitForTimeout(1000);
    }

    console.log(`[SOFIA_NAV] Depuración - Enlaces visibles encontrados tras fallo:`);
    const finalLinks = await page.$$('a');
    for (const link of finalLinks) {
      if (await link.isVisible().catch(() => false)) {
        const text = await link.textContent().catch(() => '');
        if (text.trim() !== '') {
          console.log(`  -> "${text.trim()}"`);
        }
      }
    }

    throw new Error(`No se pudo encontrar o hacer click en la opción de menú "${label}" en el tiempo límite.`);
  }

  /**
   * Selects the role (usually "Instructor"), then navigates to "DF-14 - Matriculados Detallado"
   * @param {string} roleLabel - The role to select.
   * @returns {Promise<Frame>} The iframe of the detailed enrollment page.
   */
  async navigateToDetailedEnrollment(roleLabel = 'Gestión Desarrollo Curricular') {
    const page = this.page;
    if (!page) throw new Error('El navegador no está inicializado. Debe iniciar sesión primero.');

    try {
      console.log(`[SOFIA_NAV] Paso 1: Seleccionando rol "${roleLabel}"...`);
      await this.selectRole(roleLabel);
      console.log(`[SOFIA_NAV] Paso 1: Rol "${roleLabel}" seleccionado ✓`);

      console.log('[SOFIA_NAV] Paso 2: Esperando menú lateral...');
      await page.waitForSelector('#side-menu, #menu_lateral', { timeout: 60000 });
      console.log('[SOFIA_NAV] Paso 2: Menú lateral encontrado ✓');

      // 1. Click en "Reportes"
      console.log('[SOFIA_NAV] Paso 3: Buscando opción "Reportes"...');
      await this.clickMenuOption('Reportes');
      console.log('[SOFIA_NAV] Paso 3: Click en "Reportes" ✓');

      // 2. Click en "Reportes por Centro de Formación"
      console.log('[SOFIA_NAV] Paso 4: Buscando opción "Reportes por Centro de Formación"...');
      await this.clickMenuOption('Reportes por Centro de Formación');
      console.log('[SOFIA_NAV] Paso 4: Click en "Reportes por Centro de Formación" ✓');

      // 3. Click en "Administración Educativa Centro"
      console.log('[SOFIA_NAV] Paso 5: Buscando opción "Administración Educativa Centro"...');
      await this.clickMenuOption('Administración Educativa Centro');
      console.log('[SOFIA_NAV] Paso 5: Click en "Administración Educativa Centro" ✓');

      // 4. Esperar a que cargue la pestaña principal en el iframe
      console.log('[SOFIA_NAV] Paso 6: Esperando a que cargue iframe#contenido...');
      const iframeHandle = await page.waitForSelector('iframe#contenido', { timeout: 60000 });
      const frame = await iframeHandle.contentFrame();
      console.log('[SOFIA_NAV] Paso 6: iframe#contenido cargado exitosamente ✓');

      // 5. Hacer click en el elemento DF-14A y esperar la descarga
      console.log('[SOFIA_NAV] Paso 7: Buscando el enlace "DF_14A" en el contenido...');
      // Usamos selector por texto para evitar problemas con mayúsculas/minúsculas en el ID
      const reportButton = frame.locator('a:has-text("DF_14A")').first();
      await reportButton.waitFor({ state: 'visible', timeout: 30000 });
      
      console.log('[SOFIA_NAV] Paso 8: Haciendo click y esperando la descarga del reporte...');
      const [ download ] = await Promise.all([
        page.waitForEvent('download', { timeout: 120000 }), // Hasta 2 minutos de espera por si el reporte es grande
        reportButton.click()
      ]);

      console.log(`[SOFIA_NAV] Paso 8: Descarga detectada. Nombre original: ${download.suggestedFilename()}`);

      // Directorio de descargas unificado: usa this.outputDir (OUTPUTDIR con fallback <cwd>/downloads)
      const downloadsDir = this.outputDir;

      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const finalDest = path.join(downloadsDir, download.suggestedFilename());
      await download.saveAs(finalDest);
      console.log(`[SOFIA_NAV] Paso 8: Archivo guardado exitosamente en: ${finalDest} ✓`);

      return finalDest;
    } catch (error) {
      console.error('[SOFIA_NAV] ERROR en navegación de Matrícula Detallada:', error.message);
      throw new Error('No fue posible navegar a la opción de matrícula detallada en Sofía Plus.', {
        cause: error
      });
    }
  }

  /**
   * Extrae el archivo plano de un ZIP descargado de SOFIA Plus.
   * Busca el primer archivo .txt o .csv dentro del ZIP y lo guarda
   * en la misma carpeta del ZIP.
   * @param {string} zipPath - Ruta absoluta al archivo ZIP descargado.
   * @returns {{ extractedPath: string, content: string }} Ruta del archivo extraído y su contenido.
   */
  extractDownload(zipPath) {
    try {
      console.log(`[SOFIA_EXTRACT] Extrayendo archivo de: ${zipPath}...`);

      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // Buscar el primer archivo plano (.txt o .csv) dentro del ZIP
      const plainFile = zipEntries.find(
        (entry) =>
          !entry.isDirectory &&
          /\.(txt|csv)$/i.test(entry.entryName)
      );

      if (!plainFile) {
        // Si no hay .txt/.csv, extraer el primer archivo que no sea directorio
        const firstFile = zipEntries.find((entry) => !entry.isDirectory);
        if (!firstFile) {
          throw new Error('El ZIP no contiene ningún archivo.');
        }
        console.log(
          `[SOFIA_EXTRACT] No se encontró .txt/.csv, extrayendo: ${firstFile.entryName}`
        );
        zip.extractEntryTo(firstFile, path.dirname(zipPath), false, true);
        const extractedPath = path.join(path.dirname(zipPath), path.basename(firstFile.entryName));
        const content = fs.readFileSync(extractedPath, 'utf-8');
        console.log(`[SOFIA_EXTRACT] Archivo extraído en: ${extractedPath} ✓`);
        return { extractedPath, content };
      }

      console.log(
        `[SOFIA_EXTRACT] Archivo plano encontrado: ${plainFile.entryName}`
      );
      zip.extractEntryTo(plainFile, path.dirname(zipPath), false, true);

      const extractedPath = path.join(
        path.dirname(zipPath),
        path.basename(plainFile.entryName)
      );
      const content = fs.readFileSync(extractedPath, 'utf-8');

      console.log(`[SOFIA_EXTRACT] Archivo extraído en: ${extractedPath} ✓`);
      console.log(
        `[SOFIA_EXTRACT] Tamaño del contenido: ${content.length} caracteres`
      );

      return { extractedPath, content };
    } catch (error) {
      console.error(
        `[SOFIA_EXTRACT] Error extrayendo ZIP: ${error.message}`
      );
      throw new Error(
        `No fue posible extraer el archivo descargado de Sofía Plus: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Procesa el archivo plano extraído del DF-14A usando el helper de auditoría
   * existente (complementaryAuditHelper.parseDF14) que ya normaliza columnas
   * y filtra solo "curso especial" (complementarias).
   * Genera dos listas separadas:
   * - sinRuta: fichas con aprendices sin ruta (enTransito > 0), SIN filtro de estado.
   * - sinJuicios: fichas con juicios pendientes (enFormacion > 0) y ESTADO_FICHA = "Terminada".
   * @param {string} extractedPath - Ruta del archivo plano extraído.
   * @returns {{ sinRuta: Array, sinJuicios: Array }}
   */
  async processExtractedFile(extractedPath) {
    try {
      console.log(`[SOFIA_PROCESS] Procesando archivo con parseDF14: ${extractedPath}...`);

      const allRecords = await complementaryAuditHelper.parseDF14(extractedPath);
      console.log(`[SOFIA_PROCESS] Registros "curso especial" encontrados: ${allRecords.length}`);

      // Sin ruta: TODOS los estados, solo que tenga aprendices sin ruta
      const sinRuta = allRecords.filter((row) => row.enTransito > 0);

      // Juicios pendientes: solo ESTADO_FICHA = "Terminada" o "Terminada por fecha".
      // (NIVEL_FORMACION = CURSO ESPECIAL ya lo filtra parseDF14 para ambos casos).
      // El helper normaliza el estado con toLowerCase().trim(); los valores reales del SENA son
      // "Terminada" -> "terminada" y "Terminada por fecha" -> "terminada por fecha".
      const ESTADOS_JUICIOS = ['terminada', 'terminada por fecha'];
      const sinJuicios = allRecords.filter((row) => {
        const estado = (row.estado || '').toLowerCase().trim();
        return ESTADOS_JUICIOS.includes(estado) && row.enFormacion > 0;
      });

      console.log(`[SOFIA_PROCESS] Resultados: ${sinRuta.length} fichas sin ruta (todos los estados), ${sinJuicios.length} fichas con juicios pendientes (Terminada)`);

      return { sinRuta, sinJuicios, totalProcessed: allRecords.length };
    } catch (error) {
      console.error(`[SOFIA_PROCESS] Error procesando archivo: ${error.message}`);
      throw new Error(
        `No fue posible procesar el archivo DF-14A: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Complete session wrapper: login + navigate + download + extract + process + notify
   * @param {string} roleLabel - The role to select.
   * @param {Object} [options] - Opciones adicionales.
   * @param {boolean} [options.notify=true] - Si se deben enviar notificaciones por email.
   * @param {string} [options.coordinationName='PROGRAMAS ESPECIALES'] - Nombre de la coordinación para credenciales de email.
   * @returns {{ zipPath: string, extractedPath: string, content: string, sinRuta: Array, sinJuicios: Array, notificationRutas: Object|null, notificationJuicios: Object|null }}
   */
  async startDetailedEnrollmentSession(roleLabel = 'Gestión Desarrollo Curricular', { notify = true, coordinationName = 'PROGRAMAS ESPECIALES' } = {}) {
    console.log('[SOFIA] Iniciando sesión completa para Matriculados Detallado...');
    // Declaradas fuera del try para que el finally pueda inspeccionarlas y limpiarlas
    // incluso si la operación falla a mitad de camino (ZIP creado pero error al procesar).
    let zipPath;
    let extractedPath;
    let content;

    try {
      await this.login();
      zipPath = await this.navigateToDetailedEnrollment(roleLabel);
      const extracted = this.extractDownload(zipPath);
      extractedPath = extracted.extractedPath;
      content = extracted.content;
      const { sinRuta, sinJuicios, totalProcessed } = await this.processExtractedFile(extractedPath);

      let notificationRutas = null;
      let notificationJuicios = null;

      if (notify && (sinRuta.length > 0 || sinJuicios.length > 0)) {
        // Notificar fichas sin ruta de aprendizaje (todos los estados)
        if (sinRuta.length > 0) {
          console.log(`[SOFIA] Enviando notificaciones de rutas (${sinRuta.length} fichas sin ruta)...`);
          notificationRutas = await sendMissingRouteNotification(sinRuta, coordinationName);
          console.log(`[SOFIA] Notificaciones rutas: ${notificationRutas.sent} enviadas, ${notificationRutas.failed} fallidas`);
        } else {
          console.log('[SOFIA] No hay fichas con aprendices sin ruta para notificar.');
        }

        // Notificar fichas con juicios de evaluación pendientes (solo ESTADO_FICHA = "Terminada")
        if (sinJuicios.length > 0) {
          console.log(`[SOFIA] Enviando notificaciones de juicios (${sinJuicios.length} fichas con juicios pendientes)...`);
          notificationJuicios = await sendMissingJudgmentsNotification(sinJuicios, coordinationName);
          console.log(`[SOFIA] Notificaciones juicios: ${notificationJuicios.sent} enviadas, ${notificationJuicios.failed} fallidas`);
        } else {
          console.log('[SOFIA] No hay fichas con juicios pendientes para notificar.');
        }
      }

      return { zipPath, extractedPath, content, sinRuta, sinJuicios, totalProcessed, notificationRutas, notificationJuicios };
    } finally {
      // Limpieza garantizada en TODOS los caminos (éxito y error):
      // borra el ZIP descargado y el archivo extraído, y cierra el navegador
      // para evitar fugas de archivos y procesos Chromium zombi.
      await this.#cleanupSession({ zipPath, extractedPath });
      await this.close().catch((e) => console.error('[SOFIA] Error cerrando navegador:', e.message));
    }
  }

  /**
   * Borra los archivos temporales generados durante la sesión (ZIP descargado y archivo extraído).
   * Es silencioso: nunca debe lanzar ni enmascarar el error original de la operación.
   * @param {Object} params
   * @param {string} [params.zipPath] - Ruta del ZIP descargado de SOFIA Plus.
   * @param {string} [params.extractedPath] - Ruta del archivo extraído del ZIP.
   */
  async #cleanupSession({ zipPath, extractedPath }) {
    if (zipPath) {
      await fs.promises.unlink(zipPath).catch(() => {});
    }
    if (extractedPath && extractedPath !== zipPath) {
      await fs.promises.unlink(extractedPath).catch(() => {});
    }
  }
}

export default SofiaDetailedEnrollmentClient;
