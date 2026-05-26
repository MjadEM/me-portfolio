#ifndef MOTORS_H
#define MOTORS_H

#include <Arduino.h>

class StepperMotors {
public:
  void begin();
  void setSpeed(float speed);
  void step();
  void emergencyStop();
  void enable();
  void disable();

private:
  float currentSpeed;       
  uint32_t stepIntervalUs;  
  uint32_t lastStepTime;    
  bool enabled;
  bool silenced;           
  int8_t lastDir;          
};

extern StepperMotors motors;

#endif 
