// GeoDrone — Parte 4: Pantalla de medición (React Native + Expo)
//
// Cómo funciona, en simple:
// 1. El usuario toca el mapa y se agrega un punto.
// 2. Con 2 puntos ya se puede medir distancia.
// 3. Con 3 o más puntos se puede medir área y perímetro.
// 4. El botón Calcular primero intenta usar el backend
//    (POST /api/measurements/calculate). Si no hay backend o no
//    hay internet, calcula en el celular con measurements-mobile.js.
//
// Instalación en el proyecto de la Parte 3 (Expo):
//   npx expo install react-native-maps
//
// Uso en la navegación:
//   import MeasurementScreen from './parte-4-medicion/pantalla/MeasurementScreen';
//   <Stack.Screen name="Medicion" component={MeasurementScreen} />
//
// Props opcionales:
//   apiUrl: string, por ejemplo 'http://192.168.1.10:3000'
//           Si no se pasa, siempre calcula en el celular.
//   initialRegion: región inicial del mapa. Por defecto, el Tec de Jilotepec.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import { calculateMeasurement } from './measurements-mobile';

const TEC_JILOTEPEC = {
  latitude: 19.91248,
  longitude: -99.57848,
  latitudeDelta: 0.002,
  longitudeDelta: 0.002,
};

export default function MeasurementScreen({ apiUrl, initialRegion = TEC_JILOTEPEC }) {
  const [points, setPoints] = useState([]);
  const [mode, setMode] = useState('area'); // 'distance' o 'area'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usedApi, setUsedApi] = useState(false);

  function addPoint(event) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { lat: latitude, lon: longitude }]);
    setResult(null);
    setError('');
  }

  function undoPoint() {
    setPoints((prev) => prev.slice(0, -1));
    setResult(null);
  }

  function clearPoints() {
    setPoints([]);
    setResult(null);
    setError('');
  }

  function minPoints() {
    return mode === 'distance' ? 2 : 3;
  }

  async function calculate() {
    if (points.length < minPoints()) {
      setError(`Toca al menos ${minPoints()} punto(s) en el mapa.`);
      return;
    }
    setLoading(true);
    setError('');

    // 1) Intentar con el backend, si se configuró apiUrl
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/api/measurements/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: mode, points }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error del servidor');
        setResult(json);
        setUsedApi(true);
        setLoading(false);
        return;
      } catch (e) {
        // Si falla el servidor, se sigue con el cálculo local.
        // No se bloquea la demostración por falta de internet.
      }
    }

    // 2) Cálculo en el celular (sin conexión)
    try {
      const local = calculateMeasurement({ type: mode, points });
      setResult(local);
      setUsedApi(false);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  function resultText() {
    if (!result) return null;
    if (result.type === 'distance') {
      return `Distancia: ${result.distance_m} m`;
    }
    return `Área: ${result.area_m2} m² (${result.area_ha} ha)\nPerímetro: ${result.perimeter_m} m`;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={addPoint}
      >
        {points.map((p, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: p.lat, longitude: p.lon }}
            title={`Punto ${i + 1}`}
          />
        ))}
        {points.length >= 2 && (
          <Polyline
            coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lon }))}
            strokeWidth={3}
          />
        )}
        {mode === 'area' && points.length >= 3 && (
          <Polygon
            coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lon }))}
            fillColor="rgba(0, 122, 255, 0.2)"
          />
        )}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>Medición — toca el mapa para agregar puntos</Text>
        <Text>Puntos: {points.length}</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, mode === 'distance' && styles.buttonActive]}
            onPress={() => { setMode('distance'); setResult(null); }}
          >
            <Text>Distancia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, mode === 'area' && styles.buttonActive]}
            onPress={() => { setMode('area'); setResult(null); }}
          >
            <Text>Área</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={undoPoint}>
            <Text>Deshacer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={clearPoints}>
            <Text>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={calculate}>
            <Text style={styles.buttonPrimaryText}>Calcular</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator />}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {result && (
          <View style={styles.result}>
            <Text style={styles.resultText}>{resultText()}</Text>
            <Text style={styles.small}>
              {usedApi ? 'Calculado en el servidor' : 'Calculado en el celular (sin conexión)'} · UTM 14N
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: { padding: 12, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  buttonActive: { backgroundColor: '#cce5ff' },
  buttonPrimary: { backgroundColor: '#007aff' },
  buttonPrimaryText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', marginTop: 8 },
  result: { marginTop: 10, padding: 10, backgroundColor: '#eef6ff', borderRadius: 8 },
  resultText: { fontSize: 16, fontWeight: 'bold' },
  small: { marginTop: 4, color: '#555' },
});
