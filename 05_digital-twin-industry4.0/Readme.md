# Jumeau Numérique Industriel — Banc Moteur Asynchrone ENSAM

> **Projet métier S8 — ENSAM Meknès — 2025/2026**
> Architecture Industrie 4.0 conforme aux standards IDTA : acquisition Modbus normalisée OPC UA, Asset Administration Shell (AAS) comme couche d'interopérabilité sémantique, jumeau numérique avec modèle physique, historisation multi-base et exposition API.

[![Industrie 4.0](https://img.shields.io/badge/Industrie-4.0-blue?style=flat-square)](https://www.plattform-i40.de/)
[![IDTA AAS](https://img.shields.io/badge/AAS-IDTA%20v3-orange?style=flat-square)](https://industrialdigitaltwin.org/)
[![OPC UA](https://img.shields.io/badge/OPC%20UA-Compliant-green?style=flat-square)](https://opcfoundation.org/)
[![Node-RED](https://img.shields.io/badge/Node--RED-3.x-red?style=flat-square)](https://nodered.org/)
[![Docker](https://img.shields.io/badge/Docker-Required-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

##  Table des matières

- [ Vue d'ensemble](#-vue-densemble)
- [ Architecture du système](#️-architecture-du-système)
- [ Matériel cible](#️-matériel-cible)
- [ Stack technique](#-stack-technique)
- [ Composants logiciels](#-composants-logiciels)
- [ Installation et déploiement](#-installation-et-déploiement)
- [ Modèle physique du jumeau](#-modèle-physique-du-jumeau)
- [ Cartographie des données](#-cartographie-des-données)
- [ Tableaux de bord](#-tableaux-de-bord)
- [ API REST et MQTT](#-api-rest-et-mqtt)
- [ Concepts clés](#-concepts-clés)
- [ Difficultés rencontrées](#️-difficultés-rencontrées)
- [ Perspectives](#-perspectives)
- [ Références normatives](#-références-normatives)
- [ Équipe et contributions](#-équipe-et-contributions)
- [ Licence](#-licence)

---

##  Vue d'ensemble

### Contexte

Ce projet répond à une problématique concrète : **comment digitaliser un banc d'essai industriel existant en respectant les standards Industrie 4.0** ?

Le banc d'essai concerné est un système électromécanique composé d'un variateur de vitesse Siemens MICROMASTER 420 alimentant un moteur asynchrone triphasé, instrumenté par une centrale de mesure Schneider PM2230 communiquant en Modbus RTU via une passerelle Ebyte NA111.

### Objectifs

1. **Acquisition normalisée** : encapsuler le protocole Modbus terrain dans une couche OPC UA standardisée
2. **Sémantique I4.0** : exposer les données via un Asset Administration Shell conforme IDTA v3
3. **Jumeau numérique** : reconstruire l'état mécanique du moteur (vitesse rotor, couple, glissement) à partir des seules mesures électriques
4. **Supervision SCADA** : tableau de bord opérateur temps réel
5. **Historisation** : stockage relationnel (PostgreSQL) et série temporelle (InfluxDB)
6. **Interopérabilité** : exposition des données via API REST et MQTT
7. **Visualisation 3D** : représentation interactive du banc avec animation temps réel

### Démonstration

| Aspect | Résultat |
|---|---|
|  Lecture AAS dynamique | 40 tags OPC UA découverts automatiquement |
|  Validation terrain | Frequency = 49.20 Hz lue de bout en bout |
|  Modèle jumeau | Estimation Nr ±0.5% vs mesure plaque |
|  Latence end-to-end | < 2 secondes (PM2230 → dashboard) |
|  Historisation | SQL agrégé 1h + InfluxDB raw 2s |
|  API REST | 13 endpoints documentés (Swagger) |
|  Robustesse | Mode actif/secours Modbus en standby |

---

## Architecture du système

### Vue en couches (RAMI 4.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE FONCTIONNELLE / BUSINESS                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  SCADA   │  │ Historian│  │   API    │  │  Jumeau  │             │
│  │  Dashbd  │  │ PG+Influx│  │REST+MQTT │  │  3D Web  │             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE INFORMATION (sémantique I4.0)                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Asset Administration Shell (AAS) — IDTA v3                  │    │
│  │  8 submodels • 160 qualifiers OPC UA                         │    │
│  │  http://localhost:5001/submodels                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE COMMUNICATION (normalisation protocole)                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  KEPServerEX V6 — Serveur OPC UA                             │    │
│  │  opc.tcp://127.0.0.1:49320                                   │    │
│  │  43 tags PM2230 normalisés (Float IEEE 754)                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE INTÉGRATION                                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Ebyte NA111 — Passerelle Modbus RTU/TCP                     │    │
│  │  RS-485 (9600 bauds 8N1) → TCP (200.200.200.247:502)         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE TERRAIN (instrumentation)                                    │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │  PM2230          │    │  MICROMASTER 420 │                       │
│  │  Schneider       │    │  Siemens VFD     │                       │
│  │  Power Meter     │    │  0.37 kW         │                       │
│  └──────────────────┘    └──────────────────┘                       │
│           │                       │                                  │
│           └───────────┬───────────┘                                  │
│                       ▼                                              │
│              ┌─────────────────┐                                     │
│              │  Moteur Async   │                                     │
│              │  0.25 kW, 4P    │                                     │
│              │  1350 tr/min    │                                     │
│              └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Flux de données end-to-end

```
PM2230 → NA111 → KEPServerEX → AAS → Twin v6 → Bridge → SCADA → Historian → API
   ↓                                                       ↓
[Modbus RTU]                                          [HTTP/MQTT]
                                                           ↓
                                                       Clients
```

---

## Matériel cible

### Centrale de mesure

| Caractéristique | Valeur |
|---|---|
| Modèle | Schneider Electric PM2230 |
| Série | PowerLogic PM2000 |
| Type | Centrale triphasée |
| Mesures | U, I, P, Q, S, PF, F, E, THD, déséquilibres |
| Précision | Classe 0.5 (IEC 61557-12) |
| Protocole | Modbus RTU sur RS-485 |
| Adresse | Slave ID 3 |

### Passerelle

| Caractéristique | Valeur |
|---|---|
| Modèle | Ebyte NA111 |
| Conversion | Modbus RTU ↔ Modbus TCP |
| RS-485 | 9600 bauds, 8N1 |
| TCP | 200.200.200.247:502 |

### Variateur de vitesse

| Caractéristique | Valeur |
|---|---|
| Modèle | Siemens MICROMASTER 420 |
| Référence | 6SE6420-2AB13-7AA1 |
| Puissance nominale | 0.37 kW |
| Commande | Profibus (via PLC S7) |

### Moteur asynchrone

| Caractéristique | Valeur |
|---|---|
| Type | 57704 (triphasé asynchrone à cage) |
| Puissance | 0.25 kW |
| Tension | 400 / 230 V (étoile / triangle) |
| Courant | 0.76 / 1.52 A |
| Vitesse nominale | 1350 tr/min |
| Vitesse synchrone | 1500 tr/min (4 pôles) |
| Glissement nominal | 10 % |
| Couple nominal | 1.77 N·m |
| Facteur de puissance | 0.78 |
| Classe d'isolation | F |

### PLC

| Caractéristique | Valeur |
|---|---|
| Modèle | Siemens S7-1200/1500 |
| Commande VFD | MW82 (consigne) / M100.0 (prêt) / M100.1 (démarrage) |
| Lecture vitesse | MW182 (retour) |
| Sécurité | I5.0 (arrêt d'urgence ASI) |

---

##  Stack technique

### Acquisition & normalisation

| Composant | Version | Rôle |
|---|---|---|
| **KEPServerEX** | V6 | Serveur OPC UA, normalisation Modbus → OPC UA |
| **Prosys OPC UA Client** | Latest | Outil de validation et exploration |

### Asset Administration Shell

| Composant | Version | Rôle |
|---|---|---|
| **AASX Server (Blazor)** | 0.3.1.552-aasV3 | Serveur AAS exposant les submodels en REST |
| **AASX Package Explorer** | Latest | Édition graphique du fichier AAS |
| **Docker Desktop** | Latest | Conteneurisation du serveur AAS |

### Orchestration

| Composant | Version | Rôle |
|---|---|---|
| **Node-RED** | 3.x | Plateforme low-code d'intégration |
| **node-red-dashboard** | 3.6.6 | Tableaux de bord temps réel |
| **node-red-contrib-modbus** | 5.45.2 | Communication Modbus (mode secours) |
| **node-red-contrib-opcua** | 0.2.349 | Client OPC UA |
| **node-red-contrib-influxdb** | 0.7.0 | Persistance série temporelle |
| **node-red-contrib-postgresql** | Latest | Persistance relationnelle |

### Historisation

| Composant | Version | Rôle |
|---|---|---|
| **PostgreSQL** | 15+ | Stockage relationnel + agrégation 1h |
| **InfluxDB** | 2.0 | Série temporelle haute résolution |

### Diffusion

| Composant | Version | Rôle |
|---|---|---|
| **Mosquitto / EMQX** | Latest | Broker MQTT |
| **HTTP-in/out** (Node-RED) | - | API REST |
| **Swagger UI** | 4.x | Documentation API |

### Visualisation 3D (en cours)

| Composant | Version | Rôle |
|---|---|---|
| **Three.js** | r155+ | Moteur 3D WebGL |
| **Vite** | 5.x | Bundler frontend |
| **HTML5 / CSS3 / ES Modules** | - | Plateforme web |

---

##  Composants logiciels

Le projet Node-RED est structuré en **5 onglets fonctionnels** + **3 onglets pipeline** :

### Onglets pipeline (acquisition I4.0)

####  `Twin v6 FINAL v2` — Orchestrateur principal

Découvre dynamiquement les variables OPC UA via l'AAS, lit les valeurs, applique le modèle physique du jumeau.

**Fréquences** :
- Découverte AAS : 60s
- Cycle de lecture OPC UA : 3s
- Rate limit interne : 100 msg/s

**Robustesse** :
- Mécanisme de `cycle_id` unique par vague de lecture (évite la pollution inter-cycles)
- Nettoyage automatique des cycles obsolètes (>10s)
- Reset complet de `flow.readings` à chaque cycle complet

**Sortie** :
- `flow.readings = { motor: {...}, vfd: {...} }`
- `flow.twin = { vfd: {...}, motor: {...}, timestamp, _stats }`

#### 🔗 `Bridge OPC UA → SCADA` — Couche d'adaptation

Traduit la nomenclature sémantique AAS vers les variables internes du SCADA legacy.

**Exemple de mapping** :
- `Voltage_AB` (AAS) → `flow.Vab` (SCADA)
- `Current_A` (AAS) → `flow.Ia` (SCADA)
- `Power_Active_P_A` (AAS) → `flow.Pa` (SCADA, kW)
- `Frequency` (AAS) → `flow.Hz` (SCADA)
- Reconstruction de `flow.powers = {Pa, Pb, Pc, P_total, PF_total, ...}`

### Onglets fonctionnels

####  `SCADA PM2230 - Pro` — Dashboard de supervision

103 nodes incluant :
- 29 jauges temps réel
- 13 graphiques d'historisation
- 16 fonctions de décodage et calcul
- Watchdog de communication
- Détection d'alarmes paramétrable
- Calcul moteur asynchrone
- Score de santé système
- 7 nodes Modbus en mode secours (désactivés en mode nominal OPC UA)

####  `Historian Backend` — Persistance

68 nodes incluant :
- 15 nodes PostgreSQL (CRUD + agrégation 1h)
- 1 node InfluxDB batch (long schema)
- 8 timers d'agrégation
- 2 buttons d'export
- 11 sondes debug

####  `API REST` — Exposition HTTP

77 nodes incluant :
- 13 endpoints HTTP-in
- 7 nodes PostgreSQL en lecture
- 28 fonctions de transformation
- Validation CORS et auth

####  `MQTT Publisher` — Diffusion temps réel

12 nodes incluant :
- 3 topics MQTT (temps réel, agrégé, événements)
- 2 link in (depuis SCADA et Historian)

####  `API Docs (Swagger)` — Documentation

5 nodes servant la documentation Swagger UI auto-générée.

---

##  Installation et déploiement

### Prérequis

- Windows 10/11 (testé) ou Linux
- Docker Desktop avec WSL2 (Windows)
- Node.js 18+ et npm
- Node-RED 3.x global
- KEPServerEX V6 (licence commerciale)
- PostgreSQL 15+
- InfluxDB 2.0+
- Mosquitto MQTT broker

### 1. Serveur AAS (Docker)

```bash
docker run -d \
  -p 5001:5001 \
  -v /chemin/vers/aasx_data:/AasxServerBlazor/aasxs \
  --name aasx_server_ensam \
  --entrypoint dotnet \
  adminshellio/aasx-server-blazor-for-demo:main \
  AasxServerBlazor.dll \
  --no-security \
  --data-path /AasxServerBlazor/aasxs \
  --with-db \
  --start-index 0 \
  --external-blazor http://localhost:5001
```

>  **Note critique** : l'option `--entrypoint dotnet` est nécessaire pour bypasser le script `startForDemo.sh` qui écrase les arguments. Sans cela, le mode `--with-db` n'est pas appliqué et SQLite échoue à créer ses tables.

Pour redémarrage ultérieur (pour ne pas réindexer) :
```bash
docker start aasx_server_ensam --start-index 1000
```

Vérifier que l'AAS répond :
```bash
curl http://localhost:5001/submodels
```

### 2. Importer le fichier AAS

1. Placer `AAS_File.aasx` dans le dossier monté (`aasx_data/`)
2. Redémarrer le conteneur
3. Vérifier dans le browser : `http://localhost:5002` (instance visuelle si activée)

### 3. Configurer KEPServerEX

1. Créer un canal **Modbus TCP** :
   - Nom : `Ch_ModbusTCP_NA111`
   - IP : `200.200.200.247`
   - Port : `502`

2. Créer un device :
   - Nom : `PM2200.PM2230`
   - Slave ID : `3`

3. **Encodage critique** (PM2230 Schneider) :
   - `Modbus Byte Order` : **Enable**
   - `First Word Low` : **Disable**
   - `First DWord Low` : Enable

4. Importer le CSV de tags : `kepserver/PM2200.csv` (43 tags Float)

5. Vérifier l'endpoint OPC UA :
   - `opc.tcp://127.0.0.1:49320` (port par défaut)
   - Security : None / None
   - Anonymous login enabled

### 4. Node-RED

```bash
# Installation des modules
cd ~/.node-red
npm install node-red-dashboard@3.6.6
npm install node-red-contrib-modbus@5.45.2
npm install node-red-contrib-opcua@0.2.349
npm install node-red-contrib-influxdb@0.7.0
npm install node-red-contrib-postgresql

# Démarrage
node-red
```

Accès : `http://localhost:1880`

### 5. Importer les flows

Importer dans l'ordre :
1. `flows/scada_pm2230_pro.json` (dashboard SCADA)
2. `flows/historian_backend.json` (PostgreSQL + InfluxDB)
3. `flows/api_rest.json` (endpoints HTTP)
4. `flows/mqtt_publisher.json` (diffusion)
5. `flows/api_docs_swagger.json` (documentation)
6. `flows/twin_v6_FINAL_v2.json` (jumeau OPC UA)
7. `flows/bridge_opcua_to_scada.json` (adaptation)

### 6. Bases de données

#### PostgreSQL

```bash
createdb pm2230_historian
psql pm2230_historian < sql/schema.sql
```

#### InfluxDB

```bash
influx setup --org pm2230 --bucket pm2230_raw
```

### 7. Accès aux interfaces

| Service | URL |
|---|---|
| **Dashboard SCADA** | http://localhost:1880/ui |
| **Node-RED Editor** | http://localhost:1880 |
| **AAS REST API** | http://localhost:5001/submodels |
| **OPC UA endpoint** | opc.tcp://127.0.0.1:49320 |
| **API REST Swagger** | http://localhost:1880/api/docs |
| **InfluxDB UI** | http://localhost:8086 |
| **MQTT broker** | mqtt://localhost:1883 |

---

##  Modèle physique du jumeau

Le jumeau numérique reconstruit l'état mécanique du moteur à partir des seules grandeurs électriques mesurées par le PM2230. C'est la valeur ajoutée du jumeau : **estimer un état complet à partir d'une instrumentation parcimonieuse**.

### Équations fondamentales

#### Vitesse synchrone
```
Ns = 120 × f / p          [tr/min]
```
où `f` = fréquence réseau (Hz), `p` = nombre de pôles (4 ici).

#### Glissement
```
g = g_nom × (charge / 100)
g_nom = 10 % (plaque)
charge = (P_électrique / P_électrique_nominale) × 100
```

#### Vitesse rotor estimée
```
Nr = Ns × (1 − g)         [tr/min]
```

#### Puissance mécanique
```
P_méca = P_électrique × η
η = courbe de rendement(charge)
```

#### Couple
```
ω_r = 2π × Nr / 60        [rad/s]
C = (P_méca × 1000) / ω_r [N·m]
```

### Modèle thermique (1er ordre)

```
T_cible = T_amb + ΔT_max × charge²
T(t+dt) = T(t) + (T_cible − T(t)) × (1 − exp(−dt/τ))
```
avec `τ = 650 s`, `ΔT_max = 75 K`.

### Courbe de rendement

Fonction par morceaux calée sur la classe IE2/IE3 :

| Charge | Rendement (de η_nom) |
|---|---|
| 0 - 25% | montée linéaire de 55% à 92% |
| 25 - 75% | montée légère de 92% à 100% |
| 75 - 110% | plateau (zone optimale) |
| > 110% | dégradation rapide |

### Détection d'anomalies

Algorithme **3-sigma** sur le courant moteur :
```
μ = moyenne(I[n-30:n])
σ = écart-type(I[n-30:n])
si |I − μ| > 3σ : ANOMALIE
```

Conditions supplémentaires :
- Déséquilibre tension > 5% → anomalie
- Température estimée > 90°C → anomalie

### Score de santé

```
score = 100
       − 1.5 × max(0, T − 75)        (pénalité thermique)
       − 10 si surcharge
       − 30 si défaut actif
       − 15 si anomalie 3σ
       − 0.3 × vieillissement_pct
```

---

## 🔌 Cartographie des données

### Structure de l'AAS

L'AAS contient **2 Asset Administration Shells** (VFD + Moteur), chacun structuré en submodels :

#### AAS VFD

```
AAS_1_VFD_Banc_ENSAM
├── Nameplate              (11 props, valeurs fixes plaque)
├── OperationalData        (10 props, états logiques calculés)
├── HealthMonitoring       (5 props, santé calculée)
└── Operation              (7 props, 7 qualifiers OPC UA)
```

#### AAS Moteur

```
AAS_2_Motor_Banc_ENSAM
├── Nameplate              (16 props, valeurs fixes plaque)
├── ConditionMonitoring    (11 props, surveillance physique)
├── HealthMonitoring       (7 props, santé calculée)
└── Operation              (28 props, 112 qualifiers OPC UA)
```

### Qualifiers OPC UA (pattern)

Chaque propriété mesurée porte 4 qualifiers :

```xml
<qualifier>
  <type>opcua:endpoint</type>
  <value>opc.tcp://127.0.0.1:49320</value>
</qualifier>
<qualifier>
  <type>opcua:nodeId</type>
  <value>ns=2;s=Ch_ModbusTCP_NA111.PM2200.PM2230.Measurements.Frequency.Frequency</value>
</qualifier>
<qualifier>
  <type>accessMode</type>
  <value>read-only</value>
</qualifier>
<qualifier>
  <type>unit</type>
  <value>Hz</value>
</qualifier>
```

### Mapping principal des variables

| Domaine | idShort AAS | nodeId OPC UA | Unité |
|---|---|---|---|
| Fréquence | `Frequency` | `...PM2230.Measurements.Frequency.Frequency` | Hz |
| Tension L-L | `Voltage_AB/BC/CA` | `...PM2230.Measurements.Voltage.LineToLine.Voltage_*` | V |
| Courant | `Current_A/B/C` | `...PM2230.Measurements.Current.Current_*` | A |
| Puissance active | `Power_Active_P_A/B/C` | `...PM2230.Measurements.PowerFactor.Power.Active.P_*` | W |
| Puissance réactive | `Power_Reactive_Q_A/B/C` | `...PM2230.Measurements.PowerFactor.Power.Reactive.Q_*` | VAR |
| Puissance apparente | `Power_Apparent_S_A/B/C` | `...PM2230.Measurements.PowerFactor.Power.Apparent.S_*` | VA |
| Facteur de puissance | `Power_Factor` | `...PM2230.Measurements.PowerFactor.PF_Total` | - |
| Déséquilibre tension | `Voltage_Unbalance_LL_Worst` | `...PM2230.PowerQuality.VoltageUnbalance.U_Unbalance_LL_Worst` | % |
| Déséquilibre courant | `Current_Unbalance_Worst` | `...PM2230.PowerQuality.CurrentUnbalance.I_Unbalance_Worst` | % |

---

## 📊 Tableaux de bord

### Dashboard SCADA principal (`http://localhost:1880/ui`)

10 onglets opérateur :

1. **Vue d'ensemble** — KPI globaux, score santé, état communication
2. **Courants** — Jauges Ia/Ib/Ic/In, historique, déséquilibres
3. **Tensions** — L-L et L-N, diagramme de Fresnel, conformité
4. **Puissances** — P/Q/S, cos φ, triangle des puissances, énergie
5. **Qualité d'Énergie** — THD U/I par phase, déséquilibres, conformité EN 50160
6. **Historisation** — Courbes long terme (1h)
7. **Diagnostic** — État Modbus, cartographie registres, journal système
8. **Moteur Asynchrone** — Ns, Nr, couple, état, courbe T(N)
9. **Alarmes** — Synthèse, journal actif, historique 24h
10. **Paramètres** — Configuration moteur, seuils d'alarme

### Dashboard Jumeau (`🤖 Twin v6 v2`)

Tableau dédié au jumeau avec :
- Vitesse rotor estimée
- Température estimée
- Rendement instantané
- Fréquence, courant, puissance
- Score de santé
- JSON live du jumeau complet

---

##  API REST et MQTT

### Endpoints REST principaux

Documentation Swagger : `http://localhost:1880/api/docs`

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/realtime` | Dernière mesure complète |
| GET | `/api/realtime/{measure}` | Mesure spécifique (P, Q, V, I, ...) |
| GET | `/api/history?from={ts}&to={ts}` | Historique brut sur période |
| GET | `/api/aggregated/1h?from={ts}` | Agrégations horaires |
| GET | `/api/alarms` | Alarmes actives |
| GET | `/api/alarms/history` | Historique alarmes |
| GET | `/api/twin` | État complet du jumeau |
| GET | `/api/twin/motor` | Section moteur du jumeau |
| GET | `/api/twin/vfd` | Section VFD du jumeau |
| GET | `/api/health` | Santé du système |
| GET | `/api/config` | Configuration paramétrable |
| POST | `/api/config/motor` | Mise à jour paramètres moteur |
| POST | `/api/config/thresholds` | Mise à jour seuils d'alarme |

### Topics MQTT

| Topic | Description | Période |
|---|---|---|
| `pm2230/realtime` | Mesures temps réel (JSON complet) | 2s |
| `pm2230/aggregated` | KPI agrégés horaires | 1h |
| `pm2230/events` | Alarmes et événements | Sur événement |

---

## 🎓 Concepts clés

### L'AAS comme annuaire, pas comme stockage

> **L'Asset Administration Shell n'est PAS un canal de données temps réel. C'est un passeport interopérable qui décrit ce que l'asset est et où trouver ses informations.**

Les valeurs transitent par OPC UA. L'AAS dit : "voici la liste des grandeurs mesurables, et voici leurs adresses OPC UA". Le client (Node-RED, MES, ERP, autre AAS) interroge alors directement OPC UA pour les valeurs réelles.

C'est conforme à **IEC 63278** et au pattern recommandé par l'IDTA.

### OPC UA n'est pas redondant avec Modbus

KEPServerEX joue le rôle de **couche de normalisation sémantique** : il unifie des protocoles terrain hétérogènes (Modbus PM2230, 4-20mA potentiel, ASI, etc.) en un **modèle d'information cohérent** accessible en OPC UA. C'est exactement le rôle prescrit par **RAMI 4.0** pour découpler l'information de la communication.

### Le jumeau reconstruit ce qui n'est pas mesuré

Le banc dispose d'une instrumentation partielle (le Profibus du VFD est défaillant, pas de capteur de température, pas d'encodeur). Le jumeau **reconstruit l'état complet** à partir des seules grandeurs PM2230 et d'un modèle physique. C'est la démonstration concrète de la valeur d'un jumeau numérique.

### Architecture en couches découplées

Chaque composant remplit **un seul rôle** :
- **Twin v6** : acquisition + modèle physique
- **Bridge** : traduction de nomenclature
- **SCADA** : affichage et alarmes
- **Historian** : persistance
- **API** : exposition

Cette séparation respecte le principe SOLID. Si l'on remplace demain le SCADA par Grafana, Twin v6 et Bridge ne bougent pas.

### Mode actif/secours

L'architecture supporte deux modes de fonctionnement :
- **Nominal** : acquisition via AAS + OPC UA (interopérabilité I4.0)
- **Secours** : acquisition via Modbus direct (résilience industrielle)

Le basculement est instantané (activation/désactivation de nodes Node-RED). C'est un pattern industriel classique de système critique.

---

##  Difficultés rencontrées

Documentation honnête des obstacles techniques pour transparence et pédagogie.

### 1. Persistance SQLite du serveur AAS

**Problème** : erreur `no such table AASSets/SMSets` au démarrage.
**Cause** : le script `startForDemo.sh` du conteneur Docker écrasait les arguments `--with-db`.
**Solution** : utiliser `--entrypoint dotnet` pour bypasser le script et passer directement à `dotnet AasxServerBlazor.dll` avec les bons arguments.

### 2. Endianness PM2230 Schneider

**Problème** : valeurs Float aberrantes (`1.83E-038`, `-1.11E+036`) malgré une qualité Good côté Modbus.
**Cause** : le PM2230 Schneider utilise un format **Little-Endian Word Swap** pour ses Float 32 bits.
**Solution** : dans KEPServerEX, paramètres du device :
- `Modbus Byte Order = Enable`
- `First Word Low = Disable`

Cette configuration assure le décodage correct des 2 registres 16 bits en un Float IEEE 754.

### 3. Mode `readmultiple` de node-red-contrib-opcua

**Problème** : le node OPC UA en mode `readmultiple` ne renvoyait jamais de message en sortie 1 (silence total).
**Cause** : incompatibilité de format msg avec la version 0.2.349 du package.
**Solution** : utiliser le mode `read` simple avec une boucle de tags séquentielle, rate-limitée à 100 msg/s.

### 4. Pollution inter-cycles du collector

**Problème** : un cycle de lecture (3s) prend plus de temps que prévu (40 tags × 50 ms), les cycles s'accumulent (`120/40`).
**Cause** : pas de mécanisme d'isolation entre cycles successifs.
**Solution** : implémentation d'un `cycle_id` unique par vague (timestamp), avec accumulator par cycle et nettoyage des cycles obsolètes (>10s).

### 5. Profibus VFD défaillant

**Problème** : la commande du variateur via Profibus depuis le PLC ne fonctionnait pas initialement.
**Cause** : variateur en état "non prêt" (signal `M100.0 = 0`), probablement un défaut de configuration P0700 ou STO.
**Solution** : reconfiguration locale du variateur. Cela valide néanmoins **la valeur architecturale du jumeau** : l'instrumentation directe du VFD étant peu fiable, le jumeau reconstruit l'état mécanique à partir des mesures PM2230 fiables.

---

## 📈 Perspectives

### Améliorations à court terme

- [ ] Ajout des qualifiers OPC UA pour les tags THD dans l'AAS
- [ ] Implémentation d'un timeout watchdog sur Twin v6 (force-completion)
- [ ] Page web 3D Three.js interactive (en cours)
- [ ] Authentification API REST (JWT)
- [ ] Tableaux Grafana pré-configurés depuis InfluxDB

### Évolutions structurelles

- [ ] Migration vers OPC UA PubSub (MQTT/UDP) pour réduire la latence
- [ ] AAS connectée à un AAS Registry (IDTA infrastructure)
- [ ] Modèle ML pour la détection d'anomalies (vs 3-sigma classique)
- [ ] Jumeau prédictif : durée de vie résiduelle, maintenance prédictive
- [ ] Intégration MES via OPC UA Companion Specification ISA-95

### Multi-banc / Multi-site

- [ ] Déploiement sur plusieurs bancs (cluster d'AAS)
- [ ] Federation Layer pour interroger plusieurs jumeaux
- [ ] Comparaison temps réel entre bancs (benchmarking)

---

##  Références normatives

| Norme | Domaine |
|---|---|
| **IEC 63278-1** | Asset Administration Shell — Concepts |
| **IEC 63278-2** | Asset Administration Shell — Information model |
| **IEC 62541** | OPC Unified Architecture |
| **IEC 61131-3** | Programmation automates programmables |
| **IEC 61557-12** | Précision instruments de mesure (PM2230 classe 0.5) |
| **IEC 61000-4-30** | Méthodes de mesure de la qualité de l'énergie |
| **EN 50160** | Caractéristiques de la tension fournie par les réseaux publics |
| **IEEE 1159** | Recommended Practice for Monitoring Electric Power Quality |
| **NEMA MG-1** | Motors and Generators (déséquilibre < 5%) |
| **IEEE 519** | Harmonic Control in Electric Power Systems |
| **RAMI 4.0** | Reference Architectural Model Industrie 4.0 |

### Documentation IDTA

- [Asset Administration Shell Specification](https://industrialdigitaltwin.org/en/content-hub/aasspecifications)
- [Submodel Templates Catalog](https://industrialdigitaltwin.org/en/content-hub/submodels)

## 📜 Licence

Ce projet est distribué sous licence **MIT** — voir [LICENSE](LICENSE) pour les détails.

```
Copyright (c) 2026 Amjad [Nom] — ENSAM Meknès

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Texte MIT complet...]
```

### Composants tiers

- **AASX Server** : Apache 2.0 — © admin-shell.io
- **Node-RED** : Apache 2.0 — © OpenJS Foundation
- **Three.js** : MIT — © mrdoob
- **InfluxDB** : MIT — © InfluxData
- **PostgreSQL** : PostgreSQL License

### Standards / normes

Les références aux normes (IEC, IEEE, EN, NEMA, IDTA) sont citées à titre informatif. Les normes elles-mêmes restent la propriété de leurs organismes éditeurs respectifs.

<div align="center">

**⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile sur GitHub !**

*Réalisé avec passion à l'ENSAM Meknès — Industrie 4.0 en pratique*

</div>
