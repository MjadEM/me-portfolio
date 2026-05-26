// ============================================================================
// currentFlow.js — Flux électrique animé sous forme de particules
// ----------------------------------------------------------------------------
// Le long du câble VFD↔Moteur, on fait circuler N points lumineux suivant la
// courbe Catmull-Rom du câble. Vitesse, opacité et couleur sont modulés par
// le courant réel mesuré (current_avg_A) :
//   - I = 0 A    → particules presque invisibles, immobiles
//   - I = 1.5 A  → flux jaune fluide à vitesse nominale
//   - I > 1.4 A (surcharge) → couleur vire au rouge
// ============================================================================

import * as THREE from 'three';

const PARTICLE_COUNT       = 45;        // nombre de particules sur le câble
const NOMINAL_CURRENT_A    = 1.5;       // courant nominal du moteur 0.25 kW
const OVERLOAD_THRESHOLD_A = 1.4;       // seuil de bascule jaune → rouge
const SPEED_BASE   = 0.04;              // vitesse à I=0 (t-units/s)
const SPEED_GAIN   = 0.22;              // gain pour I = I_nominal
const COLOR_NORMAL   = new THREE.Color(0xffcc22);
const COLOR_OVERLOAD = new THREE.Color(0xff3322);

/**
 * Crée un système de particules circulant le long du câble fourni.
 * Le câble doit avoir été créé par createCable() (avec userData.curve).
 */
export function createFlowOnCable(cable) {
  const curve = cable.userData.curve;
  if (!curve) {
    console.warn('[currentFlow] câble sans courbe — flux ignoré');
    return null;
  }

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const tParams   = new Float32Array(PARTICLE_COUNT);

  // Distribution initiale uniforme par longueur d'arc
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    tParams[i] = i / PARTICLE_COUNT;
    const p = curve.getPointAt(tParams[i]);
    positions[i * 3]     = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: COLOR_NORMAL,
    size: 0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'flow_' + cable.name;
  points.frustumCulled = false;
  // Stocke l'état pour update
  points.userData = { curve, tParams };
  return points;
}

/**
 * Met à jour les positions des particules selon le courant et le temps.
 * À appeler dans la boucle de rendu avec le dt de l'horloge.
 */
export function updateFlow(flowPoints, currentA, dt) {
  if (!flowPoints) return;
  const { curve, tParams } = flowPoints.userData;
  const positions = flowPoints.geometry.attributes.position.array;

  // ───── Vitesse de circulation proportionnelle au courant ─────
  const speed = SPEED_BASE + (currentA / NOMINAL_CURRENT_A) * SPEED_GAIN;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    tParams[i] += speed * dt;
    if (tParams[i] >= 1) tParams[i] -= 1;
    const p = curve.getPointAt(tParams[i]);
    positions[i * 3]     = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  flowPoints.geometry.attributes.position.needsUpdate = true;

  // ───── Opacité : visible à partir de ~0.2 A ─────
  const opacity = Math.min(0.95, 0.1 + currentA * 0.6);
  flowPoints.material.opacity = opacity;

  // ───── Couleur : bascule jaune → rouge si surcharge ─────
  const targetColor = currentA > OVERLOAD_THRESHOLD_A ? COLOR_OVERLOAD : COLOR_NORMAL;
  flowPoints.material.color.copy(targetColor);
}
