# GeoDrone

Sistema de levantamiento y medición de terrenos mediante dron y fotogrametría.

La app convierte las fotos tomadas por un dron en un mapa y un modelo 3D
del terreno, sobre los cuales se miden áreas, distancias, perímetros y alturas.

El dron se compra ya hecho; todo el trabajo del equipo es software.
No se controla el dron desde nuestra app.

## Equipo

| Parte | Integrantes | Responsable de |
| --- | --- | --- |
| 1. Backend y base de datos | Juan Carlos y Sandra | API y datos (Node, Express, PostgreSQL con PostGIS) |
| 2. Procesamiento y servidor | Jessica y Gabriel | Fotos a mapas y modelos 3D (Python, NodeODM, GDAL, Docker) |
| 3. App móvil | Chava y Yanet | Pantallas de la app (React Native con Expo) |
| 4. Medición, reportes y validación | Eduardo | Cálculos, reportes, trabajo de campo y sus pantallas |

## Carpetas

- `parte-1-backend/` — API y base de datos
- `parte-2-procesamiento/` — NodeODM, ortomosaico, modelo 3D y DSM
- `parte-3-app/` — App móvil en React Native con Expo
- `parte-4-medicion/` — Cálculos, pantalla de medición, puntos de control, reportes y validación

Cada parte trabaja en su carpeta. Nadie sube cambios directo a la
rama principal; todo entra por pull request.

## Área de prueba

Un área pequeña del Tecnológico de Estudios Superiores de Jilotepec.
Coordenadas en WGS84 (lat/lon). Cálculos en metros con UTM zona 14N
(EPSG:32614).
