# FeedScan: Rapid Feed & Silage Quality Testing System

FeedScan is an agricultural decision-support web application designed for dairy farmers, field extension officers, and feed managers to rapidly evaluate cattle feed and silage quality right on the farm.

The system is designed to connect to a portable sensor unit (ESP32 with an AS7341 10-channel spectral sensor, capacitive moisture probe, silage pH electrode, temperature probe, and camera module) to deliver traffic-light feedback and feeding recommendations.

> **Operational Note**: The application operates in **simulation mode** by default until the physical ESP32 hardware unit is connected via Bluetooth Low Energy (BLE) or local Wi-Fi. All predicted nutrient parameters (Moisture, Crude Protein, Crude Fiber, pH) are labeled **Estimated**. This system is intended for rapid screening and decision support, not as a replacement for certified laboratory testing.

---

## What the App Does

- **Rapid Screening**: Streams readings live during a short test run.
- **Multispectral & Sensor Fusion**: Analyzes 10 visible and near-infrared optical channels (415nm–680nm, Clear, NIR) along with moisture %, temperature °C, and silage pH.
- **High-Impact Status**: Delivers an immediate **GOOD**, **CHECK**, or **ACTION REQUIRED** status card with plain-language diagnostic reasons.
- **Actionable Guidance**: Provides immediate feeding recommendations (e.g., safe feeding, aeration needed, or batch quarantine).
- **Adulteration & Toxin Flagging**: Flags spectral anomalies indicating possible adulteration or deterioration, with clear prompts to confirm critical findings at an accredited laboratory.
- **Offline Capable**: Runs completely in the browser; tests can be saved locally to IndexedDB and printed directly.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Setup & Run
```bash
# Navigate to the project directory
cd feedscan

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## Hardware Integration Architecture

Sensor data is handled through a decoupled `DataSource` interface:
```
[ Hardware Layer: ESP32 ]
  ├── AS7341 Spectral (I2C)
  ├── Capacitive Moisture Probe
  ├── pH Electrode (Silage)
  ├── DS18B20 Temp Probe
  └── OV2640 Camera
           │
           ▼ (BLE GATT or Wi-Fi WebSocket)
[ DataSource Abstraction ]
  ├── SimulatedSource (Default: Simulation Engine)
  ├── BLESource (Web Bluetooth API)
  └── WiFiSource (WebSocket / HTTP stream)
           │
           ▼
[ Quality Model Engine ] ──► [ FeedScan Farmer UI ]
```

For the ESP32 communication schema and payload format, see [`docs/esp32-payload.md`](./docs/esp32-payload.md).

---

## Machine Learning

A Random Forest classifier runs in the browser to label samples GOOD / CHECK / ACTION REQUIRED, with rule-based safety checks. It is currently trained on synthetic bootstrap data to validate the pipeline and will be retrained on laboratory-referenced samples. See [`docs/ml-training.md`](./docs/ml-training.md). Retrain with `python ml/train_model.py`.

---

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Agricultural green & earth palette)
- **Visualizations**: Recharts (10-channel AS7341 spectral curves)
- **Local Storage**: Dexie (IndexedDB)
- **Icons**: Lucide React
