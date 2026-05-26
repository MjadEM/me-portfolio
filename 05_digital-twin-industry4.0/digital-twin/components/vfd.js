// ============================================================================
// vfd.js — Variateur de vitesse Siemens MICROMASTER 420
// ----------------------------------------------------------------------------
// Réf. réelle : 6SE6420-2AB13-7AA1 (vu sur le banc — boîtier vertical noir/gris
// avec petit écran d'affichage et boutons de commande sur la façade).
// Export : createVfd() → THREE.Group prêt à insérer dans la scène.
// ============================================================================

import * as THREE from 'three';

// ----- Palette -----
const COLOR_BODY      = 0x2a2a2a;   // boîtier principal gris très foncé
const COLOR_FRONT     = 0x4a4a4a;   // panneau de contrôle (un peu plus clair)
const COLOR_FRAME     = 0x101010;   // cadre LCD
const COLOR_SCREEN    = 0xffa040;   // afficheur 7-segments ambre (typique MM420)
const COLOR_BTN_GREY  = 0x666666;
const COLOR_BTN_RUN   = 0x2dbb2d;   // bouton MARCHE vert
const COLOR_BTN_STOP  = 0xcc2424;   // bouton ARRÊT rouge
const COLOR_SIEMENS   = 0x009999;   // bande marque Siemens (teal)
const COLOR_VENT      = 0x000000;

// ----- Dimensions de référence (mètres, FSA MM420 ~0.1 kW–0.4 kW) -----
const W = 0.10;   // largeur
const H = 0.3;   // hauteur
const D = 0.16;   // profondeur

export function createVfd() {
  const vfd = new THREE.Group();
  vfd.name = 'VFD';

  // -------------------------------------------------------------------------
  // Matériaux
  // -------------------------------------------------------------------------
  const matBody = new THREE.MeshStandardMaterial({
    color: COLOR_BODY, roughness: 0.65, metalness: 0.30,
  });
  const matFront = new THREE.MeshStandardMaterial({
    color: COLOR_FRONT, roughness: 0.55, metalness: 0.25,
  });
  const matFrame = new THREE.MeshStandardMaterial({
    color: COLOR_FRAME, roughness: 0.50, metalness: 0.20,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: COLOR_SCREEN, roughness: 0.40, metalness: 0.10,
    emissive: 0xff8000, emissiveIntensity: 0.75,
  });
  const matBtnGrey = new THREE.MeshStandardMaterial({
    color: COLOR_BTN_GREY, roughness: 0.50, metalness: 0.30,
  });
  const matBtnRun = new THREE.MeshStandardMaterial({
    color: COLOR_BTN_RUN, roughness: 0.45, metalness: 0.25,
    emissive: 0x115511, emissiveIntensity: 0.30,
  });
  const matBtnStop = new THREE.MeshStandardMaterial({
    color: COLOR_BTN_STOP, roughness: 0.45, metalness: 0.25,
    emissive: 0x441111, emissiveIntensity: 0.30,
  });
  const matSiemens = new THREE.MeshStandardMaterial({
    color: COLOR_SIEMENS, roughness: 0.55, metalness: 0.20,
  });
  const matVent = new THREE.MeshStandardMaterial({
    color: COLOR_VENT, roughness: 0.85, metalness: 0.10,
  });

  // -------------------------------------------------------------------------
  // 1. Corps principal
  // -------------------------------------------------------------------------
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matBody);
  body.castShadow = true;
  body.receiveShadow = true;
  vfd.add(body);

  // -------------------------------------------------------------------------
  // 2. Façade avant légèrement encastrée (panneau de contrôle BOP)
  // -------------------------------------------------------------------------
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.88, H * 0.88, 0.004),
    matFront
  );
  front.position.set(0, 0, D / 2 + 0.002);
  vfd.add(front);

  // -------------------------------------------------------------------------
  // 3. Bandeau "SIEMENS MICROMASTER 420" en haut de la façade
  // -------------------------------------------------------------------------
  const brandBar = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.85, 0.014, 0.003),
    matSiemens
  );
  brandBar.position.set(0, H * 0.40, D / 2 + 0.005);
  vfd.add(brandBar);

  // -------------------------------------------------------------------------
  // 4. Cadre + écran LCD ambre (zone affichage fréquence/paramètres)
  // -------------------------------------------------------------------------
  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.78, 0.055, 0.003),
    matFrame
  );
  screenFrame.position.set(0, H * 0.22, D / 2 + 0.005);
  vfd.add(screenFrame);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.66, 0.038, 0.003),
    matScreen
  );
  screen.position.set(0, H * 0.22, D / 2 + 0.007);
  vfd.add(screen);

  // -------------------------------------------------------------------------
  // 5. Boutons de navigation (5 boutons gris en rangée centrale)
  // -------------------------------------------------------------------------
  const btnNavGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 14);
  for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(btnNavGeo, matBtnGrey);
    btn.rotation.x = Math.PI / 2;
    btn.position.set((i - 2) * 0.016, H * 0.02, D / 2 + 0.006);
    vfd.add(btn);
  }

  // -------------------------------------------------------------------------
  // 6. Boutons MARCHE (vert) et ARRÊT (rouge) en bas de la façade
  // -------------------------------------------------------------------------
  const btnRunStopGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.005, 16);

  const btnRun = new THREE.Mesh(btnRunStopGeo, matBtnRun);
  btnRun.rotation.x = Math.PI / 2;
  btnRun.position.set(-0.020, -H * 0.20, D / 2 + 0.006);
  vfd.add(btnRun);

  const btnStop = new THREE.Mesh(btnRunStopGeo, matBtnStop);
  btnStop.rotation.x = Math.PI / 2;
  btnStop.position.set(0.020, -H * 0.20, D / 2 + 0.006);
  vfd.add(btnStop);

  // -------------------------------------------------------------------------
  // 7. Fentes de ventilation latérales (gauche + droite)
  // -------------------------------------------------------------------------
  const SLOT_COUNT = 9;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const y = -H * 0.42 + (i / (SLOT_COUNT - 1)) * H * 0.84;
    const slotL = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.004, D * 0.70),
      matVent
    );
    slotL.position.set(-W / 2 - 0.0005, y, 0);
    vfd.add(slotL);
    const slotR = slotL.clone();
    slotR.position.x = W / 2 + 0.0005;
    vfd.add(slotR);
  }

  // -------------------------------------------------------------------------
  // 8. Étiquette de paramétrage (rectangle blanc fin sous l'écran)
  // -------------------------------------------------------------------------
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.30, 0.008, 0.002),
    new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.7, metalness: 0.05 })
  );
  label.position.set(0, H * 0.13, D / 2 + 0.005);
  vfd.add(label);

  // -------------------------------------------------------------------------
  // Positionnement final : la face inférieure touche Y=0 (posé au sol)
  // -------------------------------------------------------------------------
  vfd.position.y = H / 2;

  return vfd;
}
