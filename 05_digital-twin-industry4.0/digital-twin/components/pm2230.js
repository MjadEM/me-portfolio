// ============================================================================
// pm2230.js — Centrale de mesure Schneider Electric (gamme EasyLogic PM22xx)
// ----------------------------------------------------------------------------
// Réf. réelle : PM2230 (sur le banc) — boîtier carré gris foncé, écran LCD
// monochrome au centre, 4 boutons ronds en bas, LED verte d'état, logo
// "Schneider Electric / EasyLogic" en haut.
// Export : createPm2230() → THREE.Group prêt à insérer dans la scène.
// ============================================================================

import * as THREE from 'three';

// ----- Palette -----
const COLOR_BODY      = 0x3a3a3c;   // boîtier gris foncé
const COLOR_BEZEL     = 0x252527;   // contour LCD plus sombre
const COLOR_LCD       = 0xb8c4b8;   // fond LCD vert-gris pâle
const COLOR_LCD_TEXT  = 0x1a1a1a;   // pixels foncés
const COLOR_BTN       = 0x6a6a6a;   // boutons gris doux
const COLOR_LED_ON    = 0x33ff33;   // LED verte état OK
const COLOR_LOGO      = 0xeeeeee;   // marque Schneider

// ----- Dimensions de référence (mètres) -----
// Boîtier ~96×96 mm en façade, profondeur ~55 mm (encastré sur panneau)
const W = 0.099;
const H = 0.099;
const D = 0.055;

export function createPm2230() {
  const pm = new THREE.Group();
  pm.name = 'PM2230';

  // -------------------------------------------------------------------------
  // Matériaux
  // -------------------------------------------------------------------------
  const matBody = new THREE.MeshStandardMaterial({
    color: COLOR_BODY, roughness: 0.60, metalness: 0.25,
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: COLOR_BEZEL, roughness: 0.55, metalness: 0.20,
  });
  const matLcd = new THREE.MeshStandardMaterial({
    color: COLOR_LCD, roughness: 0.35, metalness: 0.05,
    emissive: 0x556655, emissiveIntensity: 0.20,
  });
  const matLcdText = new THREE.MeshStandardMaterial({
    color: COLOR_LCD_TEXT, roughness: 0.5, metalness: 0.05,
  });
  const matBtn = new THREE.MeshStandardMaterial({
    color: COLOR_BTN, roughness: 0.55, metalness: 0.30,
  });
  const matLed = new THREE.MeshStandardMaterial({
    color: COLOR_LED_ON, roughness: 0.30, metalness: 0.20,
    emissive: 0x22cc22, emissiveIntensity: 1.0,
  });
  const matLogo = new THREE.MeshStandardMaterial({
    color: COLOR_LOGO, roughness: 0.70, metalness: 0.05,
  });

  // -------------------------------------------------------------------------
  // 1. Corps principal (carré)
  // -------------------------------------------------------------------------
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matBody);
  body.castShadow = true;
  body.receiveShadow = true;
  pm.add(body);

  // -------------------------------------------------------------------------
  // 2. Cadre intérieur (bezel autour de l'écran LCD)
  // -------------------------------------------------------------------------
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.84, H * 0.58, 0.003),
    matBezel
  );
  bezel.position.set(0, H * 0.08, D / 2 + 0.001);
  pm.add(bezel);

  // -------------------------------------------------------------------------
  // 3. Écran LCD
  // -------------------------------------------------------------------------
  const lcd = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.76, H * 0.50, 0.003),
    matLcd
  );
  lcd.position.set(0, H * 0.08, D / 2 + 0.003);
  pm.add(lcd);

  // -------------------------------------------------------------------------
  // 4. Quelques "lignes" de texte sur l'écran (rectangles foncés)
  //    On simule un écran type "Récapitulatif" (Umoy, Imoy, Ptot)
  // -------------------------------------------------------------------------
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.60, 0.004, 0.002),
      matLcdText
    );
    line.position.set(-W * 0.03, H * 0.18 - i * 0.010, D / 2 + 0.005);
    pm.add(line);
  }

  // -------------------------------------------------------------------------
  // 5. Bande marque Schneider en haut (rectangle blanc fin)
  // -------------------------------------------------------------------------
  const schneiderBar = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.45, 0.006, 0.002),
    matLogo
  );
  schneiderBar.position.set(-W * 0.18, H * 0.42, D / 2 + 0.002);
  pm.add(schneiderBar);

  // Petite étiquette "PM2230" à droite
  const modelBar = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.22, 0.004, 0.002),
    matLogo
  );
  modelBar.position.set(W * 0.30, H * 0.42, D / 2 + 0.002);
  pm.add(modelBar);

  // -------------------------------------------------------------------------
  // 6. 4 boutons ronds gris en bas de la façade
  // -------------------------------------------------------------------------
  const btnGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 14);
  for (let i = 0; i < 4; i++) {
    const btn = new THREE.Mesh(btnGeo, matBtn);
    btn.rotation.x = Math.PI / 2;
    btn.position.set((i - 1.5) * 0.016, -H * 0.32, D / 2 + 0.003);
    pm.add(btn);
  }

  // -------------------------------------------------------------------------
  // 7. LED verte d'état (en bas à droite)
  // -------------------------------------------------------------------------
  const led = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0030, 0.0030, 0.003, 12),
    matLed
  );
  led.rotation.x = Math.PI / 2;
  led.position.set(W * 0.40, -H * 0.38, D / 2 + 0.003);
  pm.add(led);

  // -------------------------------------------------------------------------
  // Positionnement final : la face inférieure touche Y=0 (posée au sol)
  // -------------------------------------------------------------------------
  pm.position.y = H / 2;

  return pm;
}
