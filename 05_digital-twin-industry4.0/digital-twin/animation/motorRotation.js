// ============================================================================
// motorRotation.js — Animation de rotation de l'arbre moteur
// ----------------------------------------------------------------------------
// Fait tourner le sous-groupe ShaftGroup du moteur autour de son axe (X) à
// une vitesse pilotée par rotor_speed_rpm (du JSON de données).
//
// Subtilité visuelle : à 1500 rpm = 25 tr/s, on aurait 0.42 tour/frame à
// 60 fps → le repère jaune sur l'arbre devient illisible (effet stroboscope).
// On applique donc un VISUAL_SLOWDOWN qui ralentit le rendu pour que le
// mouvement reste perceptible à l'œil nu — la vitesse physique réelle est
// toujours affichée dans les jauges (Phase 8).
// ============================================================================

const VISUAL_SLOWDOWN = 8;   // 1500 rpm → ~3 tours/s à l'écran

export function updateMotorRotation(motor, rpm, deltaTime) {
  const shaftGroup = motor.userData.shaftGroup;
  if (!shaftGroup) return;

  // ω (rad/s) = rpm × 2π / 60
  const omegaRad = (rpm * 2 * Math.PI) / 60;
  shaftGroup.rotation.x += (omegaRad / VISUAL_SLOWDOWN) * deltaTime;
}
