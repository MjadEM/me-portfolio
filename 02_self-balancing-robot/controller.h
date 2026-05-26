// ═══════════════════════════════════════════════════════════════
//  MODULE CONTRÔLEUR - PID / LQR
// ═══════════════════════════════════════════════════════════════

#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <Arduino.h>
#include "config.h"

class BalanceController {
public:
  // Initialisation
  void begin();
  
  // Reset (remet intégrale à 0)
  void reset();
  
  // Calcul commande
  // Retourne: u (commande moteur -255 à +255)
  float compute(float angle, float angularVel, float dt);

  // Ajustement LQR en temps réel (utile pendant les essais)
  void setLQRGains(float k1, float k2);
  
  // Changement consigne (pour tests)
  void setTargetAngle(float target) { targetAngle = target; }
  
  // Debug
  void printGains() const;
  
private:
  float targetAngle;      // Consigne (normalement 0)
  
  // États PID
  float integral;
  float lastError;
  float lastDerivative;

  // Gains PID (conservés et toujours disponibles)
  const float Kp = PID_KP;
  const float Ki = PID_KI;
  const float Kd = PID_KD;

  // Gains LQR (ajustables à l'exécution)
  float lqrK1;
  float lqrK2;

  // Sortie filtrée (lisse les commandes pour éviter le chatter moteur)
  float lastOutput = 0.1f;//0.0f;
};

extern BalanceController controller;

#endif // CONTROLLER_H