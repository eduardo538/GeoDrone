// GeoDrone — Parte 4: cálculos para la app móvil
// Misma matemática que measurements.js (backend), pero en formato
// ES Module para React Native con Expo. Sin dependencias externas.
//
// Entrada: puntos { lat, lon } en WGS84.
// Cálculo: se convierten a UTM zona 14N (EPSG:32614) y ahí se mide
// en metros. Zona del Tec de Jilotepec.
//
// Si el backend está disponible, la pantalla primero intenta usar
// POST /api/measurements/calculate y, si falla o no hay internet,
// usa estas funciones en el celular (modo sin conexión).

export const ZONE = 14;
export const EPSG_UTM = 'EPSG:32614';

const A = 6378137.0;
const F = 1 / 298.257223563;
const E2 = F * (2 - F);
const E_PRIME_SQ = E2 / (1 - E2);
const K0 = 0.9996;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

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

export function latLonToUtm(lat, lon, zone = ZONE) {
  const latRad = toRad(lat);
  const lonRad = toRad(lon);
  const lonOriginRad = toRad((zone - 1) * 6 - 180 + 3); // -99° zona 14
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

function toUtmPoints(points) {
  return points.map((p) => {
    const utm = latLonToUtm(p.lat, p.lon);
    return { ...p, x: utm.x, y: utm.y };
  });
}

function utmDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function distanceBetween(p1, p2) {
  const [a, b] = toUtmPoints([p1, p2]);
  return utmDistance(a, b);
}

export function pathLength(points) {
  const utm = toUtmPoints(points);
  let total = 0;
  for (let i = 1; i < utm.length; i++) total += utmDistance(utm[i - 1], utm[i]);
  return total;
}

export function perimeter(points) {
  const utm = toUtmPoints(points);
  let total = 0;
  for (let i = 1; i < utm.length; i++) total += utmDistance(utm[i - 1], utm[i]);
  total += utmDistance(utm[utm.length - 1], utm[0]);
  return total;
}

export function areaGauss(points) {
  const utm = toUtmPoints(points);
  let sum = 0;
  for (let i = 0; i < utm.length; i++) {
    const a = utm[i];
    const b = utm[(i + 1) % utm.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

// Misma respuesta JSON que el endpoint del backend.
// type: 'distance' | 'area' | 'perimeter' | 'height-difference'
export function calculateMeasurement({ type, points }) {
  if (!Array.isArray(points)) throw new Error("Faltan los puntos.");
  const utmPoints = toUtmPoints(points).map((p) => ({
    lat: p.lat,
    lon: p.lon,
    x: Number(p.x.toFixed(3)),
    y: Number(p.y.toFixed(3)),
  }));
  const base = { type, crs: EPSG_UTM, zone: ZONE, points_utm: utmPoints };

  if (type === 'distance') {
    if (points.length < 2) throw new Error('Para distancia se necesitan al menos 2 puntos.');
    return { ...base, distance_m: Number(pathLength(points).toFixed(3)) };
  }
  if (type === 'area') {
    if (points.length < 3) throw new Error('Para área se necesitan al menos 3 puntos.');
    const area = areaGauss(points);
    return {
      ...base,
      area_m2: Number(area.toFixed(3)),
      area_ha: Number((area / 10000).toFixed(6)),
      perimeter_m: Number(perimeter(points).toFixed(3)),
    };
  }
  if (type === 'perimeter') {
    if (points.length < 3) throw new Error('Para perímetro se necesitan al menos 3 puntos.');
    return { ...base, perimeter_m: Number(perimeter(points).toFixed(3)) };
  }
  if (type === 'height-difference') {
    if (points.length < 2) throw new Error('Para alturas se necesitan al menos 2 puntos.');
    const heights = points.map((p) => p.height ?? p.alt ?? p.z);
    if (heights.some((h) => typeof h !== 'number')) {
      throw new Error('Cada punto necesita height en metros (del DSM).');
    }
    return {
      ...base,
      height_difference_m: Number((Math.max(...heights) - Math.min(...heights)).toFixed(3)),
      height_min_m: Math.min(...heights),
      height_max_m: Math.max(...heights),
    };
  }
  throw new Error(`type no válido: '${type}'.`);
}
