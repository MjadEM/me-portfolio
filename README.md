# Amjad EL MANSOURI — Engineering Portfolio

**Élève Ingénieur | Électromécanique & Digitalisation Industrielle | ENSAM Meknès**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Amjad_El_Mansouri-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/amjad-el-mansouri-66ba55297/)
[![Email](https://img.shields.io/badge/Email-amjadelm04@gmail.com-D14836?style=flat&logo=gmail)](mailto:amjadelm04@gmail.com)

---

## About me:

Engineering student specializing in **Industrial Digitalization & Industry 4.0** at ENSAM Meknès.  
My work sits at the intersection of **embedded systems**, **autonomous robotics**, **OT/IT integration**, and **AI-driven industrial solutions**.

I build things that run on real hardware — from ECU firmware on STM32 to ROS 2 navigation stacks and SCADA/digital twin architectures on PLCs.

---

## Projects

### [The Big Tris — Electric Utility Tricycle](./01_big-tris-electric-tricycle/)
> **2nd Prize — InnovAM'26 × STELLANTIS** | May 2026

An L5e-category electric utility tricycle (1400 kg MTAC, 14 kWh dual LFP pack).

**My role — ECU/VCU & Electrical Command Architecture:**
- STM32F446RE-based ECU with real-time FSM firmware (precharge, drive, fault, thermal derating)
- Distributed BMS architecture via CAN 2.0B / CAN-FD (REPT slave units + master VCU)
- 6-contactor command circuit — KiCad schematic (TLE9104SH, TVS, freewheeling diodes)
- ASIL-B safety strategy, HARA analysis, three-barrier fault defense

**Stack:** STM32, C, KiCad, CAN 2.0B, LFP chemistry, UDS/ISO 14229

---

###  [Self-Balancing Robot — Advanced Control](./02_self-balancing-robot/)
> March 2026

Two-wheeled inverted pendulum stabilized with a full **LQR state-space controller**.

- IMU signal processing + complementary/Kalman filter (vibration rejection)
- Stepper motor drive with real-time torque control
- State-space modeling → linearization → LQR gain tuning in MATLAB/Simulink

**Stack:** STM32 / Arduino, C++, Python, MATLAB/Simulink, IMU (MPU-6050)

---

###  [Autonomous Vehicle — ROS 2](./03_autonomous-vehicle-ros2/)
> 2024–2025 | Club Robotique ENSAM — Project Lead

Autonomous navigation architecture built under **ROS 2 (Humble)**.

- Sensor fusion for localization and state estimation
- Simulation in Gazebo / visualization in RViz
- Path planning and obstacle avoidance pipeline

**Stack:** ROS 2, Python, C++, Gazebo, RViz, LiDAR/Camera

---

###  [TGV Inspection Robot — SIANA Finalist](./04_tgv-inspection-robot/)
> May 2025

Predictive maintenance robot for TGV undercarriage inspection.

- Computer Vision pipeline for anomaly detection
- Electronics design in KiCad + Raspberry Pi integration
- Real-time IoT alert system

**Stack:** Python, OpenCV, Raspberry Pi, KiCad, MQTT

---

###  [Digital Twin — Industrial Test Bench](./05_digital-twin-bench/)
> Ongoing — Academic Project

Full OT/IT integration of a variable speed drive test bench.

- PLC S7-1200 → OPC-UA → Node-RED → PostgreSQL / InfluxDB
- Interactive 3D digital twin (Three.js / Vite)
- MES/ERP data pipeline with AI-ready data layer

**Stack:** TIA Portal, OPC-UA, Node-RED, Three.js, PostgreSQL, InfluxDB, AASX

---

###  [Li-ion Battery Pack Design — Ansys Simulation](./06_battery-pack-ansys/)
> January 2026 | ENSAM Meknès

Thermal and structural simulation of a prismatic Li-ion battery pack.

- Fluent CFD simulation — liquid cooling optimization
- FEA/Mechanical — structural integrity under vibration
- Thermal runaway analysis

**Stack:** Ansys Fluent, Ansys Mechanical, SolidWorks

---

##  Technical skills

| Domain | Tools & Technologies |
|---|---|
| Embedded Systems | STM32, ESP32, Arduino, Raspberry Pi, C/C++, FreeRTOS |
| Control & Modeling | LQR, PID, State-space, MATLAB/Simulink |
| Industrial Automation | TIA Portal, PL7 Pro, Node-RED, SCADA, Grafcet |
| OT/IT Integration | OPC-UA, MQTT, Modbus, KEPServerEX, PLC–Cloud gateway |
| Electronics Design | KiCad (PCB), schematic capture, power electronics |
| Simulation | Ansys Fluent, Ansys Mechanical, SolidWorks |
| Robotics | ROS 2, Gazebo, RViz, sensor fusion |
| AI / Vision | Python, OpenCV, Computer Vision pipelines |
| Data | PostgreSQL, InfluxDB, Three.js |

---

##  Currently looking for

**Stage PFA (fin d'études)** — starting Summer/Fall 2026  
Domains of interest: embedded systems, autonomous systems, industrial AI, OT/IT integration

📩 [amjadelm04@gmail.com](mailto:amjadelm04@gmail.com)

---

*ENSAM Meknès — 2nd year Cycle Ingénieur, Électromécanique Digitalisation Industrielle (GEDI)*
