// Prueba de reportes — GeoDrone Parte 4
// Uso: node test-reports.js
// Genera: reporte-medicion.csv, reporte-medicion.pdf,
//          reporte-validacion.csv
// Y comprueba que contienen los valores del rectángulo 40 x 25 m.

'use strict';

const fs = require('fs');
const path = require('path');
const { calculateMeasurement } = require('../measurements');
const {
  measurementToCsv,
  validationToCsv,
  validationRows,
  buildReportLines,
  generatePdfBuffer,
  generateHtmlReport,
} = require('./reports');

const puntos = [
  { lat: 19.91248, lon: -99.57848 },
  { lat: 19.9124812, lon: -99.5780978 },
  { lat: 19.9127072, lon: -99.5780987 },
  { lat: 19.9127059, lon: -99.5784808 },
];

const measurement = calculateMeasurement({ type: 'area', points: puntos });
console.log('Medición:', measurement.area_m2, 'm2,', measurement.perimeter_m, 'm');

// Validación con los valores de ejemplo de la propuesta (sección 14).
// En el proyecto real se sustituyen por las mediciones de campo.
const validation = [
  { parametro: 'Longitud', unidad: 'm', referencia: 40.0, geodrone: 40.35 },
  { parametro: 'Ancho', unidad: 'm', referencia: 25.0, geodrone: 24.72 },
  { parametro: 'Area', unidad: 'm2', referencia: 1000, geodrone: 992.4 },
  { parametro: 'Altura', unidad: 'm', referencia: 8.0, geodrone: 8.3 },
];

const meta = {
  proyecto: 'Terreno Experimental 01',
  ubicacion: 'Tecnologico de Estudios Superiores de Jilotepec',
  responsable: 'Eduardo',
  fecha: '2026-11-10',
};

// 1. CSV de medición
const csv = measurementToCsv(measurement, meta);
fs.writeFileSync(path.join(__dirname, 'reporte-medicion.csv'), csv, 'utf8');
if (!csv.includes('1000') || !csv.includes('130')) throw new Error('CSV no contiene area/perimetro');
console.log('✓ CSV de medición generado, contiene 1000 m2 y 130 m');

// 2. PDF de medición
const lines = buildReportLines(measurement, meta, validation);
const pdf = generatePdfBuffer(lines);
fs.writeFileSync(path.join(__dirname, 'reporte-medicion.pdf'), pdf);
if (pdf.slice(0, 5).toString() !== '%PDF-') throw new Error('El PDF no empieza con %PDF-');
if (pdf.length < 1000) throw new Error('El PDF es sospechosamente pequeño');
console.log(`✓ PDF generado: ${pdf.length} bytes, empieza con %PDF-`);

// 3. CSV de validación + cálculo de error
const valCsv = validationToCsv(validation);
fs.writeFileSync(path.join(__dirname, 'reporte-validacion.csv'), valCsv, 'utf8');
const enriched = validationRows(validation);
console.log('Validación calculada:', enriched);
const areaRow = enriched.find((r) => r.parametro === 'Area');
if (Math.abs(areaRow.diferencia - -7.6) > 0.01) throw new Error('Diferencia de area incorrecta');
if (Math.abs(areaRow.error_pct - 0.76) > 0.01) throw new Error('Error % de area incorrecto');
console.log('✓ Validación: area dif -7.6 m2, error 0.76%');

// 4. HTML (para imprimir en el celular)
const html = generateHtmlReport(measurement, meta, validation);
if (!html.includes('GeoDrone') || !html.includes('1000')) throw new Error('HTML incompleto');
console.log('✓ HTML para Expo Print generado');

console.log('\n✅ Todas las pruebas de reportes pasaron.');
console.log('Archivos generados en esta carpeta: reporte-medicion.csv, reporte-medicion.pdf, reporte-validacion.csv');
