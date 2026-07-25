import { chromium } from "playwright";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const CONFIG = {
  headless: false,
  slowMo: 150,
  timeout: 60000,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function iniciarSOFIA() {
  console.log("\n🚀 Iniciando navegador...\n");

  const browser = await chromium.launch({
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
  await selectRol.selectOption("17"); // Rol Gestión Desarrollo Curricular

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
  
  await sleep(5000); // Espera a que recargue el iframe de contenido

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
  console.log("👆 Dando click al botón oficial de consulta de ficha (Lupa)...");

  // Botón con la lupa que abre la ventana de fichas según el HTML que me compartiste
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

  // Esperamos que se adjunte el iframe que abre la función listaFichas.show()
  await frameContenido.waitForSelector('iframe[id*="listaFichas"], iframe[id*="modalDialogContent"]', {
    state: "attached",
    timeout: 15000,
  });

  await sleep(3000);

  // Buscamos el contexto del frame cargado
  let verdaderoFrameFicha = page
    .frames()
    .find(
      (f) =>
        f.name().includes("listaFichas") ||
        f.url().includes("listaFichas") ||
        f.url().includes("ficha")
    );

  if (!verdaderoFrameFicha) {
    // Si no lo encuentra por URL/nombre específico, toma el último iframe generado dentro de la página
    const framesCount = page.frames().length;
    verdaderoFrameFicha = page.frames()[framesCount - 1];
  }

  console.log("✅ ¡Iframe de Ficha enganchado con éxito!");

  // =====================================
  // 7. BÚSQUEDA Y LLENADO DE LA FICHA EN EL MODAL
  // =====================================

  console.log("⌨️ Escribiendo código de la ficha...");
  
  const codigoFicha = process.env.SOFIA_FICHA || "3139319"; // Tu variable de ficha

  // Buscamos el input del modal (form:codigoFichaITX)
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

  // Damos click a la primera opción que arroje la búsqueda en la tabla del modal
  const botonSeleccionarFicha = verdaderoFrameFicha
    .locator('table tbody tr a[id*="cmdlnkShow"], table tbody tr a[id*="select"]')
    .first();

  await botonSeleccionarFicha.waitFor({ state: "visible", timeout: 10000 });
  await botonSeleccionarFicha.click();

  console.log("✅ Ficha seleccionada exitosamente y cargada en el formulario.");
  await sleep(4000);

  console.log("\n⏸️ INSPECCIÓN ACTIVADA: Verifica que la ficha haya quedado lista en el formulario.\n");
  await page.pause();
}

iniciarSOFIA().catch((err) => {
  console.log("\n💀 ERROR GENERAL EN LA EJECUCIÓN\n");
  console.error(err);
});

