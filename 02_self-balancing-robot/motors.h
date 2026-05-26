// ═══════════════════════════════════════════════════════════════
//  MODULE ACTIONNEURS - Gestion Moteurs Pas-à-Pas
// ═══════════════════════════════════════════════════════════════

#ifndef MOTORS_H
#define MOTORS_H

#include <Arduino.h>

class StepperMotors {
public:
  // Initialisation
  void begin();
  
  // Met à jour la consigne de vitesse (non bloquant).
  // speed: -MAX_CONTROL_OUTPUT à +MAX_CONTROL_OUTPUT (signe = direction).
  void setSpeed(float speed);

  // Génère les impulsions STEP selon la consigne courante.
  // À appeler à haute fréquence depuis loop() — ne bloque jamais.
  void step();

  // Arrêt d'urgence
  void emergencyStop();

  // Enable/Disable
  void enable();
  void disable();

private:
  float currentSpeed;       // consigne (-MAX..+MAX)
  uint32_t stepIntervalUs;  // intervalle entre pulses (0 = pas de pas)
  uint32_t lastStepTime;    // micros() du dernier front montant
  bool enabled;
  bool silenced;            // état du trigger de Schmitt sur la deadband
  int8_t lastDir;           // -1, 0, +1 — sens en cours, pour hystérésis DIR
};

extern StepperMotors motors;

#endif // MOTORS_H