import { chromium } from 'playwright';
import { obtenerProgramacionesMesActual, desconectarDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

const CONFIG = {
  headless: false,
  slowMo: 150,
  timeout: 60000,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function obtenerFestivosColombia(year) {
  try {
    logger.info(`Consultando festivos de Colombia para el año ${year}...`);

    const response = await fetch(
      `https://www.festivos.com.co/api/v1/festivos?year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FESTIVOS_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const { data } = await response.json();

    // La API devuelve "2026-07-20", lo convertimos a "20/07/2026"
    const festivosFormateados = data.map((item) => {
      const [y, m, d] = item.date.split("-");
      return `${d}/${m}/${y}`;
    });

    logger.success(`${festivosFormateados.length} festivos cargados desde la API.`);
    return festivosFormateados;
  } catch (error) {
    logger.error("Error al obtener festivos:", error.message);
    return [];
  }
}

// Registra UN evento (una serie de la colección "schedules", ya recortada
// al mes actual) dentro de SOFIA. Recibe un browser ya abierto y crea su
// propio contexto/página, para que si este evento falla no arrastre a los
// demás eventos del mismo run.
async function registrarEventoEnSofia(browser, datosEvento) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  // MÁSCARA ANTI-BOT
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  try {
    // =====================================
    // 1. LOGIN
    // =====================================
    logger.info("Entrando a SOFIA...");
    await page.goto(process.env.SOFIA_URL, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("#registradoBox1");
    const iframeHandle = await page.$("#registradoBox1");
    const loginFrame = await iframeHandle.contentFrame();

    await loginFrame.selectOption('select[name="select"]', "CC");
    await loginFrame.fill("#username", process.env.SOFIA_USER);
    await loginFrame.fill('input[name="josso_password"]', process.env.SOFIA_PASS);
    await loginFrame.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForSelector("#wrapper");
    logger.success("Login exitoso");
    await sleep(4000);

    // =====================================
    // 2. ROL: GESTIÓN DESARROLLO CURRICULAR (Value 17)
    // =====================================
    logger.info("Seleccionando rol Gestión Desarrollo Curricular...");

    const selectRol = page.locator('select[id*="seleccionRol:roles"]').first();
    await selectRol.waitFor({ state: "visible", timeout: 10000 });
    await selectRol.selectOption("17");

    await sleep(4000);
    logger.success("Rol seleccionado con éxito");

    // =====================================
    // 3. DESPLEGAR ÁRBOLES DE MENÚS
    // =====================================
    logger.info("Desplegando árbol de navegación...");

    await page.locator('span.menuPrimario', { hasText: 'Gestión de Ambientes' }).click();
    await sleep(1500);

    await page.locator('a', { hasText: 'Gestion Ambientes' }).click();
    await sleep(1500);

    await page.locator('a', { hasText: 'Gestión de Planeación y Programación' }).click();
    await sleep(1500);

    await page.locator('a[id="722211Opcion"]').click();
    await sleep(5000);

    // =====================================
    // 4. ENGANCHAR IFRAME CONTENIDO
    // =====================================
    const frameContenido = page.frames().find((f) => f.name() === "contenido");

    if (!frameContenido) {
      throw new Error("No se encontró el iframe 'contenido' principal.");
    }

    logger.success(`Iframe contenido detectado: ${frameContenido.url()}`);

    // =====================================
    // 5. APERTURA DEL MODAL BÚSQUEDA DE FICHA
    // =====================================
    logger.info("Iniciando flujo de selección por FICHA DE CARACTERIZACIÓN...");

    const botonAbrirModalFicha = frameContenido
      .locator('a[id="modalProgramacionAmbiente:fichaFormacionOLK"]')
      .first();

    await botonAbrirModalFicha.waitFor({ state: "visible", timeout: 15000 });
    await botonAbrirModalFicha.click();

    // =====================================
    // 6. ENGANCHAR IFRAME DEL MODAL DE FICHAS
    // =====================================
    await frameContenido.waitForSelector('iframe[id*="listaFichas"], iframe[id*="modalDialogContent"]', {
      state: "attached",
      timeout: 15000,
    });

    await sleep(3000);

    let verdaderoFrameFicha = page
      .frames()
      .find(
        (f) =>
          f.name().includes("listaFichas") ||
          f.url().includes("listaFichas") ||
          f.url().includes("ficha")
      );

    if (!verdaderoFrameFicha) {
      const framesCount = page.frames().length;
      verdaderoFrameFicha = page.frames()[framesCount - 1];
    }

    // =====================================
    // 7. BÚSQUEDA Y LLENADO DE LA FICHA EN EL MODAL
    // =====================================
    const codigoFicha = String(datosEvento.ficha);

    const inputCodigoFicha = verdaderoFrameFicha
      .locator('input[id*="codigoFichaITX"], input[id*="codigoFicha"]')
      .first();

    await inputCodigoFicha.waitFor({ state: "visible", timeout: 10000 });
    await inputCodigoFicha.fill(codigoFicha);

    const botonConsultarFicha = verdaderoFrameFicha
      .locator('input[type="submit"][value*="Consultar"], input[id*="btnSearch"], a[id*="btnSearch"]')
      .first();

    await botonConsultarFicha.click();
    await sleep(3000);

    // =====================================
    // 8. SELECCIONAR LA FICHA DE LA TABLA
    // =====================================
    const botonSeleccionarFicha = verdaderoFrameFicha
      .locator('table tbody tr a[id*="cmdlnkShow"], table tbody tr a[id*="select"]')
      .first();

    await botonSeleccionarFicha.waitFor({ state: "visible", timeout: 10000 });
    await botonSeleccionarFicha.click();

    await sleep(4000);

    // =====================================
    // 9. CONSULTAR PROGRAMACIONES DE AMBIENTE
    // =====================================
    const btnConsultarProg = frameContenido
      .locator('input[id*="btnConsultarProgramaciones"]')
      .first();

    await btnConsultarProg.waitFor({ state: "visible", timeout: 15000 });
    await btnConsultarProg.click();

    // =====================================
    // 10. SELECCIONAR "CREAR EVENTO"
    // =====================================
    const botonCrearEvento = frameContenido
      .locator('table[id*="dtprogramacionesDeAmbiente"] img[alt="Crear Evento"], table[id*="dtprogramacionesDeAmbiente"] img[title="Crear Evento"]')
      .first();

    await botonCrearEvento.waitFor({ state: "visible", timeout: 20000 });
    await botonCrearEvento.click();

    // =====================================
    // 11. ESPERAR Y RE-ENGANCHAR EL IFRAME
    // =====================================
    await sleep(5000);

    const frameEvento = page.frames().find((f) => f.name() === "contenido");
    if (!frameEvento) {
      throw new Error("No se encontró el iframe 'contenido' tras hacer clic en Crear Evento.");
    }

    // =====================================
    // 12. CONFIGURAR FECHAS DEL EVENTO
    // =====================================
    logger.info("Asignando fechas al formulario del evento...");

    const btnLimpiarInicio = frameEvento.locator('a[id*="cmdlnkCleanFechaInicio"]').first();
    await btnLimpiarInicio.waitFor({ state: "visible", timeout: 10000 });
    await btnLimpiarInicio.click();
    await sleep(1000);

    const inputFechaInicio = frameEvento.locator('input[id="fechaInicioEvento"]');
    await inputFechaInicio.fill(datosEvento.fechaInicio);
    await inputFechaInicio.press("Tab");

    const btnLimpiarFin = frameEvento.locator('a[id*="cmdlnkCleanfechaFinEvento"]').first();
    await btnLimpiarFin.waitFor({ state: "visible", timeout: 10000 });
    await btnLimpiarFin.click();
    await sleep(1000);

    const inputFechaFin = frameEvento.locator('input[id="fechaFinEvento"]');
    await inputFechaFin.fill(datosEvento.fechaFin);
    await inputFechaFin.press("Tab");

    // =====================================
    // 13. DESCRIPCIÓN Y HORARIO DEL EVENTO
    // =====================================
    const inputDescripcion = frameEvento.locator('#descripcionEvento');
    await inputDescripcion.waitFor({ state: "visible", timeout: 10000 });
    await inputDescripcion.fill(datosEvento.descripcion);

    for (const dia of datosEvento.dias) {
      const checkboxDia = frameEvento.locator(`input[name="seleccionDiaHorario"][value="${dia}"]`);
      if (await checkboxDia.isVisible() && !(await checkboxDia.isChecked())) {
        await checkboxDia.check();
      }
    }

    const inputHoraInicio = frameEvento.locator('#horaInicio');
    await inputHoraInicio.fill(datosEvento.horaInicio);
    await inputHoraInicio.press("Tab");

    const inputHoraFin = frameEvento.locator('#horaFin');
    await inputHoraFin.fill(datosEvento.horaFin);
    await inputHoraFin.press("Tab");

    // =====================================
    // 14. AGREGAR HORARIO
    // =====================================
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    const btnAgregarHorario = frameEvento.locator(
      '#CrearEventoAmbienteResultadosAprendizaje\\:botonAgregarHorario'
    );

    await btnAgregarHorario.waitFor({ state: "visible", timeout: 10000 });
    await btnAgregarHorario.click();

    const tablaHorarios = frameEvento.locator('table[id*="dthorariosEvento"]').first();
    await tablaHorarios.waitFor({ state: "visible", timeout: 15000 });
    await sleep(2000);

    // =====================================
    // 15. FILTRAR Y ELIMINAR DÍAS FESTIVOS (API DINÁMICA)
    // =====================================
    // Año extraído dinámicamente de la fecha de inicio del evento (dd/mm/yyyy)
    const anioEvento = datosEvento.fechaInicio.split("/")[2];

    const festivosOficiales = await obtenerFestivosColombia(anioEvento);

    logger.info("Revisando la grilla para eliminar días festivos oficiales...");

    const botonesPaginas = frameEvento.locator('a[id*="dsEventosidx"]');
    const cantidadPaginas = await botonesPaginas.count();
    const totalPaginas = cantidadPaginas > 0 ? cantidadPaginas : 1;

    for (let numPagina = 1; numPagina <= totalPaginas; numPagina++) {
      if (numPagina > 1) {
        const enlacePagina = frameEvento.locator(`a[id*="dsEventosidx${numPagina}"]`);
        if (await enlacePagina.isVisible()) {
          await enlacePagina.click();
          await sleep(3000);
        }
      }

      const filasHorario = frameEvento.locator(
        'tbody[id*="dthorariosEvento:tbody_element"] > tr'
      );

      const totalFilas = await filasHorario.count();

      for (let i = totalFilas - 1; i >= 0; i--) {
        const fila = filasHorario.nth(i);
        const selectorFecha = fila.locator('span[id*="Horario_Fecha"]');

        if (await selectorFecha.isVisible()) {
          const fechaTexto = (await selectorFecha.innerText()).trim();

          if (festivosOficiales.includes(fechaTexto)) {
            logger.warn(`Día festivo encontrado: ${fechaTexto} (Fila ${i + 1})`);

            const btnEliminar = fila.locator('a[id*="cmdlnkDelete"] img[alt*="Eliminar"]').first();

            if (await btnEliminar.isVisible()) {
              await btnEliminar.click();
              await sleep(3000);
              logger.success(`Sesión del ${fechaTexto} eliminada.`);
            }
          }
        }
      }
    }

    logger.success(`Evento sincronizado correctamente | Ficha: ${datosEvento.ficha}`);
  } finally {
    // await context.close();
    await page.pause();
  }
}

// Punto de entrada usado por cron.js y cronService.js.
// Trae todas las series de "schedules" que se solapan con el mes actual
// (ya recortadas a los límites del mes) y las registra una por una en SOFIA.
// Si un evento falla, se registra el error y se sigue con los demás.
export async function ejecutarSincronizacionEvento() {
  logger.info("Cargando eventos del mes actual desde base de datos...");
  const eventosDelMes = await obtenerProgramacionesMesActual();

  logger.info(`${eventosDelMes.length} evento(s) del mes actual por registrar.`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const errores = [];

  try {
    for (const datosEvento of eventosDelMes) {
      logger.info(`Procesando evento | Ficha: ${datosEvento.ficha} | Fechas: ${datosEvento.fechaInicio} - ${datosEvento.fechaFin}`);

      try {
        await registrarEventoEnSofia(browser, datosEvento);
      } catch (error) {
        logger.error(`Error registrando el evento de la ficha ${datosEvento.ficha}:`, error);
        errores.push({ idSchedule: datosEvento.idSchedule, ficha: datosEvento.ficha, error });
      }
    }
  } finally {
    await browser.close();
    await desconectarDB();
  }

  if (errores.length > 0) {
    logger.warn(`Sincronización finalizada con ${errores.length} error(es) de ${eventosDelMes.length} evento(s).`);
  } else {
    logger.success("Todos los eventos del mes actual se sincronizaron correctamente.");
  }
}
