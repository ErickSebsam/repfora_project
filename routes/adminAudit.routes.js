/**
 * RUTA DE ADMINISTRACIÓN DE AUDITORÍA — uso interno
 * Requiere token JWT de super admin (?token=xxx)
 */
import express from 'express';
import { getCurrentAuditState } from '../services/currentAuditStateService.js';
import { generateResumenSedeXLSX, generateResumenPorCoordinacionZIP } from '../services/excelExportService.js';
import CurrentAuditState from '../models/CurrentAuditState.js';
import { sendMissingGradesReport, getEmailStatus } from '../services/notificationService.js';
import AppSettings from '../models/AppSettings.js';
import webToken from '../middlewares/webToken.js';

const router = express.Router();
const { validateTokenSuper } = webToken;

router.use(async (req, res, next) => {
  try {
    const token = req.query.token || req.headers['token'];
    await validateTokenSuper(token);
    next();
  } catch (err) {
    res.status(401).send('No autorizado: ' + err.message);
  }
});

// ─── HTML ─────────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildHTML());
});

// ─── API internas (sin token) ─────────────────────────────────────────────────

/** Estado y resumen del run más reciente */
router.get('/api/resumen', async (req, res) => {
  try {
    const state = await getCurrentAuditState();
    if (!state.runs?.length) {
      return res.json({ ok: false, msg: 'Sin ejecuciones todavía' });
    }
    const latest = state.runs[0];
    const fichas = latest.fichesSummary || [];
    const stats = {
      totalFichas: fichas.length,
      fichasConSnc: fichas.filter(f => f.estadoGeneral !== 'AL DÍA').length,
      fichasAlDia: fichas.filter(f => f.estadoGeneral === 'AL DÍA').length,
      rapsTotal: fichas.reduce((s, f) => s + (f.rapsTotal || 0), 0),
      rapsSncParcial: fichas.reduce((s, f) => s + (f.sncParcial || 0), 0),
      rapsSncCritico: fichas.reduce((s, f) => s + (f.sncCritico || 0), 0),
      rapsSinProgramar: fichas.reduce((s, f) => s + (f.sinProgramar || 0), 0),
      totalRuns: state.runs.length
    };
    res.json({ ok: true, fichas, stats, executionDate: latest.executionDate });
  } catch (e) {
    res.status(500).json({ ok: false, msg: e.message });
  }
});

/** Descarga Excel */
router.get('/api/excel', async (req, res) => {
  try {
    const state = await getCurrentAuditState();
    if (!state.runs?.length) return res.status(404).send('Sin datos');

    const latest = state.runs[0];
    const buffer = await generateResumenSedeXLSX({
      fichesSummary: latest.fichesSummary || [],
      executionDate: latest.executionDate,
      runNumber:     state.runs.length,
      pendientes:    latest.pendientes || [],
      vencidos:      latest.vencidos   || [],
    });

    const fecha = new Date(latest.executionDate).toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="resumen-${fecha}.xlsx"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

/** Descarga ZIP con un Excel por coordinación + el general */
router.get('/api/excel/zip', async (req, res) => {
  try {
    const state = await getCurrentAuditState();
    if (!state.runs?.length) return res.status(404).send('Sin datos');

    const latest = state.runs[0];
    const zipBuffer = await generateResumenPorCoordinacionZIP({
      fichesSummary: latest.fichesSummary || [],
      executionDate: latest.executionDate,
      runNumber:     state.runs.length,
      pendientes:    latest.pendientes || [],
      vencidos:      latest.vencidos   || [],
    });

    const fecha = new Date(latest.executionDate).toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="resumen-coordinaciones-${fecha}.zip"`);
    res.send(zipBuffer);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

/** Comparación entre los 2 últimos runs */
router.get('/api/comparacion', async (req, res) => {
  try {
    const doc = await CurrentAuditState.findOne();
    if (!doc || doc.runs.length < 2) {
      return res.json({ ok: false, msg: doc?.runs?.length === 1 ? 'Solo hay 1 ejecución registrada' : 'Sin ejecuciones' });
    }
    const [latest, previous] = doc.runs;
    const latestMap = new Map((latest.fichesSummary || []).map(f => [f.ficheNumber, f]));
    const previousMap = new Map((previous.fichesSummary || []).map(f => [f.ficheNumber, f]));
    const allKeys = new Set([...latestMap.keys(), ...previousMap.keys()]);
    const detalle = [];
    for (const ficheNumber of allKeys) {
      const curr = latestMap.get(ficheNumber);
      const prev = previousMap.get(ficheNumber);
      if (!curr) { detalle.push({ ficheNumber, cambio: 'RESUELTA', delta: 0, prev, curr: null }); continue; }
      if (!prev) { detalle.push({ ficheNumber, cambio: 'NUEVA', delta: 0, prev: null, curr }); continue; }
      const snc_curr = (curr.sncParcial || 0) + (curr.sncCritico || 0);
      const snc_prev = (prev.sncParcial || 0) + (prev.sncCritico || 0);
      const delta = snc_prev - snc_curr;
      detalle.push({ ficheNumber, cambio: delta > 0 ? 'MEJORÓ' : delta < 0 ? 'EMPEORÓ' : 'SIN CAMBIO', delta, prev, curr });
    }
    res.json({
      ok: true,
      fechaAnterior: previous.executionDate,
      fechaActual: latest.executionDate,
      resumen: {
        mejoraron: detalle.filter(d => d.cambio === 'MEJORÓ').length,
        empeoraron: detalle.filter(d => d.cambio === 'EMPEORÓ').length,
        sinCambio: detalle.filter(d => d.cambio === 'SIN CAMBIO').length,
        resueltas: detalle.filter(d => d.cambio === 'RESUELTA').length,
        nuevas: detalle.filter(d => d.cambio === 'NUEVA').length
      },
      detalle
    });
  } catch (e) {
    res.status(500).json({ ok: false, msg: e.message });
  }
});

/** Estado de email y configuración DB */
router.get('/api/email-status', async (req, res) => {
  try {
    const memStatus = getEmailStatus();
    const settings = await AppSettings.findOne().lean();
    res.json({
      ok: true,
      emailEnabledInMemory: memStatus.enabled,
      emailEnabledInDB: settings?.emailEnabled ?? 'sin registro',
      useTestRecipient: process.env.USE_TEST_RECIPIENT === 'true',
      testRecipient: process.env.TEST_MAIL_RECIPIENT || '(no configurado)',
      fromEmail: process.env.FROM_EMAIL || '(no configurado)',
      hasPassword: !!process.env.SECURY_EMAIL
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Envío directo de correo de prueba (sin ejecutar auditoría) */
router.post('/api/test-email', async (req, res) => {
  try {
    const result = await sendMissingGradesReport({
      instructor: {
        name: 'Usuario de Prueba REPFORA',
        email: process.env.USE_TEST_RECIPIENT === 'true'
          ? process.env.TEST_MAIL_RECIPIENT
          : process.env.FROM_EMAIL,
        emailpersonal: null
      },
      ficheNumber: 'TEST-001',
      pendingItems: [{
        outcomeText: 'TEST: Este es un correo de prueba del sistema REPFORA. Si lo recibiste, el SMTP funciona correctamente.',
        missingLearners: [{ name: 'Aprendiz de Prueba', document: '123456789' }],
        totalLearners: 5,
        isTotalMissing: false
      }],
      coordination: null
    });
    res.json({ ok: result.success, error: result.error || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Auditoría — REPFORA</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f0f2f5;color:#222;min-height:100vh}
  .topbar{background:#39A900;color:#fff;padding:12px 24px;display:flex;align-items:center;gap:16px;font-weight:700;font-size:18px}
  .topbar small{font-weight:400;font-size:12px;background:rgba(0,0,0,.2);padding:2px 8px;border-radius:10px}
  .container{max-width:1200px;margin:24px auto;padding:0 16px;display:grid;gap:20px}
  .card{background:#fff;border-radius:10px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  h2{font-size:16px;font-weight:700;margin-bottom:14px;color:#444;border-bottom:2px solid #39A900;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .15s}
  .btn:disabled{opacity:.5;cursor:not-allowed}
  .btn-green{background:#39A900;color:#fff}.btn-green:hover:not(:disabled){opacity:.85}
  .btn-blue{background:#0066cc;color:#fff}.btn-blue:hover:not(:disabled){opacity:.85}
  .btn-gray{background:#e0e0e0;color:#333}.btn-gray:hover:not(:disabled){opacity:.8}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:16px}
  .stat{background:#f7f7f7;border-radius:8px;padding:12px 14px;text-align:center;border-left:4px solid #ccc}
  .stat.green{border-color:#39A900}.stat.red{border-color:#dc3545}.stat.orange{border-color:#fd7e14}.stat.blue{border-color:#0066cc}.stat.gray{border-color:#aaa}
  .stat-val{font-size:28px;font-weight:700;line-height:1}.stat-lbl{font-size:11px;color:#666;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f0f2f5;padding:8px 10px;text-align:left;font-weight:700;font-size:12px;color:#555;border-bottom:2px solid #ddd}
  td{padding:7px 10px;border-bottom:1px solid #eee}
  tr:hover td{background:#f9f9f9}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
  .badge-green{background:#d4edda;color:#1a6830}.badge-red{background:#f8d7da;color:#721c24}.badge-orange{background:#ffeeba;color:#856404}.badge-gray{background:#e2e3e5;color:#383d41}
  .log{background:#1e1e1e;color:#d4d4d4;border-radius:8px;padding:14px;font-size:12px;font-family:monospace;max-height:260px;overflow-y:auto;white-space:pre-wrap;line-height:1.5}
  .spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .hidden{display:none}
  .tabs{display:flex;gap:4px;margin-bottom:16px}
  .tab{padding:6px 16px;border:none;background:#f0f2f5;border-radius:6px 6px 0 0;cursor:pointer;font-size:13px;font-weight:600}
  .tab.active{background:#fff;border-bottom:2px solid #39A900}
  .tab-panel{display:none}.tab-panel.active{display:block}
  .comp-badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
  .comp-mejoró{background:#d4edda;color:#1a6830}.comp-empeoró{background:#f8d7da;color:#721c24}
  .comp-resuelta{background:#cce5ff;color:#004085}.comp-nueva{background:#ffeeba;color:#856404}.comp-sin-cambio{background:#e2e3e5;color:#383d41}
</style>
</head>
<body>

<div class="topbar">
  ⚙ Admin Auditoría — REPFORA
  <small>acceso restringido · uso interno</small>
  <div style="flex:1"></div>
  <button class="btn btn-gray" onclick="testEmail()" id="btnTestEmail">✉ Test Email</button>
  <button class="btn btn-green" onclick="runDebugAudit()" id="btnDebug">▶ Ejecutar Auditoría (debug)</button>
  <button class="btn btn-blue" onclick="runFullAudit()" id="btnFull">⚡ Ejecutar Auditoría (producción)</button>
</div>

<div class="container">

  <!-- Estado de email -->
  <div class="card" id="cardEmailStatus" style="display:none">
    <h2>Estado del Sistema de Email</h2>
    <div id="emailStatusContent" style="font-size:13px;line-height:1.8"></div>
  </div>

  <!-- Log de ejecución -->
  <div class="card" id="cardLog" style="display:none">
    <h2>Log de ejecución <span id="logStatus"></span></h2>
    <div class="log" id="logBox"></div>
  </div>

  <!-- Stats + tabla -->
  <div class="card">
    <h2>
      Resumen Sede
      <div style="display:flex;gap:8px">
        <button class="btn btn-gray" onclick="loadResumen()" id="btnRefresh">↻ Actualizar</button>
        <a class="btn btn-green" id="btnExcel">↓ Excel General</a>
        <a class="btn btn-green" id="btnZip">↓ ZIP por Coordinación</a>
      </div>
    </h2>

    <div id="statsArea" class="stat-grid" style="display:none"></div>
    <div id="resumenMsg" style="color:#888;font-size:13px;padding:20px 0">Cargando…</div>

    <div class="tabs" id="tabsArea" style="display:none">
      <button class="tab active" onclick="switchTab('tabResumen',this)">Fichas</button>
      <button class="tab" onclick="switchTab('tabComp',this)">Comparación</button>
    </div>

    <div id="tabResumen" class="tab-panel active">
      <div id="tableArea"></div>
    </div>
    <div id="tabComp" class="tab-panel">
      <div id="compArea" style="color:#888;font-size:13px;padding:10px 0">Cargando comparación…</div>
    </div>
  </div>

</div>

<script>
const TOKEN = new URLSearchParams(location.search).get('token') || '';
const BASE = '/admin/audit/api';
const QTOKEN = TOKEN ? \`?token=\${TOKEN}\` : '';
let cronRunning = false;

// Inyectar token en los links de descarga
document.getElementById('btnExcel').href = \`/admin/audit/api/excel\${QTOKEN}\`;
document.getElementById('btnZip').href = \`/admin/audit/api/excel/zip\${QTOKEN}\`;

// ── Utilidades ────────────────────────────────────────────────────────────────
function log(msg, type='info') {
  const box = document.getElementById('logBox');
  const ts = new Date().toLocaleTimeString('es-CO');
  const color = type==='error'?'#f87171':type==='ok'?'#4ade80':'#d4d4d4';
  box.innerHTML += \`<span style="color:#888">\${ts}</span> <span style="color:\${color}">\${msg}</span>\\n\`;
  box.scrollTop = box.scrollHeight;
}

function setBusy(busy) {
  cronRunning = busy;
  document.getElementById('btnDebug').disabled = busy;
  document.getElementById('btnFull').disabled = busy;
  if (busy) {
    document.getElementById('cardLog').style.display = '';
    document.getElementById('logBox').innerHTML = '';
  }
}

function badge(estado) {
  const map = {'AL DÍA':'badge-green','SNC PARCIAL':'badge-orange','SNC CRÍTICO':'badge-red'};
  return \`<span class="badge \${map[estado]||'badge-gray'}">\${estado}</span>\`;
}

function compBadge(cambio, delta) {
  const cls = 'comp-' + cambio.toLowerCase().replace(' ','').replace('ó','o');
  const arrow = delta > 0 ? \`↓\${delta}\` : delta < 0 ? \`↑\${Math.abs(delta)}\` : '';
  return \`<span class="comp-badge \${cls}">\${cambio}\${arrow?' '+arrow:''}</span>\`;
}

// ── Test Email ────────────────────────────────────────────────────────────────
async function testEmail() {
  const statusDiv = document.getElementById('emailStatusContent');
  const card = document.getElementById('cardEmailStatus');
  card.style.display = '';
  statusDiv.textContent = 'Comprobando configuración y enviando email de prueba...';

  // Primero mostrar estado
  try {
    const sr = await fetch(BASE + '/email-status' + QTOKEN);
    const sd = await sr.json();
    let html = '<table style="border-collapse:collapse;width:100%">';
    const rows = [
      ['Email habilitado (memoria)', sd.emailEnabledInMemory ? '<span style="color:green">✓ true</span>' : '<span style="color:red">✗ false</span>'],
      ['Email habilitado (BD)', sd.emailEnabledInDB === true ? '<span style="color:green">✓ true</span>' : sd.emailEnabledInDB === false ? '<span style="color:red">✗ false — ¡AQUÍ ESTÁ EL PROBLEMA!</span>' : sd.emailEnabledInDB],
      ['USE_TEST_RECIPIENT', sd.useTestRecipient ? '<span style="color:green">✓ true</span>' : 'false'],
      ['Destinatario de prueba', sd.testRecipient],
      ['FROM_EMAIL', sd.fromEmail],
      ['SMTP Password', sd.hasPassword ? '<span style="color:green">✓ configurado</span>' : '<span style="color:red">✗ no configurado</span>'],
    ];
    rows.forEach(([k,v]) => {
      html += \`<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#555">\${k}</td><td>\${v}</td></tr>\`;
    });
    html += '</table>';
    statusDiv.innerHTML = html + '<p style="margin-top:12px;color:#888">Enviando correo de prueba...</p>';
  } catch(e) {
    statusDiv.textContent = 'Error consultando estado: ' + e.message;
  }

  // Enviar correo de prueba
  try {
    const r = await fetch(BASE + '/test-email' + QTOKEN, { method: 'POST' });
    const d = await r.json();
    const p = document.createElement('p');
    p.style.marginTop = '12px';
    p.style.fontWeight = '700';
    if (d.ok) {
      p.style.color = 'green';
      p.textContent = '✓ Correo de prueba enviado correctamente. Revisa tu bandeja (incluyendo SPAM).';
    } else {
      p.style.color = 'red';
      p.textContent = '✗ Error enviando correo: ' + (d.error || 'Error desconocido');
    }
    statusDiv.appendChild(p);
  } catch(e) {
    const p = document.createElement('p');
    p.style.color = 'red';
    p.textContent = '✗ Error: ' + e.message;
    statusDiv.appendChild(p);
  }
}

// ── Ejecutar auditoría DEBUG ──────────────────────────────────────────────────
async function runDebugAudit() {
  if (cronRunning) return;
  setBusy(true);
  document.getElementById('logStatus').textContent = '⏳ ejecutando…';
  log('Iniciando auditoría en modo DEBUG…');
  try {
    const r = await fetch(\`/api/cron/debug?skipEmail=false&skipMarkRated=true&skipSaveLog=false\${TOKEN ? '&token='+TOKEN : ''}\`);
    const data = await r.json();
    if (data.errors?.length) data.errors.forEach(e => log('[ERROR] ' + JSON.stringify(e), 'error'));
    const s = data.summary || {};
    log(\`Fichas procesadas: \${s.fichesProcessed||0} | Calificados: \${s.outcomesRated||0} | Pendientes: \${s.outcomesPending||0} | Vencidos: \${s.totalVencedOutcomes||0}\`, 'ok');
    document.getElementById('logStatus').textContent = '✓ completado';
    await loadResumen();
  } catch(e) {
    log('Error: ' + e.message, 'error');
    document.getElementById('logStatus').textContent = '✗ error';
  } finally {
    setBusy(false);
  }
}

// ── Ejecutar auditoría PRODUCCIÓN ─────────────────────────────────────────────
async function runFullAudit() {
  if (cronRunning) return;
  if (!confirm('¿Ejecutar auditoría completa en producción? Esto marcará RAPs como calificados y enviará correos.')) return;
  setBusy(true);
  document.getElementById('logStatus').textContent = '⏳ ejecutando…';
  log('Iniciando auditoría PRODUCCIÓN…');
  try {
    const r = await fetch(\`/api/cron?maxFiches=20\${TOKEN ? '&token='+TOKEN : ''}\`);
    const data = await r.json();
    log(JSON.stringify(data), 'ok');
    document.getElementById('logStatus').textContent = '✓ completado';
    await loadResumen();
  } catch(e) {
    log('Error: ' + e.message, 'error');
    document.getElementById('logStatus').textContent = '✗ error';
  } finally {
    setBusy(false);
  }
}

// ── Cargar resumen ────────────────────────────────────────────────────────────
async function loadResumen() {
  document.getElementById('resumenMsg').textContent = 'Cargando…';
  document.getElementById('statsArea').style.display = 'none';
  document.getElementById('tabsArea').style.display = 'none';
  try {
    const r = await fetch(BASE + '/resumen' + QTOKEN);
    const data = await r.json();
    if (!data.ok) {
      document.getElementById('resumenMsg').textContent = data.msg || 'Sin datos';
      return;
    }
    renderStats(data.stats);
    renderTable(data.fichas);
    document.getElementById('resumenMsg').style.display = 'none';
    document.getElementById('statsArea').style.display = '';
    document.getElementById('tabsArea').style.display = '';
    loadComparacion();
  } catch(e) {
    document.getElementById('resumenMsg').textContent = 'Error: ' + e.message;
  }
}

function renderStats(s) {
  const el = document.getElementById('statsArea');
  el.innerHTML = [
    ['Fichas analizadas', s.totalFichas, 'blue'],
    ['Fichas con SNC', s.fichasConSnc, 'red'],
    ['Fichas AL DÍA', s.fichasAlDia, 'green'],
    ['RAPs total', s.rapsTotal, 'gray'],
    ['SNC PARCIAL', s.rapsSncParcial, 'orange'],
    ['SNC CRÍTICO', s.rapsSncCritico, 'red'],
    ['SIN PROGRAMAR', s.rapsSinProgramar, 'gray'],
    ['Runs guardados', s.totalRuns, 'blue']
  ].map(([lbl, val, cls]) =>
    \`<div class="stat \${cls}"><div class="stat-val">\${val}</div><div class="stat-lbl">\${lbl}</div></div>\`
  ).join('');
}

function renderTable(fichas) {
  if (!fichas.length) {
    document.getElementById('tableArea').innerHTML = '<p style="color:#888;padding:16px 0">Sin fichas en este run.</p>';
    return;
  }
  const rows = fichas.map((f,i) => \`
    <tr>
      <td>\${i+1}</td>
      <td><strong>\${f.ficheNumber}</strong></td>
      <td style="max-width:300px;font-size:12px">\${(f.programName||'').toUpperCase()}</td>
      <td style="text-align:center">\${f.aprendicesActivos||0}</td>
      <td style="text-align:center">\${f.rapsTotal||0}</td>
      <td style="text-align:center;color:#1a6830;font-weight:700">\${f.alDia||0}</td>
      <td style="text-align:center">\${f.aunNoVence||0}</td>
      <td style="text-align:center;color:#856404;font-weight:700">\${f.sncParcial||0}</td>
      <td style="text-align:center;color:#721c24;font-weight:700">\${f.sncCritico||0}</td>
      <td style="text-align:center">\${f.sinProgramar||0}</td>
      <td>\${badge(f.estadoGeneral)}</td>
    </tr>\`).join('');
  document.getElementById('tableArea').innerHTML = \`
    <table>
      <thead>
        <tr>
          <th>#</th><th>FICHA</th><th>PROGRAMA</th>
          <th>AP. ACTIVOS</th><th>RAPs</th>
          <th>AL DÍA</th><th>AÚN NO VENCE</th>
          <th>SNC PARCIAL</th><th>SNC CRÍTICO</th>
          <th>SIN PROGRAMAR</th><th>ESTADO</th>
        </tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>\`;
}

// ── Comparación ───────────────────────────────────────────────────────────────
async function loadComparacion() {
  const el = document.getElementById('compArea');
  el.textContent = 'Cargando…';
  try {
    const r = await fetch(BASE + '/comparacion' + QTOKEN);
    const data = await r.json();
    if (!data.ok) { el.textContent = data.msg; return; }
    const s = data.resumen;
    const statsHtml = \`
      <div class="stat-grid" style="margin-bottom:16px">
        <div class="stat green"><div class="stat-val">\${s.mejoraron}</div><div class="stat-lbl">Mejoraron</div></div>
        <div class="stat red"><div class="stat-val">\${s.empeoraron}</div><div class="stat-lbl">Empeoraron</div></div>
        <div class="stat gray"><div class="stat-val">\${s.sinCambio}</div><div class="stat-lbl">Sin cambio</div></div>
        <div class="stat blue"><div class="stat-val">\${s.resueltas}</div><div class="stat-lbl">Resueltas</div></div>
        <div class="stat orange"><div class="stat-val">\${s.nuevas}</div><div class="stat-lbl">Nuevas</div></div>
      </div>
      <p style="font-size:12px;color:#888;margin-bottom:12px">
        Anterior: \${fmtDate(data.fechaAnterior)} → Actual: \${fmtDate(data.fechaActual)}
      </p>\`;
    const rows = data.detalle.map(d => \`
      <tr>
        <td><strong>\${d.ficheNumber}</strong></td>
        <td>\${compBadge(d.cambio, d.delta)}</td>
        <td style="text-align:center">\${d.delta > 0 ? '-'+d.delta : d.delta < 0 ? '+'+Math.abs(d.delta) : '—'}</td>
        <td style="text-align:center;color:#721c24">\${d.prev ? (d.prev.sncParcial||0)+(d.prev.sncCritico||0) : '—'}</td>
        <td style="text-align:center;color:#1a6830">\${d.curr ? (d.curr.sncParcial||0)+(d.curr.sncCritico||0) : '—'}</td>
      </tr>\`).join('');
    el.innerHTML = statsHtml + \`
      <table>
        <thead><tr><th>FICHA</th><th>CAMBIO</th><th>Δ SNC</th><th>SNC anterior</th><th>SNC actual</th></tr></thead>
        <tbody>\${rows}</tbody>
      </table>\`;
  } catch(e) {
    el.textContent = 'Error: ' + e.message;
  }
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'});
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function switchTab(panelId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  btn.classList.add('active');
}

// Cargar al iniciar
loadResumen();
</script>
</body>
</html>`;
}

export default router;
