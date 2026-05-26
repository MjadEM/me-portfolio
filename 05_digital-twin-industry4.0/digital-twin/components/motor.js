// ============================================================================
// motor.js — Moteur asynchrone triphasé (modèle 3D semi-réaliste)
// ----------------------------------------------------------------------------
// Réf. réelle : moteur 0.25 kW, 400/230 V, 1350 tr/min, 4 pôles
// (vu en photo sur le banc — couleur bleue caractéristique).
// Construction 100% à partir de géométries primitives Three.js
// (CylinderGeometry, BoxGeometry, SphereGeometry).
// Export : createMotor() → THREE.Group prêt à insérer dans la scène.
// Sous-groupe nommé 'ShaftGroup' : utilisé en Phase 7 pour l'animation de
// rotation de l'arbre.
// ============================================================================

import * as THREE from 'three';

// ----- Palette couleurs (extraite des photos du banc) -----
const COLOR_BODY        = 0x3a7ab8;  // bleu carrosserie moteur
const COLOR_BODY_DARK   = 0x2f6ba0;  // bleu ailettes (un peu plus sombre)
const COLOR_STEEL       = 0xb8b8b8;  // arbre acier
const COLOR_BRACKET     = 0x1a1a1a;  // support métallique noir
const COLOR_PLATE       = 0xeeeeee;  // plaque signalétique
const COLOR_MARK        = 0xffcc00;  // repère jaune sur l'arbre (visualisation)

// ----- Dimensions de référence (mètres, échelle réaliste) -----
const BODY_RADIUS   = 0.12;   // rayon du corps cylindrique (~ 150 mm de diamètre)
const BODY_LENGTH   = 0.20;    // longueur du corps
const FIN_COUNT     = 18;      // nombre d'ailettes de refroidissement
const FIN_DEPTH     = 0.014;   // hauteur radiale d'une ailette
const FIN_THICKNESS = 0.005;   // épaisseur tangentielle d'une ailette

export function createMotor() {
  // Groupe racine : tout est exprimé en coordonnées locales.
  // L'axe X local = axe de rotation du moteur (l'arbre sort en +X).
  const motor = new THREE.Group();
  motor.name = 'Motor';

  // -------------------------------------------------------------------------
  // Matériaux PBR (réutilisés sur plusieurs meshes)
  // -------------------------------------------------------------------------
  const matBody = new THREE.MeshStandardMaterial({
    color: COLOR_BODY, roughness: 0.45, metalness: 0.55,
  });
  const matBodyDark = new THREE.MeshStandardMaterial({
    color: COLOR_BODY_DARK, roughness: 0.50, metalness: 0.55,
  });
  const matSteel = new THREE.MeshStandardMaterial({
    color: COLOR_STEEL, roughness: 0.30, metalness: 0.85,
  });
  const matBlack = new THREE.MeshStandardMaterial({
    color: COLOR_BRACKET, roughness: 0.65, metalness: 0.30,
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: COLOR_PLATE, roughness: 0.75, metalness: 0.05,
  });
  const matMark = new THREE.MeshStandardMaterial({
    color: COLOR_MARK, roughness: 0.50, metalness: 0.20,
    emissive: 0x332200, emissiveIntensity: 0.4,
  });

  // -------------------------------------------------------------------------
  // 1. Corps principal — cylindre bleu (axe orienté selon X)
  // -------------------------------------------------------------------------
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_LENGTH, 32),
    matBody
  );
  body.rotation.z = Math.PI / 2;   // bascule l'axe Y par défaut vers X
  body.castShadow = true;
  body.receiveShadow = true;
  motor.add(body);

  // -------------------------------------------------------------------------
  // 2. Ailettes de refroidissement — réparties radialement autour du corps
  // -------------------------------------------------------------------------
  const finLength = BODY_LENGTH * 0.95;
  for (let i = 0; i < FIN_COUNT; i++) {
    const angle = (i / FIN_COUNT) * Math.PI * 2;
    // On saute l'arc inférieur (~120°) où passent la plaque de base et
    // les pieds de fixation, sinon les ailettes traversent le support.
    if (Math.cos(angle) < -0.45) continue;
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(finLength, FIN_DEPTH * 2, FIN_THICKNESS),
      matBodyDark
    );
    // Position : au centre du corps + décalage radial à la surface
    const r = BODY_RADIUS + FIN_DEPTH;
    fin.position.set(0, Math.cos(angle) * r, Math.sin(angle) * r);
    // Orientation : la hauteur (axe Y local) suit la direction radiale
    fin.rotation.x = angle;
    fin.castShadow = true;
    motor.add(fin);
  }

  // -------------------------------------------------------------------------
  // 3. Flasque avant (côté arbre) — petite collerette légèrement plus large
  // -------------------------------------------------------------------------
  const flangeFront = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_RADIUS * 0.92, BODY_RADIUS * 1.05, 0.025, 32),
    matBody
  );
  flangeFront.rotation.z = Math.PI / 2;
  flangeFront.position.x = BODY_LENGTH / 2 + 0.012;
  flangeFront.castShadow = true;
  motor.add(flangeFront);

  // -------------------------------------------------------------------------
  // 4. Couvercle ventilateur (côté arrière) — cylindre + dôme + slots
  // -------------------------------------------------------------------------
  const fanHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_RADIUS * 1.08, BODY_RADIUS * 1.02, 0.055, 32),
    matBody
  );
  fanHousing.rotation.z = Math.PI / 2;
  fanHousing.position.x = -BODY_LENGTH / 2 - 0.0275;
  fanHousing.castShadow = true;
  motor.add(fanHousing);

  // Dôme arrière (demi-sphère)
  const fanDome = new THREE.Mesh(
    new THREE.SphereGeometry(BODY_RADIUS * 1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matBody
  );
  fanDome.position.x = -BODY_LENGTH / 2 - 0.055;
  fanDome.rotation.z = -Math.PI / 2;
  fanDome.castShadow = true;
  motor.add(fanDome);

  // Slots de ventilation (10 fentes axiales sombres sur le couvercle)
  const SLOT_COUNT = 10;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const a = (i / SLOT_COUNT) * Math.PI * 2;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.006, 0.010),
      matBlack
    );
    const r = BODY_RADIUS * 1.085;
    slot.position.set(-BODY_LENGTH / 2 - 0.0275, Math.cos(a) * r, Math.sin(a) * r);
    slot.rotation.x = a;
    motor.add(slot);
  }

  // -------------------------------------------------------------------------
  // 5. Arbre + repère jaune (sous-groupe rotatif — animé en Phase 7)
  // -------------------------------------------------------------------------
  const shaftGroup = new THREE.Group();
  shaftGroup.name = 'ShaftGroup';

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.085, 16),
    matSteel
  );
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = BODY_LENGTH / 2 + 0.025 + 0.0425;
  shaft.castShadow = true;
  shaftGroup.add(shaft);

  // Marque jaune sur l'arbre : permettra de voir la rotation à l'œil nu
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.020, 0.004),
    matMark
  );
  mark.position.set(BODY_LENGTH / 2 + 0.025 + 0.0425, 0.014, 0);
  shaftGroup.add(mark);

  motor.add(shaftGroup);

  // -------------------------------------------------------------------------
  // 6. Boîte à bornes (sur le dessus) — bleue avec 4 vis aux coins
  // -------------------------------------------------------------------------
  const jbW = 0.09, jbH = 0.05, jbD = 0.09;
  const junctionBox = new THREE.Mesh(
    new THREE.BoxGeometry(jbW, jbH, jbD),
    matBody
  );
  junctionBox.position.y = BODY_RADIUS + jbH / 2 - 0.005;
  junctionBox.castShadow = true;
  junctionBox.receiveShadow = true;
  motor.add(junctionBox);

  // 4 vis aux coins de la boîte à bornes
  const screwGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 8);
  const screwY = BODY_RADIUS + jbH - 0.005;
  const screwOffset = 0.012;
  const screwPositions = [
    [ jbW/2 - screwOffset, screwY,  jbD/2 - screwOffset],
    [ jbW/2 - screwOffset, screwY, -jbD/2 + screwOffset],
    [-jbW/2 + screwOffset, screwY,  jbD/2 - screwOffset],
    [-jbW/2 + screwOffset, screwY, -jbD/2 + screwOffset],
  ];
  for (const [x, y, z] of screwPositions) {
    const screw = new THREE.Mesh(screwGeo, matSteel);
    screw.position.set(x, y, z);
    motor.add(screw);
  }

  // -------------------------------------------------------------------------
  // 7. Plaque signalétique blanche (côté visible)
  // -------------------------------------------------------------------------
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.045, 0.002),
    matPlate
  );
  plate.position.set(0, -0.005, BODY_RADIUS + 0.001);
  motor.add(plate);

  // -------------------------------------------------------------------------
  // 8. Support de fixation (équerre noire en L)
  // -------------------------------------------------------------------------
  // Plaque horizontale au sol
  const baseplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.02, 0.22),
    matBlack
  );
  baseplate.position.y = -BODY_RADIUS - 0.04;
  baseplate.castShadow = true;
  baseplate.receiveShadow = true;
  motor.add(baseplate);

  // Riser vertical à l'arrière de la base (forme L vue de profil)
  const riser = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.12, 0.02),
    matBlack
  );
  riser.position.set(0, -BODY_RADIUS + 0.025, -BODY_RADIUS - 0.005);
  riser.castShadow = true;
  motor.add(riser);

  // Deux pieds qui relient le corps à la plaque de base
  const footGeo = new THREE.BoxGeometry(0.025, 0.04, 0.06);
  const footRight = new THREE.Mesh(footGeo, matBlack);
  footRight.position.set( BODY_LENGTH * 0.30, -BODY_RADIUS - 0.02, 0);
  footRight.castShadow = true;
  motor.add(footRight);
  const footLeft = footRight.clone();
  footLeft.position.x = -BODY_LENGTH * 0.30;
  motor.add(footLeft);

  // -------------------------------------------------------------------------
  // Positionnement final : la face inférieure de la baseplate touche Y = 0
  // (la base est à y = -BODY_RADIUS - 0.04 - 0.01 = -0.125 en local)
  // -------------------------------------------------------------------------
  motor.position.y = BODY_RADIUS + 0.04 + 0.01;

  // -------------------------------------------------------------------------
  // Références exposées pour les animations (Phase 7+)
  //   - shaftGroup       : sous-groupe à faire tourner selon le RPM
  //   - glowMaterials    : matériaux dont on module emissive selon l'état
  //   - thermalMaterials : matériaux destinés au gradient thermique (Phase 11)
  // -------------------------------------------------------------------------
  motor.userData.shaftGroup = shaftGroup;
  motor.userData.glowMaterials = [matBody, matBodyDark];
  motor.userData.thermalMaterials = [matBody, matBodyDark];

  return motor;
}
