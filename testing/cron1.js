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

  const botonSeleccionarFicha = verdaderoFrameFicha
    .locator('table tbody tr a[id*="cmdlnkShow"], table tbody tr a[id*="select"]')
    .first();

  await botonSeleccionarFicha.waitFor({ state: "visible", timeout: 10000 });
  await botonSeleccionarFicha.click();

  console.log("✅ Ficha seleccionada exitosamente y cargada en el formulario.");
  await sleep(4000);

  // =====================================
  // 9. CONSULTAR PROGRAMACIONES DE AMBIENTE
  // =====================================

  console.log("\n🔍 Dando clic al botón 'Consultar Programaciones'...");

  // El botón está dentro del frameContenido principal
  const btnConsultarProg = frameContenido
    .locator('input[id*="btnConsultarProgramaciones"]')
    .first();

  await btnConsultarProg.waitFor({ state: "visible", timeout: 15000 });
  await btnConsultarProg.click();

  console.log("✅ Clic en Consultar Programaciones ejecutado.");

  // =====================================
  // 10. SELECCIONAR "CREAR EVENTO" EN LA TABLA RESULTANTE
  // =====================================

  console.log("⏳ Esperando que cargue la tabla de 'Listado programaciones de Ambiente'...");

  // Esperamos que sea visible la tabla o la primera fila de la programación
  const botonCrearEvento = frameContenido
    .locator('table[id*="dtprogramacionesDeAmbiente"] img[alt="Crear Evento"], table[id*="dtprogramacionesDeAmbiente"] img[title="Crear Evento"]')
    .first();

  await botonCrearEvento.waitFor({ state: "visible", timeout: 20000 });

  console.log("👆 Dando clic en 'Crear Evento'...");
  await botonCrearEvento.click();
  console.log("✅ Clic en 'Crear Evento' ejecutado.");

  // =====================================
  // 11. ESPERAR Y RE-ENGANCHAR EL IFRAME RECARGADO
  // =====================================

  console.log("\n⏳ Esperando recarga de contenido del formulario de eventos...");

  // Damos un tiempo para que SOFIA procese el submit de JSF y actualice la URL del frame
  await sleep(5000);

  // Re-enganchamos o validamos el frame 'contenido' recargado
  const frameEvento = page.frames().find((f) => f.name() === "contenido");

  if (!frameEvento) {
    throw new Error("❌ No se encontró el iframe 'contenido' tras hacer clic en Crear Evento.");
  }

  console.log("✅ ¡Nuevo formulario de evento cargado en el iframe 'contenido'!");
  console.log("📌 URL actual del iframe:", frameEvento.url());

  // =====================================
  // 12. CONFIGURAR FECHAS DEL EVENTO (DATOS TEMPORALES)
  // =====================================

  // Por ahora dejamos estas fechas fijas como prueba.
  // Más adelante estas variables vendrán desde la base de datos de MongoDB.
  const fechaInicioPrueba = "01/07/2026";
  const fechaFinPrueba = "31/07/2026";

  console.log("\n📅 Asignando fechas al formulario del evento...");

  // --- FECHA DE INICIO ---
  console.log("  -> Limpiando y llenando Fecha de Inicio...");

  // Opción A: Clic en el botón oficial de limpiar de SOFIA
  const btnLimpiarInicio = frameEvento.locator(
    'a[id*="cmdlnkCleanFechaInicio"]'
  ).first();
  await btnLimpiarInicio.waitFor({ state: "visible", timeout: 10000 });
  await btnLimpiarInicio.click();
  await sleep(1000);

  // Escribir la nueva fecha de inicio
  const inputFechaInicio = frameEvento.locator('input[id="fechaInicioEvento"]');
  await inputFechaInicio.fill(fechaInicioPrueba);
  await inputFechaInicio.press("Tab"); // Notifica a los scripts de JSF el cambio
  console.log(`  ✅ Fecha de Inicio asignada: ${fechaInicioPrueba}`);

  // --- FECHA DE FIN ---
  console.log("  -> Limpiando y llenando Fecha de Fin...");

  // Clic en el botón oficial de limpiar fecha fin
  const btnLimpiarFin = frameEvento.locator(
    'a[id*="cmdlnkCleanfechaFinEvento"]'
  ).first();
  await btnLimpiarFin.waitFor({ state: "visible", timeout: 10000 });
  await btnLimpiarFin.click();
  await sleep(1000);

  // Escribir la nueva fecha fin
  const inputFechaFin = frameEvento.locator('input[id="fechaFinEvento"]');
  await inputFechaFin.fill(fechaFinPrueba);
  await inputFechaFin.press("Tab");
  console.log(`  ✅ Fecha Fin asignada: ${fechaFinPrueba}`);


  // =====================================
  // 13. DESCRIPCIÓN Y HORARIO DEL EVENTO (DATOS FIJOS)
  // =====================================

  // Configuración de prueba estática
  const eventoDatosPrueba = {
    descripcion: "Actividad de prueba - Desarrollo de software",
    dias: ["lunes", "miercoles", "viernes"], // Valores exactos como están en los checkboxes
    horaInicio: "18:30",
    horaFin: "21:30"
  };

  console.log("\n📝 Llenando descripción del evento...");
  const inputDescripcion = frameEvento.locator('#descripcionEvento');
  await inputDescripcion.waitFor({ state: "visible", timeout: 10000 });
  await inputDescripcion.fill(eventoDatosPrueba.descripcion);
  console.log(`  ✅ Descripción ingresada: "${eventoDatosPrueba.descripcion}"`);

  console.log("🗓️ Seleccionando días del horario...");
  for (const dia of eventoDatosPrueba.dias) {
    const checkboxDia = frameEvento.locator(`input[name="seleccionDiaHorario"][value="${dia}"]`);

    // Verificar si existe y marcarlo
    if (await checkboxDia.isVisible()) {
      if (!(await checkboxDia.isChecked())) {
        await checkboxDia.check();
      }
      console.log(`  -> Día marcado: ${dia}`);
    }
  }

  console.log("⏰ Asignando hora de inicio y fin...");

  // Hora de inicio
  const inputHoraInicio = frameEvento.locator('#horaInicio');
  await inputHoraInicio.fill(eventoDatosPrueba.horaInicio);
  await inputHoraInicio.press("Tab");

  // Hora fin
  const inputHoraFin = frameEvento.locator('#horaFin');
  await inputHoraFin.fill(eventoDatosPrueba.horaFin);
  await inputHoraFin.press("Tab");

  console.log(`  ✅ Horario configurado: ${eventoDatosPrueba.horaInicio} - ${eventoDatosPrueba.horaFin}`);

  // =====================================
  // 14. AGREGAR HORARIO
  // =====================================

  console.log("\n➕ Dando clic en 'Agregar horario'...");

  // Escuchador global de alertas dialog (JS confirm)
  page.on("dialog", async (dialog) => {
    console.log(`  ⚠️ Mensaje de alerta/confirmación detectado: "${dialog.message()}"`);
    await dialog.accept(); // Da clic en 'Aceptar' automáticamente
  });

  const btnAgregarHorario = frameEvento.locator(
    '#CrearEventoAmbienteResultadosAprendizaje\\:botonAgregarHorario'
  );

  await btnAgregarHorario.waitFor({ state: "visible", timeout: 10000 });
  await btnAgregarHorario.click();

  console.log("⏳ Esperando que SOFIA genere la grilla de horarios...");

  // FIX: Usamos .first() para que tome únicamente la TABLA PADRE contenedor de la grilla
  const tablaHorarios = frameEvento.locator('table[id*="dthorariosEvento"]').first();
  await tablaHorarios.waitFor({ state: "visible", timeout: 15000 });
  await sleep(2000); // Pausa para render completo de las filas

  // =====================================
  // 15. FILTRAR Y ELIMINAR DÍAS FESTIVOS NAVEGANDO POR PÁGINAS
  // =====================================

  const festivosPrueba = [
    "20/07/2026", // Ejemplo: Día de la Independencia (Página 1)
    "27/07/2026"  // Ejemplo: Festivo a fin de mes (Página 2)
  ];

  console.log("\n🧹 Revisando la grilla para eliminar días festivos...");

  // 1. Detectamos cuántas páginas hay contando los enlaces numéricos (idx1, idx2, etc.)
  const botonesPaginas = frameEvento.locator('a[id*="dsEventosidx"]');
  const cantidadPaginas = await botonesPaginas.count();

  // Si no encuentra números de página, asumimos que solo hay 1 página
  const totalPaginas = cantidadPaginas > 0 ? cantidadPaginas : 1;
  console.log(`📌 Se detectaron ${totalPaginas} página(s) en la tabla.`);

  // 2. Bucle guiado exactamente por el número de páginas detectadas
  for (let numPagina = 1; numPagina <= totalPaginas; numPagina++) {
    console.log(`\n📄 Procesando Página ${numPagina} de ${totalPaginas}...`);

    // Si no estamos en la página 1, le damos clic al número de página correspondiente
    if (numPagina > 1) {
      const enlacePagina = frameEvento.locator(`a[id*="dsEventosidx${numPagina}"]`);

      if (await enlacePagina.isVisible()) {
        console.log(`➡️ Navegando a la página ${numPagina}...`);
        await enlacePagina.click();
        await sleep(3000); // Esperamos la recarga AJAX de la tabla
      }
    }

    // 3. Leemos y limpiamos las filas de la página activa
    const filasHorario = frameEvento.locator(
      'tbody[id*="dthorariosEvento:tbody_element"] > tr'
    );

    const totalFilas = await filasHorario.count();
    console.log(`   📊 Sesiones en la página ${numPagina}: ${totalFilas}`);

    // Recorremos las filas de abajo hacia arriba en la página actual
    for (let i = totalFilas - 1; i >= 0; i--) {
      const fila = filasHorario.nth(i);
      const selectorFecha = fila.locator('span[id*="Horario_Fecha"]');

      if (await selectorFecha.isVisible()) {
        const fechaTexto = (await selectorFecha.innerText()).trim();

        if (festivosPrueba.includes(fechaTexto)) {
          console.log(`   🚨 DÍA FESTIVO DETECTADO: ${fechaTexto} (Fila ${i + 1})`);

          const btnEliminar = fila.locator('a[id*="cmdlnkDelete"] img[alt*="Eliminar"]').first();

          if (await btnEliminar.isVisible()) {
            console.log(`     🗑️ Eliminando sesión del ${fechaTexto}...`);
            await btnEliminar.click();

            // Espera obligatoria para el AJAX de RichFaces/JSF
            await sleep(3000);
            console.log(`     ✅ Sesión del ${fechaTexto} eliminada.`);
          }
        }
      }
    }
  }

  console.log("\n✨ Limpieza de festivos completada exitosamente.");
  await sleep(2000);

  console.log("\n⏸️ INSPECCIÓN ACTIVADA: Revisa la ventana de Chromium.\n");
  await page.pause();
}

iniciarSOFIA().catch((err) => {
  console.log("\n💀 ERROR GENERAL EN LA EJECUCIÓN\n");
  console.error(err);
});

