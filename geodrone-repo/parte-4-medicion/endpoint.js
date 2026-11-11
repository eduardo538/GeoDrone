// GeoDrone — Parte 4: Endpoint de la API para mediciones
// Paso 2 (después de measurements.js): expone los cálculos como
//   POST /api/measurements/calculate
//
// Este archivo NO depende de Express para probarse: la lógica vive en
// handleCalculate(body), que recibe el JSON del cuerpo y devuelve
// { status, json }. El adaptador de Express al final es solo una
// envoltura de 10 líneas para la Parte 1 (Node + Express).
//
// Uso en el backend de la Parte 1:
//   const router = require('./endpoint');
//   app.use('/api/measurements', router);
//
// o, si prefieren registrar la ruta a mano:
//   const { handleCalculate } = require('./endpoint');
//   app.post('/api/measurements/calculate', (req, res) => {
//     const { status, json } = handleCalculate(req.body);
//     res.status(status).json(json);
//   });

'use strict';

const { calculateMeasurement } = require('./measurements');

const VALID_TYPES = ['distance', 'area', 'perimeter', 'height-difference'];

// Valida y calcula. Nunca lanza: los errores del módulo se convierten
// en respuestas 400 con un mensaje en español, listo para mostrar.
function handleCalculate(body) {
  if (!body || typeof body !== 'object') {
    return {
      status: 400,
      json: { error: 'Se esperaba un JSON con { type, points }.' },
    };
  }

  const { type, points } = body;

  if (!VALID_TYPES.includes(type)) {
    return {
      status: 400,
      json: {
        error: `type debe ser uno de: ${VALID_TYPES.join(', ')}. Se recibió: ${type ?? 'ninguno'}.`,
      },
    };
  }

  if (!Array.isArray(points)) {
    return {
      status: 400,
      json: {
        error:
          'points debe ser una lista de puntos { lat, lon }. Ejemplo: [{ "lat": 19.91248, "lon": -99.57848 }].',
      },
    };
  }

  const minPoints = type === 'distance' || type === 'height-difference' ? 2 : 3;
  if (points.length < minPoints) {
    return {
      status: 400,
      json: {
        error: `Para "${type}" se necesitan al menos ${minPoints} puntos. Se recibieron ${points.length}.`,
      },
    };
  }

  try {
    const result = calculateMeasurement({ type, points });
    return { status: 200, json: result };
  } catch (err) {
    return { status: 400, json: { error: err.message } };
  }
}

// --- Adaptador Express (opcional) -------------------------------------
// Solo se activa si Express está instalado, para que este archivo se
// pueda probar con `node test-endpoint.js` sin instalar nada.
let router = null;
try {
  // eslint-disable-next-line global-require
  const express = require('express');
  router = express.Router();
  router.post('/calculate', (req, res) => {
    const { status, json } = handleCalculate(req.body);
    res.status(status).json(json);
  });
} catch (_) {
  router = null; // Express no instalado todavía: se usa handleCalculate directo.
}

module.exports = { handleCalculate, VALID_TYPES, router };
