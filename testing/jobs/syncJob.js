import { chromium } from 'playwright';
import { obtenerProgramacion, desconectarDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Dentro de jobs/syncJob.js
import { parseSenaPlan } from '../utils/planningMapper.js';

export async function runSyncJob() {
  // 1. Obtienes el documento pesado de MongoDB o un JSON
  const rawDocument = await obtenerDatosRaw(); 

  // 2. Usas la función helper de utils para formatearlo
  const cleanData = parseSenaPlan(rawDocument);

  // 3. Trabajas con los datos ya limpios
  console.log("Programa procesado:", cleanData.program.name);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function ejecutarSincronizacionEvento() {
  logger.info("Cargando evento desde base de datos...");
  const datosEvento = await obtenerProgramacion();

  logger.info(`Evento obtenido | Ficha: ${datosEvento.ficha} | Fechas: ${datosEvento.fechaInicio} - ${datosEvento.fechaFin}`);

  // Configuración veloz: slowMo en 0 para máxima velocidad
  const browser = await chromium.launch({
    headless: false,
    slowMo: 0,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  try {
    // 1. LOGIN
    logger.info("Iniciando sesión en SOFIA...");
    await page.goto(process.env.SOFIA_URL, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("#registradoBox1");
    const iframeHandle = await page.$("#registradoBox1");
    const loginFrame = await iframeHandle.contentFrame();

    await loginFrame.selectOption('select[name="select"]', "CC");
    await loginFrame.fill("#username", process.env.SOFIA_USER);
    await loginFrame.fill('input[name="josso_password"]', process.env.SOFIA_PASS);
    await loginFrame.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForSelector("#wrapper");
    logger.success("Sesión iniciada.");

    // 2. SELECCIÓN DE ROL
    const selectRol = page.locator('select[id*="seleccionRol:roles"]').first();
    await selectRol.waitFor({ state: "visible" });
    await selectRol.selectOption("17"); // Gestión Desarrollo Curricular

    // Esperar solo hasta que el árbol de menú esté en el DOM
    await page.waitForSelector('span.menuPrimario');

    // 3. NAVEGACIÓN EN MENÚ
    logger.info("Desplegando opciones del menú...");
    await page.locator('span.menuPrimario', { hasText: 'Gestión de Ambientes' }).click();
    await page.locator('a', { hasText: 'Gestion Ambientes' }).click();
    await page.locator('a', { hasText: 'Gestión de Planeación y Programación' }).click();
    await page.locator('a[id="722211Opcion"]').click();

    // 4. BÚSQUEDA DE FICHA
    const frameContenido = page.frames().find((f) => f.name() === "contenido");
    const btnAbrirModalFicha = frameContenido.locator('a[id="modalProgramacionAmbiente:fichaFormacionOLK"]').first();
    await btnAbrirModalFicha.waitFor({ state: "visible" });
    await btnAbrirModalFicha.click();

    await frameContenido.waitForSelector('iframe[id*="listaFichas"], iframe[id*="modalDialogContent"]');

    let frameFicha = page.frames().find(
      (f) => f.name().includes("listaFichas") || f.url().includes("listaFichas") || f.url().includes("ficha")
    ) || page.frames()[page.frames().length - 1];

    const inputCodigoFicha = frameFicha.locator('input[id*="codigoFichaITX"], input[id*="codigoFicha"]').first();
    await inputCodigoFicha.waitFor({ state: "visible" });
    await inputCodigoFicha.fill(String(datosEvento.ficha));

    const btnConsultarFicha = frameFicha.locator('input[type="submit"][value*="Consultar"], input[id*="btnSearch"]').first();
    await btnConsultarFicha.click();

    const btnSeleccionarFicha = frameFicha.locator('table tbody tr a[id*="cmdlnkShow"], table tbody tr a[id*="select"]').first();
    await btnSeleccionarFicha.waitFor({ state: "visible" });
    await btnSeleccionarFicha.click();

    // 5. CONSULTAR Y CREAR EVENTO
    const btnConsultarProg = frameContenido.locator('input[id*="btnConsultarProgramaciones"]').first();
    await btnConsultarProg.waitFor({ state: "visible" });
    await btnConsultarProg.click();

    const btnCrearEvento = frameContenido.locator('table[id*="dtprogramacionesDeAmbiente"] img[alt="Crear Evento"]').first();
    await btnCrearEvento.waitFor({ state: "visible" });
    await btnCrearEvento.click();

    // 6. DILIGENCIAR FORMULARIO DE EVENTO
    const frameEvento = page.frames().find((f) => f.name() === "contenido");

    // Fechas
    const btnLimpiarInicio = frameEvento.locator('a[id*="cmdlnkCleanFechaInicio"]').first();
    await btnLimpiarInicio.waitFor({ state: "visible" });
    await btnLimpiarInicio.click();
    const inputFechaInicio = frameEvento.locator('input[id="fechaInicioEvento"]');
    await inputFechaInicio.fill(datosEvento.fechaInicio);
    await inputFechaInicio.press("Tab");

    const btnLimpiarFin = frameEvento.locator('a[id*="cmdlnkCleanfechaFinEvento"]').first();
    await btnLimpiarFin.waitFor({ state: "visible" });
    await btnLimpiarFin.click();
    const inputFechaFin = frameEvento.locator('input[id="fechaFinEvento"]');
    await inputFechaFin.fill(datosEvento.fechaFin);
    await inputFechaFin.press("Tab");

    // Descripción
    const inputDescripcion = frameEvento.locator('#descripcionEvento');
    await inputDescripcion.waitFor({ state: "visible" });
    await inputDescripcion.fill(datosEvento.descripcion);

    // Días
    for (const dia of datosEvento.dias) {
      const checkboxDia = frameEvento.locator(`input[name="seleccionDiaHorario"][value="${dia}"]`);
      if (await checkboxDia.isVisible() && !(await checkboxDia.isChecked())) {
        await checkboxDia.check();
      }
    }

    // Horas
    const inputHoraInicio = frameEvento.locator('#horaInicio');
    await inputHoraInicio.fill(datosEvento.horaInicio);
    await inputHoraInicio.press("Tab");

    const inputHoraFin = frameEvento.locator('#horaFin');
    await inputHoraFin.fill(datosEvento.horaFin);
    await inputHoraFin.press("Tab");

    // 7. AGREGAR HORARIO
    logger.info("Agregando grilla de horarios...");
    page.on("dialog", async (dialog) => await dialog.accept());

    const btnAgregarHorario = frameEvento.locator('#CrearEventoAmbienteResultadosAprendizaje\\:botonAgregarHorario');
    await btnAgregarHorario.click();

    const tablaHorarios = frameEvento.locator('table[id*="dthorariosEvento"]').first();
    await tablaHorarios.waitFor({ state: "visible" });

    // 8. FILTRAR FESTIVOS
    const festivosPrueba = ["20/07/2026", "27/07/2026"];
    const botonesPaginas = frameEvento.locator('a[id*="dsEventosidx"]');
    const totalPaginas = (await botonesPaginas.count()) || 1;

    for (let numPagina = 1; numPagina <= totalPaginas; numPagina++) {
      if (numPagina > 1) {
        const enlacePagina = frameEvento.locator(`a[id*="dsEventosidx${numPagina}"]`);
        if (await enlacePagina.isVisible()) {
          await enlacePagina.click();
          await sleep(1500); // Espera mínima para el AJAX de la tabla
        }
      }

      const filasHorario = frameEvento.locator('tbody[id*="dthorariosEvento:tbody_element"] > tr');
      const totalFilas = await filasHorario.count();

      for (let i = totalFilas - 1; i >= 0; i--) {
        const fila = filasHorario.nth(i);
        const selectorFecha = fila.locator('span[id*="Horario_Fecha"]');

        if (await selectorFecha.isVisible()) {
          const fechaTexto = (await selectorFecha.innerText()).trim();

          if (festivosPrueba.includes(fechaTexto)) {
            logger.warn(`Festivo detectado: ${fechaTexto}. Eliminando...`);
            const btnEliminar = fila.locator('a[id*="cmdlnkDelete"] img[alt*="Eliminar"]').first();
            if (await btnEliminar.isVisible()) {
              await btnEliminar.click();
              await sleep(1500); // Tiempo justo para procesar borrado
            }
          }
        }
      }
    }

    logger.success("Evento sincronizado correctamente.");

  } catch (error) {
    logger.error("Error durante la ejecución de la sincronización:", error);
    throw error;
  } finally {
    await browser.close();
    await desconectarDB();
  }
}