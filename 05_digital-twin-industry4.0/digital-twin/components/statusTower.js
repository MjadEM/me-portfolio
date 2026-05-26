// ============================================================================
// statusTower.js — Colonne lumineuse 3 segments (vert / orange / rouge)
// ----------------------------------------------------------------------------
// Indicateur visuel de l'état du banc :
//   - Vert (bas)    : RUNNING
//   - Orange (mid)  : avertissement / état dégradé
//   - Rouge (haut)  : FAULT
//
// Export :
//   - createStatusTower()              → THREE.Group (orientation : tower vers +Y)
//   - les 3 lentilles sont nommées 'lens_green', 'lens_orange', 'lens_red'
//     pour pouvoir piloter leur émissive depuis les animations (Phase 7).
// ============================================================================

import * as THREE from 'three';

const COLOR_BLACK = 0x141414;

export function createStatusTower() {
  const tower = new THREE.Group();
  tower.name = 'StatusTower';

  const matBlack = new THREE.MeshStandardMaterial({
    color: COLOR_BLACK, roughness: 0.65, metalness: 0.30,
  });

  // -------------------------------------------------------------------------
  // 1. Bras de fixation horizontal (attache la colonne au panneau)
  // -------------------------------------------------------------------------
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.10), matBlack);
  arm.position.set(0, 0.006, 0.013);//-0.05
  arm.castShadow = true;
  tower.add(arm);

  // -------------------------------------------------------------------------
  // 2. Base noire de la colonne (pied)
  // -------------------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.040, 24),
    matBlack
  );
  base.position.y = 0.020;
  base.castShadow = true;
  tower.add(base);

  // -------------------------------------------------------------------------
  // 3. Trois lentilles colorées empilées (bas vers haut : vert / orange / rouge)
  //    Chaque lentille : MeshStandardMaterial transparent + emissive doux.
  //    L'intensité émissive sera modulée en Phase 7 selon l'état du banc.
  // -------------------------------------------------------------------------
  const segments = [
    { name: 'lens_green',  color: 0x33dd33, emissive: 0x117711 },
    { name: 'lens_orange', color: 0xffaa22, emissive: 0x884411 },
    { name: 'lens_red',    color: 0xff3030, emissive: 0x881010 },
  ];

  const SEG_HEIGHT = 0.070;//0.055
  const SEG_GAP    = 0.005;
  const lensRefs = {};   // pour animation Phase 7
  let segY = 0.040; // sommet de la base
  for (const { name, color, emissive } of segments) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      emissive,
      emissiveIntensity: 0.20,  // initialement éteint (faible halo)
      roughness: 0.20,
      metalness: 0.10,
    });
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.040, 0.040, SEG_HEIGHT, 24),
      mat
    );
    lens.position.y = segY + SEG_HEIGHT / 2;
    lens.name = name;
    tower.add(lens);
    // Référence directe par couleur pour les animations
    lensRefs[name.replace('lens_', '')] = lens;

    // Petit anneau noir entre les segments
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.040, 0.040, SEG_GAP, 24),
      matBlack
    );
    ring.position.y = segY + SEG_HEIGHT + SEG_GAP / 2;
    tower.add(ring);

    segY += SEG_HEIGHT + SEG_GAP;
  }

  // Exposé pour pilotage par stateColors.js
  tower.userData.lenses = lensRefs;

  // -------------------------------------------------------------------------
  // 4. Chapeau noir au sommet
  // -------------------------------------------------------------------------
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.014, 24),
    matBlack
  );
  cap.position.y = segY + 0.007;
  cap.castShadow = true;
  tower.add(cap);

  return tower;
}
