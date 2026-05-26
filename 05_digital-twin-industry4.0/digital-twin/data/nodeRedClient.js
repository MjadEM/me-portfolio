// ============================================================================
// nodeRedClient.js — Récupération des données depuis Node-RED
// ----------------------------------------------------------------------------
// Le flow Node-RED doit exposer un endpoint HTTP qui répond le JSON décrit
// dans la spec (cf. mockData.js pour le schéma exact).
//
// Le client gère :
//   - timeout court (1.5 s) pour ne jamais bloquer l'UI
//   - dédoublonnage des requêtes (inFlight)
//   - notion de "fraîcheur" : on est considéré "live" tant que le dernier
//     fetch réussi a moins de 5 s. Au-delà → considéré disconnecté, le
//     dataSource bascule sur le mock.
// ============================================================================

// URL de l'endpoint HTTP Node-RED (à adapter selon ton déploiement)
const NODE_RED_ENDPOINT = 'http://localhost:1880/twin-data';
const FETCH_TIMEOUT_MS = 1500;
const STALE_AFTER_MS   = 5000;

let lastValidData = null;
let lastSuccessTs = 0;       // performance.now() du dernier fetch OK
let inFlight = false;        // évite les requêtes concurrentes

/**
 * Lance une requête vers Node-RED. Asynchrone, non bloquante.
 * Le résultat est stocké dans le cache interne — lire ensuite via
 * getLastNodeRedSnapshot() et isNodeRedFresh().
 */
export async function fetchNodeRedData() {
  if (inFlight) return;
  inFlight = true;
  try {
    const res = await fetch(NODE_RED_ENDPOINT, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      lastValidData = await res.json();
      lastSuccessTs = performance.now();
    }
  } catch (_) {
    // Silence volontaire : l'absence d'endpoint est un état normal pendant
    // le développement. L'utilisateur voit l'état dans le badge HUD.
  } finally {
    inFlight = false;
  }
}

export function getLastNodeRedSnapshot() {
  return lastValidData;
}

/** True si on a reçu une donnée fraîche (< STALE_AFTER_MS). */
export function isNodeRedFresh() {
  return lastValidData !== null
      && (performance.now() - lastSuccessTs) < STALE_AFTER_MS;
}
