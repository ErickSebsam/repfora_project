import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const extraerContactoSofia = async () => {
    console.log('[SOFIA] Iniciando navegador...');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 150
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log('[SOFIA] Conectando a Sofia Plus...');
    await page.goto(process.env.SOFIA_URL);
    await page.waitForLoadState('domcontentloaded');

    console.log('[SOFIA] Buscando formulario de ingreso...');
    await page.waitForSelector('#registradoBox1', { timeout: 60000 });

    const iframeHandle = await page.$('#registradoBox1');
    const loginFrame = await iframeHandle.contentFrame();

    console.log('[SOFIA] Llenando credenciales de acceso...');
    await loginFrame.waitForSelector('input#username');
    await loginFrame.selectOption('select[name="select"]', 'CC');
    await loginFrame.fill('input#username', process.env.SOFIA_USER);
    await loginFrame.fill('input[name="josso_password"]', process.env.SOFIA_PASS);

    console.log('[SOFIA] Presionando botón ingresar...');
    try {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 35000 }),
            loginFrame.getByRole('button', { name: 'Ingresar' }).click()
        ]);
    } catch (navError) {
        console.log('[⚠️ NOTA] Esperando estabilización de la interfaz...');
    }

    await page.waitForTimeout(4000);

    const loggedIn = await page.locator('#wrapper').isVisible();
    if (!loggedIn) {
        console.error('[❌ ERROR] No se pudo acceder al panel principal.');
        await browser.close();
        return;
    }

    console.log('[SOFIA] Sesión iniciada correctamente.');

    // ==========================================================
    // PASO 2: NAVEGACIÓN
    // ==========================================================
    console.log('\n=========================================');
    console.log('[🚀 NAVEGACIÓN] Iniciando ruta hacia Datos de Contacto...');
    console.log('=========================================');

    try {
        // 1. Abrir el menú "Registro"
        console.log('[SOFIA] Desplegando menú "Registro"...');
        const menuRegistro = page.locator('a:has-text("Registro"), li:has-text("Registro")').first();
        await menuRegistro.waitFor({ state: 'visible', timeout: 10000 });
        await menuRegistro.click();
        await page.waitForTimeout(2000);

        // Captura para ver qué cargó después del click
        await page.screenshot({ path: 'testing/despues-registro.png' });

        // 2. Detectar si el submenú está en un iframe
        const iframeMenuHandle = await page.$('iframe[name="contenido"], frame[name="contenido"]');
        let marco = page;
        if (iframeMenuHandle) {
            console.log('[SOFIA] Iframe detectado, cambiando contexto...');
            marco = await iframeMenuHandle.contentFrame();
        }

        // 3. Buscar submenú dentro del iframe o página
        console.log('[SOFIA] Buscando submenú "Registros Persona"...');
        const subMenuPersona = page.locator('a:has-text("Registro Persona")').first();
        await subMenuPersona.waitFor({ state: 'visible', timeout: 10000 });
        await subMenuPersona.click();
        await page.waitForTimeout(1500);

        // 4. Click en "Contacto"
        console.log('[SOFIA] Haciendo clic en "Contacto"...');
        const opcionContacto = page.locator('a[id="927Opcion"]').first();
        await opcionContacto.waitFor({ state: 'visible', timeout: 10000 });
        await opcionContacto.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'testing/pantalla-contacto.png' });
        console.log('[SOFIA] Screenshot guardado!');

        // 5. Entrar al iframe "contenido" donde carga el formulario
        console.log('[SOFIA] Entrando al iframe del formulario...');
        const iframeContenido = await page.$('iframe#contenido');
        const frameFormulario = await iframeContenido.contentFrame();

        // 6. Extraer el teléfono móvil
        console.log('[SOFIA] Extrayendo teléfono móvil...');
        const inputTelefono = frameFormulario.locator('input#Contacto\\:datosContactoTelefonoMovilIT');
        await inputTelefono.waitFor({ state: 'visible', timeout: 10000 });
        const telefono = await inputTelefono.inputValue();

        console.log('\n=========================================');
        console.log(`📞 Teléfono móvil: ${telefono}`);
        console.log('=========================================\n');
    } catch (errorNavegacion) {
        console.error('[❌ ERROR EN NAVEGACIÓN]:', errorNavegacion.message);
        await page.screenshot({ path: 'testing/error-navegacion-contacto.png' });
    }

    await page.waitForTimeout(3000);
    await browser.close();
};

extraerContactoSofia().catch(console.error);