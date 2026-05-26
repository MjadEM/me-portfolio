// ============================================================================
// plc.js — Automate programmable Siemens SIMATIC S7-1200
// ----------------------------------------------------------------------------
// Le "cerveau" du banc : CPU module + 2 modules signal accolés à droite.
// Boîtier gris clair caractéristique Siemens, façade avec LEDs d'état,
// port Ethernet jaune, emplacement carte mémoire MMC bleu.
// Export : createPlc() → THREE.Group (orientation : façade vers +Z).
// ============================================================================

import * as THREE from 'three';

const COLOR_CPU     = 0xa8aeb4;
const COLOR_MODULE  = 0x9ba3a8;
const COLOR_TOP_LID = 0x5a6065;
const COLOR_FRONT   = 0x7e8488;
const COLOR_LED_RUN = 0x33ff33;
const COLOR_LED_ERR = 0xff5050;
const COLOR_ETH     = 0xf0c040;
const COLOR_MMC     = 0x4a8fbf;

export function createPlc() {
  const plc = new THREE.Group();
  plc.name = 'PLC';

  const matCpu = new THREE.MeshStandardMaterial({ color: COLOR_CPU,   roughness: 0.55, metalness: 0.20 });
  const matMod = new THREE.MeshStandardMaterial({ color: COLOR_MODULE,roughness: 0.55, metalness: 0.20 });
  const matLid = new THREE.MeshStandardMaterial({ color: COLOR_TOP_LID,roughness: 0.50, metalness: 0.30 });
  const matFront = new THREE.MeshStandardMaterial({ color: COLOR_FRONT, roughness: 0.50, metalness: 0.20 });
  const matLedRun = new THREE.MeshStandardMaterial({
    color: COLOR_LED_RUN, emissive: 0x22aa22, emissiveIntensity: 0.9,
    roughness: 0.30, metalness: 0.20,
  });
  const matLedErr = new THREE.MeshStandardMaterial({
    color: COLOR_LED_ERR, emissive: 0x661111, emissiveIntensity: 0.0,
    roughness: 0.30, metalness: 0.20,
  });
  const matEth = new THREE.MeshStandardMaterial({ color: COLOR_ETH, roughness: 0.45, metalness: 0.50 });
  const matMmc = new THREE.MeshStandardMaterial({ color: COLOR_MMC, roughness: 0.50, metalness: 0.30 });

  // -------------------------------------------------------------------------
  // 1. Module CPU (le bloc principal à gauche)
  // -------------------------------------------------------------------------
  const cpuW = 0.2, cpuH = 0.18, cpuD = 0.08; // 0.10 0.10  0.075 pour le CPU seul, mais on ajoute un peu de marge pour les détails (LEDs, ports)
  const cpu = new THREE.Mesh(new THREE.BoxGeometry(cpuW, cpuH, cpuD), matCpu);
  cpu.castShadow = true;
  cpu.receiveShadow = true;
  plc.add(cpu);

  // Capot supérieur (couleur plus foncée)
  const cpuTop = new THREE.Mesh(
    new THREE.BoxGeometry(cpuW * 0.96, 0.012, cpuD * 0.96),
    matLid
  );
  cpuTop.position.y = cpuH / 2 + 0.006;
  plc.add(cpuTop);

  // Façade avant encastrée
  const cpuFront = new THREE.Mesh(
    new THREE.BoxGeometry(cpuW * 0.85, cpuH * 0.70, 0.003),
    matFront
  );
  cpuFront.position.set(0, -cpuH * 0.05, cpuD / 2 + 0.002);
  plc.add(cpuFront);

  // 4 LEDs d'état sur la façade (2 vertes RUN + STOP + 2 rouges ERROR/MAINT)
  const ledGeo = new THREE.CylinderGeometry(0.0028, 0.0028, 0.003, 12);
  const ledMats = [matLedRun, matLedRun, matLedErr, matLedErr];
  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(ledGeo, ledMats[i]);
    led.rotation.x = Math.PI / 2;
    led.position.set(-cpuW * 0.30 + i * 0.013, cpuH * 0.22, cpuD / 2 + 0.004);
    plc.add(led);
  }

  // Port Ethernet RJ45 (carré jaune en bas à gauche)
  const eth = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, 0.004), matEth);
  eth.position.set(-cpuW * 0.25, -cpuH * 0.28, cpuD / 2 + 0.003);
  plc.add(eth);

  // Trappe carte mémoire MMC (rectangle bleu fin)
  const mmc = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.005, 0.004), matMmc);
  mmc.position.set(cpuW * 0.18, cpuH * 0.32, cpuD / 2 + 0.003);
  plc.add(mmc);

  // -------------------------------------------------------------------------
  // 2. Modules signal accolés à droite (2 modules de 45 mm chacun)
  // -------------------------------------------------------------------------
  const modW = 0.045;
  for (let i = 0; i < 2; i++) {
    const xOff = cpuW / 2 + modW / 2 + i * modW;

    const mod = new THREE.Mesh(new THREE.BoxGeometry(modW, cpuH, cpuD), matMod);
    mod.position.x = xOff;
    mod.castShadow = true;
    plc.add(mod);

    const modFront = new THREE.Mesh(
      new THREE.BoxGeometry(modW * 0.75, cpuH * 0.55, 0.003),
      matFront
    );
    modFront.position.set(xOff, 0, cpuD / 2 + 0.002);
    plc.add(modFront);

    // 1 LED verte par module
    const modLed = new THREE.Mesh(ledGeo, matLedRun);
    modLed.rotation.x = Math.PI / 2;
    modLed.position.set(xOff, cpuH * 0.15, cpuD / 2 + 0.004);
    plc.add(modLed);
  }

  return plc;
}
