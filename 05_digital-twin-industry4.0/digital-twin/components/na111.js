// ============================================================================
// na111.js — Convertisseur Modbus RTU → TCP (NA111)
// ----------------------------------------------------------------------------
// Petit boîtier blanc à bande bleue, clipsé sur rail DIN, qui convertit le
// flux Modbus RTU du PM2230 en Modbus TCP pour KEPServerEX.
// 3 LEDs en façade : alimentation (bleue), RX (rouge), TX (orange).
// Export : createNa111() → THREE.Group
// ============================================================================

import * as THREE from 'three';

const COLOR_BODY     = 0xf0f0ee;
const COLOR_TOP      = 0x2080d0;
const COLOR_LABEL    = 0xeeeeee;
const COLOR_LED_PWR  = 0x33aaff;
const COLOR_LED_RX   = 0xff3333;
const COLOR_LED_TX   = 0xff9922;

export function createNa111() {
  const na = new THREE.Group();
  na.name = 'NA111';

  const matBody = new THREE.MeshStandardMaterial({
    color: COLOR_BODY, roughness: 0.65, metalness: 0.10,
  });
  const matTop = new THREE.MeshStandardMaterial({
    color: COLOR_TOP, roughness: 0.55, metalness: 0.20,
  });
  const matLabel = new THREE.MeshStandardMaterial({
    color: COLOR_LABEL, roughness: 0.70, metalness: 0.05,
  });
  const matLedPwr = new THREE.MeshStandardMaterial({
    color: COLOR_LED_PWR, emissive: 0x2266dd, emissiveIntensity: 1.1,
    roughness: 0.30, metalness: 0.20,
  });
  const matLedRx = new THREE.MeshStandardMaterial({
    color: COLOR_LED_RX, emissive: 0x991111, emissiveIntensity: 0.7,
    roughness: 0.30, metalness: 0.20,
  });
  const matLedTx = new THREE.MeshStandardMaterial({
    color: COLOR_LED_TX, emissive: 0xaa5500, emissiveIntensity: 0.7,
    roughness: 0.30, metalness: 0.20,
  });

  const W = 0.028, H = 0.090, D = 0.062;

  // Corps blanc
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matBody);
  body.castShadow = true;
  body.receiveShadow = true;
  na.add(body);

  // Bande bleue en haut
  const topBand = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.001, H * 0.18, D + 0.001),
    matTop
  );
  topBand.position.y = H / 2 - H * 0.09;
  na.add(topBand);

  // Étiquette QR-code blanche sur la façade (simplifiée : rectangle blanc)
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.7, H * 0.20, 0.002),
    matLabel
  );
  label.position.set(0, -H * 0.05, D / 2 + 0.002);
  na.add(label);

  // 3 LEDs verticales sur la façade (haut → bas : alim / RX / TX)
  const ledGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.003, 10);
  const leds = [
    { mat: matLedPwr, y:  H * 0.25 },
    { mat: matLedRx,  y:  H * 0.18 },
    { mat: matLedTx,  y:  H * 0.11 },
  ];
  for (const { mat, y } of leds) {
    const led = new THREE.Mesh(ledGeo, mat);
    led.rotation.x = Math.PI / 2;
    led.position.set(0, y, D / 2 + 0.003);
    na.add(led);
  }

  return na;
}
