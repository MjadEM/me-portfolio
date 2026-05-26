// ============================================================================
// cables.js — Câblage entre les composants du banc
// ----------------------------------------------------------------------------
// Les câbles sont des tubes (TubeGeometry) extrudés le long d'une courbe
// Catmull-Rom 3D définie par quelques points de passage. Cela donne des
// câbles fluides et "drapants" comme dans la réalité, sans avoir besoin de
// physique.
//
// Schéma de câblage modélisé :
//   1. VFD → Moteur     : puissance triphasée (gros câble noir)
//   2. PLC → VFD        : commande (câble bleu fin)
//   3. PM2230 → NA111   : Modbus RTU (câble jaune fin)
//   4. 3× TI → PM2230   : secondaires des transformateurs (3 fils L1/L2/L3)
//
// Export :
//   - createCable(points, radius, color, segments) — helper bas-niveau
//   - createBenchCables(positions) — construit toutes les liaisons du banc
//   - CABLE_COLORS — palette utilisée (référence pour la légende UI)
// ============================================================================

import * as THREE from 'three';

// ----- Palette des câbles -----
const COLOR_BLACK    = 0x0e0e0e;
const COLOR_BLUE     = 0x2660c8;
const COLOR_YELLOW   = 0xd9b820;
const COLOR_PHASE_L1 = 0xc02828;   // L1 rouge
const COLOR_PHASE_L2 = 0xdddddd;   // L2 blanc (norme française)
const COLOR_PHASE_L3 = 0x2660c8;   // L3 bleu

export const CABLE_COLORS = {
  POWER:    COLOR_BLACK,
  CONTROL:  COLOR_BLUE,
  MODBUS:   COLOR_YELLOW,
  PHASE_L1: COLOR_PHASE_L1,
  PHASE_L2: COLOR_PHASE_L2,
  PHASE_L3: COLOR_PHASE_L3,
};

// ----------------------------------------------------------------------------
// Helper bas-niveau : un câble = courbe Catmull-Rom + TubeGeometry
// ----------------------------------------------------------------------------
export function createCable(points, radius = 0.005, color = COLOR_BLACK, segments = 40) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const geo = new THREE.TubeGeometry(curve, segments, radius, 8, false);
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.65, metalness: 0.15,
  });
  const cable = new THREE.Mesh(geo, mat);
  cable.castShadow = true;
  cable.receiveShadow = false;
  // On stocke la courbe sur le mesh — sera utile en Phase 9 pour faire
  // circuler des particules le long du câble.
  cable.userData.curve = curve;
  return cable;
}

// Raccourci de lecture des positions
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ----------------------------------------------------------------------------
// Construction des câbles du banc à partir des positions des composants
// ----------------------------------------------------------------------------
export function createBenchCables({ motor, vfd, pm, plc, na, tis }) {
  const group = new THREE.Group();
  group.name = 'Cables';

  // -------------------------------------------------------------------------
  // 1. VFD → Moteur (puissance triphasée) — gros câble noir
  //    Sort par le dessous du VFD, longe le sol, remonte sur la boîte à
  //    bornes du moteur. La courbe a 6 points pour rester souple.
  // -------------------------------------------------------------------------
  const powerCable = createCable([
    V(vfd.x,         vfd.y - 0.10,  vfd.z + 0.01),  // sortie bas VFD
    V(vfd.x,         0.06,          vfd.z + 0.10),  // descente
    V(vfd.x + 0.20,  0.03,          vfd.z + 0.30),  // au sol côté VFD
    V(motor.x - 0.10, 0.03,         motor.z - 0.05),// au sol côté moteur
    V(motor.x,        0.18,         motor.z - 0.08),// remontée arrière du moteur
    V(motor.x,        motor.y + 0.18, motor.z - 0.02), // entrée boîte à bornes
  ], 0.009, CABLE_COLORS.POWER, 64);
  powerCable.name = 'cable_power';
  group.add(powerCable);

  // -------------------------------------------------------------------------
  // 2. PLC → VFD (commande) — câble bleu fin
  //    Court sur le panneau entre l'extrémité droite du PLC et le sommet du VFD.
  // -------------------------------------------------------------------------
  const ctrlCable = createCable([
    V(plc.x + 0.10,  plc.y - 0.03,  plc.z + 0.02),       // sortie droite PLC
    V(plc.x + 0.05,  plc.y - 0.18,  plc.z + 0.06),       // descente
    V(vfd.x - 0.10,  vfd.y + 0.18,  vfd.z + 0.04),       // approche VFD
    V(vfd.x,         vfd.y + 0.11,  vfd.z + 0.02),       // entrée haut VFD
  ], 0.004, CABLE_COLORS.CONTROL, 40);
  group.add(ctrlCable);

  // -------------------------------------------------------------------------
  // 3. PM2230 → NA111 (Modbus RTU) — câble jaune fin
  //    Petite boucle entre la face du PM et le côté du NA111.
  // -------------------------------------------------------------------------
  const modbusCable = createCable([
    V(pm.x + 0.04,  pm.y + 0.04,  pm.z + 0.01),
    V(pm.x + 0.10,  pm.y + 0.20,  pm.z + 0.04),
    V(na.x - 0.04,  na.y - 0.05,  na.z + 0.04),
    V(na.x - 0.012, na.y - 0.02,  na.z + 0.01),
  ], 0.0035, CABLE_COLORS.MODBUS, 30);
  group.add(modbusCable);

  // -------------------------------------------------------------------------
  // 4. 3 TI → PM2230 (secondaires des transformateurs de courant)
  //    Un fil par phase (L1 rouge, L2 blanc, L3 bleu) descend du TI vers la
  //    face arrière du PM2230.
  // -------------------------------------------------------------------------
  const phaseColors = [
    CABLE_COLORS.PHASE_L1,
    CABLE_COLORS.PHASE_L2,
    CABLE_COLORS.PHASE_L3,
  ];
  for (let i = 0; i < 3; i++) {
    const ti = tis[i];
    const fanOut = (i - 1) * 0.020;   // arrivée étalée sur le dessus du PM
    const wire = createCable([
      V(ti.x,             ti.y - 0.030, ti.z + 0.005),
      V(ti.x,             ti.y - 0.10,  ti.z + 0.020),
      V(pm.x + fanOut,    pm.y + 0.18,  pm.z + 0.030),
      V(pm.x + fanOut,    pm.y + 0.05,  pm.z + 0.010),
    ], 0.0028, phaseColors[i], 28);
    group.add(wire);
  }

  return group;
}
