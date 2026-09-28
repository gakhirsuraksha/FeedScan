# ESP32 Sensor Payload Specification

## Overview
This document specifies the communication contract between the ESP32 hardware firmware and the web client for the FeedScan Feed and Silage Quality Testing System.

The ESP32 interfaces with:
- **AS7341**: 10-channel spectral sensor via I2C (Channels F1-F8, Clear, NIR)
- **Capacitive Moisture Sensor**: Analog / ADC reading calibrated to 0–100%
- **pH Probe**: Analog electrode with signal conditioning amplifier (Silage testing)
- **DS18B20**: 1-Wire digital temperature sensor (°C)
- **OV2640**: Optional camera module for sample visual inspection

---

## 1. JSON Payload Schema

When streaming over WebSocket (`ws://<esp32-ip>/ws`) or via HTTP polling (`GET /reading`), the ESP32 delivers JSON formatted according to the following schema:

```json
{
  "device_id": "ESP32-FEEDSCAN-001",
  "firmware": "1.0.0",
  "timestamp_ms": 1700000000000,
  "spectral": {
    "f1_415nm": 800,
    "f2_445nm": 950,
    "f3_480nm": 1100,
    "f4_515nm": 1350,
    "f5_555nm": 1600,
    "f6_590nm": 1450,
    "f7_630nm": 1200,
    "f8_680nm": 1000,
    "clear": 4200,
    "nir": 2800
  },
  "moisture_pct": 12.5,
  "temperature_c": 25.3,
  "ph": 4.10,
  "battery_pct": 85,
  "signal_quality": "GOOD"
}
```

### Field Definitions

| Field | Type | Description |
|---|---|---|
| `device_id` | string | Unique hardware identifier |
| `firmware` | string | Firmware semantic version |
| `timestamp_ms` | integer | Unix timestamp in milliseconds |
| `spectral.f1_415nm` | integer | 415nm Violet raw count (0–65535) |
| `spectral.f2_445nm` | integer | 445nm Dark Blue raw count (0–65535) |
| `spectral.f3_480nm` | integer | 480nm Light Blue raw count (0–65535) |
| `spectral.f4_515nm` | integer | 515nm Cyan / Green raw count (0–65535) |
| `spectral.f5_555nm` | integer | 555nm Light Green raw count (0–65535) |
| `spectral.f6_590nm` | integer | 590nm Amber raw count (0–65535) |
| `spectral.f7_630nm` | integer | 630nm Orange / Red raw count (0–65535) |
| `spectral.f8_680nm` | integer | 680nm Dark Red raw count (0–65535) |
| `spectral.clear` | integer | Clear broadband channel |
| `spectral.nir` | integer | Near-infrared broadband channel |
| `moisture_pct` | float | Calibrated moisture percentage (0.0 – 100.0%) |
| `temperature_c` | float | Ambient/sample temperature in Celsius |
| `ph` | float (optional) | pH reading for silage testing (typically 3.00 – 9.00) |
| `battery_pct` | integer | Battery percentage (0 – 100%) |
| `signal_quality` | string | `"GOOD"`, `"FAIR"`, or `"POOR"` |

---

## 2. TypeScript Data Mapping

The web application's `DataSource` abstraction transforms `Esp32Payload` into the normalized `SensorReading` interface:

```typescript
import type { SensorReading } from '../types';

export interface Esp32Payload {
  device_id: string;
  firmware: string;
  timestamp_ms: number;
  spectral: {
    f1_415nm: number;
    f2_445nm: number;
    f3_480nm: number;
    f4_515nm: number;
    f5_555nm: number;
    f6_590nm: number;
    f7_630nm: number;
    f8_680nm: number;
    clear: number;
    nir: number;
  };
  moisture_pct: number;
  temperature_c: number;
  ph?: number;
  battery_pct: number;
  signal_quality: 'GOOD' | 'FAIR' | 'POOR';
}

export function mapPayloadToReading(p: Esp32Payload): SensorReading {
  return {
    ...p.spectral,
    moisture_pct: p.moisture_pct,
    temperature_c: p.temperature_c,
    ph: p.ph,
    timestamp: p.timestamp_ms,
  };
}
```

---

## 3. Bluetooth Low Energy (BLE) Profile

- **Service UUID**: `12345678-1234-1234-1234-123456789abc`
- **Reading Characteristic UUID**: `87654321-4321-4321-4321-cba987654321` (Properties: `Notify`, `Read`)
- **Control Characteristic UUID**: `87654321-4321-4321-4321-cba987654322` (Properties: `Write`)
- **Notification Rate**: 800 ms interval when test is active
- **MTU Size**: Request MTU >= 512 bytes on connection. If MTU is restricted, binary packed format is used.

---

## 4. Wi-Fi Configuration

- **AP Mode**:
  - SSID: `FeedScan-XXXX`
  - Default IP: `192.168.4.1`
  - WebSocket: `ws://192.168.4.1/ws`
  - REST Polling: `GET http://192.168.4.1/reading`
- **Station Mode**: Connects to the local farm Wi-Fi router, reports IP via mDNS (`feedscan.local`).
