import { chromium } from "playwright";
import logEvent from "../utils/logger.js";

const CONFIG = {
  headless: false, // Cambiar a true en producción cuando todo esté listo
  slowMo: 150,
  timeout: 60000,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runSofiaJob = async () => {
  const jobName = "SofiaAutomationJob";
  const startTime = Date.now();

  await logEvent({
    jobName,
    status: "STARTED",
    message: "Iniciando proceso de extracción/login en SOFIA...",
  });

  let browser;

  try {
    console.log("\n🚀 Iniciando navegador Playwright...\n");

    browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    });

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

    // =====================================
    // 1. LOGIN
    // =====================================
    console.log("🔐 Entrando a SOFIA...");
    await page.goto(process.env.SOFIA_URL, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("#registradoBox1");
    const iframeHandle = await page.$("#registradoBox1");
    const loginFrame = await iframeHandle.contentFrame();

    console.log("⌨️ Llenando credenciales...");
    await loginFrame.selectOption('select[name="select"]', "CC");
    await loginFrame.fill("#username", process.env.SOFIA_USER);
    await loginFrame.fill('input[name="josso_password"]', process.env.SOFIA_PASS);

    console.log("➡️ Iniciando sesión...");
    await loginFrame.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForSelector("#wrapper");
    console.log("✅ Login exitoso");
    await sleep(4000);

    // =====================================
    // 2. ROL: GESTIÓN DESARROLLO CURRICULAR (Value 17)
    // =====================================
    console.log("\n🎭 Seleccionando rol Gestión Desarrollo Curricular...\n");

    const selectRol = page.locator('select[id*="seleccionRol:roles"]').first();
    await selectRol.waitFor({ state: "visible", timeout: 10000 });
    await selectRol.selectOption("17");

    await sleep(4000);
    console.log("✅ Rol seleccionado con éxito");

    // =====================================
    // 3. DESPLEGAR ÁRBOLES DE MENÚS
    // =====================================
    console.log("\n📂 Desplegando árbol de navegación...");

    console.log("  -> Nivel 1: Gestión de Ambientes");
    await page.locator('span.menuPrimario', { hasText: 'Gestión de Ambientes' }).click();
    await sleep(1500);

    console.log("  -> Nivel 2: Gestion Ambientes");
    await page.locator('a', { hasText: 'Gestion Ambientes' }).click();
    await sleep(1500);

    console.log("  -> Nivel 3: Gestión de Planeación y Programación");
    await page.locator('a', { hasText: 'Gestión de Planeación y Programación' }).click();
    await sleep(1500);

    console.log("  -> Opción Final: Gestión Programación de Ambientes");
    await page.locator('a[id="722211Opcion"]').click();

    await sleep(5000);

    // =====================================
    // 4. ENGANCHAR IFRAME CONTENIDO
    // =====================================
    const frameContenido = page.frames().find((f) => f.name() === "contenido");

    if (!frameContenido) {
      throw new Error("❌ No se encontró el iframe 'contenido' principal.");
    }

    console.log("\n✅ IFRAME CONTENIDO DETECTADO:", frameContenido.url());

    // =====================================
    // 5. APERTURA DEL MODAL BÚSQUEDA DE FICHA
    // =====================================
    console.log("\n🔢 Iniciando flujo de selección por FICHA DE CARACTERIZACIÓN...");
    const botonAbrirModalFicha = frameContenido
      .locator('a[id="modalProgramacionAmbiente:fichaFormacionOLK"]')
      .first();

    await botonAbrirModalFicha.waitFor({ state: "visible", timeout: 15000 });
    await botonAbrirModalFicha.click();
    console.log("✅ Click en el botón de consulta de Ficha ejecutado.");

    // =====================================
    // 6. ENGANCHAR IFRAME DEL MODAL DE FICHAS
    // =====================================
    console.log("⏳ Esperando que cargue el iframe del modal de fichas...");

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

    console.log("✅ ¡Iframe de Ficha enganchado con éxito!");

    // =====================================
    // 7. BÚSQUEDA Y LLENADO DE LA FICHA EN EL MODAL
    // =====================================
    console.log("⌨️ Escribiendo código de la ficha...");
    const codigoFicha = process.env.SOFIA_FICHA || "3139319";

    const inputCodigoFicha = verdaderoFrameFicha
      .locator('input[id*="codigoFichaITX"], input[id*="codigoFicha"]')
      .first();

    await inputCodigoFicha.waitFor({ state: "visible", timeout: 10000 });
    await inputCodigoFicha.fill(codigoFicha);
    console.log(`✅ Código escrito en el modal: "${codigoFicha}"`);

    console.log("🔍 Dando click al botón Consultar de la ficha...");
    const botonConsultarFicha = verdaderoFrameFicha
      .locator('input[type="submit"][value*="Consultar"], input[id*="btnSearch"], a[id*="btnSearch"]')
      .first();

    await botonConsultarFicha.click();
    await sleep(3000);

    // =====================================
    // 8. SELECCIONAR LA FICHA DE LA TABLA DE RESULTADOS
    // =====================================
    console.log("📊 Seleccionando el resultado de la ficha...");

    const botonSeleccionarFicha = verdaderoFrameFicha
      .locator('table tbody tr a[id*="cmdlnkShow"], table tbody tr a[id*="select"]')
      .first();

    await botonSeleccionarFicha.waitFor({ state: "visible", timeout: 10000 });
    await botonSeleccionarFicha.click();

    console.log("✅ Ficha seleccionada exitosamente y cargada en el formulario.");
    await sleep(4000);

    // Cerrar el navegador limpiamente al terminar el ciclo
    await browser.close();

    const duration = Date.now() - startTime;
    await logEvent({
      jobName,
      status: "COMPLETED",
      message: `Proceso de SOFIA para la ficha ${codigoFicha} finalizado exitosamente.`,
      executionTimeMs: duration,
    });

  } catch (error) {
    if (browser) await browser.close();

    const duration = Date.now() - startTime;
    await logEvent({
      jobName,
      status: "FAILED",
      message: `Error en proceso SOFIA: ${error.message}`,
      details: { stack: error.stack },
      executionTimeMs: duration,
    });
  }
};

export default runSofiaJob;