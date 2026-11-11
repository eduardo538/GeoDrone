# GeoDrone — Parte 4: Módulo de cálculos

Eduardo — Medición, reportes y validación.

## Qué es esto

El primer paso de tu parte: las funciones puras de medición, en Node.js
y **sin dependencias externas**, para que puedas probarlas sin esperar
a la Parte 1, la Parte 2 ni la Parte 3.

- Entrada: puntos en latitud/longitud (WGS84), como los del GPS del
  celular o los que el usuario toca en el mapa.
- Cálculo: se convierten a **UTM zona 14N (EPSG:32614)** y ahí se mide
  en metros. Esa zona es la del Tec de Jilotepec (lon ≈ -99.58).
- Salida: JSON listo para la API, con `distance_m`, `area_m2`,
  `area_ha`, `perimeter_m` y `height_difference_m`.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `measurements.js` | El módulo. Úsalo tal cual en el backend. |
| `test.js` | La prueba con un rectángulo de 40 m × 25 m en el Tec. |
| `README.md` | Este documento. |

## Cómo probarlo

```bash
cd geodrone-parte4
node test.js
```

Debe salir `✅ Todas las pruebas pasaron`.

La prueba genera un rectángulo exacto de 40 × 25 m en UTM, lo
convierte a lat/lon (como si fueran puntos tocados en el mapa) y
comprueba:

- Lado 40 m, lado 25 m, diagonal 47.17 m
- Área 1 000 m² (0.1 ha), perímetro 130 m
- Diferencia de alturas 8.3 − 8.0 = 0.3 m
- Ida y vuelta UTM → lat/lon → UTM con error < 1 cm

## Cómo usarlo en tu código

```js
const { calculateMeasurement } = require('./measurements');

// Distancia entre 2 puntos
calculateMeasurement({
  type: 'distance',
  points: [
    { lat: 19.91248, lon: -99.57848 },
    { lat: 19.91248, lon: -99.57810 },
  ],
});
// -> { type: 'distance', distance_m: 40, crs: 'EPSG:32614', ... }

// Área y perímetro de un polígono (mínimo 3 puntos, no hace
// falta repetir el primer punto al final: se cierra solo)
calculateMeasurement({
  type: 'area',
  points: [
    { lat: 19.91248, lon: -99.57848 },
    { lat: 19.91248, lon: -99.57810 },
    { lat: 19.91271, lon: -99.57810 },
    { lat: 19.91271, lon: -99.57848 },
  ],
});
// -> { type: 'area', area_m2: 1000, area_ha: 0.1, perimeter_m: 130, ... }

// Diferencia de alturas (las alturas vienen del DSM de la Parte 2)
calculateMeasurement({
  type: 'height-difference',
  points: [
    { lat: 19.91248, lon: -99.57848, height: 8.0 },
    { lat: 19.91248, lon: -99.57810, height: 8.3 },
  ],
});
// -> { type: 'height-difference', height_difference_m: 0.3, ... }
```

También puedes usar las funciones sueltas: `distanceBetween`,
`perimeter`, `areaGauss`, `heightDifference`, `latLonToUtm`,
`utmToLatLon` y `haversineDistance` (esta última solo para
comprobación, no es el resultado oficial).

## Contrato para la API (propuesta)

Cuando la Parte 1 integre esto en Express, el endpoint es:

```
POST /api/measurements/calculate
Content-Type: application/json

{ "project_id": "proyecto-1", "type": "area", "points": [...] }
```

Y la respuesta es exactamente lo que devuelve
`calculateMeasurement()`. Los reportes PDF y CSV se generan a
partir de ese mismo JSON, no se vuelve a calcular nada.

## Cómo validarlo contra QGIS

1. En QGIS, crea una capa de puntos con los mismos lat/lon de la
   prueba (o expórtalos a GeoJSON desde la app).
2. Cambia el SRC de la capa a EPSG:32614 (UTM 14N).
3. Usa la herramienta de medición o `$area` / `$perimeter` en la
   calculadora de campos.
4. Compara con los 1 000 m² y 130 m de `node test.js`. Deben
   coincidir dentro de centímetros; si no, el error está en la
   conversión, no en la fórmula de Gauss.

## Verificación independiente

La conversión UTM de este módulo se comprobó contra PROJ
(`pyproj`, la librería de referencia):

- Punto: lat 19.91248, lon -99.57848
- PROJ (EPSG:32614): x 439453.799, y 2201900.493
- Este módulo: x 439453.799, y 2201900.493
- Diferencia: menos de 1 mm.

La comprobación con haversine (esfera) difiere ~0.1 % porque
haversine usa una esfera y UTM usa el elipsoide WGS84 con
factor de escala 0.9996; es esperable y no es un error.

## Limitaciones (importante para el jurado)

- La zona UTM está fija en 14N. Vale para Jilotepec y alrededores,
  no para un terreno en otra zona del país.
- Las distancias son proyectadas (UTM). Para terrenos pequeños
  el error es de centímetros, pero no se debe prometer precisión
  centimétrica: el error real se presenta en la tabla de
  validación de campo.
- La diferencia de alturas necesita que cada punto traiga su
  altura del DSM. Este módulo no lee el archivo GeoTIFF; eso
  lo entrega la Parte 2 o se lee con Python/PostGIS en el
  siguiente paso.

## Siguiente paso

1. Integrar `calculateMeasurement()` en un endpoint Express
   (Parte 1) o en un servicio propio de la Parte 4.
2. Pantalla de medición en React Native: tocar puntos en el
   mapa, llamar al endpoint y mostrar el resultado.
3. Reportes PDF/CSV a partir del JSON de la medición.
4. Validación en campo en el Tec: medir el mismo rectángulo
   con cinta/estación y llenar la tabla de la sección 14.
