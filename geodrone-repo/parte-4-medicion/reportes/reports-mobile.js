// GeoDrone — Parte 4: Compartir reportes desde el celular (Expo)
//
// Instalación:
//   npx expo install expo-print expo-sharing expo-file-system
//
// Uso:
//   import { sharePdfReport, shareCsvReport } from './reports-mobile';
//   await sharePdfReport(measurement, meta, validation);
//   await shareCsvReport(measurement, meta);
//
// El PDF se genera desde el HTML (expo-print), el CSV se guarda
// como archivo y se comparte con el menú nativo del celular
// (WhatsApp, correo, Drive, etc.).

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { generateHtmlReport, measurementToCsv } from './reports';

export async function sharePdfReport(measurement, meta = {}, validation = []) {
  const html = generateHtmlReport(measurement, meta, validation);
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    return { uri, shared: false, message: 'Compartir no está disponible en este dispositivo.' };
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  return { uri, shared: true };
}

export async function shareCsvReport(measurement, meta = {}) {
  const csv = measurementToCsv(measurement, meta);
  const uri = `${FileSystem.documentDirectory}geodrone-medicion.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (!(await Sharing.isAvailableAsync())) {
    return { uri, shared: false, message: 'Compartir no está disponible en este dispositivo.' };
  }
  await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
  return { uri, shared: true };
}
