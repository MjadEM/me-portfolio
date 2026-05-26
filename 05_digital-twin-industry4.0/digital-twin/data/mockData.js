// ============================================================================
// mockData.js — Générateur de données simulées
// ----------------------------------------------------------------------------
// Produit le même schéma JSON que renverra l'endpoint Node-RED en production
// (cf. spec du projet), avec des valeurs qui varient dans le temps de manière
// physiquement plausible :
//   - fréquence oscille entre 25 et 50 Hz (période 60 s)
//   - charge oscille entre 20 et 80 % (période 30 s)
//   - vitesse rotor calculée à partir de la fréquence et du glissement
//   - température suit un filtre passe-bas (constante de temps 30 s)
//   - vibration légère avec pics aléatoires occasionnels
//   - anomalie détectée si T > 78 °C ou vibration > 3 mm/s
// ============================================================================

const NOMINAL_VOLTAGE = 400;     // V ligne-ligne
const NOMINAL_FREQ    = 50;      // Hz
const SYNC_SPEED_RPM  = 1500;    // moteur 4 pôles à 50 Hz
const NOMINAL_SLIP    = 0.06;    // 6 % à pleine charge
const NOMINAL_TORQUE  = 1.77;    // Nm (~ 0.25 kW à 1350 tr/min)
const NOMINAL_CURRENT = 1.50;    // A

// État interne du modèle (persistant entre les appels)
const startTime = performance.now();
let lastTemp = 25;               // °C — démarre à ambiant
let lastTempT = startTime;

export function getMockData() {
  const now = performance.now();
  const t = (now - startTime) / 1000;   // s depuis démarrage

  // -------------------------------------------------------------------------
  // 1. Fréquence et charge oscillantes
  // -------------------------------------------------------------------------
  const freq = 37.5 + 12.5 * Math.sin((2 * Math.PI * t) / 60);
  const loadPct = 50 + 30 * Math.sin((2 * Math.PI * t) / 30);

  // -------------------------------------------------------------------------
  // 2. Cinématique : vitesse rotor = vitesse_sync × (f/50) × (1 − glissement)
  // -------------------------------------------------------------------------
  const slip = NOMINAL_SLIP * (loadPct / 100);
  const rotorSpeed = SYNC_SPEED_RPM * (freq / NOMINAL_FREQ) * (1 - slip);

  // -------------------------------------------------------------------------
  // 3. Grandeurs électriques
  // -------------------------------------------------------------------------
  const current = 0.6 + (loadPct / 100) * (NOMINAL_CURRENT - 0.6);
  const pf = 0.60 + (loadPct / 100) * 0.25;   // PF s'améliore en charge
  const activePower = (Math.sqrt(3) * NOMINAL_VOLTAGE * current * pf) / 1000; // kW

  // -------------------------------------------------------------------------
  // 4. Grandeurs mécaniques
  // -------------------------------------------------------------------------
  const torque = (loadPct / 100) * NOMINAL_TORQUE;
  const omega = (rotorSpeed * 2 * Math.PI) / 60;   // rad/s
  const mechPower = (torque * omega) / 1000;       // kW
  const efficiency = activePower > 0.001 ? (mechPower / activePower) * 100 : 0;

  // -------------------------------------------------------------------------
  // 5. Température estimée (filtre passe-bas vers une cible liée à la charge)
  // -------------------------------------------------------------------------
  const tempTarget = 30 + (loadPct / 100) * 50;    // 30 °C à vide → 80 °C plein
  const dt = (now - lastTempT) / 1000;
  const tau = 30;                                   // constante thermique (s)
  lastTemp += (tempTarget - lastTemp) * (1 - Math.exp(-dt / tau));
  lastTempT = now;

  // -------------------------------------------------------------------------
  // 6. État thermique du VFD (% de la limite)
  // -------------------------------------------------------------------------
  const thermalState = Math.min(100, (current / NOMINAL_CURRENT) * 65);

  // -------------------------------------------------------------------------
  // 7. Vibration : fond ~1 mm/s + ondulation + pics aléatoires
  // -------------------------------------------------------------------------
  const vibBase = 1.0 + 0.5 * Math.abs(Math.sin((2 * Math.PI * t) / 5));
  const vibSpike = Math.random() < 0.02 ? Math.random() * 2.5 : 0;
  const vibration = vibBase + vibSpike;

  // -------------------------------------------------------------------------
  // 8. Scores de santé et anomalies
  // -------------------------------------------------------------------------
  const motorHealth = vibration > 3 ? 70 : lastTemp > 75 ? 80 : 92;
  const vfdHealth   = thermalState > 80 ? 75 : 95;
  const anomaly = vibration > 3 || lastTemp > 78;

  // État global : ce mock simule toujours un moteur en marche
  const state = freq > 5 ? 'RUNNING' : 'STOPPED';

  // -------------------------------------------------------------------------
  // 9. Construction du JSON conforme à la spec
  // -------------------------------------------------------------------------
  return {
    timestamp: new Date().toISOString(),
    vfd: {
      state,
      output_frequency_Hz: round(freq, 1),
      output_current_A:    round(current, 2),
      thermal_state_pct:   round(thermalState, 0),
      health_score:        vfdHealth,
    },
    motor: {
      state,
      rotor_speed_rpm:        round(rotorSpeed, 0),
      synchronous_speed_rpm:  SYNC_SPEED_RPM,
      load_pct:               round(loadPct, 0),
      torque_Nm:              round(torque, 2),
      mechanical_power_kW:    round(mechPower, 3),
      estimated_temperature_C:round(lastTemp, 1),
      efficiency_pct:         round(efficiency, 0),
      vibration_mm_s:         round(vibration, 2),
      health_score:           motorHealth,
      anomaly_detected:       anomaly,
    },
    electrical: {
      voltage_LL_V:    NOMINAL_VOLTAGE,
      current_avg_A:   round(current, 2),
      power_active_kW: round(activePower, 3),
      power_factor:    round(pf, 2),
      frequency_Hz:    round(freq, 1),
    },
  };
}

// Arrondi à N décimales (évite les chaînes 7.000000000003)
function round(v, decimals) {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}
