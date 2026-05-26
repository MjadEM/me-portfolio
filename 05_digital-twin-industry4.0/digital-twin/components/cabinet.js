// ============================================================================
// cabinet.js — Châssis du banc didactique (panneau gris perforé + cadre)
// ----------------------------------------------------------------------------
// Reproduit le support réel observé en photo : grand panneau métallique
// gris perforé (cable management board), monté dans un cadre blanc avec
// deux pieds, et garni de deux rails DIN horizontaux pour fixer les
// composants (VFD, PM2230, NA111, PLC...).
//
// Export :
//   - createCabinet()            → THREE.Group (le banc complet)
//   - CABINET_PANEL_FRONT_Z      → coordonnée Z de la face avant du panneau
//                                   (utile pour aligner les composants montés)
//   - CABINET_LOW_ROW_Y          → Y du rail DIN bas
//   - CABINET_HIGH_ROW_Y         → Y du rail DIN haut
// ============================================================================

import * as THREE from 'three';

// ----- Palette -----
const COLOR_PANEL       = 0xb0b4b6;   // gris clair du panneau perforé
const COLOR_FRAME       = 0xeeeeec;   // blanc cassé du cadre métallique
const COLOR_FOOT        = 0xd2d2d0;   // pieds (légèrement plus sombres)
const COLOR_DINRAIL     = 0xa8aaac;   // rails DIN gris satiné

// ----- Dimensions du banc -----
const FRAME_W   = 1.80;   // largeur totale du châssis
const FRAME_H   = 1.20;   // hauteur totale (du sol au haut du cadre)
const PANEL_W   = 1.65;   // largeur du panneau intérieur
const PANEL_H   = 1.1;   // hauteur du panneau intérieur
const PANEL_T   = 0.015;  // épaisseur du panneau
const BEAM_T    = 0.05;   // section des montants du cadre
const FOOT_H    = 0.10;   // hauteur des pieds

// Centre vertical du panneau (calculé pour le centrer dans le cadre)
const PANEL_CY  = FOOT_H + (FRAME_H - FOOT_H) / 2;   // ~1.05 m

// Positions des rails DIN (et donc des deux "rangées" de composants)
const LOW_ROW_Y  = PANEL_CY - 0.32;   // ~0.73 m  → VFD, PM, NA111
const HIGH_ROW_Y = PANEL_CY + 0.32;   // ~1.37 m  → PLC, colonne lumineuse

export function createCabinet() {
  const cabinet = new THREE.Group();
  cabinet.name = 'Cabinet';

  // -------------------------------------------------------------------------
  // Texture procédurale "panneau perforé" (canvas 2D → CanvasTexture)
  // -------------------------------------------------------------------------
  const perfTex = createPerforationTexture();
  perfTex.wrapS = THREE.RepeatWrapping;
  perfTex.wrapT = THREE.RepeatWrapping;
  // ~60 trous en largeur, ~55 en hauteur → motif visible mais pas écrasant
  perfTex.repeat.set(60, 55);

  // -------------------------------------------------------------------------
  // Matériaux
  // -------------------------------------------------------------------------
  const matPanel = new THREE.MeshStandardMaterial({
    color: COLOR_PANEL,
    roughness: 0.70, metalness: 0.45,
    map: perfTex,
  });
  const matFrame = new THREE.MeshStandardMaterial({
    color: COLOR_FRAME, roughness: 0.55, metalness: 0.20,
  });
  const matFoot = new THREE.MeshStandardMaterial({
    color: COLOR_FOOT, roughness: 0.60, metalness: 0.20,
  });
  const matRail = new THREE.MeshStandardMaterial({
    color: COLOR_DINRAIL, roughness: 0.30, metalness: 0.85,
  });

  // -------------------------------------------------------------------------
  // 1. Panneau perforé central
  // -------------------------------------------------------------------------
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(PANEL_W, PANEL_H, PANEL_T),
    matPanel
  );
  panel.position.set(0, PANEL_CY, 0);
  panel.receiveShadow = true;
  cabinet.add(panel);

  // -------------------------------------------------------------------------
  // 2. Cadre périphérique (4 montants blancs)
  // -------------------------------------------------------------------------
  // Montants verticaux gauche / droite
  const beamSideGeo = new THREE.BoxGeometry(BEAM_T, FRAME_H - FOOT_H, BEAM_T);
  const beamL = new THREE.Mesh(beamSideGeo, matFrame);
  beamL.position.set(-FRAME_W / 2 + BEAM_T / 2, FOOT_H + (FRAME_H - FOOT_H) / 2, 0);
  beamL.castShadow = true;
  beamL.receiveShadow = true;
  cabinet.add(beamL);

  const beamR = beamL.clone();
  beamR.position.x = FRAME_W / 2 - BEAM_T / 2;
  cabinet.add(beamR);

  // Traverses horizontales haut et bas
  const beamTopBotGeo = new THREE.BoxGeometry(FRAME_W, BEAM_T, BEAM_T);
  const beamTop = new THREE.Mesh(beamTopBotGeo, matFrame);
  beamTop.position.set(0, FRAME_H - BEAM_T / 2, 0);
  beamTop.castShadow = true;
  cabinet.add(beamTop);

  const beamBot = new THREE.Mesh(beamTopBotGeo, matFrame);
  beamBot.position.set(0, FOOT_H + BEAM_T / 2, 0);
  beamBot.castShadow = true;
  cabinet.add(beamBot);

  // -------------------------------------------------------------------------
  // 3. Pieds en U sous chaque montant
  // -------------------------------------------------------------------------
  const footGeo = new THREE.BoxGeometry(0.22, FOOT_H, 0.35);
  const footL = new THREE.Mesh(footGeo, matFoot);
  footL.position.set(-FRAME_W / 2 + 0.07, FOOT_H / 2, 0);
  footL.castShadow = true;
  footL.receiveShadow = true;
  cabinet.add(footL);

  const footR = footL.clone();
  footR.position.x = FRAME_W / 2 - 0.07;
  cabinet.add(footR);

  // -------------------------------------------------------------------------
  // 4. Rails DIN horizontaux (2 niveaux pour fixer les composants)
  // -------------------------------------------------------------------------
  const railGeo = new THREE.BoxGeometry(PANEL_W * 0.92, 0.030, 0.012);
  const railLow = new THREE.Mesh(railGeo, matRail);
  railLow.position.set(0, LOW_ROW_Y, PANEL_T / 2 + 0.006);
  railLow.castShadow = true;
  cabinet.add(railLow);

  const railHigh = new THREE.Mesh(railGeo, matRail);
  railHigh.position.set(0, HIGH_ROW_Y, PANEL_T / 2 + 0.006);
  railHigh.castShadow = true;
  cabinet.add(railHigh);

  return cabinet;
}

// ----------------------------------------------------------------------------
// Helper : texture procédurale d'un panneau perforé
// (canvas 2D 24×24 px avec un trou rond foncé au centre, répété en tiling)
// ----------------------------------------------------------------------------
function createPerforationTexture() {
  const SIZE = 24;
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d');

  // Fond métal clair
  ctx.fillStyle = '#b0b4b6';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Halo sombre périphérique (effet emboutissage léger)
  ctx.fillStyle = '#909496';
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  // Trou central foncé (perforation)
  ctx.fillStyle = '#3a3d40';
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ----------------------------------------------------------------------------
// Constantes exportées : positions de référence pour aligner les composants
// montés sur le panneau (utilisées depuis main.js).
// ----------------------------------------------------------------------------
export const CABINET_PANEL_FRONT_Z = PANEL_T / 2;
export const CABINET_LOW_ROW_Y  = LOW_ROW_Y;
export const CABINET_HIGH_ROW_Y = HIGH_ROW_Y;
