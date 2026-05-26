#include "sensors.h"
#include "config.h"
#include <Wire.h>
#include <MPU6050_light.h>

MPU6050 mpu(Wire);
IMUSensor imu; // Instance globale

bool IMUSensor::begin() {
  Wire.begin(I2C_SDA, I2C_SCL, I2C_FREQ);
  
  byte status = mpu.begin();
  if (status != 0) {
    DEBUG_PRINT("Erreur MPU6050: ");
    DEBUG_PRINTLN(status);
    return false;
  }
  
  DEBUG_PRINTLN("✓ MPU6050 détecté");
  
  // Calibration automatique
  calibrate();
  
  return true;
}

void IMUSensor::calibrate(uint16_t samples) {
  DEBUG_PRINTLN("Calibration IMU (ne pas bouger)...");
  
  mpu.calcOffsets(); // Calibration intégrée MPU6050_light

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
  
  mpu.update(); // Lit et filtre les données

  // Récupère angles (en degrés, converti en radians)
  float angleAccelRaw = mpu.getAngleY() * DEG_TO_RAD;
  float gyroRate = mpu.getGyroY() * DEG_TO_RAD; // rad/s

  // LPF sur l'angle accéléromètre : à vide il n'y a rien à filtrer, mais au sol
  // chaque pas du moteur produit un transitoire d'accélération qui contamine
  // angleY. Ce LPF agit avant le filtre complémentaire pour ne pas polluer
  // l'angle estimé.
  accelFiltered = ACCEL_LPF * angleAccelRaw + (1.0f - ACCEL_LPF) * accelFiltered;

  // Filtre complémentaire — gyro dominant (ALPHA proche de 1).
  data.angleFiltered = ALPHA * (data.angleFiltered + gyroRate * dt)
                     + (1.0f - ALPHA) * accelFiltered;

  // LPF sur la vitesse angulaire exposée au contrôleur. Le gyro brut est plein
  // de bruit haute fréquence amplifié par les vibrations du chassis ; sans ce
  // filtre, K2*ω et le kick s'auto-entretiennent en boucle fermée.
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