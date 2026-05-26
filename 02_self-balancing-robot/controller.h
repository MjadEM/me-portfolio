#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <Arduino.h>
#include "config.h"

class BalanceController {
public:
  void begin();
  void reset();
  float compute(float angle, float angularVel, float dt);
  void setLQRGains(float k1, float k2);
  void setTargetAngle(float target) { targetAngle = target; }  
  void printGains() const;
  
private:
  float targetAngle;      
  
  float integral;
  float lastError;
  float lastDerivative;

  // Gains PID 
  const float Kp = PID_KP;
  const float Ki = PID_KI;
  const float Kd = PID_KD;
  // Gains LQR 
  float lqrK1;
  float lqrK2;

  float lastOutput = 0.1f;//0.0f;
};

extern BalanceController controller;

#endif 
