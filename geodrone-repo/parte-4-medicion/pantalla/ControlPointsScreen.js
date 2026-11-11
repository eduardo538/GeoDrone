// GeoDrone — Parte 4: Pantalla de puntos de control (React Native + Expo)
//
// Cómo se usa en campo:
// 1. El usuario se para sobre una marca en el suelo.
// 2. Pulsa "Obtener mi ubicación" y la app guarda la coordenada
//    con el GPS del celular.
// 3. Le pone un nombre, por ejemplo "Punto A" o "GCP-01".
// 4. Repite con cada marca. La lista se puede guardar o enviar
//    al backend para mejorar la precisión del modelo.
//
// Instalación:
//   npx expo install expo-location
//
// Permiso: en app.json hay que agregar el permiso de ubicación.
// Expo lo pide con Location.requestForegroundPermissionsAsync().

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import * as Location from 'expo-location';

export default function ControlPointsScreen() {
  const [name, setName] = useState('');
  const [points, setPoints] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function getLocation() {
    setLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Se necesita permiso de ubicación para guardar el punto.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrent({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        accuracy_m: loc.coords.accuracy,
        timestamp: new Date(loc.timestamp).toISOString(),
      });
    } catch (e) {
      setError('No se pudo obtener la ubicación. Revisa que el GPS esté activo.');
    }
    setLoading(false);
  }

  function savePoint() {
    if (!current) {
      setError('Primero pulsa "Obtener mi ubicación".');
      return;
    }
    const label = name.trim() || `Punto ${points.length + 1}`;
    setPoints((prev) => [...prev, { name: label, ...current }]);
    setName('');
    setCurrent(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Puntos de control</Text>
      <Text>Párate sobre la marca en el suelo y guarda su coordenada.</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del punto, ej. GCP-01"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.button} onPress={getLocation}>
        <Text>{loading ? 'Obteniendo ubicación...' : 'Obtener mi ubicación'}</Text>
      </TouchableOpacity>

      {current && (
        <View style={styles.card}>
          <Text>Lat: {current.lat.toFixed(7)}</Text>
          <Text>Lon: {current.lon.toFixed(7)}</Text>
          <Text>Precisión GPS: {current.accuracy_m ? `${current.accuracy_m.toFixed(1)} m` : 'no disponible'}</Text>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={savePoint}>
            <Text style={styles.buttonPrimaryText}>Guardar punto</Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.subtitle}>Puntos guardados: {points.length}</Text>
      <FlatList
        data={points}
        keyExtractor={(item, i) => `${item.name}-${i}`}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text>
              {item.lat.toFixed(7)}, {item.lon.toFixed(7)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 12 },
  button: { padding: 12, alignItems: 'center', backgroundColor: '#eee', borderRadius: 8, marginTop: 10 },
  buttonPrimary: { backgroundColor: '#007aff' },
  buttonPrimaryText: { color: '#fff', fontWeight: 'bold' },
  card: { marginTop: 12, padding: 12, backgroundColor: '#eef6ff', borderRadius: 8 },
  item: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  error: { color: 'red', marginTop: 8 },
});
