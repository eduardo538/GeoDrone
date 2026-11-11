// Prueba del módulo de cálculos — GeoDrone Parte 4
// Uso: node test.js
//
// Genera un rectángulo de 40 m x 25 m en el Tec de Jilotepec:
// se define exacto en UTM (metros), se convierte a lat/lon y se
// le pasa al módulo como si fueran puntos tocados en el mapa.
// Resultado esperado: área 1 000 m², perímetro 130 m,
// lados 40 m y 25 m, diagonal 47.17 m.

'use strict';

const {
  latLonToUtm,
  utmToLatLon,
  calculateMeasurement,
  haversineDistance,
} = require('./measurements');

function assertCerca(nombre, obtenido, esperado, tolerancia) {
  const diff = Math.abs(obtenido - esperado);
  const ok = diff <= tolerancia;
  console.log(
    `${ok ? '✓' : '✗'} ${nombre}: obtenido ${obtenido} | esperado ${esperado} | diferencia ${diff.toFixed(4)} (tolerancia ${tolerancia})`
  );
  if (!ok) process.exitCode = 1;
}

// 1. Punto de origen en el Tec de Jilotepec
const origen = { lat: 19.91248, lon: -99.57848 };
const origenUtm = latLonToUtm(origen.lat, origen.lon);
console.log('Origen lat/lon:', origen);
console.log('Origen UTM 14N:', { x: origenUtm.x.toFixed(3), y: origenUtm.y.toFixed(3), epsg: origenUtm.epsg });
console.log('');

// 2. Rectángulo exacto en UTM: (0,0) -> (40,0) -> (40,25) -> (0,25)
const esquinasUtm = [
  { x: origenUtm.x, y: origenUtm.y },
  { x: origenUtm.x + 40, y: origenUtm.y },
  { x: origenUtm.x + 40, y: origenUtm.y + 25 },
  { x: origenUtm.x, y: origenUtm.y + 25 },
];
const puntos = esquinasUtm.map((p) => utmToLatLon(p.x, p.y));
console.log('Puntos lat/lon generados (como si se tocaran en el mapa):');
puntos.forEach((p, i) => console.log(`  P${i + 1}: lat ${p.lat.toFixed(7)}, lon ${p.lon.toFixed(7)}`));
console.log('');

// 3. Ida y vuelta UTM -> lat/lon -> UTM (debe recuperar el rectángulo)
const idaVuelta = latLonToUtm(puntos[1].lat, puntos[1].lon);
assertCerca('Ida y vuelta UTM, x del P2', idaVuelta.x, esquinasUtm[1].x, 0.01);
assertCerca('Ida y vuelta UTM, y del P2', idaVuelta.y, esquinasUtm[1].y, 0.01);
console.log('');

// 4. Distancias de los lados y diagonal
const lado40 = calculateMeasurement({ type: 'distance', points: [puntos[0], puntos[1]] });
const lado25 = calculateMeasurement({ type: 'distance', points: [puntos[1], puntos[2]] });
const diagonal = calculateMeasurement({ type: 'distance', points: [puntos[0], puntos[2]] });
assertCerca('Lado 40 m', lado40.distance_m, 40, 0.05);
assertCerca('Lado 25 m', lado25.distance_m, 25, 0.05);
assertCerca('Diagonal sqrt(40²+25²) = 47.17 m', diagonal.distance_m, Math.hypot(40, 25), 0.05);
console.log('');

// 5. Área y perímetro (fórmula de Gauss)
const area = calculateMeasurement({ type: 'area', points: puntos });
assertCerca('Área 40 x 25 = 1000 m²', area.area_m2, 1000, 0.5);
assertCerca('Área en hectáreas', area.area_ha, 0.1, 0.0001);
assertCerca('Perímetro 2*(40+25) = 130 m', area.perimeter_m, 130, 0.05);
console.log('');
console.log('Resultado completo del cálculo de área:');
console.log(JSON.stringify(area, null, 2));
console.log('');

// 6. Comprobación independiente con haversine (esfera, no UTM)
// Debe coincidir dentro de ~0.1 % (la proyección UTM tiene factor 0.9996).
const hav40 = haversineDistance(puntos[0], puntos[1]);
const diffPct = (Math.abs(hav40 - 40) / 40) * 100;
console.log(`Haversine lado 40 m: ${hav40.toFixed(3)} m (diferencia vs UTM: ${diffPct.toFixed(3)} %)`);
if (diffPct > 0.2) {
  console.log('✗ La comprobación haversine difiere más de 0.2 %');
  process.exitCode = 1;
} else {
  console.log('✓ Haversine coincide con UTM dentro de 0.2 %');
}
console.log('');

// 7. Diferencia de alturas (ejemplo de la propuesta: 8.0 m y 8.3 m)
const alturas = calculateMeasurement({
  type: 'height-difference',
  points: [
    { ...puntos[0], height: 8.0 },
    { ...puntos[1], height: 8.3 },
  ],
});
assertCerca('Diferencia de alturas 8.3 - 8.0 = 0.3 m', alturas.height_difference_m, 0.3, 0.001);
console.log('');

if (process.exitCode) {
  console.log('❌ Alguna prueba falló. Revisa el módulo antes de integrarlo.');
} else {
  console.log('✅ Todas las pruebas pasaron. El módulo está listo para usarse en la API.');
}
