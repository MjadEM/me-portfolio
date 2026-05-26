// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION Self Balancing Robot
//  Généré depuis simulations MATLAB
//  Date: 20/03/2026
//  Auteur: EL MANSOURI Amjad - CRIAM
// ═══════════════════════════════════════════════════════════════

#ifndef CONFIG_H
#define CONFIG_H
#define I2C_SDA         5
#define I2C_SCL         18
#define I2C_FREQ        400000  // 400 kHz Fast Mode
#define MOTOR1_STEP     13 //Blue
#define MOTOR1_DIR      12  // gris
#define MOTOR2_STEP     14
#define MOTOR2_DIR      27
#define MS1_PIN         26 //blue
#define MS2_PIN         25 //White
#define MS3_PIN         33 //Yellow

#define STEPS_PER_REV   100     // NEMA-17 standard (1.8°)
#define MICROSTEP_MODE  8    // 1/16 microstepping
#define TOTAL_STEPS     (STEPS_PER_REV * MICROSTEP_MODE)
#define MAX_STEP_FREQ   13000   // 13 kHz — DRV8825 supporte jusqu'à 250 kHz STEP
#define WHEEL_RADIUS    0.03f  // mètres (65mm diamètre)
#define STEPS_TO_RADS   (2.0f * PI / TOTAL_STEPS)


// Masse et géométrie
#define MASS_BODY       1.0f     // kg 
#define MASS_WHEELS     0.6f     // kg 
#define HEIGHT_CG       0.07f    // m 
#define INERTIA_BODY    0.002f   // kg·m² 

#define MODEL_B3        776.6f   // rad/s² 
#define MODEL_B4        1140.9f  // rad/s² 

// Sélection contrôleur
#define USE_PID         0        // 1 = PID, 0 = LQR
#define USE_LQR         1

#if ((USE_PID + USE_LQR) != 1)
  #error "Choisir exactement un seul controleur: USE_PID=1 ou USE_LQR=1"
#endif

#define PID_KP        793.2f   // Gain proportionnel 2420
#define PID_KI        1736.0f  // Gain intégral 6529
#define PID_KD        9.0f     // Gain dérivé 14.18f

#define PID_INTEGRAL_MAX   5.0f   // rad·s (limite saturation)

#define PID_DERIVATIVE_FILTER  0.25f  // Coefficient (0-1)

#define LQR_K1        800.0f  // Gain sur angle theta (MATLAB: 34 — trop mou en pratique)
#define LQR_K2        60.0f   // Gain sur vitesse theta_dot (amortissement)

#define LQR_KICK_OMEGA_THR  0.25f   // rad/s (~14°/s)
#define LQR_KICK_GAIN       200.0f  // gain additionnel au-delà du seuil

#define CONTROL_FREQ    1000     // Hz - Fréquence boucle contrôle
#define CONTROL_DT      0.001f   // s - Période échantillonnage (1ms)

#define TELEMETRY_FREQ  50       // Hz - Envoi données WiFi
#define LED_BLINK_FREQ  2        // Hz - Debug LED


#define MAX_TILT_ANGLE      70.0f    // degrés - Arrêt moteurs si dépassé
#define MAX_CONTROL_OUTPUT  500.0f   // PWM max (0-255 pour mapping)
#define DEADZONE_ANGLE      2.0f     // degrés - Zone morte (évite oscillations)


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
