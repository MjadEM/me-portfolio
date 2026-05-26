// ============================================================================
// thermalGradient.js — Dégradé thermique sur le corps du moteur
// ----------------------------------------------------------------------------
// Quand la température estimée dépasse 60°C, la couleur de base du corps
// (bleu) s'interpole progressivement vers un rouge industriel chaud, jusqu'à
// saturation à 90°C. L'effet ne touche que `motor.userData.thermalMaterials`
// (le corps + les ailettes), pas les autres pièces (boîte à bornes, support).
//
// L'émissive du moteur reste pilotée par stateColors.js — pas de conflit
// car on ne modifie que `.color`, pas `.emissive`.
// ============================================================================

import * as THREE from 'three';

const TEMP_WARM_C = 60;     // température à laquelle l'effet commence
const TEMP_HOT_C  = 90;     // saturation
const HOT_COLOR   = new THREE.Color(0xc02818);   // rouge industriel chaud
const MAX_LERP    = 0.85;   // pourcentage max d'interpolation vers le rouge

export function createThermalGradientController(motor) {
  const mats = motor.userData.thermalMaterials || [];

  // Mémorise les couleurs de repos pour pouvoir lerp depuis elles
  const baseColors = mats.map(m => m.color.clone());

  return function update(temperatureC) {
    const t = Math.max(
      0,
      Math.min(1, (temperatureC - TEMP_WARM_C) / (TEMP_HOT_C - TEMP_WARM_C))
    );
    const lerpAmount = t * MAX_LERP;
    mats.forEach((mat, i) => {
      mat.color.copy(baseColors[i]).lerp(HOT_COLOR, lerpAmount);
    });
  };
}
