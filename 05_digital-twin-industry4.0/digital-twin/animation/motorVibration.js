// ============================================================================
// motorVibration.js — Légère oscillation du moteur sur son support
// ----------------------------------------------------------------------------
// Quand vibration_mm_s dépasse le seuil (3 mm/s), on applique un micro-jitter
// sinusoïdal sur la position X/Y du moteur. Amplitude proportionnelle à
// l'excès au-dessus du seuil (plafonnée à ~3 mm de déplacement visuel).
//
// Implémenté comme un contrôleur : capture la position de repos à l'init,
// puis update(vibration, elapsed) à chaque frame.
// ============================================================================

const VIBRATION_THRESHOLD = 3.0;   // mm/s
const MAX_AMPLITUDE_M     = 0.003; // déplacement visuel max (3 mm)
const SCALE_RANGE         = 3.0;   // au-dessus du seuil, sature à seuil+SCALE_RANGE

export function createVibrationController(motor) {
  // Capture les positions de repos (initialisées par main.js)
  const restX = motor.position.x;
  const restY = motor.position.y;

  return function update(vibrationMmS, elapsedSec) {
    if (vibrationMmS <= VIBRATION_THRESHOLD) {
      // Retour à la position de repos
      motor.position.x = restX;
      motor.position.y = restY;
      return;
    }
    // Intensité 0..1 selon l'excès au-dessus du seuil
    const intensity = Math.min(1, (vibrationMmS - VIBRATION_THRESHOLD) / SCALE_RANGE);
    const amp = MAX_AMPLITUDE_M * intensity;
    // Deux sinusoïdes à fréquences non multiples → mouvement chaotique
    motor.position.x = restX + amp * Math.sin(elapsedSec * 62);
    motor.position.y = restY + amp * 0.5 * Math.cos(elapsedSec * 78);
  };
}
