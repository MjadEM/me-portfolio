#include "sensors.h"
#include "config.h"
#include <Wire.h>
#include <MPU6050_light.h>

MPU6050 mpu(Wire);
IMUSensor imu; 

bool IMUSensor::begin() {
  Wire.begin(I2C_SDA, I2C_SCL, I2C_FREQ);
  
  byte status = mpu.begin();
  if (status != 0) {
    DEBUG_PRINT("Erreur MPU6050: ");
    DEBUG_PRINTLN(status);
    return false;
  }
  
  DEBUG_PRINTLN("✓ MPU6050 détecté");
  calibrate();
  
  return true;
}

void IMUSensor::calibrate(uint16_t samples) {
  DEBUG_PRINTLN("Calibration IMU (ne pas bouger)...");
  
  mpu.calcOffsets();
  data.isCalibrated = true;
  data.angleFiltered = 0.0f;
  data.angularVel = 0.0f;
  gyroFiltered = 0.0f;
  accelFiltered = 0.0f;

  DEBUG_PRINTLN("✓ Calibration terminée");
}

void IMUSensor::update() {
  static uint32_t lastTime = micros();
  uint32_t currentTime = micros();
  float dt = (currentTime - lastTime) / 1000000.0f; // secondes
  lastTime = currentTime;
  
  mpu.update(); 
  float angleAccelRaw = mpu.getAngleY() * DEG_TO_RAD;
  float gyroRate = mpu.getGyroY() * DEG_TO_RAD; // rad/s
  accelFiltered = ACCEL_LPF * angleAccelRaw + (1.0f - ACCEL_LPF) * accelFiltered;
  data.angleFiltered = ALPHA * (data.angleFiltered + gyroRate * dt)
                     + (1.0f - ALPHA) * accelFiltered;
  gyroFiltered = GYRO_LPF * gyroRate + (1.0f - GYRO_LPF) * gyroFiltered;
  data.angularVel = gyroFiltered;

  data.lastUpdate = currentTime;
}

void IMUSensor::printData() const {
  Serial.print("Angle:");
  Serial.print(data.angleFiltered * RAD_TO_DEG, 2);
  Serial.print("° | Vitesse:");
  Serial.print(data.angularVel * RAD_TO_DEG, 1);
  Serial.println("°/s");
}
