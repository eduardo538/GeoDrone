// GeoDrone — Parte 4: Reportes en PDF y CSV
// Node.js, sin dependencias externas.
//
// Idea simple: el reporte NO vuelve a calcular nada.
// Recibe el JSON que ya devuelve calculateMeasurement() y lo
// convierte a CSV, a PDF y a HTML (para imprimir desde el celular).
//
//   measurementToCsv(measurement, meta)
//   validationToCsv(rows)          // rows: [{ parametro, unidad, referencia, geodrone }]
//   buildReportLines(measurement, meta, validationRows)
//   generatePdfBuffer(lines)       // Buffer, listo para guardar como .pdf
//   generateHtmlReport(measurement, meta, validationRows)
//
// En el celular (Expo) el PDF se genera con expo-print a partir
// del HTML, y el CSV se comparte con expo-sharing. Ver reports-mobile.js.

'use strict';

function fmt(n, decimals = 3) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '';
  return n.toFixed(decimals);
}

function csvCell(v) {
  const s = String(v ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells) {
  return cells.map(csvCell).join(',');
}

function defaultMeta(meta = {}) {
  return {
    proyecto: meta.proyecto || 'Terreno Experimental 01',
    ubicacion: meta.ubicacion || 'Tecnologico de Estudios Superiores de Jilotepec',
    responsable: meta.responsable || 'Eduardo',
    fecha: meta.fecha || new Date().toISOString().slice(0, 10),
    crs: meta.crs || 'EPSG:32614 (UTM 14N)',
    ...meta,
  };
}

// ---- CSV de una medición ------------------------------------------------

function measurementToCsv(measurement, meta = {}) {
  const m = defaultMeta(meta);
  const lines = [];
  lines.push(csvLine(['GeoDrone - Reporte de medicion']));
  lines.push(csvLine(['Proyecto', m.proyecto]));
  lines.push(csvLine(['Ubicacion', m.ubicacion]));
  lines.push(csvLine(['Responsable', m.responsable]));
  lines.push(csvLine(['Fecha', m.fecha]));
  lines.push(csvLine(['Sistema de coordenadas', m.crs]));
  lines.push(csvLine(['Tipo de medicion', measurement.type]));
  lines.push('');
  lines.push(csvLine(['Resultado', 'Valor', 'Unidad']));
  if (measurement.type === 'distance') {
    lines.push(csvLine(['Distancia', fmt(measurement.distance_m), 'm']));
  }
  if (measurement.type === 'area') {
    lines.push(csvLine(['Area', fmt(measurement.area_m2), 'm2']));
    lines.push(csvLine(['Area', fmt(measurement.area_ha, 6), 'ha']));
    lines.push(csvLine(['Perimetro', fmt(measurement.perimeter_m), 'm']));
  }
  if (measurement.type === 'perimeter') {
    lines.push(csvLine(['Perimetro', fmt(measurement.perimeter_m), 'm']));
  }
  if (measurement.type === 'height-difference') {
    lines.push(csvLine(['Diferencia de alturas', fmt(measurement.height_difference_m), 'm']));
    lines.push(csvLine(['Altura minima', fmt(measurement.height_min_m), 'm']));
    lines.push(csvLine(['Altura maxima', fmt(measurement.height_max_m), 'm']));
  }
  lines.push('');
  lines.push(csvLine(['Punto', 'Latitud', 'Longitud', 'X UTM (m)', 'Y UTM (m)']));
  (measurement.points_utm || []).forEach((p, i) => {
    lines.push(csvLine([i + 1, p.lat, p.lon, fmt(p.x), fmt(p.y)]));
  });
  return lines.join('\n') + '\n';
}

// ---- Validación: referencia vs GeoDrone ---------------------------------
// rows de entrada: [{ parametro: 'Longitud', unidad: 'm', referencia: 40, geodrone: 40.35 }]
// Devuelve las filas con diferencia y error % calculados.

function validationRows(rows) {
  return rows.map((r) => {
    const diferencia = r.geodrone - r.referencia;
    const errorPct = r.referencia !== 0 ? (Math.abs(diferencia) / Math.abs(r.referencia)) * 100 : 0;
    return {
      parametro: r.parametro,
      unidad: r.unidad || '',
      referencia: r.referencia,
      geodrone: r.geodrone,
      diferencia: Number(diferencia.toFixed(3)),
      error_pct: Number(errorPct.toFixed(3)),
    };
  });
}

function validationToCsv(rows) {
  const enriched = validationRows(rows);
  const lines = [];
  lines.push(csvLine(['GeoDrone - Validacion experimental']));
  lines.push(csvLine(['Parametro', 'Referencia', 'GeoDrone', 'Diferencia', 'Error (%)', 'Unidad']));
  enriched.forEach((r) => {
    lines.push(csvLine([r.parametro, r.referencia, r.geodrone, r.diferencia, r.error_pct, r.unidad]));
  });
  lines.push('');
  lines.push(csvLine(['Nota', 'La referencia es la medicion tradicional (cinta o estacion). Los valores de la propuesta son solo de ejemplo; aqui van los reales de campo.']));
  return lines.join('\n') + '\n';
}

// ---- Líneas de texto para el PDF ----------------------------------------

function buildReportLines(measurement, meta = {}, validation = []) {
  const m = defaultMeta(meta);
  const lines = [];
  lines.push('## GeoDrone - Reporte de medicion');
  lines.push(`Proyecto: ${m.proyecto}`);
  lines.push(`Ubicacion: ${m.ubicacion}`);
  lines.push(`Responsable: ${m.responsable}`);
  lines.push(`Fecha: ${m.fecha}`);
  lines.push(`Coordenadas: ${m.crs}`);
  lines.push(`Tipo: ${measurement.type}`);
  lines.push('');
  lines.push('## Resultados');
  if (measurement.type === 'distance') lines.push(`Distancia: ${fmt(measurement.distance_m)} m`);
  if (measurement.type === 'area') {
    lines.push(`Area: ${fmt(measurement.area_m2)} m2 (${fmt(measurement.area_ha, 6)} ha)`);
    lines.push(`Perimetro: ${fmt(measurement.perimeter_m)} m`);
  }
  if (measurement.type === 'perimeter') lines.push(`Perimetro: ${fmt(measurement.perimeter_m)} m`);
  if (measurement.type === 'height-difference') {
    lines.push(`Diferencia de alturas: ${fmt(measurement.height_difference_m)} m`);
    lines.push(`Altura minima: ${fmt(measurement.height_min_m)} m`);
    lines.push(`Altura maxima: ${fmt(measurement.height_max_m)} m`);
  }
  lines.push('');
  lines.push('## Puntos');
  (measurement.points_utm || []).forEach((p, i) => {
    lines.push(`P${i + 1}: lat ${p.lat}, lon ${p.lon} | UTM ${fmt(p.x)}, ${fmt(p.y)}`);
  });
  if (validation.length) {
    lines.push('');
    lines.push('## Validacion (referencia vs GeoDrone)');
    validationRows(validation).forEach((r) => {
      lines.push(`${r.parametro}: ref ${r.referencia} ${r.unidad} | GeoDrone ${r.geodrone} ${r.unidad} | dif ${r.diferencia} | error ${r.error_pct}%`);
    });
    lines.push('Nota: no se promete precision centimetrica. Se presenta el error medido.');
  }
  return lines;
}

// ---- PDF mínimo, sin dependencias ---------------------------------------
// PDF con fuente Helvetica. Las líneas que empiezan con "## " son títulos.

function pdfEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

function generatePdfBuffer(lines) {
  const pages = [];
  const perPage = 38;
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));

  // Objetos: 1 Catálogo, 2 Páginas, 3 Fuente normal, 4 Fuente negrita,
  // luego por página: objeto Página y objeto Contenido.
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const pageObjNums = pages.map((_, i) => 5 + i * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  pages.forEach((pageLines, i) => {
    const contentObj = 6 + i * 2;
    let stream = '';
    let y = 792;
    pageLines.forEach((raw) => {
      const isTitle = raw.startsWith('## ');
      const text = isTitle ? raw.slice(3) : raw;
      const font = isTitle ? 'F2' : 'F1';
      const size = isTitle ? 14 : 11;
      if (isTitle) y -= 8;
      stream += `BT /${font} ${size} Tf 50 ${y} Td (${pdfEscape(text)}) Tj ET\n`;
      y -= isTitle ? 22 : 18;
    });
    const streamBuf = Buffer.from(stream, 'latin1');
    objects[5 + i * 2] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`;
    objects[contentObj] = { stream: streamBuf };
  });

  const chunks = [];
  let offset = 0;
  const offsets = {};
  function push(buf) {
    chunks.push(buf);
    offset += buf.length;
  }
  push(Buffer.from('%PDF-1.4\n', 'latin1'));
  const maxObj = objects.length - 1;
  for (let n = 1; n <= maxObj; n++) {
    offsets[n] = offset;
    if (objects[n] && typeof objects[n] === 'object') {
      const streamBuf = objects[n].stream;
      push(Buffer.from(`${n} 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`, 'latin1'));
      push(streamBuf);
      push(Buffer.from('\nendstream\nendobj\n', 'latin1'));
    } else {
      push(Buffer.from(`${n} 0 obj\n${objects[n]}\nendobj\n`, 'latin1'));
    }
  }
  const xrefOffset = offset;
  let xref = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= maxObj; n++) {
    xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(chunks);
}

// ---- HTML para imprimir desde el celular (Expo Print) -------------------

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateHtmlReport(measurement, meta = {}, validation = []) {
  const m = defaultMeta(meta);
  const rows = (measurement.points_utm || [])
    .map((p, i) => `<tr><td>${i + 1}</td><td>${p.lat}</td><td>${p.lon}</td><td>${fmt(p.x)}</td><td>${fmt(p.y)}</td></tr>`)
    .join('');
  let resultHtml = '';
  if (measurement.type === 'distance') resultHtml = `<p><b>Distancia:</b> ${fmt(measurement.distance_m)} m</p>`;
  if (measurement.type === 'area') {
    resultHtml = `<p><b>Área:</b> ${fmt(measurement.area_m2)} m² (${fmt(measurement.area_ha, 6)} ha)</p><p><b>Perímetro:</b> ${fmt(measurement.perimeter_m)} m</p>`;
  }
  if (measurement.type === 'perimeter') resultHtml = `<p><b>Perímetro:</b> ${fmt(measurement.perimeter_m)} m</p>`;
  if (measurement.type === 'height-difference') {
    resultHtml = `<p><b>Diferencia de alturas:</b> ${fmt(measurement.height_difference_m)} m</p>`;
  }
  const validationHtml = validation.length
    ? `<h2>Validación</h2><table><tr><th>Parámetro</th><th>Referencia</th><th>GeoDrone</th><th>Diferencia</th><th>Error %</th></tr>${validationRows(validation)
        .map((r) => `<tr><td>${escHtml(r.parametro)}</td><td>${r.referencia}</td><td>${r.geodrone}</td><td>${r.diferencia}</td><td>${r.error_pct}%</td></tr>`)
        .join('')}</table><p>No se promete precisión centimétrica. Se presenta el error medido.</p>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h1>GeoDrone — Reporte de medición</h1><p><b>Proyecto:</b> ${escHtml(m.proyecto)}<br><b>Ubicación:</b> ${escHtml(m.ubicacion)}<br><b>Responsable:</b> ${escHtml(m.responsable)}<br><b>Fecha:</b> ${escHtml(m.fecha)}<br><b>Coordenadas:</b> ${escHtml(m.crs)}</p>${resultHtml}<h2>Puntos</h2><table><tr><th>#</th><th>Latitud</th><th>Longitud</th><th>X UTM</th><th>Y UTM</th></tr>${rows}</table>${validationHtml}</body></html>`;
}

module.exports = {
  measurementToCsv,
  validationRows,
  validationToCsv,
  buildReportLines,
  generatePdfBuffer,
  generateHtmlReport,
  defaultMeta,
};
