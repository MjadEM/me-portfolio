# Li-ion Battery Pack Design — Multiphysics Simulation

> **Academic Project | ENSAM Meknès** — January 2026  
> Supervised by Prof. EL KHCHINE | Ansys 2024 R1

---

## Overview

Full multiphysics study of a prismatic Li-ion battery module for EV applications, covering two simulation phases: **electronic component thermal analysis** (Ansys Fluent CFD) and **battery module design with liquid cooling** (Fluent + Ansys Mechanical coupled).

The goal: design a cooling system capable of keeping an 8-cell prismatic module within its safe operating range (20°C–45°C) during a 2C fast charge cycle, within a constrained envelope of 300 × 200 × 80 mm.

---

## Part 1 — Electronic Component Cooling (Fluent CFD)

### Setup

| Parameter | Value |
|---|---|
| Domain | 100 × 100 × 42 mm air channel |
| Chip dissipation | 0.5 W (625,000 W/m³) |
| Air inlet velocity | 0.5 m/s @ 298 K |
| Flow regime | Laminar (Re ≈ 870) |
| Mesh | 189,005 cells, min orthogonal quality 0.20 |

### Results

- Convergence reached at **62 iterations** (out of 250 requested)
- Max chip temperature: **303.3 K (+5.3°C above ambient)** — within safe limits
- Thermal wake observed downstream of the chip
- Recirculation zone identified behind the chip, reducing rear-face cooling efficiency

---

## Part 2 — Li-ion Battery Module Design

### Cell selection & dimensioning

Prismatic cells were chosen over cylindrical (type 21700) for their flat surface area (better thermal contact) and rectangular packing efficiency. Configuration: **8 cells in series (8S)** within the 300 mm constraint.

```
L_total = (8 × 25 mm) + (7 gaps × 13 mm) = 291 mm  ✓ (margin: 9 mm)
```

### Thermal load calculation (2C discharge)

Heat generated per cell from Joule effect + entropy term:

```
Q_gen = 13.51 W/cell
q = Q_gen / V_cell = 13.51 / 0.000245 ≈ 55,143 W/m³
```

### Iteration 1 — Air cooling

Air cooling at 2 m/s failed to maintain safe temperatures:
- Max temperature reached **critical values (>500 K)** in the module core
- Severe longitudinal gradient: cells 1–2 (inlet) stayed cool, cells 7–8 (outlet) overheated
- ΔT between first and last cell exceeded manufacturer recommendations (ΔT < 5°C)
- **Conclusion:** air cooling insufficient for 2C charge rate → transition to liquid cooling

### Iteration 2 — Liquid cooling (Cold Plates)

Redesigned with dual aluminum cold plates (10 mm each, top and bottom). Cell dimensions adapted to fit the 80 mm height constraint:

```
New cell: 140 (L) × 28 (l) × 60 (h) mm
New heat density: q_new = 13.51 / 0.0002352 ≈ 57,440 W/m³
```

### Parametric study results

| Design Point | Flow rate (kg/s) | T_max (°C) | ΔP (Pa) |
|---|---|---|---|
| DP 0 | 0.20 | 43.0 | — |
| **DP 1 (selected)** | **0.30** | **42.0** | **26,186** |
| DP 2 | 0.45 | 41.9 | 71,912 |

**Optimal point: 0.3 kg/s** — diminishing thermal returns above this point while hydraulic losses grow with v² (×2.7 pressure increase for +50% flow).

---

## Part 3 — Thermomechanical Coupling (Ansys Mechanical)

Thermal field imported from Fluent → Static Structural analysis.

| Material | Young's Modulus | Yield Strength |
|---|---|---|
| Cell casing (Al) | 69 GPa | 200 MPa |
| Cold plates (Al) | 69 GPa | 200 MPa |

### Results

- Max thermal deformation: localized at cell lateral face centers (zone of lowest rigidity), order of magnitude: sub-millimeter — absorbable by compression foam pads
- Von Mises stress max: **45.87 MPa << 200 MPa** yield strength
- Safety factor: **> 1** → module remains in elastic domain under 2C thermal load

---

## Conclusions

| Criterion | Result |
|---|---|
| Thermal (liquid) | T_max = 42°C ✅ (< 45°C limit) |
| Thermal homogeneity | Uniform distribution via cold plates ✅ |
| Structural integrity | No permanent deformation (SF > 1) ✅ |
| Volume constraint | 140 × 28 × 60 mm fits 300 × 200 × 80 mm ✅ |

---

## Stack

Ansys Fluent 2024 R1 · Ansys Mechanical (Static Structural) · Ansys Workbench Parameter Set · DesignModeler · SolidWorks (geometry)

---

## Simulation screenshots

> See [`/screenshots`](./screenshots/) folder for: mesh quality, temperature contours (air and liquid), velocity vectors, parametric study dashboard, Von Mises stress map, safety factor distribution, thermal deformation.
