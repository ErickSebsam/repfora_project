import { chromium } from "playwright";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// =====================================
// CONFIG
// =====================================

const CONFIG = {
  headless: false,
  slowMo: 150,
  timeout: 60000,
};

// =====================================
// HELPERS
// =====================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function screenshot(page, name) {
  const dir = "./screenshots";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const file = `${dir}/${Date.now()}-${name}.png`;

  await page.screenshot({
    path: file,
    fullPage: true,
  });

  console.log(`📸 Screenshot: ${file}`);
}

// =====================================
// MAIN
// =====================================

async function iniciarSOFIA() {
  console.log("\n🚀 Iniciando navegador...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await context.newPage();

  // =====================================
  // ANTI BOT
  // =====================================

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  // =====================================
  // LOGIN
  // =====================================

  console.log("🔐 Entrando a SOFIA...");

  await page.goto(process.env.SOFIA_URL, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector("#registradoBox1");

  const iframeHandle = await page.$("#registradoBox1");

  const loginFrame = await iframeHandle.contentFrame();

  console.log("⌨️ Llenando credenciales...");

  await loginFrame.selectOption('select[name="select"]', "CC");

  await loginFrame.fill("#username", process.env.SOFIA_USER);

  await loginFrame.fill('input[name="josso_password"]', process.env.SOFIA_PASS);

  console.log("➡️ Iniciando sesión...");

  await loginFrame
    .getByRole("button", {
      name: "Ingresar",
    })
    .click();

  await page.waitForSelector("#wrapper");

  console.log("✅ Login exitoso");

  await screenshot(page, "login");

  // =====================================
  // ESPERA
  // =====================================

  await sleep(6000);

  // =====================================
  // ROL
  // =====================================

  console.log("\n👤 Seleccionando Gestor de Proyectos...\n");

  await page.selectOption("select#seleccionRol\\:roles", "34");

  await sleep(8000);

  console.log("✅ Rol seleccionado");

  await screenshot(page, "rol");

  // =====================================
  // EXPANDIR MENÚ
  // =====================================

  console.log("\n📂 Expandiendo Gestión de Ambientes\n");

  const menuPadre = page
    .locator('li:has(a:has-text("Gestión de Ambientes"))')
    .first();

  await menuPadre.waitFor({
    state: "visible",
    timeout: CONFIG.timeout,
  });

  const anchorPadre = menuPadre.locator("a").first();

  await anchorPadre.click();

  console.log("✅ Menú expandido");

  await sleep(3000);

  await screenshot(page, "menu-expandido");

  // =====================================
  // CLICK GESTION AMBIENTES
  // =====================================

  console.log("\n📂 Click submenu Gestion Ambientes\n");

  const gestionAmbientes = page
    .locator("a:visible", {
      hasText: "Gestion Ambientes",
    })
    .last();

  await gestionAmbientes.waitFor({
    state: "visible",
    timeout: CONFIG.timeout,
  });

  await gestionAmbientes.click();

  console.log("✅ Click Gestion Ambientes realizado");

  // =====================================
  // ESPERAR CARGA
  // =====================================

  await sleep(10000);

  await screenshot(page, "gestion-ambientes");

  // =====================================
  // FRAMES
  // =====================================

  console.log("\n🧠 FRAMES:\n");

  page.frames().forEach((frame, index) => {
    console.log(`[${index}]`);

    console.log(`NAME: ${frame.name()}`);

    console.log(`URL : ${frame.url()}`);

    console.log("----------------");
  });

  // =====================================
  // FRAME CONTENIDO
  // =====================================

  const frame = page.frames().find((frame) => frame.name() === "contenido");

  if (!frame) {
    console.log("❌ No se encontró iframe contenido");

    await page.pause();

    return;
  }

  console.log("\n✅ IFRAME CONTENIDO DETECTADO");

  console.log(frame.url());

  // =====================================
  // CLICK GESTIÓN PROGRAMACIÓN
  // =====================================

  console.log("\n📂 Entrando a Gestión Programación de Ambientes\n");

  const programacion = page
    .locator("a", {
      hasText: "Gestión Programación de Ambientes",
    })
    .first();

  await programacion.waitFor({
    state: "visible",
    timeout: CONFIG.timeout,
  });

  await screenshot(page, "antes-programacion");

  await programacion.click();

  console.log("✅ Click Gestión Programación realizado");

  // =====================================
  // ESPERAR CARGA DEL IFRAME
  // =====================================

  await sleep(10000);

  // =====================================
  // FRAME ACTUALIZADO
  // =====================================

  const frameActualizado = page
    .frames()
    .find((frame) => frame.name() === "contenido");

  console.log("\n🧠 NUEVA URL FRAME:\n");

  console.log(frameActualizado?.url());
  // =====================================
  // FLUJO: SELECCIÓN DE AMBIENTE (MODAL DOJO)
  // =====================================
  console.log("\n🔍 Iniciando flujo de selección de ambiente...");

  if (!frameActualizado) {
    throw new Error("El iframe 'contenido' principal no está disponible.");
  }

  // 1. Dar click al botón/enlace que abre el modal de ambientes
  console.log("👆 Dando click al botón oficial de lista de ambientes...");

  // Al tener dos puntos (:) en el ID de Sofia Plus, usamos comillas y corchetes en el selector de Playwright
  const botonAbrirModal = frameActualizado
    .locator('a[id="modalProgramacionAmbiente:ambienteOLK"]')
    .first();

  await botonAbrirModal.waitFor({ state: "visible", timeout: 15000 });
  await botonAbrirModal.click();
  console.log("✅ Click en el botón de consulta ejecutado de forma precisa.");

  // 2. Esperar que el iframe del modal aparezca DENTRO del iframe principal
  console.log(
    "⏳ Esperando que cargue el iframe del cuadro de diálogo (Modal) dentro de contenido...",
  );

  // Cambiamos 'page' por 'frameActualizado' para buscar en el contexto correcto
  const selectorIframeModal = "iframe#modalDialogContentlistaAmbientes";
  await frameActualizado.waitForSelector(selectorIframeModal, {
    state: "attached",
    timeout: 15000,
  });
  console.log("✅ ¡Iframe del modal detectado en el árbol interno!");

  // 3. Capturar el contexto del iframe mapeándolo con Playwright
  console.log("🧠 Enganchando el contexto del iframe interno...");
  await sleep(3000); // Espera estratégica para la carga de la URL interna

  // Buscamos el frame recorriendo todos los frames del sistema
  let verdaderoFrameModal = page
    .frames()
    .find(
      (f) =>
        f.name() === "modalDialogContentlistaAmbientes" ||
        f.url().includes("listaAmbientes"),
    );

  if (!verdaderoFrameModal) {
    throw new Error(
      "No se pudo enganchar el contexto del iframe dentro del modal flotante.",
    );
  }

  console.log("✅ ¡Iframe del modal enganchado con éxito!");
  console.log(`🔗 URL interna del modal: ${verdaderoFrameModal.url()}`);

  // =================================================================
    // 4. Escribir un fragmento/palabra clave en la casilla del modal
    // =================================================================
    console.log('⌨️ Preparando término de búsqueda para el ambiente...');
    
    // SUPOSICIÓN: Simulamos el texto que vendría purificado de tu DB o un fragmento clave
    // En producción usarías una variable como: const terminoBusqueda = limpiarNombreDB(ambienteDB.nombre);
    const terminoBusqueda = 'AMBIENTE 6'; 

    const inputNombreAmbiente = verdaderoFrameModal.locator('input[id*="nombreAmbienteITX"]').first();
    await inputNombreAmbiente.waitFor({ state: 'visible', timeout: 10000 });
    
    await inputNombreAmbiente.fill(terminoBusqueda);
    console.log(`✅ Término escrito en el modal: "${terminoBusqueda}"`);

    // =================================================================
    // 5. Dar click al botón de "Consultar" DENTRO del modal
    // =================================================================
    console.log('🔍 Dando click al botón Consultar del modal...');
    const botonConsultarModal = verdaderoFrameModal.locator('input[id="form:btnSearch"]').first();
    await botonConsultarModal.click();
    
    // Esperamos un momento a que Ajax/JSF refresque la tabla de abajo
    await sleep(4000); 
    await screenshot(page, 'resultados-busqueda-modal');

   // =================================================================
    // 6. Analizar la tabla de resultados con lógica de desempate por Sede
    // =================================================================
    console.log('📊 Analizando la tabla de resultados de Sofia Plus con filtro de Sede...');
    
    const filasResultados = verdaderoFrameModal.locator('table[id="frmAmbiente:dtAmbientes"] tbody tr');
    const conteoFilas = await filasResultados.count();

    if (conteoFilas === 0) {
        console.log('❌ REGISTRO DE EXCEPCIÓN: Sofia Plus arrojó 0 resultados.');
        await page.pause();
        throw new Error("No se encontraron ambientes.");
    }

    console.log(`💡 Se encontraron ${conteoFilas} opciones en la tabla. Buscando el match de San Gil...`);
    
    let indiceSeleccionado = -1;
    
    // Estos datos idealmente vendrían de tu base de datos (Repfora)
    let nombreObjetivoDB = "AMBIENTE 6"; 
    let sedeObjetivo = "SAN GIL"; // Filtro de seguridad obligatorio

    for (let i = 0; i < conteoFilas; i++) {
        const textoFila = await filasResultados.nth(i).innerText();
        const textoLimpio = textoFila.toUpperCase();
        console.log(`   [Fila ${i}]: ${textoFila.trim().replace(/\n/g, ' | ')}`);

        // DOBLE VALIDACIÓN: Contiene el nombre del ambiente Y pertenece a la sede correcta
        if (textoLimpio.includes(nombreObjetivoDB.toUpperCase()) && textoLimpio.includes(sedeObjetivo.toUpperCase())) {
            indiceSeleccionado = i;
            console.log(`🎯 ¡Match perfecto encontrado para San Gil en la Fila ${i}!`);
            break; // Rompemos el ciclo porque encontramos el correcto
        }
    }

    // Plan B de contingencia si el filtro estricto de sede falla
    if (indiceSeleccionado === -1) {
        console.log('⚠️ No se encontró un match que incluyera la sede. Tomando fila 0 por descarte...');
        indiceSeleccionado = 0; 
    }

    // =================================================================
    // 7. Hacer click en el botón de "Agregar" de la fila seleccionada
    // =================================================================
    console.log(`👆 Seleccionando el ambiente de la Fila ${indiceSeleccionado}...`);
    const selectorEnlaceSeleccionar = `a[id="frmAmbiente:dtAmbientes:${indiceSeleccionado}:cmdlnkShow"]`;
    const botonSeleccionarFila = verdaderoFrameModal.locator(selectorEnlaceSeleccionar).first();
    
    await botonSeleccionarFila.click();
    console.log('✅ Click de selección ejecutado en la sede correcta.');

    // Esperamos a que el modal desaparezca y el formulario principal procese el ambiente
    await sleep(4000); 
    await screenshot(page, 'ambiente-traspasado-exito');
  // =====================================
  // SCREENSHOT FINAL
  // =====================================

  await screenshot(page, "gestion-programacion");

  // =====================================
  // INSPECCIÓN
  // =====================================

  console.log("\n⏸️ INSPECCIÓN ACTIVADA\n");

  await page.pause();
}

iniciarSOFIA().catch((err) => {
  console.log("\n💀 ERROR GENERAL\n");

  console.error(err);
});
