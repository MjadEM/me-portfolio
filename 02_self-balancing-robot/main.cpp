// ═══════════════════════════════════════════════════════════════
//  ROBOT AUTO-ÉQUILIBRANT - Programme Principal
//  
//  Équipe: CRIAM 
//  Auteur: ELM Amjad
//  Date: 20/03/26
// ═══════════════════════════════════════════════════════════════

#include <Arduino.h>
#include <stdio.h>
#include "config.h"
#include "sensors.h"
#include "motors.h"
#include "controller.h"

// ═══════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ═══════════════════════════════════════════════════════════════

// Timing
hw_timer_t *controlTimer = NULL;
volatile bool controlTick = false;

// États système
enum SystemState {
  STATE_INIT,
  STATE_CALIBRATION,
  STATE_READY,
  STATE_RUNNING,
  STATE_EMERGENCY_STOP
};

SystemState currentState = STATE_INIT;

// Télémétrie
uint32_t lastTelemetryTime = 0;

void processSerialCommands() {
#if DEBUG_SERIAL
  if (!Serial.available()) {
    return;
  }

  String line = Serial.readStringUntil('\n');
  line.trim();

  if (line.length() == 0) {
    return;
  }

  if (line.equalsIgnoreCase("help")) {
    Serial.println("Commandes:");
    Serial.println("  gains              -> affiche les gains PID/LQR");
    Serial.println("  lqr <K1> <K2>      -> ajuste les gains LQR en direct");
    return;
  }

  if (line.equalsIgnoreCase("gains")) {
    controller.printGains();
    return;
  }

  if (line.startsWith("lqr ") || line.startsWith("LQR ")) {
    float k1 = 0.0f;
    float k2 = 0.0f;
    int parsed = sscanf(line.c_str(), "%*s %f %f", &k1, &k2);

    if (parsed == 2) {
      controller.setLQRGains(k1, k2);
    } else {
      Serial.println("Format invalide. Exemple: lqr 28.45 2.36");
    }
    return;
  }

  Serial.println("Commande inconnue. Taper 'help'.");
#endif
}

// ═══════════════════════════════════════════════════════════════
// INTERRUPTION TIMER (1 kHz)
// ═══════════════════════════════════════════════════════════════

void IRAM_ATTR onControlTimer() {
  controlTick = true;
}

// ═══════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════

void setup() {
  #if DEBUG_SERIAL
    Serial.begin(DEBUG_BAUDRATE);
    delay(1000);
    Serial.println("\n\n╔═══════════════════════════════════════╗");
    Serial.println("║  ROBOT AUTO-ÉQUILIBRANT v1.0         ║");
    Serial.println("╚═══════════════════════════════════════╝\n");
  #endif
  
  // ───────────────────────────────────────────────────────────
  // INITIALISATION MODULES
  // ───────────────────────────────────────────────────────────
  
  DEBUG_PRINTLN("[1/4] Initialisation moteurs...");
  motors.begin();
  delay(100);
  
  DEBUG_PRINTLN("[2/4] Initialisation IMU...");
  if (!imu.begin()) {
    DEBUG_PRINTLN("❌ ERREUR IMU - Arrêt système");
    currentState = STATE_EMERGENCY_STOP;
    while(1) { delay(1000); } // Blocage
  }
  delay(100);
  
  DEBUG_PRINTLN("[3/4] Initialisation contrôleur...");
  controller.begin();
  delay(100);
  
  DEBUG_PRINTLN("[4/4] Configuration timer contrôle...");
  
  // Timer hardware ESP32 (1 kHz)
  controlTimer = timerBegin(0, 80, true); // Prescaler 80 → 1 MHz
  timerAttachInterrupt(controlTimer, &onControlTimer, true);
  timerAlarmWrite(controlTimer, 1000, true); // 1000 µs = 1 ms
  timerAlarmEnable(controlTimer);
  
  DEBUG_PRINTLN("\n✓ Initialisation complète !\n");
  
  // ───────────────────────────────────────────────────────────
  // ATTENTE STABILISATION
  // ───────────────────────────────────────────────────────────
  
  DEBUG_PRINTLN("Placer robot vertical. Démarrage dans 3s...");
  delay(3000);
  
  currentState = STATE_RUNNING;
  DEBUG_PRINTLN("DÉMARRAGE CONTRÔLE\n");
}

// ═══════════════════════════════════════════════════════════════
// BOUCLE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

void loop() {
  processSerialCommands();
  
  // ───────────────────────────────────────────────────────────
  // BOUCLE CONTRÔLE À 1 kHz (Prioritaire)
  // ───────────────────────────────────────────────────────────
  
  static float lastAngle = 0.0f;
  static float lastAngularVel = 0.0f;
  static float lastControlOutput = 0.0f;
  static uint32_t lastLoopDt = 0;

  if (controlTick) {
    controlTick = false;

    static uint32_t lastTickTime = micros();
    uint32_t now = micros();
    lastLoopDt = now - lastTickTime;
    lastTickTime = now;

    // 1. LECTURE CAPTEURS
    imu.update();
    float angle = imu.getAngle();
    float angularVel = imu.getAngularVelocity();
    lastAngle = angle;
    lastAngularVel = angularVel;

    // 2. SÉCURITÉ - Arrêt si inclinaison > limite
    if (fabs(angle * RAD_TO_DEG) > MAX_TILT_ANGLE) {
      if (currentState != STATE_EMERGENCY_STOP) {
        currentState = STATE_EMERGENCY_STOP;
        motors.emergencyStop();
        DEBUG_PRINTLN("⚠️ ARRÊT SÉCURITÉ - Angle trop grand");
      }
      return;
    }

    // 3. CALCUL CONTRÔLE
    if (currentState == STATE_RUNNING) {
      float controlOutput = controller.compute(angle, angularVel, CONTROL_DT);
      lastControlOutput = controlOutput;

      // 4. COMMANDE MOTEURS (mise à jour de la consigne uniquement)
      motors.setSpeed(controlOutput);
    }
  }

  // Génération des impulsions moteur hors ISR — non bloquant.
  motors.step();

  // ───────────────────────────────────────────────────────────
  // TÉLÉMÉTRIE (TELEMETRY_FREQ Hz - rate-limited pour ne pas saturer l'UART)
  // ───────────────────────────────────────────────────────────

#if DEBUG_SERIAL
  if (millis() - lastTelemetryTime > (1000 / TELEMETRY_FREQ)) {
    lastTelemetryTime = millis();

    // Format CSV: angle_deg, vel_deg_s, u, loop_dt_us
    Serial.print(lastAngle * RAD_TO_DEG, 3);
    Serial.print(",");
    Serial.print(lastAngularVel * RAD_TO_DEG, 2);
    Serial.print(",");
    Serial.print(lastControlOutput, 2);
    Serial.print(",");
    Serial.println(lastLoopDt);
  }
#endif
  // ───────────────────────────────────────────────────────────
  // GESTION ÉTATS (Si besoin)
  // ───────────────────────────────────────────────────────────
  
  if (currentState == STATE_EMERGENCY_STOP) {
    // LED blink erreur (si pin LED définie)
    static uint32_t lastBlink = 0;
    if (millis() - lastBlink > 250) {
      lastBlink = millis();
      // digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FIN DU PROGRAMME
// ═══════════════════════════════════════════════════════════════