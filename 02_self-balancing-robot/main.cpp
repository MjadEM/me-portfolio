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

hw_timer_t *controlTimer = NULL;
volatile bool controlTick = false;
enum SystemState {
  STATE_INIT,
  STATE_CALIBRATION,
  STATE_READY,
  STATE_RUNNING,
  STATE_EMERGENCY_STOP
};

SystemState currentState = STATE_INIT;
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

void IRAM_ATTR onControlTimer() {
  controlTick = true;

void setup() {
  #if DEBUG_SERIAL
    Serial.begin(DEBUG_BAUDRATE);
    delay(1000);
    Serial.println("\n\n╔═══════════════════════════════════════╗");
    Serial.println("║  ROBOT AUTO-ÉQUILIBRANT v1.0         ║");
    Serial.println("╚═══════════════════════════════════════╝\n");
  #endif
  
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
  
  DEBUG_PRINTLN("Placer robot vertical. Démarrage dans 3s...");
  delay(3000);
  
  currentState = STATE_RUNNING;
  DEBUG_PRINTLN("DÉMARRAGE CONTRÔLE\n");
}


void loop() {
  processSerialCommands();
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
    imu.update();
    float angle = imu.getAngle();
    float angularVel = imu.getAngularVelocity();
    lastAngle = angle;
    lastAngularVel = angularVel;
    if (fabs(angle * RAD_TO_DEG) > MAX_TILT_ANGLE) {
      if (currentState != STATE_EMERGENCY_STOP) {
        currentState = STATE_EMERGENCY_STOP;
        motors.emergencyStop();
        DEBUG_PRINTLN("⚠️ ARRÊT SÉCURITÉ - Angle trop grand");
      }
      return;
    }
    if (currentState == STATE_RUNNING) {
      float controlOutput = controller.compute(angle, angularVel, CONTROL_DT);
      lastControlOutput = controlOutput;
      motors.setSpeed(controlOutput);
    }
  }
  motors.step();
#if DEBUG_SERIAL
  if (millis() - lastTelemetryTime > (1000 / TELEMETRY_FREQ)) {
    lastTelemetryTime = millis();
    Serial.print(lastAngle * RAD_TO_DEG, 3);
    Serial.print(",");
    Serial.print(lastAngularVel * RAD_TO_DEG, 2);
    Serial.print(",");
    Serial.print(lastControlOutput, 2);
    Serial.print(",");
    Serial.println(lastLoopDt);
  }
#endif
  
  if (currentState == STATE_EMERGENCY_STOP) {
    static uint32_t lastBlink = 0;
    if (millis() - lastBlink > 250) {
      lastBlink = millis();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FIN DU PROGRAMME
// ═══════════════════════════════════════════════════════════════
