
#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
typedef struct {
  float angle;         
  float angularVel;   
  float angleFiltered;
  bool isCalibrated;   
  uint32_t lastUpdate; 
} SensorData_t;

class IMUSensor {
public:
  
  bool begin();
  
  
  void calibrate(uint16_t samples = 1000);
  void update();
  float getAngle() const { return data.angleFiltered; }
  float getAngularVelocity() const { return data.angularVel; }
  bool isReady() const { return data.isCalibrated; }
  void printData() const;
  
private:
  SensorData_t data;
  float offsetAngle;
  float offsetGyro;
  float gyroFiltered;   // sortie LPF sur theta_dot
  float accelFiltered;  // sortie LPF sur angle dérivé de l'accéléromètre
  const float ALPHA = 0.98f;
  const float GYRO_LPF = 0.15f;
  const float ACCEL_LPF = 0.02f;
};
extern IMUSensor imu;

#endif
