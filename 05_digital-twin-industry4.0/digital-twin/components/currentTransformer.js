// ============================================================================
// currentTransformer.js — Transformateur de courant (TI) rouge
// ----------------------------------------------------------------------------
// Petit boîtier rouge clipsé sur rail DIN, avec une ouverture carrée sur le
// dessus pour le passage du conducteur primaire. Le PM2230 utilise 3 TI (un
// par phase) pour mesurer le courant ligne.
// Export : createCurrentTransformer() → THREE.Group
// ============================================================================

import * as THREE from 'three';

const COLOR_TI_RED   = 0xc02020;
const COLOR_BLACK    = 0x0d0d0d;
const COLOR_TERMINAL = 0x707578;

export function createCurrentTransformer() {
  const ct = new THREE.Group();
  ct.name = 'CT';

  const matRed = new THREE.MeshStandardMaterial({
    color: COLOR_TI_RED, roughness: 0.55, metalness: 0.10,
  });
  const matBlack = new THREE.MeshStandardMaterial({
    color: COLOR_BLACK, roughness: 0.75, metalness: 0.15,
  });
  const matTerm = new THREE.MeshStandardMaterial({
    color: COLOR_TERMINAL, roughness: 0.50, metalness: 0.45,
  });

  const W = 0.038;   // largeur (X)
  const H = 0.050;   // hauteur (Y)
  const D = 0.045;   // profondeur (Z)

  // Corps rouge
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matRed);
  body.castShadow = true;
  body.receiveShadow = true;
  ct.add(body);

  // Ouverture pour le primaire (rectangle noir sur le dessus)
  const aperture = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.60, 0.003, D * 0.55),
    matBlack
  );
  aperture.position.y = H / 2 - 0.0015;
  ct.add(aperture);

  // Petit bornier secondaire en bas (rectangle gris métal)
  const term = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.75, 0.007, D * 0.55),
    matTerm
  );
  term.position.y = -H / 2 - 0.0035;
  ct.add(term);

  return ct;
}
