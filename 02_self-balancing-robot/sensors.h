// ═══════════════════════════════════════════════════════════════
//  MODULE CAPTEURS - Gestion IMU MPU6050
// ═══════════════════════════════════════════════════════════════

#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// Structure données capteur
typedef struct {
  float angle;         // rad - Angle mesuré (pitch)
  float angularVel;    // rad/s - Vitesse angulaire
  float angleFiltered; // rad - Angle filtré (complémentaire)
  bool isCalibrated;   // Statut calibration
  uint32_t lastUpdate; // Timestamp (µs)
} SensorData_t;

class IMUSensor {
public:
  // Initialisation
  bool begin();
  
  // Calibration (robot immobile)
  void calibrate(uint16_t samples = 1000);
  
  // Lecture données (à appeler dans loop)
  void update();
  
  // Accesseurs
  float getAngle() const { return data.angleFiltered; }
  float getAngularVelocity() const { return data.angularVel; }
  bool isReady() const { return data.isCalibrated; }
  
  // Debug
  void printData() const;
  
private:
  SensorData_t data;
  float offsetAngle;
  float offsetGyro;
  float gyroFiltered;   // sortie LPF sur theta_dot
  float accelFiltered;  // sortie LPF sur angle dérivé de l'accéléromètre

  // Filtre complémentaire — quasi tout-gyro pour minimiser l'injection des
  // vibrations sol→accel→angle. La correction de dérive du gyro reste
  // assurée par les 0.5% restants.
  const float ALPHA = 0.98f;
  // LPF sur la vitesse angulaire : casse la boucle vibration→gyro→moteur.
  // β proche de 1 = peu de filtrage, proche de 0 = très filtré.
  // À 1 kHz, β=0.10 donne -3dB ≈ 17 Hz.
  const float GYRO_LPF = 0.15f;
  // LPF sur l'angle accéléromètre : indispensable au sol, où chaque pas du
  // moteur injecte une accélération transitoire dans le chassis.
  // β=0.04 → -3dB ≈ 6 Hz. L'angle de gravité étant DC, on peut filtrer fort.
  const float ACCEL_LPF = 0.02f;
};

// Instance globale (Singleton)
extern IMUSensor imu;

#endif // SENSORS_H