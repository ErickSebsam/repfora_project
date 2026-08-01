import html2pdf from "html2pdf.js"

// ─── Paleta suave alineada al proyecto ────────────────────────────────────────
const C = {
  headerBg:   "#2e7d32",   // verde medio — encabezado secciones
  headerText: "#ffffff",
  accent:     "#43a047",   // verde acento
  labelBg:    "#f1f8e9",   // verde muy suave — fondo labels
  stripeBg:   "#fafffe",   // casi blanco verdoso — filas alternas
  border:     "#c8e6c9",   // borde suave
  cardBg:     "#ffffff",
  text:       "#1a1a1a",
  sub:        "#5c6b5f",
  noteBg:     "#f5f5f5",
  noteBorder: "#66bb6a",
}

// ─── Convierte imagen pública a base64 para html2canvas ──────────────────────
async function toBase64(url) {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result)
      r.readAsDataURL(blob)
    })
  } catch { return "" }
}

// ─── CSS del documento ────────────────────────────────────────────────────────
const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: ${C.text};
    line-height: 1.5;
  }
  .wrap { max-width: 760px; margin: 0 auto; padding: 18px 22px; }

  /* ── Encabezado institucional ── */
  .inst-header {
    display: flex;
    align-items: center;
    border: 2px solid ${C.border};
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .inst-texts {
    flex: 1;
    padding: 12px 18px;
    border-right: 1.5px solid ${C.border};
    text-align: center;
    line-height: 1.65;
  }
  .inst-logo {
    width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 10px;
  }
  .inst-logo img { width: 68px; height: auto; }
  .inst-meta {
    background: ${C.labelBg};
    padding: 5px 18px;
    font-size: 10.5px;
    border-top: 1px solid ${C.border};
    display: flex;
    justify-content: space-between;
  }

  /* ── Secciones ── */
  .section {
    page-break-inside: avoid;
    margin-bottom: 14px;
    border: 1.5px solid ${C.border};
    border-radius: 8px;
    overflow: hidden;
  }
  .section-title {
    background: ${C.headerBg};
    color: ${C.headerText};
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.9px;
    padding: 7px 14px;
  }
  .section-body { padding: 0; }

  /* ── Tabla de datos ── */
  .dt { width: 100%; border-collapse: collapse; }
  .dt td { padding: 6px 12px; border-bottom: 1px solid ${C.border}; vertical-align: top; }
  .dt tr:last-child td { border-bottom: none; }
  .dt tr:nth-child(even) td { background: ${C.stripeBg}; }
  .lbl { font-weight: 600; color: ${C.headerBg}; width: 34%; background: ${C.labelBg} !important; font-size: 11px; }
  .val { font-size: 12px; color: ${C.text}; }

  /* ── Tabla 2 columnas ── */
  .dt2 { width: 100%; border-collapse: collapse; }
  .dt2 td { padding: 6px 10px; border-bottom: 1px solid ${C.border}; border-right: 1px solid ${C.border}; vertical-align: top; }
  .dt2 tr:last-child td { border-bottom: none; }
  .dt2 tr:nth-child(even) td { background: ${C.stripeBg}; }
  .lbl2 { font-weight: 600; color: ${C.headerBg}; width: 18%; background: ${C.labelBg} !important; font-size: 11px; }
  .val2 { font-size: 12px; width: 32%; }

  /* ── Requisitos ── */
  .req-grid { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 12px; }
  .req-item {
    flex: 0 0 calc(50% - 3px);
    display: flex;
    align-items: flex-start;
    gap: 6px;
    background: ${C.labelBg};
    border: 1px solid ${C.border};
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 11px;
    line-height: 1.4;
  }
  .req-icon { color: ${C.accent}; font-size: 13px; flex-shrink: 0; margin-top: 1px; }

  /* ── Sesiones ── */
  .sess-wrap { display: flex; gap: 8px; padding: 10px 12px; }
  .sess-col { flex: 1; }
  .sess-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .sess-table th {
    background: ${C.headerBg};
    color: white;
    padding: 5px 6px;
    text-align: center;
    font-size: 10px;
    border: 1px solid #1b5e20;
  }
  .sess-table td {
    text-align: center;
    padding: 4px 6px;
    border: 1px solid ${C.border};
    font-size: 11px;
  }
  .sess-table tr:nth-child(even) td { background: ${C.stripeBg}; }
  .sess-total {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 6px 14px 10px;
    font-size: 11.5px;
    font-weight: 600;
  }
  .sess-total span { color: ${C.sub}; }
  .sess-total strong { color: ${C.headerBg}; }

  /* ── Firmas ── */
  .firmas { display: flex; gap: 20px; padding: 16px 20px; }
  .firma-box { flex: 1; text-align: center; }
  .firma-line { border-bottom: 1.5px solid #555; height: 50px; margin-bottom: 6px; }
  .firma-label { font-size: 11px; font-weight: 600; color: ${C.headerBg}; }

  /* ── Nota legal ── */
  .nota {
    background: ${C.noteBg};
    border-left: 4px solid ${C.noteBorder};
    border-radius: 0 6px 6px 0;
    padding: 8px 14px;
    font-size: 10px;
    color: ${C.sub};
    line-height: 1.5;
    margin-top: 14px;
  }
`

// ─── Helpers de sección ────────────────────────────────────────────────────────
function sec(title, body) {
  return `<div class="section"><div class="section-title">${title}</div><div class="section-body">${body}</div></div>`
}

function dtRows(rows) {
  return `<table class="dt">${rows.map(([l, v]) =>
    `<tr><td class="lbl">${l}</td><td class="val">${v ?? "—"}</td></tr>`
  ).join("")}</table>`
}

function dt2Rows(rows) {
  const cells = rows.map(([l, v]) =>
    `<td class="lbl2">${l}</td><td class="val2">${v ?? "—"}</td>`
  )
  let html = `<table class="dt2">`
  for (let i = 0; i < cells.length; i += 2)
    html += `<tr>${cells[i]}${cells[i + 1] ?? "<td></td><td></td>"}</tr>`
  return html + "</table>"
}

function buildReqs(texto) {
  if (!texto) return `<p style="padding:10px 14px; color:#aaa; font-size:11px;">Sin requisitos registrados</p>`
  const items = texto.split(/[\n\t]+/).map(r => r.trim()).filter(Boolean)
  if (!items.length) return `<p style="padding:10px 14px; color:#aaa; font-size:11px;">Sin requisitos registrados</p>`
  return `<div class="req-grid">${items.map(r =>
    `<div class="req-item"><span class="req-icon">✓</span><span>${r}</span></div>`
  ).join("")}</div>`
}

function buildSessions(sesiones, durMax) {
  const total  = sesiones.reduce((s, x) => s + (x.totalHoras || 0), 0)
  const faltan = Math.max(0, (durMax || 0) - total)

  if (!sesiones.length)
    return `<p style="padding:10px 14px; color:#aaa; font-size:11px; text-align:center;">Sin sesiones programadas</p>`

  const mid = Math.ceil(sesiones.length / 2)
  const cols = [sesiones.slice(0, mid), sesiones.slice(mid)]

  function colHtml(arr, offset) {
    const rows = arr.map((s, i) => `<tr>
      <td>${offset + i + 1}</td>
      <td>${s.fecha || "—"}</td>
      <td>${s.horaInicio || "—"}</td>
      <td>${s.horaFin || "—"}</td>
      <td>${s.totalHoras || 0}</td>
    </tr>`).join("")
    return `<table class="sess-table">
      <thead><tr>
        <th style="width:8%">N°</th>
        <th style="width:28%">Fecha</th>
        <th style="width:20%">H. Inicio</th>
        <th style="width:20%">H. Fin</th>
        <th style="width:14%">Horas</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="5" style="color:#ccc;">—</td></tr>`}</tbody>
    </table>`
  }

  return `
    <div class="sess-wrap">
      <div class="sess-col">${colHtml(cols[0], 0)}</div>
      <div class="sess-col">${colHtml(cols[1], mid)}</div>
    </div>
    <div class="sess-total">
      <div><span>Total horas programadas: </span><strong>${total}</strong></div>
      <div><span style="color:${faltan > 0 ? '#e65100' : C.sub}">Faltan horas: </span>
           <strong style="color:${faltan > 0 ? '#e65100' : C.headerBg}">${faltan}</strong></div>
    </div>`
}

// ─── HTML completo ─────────────────────────────────────────────────────────────
function buildHtml(d, logoSrc) {
  const empresa = d.tipoPoblacion === "Empresa" ? sec("DATOS DE LA EMPRESA", dt2Rows([
    ["Nombre empresa",  d.nombreEmpresa],
    ["NIT",            d.nitEmpresa],
    ["Contacto",       d.contactoEmpresa],
    ["Teléfono",       d.telefonoEmpresa],
  ])) : ""

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${css}</style></head><body><div class="wrap">

    <!-- Encabezado institucional -->
    <div class="inst-header">
      <div class="inst-texts">
        <div style="font-size:14px;font-weight:800;color:${C.headerBg};">SERVICIO NACIONAL DE APRENDIZAJE SENA</div>
        <div style="font-size:12px;font-weight:700;color:${C.headerBg};">SISTEMA INTEGRADO DE GESTIÓN Y AUTOCONTROL SIGA</div>
        <div style="font-size:12px;font-weight:700;color:${C.headerBg};">PROCESO GESTIÓN DE FORMACIÓN PROFESIONAL INTEGRAL</div>
        <div style="font-size:11.5px;color:${C.sub};margin-top:2px;">Procedimiento Ingreso</div>
        <div style="margin-top:8px;font-size:13px;font-weight:700;color:${C.text};">Formato Inscripción Cursos Especiales</div>
        <div style="font-size:11.5px;color:${C.sub};">Documento de Apoyo No controlado N°1</div>
      </div>
      <div class="inst-logo">
        ${logoSrc ? `<img src="${logoSrc}" alt="SENA" />` : `<div style="font-size:24px;font-weight:900;color:${C.headerBg};">SENA</div>`}
      </div>
    </div>
    <div class="inst-meta">
      <span><strong>Fecha de registro:</strong> ${d.fechaRegistro || "—"} &nbsp;|&nbsp; <strong>Hora:</strong> ${d.horaRegistro || "—"}</span>
      <span><strong>Código:</strong> ${d.codigoSolicitud || "Pendiente"} &nbsp;|&nbsp; <strong>Ficha:</strong> ${d.fichaCaracterizacion || "Pendiente"}</span>
    </div>

    ${sec("CARACTERIZACIÓN DEL CURSO", dtRows([
      ["Código del curso",    d.prfCodigo],
      ["Denominación",       d.cursoDenominacion || d.prfCodigo],
      ["Versión",            d.prfVersion],
      ["Duración en horas",  d.prfDuracionMaxima],
    ]))}

    ${sec("DATOS DEL PROGRAMA", dt2Rows([
      ["Tipo de programa",   d.tipoPrograma],
      ["N° de aprendices",   d.numAprendices],
      ["Tipo de población",  d.tipoPoblacion],
      ["Proyecto asociado",  d.proyectoAsociado],
    ]))}

    ${sec("INSTRUCTOR", dt2Rows([
      ["Nombre",               d.nombreInstructor],
      ["Cédula",               d.cedulaInstructor],
      ["Teléfono",             d.telefonoInstructor],
      ["Correo institucional", d.correoInstructor],
      ["Correo personal",      d.correoPersonalInstructor],
      ["",                     ""],
    ]))}

    ${sec("UBICACIÓN", dtRows([
      ["Municipio",                d.municipio],
      ["Vereda / Corregimiento",   d.vereda],
      ["Dirección",                d.direccion],
    ]))}

    ${empresa}

    ${sec("FECHAS DEL PROGRAMA", dt2Rows([
      ["Fecha de inicio",        d.fechaInicio],
      ["Fecha de finalización",  d.fechaFin],
      ["Fecha de inscripción",   d.fechaInscripcion],
      ["Inicio matrícula",       d.inicioMatricula],
      ["Fin matrícula",          d.finMatricula],
    ]))}

    ${sec("REQUISITOS DE INGRESO", buildReqs(d.requisitosIngreso))}

    ${sec("FORMACIÓN", dtRows([
      ["Competencias",              d.competencias],
      ["Resultados de aprendizaje", d.resultadosAprendizaje],
      ["Actividad de aprendizaje",  d.actividadAprendizaje],
      ["Recursos necesarios",       d.recursosNecesarios],
    ]))}

    ${sec("PROGRAMACIÓN DE LA FICHA", buildSessions(d.sesiones || [], d.prfDuracionMaxima))}

    ${sec("AMBIENTE DE FORMACIÓN", dtRows([["Ambiente", d.ambienteFormacion]]))}

    ${sec("FIRMAS", `<div class="firmas">
      <div class="firma-box"><div class="firma-line"></div><div class="firma-label">Coordinador Académico</div></div>
      <div class="firma-box"><div class="firma-line"></div><div class="firma-label">Instructor(a)</div></div>
    </div>`)}

    <div class="nota">
      La firma de este formato refleja que se han validado los requisitos de idoneidad del instructor
      según el diseño curricular y la información del usuario según guía procedimiento de ingreso
      GFPI-G-025 (núm. 7.5)
    </div>

  </div></body></html>`
}

// ─── Exportar ─────────────────────────────────────────────────────────────────
export async function generateSolicitudPdf(data) {
  const logoSrc = await toBase64("/images/LOGO-SENA.png")

  const container = document.createElement("div")
  container.innerHTML = buildHtml(data, logoSrc)
  document.body.appendChild(container)

  const opt = {
    margin:      [0.3, 0.3, 0.3, 0.3],
    filename:    `Solicitud_${data.prfCodigo || "SC"}_${data.fechaRegistro || ""}.pdf`,
    image:       { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
    jsPDF:       { unit: "in", format: "letter", orientation: "portrait" },
    pagebreak:   { mode: ["avoid-all", "css"] },
  }

  try {
    const blobUrl = await html2pdf().from(container).set(opt).outputPdf("bloburl")
    window.open(blobUrl, "_blank")
  } finally {
    document.body.removeChild(container)
  }
}
