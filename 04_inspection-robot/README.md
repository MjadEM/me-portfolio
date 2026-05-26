# ROBAM 2.0 — TGV Undercarriage Inspection Robot

> **InnovAM'25 — SIANA Finalist** | ENSAM Meknès × UMI  
> Client: Société Marocaine de Maintenance des Rames à Grande Vitesse (SIANA)

---

## Overview

ROBAM 2.0 is an autonomous/teleoperated inspection robot designed to perform undercarriage diagnostics on TGV trains in maintenance pits. It replaces the manual ES (Examen Sous-caisse) operation (~1 hour per train) with an automated system combining a mobile platform, a 5-DOF robotic arm, computer vision (YOLOv11n), a real-time digital twin, and optional voice control.

---

## Problem Statement

Manual TGV undercarriage inspection is time-consuming, error-prone, and performed in confined spaces with variable lighting. ROBAM 2.0 automates detection of:

- Loose or missing bolts
- Cracks in brake discs or metal plates
- Oil/fluid leaks
- Corrosion and abnormal wear

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    ROBAM 2.0                         │
│                                                      │
│  ┌─────────────┐    ┌──────────────┐                 │
│  │ Mobile      │    │ 5-DOF        │                 │
│  │ Platform    │────│ Robotic Arm  │──── Camera 16MP │
│  │ (DC motors) │    │ (MG995/996R) │                 │
│  └─────────────┘    └──────────────┘                 │
│         │                   │                        │
│  ┌──────────────────────────────────┐                │
│  │     Raspberry Pi 5 (4/8GB)       │                │
│  │  YOLOv11n + TensorRT inference   │                │
│  │  WebRTC video · WebSocket alerts │                │
│  │  VOSK voice recognition          │                │
│  └──────────────────────────────────┘                │
│         │                                            │
│  ┌──────────────┐    ┌──────────────┐                │
│  │ IMU MPU-6050 │    │ LiPo 4S      │                │
│  │ HC-SR04 sonar│    │ 4000mAh 60C  │                │
│  └──────────────┘    └──────────────┘                │
└──────────────────────────────────────────────────────┘
         │ WebRTC P2P + WebSocket
         ▼
┌─────────────────────┐
│  Technician UI      │
│  React + Vite + TS  │
│  Live video stream  │
│  Real-time alerts   │
└─────────────────────┘
```

---

## Specifications

| Constraint | Value |
|---|---|
| Operation width | ≤ 1435 mm (rail gauge) |
| Operation height | ≤ 1500 mm (below rail level) |
| Min speed | 1 m/s (human walking pace) |
| Battery autonomy | ≥ 4 hours |
| Coverage distance | 200 m |


---

## Mechanical Design

### Mobile platform (chariot)
- Material: Aluminum alloy 7075 (Re = 455 MPa, E = 71 GPa)
- I-beam frame structure for rigidity/weight ratio
- 2× DC motors + L298N H-bridge, PWM speed control
- Spring-based lateral guidance system along pit wall
- Validated via CATIA simulation: σ_max = 0.799 MPa << σ_adm = 227.5 MPa

### Robotic arm
- 5 articulations, carbon fiber PAN (ρ = 1500 kg/m³), m_bras = 6 kg
- Fabricated via additive manufacturing (FDM)
- 4× MG995/MG996R servos controlled via PCA9685 PWM shield
- Camera mount at tip for targeted inspection

---

## AI & Computer Vision

**Model:** YOLOv11n (nano) — fine-tuned on custom TGV defect dataset  
**Optimization:** TensorRT INT8/FP16 quantization for Raspberry Pi 5

| Metric | Before TensorRT | After TensorRT |
|---|---|---|
| Model size | 200–300 MB | 20–50 MB |
| Inference speed | 2–3 s/frame | 50–100 ms |
| Memory usage | Saturated | Reduced |

**Detection classes:** loose bolts, cracks, oil leaks, corrosion, abnormal wear  
**Annotation tool:** Roboflow / LabelImg → YOLO format  
**Dataset split:** 70% train / 20% validation / 10% test

---

## Real-time Communication

| Layer | Technology | Role |
|---|---|---|
| Video stream | WebRTC (P2P) | Low-latency live video from robot camera |
| Alert channel | WebSocket | Instant anomaly notifications + location |
| Frontend | React + Vite + TypeScript | Technician dashboard, responsive |
| Robot UI | Joystick USB (2×) | Manual override control |

---

## Voice Control (VOSK)

Offline speech recognition using the VOSK lightweight model (`vosk-model-small-en-us-0.15`).

- Commands: `go`, `stop`, `power on`, `power off`
- Invalid commands return `not_allowed`
- Tested on PC → deployable to Raspberry Pi 5

---

## Digital Twin

Real-time IMU (MPU-6050) data feeds a 3D digital twin of the robot:
- 6-DOF tracking (3 linear + 3 rotational axes)
- Sensor fusion for orientation and state estimation
- WebSocket-based state synchronization with the React dashboard

---

## My Contributions

- Electronics design (KiCad): power distribution, sensor wiring
- Computer vision pipeline: YOLO dataset strategy, TensorRT optimization
- Digital twin architecture: IMU → WebSocket → React 3D viewer

---

## Media

> Photos and videos available in [`/media`](./media/) — robot prototype, electronics, SolidWorks renders, competition demo.

---

## Stack

Python · OpenCV · YOLOv11n · TensorRT · VOSK · React · Vite · TypeScript · WebRTC · WebSocket · Raspberry Pi 5 · KiCad · SolidWorks · CATIA
