// ============================================================================
// stateColors.js — Pilotage des couleurs d'état (glow moteur + colonne lum.)
// ----------------------------------------------------------------------------
// Lit l'état du jumeau (RUNNING / STOPPED / FAULT + flag anomaly) et applique :
//   - Sur le moteur     : glow émissif léger sur le corps (vert/rouge/aucun)
//   - Sur la colonne    : segment correspondant illuminé (logique tricolore)
//
// Règles d'état (de la plus prioritaire à la moins) :
//   FAULT                                → rouge pulsant 2 Hz
//   RUNNING + anomaly_detected           → orange (avertissement)
//   RUNNING                              → vert
//   STOPPED                              → aucun glow
// ============================================================================

import * as THREE from 'three';

// Couleurs cibles pour le glow du moteur
const COLOR_GREEN = new THREE.Color(0x118833);
const COLOR_RED   = new THREE.Color(0xaa1818);
const COLOR_BLACK = new THREE.Color(0x000000);

// Intensités émissives de référence
const TOWER_ON_INTENSITY  = 1.6;
const TOWER_OFF_INTENSITY = 0.15;
const MOTOR_GLOW_INTENSITY = 0.30;

export function updateStateColors({ motor, statusTower }, data, elapsedTime) {
  const state = data.motor.state;
  const anomaly = data.motor.anomaly_detected;

  // Niveau de pulsation pour les états "rouge" (2 Hz)
  const pulse = 0.55 + 0.45 * Math.sin(elapsedTime * 2 * Math.PI * 2);

  // -------------------------------------------------------------------------
  // 1. Détermination des états (1 seul des 4 booléens vrai à la fois)
  // -------------------------------------------------------------------------
  let isFault   = state === 'FAULT';
  let isWarning = !isFault && state === 'RUNNING' && anomaly;
  let isRunning = !isFault && !isWarning && state === 'RUNNING';
  let isStopped = state === 'STOPPED';

  // -------------------------------------------------------------------------
  // 2. Glow émissif sur le corps du moteur
  // -------------------------------------------------------------------------
  let glowColor, glowIntensity;
  if (isFault) {
    glowColor = COLOR_RED;
    glowIntensity = MOTOR_GLOW_INTENSITY * (0.4 + pulse * 0.6);
  } else if (isRunning) {
    glowColor = COLOR_GREEN;
    glowIntensity = MOTOR_GLOW_INTENSITY;
  } else if (isWarning) {
    // Orange via mélange — pas critique, on garde vert atténué pour rester subtil
    glowColor = COLOR_GREEN;
    glowIntensity = MOTOR_GLOW_INTENSITY * 0.5;
  } else {
    glowColor = COLOR_BLACK;
    glowIntensity = 0;
  }

  for (const mat of motor.userData.glowMaterials || []) {
    mat.emissive.copy(glowColor);
    mat.emissiveIntensity = glowIntensity;
  }

  // -------------------------------------------------------------------------
  // 3. Colonne lumineuse : 1 segment allumé selon l'état
  // -------------------------------------------------------------------------
  const lenses = statusTower.userData.lenses;
  if (!lenses) return;

  // Par défaut tout en mode "halo faible"
  let iGreen = TOWER_OFF_INTENSITY;
  let iOrange = TOWER_OFF_INTENSITY;
  let iRed = TOWER_OFF_INTENSITY;

  if (isRunning)       iGreen  = TOWER_ON_INTENSITY;
  else if (isWarning)  iOrange = TOWER_ON_INTENSITY;
  else if (isFault)    iRed    = TOWER_ON_INTENSITY * pulse;
  // isStopped → tout reste éteint (halo faible)

  lenses.green.material.emissiveIntensity  = iGreen;
  lenses.orange.material.emissiveIntensity = iOrange;
  lenses.red.material.emissiveIntensity    = iRed;
}
