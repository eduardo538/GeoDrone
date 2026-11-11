// GeoDrone — Parte 4: Medición, reportes y validación
// Módulo de cálculos (Node.js, sin dependencias externas)
//
// Entrada: puntos en latitud/longitud (WGS84, EPSG:4326), como los que
// devuelve el GPS del celular o los que el usuario toca en el mapa.
// Cálculo: se convierten a UTM zona 14N (EPSG:32614) y ahí se mide
// en metros. Esa zona es la que corresponde al Tecnológico de
// Estudios Superiores de Jilotepec (lon ≈ -99.58).
//
// Funciones principales:
//   - distanceBetween(p1, p2)  -> metros
//   - perimeter(points)        -> metros (cierra el polígono)
//   - areaGauss(points)        -> m² (fórmula de Gauss / shoelace, en UTM)
//   - heightDifference(points) -> metros (con alturas del DSM)
//   - calculateMeasurement({ type, points }) -> objeto JSON listo para la API
//
// Nota de precisión: la distancia en UTM es una distancia proyectada.
// Para terrenos pequeños (como el área de prueba del Tec, de decenas
// de metros) la diferencia con la distancia sobre el elipsoide es de
// centímetros. No se debe prometer precisión centimétrica: el error
// real se mide en la validación de campo (Parte 4, sección 14).

'use strict';

const ZONE = 14; // UTM zona 14N
const EPSG_UTM = 'EPSG:32614';
const EPSG_WGS84 = 'EPSG:4326';

// Elipsoide WGS84
const A = 6378137.0; // semieje mayor, en metros
const F = 1 / 298.257223563; // aplanamiento
const E2 = F * (2 - F); // excentricidad al cuadrado
const E_PRIME_SQ = E2 / (1 - E2);
const K0 = 0.9996; // factor de escala UTM

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

// Arco meridiano desde el ecuador hasta la latitud dada (en radianes).
function meridionalArc(latRad) {
  const e2 = E2;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  return (
    A *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * latRad) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * latRad) -
      ((35 * e6) / 3072) * Math.sin(6 * latRad))
  );
}

function validatePoint(p, i = 0) {
  if (!p || typeof p.lat !== 'number' || typeof p.lon !== 'number') {
    throw new Error(
      `Punto ${i}: se esperaba { lat, lon } con números. Ejemplo: { lat: 19.91248, lon: -99.57848 }`
    );
  }
  if (Number.isNaN(p.lat) || Number.isNaN(p.lon)) {
    throw new Error(`Punto ${i}: lat/lon no pueden ser NaN.`);
  }
  if (p.lat < -90 || p.lat > 90) {
    throw new Error(`Punto ${i}: latitud fuera de rango (-90 a 90): ${p.lat}`);
  }
  if (p.lon < -180 || p.lon > 180) {
    throw new Error(`Punto ${i}: longitud fuera de rango (-180 a 180): ${p.lon}`);
  }
}

function validatePoints(points, min) {
  if (!Array.isArray(points) || points.length < min) {
    throw new Error(`Se necesitan al menos ${min} punto(s). Se recibieron: ${Array.isArray(points) ? points.length : 'ninguno'}.`);
  }
  points.forEach(validatePoint);
}

// Convierte lat/lon (grados) a UTM zona 14N.
// Devuelve { x, y, zone: 14, hemisphere: 'N', epsg: 'EPSG:32614' }
// x = este (easting), y = norte (northing), ambos en metros.
function latLonToUtm(lat, lon, zone = ZONE) {
  const latRad = toRad(lat);
  const lonRad = toRad(lon);
  const lonOriginRad = toRad((zone - 1) * 6 - 180 + 3); // -99° para la zona 14

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);

  const N = A / Math.sqrt(1 - E2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = E_PRIME_SQ * cosLat * cosLat;
  const A_ = (lonRad - lonOriginRad) * cosLat;
  const M = meridionalArc(latRad);

  const x =
    500000 +
    K0 *
      N *
      (A_ +
        ((1 - T + C) * Math.pow(A_, 3)) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * E_PRIME_SQ) * Math.pow(A_, 5)) / 120);

  const y =
    K0 *
    (M +
      N *
        tanLat *
        (Math.pow(A_, 2) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Math.pow(A_, 4)) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * E_PRIME_SQ) * Math.pow(A_, 6)) / 720));

  return { x, y, zone, hemisphere: 'N', epsg: EPSG_UTM };
}

// Inversa: UTM zona 14N -> lat/lon (grados).
// Se usa sobre todo para generar puntos de prueba: se define un
// rectángulo exacto en metros (UTM) y se convierte a lat/lon.
function utmToLatLon(x, y, zone = ZONE) {
  const xPrime = (x - 500000) / K0;
  const yPrime = y / K0; // hemisferio norte, sin falso norte
  const lonOriginRad = toRad((zone - 1) * 6 - 180 + 3);

  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const mu =
    yPrime /
    (A * (1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 * E2 * E2) / 256));

  const J1 = (3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32;
  const J2 = (21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32;
  const J3 = (151 * Math.pow(e1, 3)) / 96;
  const J4 = (1097 * Math.pow(e1, 4)) / 512;

  const phi1 =
    mu +
    J1 * Math.sin(2 * mu) +
    J2 * Math.sin(4 * mu) +
    J3 * Math.sin(6 * mu) +
    J4 * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = A / Math.sqrt(1 - E2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = E_PRIME_SQ * cosPhi1 * cosPhi1;
  const R1 = A * (1 - E2) / Math.pow(1 - E2 * sinPhi1 * sinPhi1, 1.5);
  const D = xPrime / N1;

  const latRad =
    phi1 -
    ((N1 * tanPhi1) / R1) *
      (Math.pow(D, 2) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * E_PRIME_SQ) * Math.pow(D, 4)) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * E_PRIME_SQ - 3 * C1 * C1) *
          Math.pow(D, 6)) /
          720);

  const lonRad =
    lonOriginRad +
    (D -
      ((1 + 2 * T1 + C1) * Math.pow(D, 3)) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * E_PRIME_SQ + 24 * T1 * T1) *
        Math.pow(D, 5)) /
        120) /
      cosPhi1;

  return { lat: toDeg(latRad), lon: toDeg(lonRad) };
}

function toUtmPoints(points) {
  validatePoints(points, 1);
  return points.map((p) => {
    const utm = latLonToUtm(p.lat, p.lon);
    return { ...p, x: utm.x, y: utm.y };
  });
}

// Distancia euclidiana en UTM (metros) entre dos puntos UTM.
function utmDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Distancia en metros entre dos puntos lat/lon (vía UTM).
function distanceBetween(p1, p2) {
  validatePoints([p1, p2], 2);
  const [a, b] = toUtmPoints([p1, p2]);
  return utmDistance(a, b);
}

// Distancia haversine (esfera, radio medio 6 371 000 m).
// No se usa para el resultado oficial; sirve como comprobación
// independiente en las pruebas. Debe coincidir con la distancia
// UTM dentro de ~0.1 % en terrenos pequeños.
function haversineDistance(p1, p2) {
  const R = 6371000;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Longitud total de una línea que pasa por los puntos, en metros.
// Con 2 puntos es la distancia entre ellos.
function pathLength(points) {
  const utm = toUtmPoints(points);
  let total = 0;
  for (let i = 1; i < utm.length; i++) total += utmDistance(utm[i - 1], utm[i]);
  return total;
}

// Perímetro en metros. Cierra el polígono (último punto -> primero)
// aunque el usuario no repita el primer punto al final.
function perimeter(points) {
  validatePoints(points, 3);
  const utm = toUtmPoints(points);
  let total = 0;
  for (let i = 1; i < utm.length; i++) total += utmDistance(utm[i - 1], utm[i]);
  total += utmDistance(utm[utm.length - 1], utm[0]); // cierre
  return total;
}

// Área en m² con la fórmula de Gauss (shoelace) aplicada a las
// coordenadas UTM (metros). El valor absoluto quita el efecto del
// sentido (horario / antihorario) en que se tocaron los puntos.
function areaGauss(points) {
  validatePoints(points, 3);
  const utm = toUtmPoints(points);
  let sum = 0;
  for (let i = 0; i < utm.length; i++) {
    const a = utm[i];
    const b = utm[(i + 1) % utm.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function getHeight(p, i) {
  const h = p.height ?? p.alt ?? p.z ?? p.elevation;
  if (typeof h !== 'number' || Number.isNaN(h)) {
    throw new Error(
      `Punto ${i}: para diferencia de alturas cada punto necesita height (o alt/z/elevation) en metros.`
    );
  }
  return h;
}

// Diferencia de alturas en metros a partir de las alturas del DSM.
// Devuelve { difference_m, min_m, max_m } donde difference es max - min.
function heightDifference(points) {
  validatePoints(points, 2);
  const heights = points.map(getHeight);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  return { difference_m: max - min, min_m: min, max_m: max };
}

// Función principal para la API.
// type: 'distance' | 'area' | 'perimeter' | 'height-difference'
// Para 'distance' con más de 2 puntos devuelve la longitud total
// de la línea y también la distancia entre el primer y último punto.
// Para 'area' devuelve además el perímetro del mismo polígono.
// Para 'height-difference' los puntos deben traer height.
function calculateMeasurement({ type, points }) {
  if (!type || typeof type !== 'string') {
    throw new Error("Falta 'type': 'distance', 'area', 'perimeter' o 'height-difference'.");
  }
  if (!Array.isArray(points)) {
    throw new Error("Falta 'points': un arreglo de { lat, lon }.");
  }

  const utmPoints = toUtmPoints(points).map((p) => ({
    lat: p.lat,
    lon: p.lon,
    x: Number(p.x.toFixed(3)),
    y: Number(p.y.toFixed(3)),
  }));

  const base = { type, crs: EPSG_UTM, zone: ZONE, points_utm: utmPoints };

  if (type === 'distance') {
    validatePoints(points, 2);
    return {
      ...base,
      distance_m: Number(pathLength(points).toFixed(3)),
      // distancia directa entre extremos, útil cuando la línea tiene varios puntos
      straight_distance_m:
        points.length > 2 ? Number(distanceBetween(points[0], points[points.length - 1]).toFixed(3)) : undefined,
    };
  }

  if (type === 'area') {
    validatePoints(points, 3);
    const area = areaGauss(points);
    return {
      ...base,
      area_m2: Number(area.toFixed(3)),
      area_ha: Number((area / 10000).toFixed(6)),
      perimeter_m: Number(perimeter(points).toFixed(3)),
    };
  }

  if (type === 'perimeter') {
    validatePoints(points, 3);
    return { ...base, perimeter_m: Number(perimeter(points).toFixed(3)) };
  }

  if (type === 'height-difference') {
    validatePoints(points, 2);
    const h = heightDifference(points);
    return {
      ...base,
      height_difference_m: Number(h.difference_m.toFixed(3)),
      height_min_m: Number(h.min_m.toFixed(3)),
      height_max_m: Number(h.max_m.toFixed(3)),
    };
  }

  throw new Error(`type no válido: '${type}'. Usa 'distance', 'area', 'perimeter' o 'height-difference'.`);
}

module.exports = {
  ZONE,
  EPSG_UTM,
  EPSG_WGS84,
  latLonToUtm,
  utmToLatLon,
  distanceBetween,
  haversineDistance,
  pathLength,
  perimeter,
  areaGauss,
  heightDifference,
  calculateMeasurement,
};
