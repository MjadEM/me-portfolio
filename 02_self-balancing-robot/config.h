// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION Self Balancing Robot
//  Généré depuis simulations MATLAB
//  Date: 20/03/2026
//  Auteur: EL MANSOURI Amjad - CRIAM
// ═══════════════════════════════════════════════════════════════

#ifndef CONFIG_H
#define CONFIG_H

// I2C (IMU MPU6050)
#define I2C_SDA         5
#define I2C_SCL         18
#define I2C_FREQ        400000  // 400 kHz Fast Mode

// Moteur 1 (Gauche)
#define MOTOR1_STEP     13 //Blue
#define MOTOR1_DIR      12  // gris

// Moteur 2 (Droit)
#define MOTOR2_STEP     14
#define MOTOR2_DIR      27

// Configuration Microstepping DRV8825
#define MS1_PIN         26 //blue
#define MS2_PIN         25 //White
#define MS3_PIN         33 //Yellow
// ═══════════════════════════════════════════════════════════════
// PARAMÈTRES MOTEURS
// ═══════════════════════════════════════════════════════════════

#define STEPS_PER_REV   100     // NEMA-17 standard (1.8°)
#define MICROSTEP_MODE  8    // 1/16 microstepping
#define TOTAL_STEPS     (STEPS_PER_REV * MICROSTEP_MODE)

// Vitesse max moteur (steps/sec)
#define MAX_STEP_FREQ   13000   // 13 kHz — DRV8825 supporte jusqu'à 250 kHz STEP

// Conversion steps → rad/s
#define WHEEL_RADIUS    0.03f  // mètres (65mm diamètre)
#define STEPS_TO_RADS   (2.0f * PI / TOTAL_STEPS)

// ═══════════════════════════════════════════════════════════════
// PARAMÈTRES MODÈLE PHYSIQUE (DEPUIS MATLAB)
// ═══════════════════════════════════════════════════════════════

// Masse et géométrie
#define MASS_BODY       1.0f     // kg - masse corps principal
#define MASS_WHEELS     0.6f     // kg - roues + moteurs
#define HEIGHT_CG       0.07f    // m - hauteur centre gravité
#define INERTIA_BODY    0.002f   // kg·m² - inertie corps

// Coefficients modèle linéarisé (calculés Matlab)
// θ̈ = b₃·θ + b₄·u
#define MODEL_B3        776.6f   // rad/s² (à recalculer avec tes valeurs)
#define MODEL_B4        1140.9f  // rad/s² par N·m

// ═══════════════════════════════════════════════════════════════
// CONTRÔLEUR (CHOIX : PID ou LQR)
// ═══════════════════════════════════════════════════════════════

// Sélection contrôleur
#define USE_PID         0        // 1 = PID, 0 = LQR
#define USE_LQR         1

#if ((USE_PID + USE_LQR) != 1)
  #error "Choisir exactement un seul controleur: USE_PID=1 ou USE_LQR=1"
#endif

// ─────────────────────────────────────────────────────────────
// GAINS PID (conservés même si LQR actif)
// ─────────────────────────────────────────────────────────────

#define PID_KP        793.2f   // Gain proportionnel 2420
#define PID_KI        1736.0f  // Gain intégral 6529
#define PID_KD        9.0f     // Gain dérivé 14.18f

// Anti-windup intégrale
#define PID_INTEGRAL_MAX   5.0f   // rad·s (limite saturation)

// Filtrage dérivée (filtre passe-bas)
#define PID_DERIVATIVE_FILTER  0.25f  // Coefficient (0-1)

// ─────────────────────────────────────────────────────────────
// GAINS LQR (conservés même si PID actif)
// ─────────────────────────────────────────────────────────────

// u = -Kx où x = [theta, theta_dot]^T (version simplifiée 2 états)
// Gains remontés pour saturer ~0.2 rad (~11°) de tilt : le robot doit rattraper
// vite pour ne pas chuter. Tuner en direct via la commande série `lqr K1 K2`.
#define LQR_K1        800.0f  // Gain sur angle theta (MATLAB: 34 — trop mou en pratique)
#define LQR_K2        60.0f   // Gain sur vitesse theta_dot (amortissement)

// "Kick" — impulsion ajoutée dès que |theta_dot| dépasse un seuil.
// Sert à amorcer la correction au tout début de la bascule, quand theta est
// encore trop petit pour que K1*theta génère une commande utile.
// Au-dessus du seuil, le gain effectif sur theta_dot devient (LQR_K2 + LQR_KICK_GAIN).
// Seuil bien au-dessus du bruit gyro filtré, pour que le kick ne se déclenche
// QUE sur une vraie bascule (pas sur les vibrations du chassis).
#define LQR_KICK_OMEGA_THR  0.25f   // rad/s (~14°/s)
#define LQR_KICK_GAIN       200.0f  // gain additionnel au-delà du seuil
// ═══════════════════════════════════════════════════════════════
// TIMING & ÉCHANTILLONNAGE
// ═══════════════════════════════════════════════════════════════

#define CONTROL_FREQ    1000     // Hz - Fréquence boucle contrôle
#define CONTROL_DT      0.001f   // s - Période échantillonnage (1ms)

#define TELEMETRY_FREQ  50       // Hz - Envoi données WiFi
#define LED_BLINK_FREQ  2        // Hz - Debug LED

// ═══════════════════════════════════════════════════════════════
// LIMITES SÉCURITÉ
// ═══════════════════════════════════════════════════════════════

#define MAX_TILT_ANGLE      70.0f    // degrés - Arrêt moteurs si dépassé
#define MAX_CONTROL_OUTPUT  500.0f   // PWM max (0-255 pour mapping)
#define DEADZONE_ANGLE      2.0f     // degrés - Zone morte (évite oscillations)

// ═══════════════════════════════════════════════════════════════
// DEBUG & TÉLÉMÉTRIE
// ═══════════════════════════════════════════════════════════════

#define DEBUG_SERIAL    1        // 1 = Active Serial.print debug
#define WIFI_TELEMETRY  0        // 1 = Envoi données WiFi (désactivé proto)

#if DEBUG_SERIAL
  #define DEBUG_BAUDRATE 115200
  #define DEBUG_PRINT(x)   Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif

// ═══════════════════════════════════════════════════════════════
// WIFI (Optionnel - Phase 2)
// ═══════════════════════════════════════════════════════════════

#if WIFI_TELEMETRY
  #define WIFI_SSID      "VotreSSID"
  #define WIFI_PASSWORD  "VotreMotDePasse"
  #define UDP_PORT       8888
#endif

#endif // CONFIG_H