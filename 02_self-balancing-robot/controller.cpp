#include "controller.h"
#include "config.h"

BalanceController controller;

void BalanceController::begin() {
  targetAngle = 0.0f; // Vertical
  lqrK1 = LQR_K1;
  lqrK2 = LQR_K2;
  reset();
  
  DEBUG_PRINTLN("✓ Contrôleur initialisé (PID + LQR)");
  printGains();
}

void BalanceController::reset() {
  integral = 0.0f;
  lastError = 0.0f;
  lastDerivative = 0.0f;
  lastOutput = 0.0f;
}

void BalanceController::setLQRGains(float k1, float k2) {
  lqrK1 = k1;
  lqrK2 = k2;

  DEBUG_PRINT("Nouveaux gains LQR -> K1: ");
  DEBUG_PRINT(lqrK1);
  DEBUG_PRINT(" | K2: ");
  DEBUG_PRINTLN(lqrK2);
}

float BalanceController::compute(float angle, float angularVel, float dt) {
#if USE_PID
  // PID: u = Kp*e + Ki*∫e dt + Kd*de/dt
  float error = targetAngle - angle;
  float P = Kp * error;

  // Anti-windup sur l'intégrale pour éviter l'accumulation excessive.
  integral += error * dt;
  integral = constrain(integral, -PID_INTEGRAL_MAX, PID_INTEGRAL_MAX);
  float I = Ki * integral;

  // Le terme dérivé est filtré pour réduire le bruit IMU.
  float derivative = -angularVel;
  derivative = PID_DERIVATIVE_FILTER * derivative
             + (1.0f - PID_DERIVATIVE_FILTER) * lastDerivative;
  lastDerivative = derivative;

  float D = Kd * derivative;
  float output = P + I + D;
  output = constrain(output, -MAX_CONTROL_OUTPUT, MAX_CONTROL_OUTPUT);

  lastError = error;
  return output;
#elif USE_LQR
  // LQR: u = -Kx avec x = [theta, theta_dot].
  // Terme additionnel "kick" : dès que |theta_dot| dépasse un seuil, on amplifie
  // la réaction sur la vitesse angulaire. Effet : impulsion rapide au démarrage
  // de la bascule, sans amplifier le bruit IMU autour de zéro.
  float kick = 0.0f;
  float absOmega = fabs(angularVel);
  if (absOmega > LQR_KICK_OMEGA_THR) {
    float excess = absOmega - LQR_KICK_OMEGA_THR;
    kick = LQR_KICK_GAIN * excess * (angularVel >= 0.0f ? 1.0f : -1.0f);
  }

  float output = -(lqrK1 * angle + lqrK2 * angularVel + kick);
  output = constrain(output, -MAX_CONTROL_OUTPUT, MAX_CONTROL_OUTPUT);

  // LPF sur la sortie : empêche les zigzags rapides de u qui font claquer le
  // moteur. β=0.35 à 1 kHz → constante de temps ~2 ms ; assez réactif pour le
  // contrôle, suffisant pour absorber les pointes haute fréquence.
  const float OUTPUT_LPF = 0.4f;//0.35f
  lastOutput = OUTPUT_LPF * output + (1.0f - OUTPUT_LPF) * lastOutput;
  return lastOutput;
#else
  return 0.0f;
#endif
}

void BalanceController::printGains() const {
  Serial.println("=== GAINS CONTROLEUR ===");
  Serial.print("PID Kp: "); Serial.println(Kp);
  Serial.print("PID Ki: "); Serial.println(Ki);
  Serial.print("PID Kd: "); Serial.println(Kd);
  Serial.print("LQR K1: "); Serial.println(lqrK1);
  Serial.print("LQR K2: "); Serial.println(lqrK2);
}