// ============================================================================
// dataSource.js — Façade unifiée pour lire les données du jumeau
// ----------------------------------------------------------------------------
// Toute la scène 3D appelle getCurrentData() sans se soucier de la source.
//
// Modes disponibles :
//   - 'mock' : utilise toujours mockData (pratique en démo offline)
//   - 'auto' : essaie Node-RED en premier ; fallback automatique sur mock si
//              l'endpoint n'est pas joignable ou si les données sont rances
//              (> 5 s sans réception)
//
// Un système d'événements permet à l'UI (badge LIVE/MOCK) d'être notifiée
// chaque fois que la source effective change.
// ============================================================================

import { getMockData } from './mockData.js';
import {
  fetchNodeRedData,
  getLastNodeRedSnapshot,
  isNodeRedFresh,
} from './nodeRedClient.js';

// 🔧 Mode de fonctionnement (modifier ici pour forcer le mock)
//   'auto' → essaie Node-RED, retombe sur mock si indisponible
//   'mock' → n'essaie jamais Node-RED (mode hors-ligne)
export const DATA_MODE = 'auto';

let currentSource = 'mock';                 // 'live' | 'mock'
const sourceListeners = [];

export function getDataSource() { return currentSource; }
export function onSourceChange(fn) { sourceListeners.push(fn); }

function setSource(source) {
  if (source === currentSource) return;
  currentSource = source;
  sourceListeners.forEach(fn => fn(source));
}

/**
 * Renvoie le dernier snapshot de données (jamais null).
 * En mode AUTO, déclenche un fetch asynchrone à chaque appel.
 */
export function getCurrentData() {
  if (DATA_MODE === 'mock') {
    setSource('mock');
    return getMockData();
  }

  // Mode AUTO : déclenche fetch en arrière-plan (non bloquant)
  fetchNodeRedData();

  // Source effective = live si on a une donnée fraîche, sinon mock
  if (isNodeRedFresh()) {
    setSource('live');
    return getLastNodeRedSnapshot();
  }
  setSource('mock');
  return getMockData();
}
