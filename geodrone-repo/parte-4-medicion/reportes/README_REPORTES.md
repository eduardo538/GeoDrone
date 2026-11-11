# Reportes en PDF y CSV — Parte 4

## Qué hay aquí

| Archivo | Para qué |
| --- | --- |
| `reports.js` | Genera CSV, PDF y HTML desde el JSON de la medición. Node, sin dependencias. |
| `reports-mobile.js` | Comparte el PDF y el CSV desde el celular con Expo. |
| `test-reports.js` | Prueba que genera los 3 archivos de ejemplo. |
| `reporte-medicion.csv` | Ejemplo generado: área 1 000.161 m², perímetro 130.007 m. |
| `reporte-medicion.pdf` | Ejemplo generado: mismo reporte en PDF, 1 página. |
| `reporte-validacion.csv` | Ejemplo con la tabla de validación de la propuesta. |

## Qué contiene un reporte

- Proyecto, ubicación, responsable, fecha y coordenadas (UTM 14N)
- Resultado: distancia, área, perímetro o diferencia de alturas
- La lista de puntos en lat/lon y en UTM
- Si se pasa, la tabla de validación: referencia vs GeoDrone,
  diferencia y error %

El reporte **no vuelve a calcular nada**: usa el resultado que
ya dio `calculateMeasurement()`.

## Cómo probarlo en la computadora

```bash
cd parte-4-medicion/reportes
node test-reports.js
```

Debe salir `✅ Todas las pruebas de reportes pasaron` y se crean
los archivos `.csv` y `.pdf` en esa misma carpeta. Ábrelos para
ver cómo quedan.

## Cómo usarlo en el backend (Node)

```js
const { measurementToCsv, generatePdfBuffer, buildReportLines } = require('./reports');

// CSV para descargar
const csv = measurementToCsv(measurement, { proyecto: 'Terreno Experimental 01' });

// PDF para descargar
const pdf = generatePdfBuffer(buildReportLines(measurement, meta, validation));
res.setHeader('Content-Type', 'application/pdf');
res.send(pdf);
```

## Cómo compartirlo desde el celular (Expo)

Instala:

```bash
npx expo install expo-print expo-sharing expo-file-system
```

Y usa:

```js
import { sharePdfReport, shareCsvReport } from './reportes/reports-mobile';

await sharePdfReport(measurement, meta, validation); // abre el menú Compartir
await shareCsvReport(measurement, meta);
```

El PDF del celular se genera desde el HTML, con `expo-print`.
El CSV se guarda y se comparte con el menú nativo (WhatsApp,
correo, Drive, etc.).

## Validación

La tabla de validación compara la medición tradicional
(cinta o estación) contra GeoDrone:

| Parámetro | Referencia | GeoDrone | Diferencia | Error % |
| --- | --- | --- | --- | --- |
| Longitud | 40.00 m | 40.35 m | 0.35 m | 0.875% |
| Ancho | 25.00 m | 24.72 m | -0.28 m | 1.12% |
| Área | 1 000 m² | 992.4 m² | -7.6 m² | 0.76% |
| Altura | 8.0 m | 8.3 m | 0.3 m | 3.75% |

Esos valores son los de ejemplo de la propuesta (sección 14).
En el proyecto real se sustituyen por las mediciones de campo
en el Tec.

## Dónde se sube

En el repositorio, en:

`geodrone-repo / parte-4-medicion / reportes`

Igual que la pantalla: descomprime, entra a esa carpeta en
GitHub, **Add file > Upload files** y arrastra los archivos.

## Siguiente paso

Validación en campo: medir el terreno del Tec de forma
tradicional, comparar con GeoDrone y llenar esta tabla con
los valores reales.
