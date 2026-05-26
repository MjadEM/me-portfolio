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
  float error = targetAngle - angle;
  float P = Kp * error;

  integral += error * dt;
  integral = constrain(integral, -PID_INTEGRAL_MAX, PID_INTEGRAL_MAX);
  float I = Ki * integral;

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
  float kick = 0.0f;
  float absOmega = fabs(angularVel);
  if (absOmega > LQR_KICK_OMEGA_THR) {
    float excess = absOmega - LQR_KICK_OMEGA_THR;
    kick = LQR_KICK_GAIN * excess * (angularVel >= 0.0f ? 1.0f : -1.0f);
  }

  float output = -(lqrK1 * angle + lqrK2 * angularVel + kick);
  output = constrain(output, -MAX_CONTROL_OUTPUT, MAX_CONTROL_OUTPUT);

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
