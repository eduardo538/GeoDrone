// Prueba del endpointómetro sin instalar nada: node test-endpoint.js
'use strict';

const assert = require('assert');
const { handleCalculate } = require('./endpoint');

// Rectángulo de 40 x 25 m en el Tec de Jilotepec (mismos puntos que test.js)
const RECT = [
  { lat: 19.91248, lon: -99.57848 },
  { lat: 19.9124812, lon: -99.5780978 },
  { lat: 19.9127072, lon: -99.5780987 },
  { lat: 19.9127059, lon: -99.5784808 },
];

// 1. Área: debe dar 1000 m2 y 130 m de perímetro
let r = handleCalculate({ type: 'area', points: RECT });
assert.strictEqual(r.status, 200, JSON.stringify(r.json));
assert.ok(Math.abs(r.json.area_m2 - 1000) < 0.5, `area ${r.json.area_m2}`);
assert.ok(Math.abs(r.json.perimeter_m - 130) < 0.05, `perimetro ${r.json.perimeter_m}`);
assert.strictEqual(r.json.crs, 'EPSG:32614');
console.log('✓ POST area ->', r.json.area_m2, 'm2,', r.json.perimeter_m, 'm');

// 2. Distancia entre los dos primeros puntos: 40 m
r = handleCalculate({ type: 'distance', points: RECT.slice(0, 2) });
assert.strictEqual(r.status, 200);
assert.ok(Math.abs(r.json.distance_m - 40) < 0.05, `distancia ${r.json.distance_m}`);
console.log('✓ POST distance ->', r.json.distance_m, 'm');

// 3. Diferencia de alturas con el ejemplo 8.0 -> 8.3
r = handleCalculate({
  type: 'height-difference',
  points: [
    { lat: 19.91248, lon: -99.57848, height: 8.0 },
    { lat: 19.91248, lon: -99.57810, height: 8.3 },
  ],
});
assert.strictEqual(r.status, 200);
assert.ok(Math.abs(r.json.height_difference_m - 0.3) < 0.001);
console.log('✓ POST height-difference ->', r.json.height_difference_m, 'm');

// 4. Errores: tipo inválido, pocos puntos, latitud fuera de rango
r = handleCalculate({ type: 'volumen', points: RECT });
assert.strictEqual(r.status, 400);
assert.match(r.json.error, /type debe ser/);
console.log('✓ tipo inválido -> 400:', r.json.error);

r = handleCalculate({ type: 'area', points: RECT.slice(0, 2) });
assert.strictEqual(r.status, 400);
assert.match(r.json.error, /al menos 3/);
console.log('✓ área con 2 puntos -> 400:', r.json.error);

r = handleCalculate({ type: 'distance', points: [{ lat: 999, lon: 0 }, { lat: 0, lon: 0 }] });
assert.strictEqual(r.status, 400);
assert.match(r.json.error, /latitud fuera de rango/);
console.log('✓ latitud inválida -> 400:', r.json.error);

r = handleCalculate(null);
assert.strictEqual(r.status, 400);
console.log('✓ cuerpo vacío -> 400:', r.json.error);

console.log('\n✅ Todas las pruebas del endpoint pasaron.');
