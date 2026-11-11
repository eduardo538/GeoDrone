# Pantalla de medición y puntos de control — Parte 4

## Qué hay aquí

| Archivo | Para qué |
| --- | --- |
| `MeasurementScreen.js` | Pantalla principal: tocas el mapa, agregas puntos y ves distancia, área y perímetro. |
| `ControlPointsScreen.js` | Pantalla de campo: te paras sobre una marca, guardas su coordenada con el GPS del celular. |
| `measurements-mobile.js` | Los cálculos en el celular, sin internet. Misma matemática que el backend. |

## Cómo se usa la pantalla de medición

1. Abres la pantalla. El mapa empieza en el Tec de Jilotepec.
2. Tocas el mapa para agregar un punto. Cada toque es un marcador.
3. Eliges **Distancia** o **Área** arriba.
4. Pulsas **Calcular**.
   - Con 2 puntos: distancia.
   - Con 3 o más: área y perímetro.
5. Si el backend está disponible, usa el servidor. Si no, calcula
   en el celular y te dice "Calculado en el celular (sin conexión)".
6. **Deshacer** quita el último punto. **Limpiar** quita todos.

## Cómo se instala en la app de la Parte 3

En la carpeta del proyecto Expo:

```bash
npx expo install react-native-maps expo-location
```

Copia esta carpeta `pantalla/` dentro de tu parte, por ejemplo:

```
parte-4-medicion/pantalla/MeasurementScreen.js
parte-4-medicion/pantalla/ControlPointsScreen.js
parte-4-medicion/pantalla/measurements-mobile.js
```

Y agrégala a la navegación:

```js
import MeasurementScreen from './parte-4-medicion/pantalla/MeasurementScreen';
import ControlPointsScreen from './parte-4-medicion/pantalla/ControlPointsScreen';

// en tu Stack Navigator:
<Stack.Screen name="Medicion" component={MeasurementScreen} />
<Stack.Screen name="PuntosControl" component={ControlPointsScreen} />
```

Para usar el backend, pasa la dirección del servidor:

```js
<MeasurementScreen apiUrl="http://192.168.1.10:3000" />
```

Sin `apiUrl`, siempre calcula en el celular.

## Cómo probarla sin el mapa de la Parte 3

1. Crea un proyecto Expo de prueba o usa el de la Parte 3.
2. Pon `MeasurementScreen` como pantalla inicial.
3. Corre `npx expo start` y ábrelo en Expo Go.
4. Toca 4 puntos formando un rectángulo cerca del Tec.
   Debe dar cerca de 1 000 m² si el rectángulo es de 40 × 25 m.

Los cálculos ya están probados con Node: con los puntos del
rectángulo de prueba dan 1 000.16 m² y 130.01 m de perímetro
(la diferencia de 0.16 m² es por el redondeo de las coordenadas
a 7 decimales).

## Permiso de ubicación

Para puntos de control, en `app.json` hay que permitir ubicación.
Expo pide el permiso con `Location.requestForegroundPermissionsAsync()`,
que ya está en `ControlPointsScreen.js`.

## Siguiente paso

Reportes en PDF y CSV a partir del resultado de la medición,
y luego la validación en campo en el Tec.
