#include "motors.h"
#include "config.h"

StepperMotors motors;

void StepperMotors::begin() {
  pinMode(MOTOR1_STEP, OUTPUT);
  pinMode(MOTOR2_STEP, OUTPUT);

  pinMode(MOTOR1_DIR, OUTPUT);
  pinMode(MOTOR2_DIR, OUTPUT);

  pinMode(MS1_PIN, OUTPUT);
  pinMode(MS2_PIN, OUTPUT);
  pinMode(MS3_PIN, OUTPUT);

  // 1/8 microstepping (MICROSTEP_MODE=8) : M0=HIGH, M1=HIGH, M2=LOW
  digitalWrite(MS1_PIN, HIGH);
  digitalWrite(MS2_PIN, HIGH);
  digitalWrite(MS3_PIN, LOW);

  digitalWrite(MOTOR1_STEP, LOW);
  digitalWrite(MOTOR2_STEP, LOW);

  currentSpeed = 0.0f;
  stepIntervalUs = 0;
  lastStepTime = micros();
  enabled = true;
  silenced = true;
  lastDir = 0;

  DEBUG_PRINTLN("✓ Moteurs initialisés (1/8 microstepping)");
}

void StepperMotors::setSpeed(float speed) {
  if (!enabled) {
    stepIntervalUs = 0;
    silenced = true;
    return;
  }

  speed = constrain(speed, -(float)MAX_CONTROL_OUTPUT, (float)MAX_CONTROL_OUTPUT);
  currentSpeed = speed;

  float absSpeed = fabs(speed);

  // Trigger de Schmitt : seuil d'entrée (deadbandExit) plus haut que le seuil
  // de sortie (deadbandEnter). Évite le clignotement on/off quand |u| flotte
  // près de la zone morte — c'est ce clignotement à basse fréquence (~100-300 Hz)
  // qui tombe dans la résonance mécanique du stepper et produit le buzz.
  const float deadbandEnter = 8.0f;   // re-silence si |u| descend sous ce seuil
  const float deadbandExit  = 25.0f;  // sort du silence seulement au-dessus
  // Fréquence minimale lorsque l'on sort du silence : on évite la zone de
  // résonance basse en démarrant directement à au moins ~600 Hz.
  const float minActiveFreq = 600.0f;

  if (silenced) {
    if (absSpeed < deadbandExit) {
      stepIntervalUs = 0;
      return;
    }
    silenced = false;
  } else {
    if (absSpeed < deadbandEnter) {
      silenced = true;
      stepIntervalUs = 0;
      lastDir = 0;
      return;
    }
  }

  // Hystérésis sur la direction : on ne change DIR qu'au moment où le moteur
  // est silencieux (silenced repassé à true) ou quand le sens demandé est
  // clairement établi. Tant que l'on est en train de pulser, on ne flippe pas
  // DIR sur un simple passage par zéro — ça réduit la vibration de transition.
  int8_t wantDir = (speed >= 0.0f) ? +1 : -1;
  if (lastDir == 0 || lastDir == wantDir) {
    bool forward = (wantDir > 0);
    digitalWrite(MOTOR1_DIR, forward ? HIGH : LOW);
    digitalWrite(MOTOR2_DIR, forward ? HIGH : LOW);
    lastDir = wantDir;
  } else {
    // Demande de changement de sens : on coupe les pulses pendant ce cycle,
    // la prochaine entrée passera par silenced=true (deadband) avant
    // de se réarmer dans le nouveau sens.
    stepIntervalUs = 0;
    silenced = true;
    lastDir = 0;
    return;
  }

  // Mise à l'échelle linéaire : |u| ∈ [deadbandEnter, MAX_CONTROL_OUTPUT]
  // → f ∈ [minActiveFreq, MAX_STEP_FREQ]. On démarre directement au-dessus
  // de la zone de résonance.
  float freq = (absSpeed / (float)MAX_CONTROL_OUTPUT) * (float)MAX_STEP_FREQ;
  if (freq < minActiveFreq) {
    freq = minActiveFreq;
  }
  stepIntervalUs = (uint32_t)(1000000.0f / freq);
}

void StepperMotors::step() {
  if (!enabled || stepIntervalUs == 0) {
    return;
  }

  uint32_t now = micros();
  if ((uint32_t)(now - lastStepTime) < stepIntervalUs) {
    return;
  }
  lastStepTime = now;

  // Impulsion courte (>= 1.9 µs requis par DRV8825).
  digitalWrite(MOTOR1_STEP, HIGH);
  digitalWrite(MOTOR2_STEP, HIGH);
  delayMicroseconds(3);
  digitalWrite(MOTOR1_STEP, LOW);
  digitalWrite(MOTOR2_STEP, LOW);
}

void StepperMotors::emergencyStop() {
  currentSpeed = 0.0f;
  stepIntervalUs = 0;
  digitalWrite(MOTOR1_STEP, LOW);
  digitalWrite(MOTOR2_STEP, LOW);
  DEBUG_PRINTLN("⚠️ ARRÊT URGENCE MOTEURS");
}

void StepperMotors::enable() {
  enabled = true;
}

void StepperMotors::disable() {
  enabled = false;
  emergencyStop();
}
