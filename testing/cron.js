import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({
    path: path.resolve(process.cwd(), '.env')
});

// =====================================
// CONFIG
// =====================================

const CONFIG = {
    headless: false,
    slowMo: 150,
    timeout: 60000
};

// =====================================
// HELPERS
// =====================================

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

async function screenshot(page, name) {

    const dir = './screenshots';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const file = `${dir}/${Date.now()}-${name}.png`;

    await page.screenshot({
        path: file,
        fullPage: true
    });

    console.log(`📸 Screenshot: ${file}`);
}

// =====================================
// MAIN
// =====================================

async function iniciarSOFIA() {

    console.log('\n🚀 Iniciando navegador...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 150,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox'
        ]
    });

    const context = await browser.newContext({
        viewport: {
            width: 1440,
            height: 900
        }
    });

    const page = await context.newPage();

    // =====================================
    // ANTI BOT
    // =====================================

    await page.addInitScript(() => {

        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

    });

    // =====================================
    // LOGIN
    // =====================================

    console.log('🔐 Entrando a SOFIA...');

    await page.goto(process.env.SOFIA_URL, {
        waitUntil: 'domcontentloaded'
    });

    await page.waitForSelector('#registradoBox1');

    const iframeHandle =
        await page.$('#registradoBox1');

    const loginFrame =
        await iframeHandle.contentFrame();

    console.log('⌨️ Llenando credenciales...');

    await loginFrame.selectOption(
        'select[name="select"]',
        'CC'
    );

    await loginFrame.fill(
        '#username',
        process.env.SOFIA_USER
    );

    await loginFrame.fill(
        'input[name="josso_password"]',
        process.env.SOFIA_PASS
    );

    console.log('➡️ Iniciando sesión...');

    await loginFrame
        .getByRole('button', {
            name: 'Ingresar'
        })
        .click();

    await page.waitForSelector('#wrapper');

    console.log('✅ Login exitoso');

    await screenshot(page, 'login');

    // =====================================
    // ESPERA
    // =====================================

    await sleep(6000);

    // =====================================
    // ROL
    // =====================================

    console.log(
        '\n👤 Seleccionando Gestor de Proyectos...\n'
    );

    await page.selectOption(
        'select#seleccionRol\\:roles',
        '34'
    );

    await sleep(8000);

    console.log('✅ Rol seleccionado');

    await screenshot(page, 'rol');

    // =====================================
    // EXPANDIR MENÚ
    // =====================================

    console.log(
        '\n📂 Expandiendo Gestión de Ambientes\n'
    );

    const menuPadre = page.locator(
        'li:has(a:has-text("Gestión de Ambientes"))'
    ).first();

    await menuPadre.waitFor({
        state: 'visible',
        timeout: CONFIG.timeout
    });

    const anchorPadre =
        menuPadre.locator('a').first();

    await anchorPadre.click();

    console.log('✅ Menú expandido');

    await sleep(3000);

    await screenshot(
        page,
        'menu-expandido'
    );

    // =====================================
    // CLICK GESTION AMBIENTES
    // =====================================

    console.log(
        '\n📂 Click submenu Gestion Ambientes\n'
    );

    const gestionAmbientes =
        page.locator(
            'a:visible',
            {
                hasText: 'Gestion Ambientes'
            }
        ).last();

    await gestionAmbientes.waitFor({
        state: 'visible',
        timeout: CONFIG.timeout
    });

    await gestionAmbientes.click();

    console.log(
        '✅ Click Gestion Ambientes realizado'
    );

    // =====================================
    // ESPERAR CARGA
    // =====================================

    await sleep(10000);

    await screenshot(
        page,
        'gestion-ambientes'
    );

    // =====================================
    // FRAMES
    // =====================================

    console.log('\n🧠 FRAMES:\n');

    page.frames().forEach((frame, index) => {

        console.log(`[${index}]`);

        console.log(
            `NAME: ${frame.name()}`
        );

        console.log(
            `URL : ${frame.url()}`
        );

        console.log('----------------');
    });

    // =====================================
    // FRAME CONTENIDO
    // =====================================

    const frame =
        page.frames().find(frame =>
            frame.name() === 'contenido'
        );

    if (!frame) {

        console.log(
            '❌ No se encontró iframe contenido'
        );

        await page.pause();

        return;
    }

    console.log(
        '\n✅ IFRAME CONTENIDO DETECTADO'
    );

    console.log(frame.url());

    // =====================================
    // CLICK GESTIÓN PROGRAMACIÓN
    // =====================================

    console.log(
        '\n📂 Entrando a Gestión Programación de Ambientes\n'
    );

    const programacion =
        page.locator('a', {
            hasText: 'Gestión Programación de Ambientes'
        }).first();

    await programacion.waitFor({
        state: 'visible',
        timeout: CONFIG.timeout
    });

    await screenshot(
        page,
        'antes-programacion'
    );

    await programacion.click();

    console.log(
        '✅ Click Gestión Programación realizado'
    );

    // =====================================
    // ESPERAR CARGA DEL IFRAME
    // =====================================

    await sleep(10000);

    // =====================================
    // FRAME ACTUALIZADO
    // =====================================

    const frameActualizado =
        page.frames().find(frame =>
            frame.name() === 'contenido'
        );

    console.log('\n🧠 NUEVA URL FRAME:\n');

    console.log(frameActualizado?.url());

    // =====================================
    // SCREENSHOT FINAL
    // =====================================

    await screenshot(
        page,
        'gestion-programacion'
    );

    // =====================================
    // INSPECCIÓN
    // =====================================

    console.log(
        '\n⏸️ INSPECCIÓN ACTIVADA\n'
    );

    await page.pause();
}

iniciarSOFIA().catch(err => {

    console.log('\n💀 ERROR GENERAL\n');

    console.error(err);

});