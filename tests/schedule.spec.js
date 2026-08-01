// @ts-check
import { test } from '@playwright/test';

test('REGISTRO EXISTOSO DE PROGRAMACIÓN SIN ADVERTENCIAS (previsualizar & guardar)', async ({ page }) => {

  /* 
  Los datos de la programación son:
  Ficha: 2834402 - GESTION INTEGRAL DEL TRANSPORTE
  Competencia: 38558 - Ejercer derechos fundamentales del trabajo en el marco de la constitució
  Resultado: 565301 - Valorar la importancia de la ciudadanía laboral con base en el estudio
  Instructor: YASMIN DIAZ CHACON
  Nota: test
  Observación: test
  Ambiente: AMBIENTE VIRTUAL 73
  Fecha Inicio: 2023/10/01
  Fecha Fin: 2023/10/31
  Hora inicio: 06:30
  Hora fin: 12:29
  Días: Lunes, Viernes
  */
 

  await page.goto('http://localhost:5173/#/');
  await page.getByText('CONSULTORRol').click();
  await page.getByRole('option', { name: 'ADMINISTRADOR' }).locator('div').nth(2).click();
  await page.getByLabel('Usuario').click();
  await page.getByLabel('Usuario').fill('test@test.com');
  await page.getByLabel('Contraseña').click();
  await page.getByLabel('Contraseña').fill('123Admin');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.locator('div:nth-child(7) > .q-card > a > .q-card__actions > .q-btn').click();
  await page.getByRole('button', { name: 'VER' }).first().click();
  await page.getByRole('link', { name: 'add_circle Crear' }).click();
  await page.locator('div').filter({ hasText: /^Ficha$/ }).first().click();
  await page.getByText('2834402 - GESTION INTEGRAL DEL TRANSPORTE').click();
  await page.getByLabel('Competencia').click();
  await page.getByText('38558 - Ejercer derechos fundamentales del trabajo en el marco de la constitució').click();
  await page.getByLabel('Resultado').click();
  await page.getByText('565301 - Valorar la importancia de la ciudadanía laboral con base en el estudio ').click();
  await page.locator('div').filter({ hasText: /^Instructor$/ }).first().click();
  await page.getByRole('option', { name: 'YASMIN DIAZ CHACON' }).locator('div').nth(2).click();
  await page.getByLabel('Nota').click();
  await page.getByLabel('Nota').fill('test');
  await page.getByLabel('Observación').click();
  await page.getByLabel('Observación').fill('test');
  await page.locator('div').filter({ hasText: /^Ambiente$/ }).first().click();
  await page.getByRole('option', { name: 'AMBIENTE VIRTUAL 73' }).locator('div').nth(1).click();
  await page.getByLabel('Fecha Inicio').click();
  await page.getByLabel('Fecha Inicio').fill('2023/10/01');
  await page.getByLabel('Fecha Fin').click();
  await page.getByLabel('Fecha Fin').fill('2023/10/31');
  await page.getByLabel('Hora inicio').click();
  await page.getByLabel('Hora inicio').fill('06:30');
  await page.getByLabel('Hora fin').click();
  await page.getByLabel('Hora fin').fill('12:29');
  await page.getByLabel('Lunes', { exact: true }).click();
  await page.getByLabel('Viernes', { exact: true }).click();
  await page.getByRole('button', { name: 'calendar_month PREVISUALIZAR' }).click();
  await page.getByRole('button', { name: 'save GUARDAR' }).click();
  await page.getByText('Programación guardada correctamente').click();
});




test('REGISTRO DENEGADO POR FALTA DE FECHAS DE LA FICHA (prev & guardar)', async ({ page }) => {

  /* 
  Los datos de la programación son:
  Ficha: 2452895 - GESTION CONTABLE Y DE INFORMACION FINANCIERA
  Competencia: 38027 - ELABORAR INFORMES FINANCIEROS DE ACUERDO CON METODOLOGÍAS Y NORMATIVA
  Resultado: 560683 - ELABORAR LOS INFORMES FINANCIEROS SEGÚN POLÍTICAS CONTABLES Y NORMATIVA.
  Instructor: YASMIN DIAZ CHACON
  Nota: test
  Observación: test
  Ambiente: AMBIENTE VIRTUAL 73
  Fecha Inicio: 2023/10/01
  Fecha Fin: 2023/10/31
  Hora inicio: 06:30
  Hora fin: 12:29
  Días: Lunes, Viernes
  */
 

  await page.goto('http://localhost:5173/#/');
  await page.getByText('CONSULTORRol').click();
  await page.getByRole('option', { name: 'ADMINISTRADOR' }).locator('div').nth(2).click();
  await page.getByLabel('Usuario').click();
  await page.getByLabel('Usuario').fill('test@test.com');
  await page.getByLabel('Contraseña').click();
  await page.getByLabel('Contraseña').fill('123Admin');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.locator('div:nth-child(7) > .q-card > a > .q-card__actions > .q-btn').click();
  await page.getByRole('button', { name: 'VER' }).first().click();
  await page.getByRole('link', { name: 'add_circle Crear' }).click();
  await page.locator('div').filter({ hasText: /^Ficha$/ }).first().click();
  await page.getByText('2452895 - GESTION CONTABLE Y DE INFORMACION FINANCIERA').click();
  await page.getByLabel('Competencia').click();
  await page.getByText('38027 - ELABORAR INFORMES FINANCIEROS DE ACUERDO CON METODOLOGÍAS Y NORMATIVA').click();
  await page.getByLabel('Resultado').click();
  await page.getByText('560683 - ELABORAR LOS INFORMES FINANCIEROS SEGÚN POLÍTICAS CONTABLES Y NORMATIVA.').click();
  await page.locator('div').filter({ hasText: /^Instructor$/ }).first().click();
  await page.getByRole('option', { name: 'YASMIN DIAZ CHACON' }).locator('div').nth(2).click();
  await page.getByLabel('Nota').click();
  await page.getByLabel('Nota').fill('test');
  await page.getByLabel('Observación').click();
  await page.getByLabel('Observación').fill('test');
  await page.locator('div').filter({ hasText: /^Ambiente$/ }).first().click();
  await page.getByRole('option', { name: 'AMBIENTE VIRTUAL 73' }).locator('div').nth(1).click();
  await page.getByLabel('Fecha Inicio').click();
  await page.getByLabel('Fecha Inicio').fill('2023/10/01');
  await page.getByLabel('Fecha Fin').click();
  await page.getByLabel('Fecha Fin').fill('2023/10/31');
  await page.getByLabel('Hora inicio').click();
  await page.getByLabel('Hora inicio').fill('06:30');
  await page.getByLabel('Hora fin').click();
  await page.getByLabel('Hora fin').fill('12:29');
  await page.getByLabel('Lunes', { exact: true }).click();
  await page.getByLabel('Viernes', { exact: true }).click();
  await page.getByRole('button', { name: 'calendar_month PREVISUALIZAR' }).click();
  await page.getByText('La ficha no tiene fechas de etapa lectiva, por favor actualice la ficha').click();
 
});


test('REGISTRO DENEGADO POR FECHAS FUERA DEL RANGO DE FECHAS DE LA FICHA (prev & guardar)', async ({ page }) => {

  /* 
  Los datos de la programación son:
  Ficha: 2824216 - ANALISIS Y DESARROLLO DE SOFTWARE. (ADSO)
  Competencia: 37371 - UTILIZAR HERRAMIENTAS INFORMÁTICAS DE ACUERDO CON LAS NECESIDADES DE MANEJO DE INFORMACIÓN
  Resultado: 593152 - OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.
  Instructor: YASMIN DIAZ CHACON
  Nota: test
  Observación: test
  Ambiente: AMBIENTE VIRTUAL 73
  Fecha Inicio: 2023/10/01
  Fecha Fin: 2023/10/31
  Hora inicio: 06:30
  Hora fin: 12:29
  Días: Lunes, Viernes
  */
 

  await page.goto('http://localhost:5173/#/');
  await page.getByText('CONSULTORRol').click();
  await page.getByRole('option', { name: 'ADMINISTRADOR' }).locator('div').nth(2).click();
  await page.getByLabel('Usuario').click();
  await page.getByLabel('Usuario').fill('test@test.com');
  await page.getByLabel('Contraseña').click();
  await page.getByLabel('Contraseña').fill('123Admin');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.locator('div:nth-child(7) > .q-card > a > .q-card__actions > .q-btn').click();
  await page.getByRole('button', { name: 'VER' }).first().click();
  await page.getByRole('link', { name: 'add_circle Crear' }).click();
  await page.locator('div').filter({ hasText: /^Ficha$/ }).first().click();
  await page.getByText('2824216 - ANALISIS Y DESARROLLO DE SOFTWARE. (ADSO)').click();
  await page.getByLabel('Competencia').click();
  await page.getByText('37371 - UTILIZAR HERRAMIENTAS INFORMÁTICAS DE ACUERDO CON LAS NECESIDADES DE MANEJO DE INFORMACIÓN').click();
  await page.getByLabel('Resultado').click();
  await page.getByText('593152 - OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.').click();
  await page.locator('div').filter({ hasText: /^Instructor$/ }).first().click();
  await page.getByRole('option', { name: 'YASMIN DIAZ CHACON' }).locator('div').nth(2).click();
  await page.getByLabel('Nota').click();
  await page.getByLabel('Nota').fill('test');
  await page.getByLabel('Observación').click();
  await page.getByLabel('Observación').fill('test');
  await page.locator('div').filter({ hasText: /^Ambiente$/ }).first().click();
  await page.getByRole('option', { name: 'AMBIENTE VIRTUAL 73' }).locator('div').nth(1).click();
  await page.getByLabel('Fecha Inicio').click();
  await page.getByLabel('Fecha Inicio').fill('2023/12/15');
  await page.getByLabel('Fecha Fin').click();
  await page.getByLabel('Fecha Fin').fill('2024/05/05');
  await page.getByLabel('Hora inicio').click();
  await page.getByLabel('Hora inicio').fill('06:30');
  await page.getByLabel('Hora fin').click();
  await page.getByLabel('Hora fin').fill('12:29');
  await page.getByLabel('Lunes', { exact: true }).click();
  await page.getByLabel('Viernes', { exact: true }).click();
  await page.getByRole('button', { name: 'calendar_month PREVISUALIZAR' }).click();
  await page.getByText('Las fechas deben estar dentro del rango de fechas de la etapa lectiva de la ficha').click();
  // await page.getByRole('button', { name: 'save GUARDAR' }).click();
 
});


test('REGISTRO DENEGADO POR AMBIENTE YA PROGRAMADO EN ESAS MISMAS FECHAS (previsualizar & guardar)', async ({ page }) => {

  /* 
  Los datos de la programación son:
  Ficha: 2824216 - ANALISIS Y DESARROLLO DE SOFTWARE. (ADSO)
  Competencia: 37371 - UTILIZAR HERRAMIENTAS INFORMÁTICAS DE ACUERDO CON LAS NECESIDADES DE MANEJO DE INFORMACIÓN
  Resultado: 593152 - OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.
  Instructor: YASMIN DIAZ CHACON
  Nota: test
  Observación: test
  Ambiente: AMBIENTE VIRTUAL 73
  Fecha Inicio: 2023/10/15
  Fecha Fin: 2023/10/31
  Hora inicio: 06:30
  Hora fin: 12:29
  Días: Lunes, Viernes
  */
 

  await page.goto('http://localhost:5173/#/');
  await page.getByText('CONSULTORRol').click();
  await page.getByRole('option', { name: 'ADMINISTRADOR' }).locator('div').nth(2).click();
  await page.getByLabel('Usuario').click();
  await page.getByLabel('Usuario').fill('test@test.com');
  await page.getByLabel('Contraseña').click();
  await page.getByLabel('Contraseña').fill('123Admin');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.locator('div:nth-child(7) > .q-card > a > .q-card__actions > .q-btn').click();
  await page.getByRole('button', { name: 'VER' }).first().click();
  await page.getByRole('link', { name: 'add_circle Crear' }).click();
  await page.locator('div').filter({ hasText: /^Ficha$/ }).first().click();
  await page.getByText('2824216 - ANALISIS Y DESARROLLO DE SOFTWARE. (ADSO)').click();
  await page.getByLabel('Competencia').click();
  await page.getByText('37371 - UTILIZAR HERRAMIENTAS INFORMÁTICAS DE ACUERDO CON LAS NECESIDADES DE MANEJO DE INFORMACIÓN').click();
  await page.getByLabel('Resultado').click();
  await page.getByText('593152 - OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.').click();
  await page.locator('div').filter({ hasText: /^Instructor$/ }).first().click();
  await page.getByRole('option', { name: 'YASMIN DIAZ CHACON' }).locator('div').nth(2).click();
  await page.getByLabel('Nota').click();
  await page.getByLabel('Nota').fill('test');
  await page.getByLabel('Observación').click();
  await page.getByLabel('Observación').fill('test');
  await page.locator('div').filter({ hasText: /^Ambiente$/ }).first().click();
  await page.getByRole('option', { name: 'AMBIENTE VIRTUAL 73' }).locator('div').nth(1).click();
  await page.getByLabel('Fecha Inicio').click();
  await page.getByLabel('Fecha Inicio').fill('2023/10/15');
  await page.getByLabel('Fecha Fin').click();
  await page.getByLabel('Fecha Fin').fill('2023/11/05');
  await page.getByLabel('Hora inicio').click();
  await page.getByLabel('Hora inicio').fill('06:30');
  await page.getByLabel('Hora fin').click();
  await page.getByLabel('Hora fin').fill('12:29');
  await page.getByLabel('Lunes', { exact: true }).click();
  await page.getByLabel('Viernes', { exact: true }).click();
  await page.getByRole('button', { name: 'calendar_month PREVISUALIZAR' }).click();
  await page.getByText('El ambiente está programado en las fechas').click();
  await page.getByRole('button', { name: 'save GUARDAR' }).click();
  await page.getByText('El ambiente ya está programado en la fecha:').click();
 
});




test('REGISTRO DENEGADO POR INSTRUCTOR YA PROGRAMADO EN ESAS MISMAS FECHAS Y MISMO HORARIO EN OTRA FICHA Y OTRO AMBIENTE (previsualizar & guardar)', async ({ page }) => {

  /* 
  Los datos de la programación son:
  Ficha: 2769726 - MANTENIMIENTO Y REPARACION DE EDIFICACIONES
  Competencia: 39638 - Pintar superficie de acuerdo con procedimiento y ficha técnica
  Resultado: 624263 - DETECTAR LOS DAÑOS DE LA SUPERFICIE A INTERVENIR SEGÚN ESPECIFICACIONES TÉCNICAS
  Instructor: YASMIN DIAZ CHACON
  Nota: test
  Observación: test
  Ambiente: AMBIENTE VIRTUAL 70
  Fecha Inicio: 2023/10/01
  Fecha Fin: 2023/10/31
  Hora inicio: 06:30
  Hora fin: 12:29
  Días: Lunes, Viernes
  */
 

  await page.goto('http://localhost:5173/#/');
  await page.getByText('CONSULTORRol').click();
  await page.getByRole('option', { name: 'ADMINISTRADOR' }).locator('div').nth(2).click();
  await page.getByLabel('Usuario').click();
  await page.getByLabel('Usuario').fill('test@test.com');
  await page.getByLabel('Contraseña').click();
  await page.getByLabel('Contraseña').fill('123Admin');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.locator('div:nth-child(7) > .q-card > a > .q-card__actions > .q-btn').click();
  await page.getByRole('button', { name: 'VER' }).first().click();
  await page.getByRole('link', { name: 'add_circle Crear' }).click();
  await page.locator('div').filter({ hasText: /^Ficha$/ }).first().click();
  await page.getByText('2769726 - MANTENIMIENTO Y REPARACION DE EDIFICACIONES').click();
  await page.getByLabel('Competencia').click();
  await page.getByText('39638 - Pintar superficie de acuerdo con procedimiento y ficha técnica').click();
  await page.getByLabel('Resultado').click();
  await page.getByText('624263 - DETECTAR LOS DAÑOS DE LA SUPERFICIE A INTERVENIR SEGÚN ESPECIFICACIONES TÉCNICAS').click();
  await page.locator('div').filter({ hasText: /^Instructor$/ }).first().click();
  await page.getByRole('option', { name: 'YASMIN DIAZ CHACON' }).locator('div').nth(2).click();
  await page.getByLabel('Nota').click();
  await page.getByLabel('Nota').fill('test');
  await page.getByLabel('Observación').click();
  await page.getByLabel('Observación').fill('test');
  await page.locator('div').filter({ hasText: /^Ambiente$/ }).first().click();
  await page.getByRole('option', { name: 'AMBIENTE VIRTUAL 70' }).locator('div').nth(1).click();
  await page.getByLabel('Fecha Inicio').click();
  await page.getByLabel('Fecha Inicio').fill('2023/10/15');
  await page.getByLabel('Fecha Fin').click();
  await page.getByLabel('Fecha Fin').fill('2023/11/05');
  await page.getByLabel('Hora inicio').click();
  await page.getByLabel('Hora inicio').fill('06:30');
  await page.getByLabel('Hora fin').click();
  await page.getByLabel('Hora fin').fill('12:29');
  await page.getByLabel('Lunes', { exact: true }).click();
  await page.getByLabel('Viernes', { exact: true }).click();
  await page.getByRole('button', { name: 'calendar_month PREVISUALIZAR' }).click();
  await page.getByText('El instructor tiene programación en las fechas').click();
  await page.getByRole('button', { name: 'save GUARDAR' }).click();
  await page.getByText('El instructor ya está programado en la fecha').click();
 
});


test('REGISTRO CORRECTO POR INSTRUCTOR YA PROGRAMADO EN ESAS MISMAS FECHAS PERO DIFERENTE HORARIO Y DIFERENTE FICHA Y AMBIENTE (previsualizar & guardar)', async ({ page }) => {

  /* 
  Los datos de la programación son:
Ficha: 2824216 - ANALISIS Y DESARROLLO DE SOFTWARE. (ADSO)
  Competencia: 37371 - UTILIZAR HERRAMIENTAS INFORMÁTICAS DE ACUERDO CON LAS NECESIDADES DE MANEJO DE INFORMACIÓN
  Resultado: 593152 - OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.
  Instructor: YASMIN DIAZ CHACON
  Nota: test
  Observación: test
  Ambiente: AMBIENTE VIRTUAL 70
  Fecha Inicio: 2023/10/01
  Fecha Fin: 2023/10/31
  Hora inicio: 06:30
  Hora fin: 12:29
  Días: Lunes, Viernes
  */
 

  await page.goto('http://localhost:5173/#/');
  await page.getByText('CONSULTORRol').click();
  await page.getByRole('option', { name: 'ADMINISTRADOR' }).locator('div').nth(2).click();
  await page.getByLabel('Usuario').click();
  await page.getByLabel('Usuario').fill('test@test.com');
  await page.getByLabel('Contraseña').click();
  await page.getByLabel('Contraseña').fill('123Admin');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.locator('div:nth-child(7) > .q-card > a > .q-card__actions > .q-btn').click();
  await page.getByRole('button', { name: 'VER' }).first().click();
  await page.getByRole('link', { name: 'add_circle Crear' }).click();
  await page.locator('div').filter({ hasText: /^Ficha$/ }).first().click();
  await page.getByText('2824216 - ANALISIS Y DESARROLLO DE SOFTWARE. (ADSO)').click();
  await page.getByLabel('Competencia').click();
  await page.getByText('37371 - UTILIZAR HERRAMIENTAS INFORMÁTICAS DE ACUERDO CON LAS NECESIDADES DE MANEJO DE INFORMACIÓN').click();
  await page.getByLabel('Resultado').click();
  await page.getByText('593152 - OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.').click();
  await page.locator('div').filter({ hasText: /^Instructor$/ }).first().click();
  await page.getByRole('option', { name: 'YASMIN DIAZ CHACON' }).locator('div').nth(2).click();
  await page.getByLabel('Nota').click();
  await page.getByLabel('Nota').fill('test');
  await page.getByLabel('Observación').click();
  await page.getByLabel('Observación').fill('test');
  await page.locator('div').filter({ hasText: /^Ambiente$/ }).first().click();
  await page.getByRole('option', { name: 'AMBIENTE VIRTUAL 70' }).locator('div').nth(1).click();
  await page.getByLabel('Fecha Inicio').click();
  await page.getByLabel('Fecha Inicio').fill('2023/10/15');
  await page.getByLabel('Fecha Fin').click();
  await page.getByLabel('Fecha Fin').fill('2023/11/05');
  await page.getByLabel('Hora inicio').click();
  await page.getByLabel('Hora inicio').fill('12:30');
  await page.getByLabel('Hora fin').click();
  await page.getByLabel('Hora fin').fill('18:29');
  await page.getByLabel('Lunes', { exact: true }).click();
  await page.getByLabel('Viernes', { exact: true }).click();
  await page.getByRole('button', { name: 'calendar_month PREVISUALIZAR' }).click();
  await page.getByRole('button', { name: 'save GUARDAR' }).click();
  await page.getByText('Programación guardada correctamente').click();
 
});




